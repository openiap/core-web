<script lang="ts">
    import { onMount, onDestroy } from "svelte";
    import { mode } from "mode-watcher";
    import { toast } from "svelte-sonner";
    // Lazy-load uPlot on client to avoid SSR window/document access
    import "uplot/dist/uPlot.min.css";

    const {
        title = "",
        data = $bindable([]),
        series = $bindable([]),
        showlegend = true,
        chartsize = "lg",
    } = $props();

    let chartEl: HTMLDivElement | null = $state(null);
    let containerEl: HTMLDivElement | null = $state(null);
    // let valueEl: HTMLDivElement | null = $state(null);
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
        "#EC4899", // Pink
        "#6366F1", // Indigo
        "#14B8A6", // Teal
        "#F43F5E", // Rose
        "#8B5A2B", // Brown
        "#6B7280", // Gray
        "#DC2626", // Red-600
        "#059669", // Emerald-600
        "#D97706", // Amber-600
        "#7C3AED", // Violet
        "#0891B2", // Sky
        "#EA580C", // Orange-600
        "#65A30D", // Lime-600
        "#DB2777", // Pink-600
        "#4F46E5", // Indigo-600
        "#0D9488", // Teal-600
        "#E11D48", // Rose-600
        "#A3A3A3", // Neutral
        "#991B1B", // Red-800
        "#047857", // Emerald-700
        "#B45309", // Amber-700
        "#6D28D9", // Violet-700
        "#0369A1", // Sky-700
        "#C2410C", // Orange-700
        "#4D7C0F", // Lime-700
        "#BE185D", // Pink-700
        "#3730A3", // Indigo-700
        "#0F766E", // Teal-700
        "#BE123C", // Rose-700
        "#737373", // Neutral-500
        "#7F1D1D", // Red-900
        "#064E3B", // Emerald-900
        "#92400E", // Amber-800
        "#581C87", // Violet-800
        "#0C4A6E", // Sky-800
        "#9A3412", // Orange-800
        "#365314", // Lime-800
        "#9D174D", // Pink-800
        "#312E81", // Indigo-800
        "#134E4A", // Teal-800
        "#9F1239", // Rose-800
        "#525252", // Neutral-600
        "#450A0A", // Red-950
        "#022C22", // Emerald-950
        "#451A03", // Amber-950
        "#2E1065", // Violet-950
        "#082F49", // Sky-950
        "#431407", // Orange-950
        "#1A2E05", // Lime-950
        "#500724", // Pink-950
        "#1E1B4B", // Indigo-950
        "#042F2E", // Teal-950
        "#4C0519", // Rose-950
        "#262626", // Neutral-800
        "#FEE2E2", // Red-100
        "#DCFCE7", // Emerald-100
        "#FEF3C7", // Amber-100
        "#EDE9FE", // Violet-100
        "#E0F2FE", // Sky-100
        "#FFEDD5", // Orange-100
        "#ECFCCB", // Lime-100
        "#FCE7F3", // Pink-100
        "#E0E7FF", // Indigo-100
        "#CCFBF1", // Teal-100
        "#FFE4E6", // Rose-100
        "#F5F5F5", // Neutral-100
        "#FECACA", // Red-200
        "#BBF7D0", // Emerald-200
        "#FDE68A", // Amber-200
        "#DDD6FE", // Violet-200
        "#BAE6FD", // Sky-200
        "#FED7AA", // Orange-200
        "#D9F99D", // Lime-200
        "#FBCFE8", // Pink-200
        "#C7D2FE", // Indigo-200
        "#99F6E4", // Teal-200
        "#FECDD3", // Rose-200
        "#E5E5E5", // Neutral-200
        "#FCA5A5", // Red-300
        "#86EFAC", // Emerald-300
        "#FCD34D", // Amber-300
        "#C4B5FD", // Violet-300
        "#7DD3FC", // Sky-300
        "#FDBA74", // Orange-300
        "#BEF264", // Lime-300
        "#F9A8D4", // Pink-300
        "#A5B4FC", // Indigo-300
        "#5EEAD4", // Teal-300
        "#FDA4AF", // Rose-300
        "#D4D4D4", // Neutral-300
        "#F87171", // Red-400
        "#4ADE80", // Emerald-400
        "#FBBF24", // Amber-400
        "#A78BFA", // Violet-400
        "#38BDF8", // Sky-400
        "#FB923C", // Orange-400
        "#A3E635", // Lime-400
        "#F472B6", // Pink-400
        "#818CF8", // Indigo-400
        "#2DD4BF", // Teal-400
        "#FB7185", // Rose-400
        "#A3A3A3", // Neutral-400
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
        "#F472B6", // Light Pink
        "#818CF8", // Light Indigo
        "#2DD4BF", // Light Teal
        "#FB7185", // Light Rose
        "#D4B886", // Light Brown
        "#9CA3AF", // Light Gray
        "#FCA5A5", // Red-300
        "#86EFAC", // Emerald-300
        "#FCD34D", // Amber-300
        "#C4B5FD", // Violet-300
        "#7DD3FC", // Sky-300
        "#FDBA74", // Orange-300
        "#BEF264", // Lime-300
        "#F9A8D4", // Pink-300
        "#A5B4FC", // Indigo-300
        "#5EEAD4", // Teal-300
        "#FDA4AF", // Rose-300
        "#D1D5DB", // Gray-300
        "#F87171", // Red-400
        "#4ADE80", // Emerald-400
        "#FBBF24", // Amber-400
        "#A78BFA", // Violet-400
        "#38BDF8", // Sky-400
        "#FB923C", // Orange-400
        "#A3E635", // Lime-400
        "#F472B6", // Pink-400
        "#818CF8", // Indigo-400
        "#2DD4BF", // Teal-400
        "#FB7185", // Rose-400
        "#9CA3AF", // Gray-400
        "#EF4444", // Red-500
        "#10B981", // Emerald-500
        "#F59E0B", // Amber-500
        "#8B5CF6", // Violet-500
        "#0EA5E9", // Sky-500
        "#F97316", // Orange-500
        "#84CC16", // Lime-500
        "#EC4899", // Pink-500
        "#6366F1", // Indigo-500
        "#14B8A6", // Teal-500
        "#F43F5E", // Rose-500
        "#6B7280", // Gray-500
        "#DC2626", // Red-600
        "#059669", // Emerald-600
        "#D97706", // Amber-600
        "#7C3AED", // Violet-600
        "#0284C7", // Sky-600
        "#EA580C", // Orange-600
        "#65A30D", // Lime-600
        "#DB2777", // Pink-600
        "#4F46E5", // Indigo-600
        "#0D9488", // Teal-600
        "#E11D48", // Rose-600
        "#4B5563", // Gray-600
        "#B91C1C", // Red-700
        "#047857", // Emerald-700
        "#B45309", // Amber-700
        "#6D28D9", // Violet-700
        "#0369A1", // Sky-700
        "#C2410C", // Orange-700
        "#4D7C0F", // Lime-700
        "#BE185D", // Pink-700
        "#3730A3", // Indigo-700
        "#0F766E", // Teal-700
        "#BE123C", // Rose-700
        "#374151", // Gray-700
        "#991B1B", // Red-800
        "#065F46", // Emerald-800
        "#92400E", // Amber-800
        "#5B21B6", // Violet-800
        "#075985", // Sky-800
        "#9A3412", // Orange-800
        "#3F6212", // Lime-800
        "#9D174D", // Pink-800
        "#3730A3", // Indigo-800
        "#115E59", // Teal-800
        "#9F1239", // Rose-800
        "#1F2937", // Gray-800
        "#7F1D1D", // Red-900
        "#064E3B", // Emerald-900
        "#78350F", // Amber-900
        "#4C1D95", // Violet-900
        "#0C4A6E", // Sky-900
        "#7C2D12", // Orange-900
        "#365314", // Lime-900
        "#831843", // Pink-900
        "#312E81", // Indigo-900
        "#134E4A", // Teal-900
        "#881337", // Rose-900
        "#111827", // Gray-900
        "#450A0A", // Red-950
        "#022C22", // Emerald-950
        "#451A03", // Amber-950
        "#2E1065", // Violet-950
        "#082F49", // Sky-950
        "#431407", // Orange-950
        "#1A2E05", // Lime-950
        "#500724", // Pink-950
        "#1E1B4B", // Indigo-950
        "#042F2E", // Teal-950
        "#4C0519", // Rose-950
        "#030712", // Gray-950
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
        let { width, height } = getResponsiveDimensions();
        if (chartsize == "sm") {
            height = Math.abs(height / 3); // Adjust height for chartsize padding
            // width = Math.abs(width / 3); // Adjust width for chartsize padding
        }

        const colors = getThemeColors();
        const themeStyles = getThemeStyles();
        let finalseries: any[] = [];
        let _series = [{}, ...series]; // Ensure first series is always empty for x-axis
        if (series.length > 0) {
            // here i want to update the series with the styling and color dont touch the value and label
            finalseries = _series.map((s, index) => {
                if (index != 0) {
                    return {
                        ...s,
                        show: true,
                        spanGaps: false,
                        // label: s.label || `Series ${index + 1}`,
                        // value: (self: any, rawValue: any) =>
                        //     rawValue == null ? "" : rawValue.toFixed(2),
                        stroke: colors[index - (1 % colors.length)],
                        width: 2,
                        fill: `${colors[index - (1 % colors.length)]}20`, // 20% opacity
                        points: {
                            show: true,
                            size: 4,
                            stroke: colors[index - (1 % colors.length)],
                            fill: themeStyles.backgroundColor,
                        },
                    };
                }
            });
            // finalseries = [{}, ...series];
        } else {
            finalseries = [
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
            ];
        }
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
                show: showlegend,
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
            series: finalseries,
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
                                    let { width, height } =
                                        getResponsiveDimensions();
                                    if (chartsize == "sm") {
                                        height = Math.abs(height / 3); // Adjust height for chartsize padding
                                        // width = Math.abs(width / 3); // Adjust width for chartsize padding
                                    }
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

