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
    const match = interval.match(/^(\d+)?(\w+)$/);
    if (!match) return 300_000; // Default 5 minutes
    const count = match[1] ? parseInt(match[1]) : 1;
    const unit = match[2];
    switch (unit) {
        case 'minute':
            return count * 60_000;
        case 'hour':
            return count * 3600_000;
        case 'day':
            return count * 86400_000;
        case 'week':
            return count * 604800_000;
        case 'month':
            return count * 2592000_000; // 30 days
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
        .filter(s => !isNaN(Number(s.state)))
        .map(s => ({
            time: new Date(s.last_changed).getTime(),
            value: Number(s.state),
        }))
        .sort((a, b) => a.time - b.time);

    if (historyPoints.length === 0) {
        return undefined;
    }

    // Forward-fill to regular intervals
    const intervalMs = intervalToMs(interval);
    const startMs = start.getTime();
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

    return dataPoints;
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
