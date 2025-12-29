import { LitElement, html, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Config } from './types';
import './editor/series-list-editor';

declare global {
    interface HTMLElementTagNameMap {
        'ha-ag-charts-editor': HAAgChartsEditor;
    }
}

const THEMES = [
    { value: 'ag-default', label: 'Default' },
    { value: 'ag-default-dark', label: 'Default Dark' },
    { value: 'ag-material', label: 'Material' },
    { value: 'ag-material-dark', label: 'Material Dark' },
    { value: 'ag-vivid', label: 'Vivid' },
    { value: 'ag-vivid-dark', label: 'Vivid Dark' },
];

const BASE_SCHEMA = [
    { name: 'title', selector: { text: {} } },
    {
        name: 'theme',
        selector: {
            select: {
                mode: 'dropdown',
                options: THEMES,
            },
        },
    },
    {
        type: 'grid',
        name: '',
        schema: [
            {
                name: 'period',
                selector: { number: { min: 1, max: 365, mode: 'box', unit_of_measurement: 'days' } },
            },
            {
                name: 'refresh',
                selector: { number: { min: 1, mode: 'box', unit_of_measurement: 'seconds' } },
            },
        ],
    },
    {
        type: 'grid',
        name: '',
        schema: [
            {
                name: 'legend',
                selector: {
                    select: {
                        mode: 'dropdown',
                        options: [
                            { value: '', label: 'Default' },
                            { value: 'left', label: 'Left' },
                            { value: 'right', label: 'Right' },
                            { value: 'top', label: 'Top' },
                            { value: 'bottom', label: 'Bottom' },
                            { value: 'none', label: 'None' },
                        ],
                    },
                },
            },
            {
                name: 'yAxis',
                selector: {
                    select: {
                        mode: 'dropdown',
                        options: [
                            { value: 'visible', label: 'Visible' },
                            { value: 'hidden', label: 'Hidden' },
                        ],
                    },
                },
            },
        ],
    },
];

const PIE_OPTIONS_SCHEMA = {
    type: 'expandable',
    name: '',
    title: 'Pie Chart Options',
    schema: [
        { name: 'total', selector: { entity: {} } },
        {
            type: 'grid',
            name: '',
            schema: [
                { name: 'totalMultiplier', selector: { number: { mode: 'box', step: 0.01 } } },
                { name: 'unknownName', selector: { text: {} } },
            ],
        },
    ],
};

const LABELS: Record<string, string> = {
    title: 'Title',
    theme: 'Theme',
    period: 'Period',
    refresh: 'Refresh Interval',
    legend: 'Legend Position',
    yAxis: 'Y-Axis',
    total: 'Total Entity',
    totalMultiplier: 'Total Multiplier',
    unknownName: 'Unknown Value Name',
};

@customElement('ha-ag-charts-editor')
export class HAAgChartsEditor extends LitElement {
    @property({ attribute: false }) public hass!: any;
    @state() private _config?: Config;

    public setConfig(config: Config): void {
        this._config = config;
    }

    private _computeLabel = (schema: { name: string }): string => {
        return LABELS[schema.name] || schema.name;
    };

    private _valueChanged(ev: CustomEvent): void {
        ev.stopPropagation();
        if (!this._config) return;

        const newConfig = { ...this._config, ...ev.detail.value };
        this._fireConfigChanged(newConfig);
    }

    private _seriesChanged(ev: CustomEvent): void {
        ev.stopPropagation();
        if (!this._config) return;

        const newConfig = { ...this._config, series: ev.detail.series };
        this._fireConfigChanged(newConfig);
    }

    private _fireConfigChanged(config: Config): void {
        this._config = config;
        this.dispatchEvent(
            new CustomEvent('config-changed', {
                detail: { config },
                bubbles: true,
                composed: true,
            })
        );
    }

    private _hasPieSeries(): boolean {
        return (this._config?.series || []).some(s => s.type === 'pie');
    }

    private _getSchema() {
        if (this._hasPieSeries()) {
            return [...BASE_SCHEMA, PIE_OPTIONS_SCHEMA];
        }
        return BASE_SCHEMA;
    }

    protected render(): TemplateResult {
        if (!this.hass || !this._config) {
            return html``;
        }

        return html`
            <div style="padding: 16px;">
                <ha-form
                    .hass=${this.hass}
                    .data=${this._config}
                    .schema=${this._getSchema()}
                    .computeLabel=${this._computeLabel}
                    @value-changed=${this._valueChanged}
                ></ha-form>

                <div style="margin-top: 24px;">
                    <ag-charts-series-list-editor
                        .hass=${this.hass}
                        .series=${this._config.series || []}
                        @series-changed=${this._seriesChanged}
                    ></ag-charts-series-list-editor>
                </div>
            </div>
        `;
    }
}
