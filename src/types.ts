import { AgChartThemeName } from 'ag-charts-enterprise';

export interface Config {
    title: string;
    theme: AgChartThemeName;
    minHeight?: number;
    series: Series[];
    entities: Entity[];
    refresh?: number;
    interval?: '5minutes';
    period?: number;
    legend?: 'left' | 'right' | 'top' | 'bottom' | 'none';
    yAxis?: 'visible' | 'hidden';
    tooltip?: 'shared' | 'exact';
    total?: string;
    totalMultiplier?: number;
    unknownName?: string;
    crosslines?: CrossLine[];
}

export type DataSource = 'auto' | 'statistics' | 'history' | 'attribute';

export type ConfigEntity = {
    entity: string;
    name?: string;
    action?: 'more-info' | 'navigate';
    path?: string;
    offsetXs?: number;
    yMultiplier?: number;
    yUnits?: string;
    fill?: string;
    stroke?: string;
    dataSource?: DataSource;
    interval?: '5minute' | '30minute' | 'hour' | 'day';
    aggregation?: 'mean' | 'sum';
    attribute?: string;
    attributeField?: string;
    attributeTimestampField?: string;
};

export type HistoryState = {
    entity_id: string;
    state: string;
    last_changed: string;
    attributes?: Record<string, unknown>;
};

export type Entity = string | ConfigEntity;

export interface PieSeries {
    type: 'pie';
    calloutLabel?: 'name' | 'value' | 'none';
    sectorLabel?: 'name' | 'value' | 'both' | 'none';
}

export interface CartesianSeries {
    type: 'area' | 'bar' | 'line';
    entities: Entity[];
    stacked?: boolean;
    legendItemName?: string;
    timeUnit?: 'continuous' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year' | 'ordinal';
    minY?: number;
    maxY?: number;
}

export interface CrossLine {
    type: 'line' | 'range';
    axis: 'x' | 'y';
    value?: number;
    range?: [number, number];
    dateValue?: string;
    dateRange?: [string, string];
    entity?: string;
    startAttribute?: string;
    endAttribute?: string;
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    fillOpacity?: number;
    lineDash?: string;
    label?: string;
    labelPosition?:
        | 'top'
        | 'bottom'
        | 'left'
        | 'right'
        | 'topLeft'
        | 'topRight'
        | 'bottomLeft'
        | 'bottomRight'
        | 'inside'
        | 'insideLeft'
        | 'insideRight'
        | 'insideTop'
        | 'insideBottom';
}

export type Series = PieSeries | CartesianSeries;

export type Hass = {
    callApi(arg0: string, url: string): Promise<unknown>;
    callWS(opts: {
        type: string;
        start_time: string;
        end_time: string;
        statistic_ids: string[];
        period: string;
    }): Promise<object>;
    states: { [key: string]: HassEntity };
};

export type HassEntity = {
    state: unknown;
    name: string;
    attributes?: {
        friendly_name?: string;
        unit_of_measurement?: string;
        [key: string]: unknown;
    };
};

export type Context = {
    config?: Config;
    elements?: { rootDiv: HTMLElement; containerDiv: HTMLElement };
    entities: Map<string, HassEntity>;
    lastUpdateData: number;
};
