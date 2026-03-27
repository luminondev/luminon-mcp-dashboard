import { z } from "zod";

export const chartTypeSchema = z.enum([
  "bar",
  "bar_grouped",
  "bar_stacked",
  "line",
  "area",
  "scatter",
  "radar",
  "donut",
  "funnel",
  "kpi_card",
  "table",
  "combo"
]);

export const tableCellSchema = z.union([z.string(), z.number(), z.null()]);
export const tableRowSchema = z.record(tableCellSchema);
export const themePresetSchema = z.enum([
  "clean",
  "business",
  "dark_analytics",
  "pastel",
  "high_contrast",
  "textured"
]);

export const numberFormatSchema = z.enum(["compact", "number", "currency", "percent"]);

export const chartMarginSchema = z
  .object({
    top: z.number().int().min(0).max(200).optional(),
    right: z.number().int().min(0).max(200).optional(),
    bottom: z.number().int().min(0).max(200).optional(),
    left: z.number().int().min(0).max(200).optional()
  })
  .partial();

export const chartPresentationSchema = z
  .object({
    fontFamily: z.string().min(1).max(120).optional(),
    titleFontFamily: z.string().min(1).max(120).optional(),
    titleColor: z.string().min(1).max(32).optional(),
    axisColor: z.string().min(1).max(32).optional(),
    labelColor: z.string().min(1).max(32).optional(),
    gridColor: z.string().min(1).max(32).optional(),
    showLegend: z.boolean().optional(),
    showGrid: z.boolean().optional(),
    showLabels: z.boolean().optional(),
    numberFormat: numberFormatSchema.optional(),
    currency: z.string().min(3).max(3).optional(),
    decimals: z.number().int().min(0).max(6).optional(),
    margin: chartMarginSchema.optional(),
    animate: z.boolean().optional(),
    icon: z.enum(["trend", "pulse", "target", "users"]).optional()
  })
  .partial();

export const setDashboardPresentationInputSchema = z.object({
  dashboardId: z.string().min(1),
  presentation: chartPresentationSchema
});

export const setChartPresentationInputSchema = z.object({
  dashboardId: z.string().min(1),
  chartId: z.string().min(1),
  presentation: chartPresentationSchema
});

export const resetChartPresentationInputSchema = z.object({
  dashboardId: z.string().min(1),
  chartId: z.string().min(1)
});

export const updateDatasetInputSchema = z.object({
  datasetId: z.string().min(1),
  mode: z.enum(["replace", "append"]).default("replace"),
  csv: z.string().optional(),
  rows: z.array(tableRowSchema).optional(),
  allowSchemaChange: z.boolean().optional()
});

export const restoreDatasetSnapshotInputSchema = z.object({
  datasetId: z.string().min(1)
});

export const barChartSchema = z.object({
  id: z.string().min(1),
  type: z.literal("bar"),
  title: z.string().min(1).optional(),
  themePreset: themePresetSchema.optional(),
  presentation: chartPresentationSchema.optional(),
  datasetId: z.string().min(1).optional(),
  data: z.array(tableRowSchema).default([]),
  x: z.string().min(1),
  y: z.string().min(1),
  source: z.lazy(() => datasetChartSourceSchema).optional()
});

export const aggregationConfigSchema = z.object({
  datasetId: z.string().min(1),
  groupBy: z.string().min(1),
  seriesBy: z.string().min(1).optional(),
  aggregation: z.enum(["count", "sum"]).default("count"),
  valueField: z.string().min(1).optional()
});

export type AggregationConfig = z.infer<typeof aggregationConfigSchema>;

export const datasetChartSourceSchema = z.object({
  datasetId: z.string().min(1),
  filters: z.array(z.lazy(() => fieldFilterSchema)).optional(),
  dateRange: z.lazy(() => dateRangeSchema).optional(),
  aggregation: z.enum(["sum", "avg", "count"]).optional(),
  xField: z.string().min(1).optional(),
  yField: z.string().min(1).optional(),
  seriesField: z.string().min(1).optional(),
  categoryField: z.string().min(1).optional(),
  valueField: z.string().min(1).optional(),
  stageField: z.string().min(1).optional(),
  indexField: z.string().min(1).optional(),
  barField: z.string().min(1).optional(),
  lineField: z.string().min(1).optional(),
  columns: z.array(z.string().min(1)).optional(),
  limit: z.number().int().min(1).max(500).optional(),
  compareField: z.string().min(1).optional(),
  compareCurrentValue: z.union([z.string(), z.number()]).optional(),
  comparePreviousValue: z.union([z.string(), z.number()]).optional(),
  format: z.enum(["compact", "number", "percent", "currency"]).optional(),
  currency: z.string().min(3).max(3).optional()
});

