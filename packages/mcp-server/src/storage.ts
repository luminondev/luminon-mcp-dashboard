import fs from "node:fs/promises";
import fsSync from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  addBarChartFromDatasetInputSchema,
  addComboChartFromDatasetInputSchema,
  addChartInputSchema,
  addChartToDashboardInputSchema,
  addDonutChartFromDatasetInputSchema,
  addFunnelChartFromDatasetInputSchema,
  addKpiCardFromDatasetInputSchema,
  addLineChartFromDatasetInputSchema,
  addAreaChartFromDatasetInputSchema,
  addScatterChartFromDatasetInputSchema,
  addRadarChartFromDatasetInputSchema,
  addMultiBarChartFromDatasetInputSchema,
  addTableChartFromDatasetInputSchema,
  createChartFromDatasetInputSchema,
  autoLayoutDashboardInputSchema,
  barChartSchema,
  createDashboardInputSchema,
  updateDashboardInputSchema,
  datasetSchema,
  dashboardNlInputSchema,
  dashboardSchema,
  deleteDashboardInputSchema,
  defaultLayout,
  describeDatasetInputSchema,
  donutChartSchema,
  funnelChartSchema,
  kpiCardChartSchema,
  lineChartSchema,
  areaChartSchema,
  scatterChartSchema,
  radarChartSchema,
  comboChartSchema,
  tableChartSchema,
  listDatasetContentInputSchema,
  renameDashboardInputSchema,
  setDashboardSubtitleInputSchema,
  setDashboardPublishStateInputSchema,
  resetChartPresentationInputSchema,
  deleteChartInputSchema,
  layoutSchema,
  registerDatasetInputSchema,
  setLayoutInputSchema,
  setDashboardColumnsInputSchema,
  setDashboardThemeInputSchema,
  setDashboardPresentationInputSchema,
  setChartPresentationInputSchema,
  setChartThemeInputSchema,
  themePresetSchema,
  updateDatasetInputSchema,
  restoreDatasetSnapshotInputSchema,
  dashboardSnapshotSchema,
  deletedDashboardSchema,
  createSnapshotInputSchema,
  restoreDashboardVersionInputSchema,
  listDashboardVersionsInputSchema,
  undoDashboardInputSchema,
  restoreDeletedDashboardInputSchema,
  listDashboardsInputSchema,
  type AddBarChartFromDatasetInput,
  type AddComboChartFromDatasetInput,
  type AddChartInput,
  type AddChartToDashboardInput,
  type AddDonutChartFromDatasetInput,
  type AddFunnelChartFromDatasetInput,
  type AddKpiCardFromDatasetInput,
  type AddLineChartFromDatasetInput,
  type AddAreaChartFromDatasetInput,
  type AddScatterChartFromDatasetInput,
  type AddRadarChartFromDatasetInput,
  type AddMultiBarChartFromDatasetInput,
  type AddTableChartFromDatasetInput,
  type CreateChartFromDatasetInput,
  type AutoLayoutDashboardInput,
  type Dashboard,
  type DashboardNlInput,
  type DeleteDashboardInput,
  type Dataset,
  type Template,
  type DescribeDatasetInput,
  type ListDatasetContentInput,
  type RenameDashboardInput,
  type UpdateDashboardInput,
  type SetDashboardSubtitleInput,
  type SetDashboardPublishStateInput,
  type ResetChartPresentationInput,
  type RegisterDatasetInput,
  type UpdateDatasetInput,
  type SetDashboardColumnsInput,
  type SetDashboardThemeInput,
  type UpdateDashboardFiltersInput,
  type SetDashboardPresentationInput,
  type SetChartPresentationInput,
  type SetChartThemeInput,
  type ThemePreset,
  type SetLayoutInput,
  type CreateDashboardInput,
  type CreateDashboardFromTemplateInput,
  type DeleteChartInput,
  type Chart,
  type ChartPresentation,
  type DashboardSnapshot,
  type RestoreDatasetSnapshotInput,
  type DeletedDashboard,
  type CreateSnapshotInput,
  type RestoreDashboardVersionInput,
  type ListDashboardVersionsInput,
  type UndoDashboardInput,
  type RestoreDeletedDashboardInput,
  addDashboardFilterInputSchema,
  removeDashboardFilterInputSchema,
  listDashboardFiltersInputSchema,
  updateDashboardFiltersInputSchema,
  dashboardFilterSchema,
  createDashboardFromTemplateInputSchema,
  templateListSchema,
  type AddDashboardFilterInput,
  type RemoveDashboardFilterInput,
  type ListDashboardFiltersInput,
  type ListDashboardsInput,
  type DashboardFilter
} from "../../shared/dist/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_DATA_DIR = path.resolve(__dirname, "../../../data");
const TEMPLATES_FILE = path.resolve(__dirname, "..", "..", "shared", "templates.json");

export type DataPaths = {
  baseDir: string;
  dashboards: string;
  datasets: string;
  snapshots: string;
  datasetSnapshots: string;
  deletedDashboards: string;
};

function expandHomeDir(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return raw.startsWith("~") ? path.join(os.homedir(), raw.slice(1)) : raw;
}

function ensureWritableDir(target: string): boolean {
  try {
    fsSync.mkdirSync(target, { recursive: true });
    fsSync.accessSync(target, fsSync.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

const dataPaths: DataPaths = (() => {
  const requestedBaseDir =
    expandHomeDir(process.env.MCP_DATA_DIR?.trim()) ?? path.join(os.homedir(), "Documents", "luminon");
  const fallbackBaseDir = path.join(os.tmpdir(), "luminon");
  const baseDir = ensureWritableDir(requestedBaseDir)
    ? requestedBaseDir
    : ensureWritableDir(fallbackBaseDir)
    ? fallbackBaseDir
    : requestedBaseDir;

  if (baseDir !== requestedBaseDir) {
    console.error(`Luminon data dir '${requestedBaseDir}' is not writable. Falling back to '${baseDir}'.`);
  }

  return {
    baseDir,
    dashboards: path.join(baseDir, "dashboards.json"),
    datasets: path.join(baseDir, "datasets.json"),
    snapshots: path.join(baseDir, "dashboard_versions.json"),
    datasetSnapshots: path.join(baseDir, "dataset_snapshots.json"),
    deletedDashboards: path.join(baseDir, "deleted_dashboards.json")
  };
})();

export function getDataPaths(): DataPaths {
  return { ...dataPaths };
}

async function ensureBaseDir(): Promise<void> {
  await fs.mkdir(dataPaths.baseDir, { recursive: true });
}

async function seedFileFromRepo(targetPath: string, seedFilename: string, fallback: object): Promise<string> {
  await ensureBaseDir();
  const seedPath = path.join(REPO_DATA_DIR, seedFilename);

  try {
    const seedContent = await fs.readFile(seedPath, "utf8");
    await fs.writeFile(targetPath, seedContent, "utf8");
    return seedContent;
  } catch {
    const fallbackContent = JSON.stringify(fallback, null, 2);
    await fs.writeFile(targetPath, fallbackContent, "utf8");
    return fallbackContent;
  }
}

async function readJsonFileWithSeed<T>(targetPath: string, seedFilename: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(targetPath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    const seeded = await seedFileFromRepo(targetPath, seedFilename, fallback as object);
    try {
      return JSON.parse(seeded) as T;
    } catch {
      return structuredClone(fallback);
    }
  }
}

async function loadRepoSeedDashboards(): Promise<Dashboard[]> {
  try {
    const raw = await fs.readFile(path.join(REPO_DATA_DIR, "dashboards.json"), "utf8");
    const parsed = JSON.parse(raw) as { dashboards?: unknown[] };
    return (parsed.dashboards ?? []).map((item) => dashboardSchema.parse(item));
  } catch {
    return [];
  }
}

async function loadRepoSeedDatasets(): Promise<Dataset[]> {
  try {
    const raw = await fs.readFile(path.join(REPO_DATA_DIR, "datasets.json"), "utf8");
    const parsed = JSON.parse(raw) as { datasets?: unknown[] };
    return (parsed.datasets ?? []).map((item) => datasetSchema.parse(item));
  } catch {
    return [];
  }
}

export async function ensureUserDataFiles(): Promise<void> {
  await ensureStore();
  await ensureDatasetStore();
  await ensureSnapshotStore();
  await ensureDeletedStore();
}

type Store = {
  dashboards: Dashboard[];
};

type DatasetStore = {
  datasets: Dataset[];
};

type SnapshotStore = {
  snapshots: DashboardSnapshot[];
};

type DatasetSnapshot = {
  datasetId: string;
  savedAt: string;
  payload: Dataset;
};

type DatasetSnapshotStore = {
  snapshots: DatasetSnapshot[];
};

type DeletedDashboardStore = {
  dashboards: DeletedDashboard[];
};

const emptyStore: Store = { dashboards: [] };
const emptyDatasetStore: DatasetStore = { datasets: [] };
const emptySnapshotStore: SnapshotStore = { snapshots: [] };
const emptyDatasetSnapshotStore: DatasetSnapshotStore = { snapshots: [] };
const emptyDeletedDashboardStore: DeletedDashboardStore = { dashboards: [] };

const THEME_PRESETS: Array<{ id: ThemePreset; description: string }> = [
  { id: "clean", description: "Neutral, minimal, default palette." },
  { id: "business", description: "Corporate blue/teal palette for executive dashboards." },
  { id: "dark_analytics", description: "Dark-friendly high-density analytics look." },
  { id: "pastel", description: "Soft pastel palette for presentation-style dashboards." },
  { id: "high_contrast", description: "Strong contrast palette for accessibility and visibility." },
  { id: "textured", description: "Nivo palette with dots/lines patterns for visual distinction." }
];

// Renderer safety limits to avoid UI degradation.
const LIMITS = {
  maxChartsPerDashboard: 12,
  maxBarCategories: 300,
  maxDonutSlices: 50,
  maxLinePoints: 3000,
  maxMultiBarCells: 1200,
  maxTableRows: 500,
  maxDatasetRows: 50000,
  maxDatasetCsvBytes: 20 * 1024 * 1024
} as const;

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

const BUILT_IN_DATASETS: Dataset[] = [
  datasetSchema.parse({
    id: "default_business",
    name: "Default business dataset",
    columns: ["year", "month", "country", "channel", "category", "sales", "orders"],
    rows: [
      { year: 2024, month: "Jan", country: "US", channel: "Online", category: "Electronics", sales: 120000, orders: 820 },
      { year: 2024, month: "Jan", country: "US", channel: "Retail", category: "Fashion", sales: 74000, orders: 510 },
      { year: 2024, month: "Jan", country: "MX", channel: "Online", category: "Electronics", sales: 53000, orders: 390 },
      { year: 2024, month: "Feb", country: "US", channel: "Online", category: "Electronics", sales: 128000, orders: 860 },
      { year: 2024, month: "Feb", country: "US", channel: "Retail", category: "Fashion", sales: 76000, orders: 520 },
      { year: 2024, month: "Feb", country: "MX", channel: "Online", category: "Electronics", sales: 56000, orders: 410 },
      { year: 2024, month: "Mar", country: "US", channel: "Online", category: "Electronics", sales: 132000, orders: 900 },
      { year: 2024, month: "Mar", country: "US", channel: "Retail", category: "Fashion", sales: 78000, orders: 540 },
      { year: 2024, month: "Mar", country: "MX", channel: "Online", category: "Electronics", sales: 59000, orders: 430 },
      { year: 2025, month: "Jan", country: "US", channel: "Online", category: "Electronics", sales: 138000, orders: 940 },
      { year: 2025, month: "Jan", country: "US", channel: "Retail", category: "Fashion", sales: 81000, orders: 560 },
      { year: 2025, month: "Jan", country: "MX", channel: "Online", category: "Electronics", sales: 62000, orders: 450 },
      { year: 2025, month: "Feb", country: "US", channel: "Online", category: "Electronics", sales: 145000, orders: 980 },
      { year: 2025, month: "Feb", country: "US", channel: "Retail", category: "Fashion", sales: 83000, orders: 575 },
      { year: 2025, month: "Feb", country: "MX", channel: "Online", category: "Electronics", sales: 65000, orders: 470 },
      { year: 2025, month: "Mar", country: "US", channel: "Online", category: "Electronics", sales: 151000, orders: 1020 },
      { year: 2025, month: "Mar", country: "US", channel: "Retail", category: "Fashion", sales: 86000, orders: 590 },
      { year: 2025, month: "Mar", country: "MX", channel: "Online", category: "Electronics", sales: 68000, orders: 490 }
    ],
    createdAt: "2025-03-01T00:00:00.000Z",
    updatedAt: "2025-03-01T00:00:00.000Z",
    readOnly: true
  })
];

function normalizeToolInput(raw: unknown): unknown {
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return JSON.parse(trimmed);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(`Tool input string must be valid JSON. Failed to parse: ${reason}`);
      }
    }
  }
  return raw;
}

function parseWithSchema<T>(schema: { parse(data: unknown): T }, raw: unknown): T {
  return schema.parse(normalizeToolInput(raw));
}

async function ensureStore(): Promise<Store> {
  const parsed = await readJsonFileWithSeed<{ dashboards?: unknown[] }>(
    dataPaths.dashboards,
    "dashboards.json",
    emptyStore
  );
  const dashboards = (parsed.dashboards ?? []).map((item) => dashboardSchema.parse(item));
  const repoSeedDashboards = await loadRepoSeedDashboards();
  const repoSeedDashboardIds = new Set(repoSeedDashboards.map((entry) => entry.id));
  const syncedDashboards = [
    ...repoSeedDashboards,
    ...dashboards.filter((entry) => !repoSeedDashboardIds.has(entry.id))
  ];
  const changed = JSON.stringify(syncedDashboards) !== JSON.stringify(dashboards);

  const store = { dashboards: syncedDashboards };
  if (changed) {
    await saveStore(store);
  }
  return store;
}

async function saveStore(store: Store): Promise<void> {
  await ensureBaseDir();
  await fs.writeFile(dataPaths.dashboards, JSON.stringify(store, null, 2), "utf8");
}

async function ensureDatasetStore(): Promise<DatasetStore> {
  const parsed = await readJsonFileWithSeed<{ datasets?: unknown[] }>(
    dataPaths.datasets,
    "datasets.json",
    emptyDatasetStore
  );
  const datasets = (parsed.datasets ?? []).map((item) => datasetSchema.parse(item));
  const repoSeedDatasets = await loadRepoSeedDatasets();
  const repoSeedDatasetIds = new Set(repoSeedDatasets.map((entry) => entry.id));
  const builtInIds = new Set(BUILT_IN_DATASETS.map((entry) => entry.id));
  const syncedDatasets = [
    ...repoSeedDatasets,
    ...datasets.filter((entry) => !repoSeedDatasetIds.has(entry.id) && !builtInIds.has(entry.id))
  ];

  for (const builtIn of BUILT_IN_DATASETS) {
    if (!syncedDatasets.some((entry) => entry.id === builtIn.id)) syncedDatasets.push(builtIn);
  }

  const store = { datasets: syncedDatasets };
  const persistedDatasets = datasets.filter((entry) => !builtInIds.has(entry.id));
  const nextPersistedDatasets = syncedDatasets.filter((entry) => !builtInIds.has(entry.id));
  const changed = JSON.stringify(nextPersistedDatasets) !== JSON.stringify(persistedDatasets);
  if (changed) {
    await saveDatasetStore({ datasets: nextPersistedDatasets });
  }
  return store;
}

let cachedTemplates: Template[] | null = null;
let cachedSnapshotStore: SnapshotStore | null = null;
let cachedDatasetSnapshotStore: DatasetSnapshotStore | null = null;
let cachedDeletedStore: DeletedDashboardStore | null = null;

async function ensureTemplates(): Promise<Template[]> {
  if (cachedTemplates) return cachedTemplates;
  const raw = await fs.readFile(TEMPLATES_FILE, "utf8");
  const parsed = templateListSchema.parse(JSON.parse(raw));
  cachedTemplates = parsed.templates;
  return parsed.templates;
}

async function ensureSnapshotStore(): Promise<SnapshotStore> {
  if (cachedSnapshotStore) return cachedSnapshotStore;
  const parsed = await readJsonFileWithSeed<{ snapshots?: unknown[] }>(
    dataPaths.snapshots,
    "dashboard_versions.json",
    emptySnapshotStore
  );
  cachedSnapshotStore = {
    snapshots: (parsed.snapshots ?? []).map((s) => dashboardSnapshotSchema.parse(s))
  };
  return cachedSnapshotStore!;
}

async function saveSnapshotStore(store: SnapshotStore): Promise<void> {
  cachedSnapshotStore = store;
  await ensureBaseDir();
  await fs.writeFile(dataPaths.snapshots, JSON.stringify(store, null, 2), "utf8");
}

