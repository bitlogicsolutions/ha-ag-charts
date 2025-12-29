import { AgChartThemeName } from 'ag-charts-enterprise';

export const CONFIG_SCHEMA = {
    title: {
        type: 'string',
        description: 'The title of the chart',
        required: true,
    },
    theme: {
        type: 'select',
        options: [
            'ag-default',
            'ag-default-dark',
            'ag-material',
            'ag-material-dark',
            'ag-vivid',
            'ag-vivid-dark',
        ] as AgChartThemeName[],
        description: 'The theme to use for the chart',
        required: true,
    },
    series: {
        type: 'array',
        description: 'The series to display in the chart',
        required: true,
        items: {
            type: 'object',
            properties: {
                type: {
                    type: 'select',
                    options: ['area', 'bar', 'line', 'pie'],
                    description: 'The type of series',
                    required: true,
                },
                entities: {
                    type: 'array',
                    description:
                        'The entities to display in this series (not required for pie charts)',
                    items: {
                        type: 'object',
                        properties: {
                            entity: {
                                type: 'string',
                                description: 'The entity ID',
                                required: true,
                            },
                            name: {
                                type: 'string',
                                description: 'The display name for this entity (optional)',
                            },
                            action: {
                                type: 'select',
                                options: ['more-info', 'navigate'],
                                description: 'The action to perform when clicking on this entity',
                            },
                            path: {
                                type: 'string',
                                description:
                                    'The path to navigate to (required if action is navigate)',
                            },
                            offsetXs: {
                                type: 'number',
                                description: 'Offset in seconds for the X-axis values',
                            },
                            yMultiplier: {
                                type: 'number',
                                description: 'Multiplier for the Y-axis values',
                            },
                            yUnits: {
                                type: 'string',
                                description: 'Custom units for the Y-axis values',
                            },
                            fill: {
                                type: 'string',
                                description: 'Custom fill color for the series',
                            },
                            stroke: {
                                type: 'string',
                                description: 'Custom stroke color for the series',
                            },
                        },
                    },
                },
                stacked: {
                    type: 'boolean',
                    description: 'Whether to stack the series (for area and bar charts)',
                },
                minY: {
                    type: 'number',
                    description: 'Minimum Y-axis value',
                },
                maxY: {
                    type: 'number',
                    description: 'Maximum Y-axis value',
                },
            },
        },
    },
    entities: {
        type: 'array',
        description: 'The entities to display in the chart',
        items: {
            type: 'string',
            description: 'The entity ID',
        },
    },
    refresh: {
        type: 'number',
        description: 'Refresh interval in seconds',
        default: 5,
    },
    interval: {
        type: 'select',
        options: ['5minutes'],
        description: 'The interval for data points',
        default: '5minutes',
    },
    period: {
        type: 'number',
        description: 'The period in days to display',
        default: 1,
    },
    legend: {
        type: 'select',
        options: ['left', 'right', 'top', 'bottom', 'none'],
        description: 'The position of the legend',
    },
    yAxis: {
        type: 'select',
        options: ['visible', 'hidden'],
        description: 'Whether to show or hide the Y-axis',
        default: 'visible',
    },
    total: {
        type: 'string',
        description: 'The entity ID to use for the total value',
    },
    totalMultiplier: {
        type: 'number',
        description: 'Multiplier for the total value',
        default: 1,
    },
    unknownName: {
        type: 'string',
        description: 'The name to use for unknown values',
        default: 'Unknown',
    },
};