export type DatasetChartSource = z.infer<typeof datasetChartSourceSchema>;

export const multiBarChartSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["bar_grouped", "bar_stacked"]),
  title: z.string().min(1).optional(),
  themePreset: themePresetSchema.optional(),
  presentation: chartPresentationSchema.optional(),
  datasetId: z.string().min(1).optional(),
  data: z.array(tableRowSchema).default([]),
  indexBy: z.string().min(1),
  keys: z.array(z.string().min(1)).default([]),
  yLabel: z.string().min(1).optional(),
  source: datasetChartSourceSchema.optional(),
  autoAggregation: aggregationConfigSchema.optional()
});

export const lineChartSchema = z.object({
  id: z.string().min(1),
  type: z.literal("line"),
  title: z.string().min(1).optional(),
  themePreset: themePresetSchema.optional(),
  presentation: chartPresentationSchema.optional(),
  datasetId: z.string().min(1).optional(),
  data: z.array(tableRowSchema).default([]),
  x: z.string().min(1),
  y: z.string().min(1),
  series: z.string().min(1).optional(),
  source: datasetChartSourceSchema.optional()
});

export const areaChartSchema = z.object({
  id: z.string().min(1),
  type: z.literal("area"),
  title: z.string().min(1).optional(),
  themePreset: themePresetSchema.optional(),
  presentation: chartPresentationSchema.optional(),
  datasetId: z.string().min(1).optional(),
  data: z.array(tableRowSchema).default([]),
  x: z.string().min(1),
  y: z.string().min(1),
  series: z.string().min(1).optional(),
  source: datasetChartSourceSchema.optional()
});

export const scatterPointSchema = z.object({
  x: z.union([z.string(), z.number()]),
  y: z.union([z.string(), z.number()]),
  series: z.string().min(1).optional()
});

export const scatterChartSchema = z.object({
  id: z.string().min(1),
  type: z.literal("scatter"),
  title: z.string().min(1).optional(),
  themePreset: themePresetSchema.optional(),
  presentation: chartPresentationSchema.optional(),
  datasetId: z.string().min(1).optional(),
  data: z.array(scatterPointSchema).default([]),
  x: z.string().min(1),
  y: z.string().min(1),
  series: z.string().min(1).optional(),
  source: datasetChartSourceSchema.optional()
});

export const radarSliceSchema = z.object({
  index: z.union([z.string(), z.number()]),
  value: z.number(),
  series: z.string().min(1).optional()
});

export const radarChartSchema = z.object({
  id: z.string().min(1),
  type: z.literal("radar"),
  title: z.string().min(1).optional(),
  themePreset: themePresetSchema.optional(),
  presentation: chartPresentationSchema.optional(),
  datasetId: z.string().min(1).optional(),
  data: z.array(radarSliceSchema).default([]),
  indexField: z.string().min(1),
  valueField: z.string().min(1),
  seriesField: z.string().min(1).optional(),
  source: datasetChartSourceSchema.optional()
});

export const donutSliceSchema = z.object({
  id: z.string().min(1),
  value: z.number(),
  label: z.string().min(1).optional()
});

export const donutChartSchema = z.object({
  id: z.string().min(1),
  type: z.literal("donut"),
  title: z.string().min(1).optional(),
  themePreset: themePresetSchema.optional(),
  presentation: chartPresentationSchema.optional(),
  datasetId: z.string().min(1).optional(),
  data: z.array(donutSliceSchema).default([]),
  source: datasetChartSourceSchema.optional(),
  autoAggregation: aggregationConfigSchema.optional()
});

export const funnelStageSchema = z.object({
  id: z.string().min(1),
  value: z.number(),
  label: z.string().min(1).optional()
});

export const funnelChartSchema = z.object({
  id: z.string().min(1),
  type: z.literal("funnel"),
  title: z.string().min(1).optional(),
  themePreset: themePresetSchema.optional(),
  presentation: chartPresentationSchema.optional(),
  datasetId: z.string().min(1).optional(),
  data: z.array(funnelStageSchema).default([]),
  source: datasetChartSourceSchema.optional(),
  autoAggregation: aggregationConfigSchema.optional()
});