<div
    bind:this={containerEl}
    class="w-full max-w-full mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-md overflow-hidden transition-all duration-300 ease-in-out"
>
    {#if title !== ""}
        <div
            class="px-5 py-4 md:px-4 md:py-3 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 transition-all duration-300 ease-in-out"
        >
            <h2
                class="m-0 text-lg md:text-base font-semibold text-gray-900 dark:text-gray-100 transition-colors duration-300 ease-in-out"
            >
                {title}
            </h2>
        </div>
    {/if}
    <div class="p-5 md:p-4 w-full overflow-x-auto">
        {#if isDataEmpty()}
            <div
                class="flex flex-col items-center justify-center min-h-[250px] text-center py-10 px-5 text-gray-500 dark:text-gray-400 transition-colors duration-300 ease-in-out"
            >
                <div class="text-5xl mb-4 opacity-50">📊</div>
                <h3
                    class="m-0 mb-2 text-xl font-semibold text-gray-700 dark:text-gray-300 transition-colors duration-300 ease-in-out"
                >
                    No data in this time range
                </h3>
                <p
                    class="m-0 text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300 ease-in-out"
                >
                    Try adjusting your time range or filters to see data.
                </p>
            </div>
        {:else}
            <div bind:this={chartEl} class="w-full min-h-[200px]"></div>
            <!-- <div bind:this={valueEl}>x: -, y: -</div> -->
        {/if}
    </div>
</div>

<style>
    /* uPlot styling overrides for better appearance */
    :global(.responsive-chart) {
        font-family:
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            Roboto,
            "Helvetica Neue",
            Arial,
            "Noto Sans",
            sans-serif;
    }

    :global(.responsive-chart .u-legend) {
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgb(229, 231, 235);
        border-radius: 6px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        padding: 8px;
        transition:
            background-color 0.3s ease,
            border-color 0.3s ease;
    }

    :global(.dark .responsive-chart .u-legend) {
        background: rgba(31, 41, 55, 0.95);
        border: 1px solid rgb(55, 65, 81);
        color: rgb(243, 244, 246);
    }

    :global(.responsive-chart .u-legend .u-series) {
        padding: 4px 8px;
        margin: 2px 0;
        border-radius: 4px;
        transition: background-color 0.3s ease;
    }

    :global(.responsive-chart .u-legend .u-series:hover) {
        background: rgb(243, 244, 246);
    }

    :global(.dark .responsive-chart .u-legend .u-series:hover) {
        background: rgb(55, 65, 81);
    }

    :global(.responsive-chart .u-cursor-pt) {
        border-radius: 50%;
        border: 2px solid rgb(255, 255, 255);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: border-color 0.3s ease;
    }

    :global(.dark .responsive-chart .u-cursor-pt) {
        border: 2px solid rgb(31, 41, 55);
    }
</style>
