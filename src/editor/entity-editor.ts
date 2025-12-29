import { LitElement, html, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ConfigEntity } from '../types';

declare global {
    interface HTMLElementTagNameMap {
        'ag-charts-entity-editor': AgChartsEntityEditor;
    }
}

const ADVANCED_SCHEMA = [
    { name: 'name', selector: { text: {} } },
    {
        type: 'grid',
        name: '',
        schema: [
            { name: 'fill', selector: { text: {} } },
            { name: 'stroke', selector: { text: {} } },
        ],
    },
    {
        type: 'grid',
        name: '',
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

    private _computeLabel = (schema: { name: string }): string => {
        return LABELS[schema.name] || schema.name;
    };

    private _entityChanged(ev: CustomEvent): void {
        ev.stopPropagation();
        const newEntity = { ...this.entity, entity: ev.detail.value };
        this._fireChanged(newEntity);
    }

    private _advancedChanged(ev: CustomEvent): void {
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

    protected render(): TemplateResult {
        const showPath = this.entity.action === 'navigate';
        const advancedData = { ...this.entity };
        delete (advancedData as any).entity;

        // Filter schema to show/hide path based on action
        const filteredSchema = ADVANCED_SCHEMA.filter(
            s => s.name !== 'path' || showPath
        );

        return html`
            <div style="display: block; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <ha-entity-picker
                        style="flex: 1;"
                        .hass=${this.hass}
                        .value=${this.entity.entity}
                        @value-changed=${this._entityChanged}
                        allow-custom-entity
                    ></ha-entity-picker>
                    <ha-icon-button
                        .path=${'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z'}
                        @click=${this._remove}
                    ></ha-icon-button>
                </div>
                <ha-expansion-panel outlined style="margin-top: 4px;">
                    <span slot="header">Advanced Options</span>
                    <div style="padding: 8px;">
                        <ha-form
                            .hass=${this.hass}
                            .data=${advancedData}
                            .schema=${filteredSchema}
                            .computeLabel=${this._computeLabel}
                            @value-changed=${this._advancedChanged}
                        ></ha-form>
                    </div>
                </ha-expansion-panel>
            </div>
        `;
    }
}
