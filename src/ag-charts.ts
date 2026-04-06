import { AgChartInstance, AgCharts } from 'ag-charts-enterprise';
import { ModuleRegistry } from 'ag-charts-community';
import {
    LineSeriesModule,
    BarSeriesModule,
    AreaSeriesModule,
    PieSeriesModule,
    NumberAxisModule,
    TimeAxisModule,
    LegendModule,
    CategoryAxisModule,
} from 'ag-charts-community';
import { ZoomModule, OrdinalTimeAxisModule } from 'ag-charts-enterprise';
import { Config, Hass, HassEntity } from './types';
import { setupDOM } from './dom';
import { buildSeriesConfig, buildCrossLinesDelta } from './series';
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
    LegendModule,
    CategoryAxisModule,
    OrdinalTimeAxisModule,
]);

console.info(
    `%cAG CHARTS HASS INTEGRATION\n%cVersion: 0.7.0`,
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
    private nowTimerId?: ReturnType<typeof setTimeout>;

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
            this.startCrosslineTimer();
        }

        this.updateData(hass);
    }

    disconnectedCallback(): void {
        this.stopCrosslineTimer();
    }

    private hasDynamicCrosslines(): boolean {
        return (this.config?.crosslines ?? []).some(
            c => c.dateValue === 'now' || c.dateRange?.includes('now')
        );
    }

    private startCrosslineTimer(): void {
        this.stopCrosslineTimer();
        if (!this.hasDynamicCrosslines()) return;

        const MS_30_MIN = 30 * 60 * 1000;
        const now = Date.now();
        const nextTick = Math.ceil(now / MS_30_MIN) * MS_30_MIN;
        const initialDelay = nextTick - now;

        this.nowTimerId = setTimeout(() => {
            this.refreshCrosslines();
            this.nowTimerId = setInterval(() => this.refreshCrosslines(), MS_30_MIN) as any;
        }, initialDelay);
    }

    private stopCrosslineTimer(): void {
        if (this.nowTimerId != null) {
            clearTimeout(this.nowTimerId);
            clearInterval(this.nowTimerId);
            this.nowTimerId = undefined;
        }
    }

    private refreshCrosslines(): void {
        const delta = buildCrossLinesDelta(this);
        if (delta) {
            this.chartInstance?.updateDelta({ axes: delta });
        }
    }

    async updateData(hass: Hass) {
        const data = await updateData(this, hass);
        if (!data) return;

        await this.chartInstance?.updateDelta({
            data,
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
