import { LitElement, html, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { CrossLine } from '../types';
import './crossline-editor';

declare global {
    interface HTMLElementTagNameMap {
        'ag-charts-crossline-list-editor': AgChartsCrosslineListEditor;
    }
}

@customElement('ag-charts-crossline-list-editor')
export class AgChartsCrosslineListEditor extends LitElement {
    @property({ attribute: false }) public hass!: any;
    @property({ attribute: false }) public crosslines: CrossLine[] = [];

    private _crosslineChanged(ev: CustomEvent): void {
        ev.stopPropagation();
        const { index, crossline } = ev.detail;
        const updated = [...this.crosslines];
        updated[index] = crossline;
        this._fireChanged(updated);
    }

    private _crosslineRemoved(ev: CustomEvent): void {
        ev.stopPropagation();
        const { index } = ev.detail;
        const updated = this.crosslines.filter((_, i) => i !== index);
        this._fireChanged(updated);
    }

    private _addCrossline(): void {
        const updated = [...this.crosslines];
        updated.push({ type: 'line', axis: 'y' });
        this._fireChanged(updated);
    }

    private _fireChanged(crosslines: CrossLine[]): void {
        this.dispatchEvent(
            new CustomEvent('crosslines-changed', {
                detail: { crosslines },
                bubbles: true,
                composed: true,
            })
        );
    }

    protected render(): TemplateResult {
        return html`
            <div style="display: block;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <h3 style="margin: 0;">Crosslines</h3>
                    <ha-button @click=${this._addCrossline}>Add Crossline</ha-button>
                </div>
                ${this.crosslines.map(
                    (crossline, i) => html`
                        <ag-charts-crossline-editor
                            .hass=${this.hass}
                            .crossline=${crossline}
                            .index=${i}
                            @crossline-changed=${this._crosslineChanged}
                            @crossline-removed=${this._crosslineRemoved}
                        ></ag-charts-crossline-editor>
                    `
                )}
                ${this.crosslines.length === 0
                    ? html`<p style="color: var(--secondary-text-color); font-style: italic; text-align: center; padding: 8px;">
                          No crosslines configured. Click "Add Crossline" to add one.
                      </p>`
                    : ''}
            </div>
        `;
    }
}