export const kpiCardChartSchema = z.object({
  id: z.string().min(1),
  type: z.literal("kpi_card"),
  title: z.string().min(1).optional(),
  themePreset: themePresetSchema.optional(),
  presentation: chartPresentationSchema.optional(),
  datasetId: z.string().min(1).optional(),
  value: z.number().default(0),
  label: z.string().min(1).optional(),
  delta: z.number().optional(),
  format: z.enum(["compact", "number", "percent", "currency"]).default("compact"),
  currency: z.string().min(3).max(3).optional(),
  source: datasetChartSourceSchema.optional()
});

export const tableChartSchema = z.object({
  id: z.string().min(1),
  type: z.literal("table"),
  title: z.string().min(1).optional(),
  themePreset: themePresetSchema.optional(),
  presentation: chartPresentationSchema.optional(),
  datasetId: z.string().min(1).optional(),
  columns: z.array(z.string().min(1)).min(1),
  rows: z.array(tableRowSchema).default([]),
  limit: z.number().int().min(1).max(500).optional(),
  source: datasetChartSourceSchema.optional()
});

export const comboChartSchema = z.object({
  id: z.string().min(1),
  type: z.literal("combo"),
  title: z.string().min(1).optional(),
  themePreset: themePresetSchema.optional(),
  presentation: chartPresentationSchema.optional(),
  datasetId: z.string().min(1).optional(),
  data: z.array(tableRowSchema).default([]),
  x: z.string().min(1),
  barY: z.string().min(1),
  lineY: z.string().min(1),
  source: datasetChartSourceSchema.optional()
});

export const chartSchema = z.discriminatedUnion("type", [
  barChartSchema,
  multiBarChartSchema,
  lineChartSchema,
  areaChartSchema,
  scatterChartSchema,
  radarChartSchema,
  donutChartSchema,
  funnelChartSchema,
  kpiCardChartSchema,
  tableChartSchema,
  comboChartSchema
]);

export const layoutGridSchema = z.object({
  columns: z.number().int().min(1),
  rows: z.number().int().min(1)
});

export const layoutItemSchema = z.object({
  chart: z.string().min(1),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1),
  h: z.number().int().min(1)
});

export const layoutSchema = z.object({
  grid: layoutGridSchema,
  items: z.array(layoutItemSchema)
});

export const defaultLayout = {
  grid: { columns: 3, rows: 3 },
  items: []
};

export const dashboardFilterFieldTypeSchema = z.enum(["string", "number", "date"]);
export const dashboardFilterOpSchema = z.enum(["eq", "neq", "gte", "lte", "between", "in", "not_in"]);

export const dashboardFilterSchema = z.object({
  id: z.string().min(1),
  field: z.string().min(1),
  fieldType: dashboardFilterFieldTypeSchema.default("string"),
  op: dashboardFilterOpSchema,
  value: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]),
  valueTo: z.union([z.string(), z.number()]).optional(),
  applyTo: z.array(z.string().min(1)).optional()
});

export const dashboardSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  subtitle: z.string().max(240).optional(),
  themePreset: themePresetSchema.default("clean"),
  presentation: chartPresentationSchema.optional(),
  charts: z.array(chartSchema),
  layout: layoutSchema,
  filters: z.array(dashboardFilterSchema).default([]),
  published: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const createDashboardInputSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1),
  subtitle: z.string().max(240).optional(),
  themePreset: themePresetSchema.default("clean"),
  presentation: chartPresentationSchema.optional(),
  charts: z.array(chartSchema).default([]),
  layout: layoutSchema.default(defaultLayout),
  filters: z.array(dashboardFilterSchema).default([]),
  published: z.boolean().default(false)
});

export const addDashboardFilterInputSchema = z.object({
  dashboardId: z.string().min(1),
  filter: dashboardFilterSchema.extend({ id: z.string().min(1).optional() })
});

export const removeDashboardFilterInputSchema = z.object({
  dashboardId: z.string().min(1),
  filterId: z.string().min(1)
});

export const listDashboardFiltersInputSchema = z.object({
  dashboardId: z.string().min(1)
});

export const updateDashboardFiltersInputSchema = z
  .object({
    dashboardId: z.string().min(1),
    add: z.array(dashboardFilterSchema.extend({ id: z.string().min(1).optional() })).optional(),
    remove: z.array(z.string().min(1)).optional()
  })
  .refine((value) => Boolean((value.add && value.add.length) || (value.remove && value.remove.length)), {
    message: "Provide filters to add and/or ids to remove."
  });

export const addChartInputSchema = z.object({
  dashboardId: z.string().min(1),
  chart: chartSchema
});

