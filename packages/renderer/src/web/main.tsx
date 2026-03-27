import React from "react";
import { createRoot } from "react-dom/client";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveScatterPlot } from "@nivo/scatterplot";
import { ResponsiveRadar } from "@nivo/radar";
import { WidthProvider, Responsive as ResponsiveGridLayout } from "react-grid-layout";
import type {
  AggregationConfig,
  Chart,
  ChartPresentation,
  Dashboard,
  DashboardFilter,
  DatasetChartSource,
  DonutChart,
  LineChart,
  NumberFormat,
  ThemePreset,
  Dataset
} from "@mcp-dashboard/shared";
import { dashboardSchema, datasetSchema } from "@mcp-dashboard/shared";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./luminon.css";
import "./landing-themes.css";
import breezeLogoUrl from "./assets/logo.svg";

const IS_STATIC_DEMO = import.meta.env.VITE_STATIC_DEMO === "true";
let staticDataPromise: Promise<{ dashboards: Dashboard[]; datasets: Dataset[] }> | null = null;

async function loadStaticData(): Promise<{ dashboards: Dashboard[]; datasets: Dataset[] }> {
  if (!staticDataPromise) {
    staticDataPromise = fetch("/demo-data.json").then(async (res) => {
      const payload = (await res.json()) as { dashboards?: Dashboard[]; datasets?: Dataset[] };
      return {
        dashboards: (payload.dashboards ?? []).map((dashboard) => dashboardSchema.parse(dashboard)),
        datasets: (payload.datasets ?? []).map((dataset) => datasetSchema.parse(dataset))
      };
    });
  }
  return staticDataPromise;
}

type UiTheme = "" | "theme-dark";
const UI_THEMES: UiTheme[] = ["", "theme-dark"];
const LEGACY_THEME_CLASSES = ["theme-forest"];

const GridLayout = WidthProvider(ResponsiveGridLayout);
const compactNumber = Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
type KpiIconName = NonNullable<ChartPresentation["icon"]>;
const MONTH_INDEX = new Map([
  ["jan", 1],
  ["january", 1],
  ["feb", 2],
  ["february", 2],
  ["mar", 3],
  ["march", 3],
  ["apr", 4],
  ["april", 4],
  ["may", 5],
  ["jun", 6],
  ["june", 6],
  ["jul", 7],
  ["july", 7],
  ["aug", 8],
  ["august", 8],
  ["sep", 9],
  ["sept", 9],
  ["september", 9],
  ["oct", 10],
  ["october", 10],
  ["nov", 11],
  ["november", 11],
  ["dec", 12],
  ["december", 12]
]);

type QuickstartGuide = {
  id: string;
  title: string;
  eyebrow?: string;
  description: string;
  pathLabel?: string;
  pathValue?: string;
  note?: string;
  code: string;
  codeLang: "bash" | "json" | "toml" | "text";
};

const QUICK_PROMPTS = [
  { title: "List dashboards", text: "List all dashboards available" },
  { title: "List datasets", text: "List all datasets available" },
  { title: "List themes", text: "List all available themes" },
  { title: "Marketing details", text: "Show details for the \"Marketing Campaign Command Center\" dashboard" },
  { title: "Marketing dataset", text: "Show the dataset used by the \"Marketing Campaign Command Center\" dashboard" },
  { title: "Swap charts", text: "Swap the charts \"Spend and Revenue by Period\" and \"Sales Share by Category\" in the \"Sales Performance Hub\" dashboard" },
  { title: "Columns", text: "Set the chart \"Sales by Country and Channel\" in \"Sales Performance Hub\" to two columns" },
  { title: "Chart theme", text: "Change the chart \"Spend and Revenue by Period\" to the clean theme" },
  { title: "Dashboard theme", text: "Change the dashboard \"Sales Performance Hub\" to the dark_analytics theme" }
];

// Keep this quickstart copy aligned with the published documentation and landing page.
const QUICKSTART_GUIDES: QuickstartGuide[] = [
  {
    id: "quick-start",
    title: "Quick start",
    eyebrow: "General install",
    description:
      "Use the MCP server through npx. The renderer is optional and useful when you want a local dashboard preview in the browser.",
    note: "Use the client-specific snippets below for Claude Desktop, Gemini CLI, Codex, or Perplexity Desktop. Switch to ultra-lite if your AI client has a very small daily quota.",
    code: `npx -y @luminondev/mcp-dashboard mcp --mode lite\nnpx -y @luminondev/mcp-dashboard start renderer`,
    codeLang: "bash"
  },
  {
    id: "claude-desktop",
    title: "Claude Desktop",
    description: "Add Luminon to Claude Desktop as a local stdio MCP server, then restart Claude.",
    pathLabel: "Default config path",
    pathValue:
      "macOS: ~/Library/Application Support/Claude/claude_desktop_config.json | Windows: %APPDATA%/Claude/claude_desktop_config.json",
    note: "If you already have other MCP servers configured, merge this inside your existing mcpServers object.",
    code: `{\n  \"mcpServers\": {\n    \"luminon\": {\n      \"command\": \"npx\",\n      \"args\": [\"-y\", \"@luminondev/mcp-dashboard\", \"mcp\", \"--mode\", \"lite\"]\n    }\n  }\n}`,
    codeLang: "json"
  },
  {
    id: "gemini-cli",
    title: "Gemini CLI",
    description: "Add Luminon to your Gemini CLI settings so it starts automatically as an MCP server.",
    pathLabel: "Default config path",
    pathValue: "macOS/Linux: ~/.gemini/settings.json | Windows: %USERPROFILE%\\\\.gemini\\\\settings.json",
    note: "Keep any existing Gemini CLI settings and add luminon under mcpServers. Ultra-lite is usually the safest choice for quota-limited Gemini sessions.",
    code: `{\n  \"mcpServers\": {\n    \"luminon\": {\n      \"command\": \"npx\",\n      \"args\": [\"-y\", \"@luminondev/mcp-dashboard\", \"mcp\", \"--mode\", \"ultra-lite\"]\n    }\n  }\n}`,
    codeLang: "json"
  },
  {
    id: "codex",
    title: "Codex",
    description: "Configure Luminon in Codex once and reuse it from the CLI or the IDE extension.",
    pathLabel: "Default config path",
    pathValue: "~/.codex/config.toml",
    note: "Codex also supports adding MCP servers with commands, but the config file is the cleanest copy-paste setup.",
    code: `[mcp_servers.luminon]\ncommand = \"npx\"\nargs = [\"-y\", \"@luminondev/mcp-dashboard\", \"mcp\", \"--mode\", \"lite\"]`,
    codeLang: "toml"
  },
  {
    id: "perplexity-desktop",
    title: "Perplexity Desktop",
    description:
      "Perplexity Desktop currently supports local MCP connectors from the Mac app settings instead of a JSON config file.",
    pathLabel: "Where to add it",
    pathValue: "Perplexity Mac app -> Settings -> Connectors -> Add Connector",
    note: "Perplexity documents local MCP support for the macOS app. Enter the command below in the Add Connector form.",
    code: `npx -y @luminondev/mcp-dashboard mcp --mode lite`,
    codeLang: "bash"
  }
];

type PresetStyle = {
  colors: { scheme: "set2" | "nivo" | "category10" | "paired" | "tableau10" };
  cardBg: string;
  cardBorder: string;
  axisText: string;
  labelText: string;
  titleText: string;
  gridStroke: string;
  surface: "light" | "dark";
};

const PRESET_STYLES: Record<ThemePreset, PresetStyle> = {
  clean: {
    colors: { scheme: "set2" },
    cardBg: "#f9f9fb",
    cardBorder: "#d8d8de",
    axisText: "#111111",
    labelText: "#111111",
    titleText: "#4f46e5",
    gridStroke: "#d1d5db",
    surface: "light"
  },
  business: {
    colors: { scheme: "tableau10" },
    cardBg: "#f8fafc",
    cardBorder: "#cbd5e1",
    axisText: "#111111",
    labelText: "#111111",
    titleText: "#0f766e",
    gridStroke: "#cbd5e1",
    surface: "light"
  },
  dark_analytics: {
    colors: { scheme: "nivo" },
    cardBg: "#1f2937",
    cardBorder: "#374151",
    axisText: "#ffffff",
    labelText: "#ffffff",
    titleText: "#93c5fd",
    gridStroke: "rgba(255,255,255,0.1)",
    surface: "dark"
  },
  pastel: {
    colors: { scheme: "paired" },
    cardBg: "#fffaf5",
    cardBorder: "#fde7d4",
    axisText: "#111111",
    labelText: "#111111",
    titleText: "#c2410c",
    gridStroke: "#f1d4bb",
    surface: "light"
  },
  high_contrast: {
    colors: { scheme: "category10" },
    cardBg: "#ffffff",
    cardBorder: "#111827",
    axisText: "#000000",
    labelText: "#000000",
    titleText: "#7c2d12",
    gridStroke: "#9ca3af",
    surface: "light"
  },
  textured: {
    colors: { scheme: "nivo" },
    cardBg: "#f7f7fa",
    cardBorder: "#d0d4dd",
    axisText: "#111111",
    labelText: "#111111",
    titleText: "#7c3aed",
    gridStroke: "#d1d5db",
    surface: "light"
  }
};

function resolvePreset(dashboardTheme?: ThemePreset, chartTheme?: ThemePreset): PresetStyle {
  const preset = chartTheme ?? dashboardTheme ?? "clean";
  return PRESET_STYLES[preset] ?? PRESET_STYLES.clean;
}

type EffectivePresentation = {
  fontFamily?: string;
  titleFontFamily?: string;
  titleColor: string;
  axisColor: string;
  labelColor: string;
  gridColor: string;
  showLegend: boolean;
  showGrid: boolean;
  showLabels: boolean;
  numberFormat: NumberFormat;
  currency?: string;
  decimals: number;
  margin: { top: number; right: number; bottom: number; left: number };
  animate: boolean;
};

function resolvePresentation(
  dashboardPresentation: ChartPresentation | undefined,
  chartPresentation: ChartPresentation | undefined,
  preset: PresetStyle
): EffectivePresentation {
  const mergedMargin = {
    top: 20,
    right: 40,
    bottom: 52,
    left: 55,
    ...(dashboardPresentation?.margin ?? {}),
    ...(chartPresentation?.margin ?? {})
  };

  const numberFormat = chartPresentation?.numberFormat ?? dashboardPresentation?.numberFormat ?? "compact";
  const decimals = chartPresentation?.decimals ?? dashboardPresentation?.decimals ?? 1;
  return {
    fontFamily: chartPresentation?.fontFamily ?? dashboardPresentation?.fontFamily,
    titleFontFamily: chartPresentation?.titleFontFamily ?? dashboardPresentation?.titleFontFamily,
    titleColor: chartPresentation?.titleColor ?? dashboardPresentation?.titleColor ?? preset.titleText,
    axisColor: chartPresentation?.axisColor ?? dashboardPresentation?.axisColor ?? preset.axisText,
    labelColor: chartPresentation?.labelColor ?? dashboardPresentation?.labelColor ?? preset.labelText,
    gridColor: chartPresentation?.gridColor ?? dashboardPresentation?.gridColor ?? preset.gridStroke,
    showLegend: chartPresentation?.showLegend ?? dashboardPresentation?.showLegend ?? true,
    showGrid: chartPresentation?.showGrid ?? dashboardPresentation?.showGrid ?? true,
    showLabels: chartPresentation?.showLabels ?? dashboardPresentation?.showLabels ?? true,
    numberFormat,
    currency: chartPresentation?.currency ?? dashboardPresentation?.currency,
    decimals,
    margin: mergedMargin,
    animate: chartPresentation?.animate ?? dashboardPresentation?.animate ?? true
  };
}

function formatNumericValue(value: number, presentation: EffectivePresentation): string {
  if (presentation.numberFormat === "currency") {
    const currency = presentation.currency ?? "USD";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: presentation.decimals,
      maximumFractionDigits: presentation.decimals
    }).format(value);
  }
  if (presentation.numberFormat === "percent") {
    return `${value.toFixed(presentation.decimals)}%`;
  }
  if (presentation.numberFormat === "number") {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: presentation.decimals,
      maximumFractionDigits: presentation.decimals
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: presentation.decimals
  }).format(value);
}

