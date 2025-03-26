import { CartesianSeries, ConfigEntity, Entity, Hass, HassEntity } from "./types";

export function appendUnknownValue(
  totalValue: number,
  data: { value: number; entity?: Partial<HassEntity> }[],
  unknownName: string
) {
  const unknownValue = Math.max(
    totalValue - data.reduce((r, d) => (isNaN(d.value) ? r : r + d.value), 0),
    0
  );
  if (unknownValue > 0) {
    data.push(
      syntheticDatum(
        unknownName,
        unknownValue,
        data[0].entity?.attributes?.unit_of_measurement
      )
    );
  }
}

export function formatValue(value: number, entity: HassEntity, config?: Entity) {
  if (typeof config === 'object' && config?.yUnits) {
    return `${value}${config?.yUnits}`;
  }
  const { unit_of_measurement: unit = "" } = entity?.attributes ?? {};

  value = Math.round(value);

  return `${value}${unit}`;
}

export function formatPieTooltip(
  name: string,
  value: number,
  entity: HassEntity
) {
  return { title: name, content: formatValue(value, entity) };
}

const TIME_FORMAT = Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
export function formatCartesianTooltip(
  name: string,
  key: Date,
  value: number,
  entity: HassEntity,
  config: ConfigEntity,
) {
  return {
    title: `${name}: ${TIME_FORMAT.format(key)}`,
    content: formatValue(value, entity, config),
  };
}

export function syntheticDatum(name: string, value: number, uom?: string) {
  return {
    name: name,
    value: value,
    entity: {
      attributes: {
        unit_of_measurement: uom,
      },
    } satisfies Partial<HassEntity>,
  };
}

export function readEntityConfig(
  hass: Hass,
  configEntity: Entity
): ConfigEntity {
  if (typeof configEntity === "string") {
    return {
      entity: configEntity,
      name:
        hass?.states[configEntity]?.attributes?.friendly_name ?? configEntity,
      action: "more-info",
      offsetXs: 0,
      yMultiplier: 1,
    };
  }

  const { entity, name, action, offsetXs = 0, yMultiplier = 1, ...config } = configEntity;
  return {
    name: name ?? hass?.states[entity]?.attributes?.friendly_name ?? entity,
    action: action ?? "more-info",
    entity,
    offsetXs,
    yMultiplier,
    ...config,
  };
}

export function key({ entity }: ConfigEntity) {
  return entity?.replace(/\./, "__");
}

export function unitOfMeasurement(hass: Hass, { entity }: ConfigEntity) {
  return hass?.states[entity]?.attributes?.unit_of_measurement ?? "?";
}
