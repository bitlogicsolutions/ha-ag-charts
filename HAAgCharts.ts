import {
  AgChartInstance,
  AgCartesianChartOptions,
  AgChartOptions,
  AgCharts,
  AgBarSeriesOptions,
  AgLineSeriesOptions,
  AgAreaSeriesOptions,
  AgPieSeriesOptions,
  AgChartThemeName,
} from "ag-charts-enterprise";
import { performAction } from "./actions";
import { setupDOM } from "./dom";
import { fetchStatistics } from "./stats";
import { Config, HassEntity, Hass, CartesianSeries, PieSeries } from "./types";
import {
  readEntityConfig,
  unitOfMeasurement,
  key,
  formatValue,
  formatPieTooltip,
  appendUnknownValue,
} from "./utils";

export class HAAgCharts extends HTMLElement {
  private elements?: { rootDiv: HTMLElement; containerDiv: HTMLElement };
  private chartInstance?: AgChartInstance;
  private config: Config;
  private entities: Map<string, HassEntity> = new Map();

  private phase: "init" | "ready" = "init";

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  setConfig(config: Config) {
    if (!config.entities && !config.series) {
      throw new Error("You need to define entities and/or series");
    }
    this.config = config;

    if (!this.elements) {
      this.elements = setupDOM(this);
    }
  }

  set hass(hass: Hass) {
    if (this.phase === "init") {
      this.configureSeries(hass);
      this.phase = "ready";
    }

    this.updateData(hass);
  }

  private configureSeries(hass: Hass) {
    const {
      config: { series, legend },
    } = this;

    let optionalConfig: Pick<
      AgCartesianChartOptions,
      "axes" | "zoom" | "legend"
    > = {};
    const cartesianSeries = series.filter(
      (s): s is CartesianSeries => s.type != "pie"
    );
    const uom = new Map();
    for (const { entities = [], minY, maxY } of cartesianSeries) {
      for (const config of entities) {
        const entity = readEntityConfig(hass, config);
        const unit = entity.yUnits ?? unitOfMeasurement(hass, entity);
        if (uom.has(unit)) {
          uom.get(unit).push(key(entity));
        } else {
          uom.set(unit, [key(entity)]);
        }
      }

      optionalConfig.axes = [{ type: "ordinal-time", position: "bottom" }];
      for (const [unit, keys] of uom.entries()) {
        optionalConfig.axes.push({
          type: "number",
          position: "left",
          min: typeof minY === "number" ? minY : undefined,
          max: typeof maxY === "number" ? maxY : undefined,
          nice: typeof minY !== "number" && typeof maxY !== "number",
          keys,
          label: { format: `#{0>1.1f}${unit}` },
        });
      }
    }

    if (cartesianSeries.length > 0) {
      optionalConfig.zoom = {};
    }

    if (legend === "none") {
      optionalConfig.legend = { enabled: false };
    } else if (legend != null) {
      optionalConfig.legend = { position: legend };
    }

    const { theme = "ag-default-dark", title } = this.config;
    const options: AgChartOptions = {
      container: this.elements?.containerDiv,
      theme: this.generateTheme(theme),
      background: { visible: false },
      title: { text: title },
      series: this.generateSeriesOpts(hass) as any[],
      minWidth: 0,
      ...optionalConfig,
    };
    this.chartInstance = AgCharts.create(options);
  }

  private generateSeriesOpts(hass: Hass) {
    const { series = [] } = this.config;

    const seriesOpts: (
      | AgBarSeriesOptions
      | AgLineSeriesOptions
      | AgAreaSeriesOptions
      | AgPieSeriesOptions
    )[] = [];
    const cartesianSeries = series.filter(
      (s): s is CartesianSeries => s.type !== "pie"
    );
    const pieSeries = series.filter((s): s is PieSeries => s.type === "pie");
    for (const series of cartesianSeries) {
      const { type, entities = [], stacked } = series;
      switch (type) {
        case "line":
        case "bar":
        case "area":
          for (const config of entities) {
            const entity = readEntityConfig(hass, config);
            const optional: any = {};
            if (entity.fill) optional.fill = entity.fill;
            if (entity.stroke) optional.stroke = entity.stroke;
            seriesOpts.push({
              type,
              xKey: "key",
              yKey: key(entity),
              yName: entity.name,
              stacked,
              listeners: {
                nodeClick: () => performAction(entity, this.elements?.rootDiv!),
              },
              ...optional,
            } satisfies AgBarSeriesOptions | AgLineSeriesOptions | AgAreaSeriesOptions);
          }
          break;

        default:
          throw new Error("type not recognised: " + type);
      }
    }

    for (const { type } of pieSeries) {
      switch (type) {
        case "pie":
          seriesOpts.push({
            type: "pie",
            calloutLabelKey: "name",
            angleKey: "value",
            sectorLabelKey: "value",
            sectorLabel: {
              formatter: ({ datum: { value, entity } }) =>
                formatValue(value, entity),
            },
            tooltip: {
              renderer: ({ datum: { name, value, entity } }) =>
                formatPieTooltip(name, value, entity),
            },
            listeners: {
              nodeClick: ({ datum }) =>
                performAction(datum.config, this.elements?.rootDiv!),
            },
          });
          break;
      }
    }

    return seriesOpts;
  }

  private lastUpdateData = -Infinity;
  async updateData(hass: Hass) {
    const {
      config: {
        interval = "5minute",
        period = 1,
        entities,
        total,
        totalMultiplier = 1,
        unknownName = "Unknown",
        series,
        refresh = 5,
      },
      chartInstance,
    } = this;

    const timeSinceLastUpdate = Date.now() - this.lastUpdateData;
    if (timeSinceLastUpdate < refresh * 1000) {
      return;
    }
    this.lastUpdateData = Date.now();

    const data: any[] = [];
    if (entities?.length > 0) {
      data.push(
        ...entities.map((c) => {
          const e = readEntityConfig(hass, c);
          return {
            name: e.name,
            value: Number(hass.states[e.entity]?.state ?? 0),
            entity: hass.states[e.entity],
            config: e,
          };
        })
      );

      if (total) {
        const totalValue =
          Number(hass.states[total]?.state ?? 0) * totalMultiplier;
        appendUnknownValue(totalValue, data, unknownName);
      }
    }

    const dataMap = new Map();
    const cartesianSeries = series.filter(
      (s): s is CartesianSeries => s.type !== "pie"
    );
    for (const { entities } of cartesianSeries ?? []) {
      for (const config of entities ?? []) {
        const entity = readEntityConfig(hass, config);
        const stats = await fetchStatistics(
          hass,
          entity.entity,
          new Date(Date.now() - period * 24 * 3600000),
          new Date(),
          interval
        );

        for (const { start, end, min, mean, max, state } of stats) {
          let x = start + (entity.offsetXs ?? 0) * 1000;
          let dataEntry = dataMap.get(x);
          if (dataEntry == null) {
            dataEntry = { key: x };
            data.push(dataEntry);
            dataMap.set(x, dataEntry);
          }

          dataEntry[key(entity)] = (mean ?? state) * (entity.yMultiplier ?? 1);
        }

        this.entities.set(key(entity), hass.states[entity.entity]);
      }
    }

    data.sort((a, b) => a.key - b.key);

    await chartInstance?.updateDelta({ data });
  }

  getCardSize() {
    return 3;
  }

  private generateTheme(baseTheme: AgChartThemeName) {
    return {
      baseTheme,
      overrides: {
        common: {
          animation: { enabled: false },
        },
        line: { series: { marker: { enabled: false } } },
      },
    };
  }
}
