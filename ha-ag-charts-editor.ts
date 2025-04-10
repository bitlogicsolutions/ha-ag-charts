import { LitElement, html, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Config, CartesianSeries, PieSeries, ConfigEntity } from './types';
import { AgChartThemeName } from 'ag-charts-enterprise';

declare global {
  interface HTMLElementTagNameMap {
    'ha-ag-charts-editor': HAAgChartsEditor;
  }
}

@customElement('ha-ag-charts-editor')
export class HAAgChartsEditor extends LitElement {
  @property({ attribute: false }) public hass!: any;
  @property({ attribute: false }) public config!: Config;

  @state() private _series: (CartesianSeries | PieSeries)[] = [];
  @state() private _title = '';
  @state() private _theme: AgChartThemeName = 'ag-default-dark';
  @state() private _refresh = 5;
  @state() private _interval: '5minutes' = '5minutes';
  @state() private _period = 1;
  @state() private _legend?: 'left' | 'right' | 'top' | 'bottom' | 'none';
  @state() private _total?: string;
  @state() private _totalMultiplier = 1;
  @state() private _unknownName = 'Unknown';

  private _themes: AgChartThemeName[] = [
    'ag-default',
    'ag-default-dark',
    'ag-material',
    'ag-material-dark',
    'ag-vivid',
    'ag-vivid-dark',
  ];

  protected firstUpdated(): void {
    if (this.config) {
      this._series = this.config.series || [];
      this._title = this.config.title || '';
      this._theme = this.config.theme || 'ag-default-dark';
      this._refresh = this.config.refresh || 5;
      this._interval = this.config.interval || '5minutes';
      this._period = this.config.period || 1;
      this._legend = this.config.legend;
      this._total = this.config.total;
      this._totalMultiplier = this.config.totalMultiplier || 1;
      this._unknownName = this.config.unknownName || 'Unknown';
    }
  }

  private _valueChanged(ev: CustomEvent): void {
    const target = ev.target as any;
    const value = target.value;
    const name = target.name;

    if (name.startsWith('series.')) {
      const [_, index, field] = name.split('.');
      if (!this._series[index]) {
        this._series[index] = { type: 'line', entities: [] };
      }
      if (field === 'type') {
        (this._series[index] as any).type = value;
      } else if (field.startsWith('entities.')) {
        const [__, entityIndex, entityField] = field.split('.');
        const series = this._series[index] as CartesianSeries;
        if (!series.entities) {
          series.entities = [];
        }
        if (!series.entities[entityIndex]) {
          series.entities[entityIndex] = { entity: '' };
        }
        (series.entities[entityIndex] as any)[entityField] = value;
      }
    } else {
      (this as any)[`_${name}`] = value;
    }

    this._fireConfigChanged();
  }

  private _addSeries(): void {
    this._series = [...this._series, { type: 'line', entities: [{ entity: '' }] }];
    this._fireConfigChanged();
  }

  private _removeSeries(index: number): void {
    this._series = this._series.filter((_, i) => i !== index);
    this._fireConfigChanged();
  }

  private _addEntity(seriesIndex: number): void {
    const series = this._series[seriesIndex] as CartesianSeries;
    if (!series.entities) {
      series.entities = [];
    }
    series.entities.push({ entity: '' });
    this._fireConfigChanged();
  }

  private _removeEntity(seriesIndex: number, entityIndex: number): void {
    const series = this._series[seriesIndex] as CartesianSeries;
    series.entities = series.entities.filter((_, i) => i !== entityIndex);
    this._fireConfigChanged();
  }

  private _fireConfigChanged(): void {
    const config = {
      title: this._title,
      theme: this._theme,
      series: this._series,
      refresh: this._refresh,
      interval: this._interval,
      period: this._period,
      legend: this._legend,
      total: this._total,
      totalMultiplier: this._totalMultiplier,
      unknownName: this._unknownName,
    };

    this.dispatchEvent(
      new CustomEvent('config-changed', {
        detail: { config },
        bubbles: true,
        composed: true,
      })
    );
  }

