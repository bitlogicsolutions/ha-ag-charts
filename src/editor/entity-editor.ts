import { LitElement, html, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { ConfigEntity } from '../types';

declare global {
    interface HTMLElementTagNameMap {
        'ag-charts-entity-editor': AgChartsEntityEditor;
    }
}

// MDI icon paths
const MDI_PENCIL = 'M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z';
const MDI_DELETE = 'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z';

const ENTITY_SCHEMA = [{ name: 'entity', selector: { entity: {} } }];

const ADVANCED_SCHEMA = [
    { name: 'name', selector: { text: {} } },
    {
        type: 'grid',
        name: '',
        column_min_width: '100px',
        schema: [
            { name: 'fill', selector: { text: {} } },
            { name: 'stroke', selector: { text: {} } },
        ],
    },
    {
        type: 'grid',
        name: '',
        column_min_width: '100px',
        schema: [
            { name: 'yMultiplier', selector: { number: { mode: 'box', step: 0.01 } } },
            { name: 'yUnits', selector: { text: {} } },
        ],
    },
    { name: 'offsetXs', selector: { number: { mode: 'box' } } },
    {
        name: 'action',
        selector: {
            select: {
                mode: 'dropdown',
                options: [
                    { value: '', label: 'None' },
                    { value: 'more-info', label: 'More Info' },
                    { value: 'navigate', label: 'Navigate' },
                ],
            },
        },
    },
    { name: 'path', selector: { text: {} } },
];

const LABELS: Record<string, string> = {
    entity: 'Entity',
    name: 'Display Name',
    fill: 'Fill Color',
    stroke: 'Stroke Color',
    yMultiplier: 'Y Multiplier',
    yUnits: 'Y Units',
    offsetXs: 'X Offset (seconds)',
    action: 'Click Action',
    path: 'Navigation Path',
};

@customElement('ag-charts-entity-editor')
export class AgChartsEntityEditor extends LitElement {
    @property({ attribute: false }) public hass!: any;
    @property({ attribute: false }) public entity!: ConfigEntity;
    @property({ attribute: false }) public index!: number;

    @state() private _showAdvanced = false;

    private _computeLabel = (schema: { name: string }): string => {
        return LABELS[schema.name] || schema.name;
    };

    private _valueChanged(ev: CustomEvent): void {
        ev.stopPropagation();
        const newEntity = { ...this.entity, ...ev.detail.value };
        this._fireChanged(newEntity);
    }

    private _fireChanged(entity: ConfigEntity): void {
        this.dispatchEvent(
            new CustomEvent('entity-changed', {
                detail: { index: this.index, entity },
                bubbles: true,
                composed: true,
            })
        );
    }

    private _remove(): void {
        this.dispatchEvent(
            new CustomEvent('entity-removed', {
                detail: { index: this.index },
                bubbles: true,
                composed: true,
            })
        );
    }

    private _toggleAdvanced(): void {
        this._showAdvanced = !this._showAdvanced;
    }

    protected render(): TemplateResult {
        const showPath = this.entity.action === 'navigate';

        // Filter advanced schema to show/hide path based on action
        const filteredAdvancedSchema = ADVANCED_SCHEMA.filter(
            s => s.name !== 'path' || showPath
        );

        return html`
            <div style="display: block; margin-bottom: 8px; border: 1px solid var(--divider-color); border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 4px; padding: 8px 8px 0 8px; background: var(--card-background-color);">
                    <div style="flex: 1; min-width: 0; overflow: hidden;">
                        <ha-form
                            .hass=${this.hass}
                            .data=${this.entity}
                            .schema=${ENTITY_SCHEMA}
                            .computeLabel=${this._computeLabel}
                            @value-changed=${this._valueChanged}
                        ></ha-form>
                    </div>
                    <ha-icon-button
                        style="flex-shrink: 0;"
                        .path=${MDI_PENCIL}
                        @click=${this._toggleAdvanced}
                        title="Edit options"
                    ></ha-icon-button>
                    <ha-icon-button
                        style="flex-shrink: 0;"
                        .path=${MDI_DELETE}
                        @click=${this._remove}
                        title="Remove entity"
                    ></ha-icon-button>
                </div>
                ${this._showAdvanced
                    ? html`
                          <div style="padding: 12px; border-top: 1px solid var(--divider-color); background: var(--secondary-background-color);">
                              <ha-form
                                  .hass=${this.hass}
                                  .data=${this.entity}
                                  .schema=${filteredAdvancedSchema}
                                  .computeLabel=${this._computeLabel}
                                  @value-changed=${this._valueChanged}
                              ></ha-form>
                          </div>
                      `
                    : ''}
            </div>
        `;
    }
}