export const addChartToDashboardInputSchema = z.object({
  dashboardId: z.string().min(1),
  chart: chartSchema,
  grid: layoutGridSchema.optional(),
  placement: layoutItemSchema.omit({ chart: true }).optional()
});

export const setLayoutInputSchema = z.object({
  dashboardId: z.string().min(1),
  layout: layoutSchema
});

export const deleteChartInputSchema = z.object({
  dashboardId: z.string().min(1).optional(),
  id: z.string().min(1).optional(),
  chartId: z.string().min(1),
  confirm: z.string().optional()
})
  .refine((value) => Boolean(value.dashboardId ?? value.id), {
    message: "dashboardId (or id) is required"
  })
  .transform((value) => ({
    dashboardId: value.dashboardId ?? value.id!,
    chartId: value.chartId,
    confirm: value.confirm
  }));

export const autoLayoutDashboardInputSchema = z.object({
  dashboardId: z.string().min(1)
});

export const deleteDashboardInputSchema = z.object({
  dashboardId: z.string().min(1).optional(),
  id: z.string().min(1).optional(),
  confirm: z.string().optional()
})
  .refine((value) => Boolean(value.dashboardId ?? value.id), {
    message: "dashboardId (or id) is required"
  })
  .transform((value) => ({
    dashboardId: value.dashboardId ?? value.id!,
    confirm: value.confirm
  }));

export const renameDashboardInputSchema = z.object({
  dashboardId: z.string().min(1),
  name: z.string().min(1).max(120)
});

export const setDashboardSubtitleInputSchema = z.object({
  dashboardId: z.string().min(1),
  subtitle: z.string().max(240).optional()
});

export const setDashboardPublishStateInputSchema = z.object({
  dashboardId: z.string().min(1),
  published: z.boolean()
});

export const setDashboardColumnsInputSchema = z.object({
  dashboardId: z.string().min(1),
  columns: z.number().int().min(1)
});

export const setDashboardThemeInputSchema = z.object({
  dashboardId: z.string().min(1),
  themePreset: themePresetSchema
});

export const updateDashboardInputSchema = z
  .object({
    dashboardId: z.string().min(1),
    name: z.string().min(1).optional(),
    subtitle: z.string().max(240).optional(),
    themePreset: themePresetSchema.optional(),
    presentation: chartPresentationSchema.optional(),
    columns: z.number().int().min(1).optional(),
    layout: layoutSchema.optional(),
    autoLayout: z.boolean().optional()
  })
  .refine(
    (value) =>
      Boolean(
        value.name ||
          value.subtitle !== undefined ||
          value.themePreset ||
          value.presentation ||
          value.columns ||
          value.layout ||
          value.autoLayout
      ),
    { message: "At least one dashboard property must be provided." }
  );

export const setChartThemeInputSchema = z.object({
  dashboardId: z.string().min(1),
  chartId: z.string().min(1),
  themePreset: themePresetSchema
});

export const datasetCellSchema = z.union([z.string(), z.number(), z.null()]);
export const datasetRowSchema = z.record(datasetCellSchema);

export const datasetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  columns: z.array(z.string().min(1)).min(1),
  rows: z.array(datasetRowSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  readOnly: z.boolean().optional().default(false)
});

const templateGridPosSchema = z.object({
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  w: z.number().int().min(1),
  h: z.number().int().min(1)
});

const templateChartFilterSchema = z.object({
  field: z.string().min(1),
  operator: dashboardFilterOpSchema,
  value: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]).optional()
});

const templateChartBase = z.object({
  id: z.string().min(1),
  title: z.string().min(1).optional(),
  datasetId: z.string().min(1).optional(),
  gridPos: templateGridPosSchema.optional(),
  filters: z.array(templateChartFilterSchema).optional()
});

const templateMetricAggregation = z.enum(["sum", "avg", "count"]).default("sum");

const templateKpiChartSchema = templateChartBase.extend({
  type: z.literal("kpi_card"),
  valueField: z.string().min(1),
  aggregation: templateMetricAggregation,
  compareField: z.string().min(1).optional(),
  compareCurrentValue: z.union([z.string(), z.number()]).optional(),
  comparePreviousValue: z.union([z.string(), z.number()]).optional()
});

const templateTableChartSchema = templateChartBase.extend({
  type: z.literal("table"),
  columns: z.array(z.string().min(1)).min(1),
  limit: z.number().int().min(1).max(500).optional()
});

