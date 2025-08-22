<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { mode } from "mode-watcher";
    import { toast } from "svelte-sonner";
    // Lazy-load uPlot on client to avoid SSR window/document access
    import "uplot/dist/uPlot.min.css";

    const { title = "Custom graph", data = $bindable([]) } = $props();

    let chartEl: HTMLDivElement | null = $state(null);
    let containerEl: HTMLDivElement | null = $state(null);
    let valueEl: HTMLDivElement | null = $state(null);
    let uplot: any = $state(null);
    let UPlotConstructor: any = $state(null);
    let resizeObserver: ResizeObserver | null = $state(null);

    // Color palettes for different themes
    const lightModeColors = [
        "#3B82F6", // Blue
        "#10B981", // Emerald
        "#F59E0B", // Amber
        "#EF4444", // Red
        "#8B5CF6", // Purple
        "#06B6D4", // Cyan
        "#F97316", // Orange
        "#84CC16", // Lime
    ];

    const darkModeColors = [
        "#60A5FA", // Light Blue
        "#34D399", // Light Emerald
        "#FBBF24", // Light Amber
        "#F87171", // Light Red
        "#A78BFA", // Light Purple
        "#22D3EE", // Light Cyan
        "#FB923C", // Light Orange
        "#A3E635", // Light Lime
    ];

    // Get theme-aware colors
    function getThemeColors() {
        return $mode === "dark" ? darkModeColors : lightModeColors;
    }

    // Check if data is empty or has no meaningful data
    function isDataEmpty() {
        if (!data || data.length === 0) return true;

        // Check if we have at least x-axis data and one series with data
        if (data.length < 2) return true;

        // Check if x-axis has data
        if (!data[0] || data[0].length === 0) return true;

        // Check if at least one series has data
        const hasDataInSeries = data
            .slice(1)
            .some(
                (series) =>
                    series &&
                    series.length > 0 &&
                    series.some(
                        (value: any) => value !== null && value !== undefined,
                    ),
            );

        return !hasDataInSeries;
    }

    // Get theme-aware styling
    function getThemeStyles() {
        const isDark = $mode === "dark";
        return {
            backgroundColor: isDark ? "#1F2937" : "#FFFFFF", // Dark gray or white
            textColor: isDark ? "#F3F4F6" : "#111827", // Light gray or dark gray
            gridColor: isDark ? "#374151" : "#E5E7EB", // Dark grid or light grid
            axisColor: isDark ? "#9CA3AF" : "#6B7280", // Medium gray
        };
    }

    // Function to get responsive dimensions
    function getResponsiveDimensions() {
        if (!containerEl) return { width: 800, height: 400 };

        const containerWidth = containerEl.offsetWidth;
        const width = Math.max(300, containerWidth - 40); // Min width with padding
        const height = Math.max(250, Math.min(600, width * 0.5)); // Responsive height with limits

        return { width, height };
    }

    // Dynamic options with responsive sizing and theme-aware colors
    function getOptions() {
        const { width, height } = getResponsiveDimensions();
        const colors = getThemeColors();
        const themeStyles = getThemeStyles();

        return {
            id: "responsive-chart",
            class: "responsive-chart",
            width,
            height,
            cursor: {
                show: true,
                sync: {
                    key: "sync",
                },
            },
            select: {
                show: true,
                over: true,
                left: 12,
                width: 12,
                top: 12,
                height: 12,
            },
            legend: {
                show: true,
                live: true,
            },
            axes: [
                {
                    stroke: themeStyles.axisColor,
                    grid: {
                        stroke: themeStyles.gridColor,
                        width: 1,
                    },
                },
                {
                    stroke: themeStyles.axisColor,
                    grid: {
                        stroke: themeStyles.gridColor,
                        width: 1,
                    },
                },
            ],
            series: [
                {}, // x-axis (time)
                ...data.slice(1).map((_, index) => ({
                    show: true,
                    spanGaps: false,
                    label: `Series ${index + 1}`,
                    value: (self: any, rawValue: any) =>
                        rawValue == null ? "" : rawValue.toFixed(2),
                    stroke: colors[index % colors.length],
                    width: 2,
                    fill: `${colors[index % colors.length]}20`, // 20% opacity
                    points: {
                        show: true,
                        size: 4,
                        stroke: colors[index % colors.length],
                        fill: themeStyles.backgroundColor,
                    },
                })),
            ],
            // hooks: {
            //     setCursor: [
            //         (u: any) => {
            //             if (u.cursor.idx != null) {
            //                 const idx = u.cursor.idx;
            //                 const xVal = u.data[0][idx];
            //                 const yVal = u.data[1][idx];
            //                 if (valueEl) {
            //                     valueEl.textContent = `x: ${new Date(xVal * 1000).toLocaleString()}, y: ${yVal}`;
            //                 }
            //             } else {
            //                 if (valueEl) {
            //                     valueEl.textContent = "x: -, y: -";
            //                 }
            //             }
            //         },
            //     ],
            // },
        };
    }

    let currentMode = $state($mode);
    let lastDataHash = $state("");

    // Function to update chart with new theme
    function updateChartTheme() {
        if (uplot && chartEl && UPlotConstructor && !isDataEmpty()) {
            try {
                // Destroy current chart
                uplot.destroy();

                // Create new chart with updated theme
                const opts = getOptions();
                uplot = new UPlotConstructor(opts, data, chartEl);
            } catch (error) {
                toast.error("Failed to update chart theme", {
                    description:
                        error instanceof Error
                            ? error.message
                            : "Unknown error occurred",
                });
            }
        }
    }

    // Watch for mode changes and update chart
    $effect(() => {
        if (currentMode !== $mode) {
            currentMode = $mode;
            updateChartTheme();
        }
    });

    // Watch for data changes and update/recreate chart
    $effect(() => {
        const currentDataHash = JSON.stringify(data);
        if (currentDataHash === lastDataHash) {
            return; // No change in data
        }
        lastDataHash = currentDataHash;

        // If we have a chart and valid data, try to update it
        if (uplot && UPlotConstructor && !isDataEmpty()) {
            try {
                // Try to update data in place first
                uplot.setData(data);
            } catch (error) {
                // If update fails, recreate the chart
                toast.error("Failed to update chart data", {
                    description:
                        error instanceof Error
                            ? error.message
                            : "Unknown error occurred",
                });
                try {
                    uplot.destroy();
                    const opts = getOptions();
                    uplot = new UPlotConstructor(opts, data, chartEl);
                } catch (recreateError) {
                    toast.error("Failed to recreate chart", {
                        description:
                            recreateError instanceof Error
                                ? recreateError.message
                                : "Unknown error occurred",
                    });
                    uplot = null;
                }
            }
        } else if (uplot && isDataEmpty()) {
            // Destroy chart if data becomes empty
            try {
                uplot.destroy();
                uplot = null;
            } catch (error) {
                toast.error("Failed to destroy chart", {
                    description:
                        error instanceof Error
                            ? error.message
                            : "Unknown error occurred",
                });
                uplot = null;
            }
        } else if (!uplot && !isDataEmpty() && UPlotConstructor && chartEl) {
            // Create chart if we have data but no chart yet
            try {
                const opts = getOptions();
                uplot = new UPlotConstructor(opts, data, chartEl);
            } catch (error) {
                toast.error("Failed to create chart", {
                    description:
                        error instanceof Error
                            ? error.message
                            : "Unknown error occurred",
                });
            }
        }
    });

    // Watch for UPlotConstructor availability and create chart if data is ready
    $effect(() => {
        if (UPlotConstructor && !uplot && !isDataEmpty() && chartEl) {
            try {
                const opts = getOptions();
                uplot = new UPlotConstructor(opts, data, chartEl);
            } catch (error) {
                toast.error("Failed to initialize chart", {
                    description:
                        error instanceof Error
                            ? error.message
                            : "Unknown error occurred",
                });
            }
        }
    });

    onMount(() => {
        let destroyed = false;

        // Initialize the uPlot constructor
        import("uplot")
            .then(({ default: UPlot }) => {
                if (!destroyed) {
                    UPlotConstructor = UPlot;

                    // Set up resize observer for responsive behavior
                    if (window.ResizeObserver && containerEl) {
                        resizeObserver = new ResizeObserver((entries) => {
                            if (uplot && !destroyed) {
                                try {
                                    const { width, height } =
                                        getResponsiveDimensions();
                                    uplot.setSize({ width, height });
                                } catch (error) {
                                    toast.error("Failed to resize chart", {
                                        description:
                                            error instanceof Error
                                                ? error.message
                                                : "Unknown error occurred",
                                    });
                                }
                            }
                        });
                        resizeObserver.observe(containerEl);
                    }
                }
            })
            .catch((error) => {
                if (!destroyed) {
                    toast.error("Failed to load chart library", {
                        description:
                            error instanceof Error
                                ? error.message
                                : "Unknown error occurred",
                    });
                }
            });

        return () => {
            destroyed = true;
            try {
                resizeObserver?.disconnect();
                uplot?.destroy();
            } catch (error) {
                toast.error("Error cleaning up chart", {
                    description:
                        error instanceof Error
                            ? error.message
                            : "Unknown error occurred",
                });
            }
            uplot = null;
            resizeObserver = null;
        };
    });

    onDestroy(() => {
        try {
            resizeObserver?.disconnect();
            uplot?.destroy();
        } catch (error) {
            toast.error("Error destroying chart", {
                description:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    });
</script>

<div bind:this={containerEl} class="chart-container">
    <div class="chart-header">
        <h2 class="chart-title">{title}</h2>
    </div>
    <div class="chart-wrapper">
        {#if isDataEmpty()}
            <div class="no-data-message">
                <div class="no-data-icon">📊</div>
                <h3 class="no-data-title">No data in this time range</h3>
                <p class="no-data-subtitle">
                    Try adjusting your time range or filters to see data.
                </p>
            </div>
        {:else}
            <div bind:this={chartEl} class="chart-element"></div>
            <!-- <div bind:this={valueEl}>x: -, y: -</div> -->
        {/if}
    </div>
</div>

<style>
    .chart-container {
        width: 100%;
        max-width: 100%;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        transition:
            background-color 0.3s ease,
            box-shadow 0.3s ease;
    }

    :global(.dark) .chart-container {
        background: #1f2937;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    }

    .chart-header {
        padding: 16px 20px;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
        transition:
            background-color 0.3s ease,
            border-color 0.3s ease;
    }

    :global(.dark) .chart-header {
        background: #111827;
        border-bottom: 1px solid #374151;
    }

    .chart-title {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #111827;
        transition: color 0.3s ease;
    }

    :global(.dark) .chart-title {
        color: #f3f4f6;
    }

    .chart-wrapper {
        padding: 20px;
        width: 100%;
        overflow-x: auto;
    }

    .chart-element {
        width: 100%;
        min-height: 250px;
    }

    .no-data-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 250px;
        text-align: center;
        padding: 40px 20px;
        color: #6b7280;
        transition: color 0.3s ease;
    }

    :global(.dark) .no-data-message {
        color: #9ca3af;
    }

    .no-data-icon {
        font-size: 3rem;
        margin-bottom: 16px;
        opacity: 0.5;
    }

    .no-data-title {
        margin: 0 0 8px 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: #374151;
        transition: color 0.3s ease;
    }

    :global(.dark) .no-data-title {
        color: #d1d5db;
    }

    .no-data-subtitle {
        margin: 0;
        font-size: 0.875rem;
        color: #6b7280;
        transition: color 0.3s ease;
    }

    :global(.dark) .no-data-subtitle {
        color: #9ca3af;
    }

    /* uPlot styling overrides for better appearance */
    :global(.responsive-chart) {
        font-family:
            system-ui,
            -apple-system,
            sans-serif;
    }

    :global(.responsive-chart .u-legend) {
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        padding: 8px;
        transition:
            background-color 0.3s ease,
            border-color 0.3s ease;
    }

    :global(.dark .responsive-chart .u-legend) {
        background: rgba(31, 41, 55, 0.95);
        border: 1px solid #374151;
        color: #f3f4f6;
    }

    :global(.responsive-chart .u-legend .u-series) {
        padding: 4px 8px;
        margin: 2px 0;
        border-radius: 4px;
        transition: background-color 0.3s ease;
    }

    :global(.responsive-chart .u-legend .u-series:hover) {
        background: #f3f4f6;
    }

    :global(.dark .responsive-chart .u-legend .u-series:hover) {
        background: #374151;
    }

    :global(.responsive-chart .u-cursor-pt) {
        border-radius: 50%;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: border-color 0.3s ease;
    }

    :global(.dark .responsive-chart .u-cursor-pt) {
        border: 2px solid #1f2937;
    }

    /* Responsive breakpoints */
    @media (max-width: 768px) {
        .chart-header {
            padding: 12px 16px;
        }

        .chart-wrapper {
            padding: 16px;
        }

        .chart-title {
            font-size: 1rem;
        }
    }
</style>
