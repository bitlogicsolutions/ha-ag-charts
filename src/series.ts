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
    const {
        config: { series = [], legend, yAxis, theme = 'ag-default-dark', title, minHeight } = {},
    } = context;
    let optionalConfig: Pick<
        AgCartesianChartOptions,
        'axes' | 'zoom' | 'legend' | 'minHeight' | 'title'
    > = {};
    const cartesianSeries = series.filter((s): s is CartesianSeries => s.type != 'pie');
    const timeUnits = new Set<NonNullable<CartesianSeries['timeUnit']>>();

    // Build unit -> axis key mapping and collect axis configs
    const unitToAxisKey = new Map<string, string>();
    const axisConfigs: { key: string; config: any }[] = [];
    let axisIndex = 0;

    for (const { entities = [], minY, maxY, timeUnit } of cartesianSeries) {
        timeUnits.add(timeUnit ?? 'continuous');
        for (const config of entities) {
            const entity = readEntityConfig(hass, config);
            const unit = entity.yUnits ?? unitOfMeasurement(hass, entity);
            if (!unitToAxisKey.has(unit)) {
                const axisKey = axisIndex === 0 ? 'y' : `y${axisIndex + 1}`;
                unitToAxisKey.set(unit, axisKey);
                axisConfigs.push({
                    key: axisKey,
                    config: {
                        type: 'number',
                        position: 'left',
                        min: typeof minY === 'number' ? minY : undefined,
                        max: typeof maxY === 'number' ? maxY : undefined,
                        nice: typeof minY !== 'number' && typeof maxY !== 'number',
                        label: { format: `#{0>1.1f}${unit}` },
                    },
                });
                axisIndex++;
            }
        }
    }

    if (cartesianSeries.length > 0) {
        optionalConfig.zoom = {};

        // Build axes dictionary
        const axes: Record<string, any> = {};

        // Add y-axes
        const hideYAxis = yAxis === 'hidden';
        for (const { key, config } of axisConfigs) {
            axes[key] = hideYAxis
                ? { ...config, label: { enabled: false }, line: { enabled: false } }
                : config;
        }

        // Add x-axis (time)
        const timeUnit = timeUnits.values().next().value ?? 'day';
        if (timeUnits.size > 1) {
            console.warn('AG Charts Card: Multiple time units not supported');
        }
        if (timeUnit === 'ordinal') {
            axes.x = { type: 'ordinal-time', position: 'bottom' };
        } else {
            // Let AG Charts auto-calculate tick intervals to avoid label overlap
            // nice: false prevents padding the domain beyond the data range
            axes.x = { type: 'time', position: 'bottom', nice: false };
        }

        optionalConfig.axes = axes;
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
        theme: generateTheme(theme, context.config?.tooltip ?? 'shared'),
        series: generateSeriesOpts(context, hass, unitToAxisKey) as any[],
        minWidth: 0,
        ...optionalConfig,
    };
    return options;
}

function generateSeriesOpts(
    context: Context,
    hass: Hass,
    unitToAxisKey: Map<string, string>
) {
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
        const { type, entities = [], stacked, legendItemName } = series;
        switch (type) {
            case 'line':
            case 'bar':
            case 'area':
                for (const entityConfig of entities) {
                    const entity = readEntityConfig(hass, entityConfig);
                    const unit = entity.yUnits ?? unitOfMeasurement(hass, entity);
                    const axisKey = unitToAxisKey.get(unit);
                    const optional: any = {};
                    if (entity.fill) optional.fill = entity.fill;
                    if (entity.stroke) optional.stroke = entity.stroke;
                    if (legendItemName) optional.legendItemName = legendItemName;
                    // Only specify yKeyAxis if there are multiple y-axes
                    if (unitToAxisKey.size > 1 && axisKey) {
                        optional.yKeyAxis = axisKey;
                    }
                    seriesOpts.push({
                        type,
                        xKey: 'key',
                        yKey: key(entity),
                        yName: entity.name,
                        stacked,
                        listeners: {
                            seriesNodeClick: () => performAction(entity, context.elements?.rootDiv!),
                        },
                        ...optional,
                    } satisfies AgBarSeriesOptions | AgLineSeriesOptions | AgAreaSeriesOptions);
                }
                break;

            default:
                throw new Error('type not recognised: ' + type);
        }
    }

    for (const { type, calloutLabel = 'name', sectorLabel = 'value' } of pieSeries) {
        const calloutOpts: Pick<AgPieSeriesOptions, 'calloutLabelKey' | 'calloutLabel'> = {};
        if (calloutLabel === 'name') {
            calloutOpts.calloutLabelKey = 'name';
        } else if (calloutLabel === 'value') {
            calloutOpts.calloutLabelKey = 'value';
            calloutOpts.calloutLabel = {
                formatter: ({ datum: { value, entity, config } }) => {
                    return formatValue(value, entity, config);
                },
            };
        }

        const sectorOpts: Pick<AgPieSeriesOptions, 'sectorLabelKey' | 'sectorLabel'> = {};
        if (sectorLabel === 'name') {
            sectorOpts.sectorLabelKey = 'name';
        } else if (sectorLabel === 'value') {
            sectorOpts.sectorLabelKey = 'value';
            sectorOpts.sectorLabel = {
                formatter: ({ datum: { value, entity, config } }) => {
                    return formatValue(value, entity, config);
                },
            };
        } else if (sectorLabel === 'both') {
            sectorOpts.sectorLabelKey = 'value';
            sectorOpts.sectorLabel = {
                formatter: ({ datum: { value, entity, config } }) => {
                    return `${config?.name}\n${formatValue(value, entity, config)}`;
                },
            };
        }

        switch (type) {
            case 'pie':
                seriesOpts.push({
                    type: 'pie',
                    angleKey: 'value',
                    ...calloutOpts,
                    ...sectorOpts,
                    tooltip: {
                        renderer: ({ datum: { name, value, entity, config } }) =>
                            formatPieTooltip(name, value, entity, config),
                    },
                    listeners: {
                        seriesNodeClick: ({ datum }) =>
                            performAction(datum.config, context.elements?.rootDiv!),
                    },
                });
                break;
        }
    }

    return seriesOpts;
}

function generateTheme(baseTheme: AgChartThemeName, tooltipMode: 'shared' | 'exact' = 'shared') {
    return {
        baseTheme,
        overrides: {
            common: {
                animation: { enabled: false },
                background: { visible: false },
                tooltip: { mode: tooltipMode as const },
                zoom: { buttons: { visible: 'zoomed' as const } },
            },
            line: { series: { marker: { enabled: false } } },
        },
    };
}
