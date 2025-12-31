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
    total?: string;
    totalMultiplier?: number;
    unknownName?: string;
}

export type DataSource = 'auto' | 'statistics' | 'history';

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
    timeUnit?: 'continuous' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year' | 'ordinal';
    minY?: number;
    maxY?: number;
}

export type Series = PieSeries | CartesianSeries;

export type Hass = {
    callApi(arg0: string, url: string): unknown;
    callWS(opts: {
        type: string;
        start_time: string;
        end_time: string;
        statistic_ids: string[];
        period: string;
    }): object;
    states: { [key: string]: HassEntity };
};

export type HassEntity = {
    state: unknown;
    name: string;
    attributes?: {
        friendly_name?: string;
        unit_of_measurement?: string;
    };
};

export type Context = {
    config?: Config;
    elements?: { rootDiv: HTMLElement; containerDiv: HTMLElement };
    entities: Map<string, HassEntity>;
    lastUpdateData: number;
};
