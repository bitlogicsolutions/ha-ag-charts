import { DataSource, Hass, HistoryState } from './types';

export type Statistics = {
    start: string;
    end: string;
    min: number;
    mean: number;
    max: number;
    state: number;
};

export type DataPoint = {
    start: string;
    mean: number;
    state: number;
};

async function fetchRecent(
    hass: Hass,
    entityId: string,
    start: Date,
    end: Date
): Promise<DataPoint[] | undefined> {
    let url = 'history/period';
    if (start) url += `/${start.toISOString()}`;
    url += `?filter_entity_id=${entityId}`;
    if (end) url += `&end_time=${end.toISOString()}`;
    url += '&skip_initial_state&significant_changes_only=0';

    const result = (await hass.callApi('GET', url)) as HistoryState[][];

    if (!result || result.length === 0 || result[0].length === 0) {
        return undefined;
    }

    // Transform history states to statistics-compatible format
    return result[0]
        .filter(s => !isNaN(Number(s.state)))
        .map(s => ({
            start: s.last_changed,
            mean: Number(s.state),
            state: Number(s.state),
        }));
}

export async function fetchStatistics(
    hass: Hass,
    entityId: string,
    start: Date,
    end: Date,
    period = '5minute'
): Promise<Statistics[] | undefined> {
    const statistics = (await hass.callWS({
        type: 'recorder/statistics_during_period',
        start_time: start?.toISOString(),
        end_time: end?.toISOString(),
        statistic_ids: [entityId],
        period,
    })) as Record<string, Statistics[]>;
    if (statistics && entityId in statistics) {
        return statistics[entityId];
    }
    return undefined;
}

export async function fetchEntityData(
    hass: Hass,
    entityId: string,
    start: Date,
    end: Date,
    interval: string,
    dataSource: DataSource = 'auto'
): Promise<DataPoint[] | undefined> {
    // If explicitly set to history, skip statistics
    if (dataSource === 'history') {
        return fetchRecent(hass, entityId, start, end);
    }

    // Try statistics first
    const stats = await fetchStatistics(hass, entityId, start, end, interval);
    if (stats && stats.length > 0) {
        return stats;
    }

    // Fallback to history if auto mode and no statistics available
    if (dataSource === 'auto') {
        return fetchRecent(hass, entityId, start, end);
    }

    return undefined;
}
