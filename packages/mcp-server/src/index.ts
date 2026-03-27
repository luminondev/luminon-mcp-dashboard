import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  addChartInputSchema,
  addChartToDashboardInputSchema,
  createChartFromDatasetInputSchema,
  createDashboardInputSchema,
  createDashboardFromTemplateInputSchema,
  dashboardNlInputSchema,
  deleteDashboardInputSchema,
  deleteChartInputSchema,
  describeDatasetInputSchema,
  listDatasetContentInputSchema,
  listDashboardsInputSchema,
  registerDatasetInputSchema,
  updateDatasetInputSchema,
  setChartPresentationInputSchema,
  setChartThemeInputSchema,
  updateDashboardInputSchema,
  updateDashboardFiltersInputSchema,
  resetChartPresentationInputSchema,
  listDashboardFiltersInputSchema,
  createSnapshotInputSchema,
  listDashboardVersionsInputSchema,
  restoreDashboardVersionInputSchema,
  undoDashboardInputSchema,
  restoreDeletedDashboardInputSchema,
  restoreDatasetSnapshotInputSchema,
  type Chart,
  type Dashboard,
  type DashboardFilter,
  type DashboardSnapshot,
  type Dataset
} from "../../shared/dist/index.js";
import {
  addChart,
  addChartToDashboard,
  createChartFromDataset,
  createDashboard,
  createDashboardFromTemplate,
  dashboardNl,
  deleteDashboard,
  deleteChart,
  describeDataset,
  listDashboardsFiltered,
  listDatasetContent,
  listDatasets,
  listTemplates,
  listThemePresets,
  snapshotDashboardTool,
  listDashboardVersions,
  restoreDashboardVersion,
  undoDashboard,
  restoreDeletedDashboard,
  registerDataset,
  updateDataset,
  resetChartPresentation,
  setChartPresentation,
  setChartTheme,
  updateDashboard,
  updateDashboardFilters,
  listDashboardFilters,
  restoreDatasetSnapshot
} from "./storage.js";

type ToolMode = "full" | "lite" | "ultra-lite";

function resolveToolMode(raw: string | undefined): ToolMode {
  const normalized = raw?.trim().toLowerCase();
  if (normalized === "lite") return "lite";
  if (normalized === "ultra-lite" || normalized === "ultralite" || normalized === "ultra_lite") {
    return "ultra-lite";
  }
  return "full";
}

const TOOL_MODE: ToolMode = resolveToolMode(process.env.LUMINON_MCP_MODE);

const LITE_TOOLS = new Set([
  "create_dashboard",
  "update_dashboard",
  "delete_dashboard",
  "list_dashboards",
  "list_templates",
  "create_dashboard_from_template",
  "dashboard_nl",
  "register_dataset",
  "update_dataset",
  "restore_dataset_snapshot",
  "list_datasets",
  "list_dataset_content",
  "describe_dataset",
  "create_chart",
  "list_dashboard_filters",
  "update_dashboard_filters"
]);

const ULTRA_LITE_TOOLS = new Set([
  "create_dashboard",
  "list_dashboards",
  "list_templates",
  "create_dashboard_from_template",
  "register_dataset",
  "list_datasets",
  "describe_dataset",
  "list_dataset_content",
  "create_chart",
  "list_dashboard_filters",
  "update_dashboard_filters"
]);

function toolEnabled(name: string): boolean {
  if (TOOL_MODE === "full") return true;
  if (TOOL_MODE === "lite") return LITE_TOOLS.has(name);
  return ULTRA_LITE_TOOLS.has(name);
}

function toTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((header, i) =>
    Math.max(header.length, ...rows.map((row) => (row[i] ?? "").length))
  );
  const line = (cells: string[]) => cells.map((cell, i) => cell.padEnd(widths[i])).join(" | ");
  const separator = widths.map((w) => "-".repeat(w)).join("-|-");
  return [line(headers), separator, ...rows.map((row) => line(row))].join("\n");
}

function textResponse(text: string) {
  return {
    content: [{ type: "text" as const, text }]
  };
}

