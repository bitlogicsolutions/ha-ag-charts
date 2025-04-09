import { Hass } from "./types";

export type Statistics = {
  start: string;
  end: string;
  min: number;
  mean: number;
  max: number;
  state: number;
};

export async function fetchRecent(
  hass: Hass,
  entityId: string,
  start: Date,
  end: Date,
  skipInitialState: boolean
) {
  let url = "history/period";
  if (start) url += `/${start.toISOString()}`;
  url += `?filter_entity_id=${entityId}`;
  if (end) url += `&end_time=${end.toISOString()}`;
  if (skipInitialState) url += "&skip_initial_state";
  url += "&significant_changes_only=0";
  return hass.callApi("GET", url);
}

export async function fetchStatistics(
  hass: Hass,
  entityId: string,
  start: Date,
  end: Date,
  period = "5minute"
): Promise<Statistics[] | undefined> {
  const statistics = (await hass.callWS({
    type: "recorder/statistics_during_period",
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