async function ensureDatasetSnapshotStore(): Promise<DatasetSnapshotStore> {
  if (cachedDatasetSnapshotStore) return cachedDatasetSnapshotStore;
  const parsed = await readJsonFileWithSeed<{ snapshots?: unknown[] }>(
    dataPaths.datasetSnapshots,
    "dataset_snapshots.json",
    emptyDatasetSnapshotStore
  );
  const snapshots: DatasetSnapshot[] = [];
  for (const raw of parsed.snapshots ?? []) {
    try {
      const snap = raw as DatasetSnapshot;
      datasetSchema.parse(snap.payload);
      snapshots.push(snap);
    } catch {
      // ignore invalid snapshot
    }
  }
  cachedDatasetSnapshotStore = { snapshots };
  return cachedDatasetSnapshotStore!;
}

async function saveDatasetSnapshotStore(store: DatasetSnapshotStore): Promise<void> {
  cachedDatasetSnapshotStore = store;
  await ensureBaseDir();
  await fs.writeFile(dataPaths.datasetSnapshots, JSON.stringify(store, null, 2), "utf8");
}

async function snapshotDataset(dataset: Dataset): Promise<void> {
  const store = await ensureDatasetSnapshotStore();
  store.snapshots = store.snapshots.filter((s) => s.datasetId !== dataset.id);
  store.snapshots.push({
    datasetId: dataset.id,
    savedAt: new Date().toISOString(),
    payload: structuredClone(dataset)
  });
  await saveDatasetSnapshotStore(store);
}

async function getDatasetSnapshot(datasetId: string): Promise<DatasetSnapshot | undefined> {
  const store = await ensureDatasetSnapshotStore();
  return store.snapshots.find((s) => s.datasetId === datasetId);
}

async function ensureDeletedStore(): Promise<DeletedDashboardStore> {
  if (cachedDeletedStore) return cachedDeletedStore;
  const parsed = await readJsonFileWithSeed<{ dashboards?: unknown[] }>(
    dataPaths.deletedDashboards,
    "deleted_dashboards.json",
    emptyDeletedDashboardStore
  );
  cachedDeletedStore = {
    dashboards: (parsed.dashboards ?? []).map((d) => deletedDashboardSchema.parse(d))
  };
  return cachedDeletedStore!;
}

async function saveDeletedStore(store: DeletedDashboardStore): Promise<void> {
  cachedDeletedStore = store;
  await ensureBaseDir();
  await fs.writeFile(dataPaths.deletedDashboards, JSON.stringify(store, null, 2), "utf8");
}

async function resolveTemplate(templateId: string): Promise<Template> {
  const templates = await ensureTemplates();
  const template = templates.find((entry) => entry.id === templateId);
  if (!template) {
    throw new Error(`Template '${templateId}' not found.`);
  }
  return template;
}

function ensureTemplateColumns(dataset: Dataset, template: Template): void {
  const missing = template.requiredColumns.filter((column) => !dataset.columns.includes(column));
  if (missing.length > 0) {
    throw new Error(
      `Dataset '${dataset.id}' lacks columns required by template '${template.id}': ${missing.join(", ")}`
    );
  }
}

async function snapshotDashboard(dashboard: Dashboard, comment?: string): Promise<DashboardSnapshot> {
  const store = await ensureSnapshotStore();
  const snapshot: DashboardSnapshot = dashboardSnapshotSchema.parse({
    id: randomId("snap"),
    dashboardId: dashboard.id,
    comment,
    createdAt: new Date().toISOString(),
    payload: structuredClone(dashboard)
  });
  // overwrite single snapshot per dashboard
  store.snapshots = store.snapshots.filter((s) => s.dashboardId !== dashboard.id);
  store.snapshots.push(snapshot);
  await saveSnapshotStore(store);
  return snapshot;
}

async function getSnapshot(dashboardId: string): Promise<DashboardSnapshot | undefined> {
  const store = await ensureSnapshotStore();
  return store.snapshots.find((s) => s.dashboardId === dashboardId);
}

async function restoreSnapshot(dashboardId: string, snapshotId?: string, newName?: string): Promise<Dashboard> {
  const store = await ensureStore();
  const snapshotStore = await ensureSnapshotStore();
  const snapshot =
    snapshotId !== undefined
      ? snapshotStore.snapshots.find((s) => s.id === snapshotId && s.dashboardId === dashboardId)
      : snapshotStore.snapshots.find((s) => s.dashboardId === dashboardId);

  if (!snapshot) {
    throw new Error(`Snapshot not found for dashboard '${dashboardId}'.`);
  }

  const restored: Dashboard = {
    ...snapshot.payload,
    name: newName ?? snapshot.payload.name,
    updatedAt: new Date().toISOString()
  };

  const idx = store.dashboards.findIndex((d) => d.id === dashboardId);
  if (idx === -1) {
    store.dashboards.push(restored);
  } else {
    store.dashboards[idx] = restored;
  }
  await saveStore(store);
  await snapshotDashboard(restored, "auto-snapshot:restore");
  return restored;
}

async function captureSnapshotBeforeChange(dashboard: Dashboard, comment: string): Promise<void> {
  await snapshotDashboard(dashboard, comment);
}

async function saveDatasetStore(store: DatasetStore): Promise<void> {
  await ensureBaseDir();
  await fs.writeFile(dataPaths.datasets, JSON.stringify(store, null, 2), "utf8");
}

function validateLayoutChartRefs(charts: Dashboard["charts"], layout: Dashboard["layout"]): void {
  const chartIds = new Set(charts.map((chart) => chart.id));

  for (const item of layout.items) {
    if (!chartIds.has(item.chart)) {
      throw new Error(`Layout reference not found: chart '${item.chart}'.`);
    }

    if (item.x + item.w > layout.grid.columns) {
      throw new Error(`Chart '${item.chart}' exceeds grid columns.`);
    }

    if (item.y + item.h > layout.grid.rows) {
      throw new Error(`Chart '${item.chart}' exceeds grid rows.`);
    }
  }
}

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function parseCsv(csv: string): { columns: string[]; rows: Array<Record<string, string | number | null>> } {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw new Error("CSV must include a header and at least one data row.");
  }

  const columns = lines[0].split(",").map((item) => item.trim());
  if (columns.some((column) => column.length === 0)) {
    throw new Error("CSV contains empty header names.");
  }

  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((item) => item.trim());
    const row: Record<string, string | number | null> = {};

    for (let i = 0; i < columns.length; i += 1) {
      const raw = values[i] ?? "";
      if (raw === "") {
        row[columns[i]] = null;
      } else if (!Number.isNaN(Number(raw))) {
        row[columns[i]] = Number(raw);
      } else {
        row[columns[i]] = raw;
      }
    }

    return row;
  });

  return { columns, rows };
}

function inferColumns(rows: Array<Record<string, string | number | null>>): string[] {
  const set = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      set.add(key);
    }
  }
  return Array.from(set);
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

function valuePassesFilter(
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
    if (!Array.isArray(expected)) {
      throw new Error("Filter with 'in' requires array value.");
    }
    return expected.some((candidate) => String(candidate) === String(value));
  }

  if (Array.isArray(expected)) {
    throw new Error(`Filter '${op}' requires scalar value.`);
  }

  const left = toComparable(value);
  const right = toComparable(expected);

  if (op === "eq") return String(left) === String(right);
  if (op === "neq") return String(left) !== String(right);
  if (op === "gt") return left > right;
  if (op === "gte") return left >= right;
  if (op === "lt") return left < right;
  return left <= right;
}

function normalizeRowsToColumns(
  rows: Array<Record<string, string | number | null>>,
  columns: string[]
): Array<Record<string, string | number | null>> {
  return rows.map((row) => {
    const normalized: Record<string, string | number | null> = {};
    for (const column of columns) {
      const value = row[column];
      normalized[column] = value === undefined ? null : value;
    }
    return normalized;
  });
}

function ensureRowsHaveColumns(
  rows: Array<Record<string, string | number | null>>,
  columns: string[]
): void {
  for (const row of rows) {
    for (const column of columns) {
      if (!(column in row)) {
        row[column] = null;
      }
    }
  }
}

function columnsMatch(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const a = [...left].sort();
  const b = [...right].sort();
  return a.every((col, idx) => col === b[idx]);
}

function ensureFieldsExist(dataset: Dataset, fields: string[]): void {
  for (const field of fields) {
    if (!dataset.columns.includes(field)) {
      throw new Error(`Field '${field}' does not exist in dataset '${dataset.id}'.`);
    }
  }
}

function autoPlaceChart(
  dashboard: Dashboard,
  chartId: string,
  placement?: { x: number; y: number; w: number; h: number }
): void {
  if (placement) {
    const requiredRows = placement.y + placement.h;
    if (requiredRows > dashboard.layout.grid.rows) {
      dashboard.layout.grid.rows = requiredRows;
    }

    dashboard.layout.items.push({ chart: chartId, ...placement });
    return;
  }

  const cols = dashboard.layout.grid.columns;
  const chartCount = dashboard.layout.items.length;
  const chart = dashboard.charts.find((c) => c.id === chartId);
  const w = chart ? preferredChartWidth(chart, cols) : Math.max(1, Math.ceil(cols / 3));
  const h = 2;
  const slotsPerRow = Math.max(1, Math.floor(cols / w));
  const row = Math.floor(chartCount / slotsPerRow);
  const col = chartCount % slotsPerRow;
  const x = col * w;
  const baseY = row * h;
  const overlapsInColumn = dashboard.layout.items
    .filter((item) => item.x < x + w && x < item.x + item.w)
    .reduce((acc, item) => Math.max(acc, item.y + item.h), 0);
  const y = Math.max(baseY, overlapsInColumn);
  const requiredRows = y + h;

  if (requiredRows > dashboard.layout.grid.rows) {
    dashboard.layout.grid.rows = requiredRows;
  }

  dashboard.layout.items.push({ chart: chartId, x, y, w, h });
}

function preferredChartWidth(chart: Chart, columns: number): number {
  const medium = Math.min(columns, 2);
  const wide = Math.min(columns, 3);

  switch (chart.type) {
    case "kpi_card":
      return 1;
    case "table":
      return columns;
    case "donut":
      return medium;
    case "radar":
      return columns >= 5 ? wide : medium;
    case "scatter":
      return chart.data.length > 18 ? wide : medium;
    case "combo":
      return chart.data.length > 8 ? wide : medium;
    case "line":
    case "area":
      return chart.data.length > 8 ? wide : medium;
    case "bar":
      if (chart.data.length > 10) return wide;
      if (chart.data.length > 5) return medium;
      return 1;
    case "bar_grouped":
    case "bar_stacked":
      if (chart.data.length > 5 || chart.keys.length > 2) return wide;
      return medium;
    case "funnel":
      return medium;
    default:
      return 1;
  }
}

