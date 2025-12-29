import { LitElement, html, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { CartesianSeries, PieSeries } from '../types';
import './series-editor';

declare global {
    interface HTMLElementTagNameMap {
        'ag-charts-series-list-editor': AgChartsSeriesListEditor;
    }
}

type Series = CartesianSeries | PieSeries;

@customElement('ag-charts-series-list-editor')
export class AgChartsSeriesListEditor extends LitElement {
    @property({ attribute: false }) public hass!: any;
    @property({ attribute: false }) public series: Series[] = [];

    private _seriesChanged(ev: CustomEvent): void {
        ev.stopPropagation();
        const { index, series } = ev.detail;
        const newSeries = [...this.series];
        newSeries[index] = series;
        this._fireChanged(newSeries);
    }

    private _seriesRemoved(ev: CustomEvent): void {
        ev.stopPropagation();
        const { index } = ev.detail;
        const newSeries = this.series.filter((_, i) => i !== index);
        this._fireChanged(newSeries);
    }

    private _addSeries(): void {
        const newSeries = [...this.series];
        newSeries.push({ type: 'line', entities: [] });
        this._fireChanged(newSeries);
    }

    private _fireChanged(series: Series[]): void {
        this.dispatchEvent(
            new CustomEvent('series-changed', {
                detail: { series },
                bubbles: true,
                composed: true,
            })
        );
    }

    protected render(): TemplateResult {
        return html`
            <div style="display: block;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
                    <h3 style="margin: 0;">Series</h3>
                    <ha-button @click=${this._addSeries}>Add Series</ha-button>
                </div>
                ${this.series.map(
                    (series, i) => html`
                        <ag-charts-series-editor
                            .hass=${this.hass}
                            .series=${series}
                            .index=${i}
                            @series-changed=${this._seriesChanged}
                            @series-removed=${this._seriesRemoved}
                        ></ag-charts-series-editor>
                    `
                )}
                ${this.series.length === 0
                    ? html`<p style="color: var(--secondary-text-color); font-style: italic; text-align: center; padding: 16px;">
                          No series configured. Click "Add Series" to create one.
                      </p>`
                    : ''}
            </div>
        `;
    }
}
