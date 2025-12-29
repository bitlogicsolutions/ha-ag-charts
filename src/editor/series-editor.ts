import { LitElement, html, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { CartesianSeries, PieSeries, ConfigEntity, Entity } from '../types';
import './entity-editor';

declare global {
    interface HTMLElementTagNameMap {
        'ag-charts-series-editor': AgChartsSeriesEditor;
    }
}

type Series = CartesianSeries | PieSeries;

const TYPE_OPTIONS = [
    { value: 'line', label: 'Line' },
    { value: 'area', label: 'Area' },
    { value: 'bar', label: 'Bar' },
    { value: 'pie', label: 'Pie' },
];

const CARTESIAN_SCHEMA = [
    {
        name: 'type',
        selector: {
            select: {
                mode: 'dropdown',
                options: TYPE_OPTIONS,
            },
        },
    },
    { name: 'stacked', selector: { boolean: {} } },
    {
        type: 'grid',
        name: '',
        column_min_width: '100px',
        schema: [
            { name: 'minY', selector: { number: { mode: 'box' } } },
            { name: 'maxY', selector: { number: { mode: 'box' } } },
        ],
    },
];

const PIE_SCHEMA = [
    {
        name: 'type',
        selector: {
            select: {
                mode: 'dropdown',
                options: TYPE_OPTIONS,
            },
        },
    },
    {
        type: 'grid',
        name: '',
        column_min_width: '120px',
        schema: [
            {
                name: 'calloutLabel',
                selector: {
                    select: {
                        mode: 'dropdown',
                        options: [
                            { value: 'name', label: 'Name' },
                            { value: 'value', label: 'Value' },
                            { value: 'none', label: 'None' },
                        ],
                    },
                },
            },
            {
                name: 'sectorLabel',
                selector: {
                    select: {
                        mode: 'dropdown',
                        options: [
                            { value: 'name', label: 'Name' },
                            { value: 'value', label: 'Value' },
                            { value: 'both', label: 'Both' },
                            { value: 'none', label: 'None' },
                        ],
                    },
                },
            },
        ],
    },
];

const LABELS: Record<string, string> = {
    type: 'Type',
    stacked: 'Stacked',
    minY: 'Min Y',
    maxY: 'Max Y',
    calloutLabel: 'Callout Label',
    sectorLabel: 'Sector Label',
};

@customElement('ag-charts-series-editor')
export class AgChartsSeriesEditor extends LitElement {
    @property({ attribute: false }) public hass!: any;
    @property({ attribute: false }) public series!: Series;
    @property({ attribute: false }) public index!: number;

    private _computeLabel = (schema: { name: string }): string => {
        return LABELS[schema.name] || schema.name;
    };

    private _seriesChanged(ev: CustomEvent): void {
        ev.stopPropagation();
        const newSeries = { ...this.series, ...ev.detail.value };

        // If type changed to pie, remove entities; if changed from pie, add entities array
        if (newSeries.type === 'pie' && 'entities' in newSeries) {
            delete (newSeries as any).entities;
            delete (newSeries as any).stacked;
            delete (newSeries as any).minY;
            delete (newSeries as any).maxY;
        } else if (newSeries.type !== 'pie' && !('entities' in newSeries)) {
            (newSeries as CartesianSeries).entities = [];
            delete (newSeries as any).calloutLabel;
            delete (newSeries as any).sectorLabel;
        }

        this._fireChanged(newSeries);
    }

    private _entityChanged(ev: CustomEvent): void {
        ev.stopPropagation();
        const { index, entity } = ev.detail;
        const cartesian = this.series as CartesianSeries;
        const entities: Entity[] = [...cartesian.entities];
        entities[index] = entity;
        this._fireChanged({ ...cartesian, entities } as Series);
    }

    private _entityRemoved(ev: CustomEvent): void {
        ev.stopPropagation();
        const { index } = ev.detail;
        const cartesian = this.series as CartesianSeries;
        const entities = cartesian.entities.filter((_, i) => i !== index);
        this._fireChanged({ ...cartesian, entities } as Series);
    }

    private _addEntity(): void {
        const cartesian = this.series as CartesianSeries;
        const entities: Entity[] = [...(cartesian.entities || [])];
        entities.push({ entity: '' });
        this._fireChanged({ ...cartesian, entities } as Series);
    }

    private _fireChanged(series: Series): void {
        this.dispatchEvent(
            new CustomEvent('series-changed', {
                detail: { index: this.index, series },
                bubbles: true,
                composed: true,
            })
        );
    }

    private _remove(): void {
        this.dispatchEvent(
            new CustomEvent('series-removed', {
                detail: { index: this.index },
                bubbles: true,
                composed: true,
            })
        );
    }

    private _normalizeEntity(entity: string | ConfigEntity): ConfigEntity {
        return typeof entity === 'string' ? { entity } : entity;
    }

    protected render(): TemplateResult {
        const isPie = this.series.type === 'pie';
        const schema = isPie ? PIE_SCHEMA : CARTESIAN_SCHEMA;
        const entities = isPie ? [] : ((this.series as CartesianSeries).entities || []);

        return html`
            <div style="display: block; margin-bottom: 16px;">
                <ha-expansion-panel outlined expanded>
                    <div slot="header" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                        <span>Series ${this.index + 1}: ${this.series.type}</span>
                        <ha-icon-button
                            style="margin-right: -8px;"
                            .path=${'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z'}
                            @click=${this._remove}
                        ></ha-icon-button>
                    </div>
                    <div style="padding: 16px;">
                        <ha-form
                            .hass=${this.hass}
                            .data=${this.series}
                            .schema=${schema}
                            .computeLabel=${this._computeLabel}
                            @value-changed=${this._seriesChanged}
                        ></ha-form>

                        ${!isPie
                            ? html`
                                  <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--divider-color);">
                                      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                                          <h4 style="margin: 0;">Entities</h4>
                                          <ha-button @click=${this._addEntity}>
                                              Add Entity
                                          </ha-button>
                                      </div>
                                      ${entities.map(
                                          (entity, i) => html`
                                              <ag-charts-entity-editor
                                                  .hass=${this.hass}
                                                  .entity=${this._normalizeEntity(entity)}
                                                  .index=${i}
                                                  @entity-changed=${this._entityChanged}
                                                  @entity-removed=${this._entityRemoved}
                                              ></ag-charts-entity-editor>
                                          `
                                      )}
                                      ${entities.length === 0
                                          ? html`<p style="color: var(--secondary-text-color); font-style: italic; margin: 8px 0;">
                                                No entities configured. Click "Add Entity" to add one.
                                            </p>`
                                          : ''}
                                  </div>
                              `
                            : ''}
                    </div>
                </ha-expansion-panel>
            </div>
        `;
    }
}