function nivoThemeForPreset(preset: PresetStyle, presentation: EffectivePresentation) {
  return {
    background: "transparent",
    grid: {
      line: {
        stroke: presentation.showGrid ? presentation.gridColor : "rgba(0,0,0,0)",
        strokeWidth: 1
      }
    },
    axis: {
      ticks: {
        text: {
          fill: presentation.axisColor,
          fontFamily: presentation.fontFamily
        }
      },
      legend: {
        text: {
          fill: presentation.axisColor,
          fontFamily: presentation.fontFamily,
          fontSize: 14
        }
      }
    },
    labels: {
      text: {
        fill: presentation.labelColor,
        fontFamily: presentation.fontFamily
      }
    },
    legends: {
      text: {
        fill: presentation.axisColor,
        fontFamily: presentation.fontFamily
      }
    },
    tooltip: {
      container: {
        background: "#f9fafb",
        color: "#0f172a",
        border: "1px solid #cbd5e1",
        borderRadius: "10px",
        boxShadow: "0 14px 30px rgba(15, 23, 42, 0.16)",
        fontFamily: presentation.fontFamily ?? "\"Space Grotesk\", \"Manrope\", sans-serif",
        padding: "8px 10px"
      }
    }
  };
}

function patternDefs() {
  return [
    {
      id: "dots",
      type: "patternDots",
      background: "inherit",
      color: "rgba(255,255,255,0.35)",
      size: 4,
      padding: 1,
      stagger: true
    },
    {
      id: "lines",
      type: "patternLines",
      background: "inherit",
      color: "rgba(255,255,255,0.35)",
      rotation: -45,
      lineWidth: 5,
      spacing: 8
    }
  ];
}

function alternatingFill(ids: string[]) {
  return ids.map((id, i) => ({
    match: { id },
    id: i % 2 === 0 ? "dots" : "lines"
  }));
}

function KpiIcon({ name, color }: { name: KpiIconName; color: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };

  if (name === "pulse") {
    return (
      <svg {...common}>
        <path d="M3 12h4l2.5-6 3 12 2.5-6H21" />
      </svg>
    );
  }

  if (name === "target") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="2.4" />
        <path d="M12 3v2.5m0 13V21m9-9h-2.5M5.5 12H3" />
      </svg>
    );
  }

  if (name === "users") {
    return (
      <svg {...common}>
        <path d="M8.5 13.5c-2.1 0-3.8 1.3-3.8 3v.5" />
        <path d="M15.5 13.5c2.1 0 3.8 1.3 3.8 3v.5" />
        <circle cx="8.5" cy="8.5" r="2.8" />
        <circle cx="15.5" cy="8.5" r="2.8" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M4 15.5 9.5 10l3 3L20 6" />
      <path d="M16 6h4v4" />
    </svg>
  );
}

function useDashboards(enabled = true) {
  const [dashboards, setDashboards] = React.useState<Dashboard[]>([]);
  const [loading, setLoading] = React.useState(enabled);
  const retryRef = React.useRef(0);
  const retryTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      if (IS_STATIC_DEMO) {
        const data = await loadStaticData();
        setDashboards(data.dashboards);
        retryRef.current = 0;
        return;
      }
      const res = await fetch("/api/dashboards");
      const payload = (await res.json()) as { dashboards: Dashboard[] };
      setDashboards(payload.dashboards ?? []);
      retryRef.current = 0;
    } catch (error) {
      console.error("Failed to load dashboards", error);
      setDashboards([]);
      if (retryRef.current < 3) {
        const delay = 400 * (retryRef.current + 1);
        retryRef.current += 1;
        if (retryTimer.current) clearTimeout(retryTimer.current);
        retryTimer.current = setTimeout(() => {
          void reload();
        }, delay);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!enabled) return;
    void reload();

    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [enabled, reload]);

  return { dashboards, setDashboards, loading, reload };
}

function getSharedDashboardIdFromPath(): string | null {
  if (typeof window === "undefined") return null;
  const path = window.location.pathname;
  const match = path.match(/^\/dashboards\/([^/]+)\/?$/i);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function useDashboardById(dashboardId: string | null) {
  const [dashboard, setDashboard] = React.useState<Dashboard | null>(null);
  const [loading, setLoading] = React.useState(Boolean(dashboardId));
  const [error, setError] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    if (!dashboardId) return;
    setLoading(true);
    setError(null);

    if (IS_STATIC_DEMO) {
      try {
        const data = await loadStaticData();
        const found = data.dashboards.find((d) => d.id === dashboardId) ?? null;
        setDashboard(found);
        if (!found) setError("Dashboard not found");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load demo data");
      } finally {
        setLoading(false);
      }
      return;
    }

    fetch(`/api/dashboards/${dashboardId}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Dashboard not found (${res.status})`);
        }
        return res.json();
      })
      .then((payload: { dashboard: Dashboard }) => {
        setDashboard(payload.dashboard);
      })
      .catch((err: Error) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [dashboardId]);

  React.useEffect(() => {
    if (!dashboardId) return;
    void reload();

    return undefined;
  }, [dashboardId, reload]);

  return { dashboard, loading, error, reload };
}

function useDatasets() {
  const [datasets, setDatasets] = React.useState<Dataset[]>([]);
  const [loading, setLoading] = React.useState(false);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      if (IS_STATIC_DEMO) {
        const data = await loadStaticData();
        setDatasets(data.datasets);
        return;
      }
      const response = await fetch("/api/datasets");
      const payload = await response.json();
      setDatasets((payload.datasets ?? []) as Dataset[]);
    } catch (error) {
      console.error('Failed to load datasets:', error);
      setDatasets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void reload();
  }, [reload]);

  return { datasets, loading, reload };
}

function countUniqueDatasets(dashboard: Dashboard): number {
  const datasetIds = new Set<string>();
  for (const chart of dashboard.charts) {
    if ('datasetId' in chart && chart.datasetId) {
      datasetIds.add(chart.datasetId);
    }
  }
  return datasetIds.size;
}

function collectDatasetIds(charts: Chart[]): Set<string> {
  const ids = new Set<string>();
  for (const chart of charts) {
    if ("datasetId" in chart && chart.datasetId) ids.add(chart.datasetId);
    const source = inferLegacySource(chart);
    if (source?.datasetId) ids.add(source.datasetId);
  }
  return ids;
}

function EmptyChart() {
  return (
    <div className="luminon-empty-chart">
      <div className="luminon-empty-chart-icon">∅</div>
      <div className="luminon-empty-chart-text">No data matches the current filters</div>
    </div>
  );
}

class ChartErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error rendering chart:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="luminon-chart-error">
          <div className="luminon-chart-error-icon">⚠️</div>
          <div className="luminon-chart-error-text">Chart rendering failed</div>
          <button
            type="button"
            className="luminon-chart-error-retry"
            onClick={() => this.setState({ hasError: false })}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function renderLine(
  chart: LineChart,
  dashboardTheme?: ThemePreset,
  dashboardPresentation?: ChartPresentation
) {
  const preset = resolvePreset(dashboardTheme, chart.themePreset);
  const presentation = resolvePresentation(dashboardPresentation, chart.presentation, preset);
  const seriesField = chart.series;

  if (!chart.data || chart.data.length === 0) {
    return <EmptyChart />;
  }

  const grouped = new Map<string, Array<{ x: string | number; y: number }>>();
  for (const row of chart.data) {
    const x = row[chart.x];
    const y = row[chart.y];
    if (x === undefined || x === null || y === undefined || y === null) continue;

    const yValue = typeof y === "number" ? y : Number(y);
    if (Number.isNaN(yValue)) continue;

    const key = seriesField ? String(row[seriesField] ?? "serie") : "serie";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)?.push({ x: x as string | number, y: yValue });
  }

  const data = Array.from(grouped.entries()).map(([id, points]) => ({
    id,
    data: points
  }));

  if (data.length === 0 || data.every(s => s.data.length === 0)) {
    return <EmptyChart />;
  }

  return (
    <ResponsiveLine
      data={data}
      colors={preset.colors}
      theme={{
        ...nivoThemeForPreset(preset, presentation),
        axis: {
          ticks: {
            text: {
              fill: '#1F6CB0'
            }
          }
        }
      }}
      margin={{
        top: presentation.margin.top,
        right: Math.max(presentation.margin.right, 60),
        bottom: presentation.margin.bottom,
        left: presentation.margin.left
      }}
      xScale={{ type: "point" }}
      yScale={{ type: "linear", min: "auto", max: "auto", stacked: false, reverse: false }}
      axisLeft={{ tickValues: 5, format: (value) => formatNumericValue(Number(value), presentation) }}
      axisBottom={{ tickRotation: -25 }}
      pointSize={8}
      pointBorderWidth={2}
      useMesh
      curve="monotoneX"
      enableGridX={presentation.showGrid}
      enableGridY={presentation.showGrid}
      enablePoints={presentation.showLabels}
      animate={presentation.animate}
      legends={
        presentation.showLegend
          ? [
              {
                anchor: "bottom-right",
                direction: "column",
                justify: false,
                translateX: 60,
                translateY: 0,
                itemWidth: 80,
                itemHeight: 20,
                symbolSize: 12
              }
            ]
          : []
      }
    />
  );
}

