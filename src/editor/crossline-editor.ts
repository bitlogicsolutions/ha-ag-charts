import { LitElement, html, TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { CrossLine } from '../types';

declare global {
    interface HTMLElementTagNameMap {
        'ag-charts-crossline-editor': AgChartsCrosslineEditor;
    }
}

const TYPE_OPTIONS = [
    { value: 'line', label: 'Line' },
    { value: 'range', label: 'Range' },
];

const AXIS_OPTIONS = [
    { value: 'y', label: 'Y-Axis' },
    { value: 'x', label: 'X-Axis' },
];

const LABEL_POSITION_OPTIONS = [
    { value: '', label: 'Default' },
    { value: 'top', label: 'Top' },
    { value: 'bottom', label: 'Bottom' },
    { value: 'left', label: 'Left' },
    { value: 'right', label: 'Right' },
    { value: 'topLeft', label: 'Top Left' },
    { value: 'topRight', label: 'Top Right' },
    { value: 'bottomLeft', label: 'Bottom Left' },
    { value: 'bottomRight', label: 'Bottom Right' },
    { value: 'inside', label: 'Inside' },
    { value: 'insideLeft', label: 'Inside Left' },
    { value: 'insideRight', label: 'Inside Right' },
    { value: 'insideTop', label: 'Inside Top' },
    { value: 'insideBottom', label: 'Inside Bottom' },
];

const LINE_DASH_OPTIONS = [
    { value: '', label: 'Solid' },
    { value: '6,3', label: 'Dashed' },
    { value: '2,2', label: 'Dotted' },
    { value: '8,4,2,4', label: 'Dash-Dot' },
];

const BASE_SCHEMA = [
    {
        type: 'grid',
        name: '',
        column_min_width: '100px',
        schema: [
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
                name: 'axis',
                selector: {
                    select: {
                        mode: 'dropdown',
                        options: AXIS_OPTIONS,
                    },
                },
            },
        ],
    },
];

const LINE_VALUE_SCHEMA = [
    { name: 'value', selector: { number: { mode: 'box', step: 0.01 } } },
];

const RANGE_VALUE_SCHEMA = [
    {
        type: 'grid',
        name: '',
        column_min_width: '100px',
        schema: [
            { name: 'rangeFrom', selector: { number: { mode: 'box', step: 0.01 } } },
            { name: 'rangeTo', selector: { number: { mode: 'box', step: 0.01 } } },
        ],
    },
];

const STYLE_SCHEMA = [
    {
        type: 'expandable',
        name: '',
        title: 'Style',
        schema: [
            {
                type: 'grid',
                name: '',
                column_min_width: '100px',
                schema: [
                    { name: 'stroke', selector: { color_rgb: {} } },
                    { name: 'fill', selector: { color_rgb: {} } },
                ],
            },
            {
                type: 'grid',
                name: '',
                column_min_width: '100px',
                schema: [
                    { name: 'strokeWidth', selector: { number: { mode: 'box', min: 0, step: 1 } } },
                    { name: 'fillOpacity', selector: { number: { mode: 'box', min: 0, max: 1, step: 0.1 } } },
                ],
            },
            {
                name: 'lineDash',
                selector: {
                    select: {
                        mode: 'dropdown',
                        options: LINE_DASH_OPTIONS,
                    },
                },
            },
        ],
    },
];

const LABEL_SCHEMA = [
    {
        type: 'expandable',
        name: '',
        title: 'Label',
        schema: [
            { name: 'label', selector: { text: {} } },
            {
                name: 'labelPosition',
                selector: {
                    select: {
                        mode: 'dropdown',
                        options: LABEL_POSITION_OPTIONS,
                    },
                },
            },
        ],
    },
];

const LABELS: Record<string, string> = {
    type: 'Type',
    axis: 'Axis',
    value: 'Value',
    rangeFrom: 'Range From',
    rangeTo: 'Range To',
    stroke: 'Stroke Color',
    strokeWidth: 'Stroke Width',
    fill: 'Fill Color',
    fillOpacity: 'Fill Opacity',
    lineDash: 'Line Style',
    label: 'Label Text',
    labelPosition: 'Label Position',
};

@customElement('ag-charts-crossline-editor')
export class AgChartsCrosslineEditor extends LitElement {
    @property({ attribute: false }) public hass!: any;
    @property({ attribute: false }) public crossline!: CrossLine;
    @property({ attribute: false }) public index!: number;

    private _computeLabel = (schema: { name: string }): string => {
        return LABELS[schema.name] || schema.name;
    };

    // Flatten crossline for form data (range -> rangeFrom/rangeTo)
    private _getFormData() {
        const { range, ...rest } = this.crossline;
        return {
            ...rest,
            rangeFrom: range?.[0],
            rangeTo: range?.[1],
        };
    }

    private _valueChanged(ev: CustomEvent): void {
        ev.stopPropagation();
        const formData = { ...this._getFormData(), ...ev.detail.value };

        // Rebuild crossline from form data
        const { rangeFrom, rangeTo, ...crossline } = formData;
        if (crossline.type === 'range') {
            crossline.range = [
                typeof rangeFrom === 'number' ? rangeFrom : 0,
                typeof rangeTo === 'number' ? rangeTo : 0,
            ];
            delete crossline.value;
        } else {
            delete crossline.range;
        }

        this._fireChanged(crossline);
    }

    private _fireChanged(crossline: CrossLine): void {
        this.dispatchEvent(
            new CustomEvent('crossline-changed', {
                detail: { index: this.index, crossline },
                bubbles: true,
                composed: true,
            })
        );
    }

    private _remove(): void {
        this.dispatchEvent(
            new CustomEvent('crossline-removed', {
                detail: { index: this.index },
                bubbles: true,
                composed: true,
            })
        );
    }

    private _getSchema() {
        const isRange = this.crossline.type === 'range';
        return [
            ...BASE_SCHEMA,
            ...(isRange ? RANGE_VALUE_SCHEMA : LINE_VALUE_SCHEMA),
            ...STYLE_SCHEMA,
            ...LABEL_SCHEMA,
        ];
    }

    private _summary(): string {
        const { type, axis, value, range, label } = this.crossline;
        const axisLabel = axis === 'x' ? 'X' : 'Y';
        let desc = `${axisLabel}-Axis`;
        if (type === 'range' && range) {
            desc += ` range [${range[0]}, ${range[1]}]`;
        } else if (value != null) {
            desc += ` @ ${value}`;
        }
        if (label) desc += ` "${label}"`;
        return desc;
    }

    protected render(): TemplateResult {
        return html`
            <div style="display: block; margin-bottom: 8px;">
                <ha-expansion-panel outlined>
                    <div slot="header" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                        <span>Crossline ${this.index + 1}: ${this._summary()}</span>
                        <ha-icon-button
                            style="margin-right: -8px;"
                            .path=${'M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z'}
                            @click=${this._remove}
                        ></ha-icon-button>
                    </div>
                    <div style="padding: 16px;">
                        <ha-form
                            .hass=${this.hass}
                            .data=${this._getFormData()}
                            .schema=${this._getSchema()}
                            .computeLabel=${this._computeLabel}
                            @value-changed=${this._valueChanged}
                        ></ha-form>
                    </div>
                </ha-expansion-panel>
            </div>
        `;
    }
}