function applyDatasetFilters<T extends { filters?: Array<{ field: string; op: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "in"; value: string | number | Array<string | number> }>; dateRange?: { field: string; start?: string; end?: string } }>(
  rows: Array<Record<string, string | number | null>>,
  input: T
): Array<Record<string, string | number | null>> {
  let out = [...rows];

  for (const filter of input.filters ?? []) {
    out = out.filter((row) => valuePassesFilter(row[filter.field] ?? null, filter.op, filter.value));
  }

  if (input.dateRange) {
    const { field, start, end } = input.dateRange;
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

function aggregateValues(values: number[], aggregation: "sum" | "avg" | "count"): number {
  if (aggregation === "count") return values.length;
  const total = values.reduce((acc, value) => acc + value, 0);
  if (aggregation === "avg") return values.length === 0 ? 0 : total / values.length;
  return total;
}

function assertUniqueChart(dashboard: Dashboard, chartId: string): void {
  if (dashboard.charts.some((chart) => chart.id === chartId)) {
    throw new Error(`Chart '${chartId}' already exists in dashboard '${dashboard.id}'.`);
  }
}

function assertDashboardCapacity(dashboard: Dashboard): void {
  if (dashboard.charts.length >= LIMITS.maxChartsPerDashboard) {
    throw new Error(
      `Dashboard '${dashboard.id}' reached max charts (${LIMITS.maxChartsPerDashboard}).`
    );
  }
}

function assertChartRenderLimits(chart: Chart): void {
  if (chart.type === "bar" && chart.data && chart.data.length > LIMITS.maxBarCategories) {
    throw new Error(`Bar chart '${chart.id}' exceeds max categories (${LIMITS.maxBarCategories}).`);
  }

  if (chart.type === "donut" && chart.data.length > LIMITS.maxDonutSlices) {
    throw new Error(`Donut chart '${chart.id}' exceeds max slices (${LIMITS.maxDonutSlices}).`);
  }

  if (chart.type === "line" && chart.data.length > LIMITS.maxLinePoints) {
    throw new Error(`Line chart '${chart.id}' exceeds max points (${LIMITS.maxLinePoints}).`);
  }

  if (chart.type === "area" && chart.data.length > LIMITS.maxLinePoints) {
    throw new Error(`Area chart '${chart.id}' exceeds max points (${LIMITS.maxLinePoints}).`);
  }

  if (chart.type === "bar_grouped" || chart.type === "bar_stacked") {
    const cells = chart.data.length * chart.keys.length;
    if (cells > LIMITS.maxMultiBarCells) {
      throw new Error(
        `Multi bar chart '${chart.id}' exceeds max cells (${LIMITS.maxMultiBarCells}).`
      );
    }
  }

  if (chart.type === "combo" && chart.data.length > LIMITS.maxBarCategories) {
    throw new Error(`Combo chart '${chart.id}' exceeds max categories (${LIMITS.maxBarCategories}).`);
  }

  if (chart.type === "funnel" && chart.data.length > LIMITS.maxBarCategories) {
    throw new Error(`Funnel chart '${chart.id}' exceeds max stages (${LIMITS.maxBarCategories}).`);
  }

  if (chart.type === "table" && chart.rows.length > LIMITS.maxTableRows) {
    throw new Error(`Table chart '${chart.id}' exceeds max rows (${LIMITS.maxTableRows}).`);
  }
}

function assertDashboardChartsLimits(charts: Chart[]): void {
  if (charts.length > LIMITS.maxChartsPerDashboard) {
    throw new Error(`Dashboard exceeds max charts (${LIMITS.maxChartsPerDashboard}).`);
  }
  for (const chart of charts) {
    assertChartRenderLimits(chart);
  }
}

function touchDashboard(dashboard: Dashboard): void {
  dashboard.updatedAt = new Date().toISOString();
}

function mergePresentation(
  current: Dashboard["presentation"] | Chart["presentation"] | undefined,
  patch: Dashboard["presentation"] | Chart["presentation"]
): Dashboard["presentation"] {
  const safePatch = patch ?? {};
  const next = {
    ...(current ?? {}),
    ...safePatch,
    margin: {
      ...(current?.margin ?? {}),
      ...(safePatch.margin ?? {})
    }
  };
  return next;
}

export async function createDashboard(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(createDashboardInputSchema, input) as CreateDashboardInput;
  layoutSchema.parse(parsed.layout);
  assertDashboardChartsLimits(parsed.charts);
  validateLayoutChartRefs(parsed.charts, parsed.layout);

  const store = await ensureStore();

  const now = new Date().toISOString();
  const dashboard: Dashboard = {
    id: parsed.id ?? randomId("db"),
    name: parsed.name,
    subtitle: parsed.subtitle,
    themePreset: parsed.themePreset ?? "clean",
    presentation: parsed.presentation,
    charts: parsed.charts,
    layout: parsed.layout,
    filters: parsed.filters ?? [],
    published: parsed.published ?? false,
    createdAt: now,
    updatedAt: now
  };

  if (store.dashboards.some((d) => d.id === dashboard.id)) {
    throw new Error(`Dashboard '${dashboard.id}' already exists.`);
  }

  store.dashboards.push(dashboard);
  await saveStore(store);
  await snapshotDashboard(dashboard, "auto-snapshot:create");

  return dashboard;
}

export async function addChart(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(addChartInputSchema, input) as AddChartInput;
  const store = await ensureStore();

  const dashboard = store.dashboards.find((d) => d.id === parsed.dashboardId);
  if (!dashboard) {
    throw new Error(`Dashboard '${parsed.dashboardId}' not found.`);
  }

  assertDashboardCapacity(dashboard);
  assertUniqueChart(dashboard, parsed.chart.id);
  assertChartRenderLimits(parsed.chart);
  dashboard.charts.push(parsed.chart);
  touchDashboard(dashboard);
  validateLayoutChartRefs(dashboard.charts, dashboard.layout);

  await saveStore(store);
  await snapshotDashboard(dashboard, "auto-snapshot:add_chart");
  return dashboard;
}

export async function addChartToDashboard(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(addChartToDashboardInputSchema, input) as AddChartToDashboardInput;
  const store = await ensureStore();

  const dashboard = store.dashboards.find((d) => d.id === parsed.dashboardId);
  if (!dashboard) {
    throw new Error(`Dashboard '${parsed.dashboardId}' not found.`);
  }

  if (parsed.grid) {
    dashboard.layout.grid = parsed.grid;
    dashboard.layout.items = dashboard.layout.items.filter(
      (item) => item.x + item.w <= parsed.grid!.columns && item.y + item.h <= parsed.grid!.rows
    );
  }

  assertDashboardCapacity(dashboard);
  assertUniqueChart(dashboard, parsed.chart.id);
  assertChartRenderLimits(parsed.chart);
  dashboard.charts.push(parsed.chart);
  autoPlaceChart(dashboard, parsed.chart.id, parsed.placement);
  touchDashboard(dashboard);
  validateLayoutChartRefs(dashboard.charts, dashboard.layout);

  await saveStore(store);
  await snapshotDashboard(dashboard, "auto-snapshot:add_chart_to_dashboard");
  return dashboard;
}

export async function setLayout(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(setLayoutInputSchema, input) as SetLayoutInput;
  const store = await ensureStore();

  const dashboard = store.dashboards.find((d) => d.id === parsed.dashboardId);
  if (!dashboard) {
    throw new Error(`Dashboard '${parsed.dashboardId}' not found.`);
  }

  validateLayoutChartRefs(dashboard.charts, parsed.layout);
  dashboard.layout = parsed.layout;
  touchDashboard(dashboard);

  await saveStore(store);
  await snapshotDashboard(dashboard, "auto-snapshot:set_layout");
  return dashboard;
}

export async function updateDashboard(raw: unknown): Promise<Dashboard> {
  const input = parseWithSchema(updateDashboardInputSchema, raw) as UpdateDashboardInput;
  const store = await ensureStore();
  const dashboard = store.dashboards.find((d) => d.id === input.dashboardId);
  if (!dashboard) {
    throw new Error(`Dashboard '${input.dashboardId}' not found.`);
  }

  if (input.name) dashboard.name = input.name;
  if (input.subtitle !== undefined) dashboard.subtitle = input.subtitle;
  if (input.themePreset) dashboard.themePreset = themePresetSchema.parse(input.themePreset);
  if (input.presentation) {
    dashboard.presentation = { ...(dashboard.presentation ?? {}), ...input.presentation };
  }
  if (input.columns) {
    dashboard.layout.grid.columns = input.columns;
  }
  if (input.layout) {
    dashboard.layout = layoutSchema.parse(input.layout);
    validateLayoutChartRefs(dashboard.charts, dashboard.layout);
  }

  touchDashboard(dashboard);
  await saveStore(store);

  if (input.autoLayout) {
    return autoLayoutDashboard({ dashboardId: dashboard.id });
  }

  await snapshotDashboard(dashboard, "auto-snapshot:update_dashboard");
  return dashboard;
}

export async function deleteChart(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(deleteChartInputSchema, input) as DeleteChartInput;
  if (parsed.confirm !== "DELETE") {
    throw new Error(
      `Confirmation required to delete chart '${parsed.chartId}'. Ask for confirmation and retry with confirm: "DELETE".`
    );
  }
  const store = await ensureStore();

  const dashboard = store.dashboards.find((d) => d.id === parsed.dashboardId);
  if (!dashboard) {
    throw new Error(`Dashboard '${parsed.dashboardId}' not found.`);
  }

  const initialLength = dashboard.charts.length;
  dashboard.charts = dashboard.charts.filter((chart) => chart.id !== parsed.chartId);

  if (dashboard.charts.length === initialLength) {
    throw new Error(`Chart '${parsed.chartId}' not found in dashboard '${parsed.dashboardId}'.`);
  }

  dashboard.layout.items = dashboard.layout.items.filter((item) => item.chart !== parsed.chartId);
  touchDashboard(dashboard);

  await saveStore(store);
  await snapshotDashboard(dashboard, "auto-snapshot:delete_chart");
  return dashboard;
}

export async function listDashboards(): Promise<Dashboard[]> {
  const store = await ensureStore();
  return store.dashboards;
}

export async function listDashboardsFiltered(raw: unknown): Promise<{
  status: ListDashboardsInput["status"];
  dashboards: Array<Dashboard | DeletedDashboard>;
}> {
  const { status } = parseWithSchema(listDashboardsInputSchema, raw ?? {}) as ListDashboardsInput;
  if (status === "active") {
    return { status, dashboards: await listDashboards() };
  }
  if (status === "deleted") {
    const deleted = await listDeletedDashboards();
    return { status, dashboards: deleted };
  }
  // all
  const active = await listDashboards();
  const deleted = await listDeletedDashboards();
  return { status, dashboards: [...active, ...deleted] };
}

export async function listAvailableDashboards(): Promise<Array<{ id: string; name: string; charts: number; updatedAt: string }>> {
  const store = await ensureStore();
  return store.dashboards
    .map((dashboard) => ({
      id: dashboard.id,
      name: dashboard.name,
      charts: dashboard.charts.length,
      updatedAt: dashboard.updatedAt
    }))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export async function listThemePresets(): Promise<Array<{ id: ThemePreset; description: string }>> {
  return THEME_PRESETS;
}

export async function setDashboardTheme(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(setDashboardThemeInputSchema, input) as SetDashboardThemeInput;
  const store = await ensureStore();
  const dashboard = store.dashboards.find((entry) => entry.id === parsed.dashboardId);
  if (!dashboard) {
    throw new Error(`Dashboard '${parsed.dashboardId}' not found.`);
  }

  dashboard.themePreset = themePresetSchema.parse(parsed.themePreset);
  touchDashboard(dashboard);
  await saveStore(store);
  return dashboard;
}

export async function setDashboardPresentation(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(setDashboardPresentationInputSchema, input) as SetDashboardPresentationInput;
  const store = await ensureStore();
  const dashboard = store.dashboards.find((entry) => entry.id === parsed.dashboardId);
  if (!dashboard) {
    throw new Error(`Dashboard '${parsed.dashboardId}' not found.`);
  }

  dashboard.presentation = mergePresentation(dashboard.presentation, parsed.presentation);
  touchDashboard(dashboard);
  await saveStore(store);
  await snapshotDashboard(dashboard, "auto-snapshot:set_dashboard_presentation");
  return dashboard;
}

export async function setChartTheme(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(setChartThemeInputSchema, input) as SetChartThemeInput;
  const store = await ensureStore();
  const dashboard = store.dashboards.find((entry) => entry.id === parsed.dashboardId);
  if (!dashboard) {
    throw new Error(`Dashboard '${parsed.dashboardId}' not found.`);
  }

  const chart = dashboard.charts.find((entry) => entry.id === parsed.chartId);
  if (!chart) {
    throw new Error(`Chart '${parsed.chartId}' not found in dashboard '${parsed.dashboardId}'.`);
  }

  chart.themePreset = themePresetSchema.parse(parsed.themePreset);
  touchDashboard(dashboard);
  await saveStore(store);
  await snapshotDashboard(dashboard, "auto-snapshot:set_chart_theme");
  return dashboard;
}

export async function setChartPresentation(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(setChartPresentationInputSchema, input) as SetChartPresentationInput;
  const store = await ensureStore();
  const dashboard = store.dashboards.find((entry) => entry.id === parsed.dashboardId);
  if (!dashboard) {
    throw new Error(`Dashboard '${parsed.dashboardId}' not found.`);
  }

  const chart = dashboard.charts.find((entry) => entry.id === parsed.chartId);
  if (!chart) {
    throw new Error(`Chart '${parsed.chartId}' not found in dashboard '${parsed.dashboardId}'.`);
  }

  chart.presentation = mergePresentation(chart.presentation, parsed.presentation);
  touchDashboard(dashboard);
  await saveStore(store);
  await snapshotDashboard(dashboard, "auto-snapshot:set_chart_presentation");
  return dashboard;
}

export async function resetChartPresentation(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(resetChartPresentationInputSchema, input) as ResetChartPresentationInput;
  const store = await ensureStore();
  const dashboard = store.dashboards.find((entry) => entry.id === parsed.dashboardId);
  if (!dashboard) {
    throw new Error(`Dashboard '${parsed.dashboardId}' not found.`);
  }

  const chart = dashboard.charts.find((entry) => entry.id === parsed.chartId);
  if (!chart) {
    throw new Error(`Chart '${parsed.chartId}' not found in dashboard '${parsed.dashboardId}'.`);
  }

  delete chart.presentation;
  touchDashboard(dashboard);
  await saveStore(store);
  return dashboard;
}

export async function deleteDashboard(input: unknown): Promise<{ deletedDashboardId: string }> {
  const parsed = parseWithSchema(deleteDashboardInputSchema, input) as DeleteDashboardInput;
  if (parsed.confirm !== "DELETE") {
    throw new Error(
      `Confirmation required to delete dashboard '${parsed.dashboardId}'. Ask for confirmation and retry with confirm: "DELETE".`
    );
  }
  const store = await ensureStore();
  const deletedStore = await ensureDeletedStore();
  const idx = store.dashboards.findIndex((entry) => entry.id === parsed.dashboardId);
  if (idx === -1) {
    throw new Error(`Dashboard '${parsed.dashboardId}' not found.`);
  }

  const [removed] = store.dashboards.splice(idx, 1);
  const deleted = deletedDashboardSchema.parse({
    id: removed.id,
    name: removed.name,
    deletedAt: new Date().toISOString(),
    payload: removed
  });
  deletedStore.dashboards = deletedStore.dashboards.filter((d) => d.id !== removed.id);
  deletedStore.dashboards.push(deleted);

  await saveStore(store);
  await saveDeletedStore(deletedStore);
  await saveSnapshotStore((await ensureSnapshotStore())); // keep cache warmed
  return { deletedDashboardId: parsed.dashboardId };
}

export async function renameDashboard(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(renameDashboardInputSchema, input) as RenameDashboardInput;
  const store = await ensureStore();
  const dashboard = store.dashboards.find((entry) => entry.id === parsed.dashboardId);
  if (!dashboard) {
    throw new Error(`Dashboard '${parsed.dashboardId}' not found.`);
  }

  dashboard.name = parsed.name.trim();
  if (!dashboard.name) {
    throw new Error("Dashboard name cannot be empty.");
  }
  touchDashboard(dashboard);
  await saveStore(store);
  await snapshotDashboard(dashboard, "auto-snapshot:rename");
  return dashboard;
}

export async function setDashboardPublishState(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(
    setDashboardPublishStateInputSchema,
    input
  ) as SetDashboardPublishStateInput;
  const store = await ensureStore();
  const dashboard = store.dashboards.find((entry) => entry.id === parsed.dashboardId);
  if (!dashboard) {
    throw new Error(`Dashboard '${parsed.dashboardId}' not found.`);
  }

  dashboard.published = parsed.published;
  touchDashboard(dashboard);
  await saveStore(store);
  return dashboard;
}

export async function setDashboardSubtitle(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(setDashboardSubtitleInputSchema, input) as SetDashboardSubtitleInput;
  const store = await ensureStore();
  const dashboard = store.dashboards.find((entry) => entry.id === parsed.dashboardId);
  if (!dashboard) {
    throw new Error(`Dashboard '${parsed.dashboardId}' not found.`);
  }

  const nextSubtitle = parsed.subtitle?.trim();
  if (nextSubtitle) {
    dashboard.subtitle = nextSubtitle;
  } else {
    delete dashboard.subtitle;
  }
  touchDashboard(dashboard);
  await saveStore(store);
  return dashboard;
}

function buildBalancedLayout(
  charts: Chart[],
  columns: number,
  widthOverrides?: Map<string, number>
): Dashboard["layout"]["items"] {
  if (charts.length === 0) return [];

  const items: Dashboard["layout"]["items"] = [];
  const clampWidth = (w: number) => Math.max(1, Math.min(w, columns));

  let rowY = 0;
  let rowHeight = 0;
  let col = 0;

  const widthForChart = (chart: Chart): number => {
    const override = widthOverrides?.get(chart.id);
    const recommended = preferredChartWidth(chart, columns);
    if (override && override > 0) return Math.max(override, recommended);
    return recommended;
  };

  for (const chart of charts) {
    const w = clampWidth(widthForChart(chart));
    const h = 2;

    // wrap to next row if not enough space
    if (col + w > columns) {
      rowY += rowHeight || 2;
      col = 0;
      rowHeight = 0;
    }

    items.push({ chart: chart.id, x: col, y: rowY, w, h });
    col += w;
    rowHeight = Math.max(rowHeight, h);
  }

  // finalize grid height
  const lastRowHeight = rowHeight || 2;
  const rows = rowY + lastRowHeight;
  // adjust layout grid.rows elsewhere after this builder

  return items.map((item) => ({ ...item, h: 2 }));
}

export async function autoLayoutDashboard(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(autoLayoutDashboardInputSchema, input) as AutoLayoutDashboardInput;
  const store = await ensureStore();
  const dashboard = store.dashboards.find((entry) => entry.id === parsed.dashboardId);

  if (!dashboard) {
    throw new Error(`Dashboard '${parsed.dashboardId}' not found.`);
  }

  const widthOverrides = new Map<string, number>();
  for (const item of dashboard.layout.items) {
    if (item.w > 0) widthOverrides.set(item.chart, item.w);
  }

  const columns = dashboard.layout.grid.columns > 0 ? dashboard.layout.grid.columns : 3;
  dashboard.layout.items = buildBalancedLayout(dashboard.charts, columns, widthOverrides);
  const maxBottom = dashboard.layout.items.reduce((acc, item) => Math.max(acc, item.y + item.h), 0);
  dashboard.layout.grid.rows = Math.max(3, maxBottom);
  touchDashboard(dashboard);

  validateLayoutChartRefs(dashboard.charts, dashboard.layout);
  await saveStore(store);
  return dashboard;
}

export async function setDashboardColumns(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(setDashboardColumnsInputSchema, input) as SetDashboardColumnsInput;
  const store = await ensureStore();
  const dashboard = store.dashboards.find((entry) => entry.id === parsed.dashboardId);

  if (!dashboard) {
    throw new Error(`Dashboard '${parsed.dashboardId}' not found.`);
  }

  dashboard.layout.grid.columns = parsed.columns;
  const widthOverrides = new Map<string, number>();
  for (const item of dashboard.layout.items) {
    if (item.w > 0) widthOverrides.set(item.chart, item.w);
  }
  dashboard.layout.items = buildBalancedLayout(dashboard.charts, parsed.columns, widthOverrides);
  const maxBottom = dashboard.layout.items.reduce((acc, item) => Math.max(acc, item.y + item.h), 0);
  dashboard.layout.grid.rows = Math.max(3, maxBottom);
  touchDashboard(dashboard);

  validateLayoutChartRefs(dashboard.charts, dashboard.layout);
  await saveStore(store);
  await snapshotDashboard(dashboard, "auto-snapshot:set_columns");
  return dashboard;
}

export async function registerDataset(input: unknown): Promise<Dataset> {
  const parsed = parseWithSchema(registerDatasetInputSchema, input) as RegisterDatasetInput;
  const hasCsv = Boolean(parsed.csv);
  const hasRows = Boolean(parsed.rows);

  if (hasCsv === hasRows) {
    throw new Error("Provide exactly one source: either 'csv' or 'rows'.");
  }

  const datasetStore = await ensureDatasetStore();
  const now = new Date().toISOString();
  let rows: Array<Record<string, string | number | null>>;
  let columns: string[];

  if (parsed.csv) {
    if (Buffer.byteLength(parsed.csv, "utf8") > LIMITS.maxDatasetCsvBytes) {
      throw new Error(
        `CSV size exceeds max allowed (${Math.floor(LIMITS.maxDatasetCsvBytes / (1024 * 1024))} MB).`
      );
    }
    const parsedCsv = parseCsv(parsed.csv);
    rows = parsedCsv.rows;
    columns = parsedCsv.columns;
  } else {
    rows = parsed.rows ?? [];
    columns = inferColumns(rows);
  }

  if (columns.length === 0) {
    throw new Error("Dataset must include at least one column.");
  }

  if (rows.length > LIMITS.maxDatasetRows) {
    throw new Error(`Dataset rows exceed max allowed (${LIMITS.maxDatasetRows}).`);
  }

  const dataset: Dataset = datasetSchema.parse({
    id: parsed.id ?? randomId("ds"),
    name: parsed.name,
    columns,
    rows,
    createdAt: now,
    updatedAt: now
  });

  if (datasetStore.datasets.some((entry) => entry.id === dataset.id)) {
    throw new Error(`Dataset '${dataset.id}' already exists.`);
  }

  datasetStore.datasets.push(dataset);
  await saveDatasetStore(datasetStore);
  return dataset;
}

export async function updateDataset(input: unknown): Promise<Dataset> {
  const parsed = parseWithSchema(updateDatasetInputSchema, input) as UpdateDatasetInput;
  const datasetStore = await ensureDatasetStore();
  const target = datasetStore.datasets.find((entry) => entry.id === parsed.datasetId);

  if (!target) {
    throw new Error(`Dataset '${parsed.datasetId}' not found.`);
  }

  if (target.readOnly) {
    throw new Error(`Dataset '${target.id}' es de solo lectura; duplica con otro id para modificarlo.`);
  }

  const hasCsv = Boolean(parsed.csv);
  const hasRows = Boolean(parsed.rows);
  if (hasCsv === hasRows) {
    throw new Error("Provide exactly one source: either 'csv' or 'rows'.");
  }

  const now = new Date().toISOString();
  let rows: Array<Record<string, string | number | null>>;
  let columns: string[];

  if (parsed.csv) {
    if (Buffer.byteLength(parsed.csv, "utf8") > LIMITS.maxDatasetCsvBytes) {
      throw new Error(
        `CSV size exceeds max allowed (${Math.floor(LIMITS.maxDatasetCsvBytes / (1024 * 1024))} MB).`
      );
    }
    const parsedCsv = parseCsv(parsed.csv);
    rows = parsedCsv.rows;
    columns = parsedCsv.columns;
  } else {
    rows = parsed.rows ?? [];
    columns = inferColumns(rows);
  }

  if (columns.length === 0) {
    throw new Error("Dataset must include at least one column.");
  }

  const baseColumns = target.columns;
  const addedColumns = columns.filter((col) => !baseColumns.includes(col));
  const finalColumns =
    parsed.mode === "replace"
      ? parsed.allowSchemaChange
        ? columns
        : baseColumns
      : parsed.allowSchemaChange
      ? [...baseColumns, ...addedColumns]
      : baseColumns;

  if (!parsed.allowSchemaChange && !columnsMatch(baseColumns, columns)) {
    throw new Error(
      `Column set differs from existing dataset. Column changes require 'allowSchemaChange': true.`
    );
  }

  if (!parsed.allowSchemaChange && addedColumns.length > 0) {
    throw new Error(
      `New columns detected: ${addedColumns.join(", ")}. Set 'allowSchemaChange' true to extend schema.`
    );
  }

  const normalizedIncoming = normalizeRowsToColumns(rows, finalColumns);
  const prospectiveTotal =
    parsed.mode === "append" ? target.rows.length + normalizedIncoming.length : normalizedIncoming.length;

  if (prospectiveTotal > LIMITS.maxDatasetRows) {
    throw new Error(`Dataset rows exceed max allowed (${LIMITS.maxDatasetRows}).`);
  }

  await snapshotDataset(target);

  if (parsed.allowSchemaChange && addedColumns.length > 0) {
    ensureRowsHaveColumns(target.rows, finalColumns);
    target.columns = finalColumns;
  }

  if (parsed.mode === "replace") {
    target.rows = normalizedIncoming;
    target.columns = finalColumns;
  } else {
    target.rows.push(...normalizedIncoming);
  }

  target.updatedAt = now;
  await saveDatasetStore(datasetStore);
  const store = await ensureStore();
  let mutated = false;
  for (const dashboard of store.dashboards) {
    let dashboardMutated = false;
    for (const chart of dashboard.charts) {
      if (chart.type === "kpi_card" && chart.source?.datasetId === target.id) {
        if (recomputeKpiFromSource(chart as Extract<Chart, { type: "kpi_card" }>, dashboard, target)) {
          dashboardMutated = true;
          mutated = true;
        }
      }
      if ((chart.type === "bar" || chart.type === "line" || chart.type === "area") && chart.source?.datasetId === target.id) {
        if (recomputeBarLineAreaFromSource(chart as Extract<Chart, { type: "bar" | "line" | "area" }>, dashboard, target)) {
          dashboardMutated = true;
          mutated = true;
        }
      }
      if (chart.type === "table" && chart.source?.datasetId === target.id) {
        if (recomputeTableFromSource(chart as Extract<Chart, { type: "table" }>, dashboard, target)) {
          dashboardMutated = true;
          mutated = true;
        }
      }
    }
    if (dashboardMutated) {
      touchDashboard(dashboard);
      validateLayoutChartRefs(dashboard.charts, dashboard.layout);
    }
  }
  if (mutated) {
    await saveStore(store);
  }
  return target;
}

export async function restoreDatasetSnapshot(input: unknown): Promise<Dataset> {
  const parsed = parseWithSchema(restoreDatasetSnapshotInputSchema, input) as RestoreDatasetSnapshotInput;
  const datasetStore = await ensureDatasetStore();
  const snapshot = await getDatasetSnapshot(parsed.datasetId);
  if (!snapshot) {
    throw new Error(`No snapshot found for dataset '${parsed.datasetId}'.`);
  }

  const idx = datasetStore.datasets.findIndex((entry) => entry.id === parsed.datasetId);
  const restored: Dataset = { ...snapshot.payload, updatedAt: new Date().toISOString() };

  if (idx === -1) {
    datasetStore.datasets.push(restored);
  } else {
    if (datasetStore.datasets[idx].readOnly) {
      throw new Error(`Dataset '${parsed.datasetId}' es de solo lectura y no puede restaurarse.`);
    }
    await snapshotDataset(datasetStore.datasets[idx]);
    datasetStore.datasets[idx] = restored;
  }

  await saveDatasetStore(datasetStore);
  return restored;
}

export async function listDatasets(): Promise<Dataset[]> {
  const store = await ensureDatasetStore();
  return store.datasets;
}

export async function describeDataset(input: unknown): Promise<{
  id: string;
  name: string;
  columns: string[];
  rowCount: number;
  sampleRows: Array<Record<string, string | number | null>>;
}> {
  const parsed = parseWithSchema(describeDatasetInputSchema, input) as DescribeDatasetInput;
  const store = await ensureDatasetStore();
  const dataset = store.datasets.find((entry) => entry.id === parsed.datasetId);

  if (!dataset) {
    throw new Error(`Dataset '${parsed.datasetId}' not found.`);
  }

  return {
    id: dataset.id,
    name: dataset.name,
    columns: dataset.columns,
    rowCount: dataset.rows.length,
    sampleRows: dataset.rows.slice(0, 5)
  };
}

export async function listDatasetContent(input: unknown): Promise<{
  datasetId: string;
  name: string;
  columns: string[];
  rows: Array<Record<string, string | number | null>>;
  totalRows: number;
  returnedRows: number;
  truncated: boolean;
}> {
  const parsed = parseWithSchema(listDatasetContentInputSchema, input) as ListDatasetContentInput;
  const store = await ensureDatasetStore();
  const dataset = store.datasets.find((entry) => entry.id === parsed.datasetId);

  if (!dataset) {
    throw new Error(`Dataset '${parsed.datasetId}' not found.`);
  }

  const rows = dataset.rows.slice(0, parsed.limit);
  return {
    datasetId: dataset.id,
    name: dataset.name,
    columns: dataset.columns,
    rows,
    totalRows: dataset.rows.length,
    returnedRows: rows.length,
    truncated: dataset.rows.length > rows.length
  };
}

export async function listTemplates(): Promise<Template[]> {
  return ensureTemplates();
}

export async function createDashboardFromTemplate(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(createDashboardFromTemplateInputSchema, input) as CreateDashboardFromTemplateInput;
  const template = await resolveTemplate(parsed.templateId);
  const datasetStore = await ensureDatasetStore();
  const datasetId = parsed.datasetId ?? template.defaultDatasetId;
  const dataset = datasetStore.datasets.find((entry) => entry.id === datasetId);

  if (!dataset) {
    throw new Error(`Dataset '${datasetId}' not found.`);
  }

  ensureTemplateColumns(dataset, template);
  const dashboardName = parsed.dashboardName ?? `${template.name} (${dataset.name})`;
  let dashboard = await createDashboard({
    name: dashboardName,
    themePreset: template.themePreset ?? "clean",
    layout: {
      grid: template.grid,
      items: []
    }
  });

  for (const templateFilter of template.filters) {
    if (templateFilter.defaultValue === undefined) {
      throw new Error(`Template '${template.id}' filter on '${templateFilter.field}' lacks a default value.`);
    }
    const filterPayload = {
      id: templateFilter.id ?? randomId("filter"),
      field: templateFilter.field,
      fieldType: templateFilter.fieldType ?? (typeof templateFilter.defaultValue === "number" ? "number" : "string"),
      op: templateFilter.operator,
      value: templateFilter.defaultValue,
      applyTo: templateFilter.applyTo
    };
    dashboard = await addDashboardFilter({ dashboardId: dashboard.id, filter: filterPayload });
  }

  const toFieldFilters = (filters: Template["charts"][number]["filters"]): Array<{
    field: string;
    op: string;
    value: string | number | Array<string | number>;
  }> => {
    return (filters ?? []).map((filter) => {
      if (filter.value === undefined) {
        throw new Error(`Chart '${filter.field}' filter requires a value.`);
      }
      return {
        field: filter.field,
        op: filter.operator,
        value: filter.value
      };
    });
  };

  const templateFiltersForChart = (chartId: string) =>
    template.filters
      .filter((f) => !f.applyTo || f.applyTo.includes(chartId))
      .map((f) => ({
        field: f.field,
        op: f.operator,
        value: f.defaultValue as string | number | Array<string | number>
      }));

  for (const chart of template.charts) {
    const filters = [
      ...toFieldFilters(chart.filters),
      ...templateFiltersForChart(chart.id)
    ];
    const common = {
      dashboardId: dashboard.id,
      datasetId,
      chartId: chart.id,
      title: chart.title,
      filters
    };

    switch (chart.type) {
      case "kpi_card":
        await addKpiCardFromDataset({
          ...common,
          valueField: chart.valueField,
          aggregation: chart.aggregation,
          compareField: chart.compareField,
          compareCurrentValue: chart.compareCurrentValue,
          comparePreviousValue: chart.comparePreviousValue
        });
        break;
      case "table":
        await addTableChartFromDataset({
          ...common,
          columns: chart.columns,
          limit: chart.limit
        });
        break;
      case "bar":
        await addBarChartFromDataset({
          ...common,
          xField: chart.xField,
          yField: chart.yField,
          aggregation: chart.aggregation,
          seriesField: chart.seriesField
        });
        break;
      case "line":
        await addLineChartFromDataset({
          ...common,
          xField: chart.xField,
          yField: chart.yField,
          aggregation: chart.aggregation,
          seriesField: chart.seriesField
        });
        break;
      case "area":
        await addAreaChartFromDataset({
          ...common,
          xField: chart.xField,
          yField: chart.yField,
          aggregation: chart.aggregation,
          seriesField: chart.seriesField
        });
        break;
      case "scatter":
        await addScatterChartFromDataset({
          ...common,
          xField: chart.xField,
          yField: chart.yField,
          seriesField: chart.seriesField
        });
        break;
      case "radar":
        await addRadarChartFromDataset({
          ...common,
          indexField: chart.indexField,
          valueField: chart.valueField,
          aggregation: chart.aggregation,
          seriesField: chart.seriesField
        });
        break;
      case "donut":
        await addDonutChartFromDataset({
          ...common,
          categoryField: chart.categoryField,
          valueField: chart.valueField,
          aggregation: chart.aggregation
        });
        break;
      default:
        throw new Error(`Unsupported chart type in template '${template.id}'.`);
    }
  }

  if (template.charts.some((chart) => !chart.gridPos)) {
    return dashboard;
  }

  const layoutItems = template.charts.map((chart) => ({
    chart: chart.id,
    x: chart.gridPos!.x,
    y: chart.gridPos!.y,
    w: chart.gridPos!.w,
    h: chart.gridPos!.h
  }));

  return setLayout({
    dashboardId: dashboard.id,
    layout: {
      grid: template.grid,
      items: layoutItems
    }
  });
}

function resolveDatasetAndDashboard(dashboardId: string, datasetId: string): Promise<{ store: Store; dashboard: Dashboard; dataset: Dataset }> {
  return Promise.all([ensureStore(), ensureDatasetStore()]).then(([store, datasetStore]) => {
    const dashboard = store.dashboards.find((entry) => entry.id === dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard '${dashboardId}' not found.`);
    }

    const dataset = datasetStore.datasets.find((entry) => entry.id === datasetId);
    if (!dataset) {
      throw new Error(`Dataset '${datasetId}' not found.`);
    }

    return { store, dashboard, dataset };
  });
}

type FieldFilterOp = "eq" | "neq" | "gte" | "lte" | "in" | "gt" | "lt";

function dashboardFiltersToFieldFilters(filters: DashboardFilter[] = []): Array<{
  field: string;
  op: FieldFilterOp;
  value: string | number | Array<string | number>;
}> {
  return filters.map((filter) => ({
    field: filter.field,
    op: filter.op as FieldFilterOp,
    value: filter.value
  }));
}

export async function createChartFromDataset(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(createChartFromDatasetInputSchema, input) as CreateChartFromDatasetInput;
  const { type, ...rest } = parsed as Record<string, unknown>;

  switch (parsed.type) {
    case "bar":
      return addBarChartFromDataset(rest as AddBarChartFromDatasetInput);
    case "line":
      return addLineChartFromDataset(rest as AddLineChartFromDatasetInput);
    case "area":
      return addAreaChartFromDataset(rest as AddAreaChartFromDatasetInput);
    case "scatter":
      return addScatterChartFromDataset(rest as AddScatterChartFromDatasetInput);
    case "radar":
      return addRadarChartFromDataset(rest as AddRadarChartFromDatasetInput);
    case "donut":
      return addDonutChartFromDataset(rest as AddDonutChartFromDatasetInput);
    case "funnel":
      return addFunnelChartFromDataset(rest as AddFunnelChartFromDatasetInput);
    case "kpi_card":
      return addKpiCardFromDataset(rest as AddKpiCardFromDatasetInput);
    case "table":
      return addTableChartFromDataset(rest as AddTableChartFromDatasetInput);
    case "combo":
      return addComboChartFromDataset(rest as AddComboChartFromDatasetInput);
    case "multi_bar":
      return addMultiBarChartFromDataset(rest as AddMultiBarChartFromDatasetInput);
    default:
      // Exhaustive guard
      throw new Error(`Unsupported chart type '${type as string}'`);
  }
}

export async function addBarChartFromDataset(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(addBarChartFromDatasetInputSchema, input) as AddBarChartFromDatasetInput;
  const { store, dashboard, dataset } = await resolveDatasetAndDashboard(parsed.dashboardId, parsed.datasetId);

  const filterFields = (parsed.filters ?? []).map((item) => item.field);
  const extraFields = parsed.dateRange ? [parsed.dateRange.field] : [];
  ensureFieldsExist(dataset, [parsed.xField, parsed.yField, ...filterFields, ...extraFields]);

  const allFilters = [...(parsed.filters ?? []), ...dashboardFiltersToFieldFilters(dashboard.filters)];
  const filteredRows = applyDatasetFilters(dataset.rows, { ...parsed, filters: allFilters });
  if (filteredRows.length === 0) {
    throw new Error("No rows matched filters/dateRange for chart generation.");
  }

  const grouped = new Map<string, number[]>();
  for (const row of filteredRows) {
    const xValue = row[parsed.xField];
    if (xValue === undefined || xValue === null) continue;

    const key = String(xValue);
    if (!grouped.has(key)) grouped.set(key, []);

    if (parsed.aggregation === "count") {
      grouped.get(key)?.push(1);
    } else {
      const yRaw = row[parsed.yField];
      const yNumber = typeof yRaw === "number" ? yRaw : Number(yRaw);
      if (!Number.isNaN(yNumber)) grouped.get(key)?.push(yNumber);
    }
  }

  const data = Array.from(grouped.entries())
    .map(([xValue, values]) => {
      if (values.length === 0) return null;
      return {
        [parsed.xField]: xValue,
        [parsed.yField]: Number(aggregateValues(values, parsed.aggregation).toFixed(4))
      };
    })
    .filter((value): value is Record<string, string | number> => value !== null)
    .sort((left, right) => {
      const a = toComparable(left[parsed.xField] as string | number);
      const b = toComparable(right[parsed.xField] as string | number);
      return a < b ? -1 : a > b ? 1 : 0;
    });

  if (data.length === 0) {
    throw new Error("Could not build bar chart data from selected fields.");
  }

  const chartId = parsed.chartId ?? randomId("chart");
  assertUniqueChart(dashboard, chartId);

  const chart = barChartSchema.parse({
    id: chartId,
    type: "bar",
    title: parsed.title ?? `${parsed.yField} by ${parsed.xField}`,
    datasetId: parsed.datasetId,
    data: [],
    x: parsed.xField,
    y: parsed.yField,
    source: {
      datasetId: parsed.datasetId,
      xField: parsed.xField,
      yField: parsed.yField,
      aggregation: parsed.aggregation,
      filters: parsed.filters,
      dateRange: parsed.dateRange
    }
  });

  assertDashboardCapacity(dashboard);
  assertChartRenderLimits(chart);
  dashboard.charts.push(chart);
  autoPlaceChart(dashboard, chart.id);
  touchDashboard(dashboard);
  validateLayoutChartRefs(dashboard.charts, dashboard.layout);

  await saveStore(store);
  await snapshotDashboard(dashboard, "auto-snapshot:delete_dashboard_filter");
  return dashboard;
}

export async function addLineChartFromDataset(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(addLineChartFromDatasetInputSchema, input) as AddLineChartFromDatasetInput;
  const { store, dashboard, dataset } = await resolveDatasetAndDashboard(parsed.dashboardId, parsed.datasetId);

  const filterFields = (parsed.filters ?? []).map((item) => item.field);
  const extra = [parsed.xField, parsed.yField, ...(parsed.seriesField ? [parsed.seriesField] : [])];
  const extraDate = parsed.dateRange ? [parsed.dateRange.field] : [];
  ensureFieldsExist(dataset, [...extra, ...filterFields, ...extraDate]);

  const filteredRows = applyDatasetFilters(dataset.rows, parsed);
  if (filteredRows.length === 0) {
    throw new Error("No rows matched filters/dateRange for chart generation.");
  }

  const grouped = new Map<string, number[]>();
  for (const row of filteredRows) {
    const xValue = row[parsed.xField];
    if (xValue === undefined || xValue === null) continue;
    const seriesValue = parsed.seriesField ? row[parsed.seriesField] : "series_1";
    const key = `${String(seriesValue)}::${String(xValue)}`;
    if (!grouped.has(key)) grouped.set(key, []);

    if (parsed.aggregation === "count") {
      grouped.get(key)?.push(1);
    } else {
      const yRaw = row[parsed.yField];
      const yNumber = typeof yRaw === "number" ? yRaw : Number(yRaw);
      if (!Number.isNaN(yNumber)) grouped.get(key)?.push(yNumber);
    }
  }

  const data = Array.from(grouped.entries())
    .map(([key, values]) => {
      if (values.length === 0) return null;
      const [seriesName, xValue] = key.split("::");
      return {
        [parsed.xField]: xValue,
        [parsed.yField]: Number(aggregateValues(values, parsed.aggregation).toFixed(4)),
        ...(parsed.seriesField ? { [parsed.seriesField]: seriesName } : {})
      };
    })
    .filter((value): value is Record<string, string | number> => value !== null)
    .sort((left, right) => {
      const a = toComparable(left[parsed.xField] as string | number);
      const b = toComparable(right[parsed.xField] as string | number);
      return a < b ? -1 : a > b ? 1 : 0;
    });

  if (data.length === 0) {
    throw new Error("Could not build line chart data from selected fields.");
  }

  const chartId = parsed.chartId ?? randomId("chart");
  assertUniqueChart(dashboard, chartId);

  const chart = lineChartSchema.parse({
    id: chartId,
    type: "line",
    title: parsed.title ?? `${parsed.yField} trend`,
    data: [],
    datasetId: parsed.datasetId,
    x: parsed.xField,
    y: parsed.yField,
    series: parsed.seriesField,
    source: {
      datasetId: parsed.datasetId,
      xField: parsed.xField,
      yField: parsed.yField,
      seriesField: parsed.seriesField,
      aggregation: parsed.aggregation,
      filters: parsed.filters,
      dateRange: parsed.dateRange
    }
  });

  assertDashboardCapacity(dashboard);
  assertChartRenderLimits(chart);
  dashboard.charts.push(chart);
  autoPlaceChart(dashboard, chart.id);
  touchDashboard(dashboard);
  validateLayoutChartRefs(dashboard.charts, dashboard.layout);

  await saveStore(store);
  return dashboard;
}

export async function addDonutChartFromDataset(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(addDonutChartFromDatasetInputSchema, input) as AddDonutChartFromDatasetInput;
  const { store, dashboard, dataset } = await resolveDatasetAndDashboard(parsed.dashboardId, parsed.datasetId);

  const filterFields = (parsed.filters ?? []).map((item) => item.field);
  const extraFields = parsed.dateRange ? [parsed.dateRange.field] : [];
  ensureFieldsExist(dataset, [parsed.categoryField, parsed.valueField, ...filterFields, ...extraFields]);

  const filteredRows = applyDatasetFilters(dataset.rows, parsed);
  if (filteredRows.length === 0) {
    throw new Error("No rows matched filters/dateRange for chart generation.");
  }

  const hasValues = filteredRows.some((row) => row[parsed.categoryField] !== undefined && row[parsed.categoryField] !== null);
  if (!hasValues) {
    throw new Error("Could not build donut chart data from selected fields.");
  }

  const chartId = parsed.chartId ?? randomId("chart");
  assertUniqueChart(dashboard, chartId);

  const chart = donutChartSchema.parse({
    id: chartId,
    type: "donut",
    title: parsed.title ?? `${parsed.valueField} by ${parsed.categoryField}`,
    data: [],
    datasetId: parsed.datasetId,
    source: {
      datasetId: parsed.datasetId,
      categoryField: parsed.categoryField,
      valueField: parsed.valueField,
      aggregation: parsed.aggregation,
      filters: parsed.filters,
      dateRange: parsed.dateRange
    },
    autoAggregation: {
      datasetId: parsed.datasetId,
      groupBy: parsed.categoryField,
      aggregation: parsed.aggregation,
      valueField: parsed.valueField
    }
  });

  assertDashboardCapacity(dashboard);
  assertChartRenderLimits(chart);
  dashboard.charts.push(chart);
  autoPlaceChart(dashboard, chart.id);
  touchDashboard(dashboard);
  validateLayoutChartRefs(dashboard.charts, dashboard.layout);

  await saveStore(store);
  return dashboard;
}

export async function addMultiBarChartFromDataset(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(addMultiBarChartFromDatasetInputSchema, input) as AddMultiBarChartFromDatasetInput;
  const { store, dashboard, dataset } = await resolveDatasetAndDashboard(parsed.dashboardId, parsed.datasetId);

  const filterFields = (parsed.filters ?? []).map((item) => item.field);
  const extraFields = parsed.dateRange ? [parsed.dateRange.field] : [];
  ensureFieldsExist(dataset, [parsed.xField, parsed.seriesField, parsed.valueField, ...filterFields, ...extraFields]);

  const filteredRows = applyDatasetFilters(dataset.rows, parsed);
  if (filteredRows.length === 0) {
    throw new Error("No rows matched filters/dateRange for multi bar chart generation.");
  }

  const xValuesOrder: string[] = [];
  const seriesSet = new Set<string>();

  for (const row of filteredRows) {
    const xRaw = row[parsed.xField];
    const seriesRaw = row[parsed.seriesField];
    if (xRaw === undefined || xRaw === null || seriesRaw === undefined || seriesRaw === null) continue;

    const x = String(xRaw);
    const series = String(seriesRaw);
    if (!xValuesOrder.includes(x)) xValuesOrder.push(x);
    seriesSet.add(series);
  }

  const keys = Array.from(seriesSet).sort((a, b) => a.localeCompare(b));
  if (xValuesOrder.length === 0 || keys.length === 0) {
    throw new Error("Could not build grouped/stacked bar data from selected fields.");
  }

  const chartId = parsed.chartId ?? randomId("chart");
  assertUniqueChart(dashboard, chartId);
  const chart = {
    id: chartId,
    type: parsed.mode === "stacked" ? "bar_stacked" : "bar_grouped",
    title: parsed.title ?? `${parsed.valueField} by ${parsed.xField} and ${parsed.seriesField}`,
    data: [],
    indexBy: parsed.xField,
    keys,
    yLabel: parsed.valueField,
    datasetId: parsed.datasetId,
    source: {
      datasetId: parsed.datasetId,
      xField: parsed.xField,
      seriesField: parsed.seriesField,
      valueField: parsed.valueField,
      aggregation: parsed.aggregation ?? "sum",
      filters: parsed.filters,
      dateRange: parsed.dateRange
    },
    autoAggregation: {
      datasetId: parsed.datasetId,
      groupBy: parsed.xField,
      seriesBy: parsed.seriesField,
      aggregation: parsed.aggregation ?? "sum",
      valueField: parsed.valueField
    }
  } as Chart;

  assertDashboardCapacity(dashboard);
  assertChartRenderLimits(chart);
  dashboard.charts.push(chart);
  autoPlaceChart(dashboard, chartId);
  touchDashboard(dashboard);
  validateLayoutChartRefs(dashboard.charts, dashboard.layout);
  await saveStore(store);
  await snapshotDashboard(dashboard, "auto-snapshot:auto_layout");
  return dashboard;
}

export async function addAreaChartFromDataset(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(addAreaChartFromDatasetInputSchema, input) as AddAreaChartFromDatasetInput;
  const { store, dashboard, dataset } = await resolveDatasetAndDashboard(parsed.dashboardId, parsed.datasetId);

  const filterFields = (parsed.filters ?? []).map((item) => item.field);
  const extra = [parsed.xField, parsed.yField, ...(parsed.seriesField ? [parsed.seriesField] : [])];
  const extraDate = parsed.dateRange ? [parsed.dateRange.field] : [];
  ensureFieldsExist(dataset, [...extra, ...filterFields, ...extraDate]);

  const filteredRows = applyDatasetFilters(dataset.rows, parsed);
  if (filteredRows.length === 0) {
    throw new Error("No rows matched filters/dateRange for area chart generation.");
  }

  const grouped = new Map<string, number[]>();
  for (const row of filteredRows) {
    const xValue = row[parsed.xField];
    if (xValue === undefined || xValue === null) continue;
    const seriesValue = parsed.seriesField ? row[parsed.seriesField] : "series_1";
    const key = `${String(seriesValue)}::${String(xValue)}`;
    if (!grouped.has(key)) grouped.set(key, []);

    if (parsed.aggregation === "count") {
      grouped.get(key)?.push(1);
    } else {
      const yRaw = row[parsed.yField];
      const yNumber = typeof yRaw === "number" ? yRaw : Number(yRaw);
      if (!Number.isNaN(yNumber)) grouped.get(key)?.push(yNumber);
    }
  }

  const data = Array.from(grouped.entries())
    .map(([key, values]) => {
      if (values.length === 0) return null;
      const [seriesName, xValue] = key.split("::");
      return {
        [parsed.xField]: xValue,
        [parsed.yField]: Number(aggregateValues(values, parsed.aggregation).toFixed(4)),
        ...(parsed.seriesField ? { [parsed.seriesField]: seriesName } : {})
      };
    })
    .filter((value): value is Record<string, string | number> => value !== null)
    .sort((left, right) => {
      const a = toComparable(left[parsed.xField] as string | number);
      const b = toComparable(right[parsed.xField] as string | number);
      return a < b ? -1 : a > b ? 1 : 0;
    });

  if (data.length === 0) {
    throw new Error("Could not build area chart data from selected fields.");
  }

  const chartId = parsed.chartId ?? randomId("chart");
  assertUniqueChart(dashboard, chartId);

  const chart = areaChartSchema.parse({
    id: chartId,
    type: "area",
    title: parsed.title ?? `${parsed.yField} area trend`,
    data: [],
    datasetId: parsed.datasetId,
    x: parsed.xField,
    y: parsed.yField,
    series: parsed.seriesField,
    source: {
      datasetId: parsed.datasetId,
      xField: parsed.xField,
      yField: parsed.yField,
      seriesField: parsed.seriesField,
      aggregation: parsed.aggregation,
      filters: parsed.filters,
      dateRange: parsed.dateRange
    }
  });

  assertDashboardCapacity(dashboard);
  assertChartRenderLimits(chart);
  dashboard.charts.push(chart);
  autoPlaceChart(dashboard, chart.id);
  touchDashboard(dashboard);
  validateLayoutChartRefs(dashboard.charts, dashboard.layout);

  await saveStore(store);
  return dashboard;
}

export async function addScatterChartFromDataset(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(addScatterChartFromDatasetInputSchema, input) as AddScatterChartFromDatasetInput;
  const { store, dashboard, dataset } = await resolveDatasetAndDashboard(parsed.dashboardId, parsed.datasetId);

  const filterFields = (parsed.filters ?? []).map((item) => item.field);
  const extraFields = parsed.dateRange ? [parsed.dateRange.field] : [];
  const baseFields = [parsed.xField, parsed.yField, ...(parsed.seriesField ? [parsed.seriesField] : [])];
  ensureFieldsExist(dataset, [...baseFields, ...filterFields, ...extraFields]);

  const allFilters = [...(parsed.filters ?? []), ...dashboardFiltersToFieldFilters(dashboard.filters)];
  const filteredRows = applyDatasetFilters(dataset.rows, { ...parsed, filters: allFilters });
  const data = filteredRows
    .map((row) => {
      const xRaw = row[parsed.xField];
      const yRaw = row[parsed.yField];
      const xNum = typeof xRaw === "number" ? xRaw : Number(xRaw);
      const yNum = typeof yRaw === "number" ? yRaw : Number(yRaw);
      if (Number.isNaN(xNum) || Number.isNaN(yNum)) return null;
      const point: Record<string, string | number> = { x: xNum, y: yNum };
      if (parsed.seriesField) {
        const s = row[parsed.seriesField];
        if (s !== undefined && s !== null) point.series = String(s);
      }
      return point;
    })
    .filter((item): item is Record<string, string | number> => item !== null);

  if (data.length === 0) {
    throw new Error("No numeric points found for scatter chart after filters/dateRange.");
  }

  const chartId = parsed.chartId ?? randomId("chart");
  assertUniqueChart(dashboard, chartId);
  const chart = scatterChartSchema.parse({
    id: chartId,
    type: "scatter",
    title: parsed.title ?? `${parsed.yField} vs ${parsed.xField}`,
    data: [],
    x: parsed.xField,
    y: parsed.yField,
    series: parsed.seriesField,
    datasetId: parsed.datasetId,
    source: {
      datasetId: parsed.datasetId,
      xField: parsed.xField,
      yField: parsed.yField,
      seriesField: parsed.seriesField,
      filters: parsed.filters,
      dateRange: parsed.dateRange
    }
  });

  assertDashboardCapacity(dashboard);
  assertChartRenderLimits(chart);
  dashboard.charts.push(chart);
  autoPlaceChart(dashboard, chart.id);
  touchDashboard(dashboard);
  validateLayoutChartRefs(dashboard.charts, dashboard.layout);
  await saveStore(store);
  return dashboard;
}

export async function addRadarChartFromDataset(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(addRadarChartFromDatasetInputSchema, input) as AddRadarChartFromDatasetInput;
  const { store, dashboard, dataset } = await resolveDatasetAndDashboard(parsed.dashboardId, parsed.datasetId);

  const filterFields = (parsed.filters ?? []).map((item) => item.field);
  const extraFields = parsed.dateRange ? [parsed.dateRange.field] : [];
  ensureFieldsExist(dataset, [parsed.indexField, parsed.valueField, ...(parsed.seriesField ? [parsed.seriesField] : []), ...filterFields, ...extraFields]);

  const filteredRows = applyDatasetFilters(dataset.rows, parsed);
  if (filteredRows.length === 0) {
    throw new Error("No rows matched filters/dateRange for radar chart generation.");
  }

  const grouped = new Map<string, number[]>();
  for (const row of filteredRows) {
    const index = row[parsed.indexField];
    if (index === undefined || index === null) continue;
    const seriesValue = parsed.seriesField ? row[parsed.seriesField] : "series_1";
    const key = `${String(seriesValue)}::${String(index)}`;
    if (!grouped.has(key)) grouped.set(key, []);

    if (parsed.aggregation === "count") {
      grouped.get(key)?.push(1);
    } else {
      const raw = row[parsed.valueField];
      const numeric = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isNaN(numeric)) grouped.get(key)?.push(numeric);
    }
  }

  const data = Array.from(grouped.entries())
    .map(([key, values]) => {
      if (values.length === 0) return null;
      const [series, index] = key.split("::");
      return {
        index,
        value: Number(aggregateValues(values, parsed.aggregation).toFixed(4)),
        ...(parsed.seriesField ? { series } : {})
      };
    })
    .filter((value): value is { index: string; value: number; series?: string } => value !== null);

  if (data.length === 0) {
    throw new Error("Could not build radar chart data from selected fields.");
  }

  const chartId = parsed.chartId ?? randomId("chart");
  assertUniqueChart(dashboard, chartId);
  const chart = radarChartSchema.parse({
    id: chartId,
    type: "radar",
    title: parsed.title ?? `${parsed.valueField} por ${parsed.indexField}`,
    data: [],
    indexField: parsed.indexField,
    valueField: parsed.valueField,
    seriesField: parsed.seriesField,
    datasetId: parsed.datasetId,
    source: {
      datasetId: parsed.datasetId,
      indexField: parsed.indexField,
      valueField: parsed.valueField,
      seriesField: parsed.seriesField,
      aggregation: parsed.aggregation,
      filters: parsed.filters,
      dateRange: parsed.dateRange
    }
  });

  assertDashboardCapacity(dashboard);
  assertChartRenderLimits(chart);
  dashboard.charts.push(chart);
  autoPlaceChart(dashboard, chart.id);
  touchDashboard(dashboard);
  validateLayoutChartRefs(dashboard.charts, dashboard.layout);
  await saveStore(store);
  return dashboard;
}

export async function addFunnelChartFromDataset(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(addFunnelChartFromDatasetInputSchema, input) as AddFunnelChartFromDatasetInput;
  const { store, dashboard, dataset } = await resolveDatasetAndDashboard(parsed.dashboardId, parsed.datasetId);

  const filterFields = (parsed.filters ?? []).map((item) => item.field);
  const extraFields = parsed.dateRange ? [parsed.dateRange.field] : [];
  ensureFieldsExist(dataset, [parsed.stageField, parsed.valueField, ...filterFields, ...extraFields]);

  const filteredRows = applyDatasetFilters(dataset.rows, parsed);
  if (filteredRows.length === 0) {
    throw new Error("No rows matched filters/dateRange for funnel chart generation.");
  }

  const uniqueStages = new Set(
    filteredRows
      .map((row) => row[parsed.stageField])
      .filter((v) => v !== undefined && v !== null)
      .map((v) => String(v))
  );
  if (uniqueStages.size < 2) {
    throw new Error("Funnel chart needs at least 2 non-empty stages.");
  }

  const chartId = parsed.chartId ?? randomId("chart");
  assertUniqueChart(dashboard, chartId);
  const chart = funnelChartSchema.parse({
    id: chartId,
    type: "funnel",
    title: parsed.title ?? `${parsed.valueField} funnel`,
    data: [],
    datasetId: parsed.datasetId,
    source: {
      datasetId: parsed.datasetId,
      stageField: parsed.stageField,
      valueField: parsed.valueField,
      aggregation: parsed.aggregation,
      filters: parsed.filters,
      dateRange: parsed.dateRange
    },
    autoAggregation: {
      datasetId: parsed.datasetId,
      groupBy: parsed.stageField,
      aggregation: parsed.aggregation,
      valueField: parsed.valueField
    }
  });

  assertDashboardCapacity(dashboard);
  assertChartRenderLimits(chart);
  dashboard.charts.push(chart);
  autoPlaceChart(dashboard, chart.id);
  touchDashboard(dashboard);
  validateLayoutChartRefs(dashboard.charts, dashboard.layout);
  await saveStore(store);
  return dashboard;
}

export async function addKpiCardFromDataset(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(addKpiCardFromDatasetInputSchema, input) as AddKpiCardFromDatasetInput;
  const { store, dashboard, dataset } = await resolveDatasetAndDashboard(parsed.dashboardId, parsed.datasetId);

  const filterFields = (parsed.filters ?? []).map((item) => item.field);
  const compareFields = parsed.compareField ? [parsed.compareField] : [];
  const extraFields = parsed.dateRange ? [parsed.dateRange.field] : [];
  ensureFieldsExist(dataset, [parsed.valueField, ...compareFields, ...filterFields, ...extraFields]);
  const filteredRows = applyDatasetFilters(dataset.rows, parsed);
  if (filteredRows.length === 0) {
    throw new Error("No rows matched filters/dateRange for KPI generation.");
  }

  const values: number[] = [];
  for (const row of filteredRows) {
    if (parsed.aggregation === "count") {
      values.push(1);
      continue;
    }
    const raw = row[parsed.valueField];
    const numeric = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isNaN(numeric)) values.push(numeric);
  }
  if (values.length === 0) {
    throw new Error("No numeric values found for KPI.");
  }
  const value = Number(aggregateValues(values, parsed.aggregation).toFixed(4));

  let delta: number | undefined;
  if (parsed.compareField && parsed.compareCurrentValue !== undefined && parsed.comparePreviousValue !== undefined) {
    const currentRows = filteredRows.filter(
      (row) => String(row[parsed.compareField!]) === String(parsed.compareCurrentValue)
    );
    const previousRows = filteredRows.filter(
      (row) => String(row[parsed.compareField!]) === String(parsed.comparePreviousValue)
    );
    const calc = (rows: Array<Record<string, string | number | null>>) => {
      const nums = rows
        .map((row) => row[parsed.valueField])
        .map((raw) => (typeof raw === "number" ? raw : Number(raw)))
        .filter((num) => !Number.isNaN(num));
      if (parsed.aggregation === "count") return rows.length;
      return nums.length === 0 ? 0 : aggregateValues(nums, parsed.aggregation);
    };
    const current = calc(currentRows);
    const previous = calc(previousRows);
    if (previous !== 0) {
      delta = Number((((current - previous) / previous) * 100).toFixed(2));
    }
  }

  const chartId = parsed.chartId ?? randomId("chart");
  assertUniqueChart(dashboard, chartId);
  const chart = kpiCardChartSchema.parse({
    id: chartId,
    type: "kpi_card",
    title: parsed.title ?? `KPI: ${parsed.valueField}`,
    label: parsed.aggregation === "count" ? "count" : parsed.aggregation,
    value,
    delta,
    format: parsed.format,
    currency: parsed.currency,
    datasetId: parsed.datasetId,
    source: {
      datasetId: parsed.datasetId,
      valueField: parsed.valueField,
      aggregation: parsed.aggregation,
      compareField: parsed.compareField,
      compareCurrentValue: parsed.compareCurrentValue,
      comparePreviousValue: parsed.comparePreviousValue,
      filters: parsed.filters,
      dateRange: parsed.dateRange,
      format: parsed.format,
      currency: parsed.currency
    }
  });

  assertDashboardCapacity(dashboard);
  assertChartRenderLimits(chart);
  dashboard.charts.push(chart);
  autoPlaceChart(dashboard, chart.id);
  touchDashboard(dashboard);
  validateLayoutChartRefs(dashboard.charts, dashboard.layout);
  await saveStore(store);
  return dashboard;
}

function recomputeKpiFromSource(
  chart: Extract<Chart, { type: "kpi_card" }>,
  dashboard: Dashboard,
  dataset: Dataset
): boolean {
  const source = chart.source;
  if (!source?.datasetId || !source.valueField || !source.aggregation) return false;

  const filters = [...(source.filters ?? []), ...dashboardFiltersToFieldFilters(dashboard.filters)];
  const compareFields = source.compareField ? [source.compareField] : [];
  const filterFields = filters.map((item) => item.field);
  const extraFields = source.dateRange ? [source.dateRange.field] : [];

  ensureFieldsExist(dataset, [source.valueField, ...compareFields, ...filterFields, ...extraFields]);
  const filteredRows = applyDatasetFilters(dataset.rows, { ...source, filters });
  if (filteredRows.length === 0) return false;

  let value = 0;
  if (source.aggregation === "count") {
    value = filteredRows.length;
  } else {
    const nums = filteredRows
      .map((row) => row[source.valueField!])
      .map((raw) => (typeof raw === "number" ? raw : Number(raw)))
      .filter((num) => !Number.isNaN(num));
    if (nums.length === 0) return false;
    value = Number(aggregateValues(nums, source.aggregation as "sum" | "avg" | "count").toFixed(4));
  }

  let delta: number | undefined;
  if (source.compareField && source.compareCurrentValue !== undefined && source.comparePreviousValue !== undefined) {
    const currentRows = filteredRows.filter(
      (row) => String(row[source.compareField!]) === String(source.compareCurrentValue)
    );
    const previousRows = filteredRows.filter(
      (row) => String(row[source.compareField!]) === String(source.comparePreviousValue)
    );
    const calc = (rows: Array<Record<string, string | number | null>>) => {
      const nums = rows
        .map((row) => row[source.valueField!])
        .map((raw) => (typeof raw === "number" ? raw : Number(raw)))
        .filter((num) => !Number.isNaN(num));
      if (source.aggregation === "count") return rows.length;
      return nums.length === 0 ? 0 : aggregateValues(nums, source.aggregation as "sum" | "avg" | "count");
    };
    const current = calc(currentRows);
    const previous = calc(previousRows);
    if (previous !== 0) {
      delta = Number((((current - previous) / previous) * 100).toFixed(2));
    }
  }

  chart.value = value;
  chart.delta = delta;
  return true;
}

export async function addTableChartFromDataset(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(addTableChartFromDatasetInputSchema, input) as AddTableChartFromDatasetInput;
  const { store, dashboard, dataset } = await resolveDatasetAndDashboard(parsed.dashboardId, parsed.datasetId);

  const filterFields = (parsed.filters ?? []).map((item) => item.field);
  const extraFields = parsed.dateRange ? [parsed.dateRange.field] : [];
  const columns = parsed.columns && parsed.columns.length > 0 ? parsed.columns : dataset.columns.slice(0, 6);
  ensureFieldsExist(dataset, [...columns, ...filterFields, ...extraFields]);
  const filteredRows = applyDatasetFilters(dataset.rows, parsed);
  if (filteredRows.length === 0) {
    throw new Error("No rows matched filters/dateRange for table generation.");
  }

  const rows = filteredRows.slice(0, parsed.limit).map((row) => {
    const out: Record<string, string | number | null> = {};
    for (const col of columns) out[col] = row[col] ?? null;
    return out;
  });

  const chartId = parsed.chartId ?? randomId("chart");
  assertUniqueChart(dashboard, chartId);
  const chart = tableChartSchema.parse({
    id: chartId,
    type: "table",
    title: parsed.title ?? "Data table",
    columns,
    rows: [],
    limit: parsed.limit,
    datasetId: parsed.datasetId,
    source: {
      datasetId: parsed.datasetId,
      columns,
      limit: parsed.limit,
      filters: parsed.filters,
      dateRange: parsed.dateRange
    }
  });

  assertDashboardCapacity(dashboard);
  assertChartRenderLimits(chart);
  dashboard.charts.push(chart);
  autoPlaceChart(dashboard, chart.id);
  touchDashboard(dashboard);
  validateLayoutChartRefs(dashboard.charts, dashboard.layout);
  await saveStore(store);
  return dashboard;
}

function recomputeBarLineAreaFromSource(
  chart: Extract<Chart, { type: "bar" | "line" | "area" }>,
  dashboard: Dashboard,
  dataset: Dataset
): boolean {
  const source = chart.source;
  const xField = source?.xField ?? (chart as { x?: string }).x;
  const yField = source?.yField ?? (chart as { y?: string }).y;
  const seriesField = source?.seriesField ?? (chart as { series?: string }).series;
  const aggregation = source?.aggregation ?? "sum";
  if (!source?.datasetId || !xField || !yField) return false;

  const filters = [...(source.filters ?? []), ...dashboardFiltersToFieldFilters(dashboard.filters)];
  const extraFields = source.dateRange ? [source.dateRange.field] : [];
  const needed = [xField, yField, ...(seriesField ? [seriesField] : []), ...filters.map((f) => f.field), ...extraFields];
  ensureFieldsExist(dataset, needed);

  const filteredRows = applyDatasetFilters(dataset.rows, { ...source, filters });
  if (filteredRows.length === 0) return false;

  const grouped = new Map<string, number[]>();
  for (const row of filteredRows) {
    const xRaw = row[xField];
    const yRaw = row[yField];
    if (xRaw === undefined || xRaw === null || yRaw === undefined || yRaw === null) continue;
    const x = String(xRaw);
    const key = seriesField ? `${String(row[seriesField])}::${x}` : `::${x}`;
    if (!grouped.has(key)) grouped.set(key, []);
    const yNum = typeof yRaw === "number" ? yRaw : Number(yRaw);
    if (!Number.isNaN(yNum)) grouped.get(key)!.push(yNum);
  }

  const data = Array.from(grouped.entries())
    .map(([key, values]) => {
      if (values.length === 0) return null;
      const [series, x] = key.split("::");
      const value =
        aggregation === "count" ? values.length : Number(aggregateValues(values, aggregation as "sum" | "avg" | "count").toFixed(4));
      return {
        [xField]: x,
        [yField]: value,
        ...(seriesField ? { [seriesField]: series } : {})
      };
    })
    .filter((v): v is Record<string, string | number> => v !== null)
    .sort((a, b) => {
      const aVal = toComparable(a[xField] as string | number);
      const bVal = toComparable(b[xField] as string | number);
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    });

  if (data.length === 0) return false;
  chart.data = data;
  (chart as { x?: string }).x = xField;
  (chart as { y?: string }).y = yField;
  (chart as { series?: string }).series = seriesField;
  return true;
}

function recomputeTableFromSource(
  chart: Extract<Chart, { type: "table" }>,
  dashboard: Dashboard,
  dataset: Dataset
): boolean {
  const source = chart.source;
  if (!source?.datasetId) return false;

  const columns = source.columns && source.columns.length > 0 ? source.columns : dataset.columns.slice(0, 6);
  const filters = [...(source.filters ?? []), ...dashboardFiltersToFieldFilters(dashboard.filters)];
  const extraFields = source.dateRange ? [source.dateRange.field] : [];
  ensureFieldsExist(dataset, [...columns, ...filters.map((f) => f.field), ...extraFields]);

  const filteredRows = applyDatasetFilters(dataset.rows, { ...source, filters });
  if (filteredRows.length === 0) return false;

  const limit = source.limit;
  const rows = filteredRows
    .slice(0, typeof limit === "number" ? limit : filteredRows.length)
    .map((row) => {
      const out: Record<string, string | number | null> = {};
      for (const col of columns) out[col] = row[col] ?? null;
      return out;
    });

  chart.columns = columns;
  chart.rows = rows;
  return true;
}

export async function addComboChartFromDataset(input: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(addComboChartFromDatasetInputSchema, input) as AddComboChartFromDatasetInput;
  const { store, dashboard, dataset } = await resolveDatasetAndDashboard(parsed.dashboardId, parsed.datasetId);

  const filterFields = (parsed.filters ?? []).map((item) => item.field);
  const extraFields = parsed.dateRange ? [parsed.dateRange.field] : [];
  ensureFieldsExist(dataset, [parsed.xField, parsed.barField, parsed.lineField, ...filterFields, ...extraFields]);
  const filteredRows = applyDatasetFilters(dataset.rows, parsed);
  if (filteredRows.length === 0) {
    throw new Error("No rows matched filters/dateRange for combo chart generation.");
  }

  const groupedBar = new Map<string, number[]>();
  const groupedLine = new Map<string, number[]>();
  for (const row of filteredRows) {
    const xRaw = row[parsed.xField];
    if (xRaw === undefined || xRaw === null) continue;
    const x = String(xRaw);
    if (!groupedBar.has(x)) groupedBar.set(x, []);
    if (!groupedLine.has(x)) groupedLine.set(x, []);

    if (parsed.aggregation === "count") {
      groupedBar.get(x)?.push(1);
      groupedLine.get(x)?.push(1);
    } else {
      const barRaw = row[parsed.barField];
      const lineRaw = row[parsed.lineField];
      const barNumeric = typeof barRaw === "number" ? barRaw : Number(barRaw);
      const lineNumeric = typeof lineRaw === "number" ? lineRaw : Number(lineRaw);
      if (!Number.isNaN(barNumeric)) groupedBar.get(x)?.push(barNumeric);
      if (!Number.isNaN(lineNumeric)) groupedLine.get(x)?.push(lineNumeric);
    }
  }

  const keys = Array.from(new Set([...groupedBar.keys(), ...groupedLine.keys()])).sort((a, b) =>
    toComparable(a) < toComparable(b) ? -1 : 1
  );
  const data = keys.map((x) => ({
    [parsed.xField]: x,
    [parsed.barField]: Number(aggregateValues(groupedBar.get(x) ?? [], parsed.aggregation).toFixed(4)),
    [parsed.lineField]: Number(aggregateValues(groupedLine.get(x) ?? [], parsed.aggregation).toFixed(4))
  }));
  if (data.length === 0) {
    throw new Error("Could not build combo chart data from selected fields.");
  }

  const chartId = parsed.chartId ?? randomId("chart");
  assertUniqueChart(dashboard, chartId);
  const chart = comboChartSchema.parse({
    id: chartId,
    type: "combo",
    title: parsed.title ?? `${parsed.barField} + ${parsed.lineField} by ${parsed.xField}`,
    data: [],
    datasetId: parsed.datasetId,
    x: parsed.xField,
    barY: parsed.barField,
    lineY: parsed.lineField,
    source: {
      datasetId: parsed.datasetId,
      xField: parsed.xField,
      barField: parsed.barField,
      lineField: parsed.lineField,
      aggregation: parsed.aggregation,
      filters: parsed.filters,
      dateRange: parsed.dateRange
    }
  });

  assertDashboardCapacity(dashboard);
  assertChartRenderLimits(chart);
  dashboard.charts.push(chart);
  autoPlaceChart(dashboard, chart.id);
  touchDashboard(dashboard);
  validateLayoutChartRefs(dashboard.charts, dashboard.layout);
  await saveStore(store);
  return dashboard;
}

function pickFirstExisting(columns: string[], candidates: string[]): string | undefined {
  const normalized = new Map(columns.map((col) => [col.toLowerCase(), col]));
  for (const candidate of candidates) {
    const found = normalized.get(candidate.toLowerCase());
    if (found) return found;
  }
  return undefined;
}

function inferYearRange(request: string): { start?: string; end?: string } {
  const years = Array.from(request.matchAll(/\b(19|20)\d{2}\b/g)).map((m) => m[0]);
  if (years.length >= 2) {
    return { start: years[0], end: years[years.length - 1] };
  }
  return {};
}

function inferThemePreset(request: string): ThemePreset | undefined {
  const lower = request.toLowerCase();
  if (lower.includes("business")) return "business";
  if (lower.includes("dark") || lower.includes("oscuro")) return "dark_analytics";
  if (lower.includes("pastel")) return "pastel";
  if (lower.includes("high contrast") || lower.includes("alto contraste")) return "high_contrast";
  if (lower.includes("textured") || lower.includes("textura") || lower.includes("pattern")) return "textured";
  if (lower.includes("clean") || lower.includes("limpio")) return "clean";
  return undefined;
}

function inferPresentationPatch(request: string): ChartPresentation | undefined {
  const lower = request.toLowerCase();
  const patch: ChartPresentation = {};

  if (/(sin|oculta|hide).*(leyenda|legend)/.test(lower)) patch.showLegend = false;
  if (/(con|muestra|mostrar|show).*(leyenda|legend)/.test(lower)) patch.showLegend = true;
  if (/(sin|oculta|hide).*(grid|grilla)/.test(lower)) patch.showGrid = false;
  if (/(con|muestra|mostrar|show).*(grid|grilla)/.test(lower)) patch.showGrid = true;
  if (/(sin|oculta|hide).*(label|etiqueta)/.test(lower)) patch.showLabels = false;
  if (/(con|muestra|mostrar|show).*(label|etiqueta)/.test(lower)) patch.showLabels = true;
  if (/(sin|desactiva|off|no).*(animacion|animación|animation)/.test(lower)) patch.animate = false;
  if (/(con|activa|on).*(animacion|animación|animation)/.test(lower)) patch.animate = true;

  if (/(moneda|currency|usd|mxn|pen|eur|cop|ars|clp)/.test(lower)) patch.numberFormat = "currency";
  if (/(porcentaje|percent)/.test(lower)) patch.numberFormat = "percent";
  if (/(numero|número|number)/.test(lower)) patch.numberFormat = "number";
  if (/(compact|abreviado)/.test(lower)) patch.numberFormat = "compact";

  const currencyMatch = lower.match(/\b(usd|mxn|pen|eur|cop|ars|clp)\b/i);
  if (currencyMatch?.[1]) patch.currency = currencyMatch[1].toUpperCase();

  const decimalsMatch = lower.match(/(\d+)\s*(decimales|decimals|decimal)/i);
  if (decimalsMatch?.[1]) patch.decimals = Number(decimalsMatch[1]);

  const fontMatch = request.match(/(?:font|fuente)\s*[:=]?\s*["']([^"']+)["']/i);
  if (fontMatch?.[1]) patch.fontFamily = fontMatch[1].trim();
  const titleFontMatch = request.match(/(?:titulo|t[ií]tulo|title)\s*(?:font|fuente)\s*[:=]?\s*["']([^"']+)["']/i);
  if (titleFontMatch?.[1]) patch.titleFontFamily = titleFontMatch[1].trim();

  const titleColorMatch = request.match(/(?:titulo|t[ií]tulo|title).*(#[0-9a-fA-F]{3,8})/i);
  if (titleColorMatch?.[1]) patch.titleColor = titleColorMatch[1];
  const axisColorMatch = request.match(/(?:axis|eje).*(#[0-9a-fA-F]{3,8})/i);
  if (axisColorMatch?.[1]) patch.axisColor = axisColorMatch[1];
  const labelColorMatch = request.match(/(?:label|etiqueta).*(#[0-9a-fA-F]{3,8})/i);
  if (labelColorMatch?.[1]) patch.labelColor = labelColorMatch[1];
  const gridColorMatch = request.match(/(?:grid|grilla).*(#[0-9a-fA-F]{3,8})/i);
  if (gridColorMatch?.[1]) patch.gridColor = gridColorMatch[1];

  return Object.keys(patch).length > 0 ? patch : undefined;
}

async function resolveDefaultDashboard(dashboardId?: string): Promise<string> {
  if (dashboardId) return dashboardId;
  const dashboards = await listDashboards();
  if (dashboards.length === 0) {
    const created = await createDashboard({ name: "Dashboard Principal", layout: defaultLayout });
    return created.id;
  }
  return dashboards[dashboards.length - 1].id;
}

async function findDashboardByName(name: string): Promise<Dashboard | undefined> {
  const dashboards = await listDashboards();
  const target = name.trim().toLowerCase();
  if (!target) return undefined;

  const exact = dashboards.find((d) => d.name.toLowerCase() === target);
  if (exact) return exact;

  return dashboards.find((d) => d.name.toLowerCase().includes(target));
}

async function findDatasetByName(name: string): Promise<Dataset | undefined> {
  const datasets = await listDatasets();
  const target = name.trim().toLowerCase();
  if (!target) return undefined;

  const exact = datasets.find((dataset) => dataset.name.toLowerCase() === target || dataset.id.toLowerCase() === target);
  if (exact) return exact;

  return datasets.find(
    (dataset) => dataset.name.toLowerCase().includes(target) || dataset.id.toLowerCase().includes(target)
  );
}

function extractDashboardNameFromRequest(request: string): string | undefined {
  const quoted = request.match(/dashboard\\s+\"([^\"]+)\"/i) ?? request.match(/dashboard\\s+'([^']+)'/i);
  if (quoted?.[1]) return quoted[1].trim();

  const simple = request.match(/dashboard\\s+([a-z0-9\\-\\s_]+?)\\s+(a|con|to)\\s+\\d+\\s*column(as)?/i);
  if (simple?.[1]) return simple[1].trim();
  return undefined;
}

function extractDatasetNameFromRequest(request: string): string | undefined {
  const quoted = request.match(/dataset\\s+\"([^\"]+)\"/i) ?? request.match(/dataset\\s+'([^']+)'/i);
  if (quoted?.[1]) return quoted[1].trim();

  const simple =
    request.match(/(?:dataset|datos?)\\s+([a-z0-9\\-\\s_]+?)\\s*(?:$|con|with|para|for)/i) ??
    request.match(/(?:describe|describe dataset|muestra|show)\\s+([a-z0-9\\-\\s_]+?)\\s*(?:$|dataset|datos?)/i);
  if (simple?.[1]) return simple[1].trim();
  return undefined;
}

function extractRenameTargetAndName(request: string): { target?: string; newName?: string } {
  const quoted = request.match(/(?:renombra|renombrar|rename)\s+(?:dashboard\s+)?\"([^\"]+)\"\s+(?:a|to)\s+\"([^\"]+)\"/i);
  if (quoted?.[1] && quoted?.[2]) {
    return { target: quoted[1].trim(), newName: quoted[2].trim() };
  }

  const simple = request.match(/(?:renombra|renombrar|rename)\s+(?:dashboard\s+)?(.+?)\s+(?:a|to)\s+(.+)/i);
  if (simple?.[1] && simple?.[2]) {
    return { target: simple[1].trim(), newName: simple[2].trim() };
  }

  return {};
}

function stripWrappingQuotes(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith("\"") && trimmed.endsWith("\"")) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function inferNumericColumns(dataset: Dataset, sampleLimit = 50): string[] {
  return dataset.columns.filter((column) => {
    let seen = 0;
    for (const row of dataset.rows.slice(0, sampleLimit)) {
      const raw = row[column];
      if (raw === null || raw === undefined || raw === "") continue;
      seen += 1;
      if (typeof raw === "number") continue;
      if (typeof raw === "string" && raw.trim().length > 0 && !Number.isNaN(Number(raw))) continue;
      return false;
    }
    return seen > 0;
  });
}

async function resolveDefaultDataset(datasetId?: string): Promise<string> {
  if (datasetId) return datasetId;
  const datasets = await listDatasets();
  if (datasets.length === 0) {
    throw new Error("No dataset available. Provide 'csv' or register a dataset first.");
  }
  return datasets[datasets.length - 1].id;
}

async function resolveTemplateIdByName(nameOrId: string): Promise<string | undefined> {
  const normalized = nameOrId.trim().toLowerCase();
  const templates = await ensureTemplates();
  const byId = templates.find((t) => t.id.toLowerCase() === normalized);
  if (byId) return byId.id;
  const byName = templates.find((t) => t.name.toLowerCase() === normalized);
  if (byName) return byName.id;
  return templates.find((t) => t.name.toLowerCase().includes(normalized))?.id;
}

export async function dashboardNl(input: unknown): Promise<{
  action: string;
  message: string;
  result?: unknown;
}> {
  const parsed = parseWithSchema(dashboardNlInputSchema, input) as DashboardNlInput;
  const request = parsed.request.toLowerCase();

  if (/(listar|muestra|show|list).*(dataset|datos)/.test(request)) {
    const datasets = await listDatasets();
    return {
      action: "list_datasets",
      message: "Datasets disponibles.",
      result: datasets.map((dataset) => ({
        id: dataset.id,
        name: dataset.name,
        columns: dataset.columns.length,
        rows: dataset.rows.length,
        updatedAt: dataset.updatedAt
      }))
    };
  }

  if (/(describe|describe dataset|columnas|campos|fields|schema).*(dataset|datos)/.test(request)) {
    const candidate =
      parsed.datasetId ??
      parsed.datasetName ??
      extractDatasetNameFromRequest(parsed.request);
    const dataset = candidate ? await findDatasetByName(stripWrappingQuotes(candidate)) : undefined;
    const datasetId = dataset?.id ?? parsed.datasetId;
    if (!datasetId) {
      throw new Error("Could not resolve dataset to describe. Provide datasetId or datasetName.");
    }
    const result = await describeDataset({ datasetId });
    return {
      action: "describe_dataset",
      message: `Dataset '${result.name}' descrito.`,
      result
    };
  }

  if (/(listar|muestra|show|list).*(template|plantilla)/.test(request)) {
    const templates = await listTemplates();
    return {
      action: "list_templates",
      message: "Available templates.",
      result: templates.map((template) => ({
        id: template.id,
        name: template.name,
        datasetId: template.defaultDatasetId,
        charts: template.charts.length,
        filters: template.filters.length
      }))
    };
  }

  if (/(listar|muestra|show|list).*(theme|tema)/.test(request)) {
    const themes = await listThemePresets();
    return {
      action: "list_theme_presets",
      message: "Available themes.",
      result: themes
    };
  }

  if (/plantilla|template/.test(request)) {
    const nameRaw =
      extractDashboardNameFromRequest(parsed.request) ??
      parsed.dashboardName ??
      parsed.request.replace(/.*plantilla/i, "").replace(/template/i, "").trim();
    const templateId = nameRaw ? await resolveTemplateIdByName(stripWrappingQuotes(nameRaw)) : undefined;
    if (!templateId) {
      throw new Error("Could not infer the template. Use list_templates to inspect available ids.");
    }
    const dashboard = await createDashboardFromTemplate({
      templateId,
      dashboardName: parsed.dashboardName ?? stripWrappingQuotes(nameRaw),
      datasetId: parsed.datasetId
    });
    return {
      action: "create_dashboard_from_template",
      message: `Dashboard created from template '${templateId}'.`,
      result: dashboard
    };
  }

  if (/(listar|muestra|show|list).*(dashboard|tablero)/.test(request)) {
    const dashboards = await listAvailableDashboards();
    return {
      action: "list_available_dashboards",
      message: "Available dashboards.",
      result: dashboards
    };
  }

  if (/(registrar|subir|cargar|register).*(csv|dataset|datos)/.test(request) || parsed.csv) {
    if (!parsed.csv) {
      throw new Error("CSV text is required for dataset registration in dashboard_nl.");
    }
    const dataset = await registerDataset({
      name: parsed.datasetName ?? "dataset_auto",
      csv: parsed.csv
    });
    return {
      action: "register_dataset",
      message: "Dataset registered.",
      result: dataset
    };
  }

  if (/(crear|create).*(dashboard|tablero)/.test(request)) {
    const dashboard = await createDashboard({
      name: parsed.dashboardName ?? "New Dashboard",
      layout: defaultLayout
    });
    return {
      action: "create_dashboard",
      message: "Dashboard created.",
      result: dashboard
    };
  }

  if (/(borra|borrar|elimina|eliminar|delete).*(dashboard|tablero)/.test(request)) {
    let targetId = parsed.dashboardId;
    if (!targetId) {
      const byName =
        parsed.dashboardName ??
        extractDashboardNameFromRequest(parsed.request) ??
        parsed.request.replace(/.*dashboard/i, "").trim();
      const found = byName ? await findDashboardByName(byName) : undefined;
      if (found) targetId = found.id;
    }

    if (!targetId) {
      throw new Error("Could not resolve dashboard to delete. Provide dashboardId or dashboardName.");
    }

    const wantsConfirmation = /(confirm|confirma|confirmar|yes|si\b|sí\b|ok\b|delete now)/.test(request);
    if (!wantsConfirmation) {
      return {
        action: "delete_dashboard_confirmation_required",
        message:
          "Confirmation required. Repeat with explicit confirmation or use delete_dashboard with { dashboardId, confirm: \"DELETE\" }.",
        result: { dashboardId: targetId, requiredConfirm: "DELETE" }
      };
    }

    const result = await deleteDashboard({ dashboardId: targetId, confirm: "DELETE" });
    return {
      action: "delete_dashboard",
      message: "Dashboard deleted.",
      result
    };
  }

  if (/(renombra|renombrar|rename).*(dashboard|tablero)?/.test(request)) {
    const extracted = extractRenameTargetAndName(parsed.request);
    let targetId = parsed.dashboardId;
    if (!targetId && extracted.target) {
      const candidate = stripWrappingQuotes(extracted.target);
      const byId = (await listDashboards()).find((entry) => entry.id === candidate);
      if (byId) {
        targetId = byId.id;
      } else {
        const found = await findDashboardByName(candidate);
        if (found) targetId = found.id;
      }
    }
    if (!targetId) {
      targetId = await resolveDefaultDashboard(undefined);
    }

    const newNameRaw = extracted.newName ?? parsed.dashboardName;
    const newName = newNameRaw ? stripWrappingQuotes(newNameRaw) : undefined;
    if (!newName) {
      throw new Error("Could not infer the new dashboard name. Try: rename dashboard X to Y.");
    }

    const dashboard = await renameDashboard({ dashboardId: targetId, name: newName });
    return {
      action: "rename_dashboard",
      message: "Dashboard renamed.",
      result: dashboard
    };
  }

  if (/(columna|column|layout|grilla|grid)/.test(request) && /(\d+)\s*(column(s)?|columna(s)?)/.test(request)) {
    const match =
      parsed.request.match(/(\d+)\s*column(s)?/i) ?? parsed.request.match(/(\d+)\s*columna(s)?/i);
    const columns = Number(match?.[1] ?? 0);
    if (!columns || Number.isNaN(columns)) {
      throw new Error("Could not infer number of columns from request.");
    }

    let targetId = parsed.dashboardId;
    if (!targetId) {
      const candidateName = parsed.dashboardName ?? extractDashboardNameFromRequest(parsed.request);
      const found = candidateName ? await findDashboardByName(candidateName) : undefined;
      if (found) targetId = found.id;
    }

    const activeDashboardId = targetId ?? (await resolveDefaultDashboard(undefined));
    const dashboard = await setDashboardColumns({ dashboardId: activeDashboardId, columns });
    return {
      action: "set_dashboard_columns",
      message: `Dashboard set to ${columns} columns.`,
      result: dashboard
    };
  }

  if (/(auto|ajusta|optimiza).*(layout|grilla|grid)/.test(request)) {
    const activeDashboardId = await resolveDefaultDashboard(parsed.dashboardId);
    const dashboard = await autoLayoutDashboard({ dashboardId: activeDashboardId });
    return {
      action: "auto_layout_dashboard",
      message: "Layout auto-adjusted.",
      result: dashboard
    };
  }

  if (/(tema|theme|estilo|preset)/.test(request)) {
    const theme = inferThemePreset(parsed.request);
    if (!theme) {
      throw new Error("Could not infer theme preset. Try: clean, business, dark_analytics, pastel, high_contrast.");
    }

    const activeDashboardId = await resolveDefaultDashboard(parsed.dashboardId);
    const dashboard = await setDashboardTheme({ dashboardId: activeDashboardId, themePreset: theme });
    return {
      action: "set_dashboard_theme",
      message: `Theme '${theme}' applied to dashboard.`,
      result: dashboard
    };
  }

  if (/(presentacion|presentación|formato|legend|leyenda|grid|grilla|etiqueta|labels|animaci[oó]n|font|fuente|decimales|currency|moneda)/.test(request)) {
    const patch = inferPresentationPatch(parsed.request);
    if (!patch) {
      throw new Error("Could not infer presentation changes. Example: 'sin leyenda y 2 decimales en USD'.");
    }

    const chartIdMatch = parsed.request.match(/\b(chart_[a-z0-9]+)\b/i);
    const targetChartId = chartIdMatch?.[1];
    let targetDashboardId = parsed.dashboardId;
    if (!targetDashboardId) {
      const candidateName = parsed.dashboardName ?? extractDashboardNameFromRequest(parsed.request);
      const found = candidateName ? await findDashboardByName(candidateName) : undefined;
      if (found) targetDashboardId = found.id;
    }
    const activeDashboardId = targetDashboardId ?? (await resolveDefaultDashboard(undefined));

    if (/(reset|limpia|quita override)/.test(request) && targetChartId) {
      const dashboard = await resetChartPresentation({
        dashboardId: activeDashboardId,
        chartId: targetChartId
      });
      return {
        action: "reset_chart_presentation",
        message: `Presentation reset for ${targetChartId}.`,
        result: dashboard
      };
    }

    if (targetChartId || /(chart|gr[aá]fica)\b/.test(request)) {
      if (!targetChartId) {
        throw new Error("Provide chart id to set chart presentation, e.g. chart_abcd1234.");
      }
      const dashboard = await setChartPresentation({
        dashboardId: activeDashboardId,
        chartId: targetChartId,
        presentation: patch
      });
      return {
        action: "set_chart_presentation",
        message: `Presentation updated on ${targetChartId}.`,
        result: dashboard
      };
    }

    const dashboard = await setDashboardPresentation({
      dashboardId: activeDashboardId,
      presentation: patch
    });
    return {
      action: "set_dashboard_presentation",
      message: "Dashboard presentation updated.",
      result: dashboard
    };
  }

  const wantsBar = /(bar|barra|barras)/.test(request);
  const wantsScatter = /(scatter|dispersi[oó]n)/.test(request);
  const wantsRadar = /(radar)/.test(request);
  const wantsGrouped = /(agrupad|grouped|multiple barras|varias barras|lado a lado)/.test(request);
  const wantsStacked = /(apil|stack|stacked|encima)/.test(request);
  const wantsLine = /(line|linea|línea|tendencia)/.test(request);
  const wantsArea = /(area|área)/.test(request);
  const wantsDonut = /(donut|pie|anillo|dona)/.test(request);
  const wantsFunnel = /(funnel|embudo|pipeline)/.test(request);
  const wantsKpi = /(kpi|indicador|tarjeta|metrica|métrica)/.test(request);
  const wantsTable = /(table|tabla)/.test(request);
  const wantsCombo = /(combo|combinad|barra.*linea|barra.*línea|linea.*barra|línea.*barra|bar.*line)/.test(request);

  if (
    wantsBar ||
    wantsLine ||
    wantsArea ||
    wantsDonut ||
    wantsScatter ||
    wantsRadar ||
    wantsGrouped ||
    wantsStacked ||
    wantsFunnel ||
    wantsKpi ||
    wantsTable ||
    wantsCombo
  ) {
    const activeDashboardId = await resolveDefaultDashboard(parsed.dashboardId);
    const activeDatasetId = await resolveDefaultDataset(parsed.datasetId);
    const datasets = await listDatasets();
    const dataset = datasets.find((entry) => entry.id === activeDatasetId);
    if (!dataset) {
      throw new Error(`Dataset '${activeDatasetId}' not found.`);
    }

    const yearField = pickFirstExisting(dataset.columns, ["year", "anio", "año", "date"]);
    const yField = pickFirstExisting(dataset.columns, ["sales", "total_sales", "revenue", "amount", "orders"]);
    const xBarField = pickFirstExisting(dataset.columns, ["country", "month", "year", "category", "channel"]);
    const xLineField = pickFirstExisting(dataset.columns, ["month", "date", "year"]);
    const seriesField = pickFirstExisting(dataset.columns, ["channel", "category", "country"]);
    const categoryField = pickFirstExisting(dataset.columns, ["category", "channel", "country"]);
    const numericFields = inferNumericColumns(dataset);
    const primaryNumericField =
      pickFirstExisting(numericFields, ["sales", "total_sales", "revenue", "amount", "orders", "profit", "margin", "cost", "units"]) ??
      numericFields[0];
    const secondaryNumericField =
      pickFirstExisting(
        numericFields.filter((field) => field !== primaryNumericField),
        ["orders", "profit", "margin", "cost", "units", "sales", "revenue", "amount"]
      ) ?? numericFields.find((field) => field !== primaryNumericField);
    const firstDimensionField = dataset.columns.find((field) => !numericFields.includes(field));

    if (!yField) {
      throw new Error("Could not infer numeric value field (e.g. sales/total_sales/revenue/orders).");
    }

    const yearRange = inferYearRange(request);
    const dateRange =
      yearField && (yearRange.start || yearRange.end)
        ? { field: yearField, start: yearRange.start, end: yearRange.end }
        : undefined;

    if (wantsGrouped || wantsStacked) {
      if (!xBarField) throw new Error("Could not infer x field for grouped/stacked bar chart.");
      if (!seriesField) throw new Error("Could not infer series field for grouped/stacked bar chart.");
      const dashboard = await addMultiBarChartFromDataset({
        dashboardId: activeDashboardId,
        datasetId: activeDatasetId,
        xField: xBarField,
        seriesField,
        valueField: yField,
        mode: wantsStacked ? "stacked" : "grouped",
        aggregation: "sum",
        dateRange,
        title: wantsStacked ? "Stacked bar chart" : "Grouped bar chart"
      });
      return {
        action: "create_chart",
        message: wantsStacked
          ? "Stacked bar chart added (create_chart type=multi_bar, mode=stacked)."
          : "Grouped bar chart added (create_chart type=multi_bar, mode=grouped).",
        result: dashboard
      };
    }

    if (wantsScatter) {
      const scatterX = primaryNumericField;
      const scatterY = secondaryNumericField;
      if (!scatterX || !scatterY) {
        throw new Error("Could not infer two numeric fields for scatter chart.");
      }
      const scatterSeries =
        pickFirstExisting(dataset.columns.filter((field) => field !== scatterX && field !== scatterY), ["channel", "category", "country", "department", "region"]) ??
        firstDimensionField;
      const dashboard = await addScatterChartFromDataset({
        dashboardId: activeDashboardId,
        datasetId: activeDatasetId,
        xField: scatterX,
        yField: scatterY,
        seriesField: scatterSeries,
        dateRange,
        title: "Scatter chart"
      });
      return {
        action: "create_chart",
        message: "Scatter chart added.",
        result: dashboard
      };
    }

    if (wantsRadar) {
      const radarIndexField =
        pickFirstExisting(dataset.columns.filter((field) => !numericFields.includes(field)), ["category", "channel", "country", "department", "region", "month", "level"]) ??
        firstDimensionField;
      const radarValueField = primaryNumericField ?? yField;
      const radarSeriesField =
        pickFirstExisting(
          dataset.columns.filter((field) => field !== radarIndexField && !numericFields.includes(field)),
          ["channel", "country", "department", "level", "gender", "region"]
        ) ?? undefined;
      if (!radarIndexField || !radarValueField) {
        throw new Error("Could not infer fields for radar chart.");
      }
      const dashboard = await addRadarChartFromDataset({
        dashboardId: activeDashboardId,
        datasetId: activeDatasetId,
        indexField: radarIndexField,
        valueField: radarValueField,
        seriesField: radarSeriesField,
        aggregation: "sum",
        dateRange,
        title: "Radar chart"
      });
      return {
        action: "create_chart",
        message: "Radar chart added.",
        result: dashboard
      };
    }

    if (wantsLine) {
      if (!xLineField) throw new Error("Could not infer x field for line chart.");
      const dashboard = await addLineChartFromDataset({
        dashboardId: activeDashboardId,
        datasetId: activeDatasetId,
        xField: xLineField,
        yField,
        seriesField,
        aggregation: "sum",
        dateRange,
        title: "Line chart"
      });
      return {
        action: "create_chart",
        message: "Line chart added (create_chart type=line).",
        result: dashboard
      };
    }

    if (wantsArea) {
      if (!xLineField) throw new Error("Could not infer x field for area chart.");
      const dashboard = await addAreaChartFromDataset({
        dashboardId: activeDashboardId,
        datasetId: activeDatasetId,
        xField: xLineField,
        yField,
        seriesField,
        aggregation: "sum",
        dateRange,
        title: "Area chart"
      });
      return {
        action: "create_chart",
        message: "Area chart added (create_chart type=area).",
        result: dashboard
      };
    }

    if (wantsDonut) {
      if (!categoryField) throw new Error("Could not infer category field for donut chart.");
      const dashboard = await addDonutChartFromDataset({
        dashboardId: activeDashboardId,
        datasetId: activeDatasetId,
        categoryField,
        valueField: yField,
        aggregation: "sum",
        dateRange,
        title: "Donut chart"
      });
      return {
        action: "create_chart",
        message: "Donut chart added (create_chart type=donut).",
        result: dashboard
      };
    }

    if (wantsFunnel) {
      if (!categoryField) throw new Error("Could not infer stage field for funnel chart.");
      const dashboard = await addFunnelChartFromDataset({
        dashboardId: activeDashboardId,
        datasetId: activeDatasetId,
        stageField: categoryField,
        valueField: yField,
        aggregation: "sum",
        dateRange,
        title: "Funnel chart"
      });
      return {
        action: "create_chart",
        message: "Funnel chart added (create_chart type=funnel).",
        result: dashboard
      };
    }

    if (wantsKpi) {
      const dashboard = await addKpiCardFromDataset({
        dashboardId: activeDashboardId,
        datasetId: activeDatasetId,
        valueField: yField,
        aggregation: "sum",
        dateRange,
        title: `KPI ${yField}`,
        format: "compact"
      });
      return {
        action: "create_chart",
        message: "KPI card added (create_chart type=kpi_card).",
        result: dashboard
      };
    }

    if (wantsTable) {
      const dashboard = await addTableChartFromDataset({
        dashboardId: activeDashboardId,
        datasetId: activeDatasetId,
        columns: dataset.columns.slice(0, 6),
        limit: 20,
        dateRange,
        title: "Data table"
      });
      return {
        action: "create_chart",
        message: "Table added (create_chart type=table).",
        result: dashboard
      };
    }

    if (wantsCombo) {
      if (!xBarField) throw new Error("Could not infer x field for combo chart.");
      const lineValueField =
        pickFirstExisting(dataset.columns, ["profit", "margin", "cost", "orders", "units"]) ?? yField;
      const dashboard = await addComboChartFromDataset({
        dashboardId: activeDashboardId,
        datasetId: activeDatasetId,
        xField: xBarField,
        barField: yField,
        lineField: lineValueField,
        aggregation: "sum",
        dateRange,
        title: "Combo chart"
      });
      return {
        action: "create_chart",
        message: "Combo chart added (create_chart type=combo).",
        result: dashboard
      };
    }

    if (!xBarField) throw new Error("Could not infer x field for bar chart.");
    const dashboard = await addBarChartFromDataset({
      dashboardId: activeDashboardId,
      datasetId: activeDatasetId,
      xField: xBarField,
      yField,
      aggregation: "sum",
      dateRange,
      title: "Bar chart"
    });
    return {
      action: "create_chart",
      message: "Bar chart added (create_chart type=bar).",
      result: dashboard
    };
  }

  throw new Error(
    "Could not map request. Try intents like: 'create a dashboard', 'list datasets', 'describe dataset sales_complex', 'add a bar/line/area/scatter/radar/donut/funnel/combo chart', 'add a KPI', or 'add a table'."
  );
}

export async function addDashboardFilter(raw: unknown): Promise<Dashboard> {
  const input = parseWithSchema(addDashboardFilterInputSchema, raw) as AddDashboardFilterInput;
  const store = await ensureStore();
  const idx = store.dashboards.findIndex((d) => d.id === input.dashboardId);
  if (idx === -1) throw new Error(`Dashboard not found: ${input.dashboardId}`);
  const dashboard = store.dashboards[idx];
  const filterId = input.filter.id ?? randomId("filter");
  const newFilter = dashboardFilterSchema.parse({ ...input.filter, id: filterId });
  const updated = dashboardSchema.parse({
    ...dashboard,
    filters: [...(dashboard.filters ?? []), newFilter],
    updatedAt: new Date().toISOString()
  });
  store.dashboards[idx] = updated;
  await saveStore(store);
  await snapshotDashboard(updated, "auto-snapshot:add_filter");
  return updated;
}

export async function removeDashboardFilter(raw: unknown): Promise<Dashboard> {
  const input = parseWithSchema(removeDashboardFilterInputSchema, raw) as RemoveDashboardFilterInput;
  const store = await ensureStore();
  const idx = store.dashboards.findIndex((d) => d.id === input.dashboardId);
  if (idx === -1) throw new Error(`Dashboard not found: ${input.dashboardId}`);
  const dashboard = store.dashboards[idx];
  const updated = dashboardSchema.parse({
    ...dashboard,
    filters: (dashboard.filters ?? []).filter((f: DashboardFilter) => f.id !== input.filterId),
    updatedAt: new Date().toISOString()
  });
  store.dashboards[idx] = updated;
  await saveStore(store);
  await snapshotDashboard(updated, "auto-snapshot:remove_filter");
  return updated;
}

export async function listDashboardFilters(raw: unknown): Promise<{ filters: DashboardFilter[] }> {
  const input = parseWithSchema(listDashboardFiltersInputSchema, raw) as ListDashboardFiltersInput;
  const store = await ensureStore();
  const dashboard = store.dashboards.find((d) => d.id === input.dashboardId);
  if (!dashboard) throw new Error(`Dashboard not found: ${input.dashboardId}`);
  return { filters: dashboard.filters ?? [] };
}

export async function updateDashboardFilters(raw: unknown): Promise<Dashboard> {
  const input = parseWithSchema(updateDashboardFiltersInputSchema, raw) as UpdateDashboardFiltersInput;
  const store = await ensureStore();
  const dashboard = store.dashboards.find((d) => d.id === input.dashboardId);
  if (!dashboard) throw new Error(`Dashboard not found: ${input.dashboardId}`);

  const current = dashboard.filters ?? [];
  const removed = input.remove ?? [];
  const remaining = current.filter((f) => !removed.includes(f.id));

  const additions = (input.add ?? []).map((filter) =>
    dashboardFilterSchema.parse({ ...filter, id: filter.id ?? randomId("filter") })
  );

  const updated = dashboardSchema.parse({
    ...dashboard,
    filters: [...remaining, ...additions],
    updatedAt: new Date().toISOString()
  });

  const idx = store.dashboards.findIndex((d) => d.id === dashboard.id);
  store.dashboards[idx] = updated;
  await saveStore(store);
  await snapshotDashboard(updated, "auto-snapshot:update_filters");
  return updated;
}

export async function snapshotDashboardTool(raw: unknown): Promise<DashboardSnapshot> {
  const parsed = parseWithSchema(createSnapshotInputSchema, raw) as CreateSnapshotInput;
  const store = await ensureStore();
  const dashboard = store.dashboards.find((d) => d.id === parsed.dashboardId);
  if (!dashboard) throw new Error(`Dashboard '${parsed.dashboardId}' not found.`);
  return snapshotDashboard(dashboard, parsed.comment);
}

export async function listDashboardVersions(raw: unknown): Promise<DashboardSnapshot[]> {
  const parsed = parseWithSchema(listDashboardVersionsInputSchema, raw) as ListDashboardVersionsInput;
  const store = await ensureSnapshotStore();
  return store.snapshots
    .filter((s) => s.dashboardId === parsed.dashboardId)
    .slice(parsed.offset, parsed.offset + parsed.limit);
}

export async function restoreDashboardVersion(raw: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(restoreDashboardVersionInputSchema, raw) as RestoreDashboardVersionInput;
  return restoreSnapshot(parsed.dashboardId, parsed.snapshotId, parsed.newName);
}

export async function undoDashboard(raw: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(undoDashboardInputSchema, raw) as UndoDashboardInput;
  return restoreSnapshot(parsed.dashboardId, undefined, undefined);
}

export async function listDeletedDashboards(): Promise<DeletedDashboard[]> {
  const store = await ensureDeletedStore();
  return store.dashboards;
}

export async function restoreDeletedDashboard(raw: unknown): Promise<Dashboard> {
  const parsed = parseWithSchema(restoreDeletedDashboardInputSchema, raw) as RestoreDeletedDashboardInput;
  const deletedStore = await ensureDeletedStore();
  const store = await ensureStore();
  const entry = deletedStore.dashboards.find((d) => d.id === parsed.dashboardId);
  if (!entry) {
    throw new Error(`Deleted dashboard '${parsed.dashboardId}' not found.`);
  }
  const targetId = parsed.newId ?? entry.id;
  if (store.dashboards.some((d) => d.id === targetId)) {
    throw new Error(`Dashboard id '${targetId}' already exists. Provide newId to restore.`);
  }
  const restored: Dashboard = {
    ...entry.payload,
    id: targetId,
    name: parsed.newName ?? entry.payload.name,
    updatedAt: new Date().toISOString()
  };
  store.dashboards.push(restored);
  deletedStore.dashboards = deletedStore.dashboards.filter((d) => d.id !== entry.id);
  await saveStore(store);
  await saveDeletedStore(deletedStore);
  await snapshotDashboard(restored, "auto-snapshot:restore_deleted");
  return restored;
}