function renderTable(
  chart: Extract<Chart, { type: "table" }>,
  dashboardTheme?: ThemePreset,
  dashboardPresentation?: ChartPresentation
) {
  const preset = resolvePreset(dashboardTheme, chart.themePreset);
  const presentation = resolvePresentation(dashboardPresentation, chart.presentation, preset);

  if (!chart.rows || chart.rows.length === 0) {
    return <EmptyChart />;
  }

  const rows = chart.limit ? chart.rows.slice(0, chart.limit) : chart.rows;
  return (
    <div style={{ overflow: "auto", height: "100%" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, fontFamily: presentation.fontFamily }}>
        <thead>
          <tr>
            {chart.columns.map((column) => (
              <th
                key={column}
                style={{
                  textAlign: "left",
                  borderBottom: `1px solid ${preset.cardBorder}`,
                  padding: "8px 6px",
                  color: '#1F6CB0'
                }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`${chart.id}-${idx}`}>
              {chart.columns.map((column) => (
                <td
                  key={column}
                  style={{
                    borderBottom: `1px solid ${preset.cardBorder}`,
                    padding: "8px 6px",
                    color: '#1F6CB0'
                  }}
                >
                  {String(row[column] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderKpiCard(
  chart: Extract<Chart, { type: "kpi_card" }>,
  dashboardTheme?: ThemePreset,
  dashboardPresentation?: ChartPresentation
) {
  const preset = resolvePreset(dashboardTheme, chart.themePreset);
  const presentation = resolvePresentation(dashboardPresentation, chart.presentation, preset);
  const kpiPresentation: EffectivePresentation = {
    ...presentation,
    numberFormat: chart.format ?? presentation.numberFormat,
    currency: chart.currency ?? presentation.currency
  };
  const hasDelta = chart.delta !== undefined && Number.isFinite(chart.delta);
  const isPositive = (chart.delta ?? 0) >= 0;
  const deltaText = hasDelta
    ? `${isPositive ? "+" : "-"}${formatNumericValue(Math.abs(chart.delta ?? 0), kpiPresentation)} ${
        chart.label ?? "vs last period"
      }`.trim()
    : chart.label ?? "";
  const valueText = formatNumericValue(chart.value, kpiPresentation);
  const valueFontSize = valueText.length > 14 ? 28 : valueText.length > 10 ? 32 : valueText.length > 7 ? 36 : 42;
  const surfaceIsDark = preset.surface === "dark";
  const textColor = presentation.titleColor ?? (surfaceIsDark ? "#f8fafc" : "#0f172a");
  const subColor = surfaceIsDark ? "rgba(255,255,255,0.78)" : "#6b7280";
  const iconVariant: KpiIconName = presentation.icon ?? "trend";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        gap: 10,
        padding: "12px 10px 14px",
        borderRadius: 12,
        fontFamily: presentation.fontFamily,
        color: textColor,
        background: "transparent",
        overflow: "hidden"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 12,
            background: surfaceIsDark ? "rgba(255,255,255,0.08)" : "#f3f4f6",
            border: `1px solid ${surfaceIsDark ? "rgba(255,255,255,0.14)" : "#e5e7eb"}`,
            display: "grid",
            placeItems: "center"
          }}
        >
          <KpiIcon name={iconVariant} color={surfaceIsDark ? "#e5e7eb" : "#6b7280"} />
        </div>
      </div>

      <div
        style={{
          fontSize: valueFontSize,
          fontWeight: 800,
          color: textColor,
          lineHeight: 0.96,
          letterSpacing: "-0.02em",
          fontFamily: presentation.titleFontFamily ?? "\"Space Grotesk\", \"Manrope\", sans-serif",
          minWidth: 0,
          overflowWrap: "anywhere",
          wordBreak: "break-word"
        }}
      >
        {valueText}
      </div>

      <div style={{ fontSize: 14, color: subColor, fontWeight: 500 }}>
        {deltaText.trim() || "—"}
      </div>
    </div>
  );
}

function renderDonut(
  chart: DonutChart,
  dashboardTheme?: ThemePreset,
  dashboardPresentation?: ChartPresentation
) {
  const preset = resolvePreset(dashboardTheme, chart.themePreset);
  const presentation = resolvePresentation(dashboardPresentation, chart.presentation, preset);

  if (!chart.data || chart.data.length === 0) {
    return <EmptyChart />;
  }

  const useTexture = (chart.themePreset ?? dashboardTheme) === "textured";
  const fill = useTexture ? alternatingFill(chart.data.map((slice) => String(slice.id))) : [];
  const finalData = [...chart.data].sort((a, b) => b.value - a.value);

  return (
    <ResponsivePie
      data={finalData}
      colors={preset.colors}
      theme={{
        ...nivoThemeForPreset(preset, presentation),
        labels: {
          text: {
            fill: '#1F6CB0',
            fontFamily: presentation.fontFamily
          }
        },
        legends: {
          text: {
            fill: '#1F6CB0'
          }
        }
      }}
      margin={{
        top: Math.max(presentation.margin.top, 10),
        right: Math.max(presentation.margin.right, 12),
        bottom: Math.max(presentation.margin.bottom, 54),
        left: Math.max(presentation.margin.left, 12)
      }}
      innerRadius={0.6}
      padAngle={0.9}
      cornerRadius={3}
      activeOuterRadiusOffset={6}
      arcLinkLabelsSkipAngle={16}
      arcLabelsSkipAngle={16}
      defs={useTexture ? patternDefs() : []}
      fill={fill}
      enableArcLabels={false}
      enableArcLinkLabels={false}
      animate={presentation.animate}
      legends={
        presentation.showLegend
          ? [
              {
                anchor: "bottom",
                direction: "row",
                justify: false,
                translateX: 0,
                translateY: 24,
                itemsSpacing: 6,
                itemWidth: 110,
                itemHeight: 20,
                itemTextColor: "#1F6CB0",
                itemDirection: "left-to-right",
                itemOpacity: 1,
                symbolSize: 10,
                symbolShape: "circle"
              }
            ]
          : []
      }
    />
  );
}

function renderChart(chart: Chart, dashboardTheme?: ThemePreset, dashboardPresentation?: ChartPresentation) {
  const preset = resolvePreset(dashboardTheme, chart.themePreset);
  const presentation = resolvePresentation(dashboardPresentation, chart.presentation, preset);
  const useTexture = (chart.themePreset ?? dashboardTheme) === "textured";

  if (
    chart.type !== "kpi_card" &&
    chart.type !== "table" &&
    "data" in chart &&
    (!Array.isArray(chart.data) || chart.data.length === 0)
  ) {
    return <EmptyChart />;
  }

  if (chart.type === "bar") {
    const fill = useTexture ? alternatingFill([chart.y]) : [];
    return (
      <ResponsiveBar
        data={chart.data as Record<string, string | number>[]}
        keys={[chart.y]}
        indexBy={chart.x}
        theme={{
        ...nivoThemeForPreset(preset, presentation),
        axis: {
          ticks: {
            text: {
              fill: '#1F6CB0'
            }
          }
        }
      }}
        margin={{
          top: presentation.margin.top,
          right: presentation.margin.right,
          bottom: presentation.margin.bottom,
          left: Math.max(presentation.margin.left + 20, 75)
        }}
        padding={0.28}
        colors={preset.colors}
        defs={useTexture ? patternDefs() : []}
        fill={fill}
        axisBottom={{ tickRotation: -20 }}
        axisLeft={{
          tickValues: 5,
          format: (value) => formatNumericValue(Number(value), presentation),
          legend: chart.y,
          legendOffset: -60,
          legendPosition: "middle",
          tickSize: 5,
          tickPadding: 5
        }}
        enableGridX={presentation.showGrid}
        enableGridY={presentation.showGrid}
        labelSkipWidth={presentation.showLabels ? 12 : 9999}
        labelSkipHeight={presentation.showLabels ? 12 : 9999}
        animate={presentation.animate}
      />
    );
  }

  if (chart.type === "bar_grouped" || chart.type === "bar_stacked") {
    const fill = useTexture ? alternatingFill(chart.keys) : [];
    const legendOffsetY = presentation.showLegend ? 64 : 0;
    return (
      <ResponsiveBar
        data={chart.data as Record<string, string | number>[]}
        keys={chart.keys}
        indexBy={chart.indexBy}
        theme={{
        ...nivoThemeForPreset(preset, presentation),
        axis: {
          ticks: {
            text: {
              fill: '#1F6CB0'
            }
          }
        }
      }}
        groupMode={chart.type === "bar_stacked" ? "stacked" : "grouped"}
        margin={{
          top: presentation.margin.top,
          right: presentation.margin.right,
          bottom: Math.max(presentation.margin.bottom, legendOffsetY + 28),
          left: presentation.margin.left
        }}
        padding={0.28}
        colors={preset.colors}
        defs={useTexture ? patternDefs() : []}
        fill={fill}
        axisBottom={{ tickRotation: -20 }}
        axisLeft={{
          tickValues: 5,
          format: (value) => formatNumericValue(Number(value), presentation),
          legend: chart.yLabel ?? "value",
          legendOffset: -42,
          legendPosition: "middle",
          tickSize: 5,
          tickPadding: 5
        }}
        enableGridX={presentation.showGrid}
        enableGridY={presentation.showGrid}
        labelSkipWidth={presentation.showLabels ? 12 : 9999}
        labelSkipHeight={presentation.showLabels ? 12 : 9999}
        animate={presentation.animate}
        legends={
          presentation.showLegend
            ? [
                {
                  dataFrom: "keys",
                  anchor: "bottom",
                  direction: "row",
                  translateY: legendOffsetY,
                  itemWidth: 80,
                  itemHeight: 24,
                  itemsSpacing: 18,
                  symbolSize: 14
                }
              ]
            : []
        }
      />
    );
  }

  if (chart.type === "line") {
    return renderLine(chart, dashboardTheme, dashboardPresentation);
  }

  if (chart.type === "area") {
    return (
      <ResponsiveLine
        data={(() => {
          const grouped = new Map<string, Array<{ x: string | number; y: number }>>();
          for (const row of chart.data) {
            const x = row[chart.x];
            const y = row[chart.y];
            if (x === undefined || x === null || y === undefined || y === null) continue;
            const yValue = typeof y === "number" ? y : Number(y);
            if (Number.isNaN(yValue)) continue;
            const key = chart.series ? String(row[chart.series] ?? "serie") : "serie";
            if (!grouped.has(key)) grouped.set(key, []);
            grouped.get(key)?.push({ x: x as string | number, y: yValue });
          }
          return Array.from(grouped.entries()).map(([id, points]) => ({ id, data: points }));
        })()}
        colors={preset.colors}
        theme={{
        ...nivoThemeForPreset(preset, presentation),
        axis: {
          ticks: {
            text: {
              fill: '#1F6CB0'
            }
          }
        }
      }}
        margin={{
          top: presentation.margin.top,
          right: Math.max(presentation.margin.right, 60),
          bottom: presentation.margin.bottom,
          left: presentation.margin.left
        }}
        xScale={{ type: "point" }}
        yScale={{ type: "linear", min: "auto", max: "auto", stacked: false, reverse: false }}
        axisLeft={{ tickValues: 5, format: (value) => formatNumericValue(Number(value), presentation) }}
        axisBottom={{ tickRotation: -25 }}
        enableGridX={presentation.showGrid}
        enableGridY={presentation.showGrid}
        enableArea
        areaOpacity={0.26}
        pointSize={presentation.showLabels ? 6 : 0}
        useMesh
        curve="linear"
        animate={presentation.animate}
        legends={
          presentation.showLegend
            ? [
                {
                  anchor: "bottom-right",
                  direction: "column",
                  justify: false,
                  translateX: 60,
                  translateY: 0,
                  itemWidth: 80,
                  itemHeight: 20,
                  symbolSize: 12
                }
              ]
            : []
        }
      />
    );
  }

  if (chart.type === "scatter") {
    const seriesMap = new Map<string, Array<{ x: number; y: number }>>();
    for (const point of chart.data as Array<Record<string, unknown>>) {
      const series = chart.series ? String(point.series ?? "serie") : "serie";
      const x = Number(point.x);
      const y = Number(point.y);
      if (Number.isNaN(x) || Number.isNaN(y)) continue;
      if (!seriesMap.has(series)) seriesMap.set(series, []);
      seriesMap.get(series)?.push({ x, y });
    }
    const data = Array.from(seriesMap.entries()).map(([id, pts]) => ({ id, data: pts }));
    return (
      <ResponsiveScatterPlot
        data={data}
        colors={preset.colors}
        theme={nivoThemeForPreset(preset, presentation)}
        margin={{
          top: presentation.margin.top,
          right: Math.max(presentation.margin.right, 60),
          bottom: presentation.margin.bottom,
          left: Math.max(presentation.margin.left, 108)
        }}
        xScale={{ type: "linear", min: "auto", max: "auto" }}
        yScale={{ type: "linear", min: "auto", max: "auto" }}
        axisBottom={{ legend: chart.x ?? "x", legendOffset: 36, legendPosition: "middle" }}
        axisLeft={{
          legend: chart.y ?? "y",
          legendOffset: -90,
          legendPosition: "middle",
          format: (value) => formatNumericValue(Number(value), presentation)
        }}
        useMesh
        enableGridX={presentation.showGrid}
        enableGridY={presentation.showGrid}
        legends={
          presentation.showLegend
            ? [
                {
                  anchor: "bottom-right",
                  direction: "column",
                  translateX: 50,
                  itemWidth: 80,
                  itemHeight: 18,
                  symbolSize: 12
                }
              ]
            : []
        }
      />
    );
  }

  if (chart.type === "radar") {
    const items = chart.data as Array<{ index: string; value: number; series?: string }>;
    const indices = Array.from(new Set(items.map((d) => d.index)));
    const keys = chart.seriesField
      ? Array.from(new Set(items.map((d) => d.series ?? "serie")))
      : ["value"];
    const rows = indices.map((idx) => {
      const row: Record<string, string | number> = { index: idx };
      for (const key of keys) {
        const entry = items.find((d) => d.index === idx && (chart.seriesField ? d.series === key : true));
        row[key] = entry ? entry.value : 0;
      }
      return row;
    });
    const showDenseDotLabels = presentation.showLabels && rows.length <= 5 && keys.length <= 2;
    return (
      <ResponsiveRadar
        data={rows}
        keys={keys}
        indexBy="index"
        theme={{
          ...nivoThemeForPreset(preset, presentation),
          grid: {
            line: {
              strokeWidth: 1
            }
          },
          dots: {
            text: {
              fontSize: 10,
              fontWeight: 600
            }
          },
          labels: {
            text: {
              fontSize: 11,
              fontWeight: 500
            }
          }
        }}
        colors={preset.colors}
        margin={{
          top: 24,
          right: 28,
          bottom: 24,
          left: 28
        }}
        dotSize={6}
        gridLabelOffset={16}
        curve="linearClosed"
        animate={presentation.animate}
        gridLevels={5}
        enableDotLabel={showDenseDotLabels}
        legends={
          presentation.showLegend
            ? [
                {
                  anchor: "top-left",
                  direction: "column",
                  translateX: 0,
                  translateY: 0,
                  itemWidth: 80,
                  itemHeight: 16
                }
              ]
            : []
        }
      />
    );
  }

  if (chart.type === "funnel") {
    return (
      <ResponsiveBar
        data={chart.data.map((stage) => ({ stage: stage.label ?? stage.id, value: stage.value }))}
        keys={["value"]}
        indexBy="stage"
        layout="horizontal"
        theme={{
        ...nivoThemeForPreset(preset, presentation),
        axis: {
          ticks: {
            text: {
              fill: '#1F6CB0'
            }
          }
        }
      }}
        margin={{
          top: presentation.margin.top,
          right: presentation.margin.right,
          bottom: presentation.margin.bottom,
          left: Math.max(presentation.margin.left, 100)
        }}
        padding={0.22}
        colors={preset.colors}
        axisBottom={{ tickValues: 5, format: (value) => formatNumericValue(Number(value), presentation) }}
        axisLeft={{ tickSize: 0 }}
        label={presentation.showLabels ? (d) => formatNumericValue(Number(d.value), presentation) : ""}
        enableGridX={presentation.showGrid}
        enableGridY={presentation.showGrid}
        animate={presentation.animate}
      />
    );
  }

  if (chart.type === "combo") {
    const tickEvery = chart.data.length > 18 ? 3 : chart.data.length > 12 ? 2 : 1;
    const ticks =
      chart.data
        .map((row) => row[chart.x])
        .filter((_, idx) => idx % tickEvery === 0);
    const labelEnabled = chart.data.length <= 14;
    const padding = chart.data.length > 18 ? 0.12 : chart.data.length > 12 ? 0.18 : 0.24;
    return (
      <ResponsiveBar
        data={chart.data as Record<string, string | number>[]}
        keys={[chart.barY]}
        indexBy={chart.x}
        theme={{
        ...nivoThemeForPreset(preset, presentation),
        axis: {
          ticks: {
            text: {
              fill: '#1F6CB0'
            }
          }
        }
      }}
        margin={{
          top: presentation.margin.top,
          right: presentation.margin.right,
          bottom: presentation.margin.bottom,
          left: presentation.margin.left
        }}
        padding={padding}
        colors={preset.colors}
        axisBottom={{ tickRotation: -25, tickValues: ticks }}
        axisLeft={{
          tickValues: 5,
          format: (value) => formatNumericValue(Number(value), presentation),
          legend: chart.barY,
          legendOffset: -42,
          legendPosition: "middle"
        }}
        enableGridX={presentation.showGrid}
        enableGridY={presentation.showGrid}
        label={labelEnabled ? "value" : () => ""}
        labelSkipWidth={labelEnabled ? 12 : 9999}
        labelSkipHeight={labelEnabled ? 12 : 9999}
        animate={presentation.animate}
        layers={[
          "grid",
          "axes",
          "bars",
          ({ bars, yScale }) => {
            if (bars.length === 0) return null;
            const points = bars
              .map((bar) => {
                const raw = (bar.data.data as Record<string, string | number>)[chart.lineY];
                const numeric = typeof raw === "number" ? raw : Number(raw);
                if (Number.isNaN(numeric)) return null;
                return { x: bar.x + bar.width / 2, y: (yScale as (v: number) => number)(numeric) };
              })
              .filter((value): value is { x: number; y: number } => value !== null);
            if (points.length === 0) return null;
            const path = points
              .map((point, idx) => `${idx === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
              .join(" ");
            return (
              <g>
                <path d={path} fill="none" stroke="#dc2626" strokeWidth={2.5} />
                {points.map((point, idx) => (
                  <circle key={`${chart.id}-combo-${idx}`} cx={point.x} cy={point.y} r={4} fill="#dc2626" />
                ))}
              </g>
            );
          },
          "markers",
          "legends"
        ]}
      />
    );
  }

  if (chart.type === "table") {
    return renderTable(chart, dashboardTheme, dashboardPresentation);
  }

  if (chart.type === "kpi_card") {
    return renderKpiCard(chart, dashboardTheme, dashboardPresentation);
  }

  return renderDonut(chart, dashboardTheme, dashboardPresentation);
}

type TableRow = Record<string, string | number | null>;
type MetricAggregation = NonNullable<DatasetChartSource["aggregation"]>;

function toComparableForFilter(v: string | number | null, fieldType: "string" | "number" | "date"): number | string {
  if (v === null) return "";
  if (fieldType === "number") return typeof v === "number" ? v : Number(v);
  if (fieldType === "date") return typeof v === "string" ? Date.parse(v) : (v as number);
  return String(v);
}

function rowPassesFilter(row: TableRow, filter: DashboardFilter): boolean {
  if (!(filter.field in row)) return true;
  if (
    filter.value === "" ||
    filter.value === null ||
    filter.value === undefined ||
    (Array.isArray(filter.value) && filter.value.length === 0)
  ) {
    return true;
  }
  const raw = row[filter.field];
  const left = toComparableForFilter(raw, filter.fieldType);
  const { op, value, valueTo } = filter;

  if (op === "in") {
    const arr = Array.isArray(value) ? value : [value];
    return arr.some((v) => String(toComparableForFilter(v as string | number, filter.fieldType)) === String(left));
  }
  if (op === "not_in") {
    const arr = Array.isArray(value) ? value : [value];
    return !arr.some((v) => String(toComparableForFilter(v as string | number, filter.fieldType)) === String(left));
  }
  const scalar = Array.isArray(value) ? value[0] : value;
  const right = toComparableForFilter(scalar as string | number, filter.fieldType);
  if (op === "eq") return String(left) === String(right);
  if (op === "neq") return String(left) !== String(right);
  if (op === "gte") return left >= right;
  if (op === "lte") return left <= right;
  if (op === "between" && valueTo !== undefined) {
    const rightTo = toComparableForFilter(valueTo, filter.fieldType);
    return left >= right && left <= rightTo;
  }
  return true;
}

function applyFiltersToRows(
  rows: TableRow[],
  filters: DashboardFilter[],
  chartId?: string,
  datasetId?: string
): TableRow[] {
  if (!filters.length) return rows;
  const applicable = filters.filter((f) => {
    if (!f.applyTo || f.applyTo.length === 0) return true;
    if (chartId && f.applyTo.includes(chartId)) return true;
    if (datasetId && f.applyTo.includes(datasetId)) return true;
    return false;
  });
  if (!applicable.length) return rows;
  return rows.filter((row) => applicable.every((f) => rowPassesFilter(row, f)));
}

function toComparable(value: string | number | null): number | string {
  if (value === null) return "";
  if (typeof value === "number") return value;
  const normalized = value.trim().toLowerCase();
  const monthMatch = normalized.match(/^(?:\d{1,2}[-_/ ]?)?([a-z]{3,9})$/);
  if (monthMatch) {
    const monthIndex = MONTH_INDEX.get(monthMatch[1]);
    if (monthIndex !== undefined) return monthIndex;
  }
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber)) return asNumber;
  const asDate = Date.parse(value);
  if (!Number.isNaN(asDate)) return asDate;
  return value;
}

function compareByComparable(
  left: string | number | null | undefined,
  right: string | number | null | undefined
): number {
  const a = left ?? "";
  const b = right ?? "";
  const comparableLeft = toComparable(typeof a === "number" ? a : String(a));
  const comparableRight = toComparable(typeof b === "number" ? b : String(b));
  if (typeof comparableLeft === "number" && typeof comparableRight === "number") {
    return comparableLeft - comparableRight;
  }
  return String(a).localeCompare(String(b));
}

function sortLayoutItems(items: Dashboard["layout"]["items"]) {
  return [...items].sort((left, right) => {
    if (left.y !== right.y) return left.y - right.y;
    if (left.x !== right.x) return left.x - right.x;
    return left.chart.localeCompare(right.chart);
  });
}

function buildResponsiveLayout(
  items: Dashboard["layout"]["items"],
  columns: number
) {
  const ordered = sortLayoutItems(items);
  const maxColumns = ordered.reduce((max, item) => Math.max(max, item.x + item.w), 0);

  if (columns >= maxColumns) {
    return ordered.map((item) => ({
      i: item.chart,
      x: item.x,
      y: item.y,
      w: Math.max(1, Math.min(item.w, columns)),
      h: Math.max(1, item.h),
      static: true
    }));
  }

  let x = 0;
  let y = 0;
  let rowHeight = 0;

  return ordered.map((item) => {
    const w = Math.max(1, Math.min(item.w, columns));
    const h = Math.max(1, item.h);

    if (x + w > columns) {
      y += rowHeight || 1;
      x = 0;
      rowHeight = 0;
    }

    const layoutItem = {
      i: item.chart,
      x,
      y,
      w,
      h,
      static: true
    };

    x += w;
    rowHeight = Math.max(rowHeight, h);
    return layoutItem;
  });
}

function valuePassesSourceFilter(
  value: string | number | null,
  op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in",
  expected: string | number | Array<string | number>
): boolean {
  if (
    expected === "" ||
    expected === null ||
    expected === undefined ||
    (Array.isArray(expected) && expected.length === 0)
  ) {
    return true;
  }

  if (op === "in") {
    if (!Array.isArray(expected)) return false;
    return expected.some((candidate) => String(candidate) === String(value));
  }

  if (Array.isArray(expected)) return false;
  const left = toComparable(value);
  const right = toComparable(expected);
  if (op === "eq") return String(left) === String(right);
  if (op === "neq") return String(left) !== String(right);
  if (op === "gt") return left > right;
  if (op === "gte") return left >= right;
  if (op === "lt") return left < right;
  return left <= right;
}

function applySourceFiltersToRows(rows: TableRow[], source: DatasetChartSource): TableRow[] {
  let out = [...rows];
  for (const filter of source.filters ?? []) {
    out = out.filter((row) => valuePassesSourceFilter(row[filter.field] ?? null, filter.op, filter.value));
  }
  if (source.dateRange) {
    const { field, start, end } = source.dateRange;
    out = out.filter((row) => {
      const rowValue = row[field] ?? null;
      if (rowValue === null) return false;
      const comparable = toComparable(rowValue);
      if (start !== undefined && comparable < toComparable(start)) return false;
      if (end !== undefined && comparable > toComparable(end)) return false;
      return true;
    });
  }
  return out;
}

function aggregateValues(values: number[], aggregation: MetricAggregation): number {
  if (aggregation === "count") return values.length;
  const total = values.reduce((acc, value) => acc + value, 0);
  if (aggregation === "avg") return values.length === 0 ? 0 : total / values.length;
  return total;
}

function toAggregationValue(
  row: TableRow,
  aggregation: MetricAggregation | AggregationConfig,
  valueField?: string
): number {
  const resolvedAggregation = typeof aggregation === "string" ? aggregation : aggregation.aggregation;
  const resolvedValueField = typeof aggregation === "string" ? valueField : aggregation.valueField;
  if (resolvedAggregation === "count") return 1;
  if (!resolvedValueField) return 0;
  const raw = row[resolvedValueField];
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const parsed = Number(raw);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function aggregateFromRows(rows: TableRow[], aggregation: MetricAggregation, valueField?: string): number {
  if (aggregation === "count") return rows.length;
  const values = rows
    .map((row) => row[valueField ?? ""])
    .map((raw) => (typeof raw === "number" ? raw : Number(raw)))
    .filter((num) => !Number.isNaN(num));
  if (values.length === 0) return 0;
  return aggregateValues(values, aggregation);
}

function inferLegacySource(chart: Chart): DatasetChartSource | undefined {
  if ("source" in chart && chart.source) return chart.source;

  if ("autoAggregation" in chart && chart.autoAggregation) {
    const config = chart.autoAggregation;
    if (chart.type === "bar_grouped" || chart.type === "bar_stacked") {
      return {
        datasetId: config.datasetId,
        xField: config.groupBy,
        seriesField: config.seriesBy,
        valueField: config.valueField,
        aggregation: config.aggregation
      };
    }
    if (chart.type === "donut") {
      return {
        datasetId: config.datasetId,
        categoryField: config.groupBy,
        valueField: config.valueField,
        aggregation: config.aggregation
      };
    }
    if (chart.type === "funnel") {
      return {
        datasetId: config.datasetId,
        stageField: config.groupBy,
        valueField: config.valueField,
        aggregation: config.aggregation
      };
    }
  }

  if (!chart.datasetId) return undefined;
  if (chart.type === "bar") {
    return { datasetId: chart.datasetId, xField: chart.x, yField: chart.y, aggregation: "sum" };
  }
  if (chart.type === "line") {
    return {
      datasetId: chart.datasetId,
      xField: chart.x,
      yField: chart.y,
      seriesField: chart.series,
      aggregation: "sum"
    };
  }
  if (chart.type === "area") {
    return {
      datasetId: chart.datasetId,
      xField: chart.x,
      yField: chart.y,
      seriesField: chart.series,
      aggregation: "sum"
    };
  }
  if (chart.type === "scatter") {
    return { datasetId: chart.datasetId, xField: chart.x, yField: chart.y, seriesField: chart.series };
  }
  if (chart.type === "radar") {
    return {
      datasetId: chart.datasetId,
      indexField: chart.indexField,
      valueField: chart.valueField,
      seriesField: chart.seriesField,
      aggregation: "sum"
    };
  }
  if (chart.type === "table") {
    return { datasetId: chart.datasetId, columns: chart.columns, limit: chart.limit };
  }
  if (chart.type === "combo") {
    return {
      datasetId: chart.datasetId,
      xField: chart.x,
      barField: chart.barY,
      lineField: chart.lineY,
      aggregation: "sum"
    };
  }
  return undefined;
}

function getUniqueValues(rows: TableRow[], field: string): string[] {
  const seen = new Set<string>();
  for (const row of rows) {
    const raw = row[field];
    if (raw === undefined || raw === null) continue;
    seen.add(String(raw));
  }
  return Array.from(seen).sort((a, b) => compareByComparable(a, b));
}

function aggregateDonutData(
  rows: TableRow[],
  config: AggregationConfig,
  baselineGroups: string[]
) {
  const buckets = new Map<string, number>();
  for (const group of baselineGroups) {
    buckets.set(group, 0);
  }
  for (const row of rows) {
    const raw = row[config.groupBy];
    if (raw === undefined || raw === null) continue;
    const key = String(raw);
    const amount = toAggregationValue(row, config);
    buckets.set(key, (buckets.get(key) ?? 0) + amount);
  }
  return Array.from(buckets.entries())
    .map(([id, value]) => ({ id, value, label: id }))
    .sort((a, b) => compareByComparable(a.id, b.id));
}

function aggregateFunnelData(
  rows: TableRow[],
  config: AggregationConfig,
  baselineGroups: string[]
) {
  const buckets = new Map<string, number>();
  for (const group of baselineGroups) buckets.set(group, 0);
  for (const row of rows) {
    const raw = row[config.groupBy];
    if (raw === undefined || raw === null) continue;
    const key = String(raw);
    const amount = toAggregationValue(row, config);
    buckets.set(key, (buckets.get(key) ?? 0) + amount);
  }
  return Array.from(buckets.entries())
    .map(([id, value]) => ({ id, label: id, value }))
    .sort((a, b) => compareByComparable(a.id, b.id));
}

function aggregateGroupedBarData(
  rows: TableRow[],
  config: AggregationConfig,
  keys: string[],
  groupField: string,
  baselineGroups: string[]
): { data: TableRow[]; keys: string[] } {
  const effectiveKeys = new Set<string>(keys);
  const buckets = new Map<string, Record<string, number>>();
  for (const group of baselineGroups) {
    const record: Record<string, number> = { [groupField]: group };
    for (const key of effectiveKeys) {
      record[key] = 0;
    }
    buckets.set(group, record);
  }
  for (const row of rows) {
    const rawGroup = row[config.groupBy];
    const rawSeries = config.seriesBy ? row[config.seriesBy] : undefined;
    if (rawGroup === undefined || rawGroup === null || rawSeries === undefined || rawSeries === null) {
      continue;
    }
    const groupKey = String(rawGroup);
    const seriesKey = String(rawSeries);
    effectiveKeys.add(seriesKey);
    const amount = toAggregationValue(row, config);
    let record = buckets.get(groupKey);
    if (!record) {
      record = { [groupField]: groupKey };
      for (const key of effectiveKeys) {
        record[key] = 0;
      }
      buckets.set(groupKey, record);
    }
    record[seriesKey] = (record[seriesKey] ?? 0) + amount;
  }
  const sortedKeys = Array.from(effectiveKeys).sort((a, b) => compareByComparable(a, b));
  const data = Array.from(buckets.values()).sort((a, b) =>
    compareByComparable(
      a[groupField] as string | number | null | undefined,
      b[groupField] as string | number | null | undefined
    )
  );
  return { data, keys: sortedKeys };
}

function applyFiltersToChart(
  chart: Chart,
  filters: DashboardFilter[],
  datasetMap?: Map<string, Dataset>
): Chart {
  const source = inferLegacySource(chart);
  if (source && datasetMap) {
    const dataset = datasetMap.get(source.datasetId);
    if (dataset) {
      const datasetRows = applySourceFiltersToRows(dataset.rows as TableRow[], source);
      const filteredRows = applyFiltersToRows(datasetRows, filters, chart.id, source.datasetId);

      if (chart.type === "bar") {
        const xField = source.xField ?? chart.x;
        const yField = source.yField ?? chart.y;
        const aggregation = source.aggregation ?? "sum";
        const grouped = new Map<string, number[]>();
        for (const row of filteredRows) {
          const xValue = row[xField];
          if (xValue === undefined || xValue === null) continue;
          const key = String(xValue);
          if (!grouped.has(key)) grouped.set(key, []);
          grouped.get(key)?.push(toAggregationValue(row, aggregation, yField));
        }
        const data = Array.from(grouped.entries())
          .map(([xValue, values]) => ({
            [xField]: xValue,
            [yField]: Number(aggregateValues(values, aggregation).toFixed(4))
          }))
          .sort((left, right) =>
            toComparable(left[xField] as string | number) < toComparable(right[xField] as string | number) ? -1 : 1
          );
        return { ...chart, datasetId: source.datasetId, data };
      }

      if (chart.type === "line" || chart.type === "area") {
        const xField = source.xField ?? chart.x;
        const yField = source.yField ?? chart.y;
        const seriesField = source.seriesField ?? chart.series;
        const aggregation = source.aggregation ?? "sum";
        const grouped = new Map<string, number[]>();
        for (const row of filteredRows) {
          const xValue = row[xField];
          if (xValue === undefined || xValue === null) continue;
          const seriesValue = seriesField ? row[seriesField] : "series_1";
          const key = `${String(seriesValue)}::${String(xValue)}`;
          if (!grouped.has(key)) grouped.set(key, []);
          grouped.get(key)?.push(toAggregationValue(row, aggregation, yField));
        }
        const data = Array.from(grouped.entries())
          .map(([key, values]) => {
            const [seriesName, xValue] = key.split("::");
            return {
              [xField]: xValue,
              [yField]: Number(aggregateValues(values, aggregation).toFixed(4)),
              ...(seriesField ? { [seriesField]: seriesName } : {})
            };
          })
          .sort((left, right) =>
            toComparable(left[xField] as string | number) < toComparable(right[xField] as string | number) ? -1 : 1
          );
        return {
          ...chart,
          datasetId: source.datasetId,
          data,
          ...(chart.type === "line" ? { x: xField, y: yField, series: seriesField } : { x: xField, y: yField, series: seriesField })
        };
      }

      if (chart.type === "scatter") {
        const xField = source.xField ?? chart.x;
        const yField = source.yField ?? chart.y;
        const seriesField = source.seriesField ?? chart.series;
        const data = filteredRows
          .map((row) => {
            const xValue = row[xField];
            const yValue = row[yField];
            const xNum = typeof xValue === "number" ? xValue : Number(xValue);
            const yNum = typeof yValue === "number" ? yValue : Number(yValue);
            if (Number.isNaN(xNum) || Number.isNaN(yNum)) return null;
            return {
              x: xNum,
              y: yNum,
              ...(seriesField && row[seriesField] !== undefined && row[seriesField] !== null
                ? { series: String(row[seriesField]) }
                : {})
            };
          })
          .filter((item): item is { x: number; y: number; series?: string } => item !== null);
        return { ...chart, datasetId: source.datasetId, data, x: xField, y: yField, series: seriesField };
      }

      if (chart.type === "radar") {
        const indexField = source.indexField ?? chart.indexField;
        const valueField = source.valueField ?? chart.valueField;
        const seriesField = source.seriesField ?? chart.seriesField;
        const aggregation = source.aggregation ?? "sum";
        const grouped = new Map<string, number[]>();
        for (const row of filteredRows) {
          const indexValue = row[indexField];
          if (indexValue === undefined || indexValue === null) continue;
          const seriesValue = seriesField ? row[seriesField] : "series_1";
          const key = `${String(seriesValue)}::${String(indexValue)}`;
          if (!grouped.has(key)) grouped.set(key, []);
          grouped.get(key)?.push(toAggregationValue(row, aggregation, valueField));
        }
        const data = Array.from(grouped.entries()).map(([key, values]) => {
          const [seriesName, indexValue] = key.split("::");
          return {
            index: indexValue,
            value: Number(aggregateValues(values, aggregation).toFixed(4)),
            ...(seriesField ? { series: seriesName } : {})
          };
        });
        return {
          ...chart,
          datasetId: source.datasetId,
          data,
          indexField,
          valueField,
          seriesField
        };
      }

      if (chart.type === "donut") {
        const config: AggregationConfig = {
          datasetId: source.datasetId,
          groupBy: source.categoryField ?? source.xField ?? "category",
          aggregation: source.aggregation ?? "sum",
          valueField: source.valueField
        };
        const baselineGroups = getUniqueValues(datasetRows, config.groupBy);
        const data = aggregateDonutData(filteredRows, config, baselineGroups);
        return { ...chart, datasetId: source.datasetId, data };
      }

      if (chart.type === "funnel") {
        const config: AggregationConfig = {
          datasetId: source.datasetId,
          groupBy: source.stageField ?? source.xField ?? "stage",
          aggregation: source.aggregation ?? "sum",
          valueField: source.valueField
        };
        const baselineGroups = getUniqueValues(datasetRows, config.groupBy);
        const data = aggregateFunnelData(filteredRows, config, baselineGroups);
        return { ...chart, datasetId: source.datasetId, data };
      }

      if (chart.type === "bar_grouped" || chart.type === "bar_stacked") {
        const config: AggregationConfig = {
          datasetId: source.datasetId,
          groupBy: source.xField ?? chart.indexBy,
          seriesBy: source.seriesField,
          aggregation: source.aggregation ?? "sum",
          valueField: source.valueField
        };
        const baselineGroups = getUniqueValues(datasetRows, config.groupBy);
        const result = aggregateGroupedBarData(filteredRows, config, chart.keys, config.groupBy, baselineGroups);
        return { ...chart, datasetId: source.datasetId, indexBy: config.groupBy, data: result.data, keys: result.keys };
      }

      if (chart.type === "table") {
        const columns = source.columns ?? chart.columns;
        const rows = filteredRows.map((row) => {
          const projected: TableRow = {};
          for (const column of columns) projected[column] = row[column] ?? null;
          return projected;
        });
        return { ...chart, datasetId: source.datasetId, columns, limit: source.limit ?? chart.limit, rows };
      }

      if (chart.type === "kpi_card") {
        const aggregation = source.aggregation ?? "sum";
        const value = Number(aggregateFromRows(filteredRows, aggregation, source.valueField).toFixed(4));
        let delta: number | undefined;
        if (
          source.compareField &&
          source.compareCurrentValue !== undefined &&
          source.comparePreviousValue !== undefined
        ) {
          const currentRows = filteredRows.filter(
            (row) => String(row[source.compareField!]) === String(source.compareCurrentValue)
          );
          const previousRows = filteredRows.filter(
            (row) => String(row[source.compareField!]) === String(source.comparePreviousValue)
          );
          const current = aggregateFromRows(currentRows, aggregation, source.valueField);
          const previous = aggregateFromRows(previousRows, aggregation, source.valueField);
          if (previous !== 0) {
            delta = Number((((current - previous) / previous) * 100).toFixed(2));
          }
        }
        return {
          ...chart,
          datasetId: source.datasetId,
          value,
          delta,
          format: source.format ?? chart.format,
          currency: source.currency ?? chart.currency
        };
      }

      if (chart.type === "combo") {
        const xField = source.xField ?? chart.x;
        const barField = source.barField ?? chart.barY;
        const lineField = source.lineField ?? chart.lineY;
        const aggregation = source.aggregation ?? "sum";
        const groupedBar = new Map<string, number[]>();
        const groupedLine = new Map<string, number[]>();
        for (const row of filteredRows) {
          const xValue = row[xField];
          if (xValue === undefined || xValue === null) continue;
          const key = String(xValue);
          if (!groupedBar.has(key)) groupedBar.set(key, []);
          if (!groupedLine.has(key)) groupedLine.set(key, []);
          groupedBar.get(key)?.push(toAggregationValue(row, aggregation, barField));
          groupedLine.get(key)?.push(toAggregationValue(row, aggregation, lineField));
        }
        const keys = Array.from(new Set([...groupedBar.keys(), ...groupedLine.keys()])).sort((a, b) =>
          toComparable(a) < toComparable(b) ? -1 : 1
        );
        const data = keys.map((xValue) => ({
          [xField]: xValue,
          [barField]: Number(aggregateValues(groupedBar.get(xValue) ?? [], aggregation).toFixed(4)),
          [lineField]: Number(aggregateValues(groupedLine.get(xValue) ?? [], aggregation).toFixed(4))
        }));
        return { ...chart, datasetId: source.datasetId, data, x: xField, barY: barField, lineY: lineField };
      }
    }
  }

  if ("autoAggregation" in chart && chart.autoAggregation && datasetMap) {
    const config = chart.autoAggregation;
    const dataset = datasetMap.get(config.datasetId);
    if (dataset) {
      const datasetRows = dataset.rows as TableRow[];
      const baselineGroups = getUniqueValues(datasetRows, config.groupBy);
      const filteredRows = applyFiltersToRows(
        datasetRows,
        filters,
        chart.id,
        config.datasetId
      );
      if (chart.type === "donut") {
        const aggregated = aggregateDonutData(filteredRows, config, baselineGroups);
        return { ...chart, data: aggregated };
      }
      if (chart.type === "bar_grouped" || chart.type === "bar_stacked") {
        const result = aggregateGroupedBarData(
          filteredRows,
          config,
          chart.keys,
          config.groupBy,
          baselineGroups
        );
        return { ...chart, data: result.data, keys: result.keys };
      }
      if (chart.type === "funnel") {
        const aggregated = aggregateFunnelData(filteredRows, config, baselineGroups);
        return { ...chart, data: aggregated };
      }
    }
  }

  if (!filters.length) return chart;

  if (
    chart.type === "bar" ||
    chart.type === "line" ||
    chart.type === "area" ||
    chart.type === "combo"
  ) {
    const filtered = applyFiltersToRows(chart.data as TableRow[], filters, chart.id, chart.datasetId);
    return { ...chart, data: filtered } as Chart;
  }

  if (chart.type === "bar_grouped" || chart.type === "bar_stacked") {
    let data = chart.data as TableRow[];
    
    // Si el filtro es sobre el eje Y (ventas), aplicarlo a cada canal individualmente
    if (chart.yLabel) {
      const valueFilters = filters.filter(f => f.field === chart.yLabel);
      if (valueFilters.length > 0) {
        data = data.map(row => {
          const newRow = { ...row };
          let allValuesBelowThreshold = true;
          
          for (const key of chart.keys) {
            if (key in row) {
              const val = row[key];
              const passes = valueFilters.every(f => rowPassesFilter({ [f.field]: val }, f));
              if (!passes) {
                newRow[key] = 0; // Ocultar barra individual
              } else if (val !== 0) {
                allValuesBelowThreshold = false;
              }
            }
          }
          // Si después de filtrar todas las barras del mes son 0, podríamos marcar la fila para eliminar
          // pero por ahora las dejamos en 0 para mantener el eje X consistente
          return newRow;
        });
      }
    }

    // Aplicar filtros estándar (como el de mes)
    const otherFilters = chart.yLabel ? filters.filter(f => f.field !== chart.yLabel) : filters;
    const filtered = applyFiltersToRows(data, otherFilters, chart.id, chart.datasetId);
    return { ...chart, data: filtered } as Chart;
  }

  if (chart.type === "table") {
    const filtered = applyFiltersToRows(chart.rows as TableRow[], filters, chart.id, chart.datasetId);
    return { ...chart, rows: filtered } as Chart;
  }

  if (chart.type === "scatter") {
    const points = chart.data as Array<{ x: string | number; y: string | number; series?: string }>;
    const projected = points.map((point) => {
      const row: TableRow = { x: point.x, y: point.y };
      if (chart.x) row[chart.x] = point.x;
      if (chart.y) row[chart.y] = point.y;
      if (chart.series && point.series !== undefined) row[chart.series] = point.series;
      return row;
    });
    const filteredProjected = applyFiltersToRows(projected, filters, chart.id, chart.datasetId);
    const keep = new Set(filteredProjected.map((row) => `${String(row.x)}::${String(row.y)}::${String(row[chart.series ?? "series"] ?? "")}`));
    const filtered = points.filter((point) =>
      keep.has(`${String(point.x)}::${String(point.y)}::${String(point.series ?? "")}`)
    );
    return { ...chart, data: filtered } as Chart;
  }

  if (chart.type === "radar") {
    const slices = chart.data as Array<{ index: string; value: number; series?: string }>;
    const projected = slices.map((slice) => {
      const row: TableRow = { index: slice.index, value: slice.value };
      if (chart.indexField) row[chart.indexField] = slice.index;
      if (chart.valueField) row[chart.valueField] = slice.value;
      if (chart.seriesField && slice.series !== undefined) row[chart.seriesField] = slice.series;
      return row;
    });
    const filteredProjected = applyFiltersToRows(projected, filters, chart.id, chart.datasetId);
    const keep = new Set(
      filteredProjected.map(
        (row) => `${String(row[chart.indexField ?? "index"])}::${String(row[chart.seriesField ?? "series"] ?? "")}`
      )
    );
    const filtered = slices.filter((slice) =>
      keep.has(`${String(slice.index)}::${String(slice.series ?? "")}`)
    );
    return { ...chart, data: filtered } as Chart;
  }

  return chart;
}

function getUniqueFieldValues(
  charts: Chart[],
  field: string,
  datasets?: Dataset[],
  allowedDatasetIds?: Set<string>
): string[] {
  const seen = new Set<string>();
  for (const chart of charts) {
    let rows: TableRow[] = [];
    if ("data" in chart && Array.isArray(chart.data)) {
      // Handle different chart types properly
      if (chart.type === "scatter") {
        const points = chart.data as Array<{ x: string | number; y: string | number; series?: string }>;
        rows = points.map((point) => {
          const row: TableRow = { x: point.x, y: point.y };
          if (chart.x) row[chart.x] = point.x;
          if (chart.y) row[chart.y] = point.y;
          if (chart.series && point.series !== undefined) row[chart.series] = point.series;
          return row;
        });
      } else if (chart.type === "radar") {
        const slices = chart.data as Array<{ index: string; value: number; series?: string }>;
        rows = slices.map((slice) => {
          const row: TableRow = { index: slice.index, value: slice.value };
          if (chart.indexField) row[chart.indexField] = slice.index;
          if (chart.valueField) row[chart.valueField] = slice.value;
          if (chart.seriesField && slice.series !== undefined) row[chart.seriesField] = slice.series;
          return row;
        });
      } else {
        rows = chart.data as TableRow[];
      }
    } else if (chart.type === "table") {
      rows = chart.rows as TableRow[];
    }
    for (const row of rows) {
      const val = row[field];
      if (val !== null && val !== undefined) seen.add(String(val));
    }
  }
  if (datasets?.length) {
    for (const dataset of datasets) {
      if (allowedDatasetIds && !allowedDatasetIds.has(dataset.id)) continue;
      if (!dataset.columns.includes(field)) continue;
      for (const row of dataset.rows) {
        const value = row[field];
        if (value !== null && value !== undefined) {
          seen.add(String(value));
        }
      }
    }
  }
  return Array.from(seen).sort((a, b) => {
    return compareByComparable(a, b);
  });
}

function DashboardView({
  dashboard,
  onRemoveFilter,
  datasets
}: {
  dashboard: Dashboard;
  onRemoveFilter?: (filterId: string) => void;
  datasets?: Dataset[];
}) {
  const [expandedChartId, setExpandedChartId] = React.useState<string | null>(null);
  const [filterValues, setFilterValues] = React.useState<Record<string, string>>({});
  const [filterValuesTo, setFilterValuesTo] = React.useState<Record<string, string>>({});
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);
  const [isSingleColumnViewport, setIsSingleColumnViewport] = React.useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 900 : false
  );

  const storedFilters = dashboard.filters ?? [];

  const activeFilters: DashboardFilter[] = storedFilters.flatMap((f) => {
    const baseVal = filterValues[f.id] !== undefined ? filterValues[f.id] : f.value;
    const baseValTo = filterValuesTo[f.id] !== undefined ? filterValuesTo[f.id] : f.valueTo;
    const val = baseVal === undefined ? "" : baseVal;
    const valTo = baseValTo === undefined ? "" : baseValTo;
    if (f.op === "between") {
      if (!val && !valTo) return [];
      return [{ ...f, value: val, valueTo: valTo }];
    }
    if (!val) return [];
    return [{ ...f, value: val }];
  });

  // Align layout with available charts to avoid react-grid-layout key mismatches when
  // a chart is missing (e.g., race between storage update and SSE reload).
  const visibleItems = sortLayoutItems(dashboard.layout.items.filter((item) =>
    dashboard.charts.some((chart) => chart.id === item.chart)
  ));

  const layouts = {
    lg: buildResponsiveLayout(visibleItems, dashboard.layout.grid.columns),
    md: buildResponsiveLayout(visibleItems, dashboard.layout.grid.columns),
    sm: buildResponsiveLayout(visibleItems, 1),
    xs: buildResponsiveLayout(visibleItems, 1),
    xxs: buildResponsiveLayout(visibleItems, 1)
  };

  // Apply filters to charts
  const datasetMap = React.useMemo(() => {
    if (!datasets?.length) return new Map<string, Dataset>();
    return new Map(datasets.map((dataset) => [dataset.id, dataset]));
  }, [datasets]);
  const dashboardDatasetIds = React.useMemo(() => collectDatasetIds(dashboard.charts), [dashboard.charts]);

  const filteredCharts = React.useMemo(
    () => dashboard.charts.map((chart) => applyFiltersToChart(chart, activeFilters, datasetMap)),
    [dashboard.charts, activeFilters, datasetMap]
  );

  const chartById = new Map(filteredCharts.map((chart) => [chart.id, chart]));
  const expandedChart = expandedChartId ? chartById.get(expandedChartId) ?? null : null;
  const activeFilterCount = activeFilters.length;

  React.useEffect(() => {
    setMobileFiltersOpen(false);
  }, [dashboard.id]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const syncViewport = () => setIsSingleColumnViewport(window.innerWidth < 900);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  return (
    <>
      {storedFilters.length > 0 && (
        <>
          <div className="luminon-filter-toolbar">
            <button
              type="button"
              className={`luminon-filter-toggle ${mobileFiltersOpen ? "is-open" : ""}`}
              onClick={() => setMobileFiltersOpen((prev) => !prev)}
              aria-expanded={mobileFiltersOpen}
              aria-controls={`filters-${dashboard.id}`}
            >
              <span>Filters</span>
              <span>{activeFilterCount > 0 ? `${activeFilterCount} active` : "Show"}</span>
            </button>
          </div>
          <div
            id={`filters-${dashboard.id}`}
            className={`luminon-filter-bar ${mobileFiltersOpen ? "is-open" : ""}`}
          >
          {storedFilters.map((filter) => {
            const uniqueVals = getUniqueFieldValues(
              dashboard.charts,
              filter.field,
              datasets,
              dashboardDatasetIds
            );
            const currentVal = filterValues[filter.id] ?? "";
            const currentValTo = filterValuesTo[filter.id] ?? "";
            const opLabel: Record<string, string> = {
              eq: "=", neq: "≠", gte: "≥", lte: "≤", between: "range", in: "includes", not_in: "excludes"
            };
            return (
              <div key={filter.id} className="luminon-filter-control">
                <span className="luminon-filter-label">
                  {filter.field}
                  <span className="luminon-filter-op">{opLabel[filter.op] ?? filter.op}</span>
                </span>
                {(filter.op === "eq" || filter.op === "in" || filter.op === "not_in") && (
                  <select
                    className="luminon-filter-select"
                    value={currentVal}
                    onChange={(e) => setFilterValues((prev) => ({ ...prev, [filter.id]: e.target.value }))}
                  >
                    <option value="">All</option>
                    {uniqueVals.map((v) => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                )}
                {filter.op === "between" && (
                  <>
                    <input
                      type="text"
                      className="luminon-filter-input"
                      value={currentVal}
                      placeholder="From"
                      onChange={(e) => setFilterValues((prev) => ({ ...prev, [filter.id]: e.target.value }))}
                    />
                    <span className="luminon-filter-between-sep">–</span>
                    <input
                      type="text"
                      className="luminon-filter-input"
                      value={currentValTo}
                      placeholder="To"
                      onChange={(e) => setFilterValuesTo((prev) => ({ ...prev, [filter.id]: e.target.value }))}
                    />
                  </>
                )}
                {(filter.op === "gte" || filter.op === "lte" || filter.op === "neq") && (
                  <input
                    type="text"
                    className="luminon-filter-input"
                    value={currentVal}
                    placeholder={filter.op === "gte" ? "From" : filter.op === "lte" ? "To" : "Value"}
                    onChange={(e) => setFilterValues((prev) => ({ ...prev, [filter.id]: e.target.value }))}
                  />
                )}
                {onRemoveFilter && (
                  <button
                    type="button"
                    className="luminon-filter-chip-remove"
                    onClick={() => onRemoveFilter(filter.id)}
                    title={`Remove filter ${filter.field}`}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
          </div>
        </>
      )}
      <GridLayout
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 1200, md: 900, sm: 640, xs: 480, xxs: 0 }}
        cols={{
          lg: dashboard.layout.grid.columns,
          md: dashboard.layout.grid.columns,
          sm: 1,
          xs: 1,
          xxs: 1
        }}
        rowHeight={220}
        isDraggable={false}
        isResizable={false}
        measureBeforeMount={false}
        margin={isSingleColumnViewport ? [0, 16] : [16, 16]}
        compactType={null}
        preventCollision
      >
        {visibleItems.map((item) => {
          const chart = chartById.get(item.chart);
          if (!chart) return null;
          const preset = resolvePreset(dashboard.themePreset, chart.themePreset);
          const presentation = resolvePresentation(dashboard.presentation, chart.presentation, preset);

          return (
            <div
              key={chart.id}
              className="luminon-chart-card"
              style={{
                fontFamily: presentation.fontFamily,
                background: preset.cardBg,
                borderColor: preset.cardBorder
              }}
            >
              <div className="luminon-chart-head">
                <div
                  className="luminon-chart-title"
                  style={{
                    color: presentation.titleColor,
                    fontFamily: presentation.titleFontFamily ?? presentation.fontFamily
                  }}
                >
                  {chart.title ?? chart.id}
                </div>
                <div className="luminon-chart-actions">
                  <button
                    type="button"
                    className="luminon-chart-btn"
                    onClick={() => setExpandedChartId(chart.id)}
                    title="Maximizar"
                    aria-label="Maximizar chart"
                  >
                    ↗
                  </button>
                </div>
              </div>
              <div style={{ height: "calc(100% - 30px)" }}>
                <ChartErrorBoundary>
                  {renderChart(chart, dashboard.themePreset, dashboard.presentation)}
                </ChartErrorBoundary>
              </div>
            </div>
          );
        })}
      </GridLayout>

      {expandedChart && (() => {
        const preset = resolvePreset(dashboard.themePreset, expandedChart.themePreset);
        const presentation = resolvePresentation(dashboard.presentation, expandedChart.presentation, preset);
        return (
          <div
            className="luminon-chart-modal-backdrop"
            role="dialog"
            aria-modal="true"
            onClick={() => setExpandedChartId(null)}
          >
            <div
              className="luminon-chart-modal"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: preset.cardBg,
                borderColor: preset.cardBorder,
                fontFamily: presentation.fontFamily
              }}
            >
              <div className="luminon-chart-head">
                <div
                  className="luminon-chart-title"
                  style={{
                    color: presentation.titleColor,
                    fontFamily: presentation.titleFontFamily ?? presentation.fontFamily
                  }}
                >
                  {expandedChart.title ?? expandedChart.id}
                </div>
                <div className="luminon-chart-actions">
                  <button
                    type="button"
                    className="luminon-chart-btn modal-btn"
                    onClick={() => setExpandedChartId(null)}
                    title="Restaurar"
                    aria-label="Restaurar chart"
                  >
                    x
                  </button>
                </div>
              </div>
              <div className="luminon-chart-modal-body">
                <div style={{ height: "100%" }}>
                  <ChartErrorBoundary>
                    {renderChart(expandedChart, dashboard.themePreset, dashboard.presentation)}
                  </ChartErrorBoundary>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}

function App() {
  const sharedDashboardId = React.useMemo(() => getSharedDashboardIdFromPath(), []);
  const { dashboards, setDashboards, loading, reload: reloadDashboards } = useDashboards(!sharedDashboardId);
  const shared = useDashboardById(sharedDashboardId);
  const reloadSharedDashboard = shared.reload;
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [editingName, setEditingName] = React.useState(false);
  const [nameDraft, setNameDraft] = React.useState("");
  const [savingName, setSavingName] = React.useState(false);
  const [copyStatus, setCopyStatus] = React.useState<"idle" | "copied" | "error">("idle");
  const [renameError, setRenameError] = React.useState<string | null>(null);
  const [publishError, setPublishError] = React.useState<string | null>(null);
  const [collapsed, setCollapsed] = React.useState(false);
  const [publishing, setPublishing] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const refreshPendingRef = React.useRef(false);
  const isReadOnlyDemo = IS_STATIC_DEMO;
  const [showHome, setShowHome] = React.useState(true);
  const [activeGuideId, setActiveGuideId] = React.useState<string>(QUICKSTART_GUIDES[0].id);
  const { datasets, reload: reloadDatasets } = useDatasets();
  const [uiTheme, setUiTheme] = React.useState<UiTheme>(() => {
    if (typeof window === "undefined") return "";
    const stored = window.localStorage.getItem("ui-theme");
    return stored && UI_THEMES.includes(stored as UiTheme) ? (stored as UiTheme) : "";
  });

  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;
    [...UI_THEMES, ...LEGACY_THEME_CLASSES].forEach((theme) => {
      if (theme) html.classList.remove(theme);
    });
    if (uiTheme) {
      html.classList.add(uiTheme);
    }
    window.localStorage.setItem("ui-theme", uiTheme);
  }, [uiTheme]);

  const cycleUiTheme = React.useCallback(() => {
    setUiTheme((prev) => {
      const currentIndex = UI_THEMES.indexOf(prev);
      const nextIndex = (currentIndex + 1) % UI_THEMES.length;
      return UI_THEMES[nextIndex];
    });
  }, []);

  const filteredDashboards = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return dashboards;
    return dashboards.filter(
      (dashboard) =>
        dashboard.name.toLowerCase().includes(query) || dashboard.id.toLowerCase().includes(query)
    );
  }, [dashboards, searchQuery]);

  const themeToggle = (
    <button
      className="luminon-theme-toggle"
      onClick={cycleUiTheme}
      title="Cambiar tema de la interfaz"
      aria-label="Cambiar tema de la interfaz"
      type="button"
    >
      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    </button>
  );

  const activeGuide = React.useMemo(
    () => QUICKSTART_GUIDES.find((guide) => guide.id === activeGuideId) ?? QUICKSTART_GUIDES[0],
    [activeGuideId]
  );

  React.useEffect(() => {
    if (showHome || selectedId) {
      setMobileNavOpen(false);
    }
  }, [showHome, selectedId]);

  const Home = () => (
    <div className="luminon-home">
      <h1 className="luminon-hero-title" style={{ marginBottom: 8 }}>Instant dashboards from your data</h1>
      <p className="luminon-hero-sub" style={{ marginBottom: 24 }}>
        Connect the MCP server, open the renderer, and ask your AI tool to arrange dashboards, charts, and themes automatically.
      </p>

      <div className="luminon-home-grid">
        <section className="luminon-home-card">
          <div className="luminon-tabs">
            {QUICKSTART_GUIDES.map((guide) => (
              <button
                key={guide.id}
                type="button"
                className={`luminon-tab-btn ${activeGuideId === guide.id ? "is-active" : ""}`}
                onClick={() => setActiveGuideId(guide.id)}
              >
                {guide.title}
              </button>
            ))}
          </div>

          <div className="luminon-guide-card">
            <div className="luminon-guide-eyebrow">{activeGuide.eyebrow ?? "Setup"}</div>
            <h3 className="luminon-guide-title">{activeGuide.title}</h3>
            <p className="luminon-guide-desc">{activeGuide.description}</p>
            {activeGuide.pathLabel && (
              <p className="luminon-guide-path">
                <strong>{activeGuide.pathLabel}:</strong> <span>{activeGuide.pathValue}</span>
              </p>
            )}
            {activeGuide.note && <p className="luminon-guide-note">{activeGuide.note}</p>}
            <div className="luminon-code-row">
              <pre className="luminon-code-block">
                <code>{activeGuide.code}</code>
              </pre>
              <button
                type="button"
                className="luminon-copy-btn"
                onClick={() => navigator.clipboard?.writeText(activeGuide.code).catch(() => {})}
                aria-label={`Copy config for ${activeGuide.title}`}
              >
                <svg className="luminon-copy-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor">
                  <rect x="9" y="7" width="11" height="13" rx="2" ry="2" />
                  <path d="M5 13V5a2 2 0 0 1 2-2h8" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        <section className="luminon-home-card">
            <h3>Quick prompts</h3>
            <div className="luminon-prompt-list">
              {QUICK_PROMPTS.map((item) => (
                <div key={item.title} className="luminon-prompt-card">
                  <div className="luminon-prompt-content">
                    <div className="luminon-prompt-title">{item.title}</div>
                    <div className="luminon-prompt-text">{item.text}</div>
                  </div>
                  <button
                    type="button"
                    className="luminon-copy-btn"
                    onClick={() => navigator.clipboard?.writeText(item.text).catch(() => {})}
                    aria-label={`Copy prompt: ${item.title}`}
                >
                  <svg className="luminon-copy-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor">
                    <rect x="9" y="7" width="11" height="13" rx="2" ry="2" />
                    <path d="M5 13V5a2 2 0 0 1 2-2h8" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  if (sharedDashboardId) {
    return (
      <div className="luminon-shell" data-theme={shared.dashboard?.themePreset ?? "clean"}>
        <div className="luminon-frame" style={{ gridTemplateColumns: "1fr" }}>
          {themeToggle}
          <main className="luminon-main">
            {shared.loading && <p className="luminon-loading">Loading dashboard...</p>}
            {shared.error && <p className="luminon-error">Error: {shared.error}</p>}
                {shared.dashboard && (
                  <>
                    <h1 className="luminon-hero-title">{shared.dashboard.name}</h1>
                    <div className="luminon-grid-wrap">
                      <DashboardView dashboard={shared.dashboard} datasets={datasets} />
                    </div>
                  </>
                )}
          </main>
        </div>
      </div>
    );
  }

  React.useEffect(() => {
    if (!selectedId && dashboards.length > 0) {
      if (!showHome) {
        setSelectedId(dashboards[0].id);
      }
    }
  }, [dashboards, selectedId, showHome]);

  const selected = dashboards.find((d) => d.id === selectedId) ?? null;
  const canShare = Boolean(selected?.published);

  React.useEffect(() => {
    const reloadCurrentView = () => {
      if (sharedDashboardId) {
        void reloadSharedDashboard();
      } else {
        void reloadDashboards();
      }
    };

    if (IS_STATIC_DEMO) {
      return;
    }

    const source = new EventSource("/api/events");
    const onUpdated = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        refreshPendingRef.current = true;
        return;
      }
      refreshPendingRef.current = false;
      reloadCurrentView();
    };
    const onDatasetsUpdated = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        refreshPendingRef.current = true;
        return;
      }
      refreshPendingRef.current = false;
      await reloadDatasets();
      reloadCurrentView();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible" && refreshPendingRef.current) {
        refreshPendingRef.current = false;
        reloadCurrentView();
      }
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibilityChange);
    }

    source.addEventListener("dashboards_updated", onUpdated);
    source.addEventListener("datasets_updated", onDatasetsUpdated);

    return () => {
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibilityChange);
      }
      source.removeEventListener("dashboards_updated", onUpdated);
      source.removeEventListener("datasets_updated", onDatasetsUpdated);
      source.close();
    };
  }, [reloadDashboards, reloadDatasets, reloadSharedDashboard, sharedDashboardId]);

  React.useEffect(() => {
    if (!selected) return;
    if (!editingName) {
      setNameDraft(selected.name);
    }
  }, [selected, editingName]);

  async function saveDashboardName() {
    if (!selected) return;
    const trimmed = nameDraft.trim();
    if (!trimmed || trimmed === selected.name) {
      setEditingName(false);
      setNameDraft(selected.name);
      return;
    }

    const previousName = selected.name;
    setSavingName(true);
    setRenameError(null);
    setDashboards((prev) =>
      prev.map((item) => (item.id === selected.id ? { ...item, name: trimmed } : item))
    );
    setEditingName(false);
    try {
      const res = await fetch(`/api/dashboards/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed })
      });
      if (!res.ok) {
        let serverMessage = "";
        try {
          const payload = (await res.json()) as { error?: string };
          serverMessage = payload.error ?? "";
        } catch {
          serverMessage = "";
        }
        throw new Error(serverMessage || `Rename failed (${res.status})`);
      }
      const payload = (await res.json()) as { dashboard: Dashboard };
      setDashboards((prev) =>
        prev.map((item) => (item.id === payload.dashboard.id ? payload.dashboard : item))
      );
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Rename failed. Check that the API server is running.";
      setRenameError(message);
      setDashboards((prev) =>
        prev.map((item) => (item.id === selected.id ? { ...item, name: previousName } : item))
      );
      setNameDraft(previousName);
    } finally {
      setSavingName(false);
    }
  }

  async function togglePublishState() {
    if (!selected) return;
    const nextPublished = !selected.published;
    setPublishing(true);
    setPublishError(null);
    try {
      const res = await fetch(`/api/dashboards/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: nextPublished })
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || `Publish toggle failed (${res.status})`);
      }
      const payload = (await res.json()) as { dashboard: Dashboard };
      setDashboards((prev) =>
        prev.map((item) => (item.id === payload.dashboard.id ? payload.dashboard : item))
      );
      if (!nextPublished) {
        setCopyStatus("idle");
      }
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Could not update the publish state.";
      setPublishError(message);
    } finally {
      setPublishing(false);
    }
  }

  async function copyDashboardUrl() {
    if (!selected || !selected.published || typeof window === "undefined") return;
    const shareUrl = new URL(`/dashboards/${encodeURIComponent(selected.id)}`, window.location.origin).toString();
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement("input");
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopyStatus("copied");
    } catch (error) {
      console.error(error);
      setCopyStatus("error");
    }
  }

  React.useEffect(() => {
    if (copyStatus === "idle") return;
    const timer = window.setTimeout(() => setCopyStatus("idle"), 1800);
    return () => window.clearTimeout(timer);
  }, [copyStatus]);

  React.useEffect(() => {
    setPublishError(null);
  }, [selected?.id]);

  return (
    <div className="luminon-shell" data-theme={selected?.themePreset ?? "clean"}>
      <div className={`luminon-frame ${collapsed ? 'collapsed-sidebar' : ''} ${mobileNavOpen ? "mobile-nav-open" : ""}`}>
        {themeToggle}
        {mobileNavOpen && (
          <button
            type="button"
            className="luminon-mobile-backdrop"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation"
          />
        )}
        <aside className={`luminon-aside ${collapsed ? 'collapsed' : ''}`}>
          <div className={`luminon-brand ${collapsed ? 'collapsed' : ''}`}>
            <button
              type="button"
              onClick={() => {
                setShowHome(true);
                setSelectedId(null);
                setMobileNavOpen(false);
              }}
              className="luminon-brand-logo-btn"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="luminon-brand-logo">
                  <img src={breezeLogoUrl} alt="Luminon logo" />
                </div>
                {!collapsed && <h2 className="luminon-brand-title">Luminon</h2>}
              </div>
            </button>
            <button onClick={() => setCollapsed(!collapsed)} className="luminon-collapse-btn">
              {collapsed ? '»' : '«'}
            </button>
            <button
              type="button"
              className="luminon-mobile-close"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
            >
              ×
            </button>
          </div>
          {!collapsed && <p className="luminon-brand-sub">Instant dashboards from your data</p>}
          {!collapsed && <div className="luminon-search-wrap">
            <span className="luminon-search-icon" aria-hidden="true">
              ⌕
            </span>
            <input
              className="luminon-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              aria-label="Search dashboards"
            />
          </div>}
          <div className="luminon-nav">
            {loading && !collapsed && <p className="luminon-loading">Loading...</p>}
            {!loading && dashboards.length === 0 && !collapsed && <p className="luminon-empty">No dashboards.</p>}
            {!loading && filteredDashboards.length === 0 && dashboards.length > 0 && !collapsed && (
              <p className="luminon-empty">No results for "{searchQuery}".</p>
            )}
            {filteredDashboards.map((dashboard) => {
              const words = dashboard.name.split(/[\s_-]+/).filter(word => word.length > 0);
              const initials = words.slice(0, 2).map(word => word.charAt(0)).join('').toUpperCase();
              return (
                <button
                  key={dashboard.id}
                  onClick={() => {
                    setShowHome(false);
                    setSelectedId(dashboard.id);
                    setMobileNavOpen(false);
                  }}
                  className={`luminon-nav-item ${selectedId === dashboard.id ? "active" : ""}`}
                  title={collapsed ? dashboard.name : undefined}
                >
                  {collapsed ? (
                    <span className="luminon-nav-initials">{initials}</span>
                  ) : (
                    <span className="luminon-nav-main">
                      <span className="luminon-nav-title">
                        {dashboard.name}
                      </span>
                      <span className="luminon-nav-sub">{dashboard.id}</span>
                    </span>
                  )}
                  {!collapsed && <span className="luminon-arrow" aria-hidden="true">
                    →
                  </span>}
                </button>
              );
            })}
          </div>
        </aside>
        <main className="luminon-main">
          <div className="luminon-mobile-bar">
            <button
              type="button"
              className="luminon-mobile-nav-btn"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open navigation"
            >
              <span className="luminon-mobile-nav-icon" aria-hidden="true">☰</span>
              <div className="luminon-mobile-brand">
                <div className="luminon-brand-logo luminon-brand-logo--sm">
                  <img src={breezeLogoUrl} alt="Luminon logo" />
                </div>
                <div className="luminon-mobile-brand-copy">
                  <div className="luminon-brand-title luminon-brand-title--sm">Luminon</div>
                  <div className="luminon-brand-sub luminon-brand-sub--sm">Instant dashboards from your data</div>
                </div>
              </div>
            </button>
          </div>
          {showHome ? (
            <Home />
          ) : selected ? (
            <>
              {editingName ? (
                <>
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void saveDashboardName();
                      if (e.key === "Escape") {
                        setEditingName(false);
                        setNameDraft(selected.name);
                      }
                    }}
                    autoFocus
                    disabled={savingName}
                    className="luminon-title-input"
                  />
                  <div className="luminon-title-actions">
                    <button
                      onClick={() => void saveDashboardName()}
                      disabled={savingName}
                      className="luminon-title-btn primary"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingName(false);
                        setNameDraft(selected.name);
                        setRenameError(null);
                      }}
                      disabled={savingName}
                      className="luminon-title-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="luminon-title-row">
                    <h1 className="luminon-hero-title" style={{ margin: 0 }}>
                      {selected.name}
                    </h1>
                    <div className="luminon-title-actions-inline">
                      <button onClick={() => !isReadOnlyDemo && setEditingName(true)} className="luminon-rename-btn" disabled={isReadOnlyDemo}>
                        <svg aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span>Rename</span>
                      </button>
                      <button
                        onClick={() => !isReadOnlyDemo && void togglePublishState()}
                        className={`luminon-action-btn toggle ${selected.published ? "active" : ""}`}
                        aria-pressed={selected.published}
                        disabled={publishing || isReadOnlyDemo}
                        title={
                          selected.published
                            ? "Unpublish this dashboard"
                            : "Publish this dashboard to share it"
                        }
                      >
                        <svg aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="7.5" strokeWidth={1.8} />
                          {selected.published ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 8l8 8" />
                          )}
                        </svg>
                        <span>{selected.published ? "Published" : "Private"}</span>
                      </button>
                      <button
                        onClick={() => void copyDashboardUrl()}
                        className={`luminon-action-btn ${copyStatus === "copied" ? "success" : ""}`}
                        title={
                          canShare ? "Copy sharable URL" : "Publish the dashboard to generate a link"
                        }
                        disabled={!canShare}
                      >
                        <svg aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span>
                          {copyStatus === "copied"
                            ? "Copied"
                            : copyStatus === "error"
                              ? "Failed to copy"
                              : "Copy URL"}
                        </span>
                      </button>
                    </div>
                  </div>
                  {selected.subtitle && <p className="luminon-hero-sub">{selected.subtitle}</p>}
                  <div className="luminon-meta">
                      <div className="luminon-pill">
                        <span className="luminon-pill-label">Status</span>
                        <span className="luminon-pill-value">
                          {selected.published ? "Published" : "Private"} · {selected.charts.length} charts · {countUniqueDatasets(selected)} datasets · id : {selected.id}
                        </span>
                      </div>
                  </div>
                </>
              )}
              <div className="luminon-grid-wrap">
                <DashboardView
                  dashboard={selected}
                  datasets={datasets}
                  onRemoveFilter={async (filterId) => {
                    if (isReadOnlyDemo) return;
                    if (!confirm("Are you sure you want to remove this filter? This cannot be undone.")) {
                      return;
                    }
                    try {
                      const res = await fetch(`/api/dashboards/${selected.id}/filters/${filterId}`, { method: "DELETE" });
                      if (res.ok) {
                        const payload = (await res.json()) as { dashboard: Dashboard };
                        setDashboards((prev) => prev.map((d) => d.id === payload.dashboard.id ? payload.dashboard : d));
                      }
                    } catch (err) {
                      console.error("Failed to remove filter", err);
                    }
                  }}
                />
              </div>
              {renameError && <p className="luminon-error">{renameError}</p>}
              {publishError && <p className="luminon-error">{publishError}</p>}
            </>
          ) : (
            <p className="luminon-empty">Select a dashboard.</p>
          )}
        </main>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
