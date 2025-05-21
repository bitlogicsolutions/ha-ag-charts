import { ConfigEntity } from './types';

export function performAction(entity: ConfigEntity, element: HTMLElement) {
    switch (entity.action ?? 'more-info') {
        case 'more-info':
            actionInfo(entity, element);
            break;
        case 'navigate':
            actionNavigate(entity);
            break;
        default:
            throw new Error(`Unknown action '${entity.action}'`);
    }
}

export function actionNavigate(entity: ConfigEntity) {
    history.pushState(null, '', entity.path);

    window.dispatchEvent(
        new Event('location-changed', {
            bubbles: true,
            cancelable: true,
            composed: true,
        })
    );
}

export function actionInfo(entity: ConfigEntity, element: HTMLElement) {
    const event = new Event('hass-more-info', {
        bubbles: true,
        cancelable: true,
        composed: true,
    });
    (event as any).detail = { entityId: entity.entity };

    element.dispatchEvent(event);
}

// case "url":
//   if (actionConfig.url_path) {
//     window.open(actionConfig.url_path);
//   }
//   break;
// case "toggle":
//   if (config.entity) {
// const stateDomain = computeDomain(config.entity);
// const serviceDomain = stateDomain === "group" ? "homeassistant" : stateDomain;

// let service;
// switch (stateDomain) {
//   case "lock":
//     service = turnOn ? "unlock" : "lock";
//     break;
//   case "cover":
//     service = turnOn ? "open_cover" : "close_cover";
//     break;
//   default:
//     service = turnOn ? "turn_on" : "turn_off";
// }

// return hass.callService(serviceDomain, service, { entity_id: entityId });
//   }
//   break;
// case "call-service": {
//   if (!actionConfig.service) {
//     forwardHaptic("failure");
//     return;
//   }
//   const [domain, service] = actionConfig.service.split(".", 2);
//   hass.callService(domain, service, actionConfig.service_data, actionConfig.target);
//   forwardHaptic("success");
//   break;
// }
