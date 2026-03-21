import { fetchAttributeData, fetchEntityData } from './stats';
import { CartesianSeries, ConfigEntity, Context, Hass } from './types';
import { appendUnknownValue, key, readEntityConfig } from './utils';

export async function updateData(context: Context, hass: Hass) {
    const {
        config: {
            interval = '5minute',
            period = 1,
            entities = [],
            total,
            totalMultiplier = 1,
            unknownName = 'Unknown',
            series = [],
            refresh = 5,
        } = {},
    } = context;

    const timeSinceLastUpdate = Date.now() - context.lastUpdateData;
    if (timeSinceLastUpdate < refresh * 1_000) {
        return;
    }
    context.lastUpdateData = Date.now();

    const data: any[] = [];
    if (entities?.length > 0) {
        data.push(
            ...entities.map(c => {
                const e = readEntityConfig(hass, c);
                return {
                    name: e.name,
                    value: Number(hass.states[e.entity]?.state ?? 0) * (e.yMultiplier ?? 1),
                    entity: hass.states[e.entity],
                    config: e,
                };
            })
        );

        if (total) {
            const totalValue = Number(hass.states[total]?.state ?? 0) * totalMultiplier;
            appendUnknownValue(totalValue, data, unknownName);
        }
    }

    const dataMap = new Map();
    const cartesianSeries = series.filter((s): s is CartesianSeries => s.type !== 'pie');
    for (const { entities } of cartesianSeries ?? []) {
        for (const config of entities ?? []) {
            const entity = readEntityConfig(hass, config);
            const entityConfig = typeof config === 'object' ? (config as ConfigEntity) : undefined;
            let stats;
            if (entityConfig?.dataSource === 'attribute') {
                stats = fetchAttributeData(
                    hass,
                    entity.entity,
                    entityConfig.attribute ?? 'rates',
                    entityConfig.attributeField ?? 'value_inc_vat',
                    entityConfig.attributeTimestampField ?? 'start'
                );
            } else {
                stats = await fetchEntityData(
                    hass,
                    entity.entity,
                    new Date(Date.now() - period * 24 * 3600_000),
                    new Date(),
                    entityConfig?.interval || interval,
                    entityConfig?.dataSource ?? 'auto',
                    entityConfig?.aggregation || 'mean'
                );
            }

            for (const { start, mean, state } of stats ?? []) {
                let x = start + (entity.offsetXs ?? 0) * 1_000;
                let dataEntry = dataMap.get(x);
                if (dataEntry == null) {
                    dataEntry = { key: x };
                    data.push(dataEntry);
                    dataMap.set(x, dataEntry);
                }

                dataEntry[key(entity)] = (mean ?? state) * (entity.yMultiplier ?? 1);
            }

            context.entities.set(key(entity), hass.states[entity.entity]);
        }
    }

    data.sort((a, b) => a.key - b.key);
    return data;
}