const templateBarChartSchema = templateChartBase.extend({
  type: z.literal("bar"),
  xField: z.string().min(1),
  yField: z.string().min(1),
  aggregation: templateMetricAggregation,
  seriesField: z.string().min(1).optional()
});

const templateLineChartSchema = templateChartBase.extend({
  type: z.literal("line"),
  xField: z.string().min(1),
  yField: z.string().min(1),
  aggregation: templateMetricAggregation,
  seriesField: z.string().min(1).optional()
});

const templateAreaChartSchema = templateChartBase.extend({
  type: z.literal("area"),
  xField: z.string().min(1),
  yField: z.string().min(1),
  aggregation: templateMetricAggregation,
  seriesField: z.string().min(1).optional()
});

const templateScatterChartSchema = templateChartBase.extend({
  type: z.literal("scatter"),
  xField: z.string().min(1),
  yField: z.string().min(1),
  seriesField: z.string().min(1).optional()
});

const templateRadarChartSchema = templateChartBase.extend({
  type: z.literal("radar"),
  indexField: z.string().min(1),
  valueField: z.string().min(1),
  aggregation: templateMetricAggregation,
  seriesField: z.string().min(1).optional()
});

const templateDonutChartSchema = templateChartBase.extend({
  type: z.literal("donut"),
  categoryField: z.string().min(1),
  valueField: z.string().min(1),
  aggregation: templateMetricAggregation
});

export const templateChartSchema = z.discriminatedUnion("type", [
  templateKpiChartSchema,
  templateTableChartSchema,
  templateBarChartSchema,
  templateLineChartSchema,
  templateAreaChartSchema,
  templateScatterChartSchema,
  templateRadarChartSchema,
  templateDonutChartSchema
]);

export const templateFilterSchema = z.object({
  id: z.string().min(1).optional(),
  field: z.string().min(1),
  operator: dashboardFilterOpSchema,
  fieldType: dashboardFilterFieldTypeSchema.optional(),
  defaultValue: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]).optional(),
  applyTo: z.array(z.string().min(1)).optional()
});

export const templateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  grid: layoutGridSchema,
  charts: z.array(templateChartSchema).min(1),
  filters: z.array(templateFilterSchema).default([]),
  defaultDatasetId: z.string().min(1),
  requiredColumns: z.array(z.string().min(1)).min(1),
  themePreset: themePresetSchema.optional()
});

export const createDashboardFromTemplateInputSchema = z.object({
  templateId: z.string().min(1),
  dashboardName: z.string().min(1).optional(),
  datasetId: z.string().min(1).optional()
});

export const templateListSchema = z.object({
  templates: z.array(templateSchema)
});

export const registerDatasetInputSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1),
  csv: z.string().min(1).optional(),
  rows: z.array(datasetRowSchema).optional()
});

export const describeDatasetInputSchema = z.object({
  datasetId: z.string().min(1)
});

export const listDatasetContentInputSchema = z.object({
  datasetId: z.string().min(1),
  limit: z.number().int().min(1).max(200).default(20)
});

export const listDashboardsInputSchema = z.object({
  status: z.enum(["active", "deleted", "all"]).default("active")
});


export const fieldFilterSchema = z.object({
  field: z.string().min(1),
  op: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "in"]),
  value: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))])
});

export const dateRangeSchema = z.object({
  field: z.string().min(1),
  start: z.string().optional(),
  end: z.string().optional()
});


export const addBarChartFromDatasetInputSchema = z.object({
  dashboardId: z.string().min(1),
  datasetId: z.string().min(1),
  chartId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  xField: z.string().min(1),
  yField: z.string().min(1),
  aggregation: z.enum(["sum", "avg", "count"]).default("sum"),
  filters: z.array(fieldFilterSchema).optional(),
  dateRange: dateRangeSchema.optional()
});

export const addLineChartFromDatasetInputSchema = z.object({
  dashboardId: z.string().min(1),
  datasetId: z.string().min(1),
  chartId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  xField: z.string().min(1),
  yField: z.string().min(1),
  seriesField: z.string().min(1).optional(),
  aggregation: z.enum(["sum", "avg", "count"]).default("sum"),
  filters: z.array(fieldFilterSchema).optional(),
  dateRange: dateRangeSchema.optional()
});

export const addDonutChartFromDatasetInputSchema = z.object({
  dashboardId: z.string().min(1),
  datasetId: z.string().min(1),
  chartId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  categoryField: z.string().min(1),
  valueField: z.string().min(1),
  aggregation: z.enum(["sum", "avg", "count"]).default("sum"),
  filters: z.array(fieldFilterSchema).optional(),
  dateRange: dateRangeSchema.optional()
});

