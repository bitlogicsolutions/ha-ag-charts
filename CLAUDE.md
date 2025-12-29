# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ha-ag-charts is a Home Assistant frontend integration that provides a custom dashboard card for rendering charts using AG Charts (community and enterprise). It allows Home Assistant users to visualize statistics and sensor data with professional charting capabilities.

- **Minimum HA Version**: 2025.3.0
- **Distribution**: HACS (Home Assistant Community Store)

## Build Commands

```bash
yarn install          # Install dependencies
yarn build            # Bundle TypeScript to dist/ag-charts.js
yarn watch            # Build with file watching
yarn type-check       # TypeScript type checking (tsc --noEmit)
yarn format           # Format code with Prettier
yarn format:check     # Check formatting
```

## Development Workflow

1. Start Home Assistant dev container: `docker-compose up`
2. Run `yarn watch` in separate terminal
3. Access HA at http://localhost:8123
4. Changes to `src/` trigger rebuild; HA auto-detects updated dist/ag-charts.js

Test sensors (temperature, humidity, pressure, power, energy) are configured in `test/config/configuration.yaml`.

## Tooling Notes

- **Package manager**: Yarn (not npm)
- **Bundler**: esbuild (outputs single ESM file to dist/)
- **Built artifacts are committed** to the repo for HACS distribution

## Architecture

**Entry Point**: `src/ag-charts.ts` - Custom element `<ha-ag-charts>` extending HTMLElement

**Data Flow**:
1. User configures card via `ha-ag-charts-editor` (Lit component)
2. Config passed to `HAAgCharts.setConfig()`
3. `buildSeriesConfig()` creates AG Charts configuration
4. `updateData()` fetches data from HA statistics API
5. Chart instance created/updated via `AgCharts.create()`

**Source Modules**:
- `ag-charts.ts` - Main card component, lifecycle (init → ready phases)
- `ha-ag-charts-editor.ts` - Lit-based config UI editor
- `series.ts` - Series configuration builder (cartesian & pie charts)
- `data.ts` - Data fetching and transformation
- `stats.ts` - Home Assistant statistics API integration
- `types.ts` - TypeScript type definitions (Config, Series, Entity, Hass)
- `utils.ts` - Entity config parsing, value formatting
- `actions.ts` - Click action handlers (more-info, navigate)
- `dom.ts` - Shadow DOM setup, fullscreen support
- `config-schema.ts` - Schema for UI editor

**Supported Chart Types**: line, bar, area (with stacking), pie

**Themes**: ag-default, ag-default-dark, ag-material, ag-material-dark, ag-vivid, ag-vivid-dark

## Releasing

1. Update version in `package.json` and `src/ag-charts.ts` (console.info banner)
2. Run `yarn build` to rebuild dist/
3. Commit changes and push to `latest` branch
4. Create GitHub release: `gh release create vX.Y.Z --prerelease --title "vX.Y.Z" --notes "changelog"`
   - Use `--prerelease` for beta versions
   - Omit `--prerelease` for stable releases
