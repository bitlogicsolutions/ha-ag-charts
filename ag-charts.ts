import { AgChartInstance, AgCharts } from "ag-charts-enterprise";
import { Config, Hass, HassEntity } from "./types";
import { setupDOM } from "./dom";
import { buildSeriesConfig } from "./series";
import { updateData } from "./data";

console.info(
  `%cAG CHARTS HASS INTEGRATION\n%cVersion: 0.0.1`,
  "color: white; background: blue; font-weight: bold;",
  "color: blue; background: white; font-weight: bold;",
  ""
);

class HAAgCharts extends HTMLElement {
  private chartInstance?: AgChartInstance;
  elements?: { rootDiv: HTMLElement; containerDiv: HTMLElement };
  config: Config;
  entities: Map<string, HassEntity> = new Map();
  lastUpdateData = -Infinity;

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
      this.chartInstance = AgCharts.create(buildSeriesConfig(this, hass));
      this.phase = "ready";
    }

    this.updateData(hass);
  }

  async updateData(hass: Hass) {
    await this.chartInstance?.updateDelta({
      data: await updateData(this, hass),
    });
  }

  getCardSize() {
    return 3;
  }
}

customElements.define("ag-charts", HAAgCharts);