export const addMultiBarChartFromDatasetInputSchema = z.object({
  dashboardId: z.string().min(1),
  datasetId: z.string().min(1),
  chartId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  xField: z.string().min(1),
  seriesField: z.string().min(1),
  valueField: z.string().min(1),
  mode: z.enum(["grouped", "stacked"]).default("grouped"),
  aggregation: z.enum(["sum", "avg", "count"]).default("sum"),
  filters: z.array(fieldFilterSchema).optional(),
  dateRange: dateRangeSchema.optional()
});

export const addAreaChartFromDatasetInputSchema = z.object({
  dashboardId: z.string().min(1),
  datasetId: z.string().min(1),
  chartId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  xField: z.string().min(1),
  yField: z.string().min(1),
  seriesField: z.string().min(1).optional(),
  aggregation: z.enum(["sum", "avg", "count"]).default("sum"),
  filters: z.array(fieldFilterSchema).optional(),
  dateRange: dateRangeSchema.optional()
});

export const addScatterChartFromDatasetInputSchema = z.object({
  dashboardId: z.string().min(1),
  datasetId: z.string().min(1),
  chartId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  xField: z.string().min(1),
  yField: z.string().min(1),
  seriesField: z.string().min(1).optional(),
  filters: z.array(fieldFilterSchema).optional(),
  dateRange: dateRangeSchema.optional()
});

export const addRadarChartFromDatasetInputSchema = z.object({
  dashboardId: z.string().min(1),
  datasetId: z.string().min(1),
  chartId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  indexField: z.string().min(1),
  valueField: z.string().min(1),
  seriesField: z.string().min(1).optional(),
  aggregation: z.enum(["sum", "avg", "count"]).default("sum"),
  filters: z.array(fieldFilterSchema).optional(),
  dateRange: dateRangeSchema.optional()
});

export const addFunnelChartFromDatasetInputSchema = z.object({
  dashboardId: z.string().min(1),
  datasetId: z.string().min(1),
  chartId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  stageField: z.string().min(1),
  valueField: z.string().min(1),
  aggregation: z.enum(["sum", "avg", "count"]).default("sum"),
  filters: z.array(fieldFilterSchema).optional(),
  dateRange: dateRangeSchema.optional()
});

export const addKpiCardFromDatasetInputSchema = z.object({
  dashboardId: z.string().min(1),
  datasetId: z.string().min(1),
  chartId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  valueField: z.string().min(1),
  aggregation: z.enum(["sum", "avg", "count"]).default("sum"),
  compareField: z.string().min(1).optional(),
  compareCurrentValue: z.union([z.string(), z.number()]).optional(),
  comparePreviousValue: z.union([z.string(), z.number()]).optional(),
  format: z.enum(["compact", "number", "percent", "currency"]).default("compact"),
  currency: z.string().min(3).max(3).optional(),
  filters: z.array(fieldFilterSchema).optional(),
  dateRange: dateRangeSchema.optional()
});

export const addTableChartFromDatasetInputSchema = z.object({
  dashboardId: z.string().min(1),
  datasetId: z.string().min(1),
  chartId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  columns: z.array(z.string().min(1)).min(1).optional(),
  limit: z.number().int().min(1).max(500).default(20),
  filters: z.array(fieldFilterSchema).optional(),
  dateRange: dateRangeSchema.optional()
});

export const addComboChartFromDatasetInputSchema = z.object({
  dashboardId: z.string().min(1),
  datasetId: z.string().min(1),
  chartId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  xField: z.string().min(1),
  barField: z.string().min(1),
  lineField: z.string().min(1),
  aggregation: z.enum(["sum", "avg", "count"]).default("sum"),
  filters: z.array(fieldFilterSchema).optional(),
  dateRange: dateRangeSchema.optional()
});

