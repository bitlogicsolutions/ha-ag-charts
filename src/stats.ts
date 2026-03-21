import { DataSource, Hass, HistoryState } from './types';

export type Statistics = {
    start: string | number;
    end: string | number;
    min: number;
    mean: number;
    max: number;
    state: number;
};

export type DataPoint = {
    start: number;
    mean: number;
    state: number;
};

function intervalToMs(interval: string): number {
    // Handle HA statistics periods: '5minute', 'hour', 'day', 'week', 'month'
    switch (interval) {
        case '5minute':
            return 300_000;
        case 'hour':
            return 3600_000;
        case 'day':
            return 86400_000;
        case 'week':
            return 604800_000;
        case 'month':
            return 2592000_000; // 30 days
        default:
            return 300_000; // Default 5 minutes
    }
}

async function fetchRecent(
    hass: Hass,
    entityId: string,
    start: Date,
    end: Date,
    interval: string
): Promise<DataPoint[] | undefined> {
    try {
        let url = 'history/period';
        if (start) url += `/${start.toISOString()}`;
        url += `?filter_entity_id=${entityId}`;
        if (end) url += `&end_time=${end.toISOString()}`;
        url += '&significant_changes_only=0'; // Include initial state

        const result = (await hass.callApi('GET', url)) as HistoryState[][];

        if (!result || result.length === 0 || result[0].length === 0) {
            return undefined;
        }

        // Parse history states and filter numeric values
        const historyPoints = result[0]
            .filter(s => s.state != null && !isNaN(Number(s.state)))
            .map(s => ({
                time: new Date(s.last_changed).getTime(),
                value: Number(s.state),
            }))
            .sort((a, b) => a.time - b.time);

        if (historyPoints.length === 0) {
            return undefined;
        }

        // Forward-fill to regular intervals, aligned to interval boundaries
        const intervalMs = intervalToMs(interval);
        const startMs = Math.floor(start.getTime() / intervalMs) * intervalMs; // Align to boundary
        const endMs = end.getTime();
        const dataPoints: DataPoint[] = [];

        let historyIdx = 0;
        let currentValue = historyPoints[0].value;

        for (let bucketTime = startMs; bucketTime <= endMs; bucketTime += intervalMs) {
            // Advance to the latest history point at or before this bucket
            while (
                historyIdx < historyPoints.length &&
                historyPoints[historyIdx].time <= bucketTime
            ) {
                currentValue = historyPoints[historyIdx].value;
                historyIdx++;
            }

            dataPoints.push({
                start: bucketTime,
                mean: currentValue,
                state: currentValue,
            });
        }

        return dataPoints.length > 0 ? dataPoints : undefined;
    } catch (e) {
        console.error('[ha-ag-charts] Error fetching history:', e);
        return undefined;
    }
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

export function fetchAttributeData(
    hass: Hass,
    entityId: string,
    attribute: string,
    valueField: string,
    timestampField: string = 'start'
): DataPoint[] | undefined {
    const items = hass.states[entityId]?.attributes?.[attribute];
    if (!Array.isArray(items) || items.length === 0) {
        return undefined;
    }

    const dataPoints: DataPoint[] = [];
    for (const item of items) {
        const start = new Date(item[timestampField]).getTime();
        const value = Number(item[valueField]);
        if (isNaN(start) || isNaN(value)) continue;
        dataPoints.push({ start, mean: value, state: value });
    }

    dataPoints.sort((a, b) => a.start - b.start);
    return dataPoints.length > 0 ? dataPoints : undefined;
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
        return fetchRecent(hass, entityId, start, end, interval);
    }

    // Try statistics first
    const stats = await fetchStatistics(hass, entityId, start, end, interval);
    if (stats && stats.length > 0) {
        // Convert statistics to DataPoint format (start may be string or number from HA)
        return stats.map(s => ({
            start: typeof s.start === 'string' ? new Date(s.start).getTime() : s.start,
            mean: s.mean,
            state: s.state,
        }));
    }

    // Fallback to history if auto mode and no statistics available
    if (dataSource === 'auto') {
        return fetchRecent(hass, entityId, start, end, interval);
    }

    return undefined;
}