  protected render(): TemplateResult {
    return html`
      <div class="card-config">
        <ha-textfield
          label="Title"
          name="title"
          .value=${this._title}
          @change=${this._valueChanged}
        ></ha-textfield>

        <ha-select label="Theme" name="theme" .value=${this._theme} @change=${this._valueChanged}>
          ${this._themes.map(
            theme => html`<mwc-list-item .value=${theme}>${theme}</mwc-list-item>`
          )}
        </ha-select>

        <ha-textfield
          label="Refresh Interval (seconds)"
          name="refresh"
          type="number"
          .value=${this._refresh}
          @change=${this._valueChanged}
        ></ha-textfield>

        <ha-select
          label="Interval"
          name="interval"
          .value=${this._interval}
          @change=${this._valueChanged}
        >
          <mwc-list-item value="5minutes">5 minutes</mwc-list-item>
        </ha-select>

        <ha-textfield
          label="Period (days)"
          name="period"
          type="number"
          .value=${this._period}
          @change=${this._valueChanged}
        ></ha-textfield>

        <ha-select
          label="Legend Position"
          name="legend"
          .value=${this._legend}
          @change=${this._valueChanged}
        >
          <mwc-list-item value="left">Left</mwc-list-item>
          <mwc-list-item value="right">Right</mwc-list-item>
          <mwc-list-item value="top">Top</mwc-list-item>
          <mwc-list-item value="bottom">Bottom</mwc-list-item>
          <mwc-list-item value="none">None</mwc-list-item>
        </ha-select>

        <ha-entity-picker
          label="Total Entity"
          name="total"
          .value=${this._total}
          @change=${this._valueChanged}
        ></ha-entity-picker>

        <ha-textfield
          label="Total Multiplier"
          name="totalMultiplier"
          type="number"
          .value=${this._totalMultiplier}
          @change=${this._valueChanged}
        ></ha-textfield>

        <ha-textfield
          label="Unknown Value Name"
          name="unknownName"
          .value=${this._unknownName}
          @change=${this._valueChanged}
        ></ha-textfield>

        <div class="series-section">
          <h3>Series</h3>
          ${this._series.map(
            (series, seriesIndex) => html`
              <div class="series-item">
                <ha-select
                  label="Type"
                  name="series.${seriesIndex}.type"
                  .value=${series.type}
                  @change=${this._valueChanged}
                >
                  <mwc-list-item value="area">Area</mwc-list-item>
                  <mwc-list-item value="bar">Bar</mwc-list-item>
                  <mwc-list-item value="line">Line</mwc-list-item>
                  <mwc-list-item value="pie">Pie</mwc-list-item>
                </ha-select>

                ${series.type !== 'pie'
                  ? html`
                      <div class="entities-section">
                        <h4>Entities</h4>
                        ${(series as CartesianSeries).entities?.map(
                          (entity, entityIndex) => html`
                            <div class="entity-item">
                              <ha-entity-picker
                                label="Entity"
                                name="series.${seriesIndex}.entities.${entityIndex}.entity"
                                .value=${typeof entity === 'string' ? entity : entity.entity}
                                @change=${this._valueChanged}
                              ></ha-entity-picker>
                              <ha-textfield
                                label="Name"
                                name="series.${seriesIndex}.entities.${entityIndex}.name"
                                .value=${typeof entity === 'string' ? '' : entity.name}
                                @change=${this._valueChanged}
                              ></ha-textfield>
                              <ha-select
                                label="Action"
                                name="series.${seriesIndex}.entities.${entityIndex}.action"
                                .value=${typeof entity === 'string' ? '' : entity.action}
                                @change=${this._valueChanged}
                              >
                                <mwc-list-item value="more-info">More Info</mwc-list-item>
                                <mwc-list-item value="navigate">Navigate</mwc-list-item>
                              </ha-select>
                              ${typeof entity !== 'string' && entity.action === 'navigate'
                                ? html`
                                    <ha-textfield
                                      label="Path"
                                      name="series.${seriesIndex}.entities.${entityIndex}.path"
                                      .value=${entity.path}
                                      @change=${this._valueChanged}
                                    ></ha-textfield>
                                  `
                                : ''}
                              <ha-textfield
                                label="X Offset (seconds)"
                                name="series.${seriesIndex}.entities.${entityIndex}.offsetXs"
                                type="number"
                                .value=${typeof entity === 'string' ? '' : entity.offsetXs}
                                @change=${this._valueChanged}
                              ></ha-textfield>
                              <ha-textfield
                                label="Y Multiplier"
                                name="series.${seriesIndex}.entities.${entityIndex}.yMultiplier"
                                type="number"
                                .value=${typeof entity === 'string' ? '' : entity.yMultiplier}
                                @change=${this._valueChanged}
                              ></ha-textfield>
                              <ha-textfield
                                label="Y Units"
                                name="series.${seriesIndex}.entities.${entityIndex}.yUnits"
                                .value=${typeof entity === 'string' ? '' : entity.yUnits}
                                @change=${this._valueChanged}
                              ></ha-textfield>
                              <ha-textfield
                                label="Fill Color"
                                name="series.${seriesIndex}.entities.${entityIndex}.fill"
                                .value=${typeof entity === 'string' ? '' : entity.fill}
                                @change=${this._valueChanged}
                              ></ha-textfield>
                              <ha-textfield
                                label="Stroke Color"
                                name="series.${seriesIndex}.entities.${entityIndex}.stroke"
                                .value=${typeof entity === 'string' ? '' : entity.stroke}
                                @change=${this._valueChanged}
                              ></ha-textfield>
                              <ha-icon-button
                                icon="hass:delete"
                                @click=${() => this._removeEntity(seriesIndex, entityIndex)}
                              ></ha-icon-button>
                            </div>
                          `
                        )}
                        <ha-button @click=${() => this._addEntity(seriesIndex)}>
                          Add Entity
                        </ha-button>
                      </div>
                    `
                  : ''}

                <ha-icon-button
                  icon="hass:delete"
                  @click=${() => this._removeSeries(seriesIndex)}
                ></ha-icon-button>
              </div>
            `
          )}
          <ha-button @click=${this._addSeries}>Add Series</ha-button>
        </div>
      </div>
    `;
  }

  static styles = `
    .card-config {
      padding: 16px;
    }
    .series-section {
      margin-top: 16px;
    }
    .series-item {
      margin: 16px 0;
      padding: 16px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
    }
    .entities-section {
      margin-top: 16px;
    }
    .entity-item {
      margin: 8px 0;
      padding: 8px;
      border: 1px solid var(--divider-color);
      border-radius: 4px;
    }
    ha-textfield,
    ha-select,
    ha-entity-picker {
      display: block;
      margin: 8px 0;
    }
  `;
}