// Unified chart creation input (delegates to existing per-type schemas)
const createBarChartInputSchema = addBarChartFromDatasetInputSchema.extend({ type: z.literal("bar") });
const createLineChartInputSchema = addLineChartFromDatasetInputSchema.extend({ type: z.literal("line") });
const createAreaChartInputSchema = addAreaChartFromDatasetInputSchema.extend({ type: z.literal("area") });
const createScatterChartInputSchema = addScatterChartFromDatasetInputSchema.extend({ type: z.literal("scatter") });
const createRadarChartInputSchema = addRadarChartFromDatasetInputSchema.extend({ type: z.literal("radar") });
const createDonutChartInputSchema = addDonutChartFromDatasetInputSchema.extend({ type: z.literal("donut") });
const createFunnelChartInputSchema = addFunnelChartFromDatasetInputSchema.extend({ type: z.literal("funnel") });
const createKpiChartInputSchema = addKpiCardFromDatasetInputSchema.extend({ type: z.literal("kpi_card") });
const createTableChartInputSchema = addTableChartFromDatasetInputSchema.extend({ type: z.literal("table") });
const createComboChartInputSchema = addComboChartFromDatasetInputSchema.extend({ type: z.literal("combo") });
const createMultiBarChartInputSchema = addMultiBarChartFromDatasetInputSchema.extend({ type: z.literal("multi_bar") });

export const createChartFromDatasetInputSchema = z.discriminatedUnion("type", [
  createBarChartInputSchema,
  createLineChartInputSchema,
  createAreaChartInputSchema,
  createScatterChartInputSchema,
  createRadarChartInputSchema,
  createDonutChartInputSchema,
  createFunnelChartInputSchema,
  createKpiChartInputSchema,
  createTableChartInputSchema,
  createComboChartInputSchema,
  createMultiBarChartInputSchema
]);

export const dashboardNlInputSchema = z.object({
  request: z.string().min(1),
  dashboardId: z.string().min(1).optional(),
  datasetId: z.string().min(1).optional(),
  csv: z.string().min(1).optional(),
  dashboardName: z.string().min(1).optional(),
  datasetName: z.string().min(1).optional()
});

export type Chart = z.infer<typeof chartSchema>;
export type BarChart = z.infer<typeof barChartSchema>;
export type MultiBarChart = z.infer<typeof multiBarChartSchema>;
export type LineChart = z.infer<typeof lineChartSchema>;
export type AreaChart = z.infer<typeof areaChartSchema>;
export type ScatterChart = z.infer<typeof scatterChartSchema>;
export type RadarChart = z.infer<typeof radarChartSchema>;
export type DonutChart = z.infer<typeof donutChartSchema>;
export type FunnelChart = z.infer<typeof funnelChartSchema>;
export type KpiCardChart = z.infer<typeof kpiCardChartSchema>;
export type TableChart = z.infer<typeof tableChartSchema>;
export type ComboChart = z.infer<typeof comboChartSchema>;
export type ChartPresentation = z.infer<typeof chartPresentationSchema>;
export type Layout = z.infer<typeof layoutSchema>;
export type Dashboard = z.infer<typeof dashboardSchema>;
export type CreateDashboardInput = z.infer<typeof createDashboardInputSchema>;
export type AddChartInput = z.infer<typeof addChartInputSchema>;
export type AddChartToDashboardInput = z.infer<typeof addChartToDashboardInputSchema>;
export type SetLayoutInput = z.infer<typeof setLayoutInputSchema>;
export type DeleteChartInput = z.infer<typeof deleteChartInputSchema>;
export type AutoLayoutDashboardInput = z.infer<typeof autoLayoutDashboardInputSchema>;
export type DeleteDashboardInput = z.infer<typeof deleteDashboardInputSchema>;
export type RenameDashboardInput = z.infer<typeof renameDashboardInputSchema>;
export type UpdateDashboardInput = z.infer<typeof updateDashboardInputSchema>;
export type SetDashboardSubtitleInput = z.infer<typeof setDashboardSubtitleInputSchema>;
export type SetDashboardPublishStateInput = z.infer<typeof setDashboardPublishStateInputSchema>;
export type SetDashboardColumnsInput = z.infer<typeof setDashboardColumnsInputSchema>;
export type SetDashboardThemeInput = z.infer<typeof setDashboardThemeInputSchema>;
export type SetChartThemeInput = z.infer<typeof setChartThemeInputSchema>;
export type SetDashboardPresentationInput = z.infer<typeof setDashboardPresentationInputSchema>;
export type SetChartPresentationInput = z.infer<typeof setChartPresentationInputSchema>;
export type ResetChartPresentationInput = z.infer<typeof resetChartPresentationInputSchema>;
export type Dataset = z.infer<typeof datasetSchema>;
export type RegisterDatasetInput = z.infer<typeof registerDatasetInputSchema>;
export type UpdateDatasetInput = z.infer<typeof updateDatasetInputSchema>;
export type RestoreDatasetSnapshotInput = z.infer<typeof restoreDatasetSnapshotInputSchema>;
export type DescribeDatasetInput = z.infer<typeof describeDatasetInputSchema>;
export type ListDatasetContentInput = z.infer<typeof listDatasetContentInputSchema>;
export type AddBarChartFromDatasetInput = z.infer<typeof addBarChartFromDatasetInputSchema>;
export type AddLineChartFromDatasetInput = z.infer<typeof addLineChartFromDatasetInputSchema>;
export type AddDonutChartFromDatasetInput = z.infer<typeof addDonutChartFromDatasetInputSchema>;
export type AddMultiBarChartFromDatasetInput = z.infer<typeof addMultiBarChartFromDatasetInputSchema>;
export type AddAreaChartFromDatasetInput = z.infer<typeof addAreaChartFromDatasetInputSchema>;
export type AddScatterChartFromDatasetInput = z.infer<typeof addScatterChartFromDatasetInputSchema>;
export type AddRadarChartFromDatasetInput = z.infer<typeof addRadarChartFromDatasetInputSchema>;
export type AddFunnelChartFromDatasetInput = z.infer<typeof addFunnelChartFromDatasetInputSchema>;
export type AddKpiCardFromDatasetInput = z.infer<typeof addKpiCardFromDatasetInputSchema>;
export type AddTableChartFromDatasetInput = z.infer<typeof addTableChartFromDatasetInputSchema>;
export type AddComboChartFromDatasetInput = z.infer<typeof addComboChartFromDatasetInputSchema>;
export type CreateChartFromDatasetInput = z.infer<typeof createChartFromDatasetInputSchema>;
export type DashboardNlInput = z.infer<typeof dashboardNlInputSchema>;
export type ThemePreset = z.infer<typeof themePresetSchema>;
export type NumberFormat = z.infer<typeof numberFormatSchema>;
export type DashboardFilter = z.infer<typeof dashboardFilterSchema>;
export type DashboardFilterFieldType = z.infer<typeof dashboardFilterFieldTypeSchema>;
export type DashboardFilterOp = z.infer<typeof dashboardFilterOpSchema>;
export type AddDashboardFilterInput = z.infer<typeof addDashboardFilterInputSchema>;
export type RemoveDashboardFilterInput = z.infer<typeof removeDashboardFilterInputSchema>;
export type ListDashboardFiltersInput = z.infer<typeof listDashboardFiltersInputSchema>;
export type UpdateDashboardFiltersInput = z.infer<typeof updateDashboardFiltersInputSchema>;
export type TemplateChart = z.infer<typeof templateChartSchema>;
export type TemplateFilter = z.infer<typeof templateFilterSchema>;
export type Template = z.infer<typeof templateSchema>;
export type TemplateList = z.infer<typeof templateListSchema>;
export type CreateDashboardFromTemplateInput = z.infer<typeof createDashboardFromTemplateInputSchema>;
export const dashboardSnapshotSchema = z.object({
  id: z.string().min(1),
  dashboardId: z.string().min(1),
  comment: z.string().optional(),
  createdAt: z.string().datetime(),
  payload: dashboardSchema
});