function jsonResponse(value: unknown) {
  return textResponse(JSON.stringify(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function looksLikeDashboard(value: unknown): value is Dashboard {
  return isRecord(value) && typeof value.id === "string" && Array.isArray(value.charts) && isRecord(value.layout);
}

function looksLikeDataset(value: unknown): value is Dataset {
  return isRecord(value) && typeof value.id === "string" && Array.isArray(value.columns) && Array.isArray(value.rows);
}

function looksLikeSnapshot(value: unknown): value is DashboardSnapshot {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.dashboardId === "string" &&
    typeof value.createdAt === "string" &&
    "payload" in value
  );
}

function summarizeChart(chart: Chart | undefined) {
  if (!chart) return undefined;
  return {
    id: chart.id,
    type: chart.type,
    title: chart.title,
    datasetId: chart.datasetId
  };
}

function summarizeDashboard(dashboard: Dashboard) {
  return {
    id: dashboard.id,
    name: dashboard.name,
    subtitle: dashboard.subtitle,
    themePreset: dashboard.themePreset,
    published: dashboard.published,
    chartCount: dashboard.charts.length,
    filterCount: (dashboard.filters ?? []).length,
    layout: {
      columns: dashboard.layout.grid.columns,
      rows: dashboard.layout.grid.rows
    },
    updatedAt: dashboard.updatedAt,
    lastChart: summarizeChart(dashboard.charts.at(-1))
  };
}

function summarizeDataset(dataset: Dataset) {
  return {
    id: dataset.id,
    name: dataset.name,
    columns: dataset.columns,
    columnCount: dataset.columns.length,
    rowCount: dataset.rows.length,
    readOnly: Boolean(dataset.readOnly),
    updatedAt: dataset.updatedAt
  };
}

function summarizeSnapshot(snapshot: DashboardSnapshot) {
  return {
    id: snapshot.id,
    dashboardId: snapshot.dashboardId,
    createdAt: snapshot.createdAt,
    comment: snapshot.comment ?? ""
  };
}

function summarizeFilter(filter: DashboardFilter) {
  return {
    id: filter.id,
    field: filter.field,
    fieldType: filter.fieldType,
    op: filter.op,
    value: filter.value,
    valueTo: filter.valueTo,
    applyTo: filter.applyTo
  };
}

function summarizeUnknownResult(result: unknown): unknown {
  if (result === null || result === undefined) return result;

  if (Array.isArray(result)) {
    return result.slice(0, 20).map((item) => summarizeUnknownResult(item));
  }

  if (looksLikeDashboard(result)) return summarizeDashboard(result);
  if (looksLikeDataset(result)) return summarizeDataset(result);
  if (looksLikeSnapshot(result)) return summarizeSnapshot(result);

  if (isRecord(result) && Array.isArray(result.filters)) {
    return {
      filterCount: result.filters.length,
      filters: result.filters.slice(0, 20).map((filter) =>
        summarizeFilter(filter as DashboardFilter)
      )
    };
  }

  return result;
}

function dashboardResponse(dashboard: Dashboard, extra?: Record<string, unknown>) {
  return jsonResponse({
    ok: true,
    dashboard: summarizeDashboard(dashboard),
    ...extra
  });
}

function datasetResponse(dataset: Dataset, extra?: Record<string, unknown>) {
  return jsonResponse({
    ok: true,
    dataset: summarizeDataset(dataset),
    ...extra
  });
}

function datasetValueToString(value: unknown): string {
  if (Array.isArray(value)) return value.map((item) => String(item)).join(", ");
  if (value === null || value === undefined) return "";
  return String(value);
}

function filtersTable(filters: DashboardFilter[]): string {
  if (filters.length === 0) return "No active filters.";
  return toTable(
    ["id", "field", "type", "op", "value", "valueTo", "applyTo"],
    filters.map((filter) => [
      filter.id,
      filter.field,
      filter.fieldType,
      filter.op,
      datasetValueToString(filter.value),
      datasetValueToString(filter.valueTo),
      (filter.applyTo ?? []).join(", ")
    ])
  );
}

const server = new McpServer({
  name: "mcp-dashboard",
  version: "0.2.0"
});

if (toolEnabled("create_dashboard")) {
  server.tool(
    "create_dashboard",
    "Create a dashboard. If layout is omitted, default grid 3x3 is used.",
    {
      input: createDashboardInputSchema
    },
    async ({ input }) => {
      const dashboard = await createDashboard(input);
      return dashboardResponse(dashboard);
    }
  );
}

if (toolEnabled("update_dashboard")) {
  server.tool(
    "update_dashboard",
    "Update dashboard properties (name, subtitle, theme, presentation, columns, layout, autoLayout).",
    {
      input: updateDashboardInputSchema
    },
    async ({ input }) => {
      const dashboard = await updateDashboard(input);
      return dashboardResponse(dashboard);
    }
  );
}

if (toolEnabled("add_chart")) {
  server.tool(
    "add_chart",
    "Add a chart payload to an existing dashboard (without automatic layout placement).",
    {
      input: addChartInputSchema
    },
    async ({ input }) => {
      const dashboard = await addChart(input);
      return dashboardResponse(dashboard, { chart: summarizeChart(input.chart) });
    }
  );
}

if (toolEnabled("add_chart_to_dashboard")) {
  server.tool(
    "add_chart_to_dashboard",
    "Add chart to dashboard id with automatic default grid placement; optional grid/placement overrides.",
    {
      input: addChartToDashboardInputSchema
    },
    async ({ input }) => {
      const dashboard = await addChartToDashboard(input);
      return dashboardResponse(dashboard, { chart: summarizeChart(input.chart) });
    }
  );
}

if (toolEnabled("delete_chart")) {
  server.tool(
    "delete_chart",
    "Delete a chart from dashboard and remove it from layout. Requires confirm: \"DELETE\".",
    {
      input: deleteChartInputSchema
    },
    async ({ input }) => {
      const dashboard = await deleteChart(input);
      return dashboardResponse(dashboard, { deletedChartId: input.chartId });
    }
  );
}

if (toolEnabled("delete_dashboard")) {
  server.tool(
    "delete_dashboard",
    "Delete a dashboard by id. Requires confirm: \"DELETE\".",
    {
      input: deleteDashboardInputSchema
    },
    async ({ input }) => {
      const result = await deleteDashboard(input);
      return jsonResponse({ ok: true, ...result });
    }
  );
}

if (toolEnabled("list_dashboards")) {
  server.tool(
    "list_dashboards",
    "List dashboards with status filter: active|deleted|all.",
    {
      input: listDashboardsInputSchema
    },
    async ({ input }) => {
      const { dashboards } = await listDashboardsFiltered(input);
      const rows = dashboards.map((dashboard) => {
        if ("payload" in dashboard) {
          return [
            dashboard.id,
            dashboard.name,
            String(dashboard.payload.charts.length),
            dashboard.deletedAt,
            "deleted"
          ];
        }
        return [
          dashboard.id,
          dashboard.name,
          String(dashboard.charts.length),
          dashboard.updatedAt,
          "active"
        ];
      });
      return textResponse(toTable(["id", "name", "charts", "timestamp", "status"], rows));
    }
  );
}

if (toolEnabled("list_theme_presets")) {
  server.tool("list_theme_presets", "List available chart theme presets.", async () => {
    const themes = await listThemePresets();
    const table = toTable(
      ["theme", "description"],
      themes.map((theme) => [theme.id, theme.description])
    );
    return textResponse(table);
  });
}

if (toolEnabled("list_templates")) {
  server.tool("list_templates", "List built-in dashboard templates and their default datasets.", async () => {
    const templates = await listTemplates();
    const table = toTable(
      ["id", "name", "dataset", "charts", "filters"],
      templates.map((template) => [
        template.id,
        template.name,
        template.defaultDatasetId,
        template.charts.map((chart) => chart.type).join(", "),
        template.filters.map((filter) => filter.field).join(", ")
      ])
    );
    return textResponse(table);
  });
}

if (toolEnabled("snapshot_dashboard")) {
  server.tool(
    "snapshot_dashboard",
    "Create/overwrite the single snapshot for a dashboard (keeps only latest).",
    {
      input: createSnapshotInputSchema
    },
    async ({ input }) => {
      const snapshot = await snapshotDashboardTool(input);
      return jsonResponse({ ok: true, snapshot: summarizeSnapshot(snapshot) });
    }
  );
}

if (toolEnabled("list_dashboard_versions")) {
  server.tool(
    "list_dashboard_versions",
    "List the current snapshot for a dashboard (single snapshot stored).",
    {
      input: listDashboardVersionsInputSchema
    },
    async ({ input }) => {
      const snapshots = await listDashboardVersions(input);
      const table = toTable(
        ["snapshotId", "createdAt", "comment"],
        snapshots.map((snapshot) => [snapshot.id, snapshot.createdAt, snapshot.comment ?? ""])
      );
      return textResponse(table);
    }
  );
}

if (toolEnabled("restore_dashboard_version")) {
  server.tool(
    "restore_dashboard_version",
    "Restore a dashboard from its snapshot (optionally rename).",
    {
      input: restoreDashboardVersionInputSchema
    },
    async ({ input }) => {
      const dashboard = await restoreDashboardVersion(input);
      return dashboardResponse(dashboard);
    }
  );
}

if (toolEnabled("undo_dashboard")) {
  server.tool(
    "undo_dashboard",
    "Undo to the latest snapshot of a dashboard.",
    {
      input: undoDashboardInputSchema
    },
    async ({ input }) => {
      const dashboard = await undoDashboard(input);
      return dashboardResponse(dashboard);
    }
  );
}

if (toolEnabled("restore_deleted_dashboard")) {
  server.tool(
    "restore_deleted_dashboard",
    "Restore a deleted dashboard (optionally with new id/name).",
    {
      input: restoreDeletedDashboardInputSchema
    },
    async ({ input }) => {
      const dashboard = await restoreDeletedDashboard(input);
      return dashboardResponse(dashboard);
    }
  );
}

if (toolEnabled("create_dashboard_from_template")) {
  server.tool(
    "create_dashboard_from_template",
    "Instantiate a dashboard from a built-in template (use template_id + optional dataset_id).",
    {
      input: createDashboardFromTemplateInputSchema
    },
    async ({ input }) => {
      const dashboard = await createDashboardFromTemplate(input);
      return dashboardResponse(dashboard);
    }
  );
}

if (toolEnabled("dashboard_nl")) {
  server.tool(
    "dashboard_nl",
    "Natural-language dashboard assistant. Use this tool so users do not need to know technical MCP tool names.",
    {
      input: dashboardNlInputSchema
    },
    async ({ input }) => {
      const result = await dashboardNl(input);
      return jsonResponse({
        ok: true,
        action: result.action,
        message: result.message,
        result: summarizeUnknownResult(result.result)
      });
    }
  );
}

if (toolEnabled("set_chart_theme")) {
  server.tool(
    "set_chart_theme",
    "Set theme preset for one chart inside a dashboard.",
    {
      input: setChartThemeInputSchema
    },
    async ({ input }) => {
      const dashboard = await setChartTheme(input);
      return dashboardResponse(dashboard, { chartId: input.chartId, themePreset: input.themePreset });
    }
  );
}

if (toolEnabled("set_chart_presentation")) {
  server.tool(
    "set_chart_presentation",
    "Set chart-specific presentation override for one chart inside a dashboard.",
    {
      input: setChartPresentationInputSchema
    },
    async ({ input }) => {
      const dashboard = await setChartPresentation(input);
      return dashboardResponse(dashboard, { chartId: input.chartId });
    }
  );
}

if (toolEnabled("reset_chart_presentation")) {
  server.tool(
    "reset_chart_presentation",
    "Remove chart-specific presentation override from one chart.",
    {
      input: resetChartPresentationInputSchema
    },
    async ({ input }) => {
      const dashboard = await resetChartPresentation(input);
      return dashboardResponse(dashboard, { chartId: input.chartId });
    }
  );
}

if (toolEnabled("register_dataset")) {
  server.tool(
    "register_dataset",
    "Register a dataset from CSV text or row objects.",
    {
      input: registerDatasetInputSchema
    },
    async ({ input }) => {
      const dataset = await registerDataset(input);
      return datasetResponse(dataset);
    }
  );
}

if (toolEnabled("update_dataset")) {
  server.tool(
    "update_dataset",
    "Update an existing dataset in place (mode = replace|append).",
    {
      input: updateDatasetInputSchema
    },
    async ({ input }) => {
      const dataset = await updateDataset(input);
      return datasetResponse(dataset);
    }
  );
}

if (toolEnabled("restore_dataset_snapshot")) {
  server.tool(
    "restore_dataset_snapshot",
    "Restore the last snapshot stored for a dataset (single-level undo).",
    {
      input: restoreDatasetSnapshotInputSchema
    },
    async ({ input }) => {
      const dataset = await restoreDatasetSnapshot(input);
      return datasetResponse(dataset);
    }
  );
}

if (toolEnabled("list_datasets")) {
  server.tool("list_datasets", "List all datasets.", async () => {
    const datasets = await listDatasets();
    const table = toTable(
      ["id", "name", "rows", "columns", "readOnly", "updatedAt"],
      datasets.map((dataset) => [
        dataset.id,
        dataset.name,
        String(dataset.rows.length),
        String(dataset.columns.length),
        dataset.readOnly ? "yes" : "no",
        dataset.updatedAt
      ])
    );
    return textResponse(table);
  });
}

if (toolEnabled("list_dataset_content")) {
  server.tool(
    "list_dataset_content",
    "List dataset rows as table with truncation. Input: { datasetId, limit? }",
    {
      input: listDatasetContentInputSchema
    },
    async ({ input }) => {
      const result = await listDatasetContent(input);
      const headers = result.columns;
      const rows = result.rows.map((row) => headers.map((header) => String(row[header] ?? "")));
      const table = toTable(headers, rows);
      const footer = `\nRows: ${result.returnedRows}/${result.totalRows}${result.truncated ? " (truncated)" : ""}`;
      return textResponse(table + footer);
    }
  );
}

if (toolEnabled("describe_dataset")) {
  server.tool(
    "describe_dataset",
    "Describe dataset columns and preview rows.",
    {
      input: describeDatasetInputSchema
    },
    async ({ input }) => {
      const dataset = await describeDataset(input);
      return jsonResponse({
        ok: true,
        dataset: {
          id: dataset.id,
          name: dataset.name,
          columns: dataset.columns,
          rowCount: dataset.rowCount,
          sampleRows: dataset.sampleRows
        }
      });
    }
  );
}

if (toolEnabled("create_chart")) {
  server.tool(
    "create_chart",
    "Unified chart creation from a dataset. Provide type: bar|line|area|scatter|radar|donut|funnel|kpi_card|table|combo|multi_bar.",
    {
      input: createChartFromDatasetInputSchema
    },
    async ({ input }) => {
      const dashboard = await createChartFromDataset(input);
      return dashboardResponse(dashboard);
    }
  );
}

if (toolEnabled("list_dashboard_filters")) {
  server.tool(
    "list_dashboard_filters",
    "List all active filters for a dashboard.",
    {
      input: listDashboardFiltersInputSchema
    },
    async ({ input }) => {
      const result = await listDashboardFilters(input);
      return textResponse(filtersTable(result.filters));
    }
  );
}

if (toolEnabled("update_dashboard_filters")) {
  server.tool(
    "update_dashboard_filters",
    "Add and/or remove dashboard filters in one call.",
    {
      input: updateDashboardFiltersInputSchema
    },
    async ({ input }) => {
      const dashboard = await updateDashboardFilters(input);
      return jsonResponse({
        ok: true,
        dashboard: summarizeDashboard(dashboard),
        filters: (dashboard.filters ?? []).map((filter) => summarizeFilter(filter))
      });
    }
  );
}

async function main() {
  console.error(
    `mcp-dashboard starting in ${TOOL_MODE} mode (${
      TOOL_MODE === "full"
        ? "all"
        : TOOL_MODE === "lite"
        ? LITE_TOOLS.size
        : ULTRA_LITE_TOOLS.size
    } tools exposed)`
  );
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("MCP server crashed", error);
  process.exit(1);
});
