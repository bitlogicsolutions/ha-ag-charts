import {
    AgAreaSeriesOptions,
    AgBarSeriesOptions,
    AgCartesianChartOptions,
    AgChartOptions,
    AgChartThemeName,
    AgLineSeriesOptions,
    AgPieSeriesOptions,
} from 'ag-charts-enterprise';
import { CartesianSeries, Context, Hass, PieSeries } from './types';
import { readEntityConfig, unitOfMeasurement, key, formatPieTooltip, formatValue } from './utils';
import { performAction } from './actions';

export function buildSeriesConfig(context: Context, hass: Hass) {
    const { config: { series = [], legend, theme = 'ag-default-dark', title } = {} } = context;
    let optionalConfig: Pick<AgCartesianChartOptions, 'axes' | 'zoom' | 'legend'> = {};
    const cartesianSeries = series.filter((s): s is CartesianSeries => s.type != 'pie');
    const units = new Map();
    for (const { entities = [], minY, maxY } of cartesianSeries) {
        for (const config of entities) {
            const entity = readEntityConfig(hass, config);
            const unit = entity.yUnits ?? unitOfMeasurement(hass, entity);
            if (units.has(unit)) {
                units.get(unit).push(key(entity));
            } else {
                units.set(unit, [key(entity)]);
            }
        }

        optionalConfig.axes = [{ type: 'ordinal-time', position: 'bottom' }];
        for (const [unit, keys] of units.entries()) {
            optionalConfig.axes.push({
                type: 'number',
                position: 'left',
                min: typeof minY === 'number' ? minY : undefined,
                max: typeof maxY === 'number' ? maxY : undefined,
                nice: typeof minY !== 'number' && typeof maxY !== 'number',
                keys,
                label: { format: `#{0>1.1f}${unit}` },
            });
        }
    }

    if (cartesianSeries.length > 0) {
        optionalConfig.zoom = {};
    }

    if (legend === 'none') {
        optionalConfig.legend = { enabled: false };
    } else if (legend != null) {
        optionalConfig.legend = { position: legend };
    }

    const options: AgChartOptions = {
        container: context.elements?.containerDiv,
        theme: generateTheme(theme),
        title: { text: title },
        series: generateSeriesOpts(context, hass) as any[],
        minWidth: 0,
        ...optionalConfig,
    };
    return options;
}

function generateSeriesOpts(context: Context, hass: Hass) {
    const { series = [] } = context.config ?? {};

    const seriesOpts: (
        | AgBarSeriesOptions
        | AgLineSeriesOptions
        | AgAreaSeriesOptions
        | AgPieSeriesOptions
    )[] = [];
    const cartesianSeries = series.filter((s): s is CartesianSeries => s.type !== 'pie');
    const pieSeries = series.filter((s): s is PieSeries => s.type === 'pie');
    for (const series of cartesianSeries) {
        const { type, entities = [], stacked } = series;
        switch (type) {
            case 'line':
            case 'bar':
            case 'area':
                for (const entityConfig of entities) {
                    const entity = readEntityConfig(hass, entityConfig);
                    const optional: any = {};
                    if (entity.fill) optional.fill = entity.fill;
                    if (entity.stroke) optional.stroke = entity.stroke;
                    seriesOpts.push({
                        type,
                        xKey: 'key',
                        yKey: key(entity),
                        yName: entity.name,
                        stacked,
                        listeners: {
                            nodeClick: () => performAction(entity, context.elements?.rootDiv!),
                        },
                        ...optional,
                    } satisfies AgBarSeriesOptions | AgLineSeriesOptions | AgAreaSeriesOptions);
                }
                break;

            default:
                throw new Error('type not recognised: ' + type);
        }
    }

    for (const { type } of pieSeries) {
        switch (type) {
            case 'pie':
                seriesOpts.push({
                    type: 'pie',
                    calloutLabelKey: 'name',
                    angleKey: 'value',
                    sectorLabelKey: 'value',
                    sectorLabel: {
                        formatter: ({ datum: { value, entity } }) => formatValue(value, entity),
                    },
                    tooltip: {
                        renderer: ({ datum: { name, value, entity } }) =>
                            formatPieTooltip(name, value, entity),
                    },
                    listeners: {
                        nodeClick: ({ datum }) =>
                            performAction(datum.config, context.elements?.rootDiv!),
                    },
                });
                break;
        }
    }

    return seriesOpts;
}

function generateTheme(baseTheme: AgChartThemeName) {
    return {
        baseTheme,
        overrides: {
            common: {
                animation: { enabled: false },
                background: { visible: false },
                tooltip: { mode: 'shared' as const },
            },
            line: { series: { marker: { enabled: false } } },
        },
    };
}