export const createSnapshotInputSchema = z.object({
  dashboardId: z.string().min(1),
  comment: z.string().optional()
});

export const restoreDashboardVersionInputSchema = z.object({
  dashboardId: z.string().min(1),
  snapshotId: z.string().min(1),
  newName: z.string().min(1).optional()
});

export const listDashboardVersionsInputSchema = z.object({
  dashboardId: z.string().min(1),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0)
});

export const undoDashboardInputSchema = z.object({
  dashboardId: z.string().min(1)
});

export const restoreDeletedDashboardInputSchema = z.object({
  dashboardId: z.string().min(1),
  newId: z.string().min(1).optional(),
  newName: z.string().min(1).optional()
});

export const deletedDashboardSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  deletedAt: z.string().datetime(),
  payload: dashboardSchema
});

export type DashboardSnapshot = z.infer<typeof dashboardSnapshotSchema>;
export type DeletedDashboard = z.infer<typeof deletedDashboardSchema>;
export type CreateSnapshotInput = z.infer<typeof createSnapshotInputSchema>;
export type RestoreDashboardVersionInput = z.infer<typeof restoreDashboardVersionInputSchema>;
export type ListDashboardVersionsInput = z.infer<typeof listDashboardVersionsInputSchema>;
export type UndoDashboardInput = z.infer<typeof undoDashboardInputSchema>;
export type RestoreDeletedDashboardInput = z.infer<typeof restoreDeletedDashboardInputSchema>;
export type ListDashboardsInput = z.infer<typeof listDashboardsInputSchema>;
