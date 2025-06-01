import {
    AgAreaSeriesOptions,
    AgBarSeriesOptions,
    AgCartesianChartOptions,
    AgChartOptions,
    AgChartThemeName,
    AgLineSeriesOptions,
    AgPieSeriesOptions,
    time,
} from 'ag-charts-enterprise';
import { CartesianSeries, Context, Hass, PieSeries } from './types';
import { readEntityConfig, unitOfMeasurement, key, formatPieTooltip, formatValue } from './utils';
import { performAction } from './actions';

export function buildSeriesConfig(context: Context, hass: Hass) {
    const { config: { series = [], legend, theme = 'ag-default-dark', title, minHeight } = {} } =
        context;
    let optionalConfig: Pick<
        AgCartesianChartOptions,
        'axes' | 'zoom' | 'legend' | 'minHeight' | 'title'
    > = {};
    const cartesianSeries = series.filter((s): s is CartesianSeries => s.type != 'pie');
    const units = new Map();
    const timeUnits = new Set<NonNullable<CartesianSeries['timeUnit']>>();
    for (const { entities = [], minY, maxY, timeUnit } of cartesianSeries) {
        timeUnits.add(timeUnit ?? 'continuous');
        for (const config of entities) {
            const entity = readEntityConfig(hass, config);
            const unit = entity.yUnits ?? unitOfMeasurement(hass, entity);
            if (units.has(unit)) {
                units.get(unit).push(key(entity));
            } else {
                units.set(unit, [key(entity)]);
            }
        }

        for (const [unit, keys] of units.entries()) {
            optionalConfig.axes ??= [];
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
        optionalConfig.axes ??= [];

        const unit = timeUnits.values().next().value ?? 'day';
        if (timeUnits.size > 1) {
            console.warn('AG Charts Card: Multiple time units not supported');
        }
        if (unit === 'continuous') {
            optionalConfig.axes.push({ type: 'time', position: 'bottom' });
        } else if (unit === 'ordinal') {
            optionalConfig.axes.push({ type: 'ordinal-time', position: 'bottom' });
        } else if (unit === 'week') {
            optionalConfig.axes.push({ type: 'time', position: 'bottom', unit: time.monday });
        } else {
            optionalConfig.axes?.push({
                type: 'time',
                position: 'bottom',
                unit,
            });
        }
    }

    if (legend === 'none') {
        optionalConfig.legend = { enabled: false };
    } else if (legend != null) {
        optionalConfig.legend = { position: legend };
    }

    if (minHeight) {
        optionalConfig.minHeight = minHeight;
    }

    if (title) {
        optionalConfig.title = { text: title };
    }

    const options: AgChartOptions = {
        container: context.elements?.containerDiv,
        theme: generateTheme(theme),
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
                        formatter: ({ datum: { value, entity, config } }) =>
                            formatValue(value, entity, config),
                    },
                    tooltip: {
                        renderer: ({ datum: { name, value, entity, config } }) =>
                            formatPieTooltip(name, value, entity, config),
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
                zoom: { buttons: { visible: 'zoomed' as const } },
            },
            line: { series: { marker: { enabled: false } } },
        },
    };
}
