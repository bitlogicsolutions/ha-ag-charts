import { AgChartInstance, AgCharts } from 'ag-charts-enterprise';
import { ModuleRegistry } from 'ag-charts-community';
import {
    LineSeriesModule,
    BarSeriesModule,
    AreaSeriesModule,
    PieSeriesModule,
    NumberAxisModule,
    TimeAxisModule,
} from 'ag-charts-community';
import { ZoomModule } from 'ag-charts-enterprise';
import { Config, Hass, HassEntity } from './types';
import { setupDOM } from './dom';
import { buildSeriesConfig } from './series';
import { updateData } from './data';
import './ha-ag-charts-editor';

ModuleRegistry.registerModules([
    LineSeriesModule,
    BarSeriesModule,
    AreaSeriesModule,
    PieSeriesModule,
    NumberAxisModule,
    TimeAxisModule,
    ZoomModule,
]);

console.info(
    `%cAG CHARTS HASS INTEGRATION\n%cVersion: 0.2.0-beta.1`,
    'color: white; background: blue; font-weight: bold;',
    'color: blue; background: white; font-weight: bold;',
    ''
);

class HAAgCharts extends HTMLElement {
    private chartInstance?: AgChartInstance;
    elements?: { rootDiv: HTMLElement; containerDiv: HTMLElement };
    config?: Config;
    entities: Map<string, HassEntity> = new Map();
    lastUpdateData = -Infinity;

    private phase: 'init' | 'ready' = 'init';

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static getConfigElement() {
        return document.createElement('ha-ag-charts-editor');
    }

    static getStubConfig(hass: Hass) {
        return {
            title: 'AG Charts',
            theme: 'ag-default-dark',
            series: [
                {
                    type: 'line',
                    entities: [
                        {
                            entity: Object.keys(hass.states)[0],
                        },
                    ],
                },
            ],
        };
    }

    setConfig(config: Config) {
        if (!config.entities && !config.series) {
            throw new Error('You need to define entities and/or series');
        }
        this.config = config;

        if (!this.elements) {
            this.elements = setupDOM(this);
        }
    }

    set hass(hass: Hass) {
        if (this.phase === 'init') {
            this.chartInstance = AgCharts.create(buildSeriesConfig(this, hass));
            this.phase = 'ready';
        }

        this.updateData(hass);
    }

    async updateData(hass: Hass) {
        await this.chartInstance?.updateDelta({
            data: await updateData(this, hass),
        });
    }

    getCardSize() {
        return 3;
    }
}

customElements.define('ha-ag-charts', HAAgCharts);

(window as any).customCards = (window as any).customCards || [];
(window as any).customCards.push({
    type: 'ha-ag-charts',
    name: 'AG Charts',
    description: 'Display data using AG Charts',
    preview: true,
    documentationURL: 'https://github.com/bitlogicsolutions/ha-ag-charts',
});
