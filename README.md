# AG Charts for Home Assistant

A Home Assistant frontend integration for rendering charts using AG Charts.

## Development Setup

This project uses Docker to run Home Assistant in development mode with the AG Charts component.

### Prerequisites

- Docker and Docker Compose
- Node.js and Yarn

### Directory Structure

```
.
├── src/                    # TypeScript source files
├── dist/                   # Built JavaScript files
├── test/                   # Test environment
│   ├── config/             # Home Assistant configuration
│   │   └── configuration.yaml   # Basic HA configuration with test sensors
│   └── custom_components/  # Custom components directory
│       └── ag_charts/      # AG Charts component
│           ├── __init__.py # Python initialization file
│           └── manifest.json # Component manifest
├── docker-compose.yml      # Docker Compose configuration
└── package.json            # Node.js package configuration
```

### Setup Instructions

1. Install dependencies:

   ```bash
   yarn install
   ```

2. Build the component:

   ```bash
   yarn build
   ```

3. Start Home Assistant:

   ```bash
   docker-compose up
   ```

4. Access Home Assistant at http://localhost:8123

### Development Workflow

1. Make changes to the TypeScript files in the `src/` directory
2. Rebuild the component:
   ```bash
   yarn build
   ```
3. The changes will be automatically available to Home Assistant

### Test Sensors

The development environment includes the following test sensors:

- Temperature (15-30°C)
- Humidity (30-70%)
- Pressure (980-1030 hPa)
- Power (0-2000 W)
- Energy (0-10 kWh)

These sensors are updated every 5 minutes with random values.

## License

MIT

# Home Assistant AG Charts Card

## Installation

**Home Assistant lowest supported version:** 2025.3.0

<details>

<summary>With HACS (Recommended)</summary>

<br>

This method allows you to get updates directly on the HACS main page

1. If HACS is not installed yet, download it following the instructions on [https://hacs.xyz/docs/setup/download/](https://hacs.xyz/docs/use/download/download/)
2. Proceed to the HACS initial configuration following the instructions on [https://hacs.xyz/docs/configuration/basic](https://hacs.xyz/docs/configuration/basic)
3. On your sidebar go to `HACS` > `Frontend`
4. Click on the `+` button at the bottom right corner
5. Now search for `AG Charts` and then click on the button at the bottom right corner to download it
6. Go back on your dashboard and click on the icon at the right top corner then on `Edit dashboard`
7. You can now click on `Add card` in the bottom right corner and search for `AG Charts`

If it's not working, try to clear your browser cache.

</details>

<br>

[![Open AG Charts on Home Assistant Community Store (HACS).](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=bitlogicsolutions&repository=ha-ag-charts&category=frontend)

<br>
