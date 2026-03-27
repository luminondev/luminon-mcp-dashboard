import express from "express";
import cors from "cors";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import { watch } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dashboardSchema, type Dashboard, type Dataset } from "../../shared/dist/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
type DataPaths = {
  baseDir: string;
  dashboards: string;
  datasets: string;
  snapshots: string;
  datasetSnapshots: string;
  deletedDashboards: string;
};

type StorageModule = {
  ensureUserDataFiles: () => Promise<void>;
  getDataPaths: () => DataPaths;
  listDatasets: () => Promise<Dataset[]>;
  removeDashboardFilter: (raw: { dashboardId: string; filterId: string }) => Promise<Dashboard>;
  renameDashboard: (raw: { dashboardId: string; name: string }) => Promise<Dashboard>;
  updateDataset: (raw: {
    datasetId: string;
    csv?: string;
    rows?: Array<Record<string, string | number | null>>;
    mode?: "replace" | "append";
    allowSchemaChange?: boolean;
  }) => Promise<Dataset>;
  setDashboardPublishState: (raw: { dashboardId: string; published: boolean }) => Promise<Dashboard>;
};

async function loadStorageModule(): Promise<StorageModule> {
  const candidates = [
    path.resolve(__dirname, "../../mcp-server/src/storage.ts"),
    path.resolve(__dirname, "../../mcp-server/dist/storage.js")
  ];

  for (const candidate of candidates) {
    if (fsSync.existsSync(candidate)) {
      return import(pathToFileURL(candidate).href) as Promise<StorageModule>;
    }
  }

  throw new Error("Could not resolve the storage module. Build the repo before starting the packaged renderer.");
}

const {
  ensureUserDataFiles,
  getDataPaths,
  listDatasets,
  removeDashboardFilter,
  renameDashboard,
  updateDataset,
  setDashboardPublishState
} = await loadStorageModule();

const dataPaths = getDataPaths();
const DATA_FILE = dataPaths.dashboards;
const DATASETS_FILE = dataPaths.datasets;
const STATIC_WEB_DIR = resolveStaticWebDir();
const SERVE_STATIC_WEB = process.env.LUMINON_RENDERER_STATIC === "true" && Boolean(STATIC_WEB_DIR);

await ensureUserDataFiles();

const app = express();
app.use(cors());
app.use(express.json());
const sseClients = new Set<express.Response>();
let lastBroadcastAt = 0;

async function readDashboards(): Promise<Dashboard[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as { dashboards?: unknown[] };
    const dashboards = parsed.dashboards ?? [];
    return dashboards.map((item) => dashboardSchema.parse(item));
  } catch {
    return [];
  }
}

function resolveStaticWebDir(): string | undefined {
  const candidates = [
    path.resolve(__dirname, "../dist/web"),
    path.resolve(__dirname, "web")
  ];

  for (const candidate of candidates) {
    if (fsSync.existsSync(path.join(candidate, "index.html"))) {
      return candidate;
    }
  }

  return undefined;
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/dashboards", async (_req, res) => {
  const dashboards = await readDashboards();
  res.json({ dashboards });
});

function buildDatasetValueMap(datasets: Dataset[]) {
  const map: Record<string, Record<string, string[]>> = {};
  for (const dataset of datasets) {
    const fieldMap: Record<string, Set<string>> = {};

    for (const row of dataset.rows) {
      for (const column of dataset.columns) {
        const value = row[column];
        if (value === null || value === undefined) continue;
        const str = String(value);
        if (!fieldMap[column]) fieldMap[column] = new Set();
        fieldMap[column].add(str);
      }
    }

    map[dataset.id] = {};
    for (const [field, values] of Object.entries(fieldMap)) {
      map[dataset.id][field] = Array.from(values).sort((a, b) => a.localeCompare(b));
    }
  }
  return map;
}

app.get("/api/datasets", async (_req, res) => {
  try {
    const datasets = await listDatasets();
    const datasetValueMap = buildDatasetValueMap(datasets);
    res.json({ datasets, datasetValueMap });
  } catch (error) {
    console.error("Failed to fetch datasets:", error);
    res.json({ datasets: [], datasetValueMap: {} });
  }
});

app.patch("/api/datasets/:id", async (req, res) => {
  try {
    const body = req.body as {
      csv?: string;
      rows?: Array<Record<string, unknown>>;
      mode?: "replace" | "append";
      allowSchemaChange?: boolean;
    };
    const dataset = await updateDataset({
      datasetId: req.params.id,
      csv: body.csv,
      rows: body.rows as Array<Record<string, string | number | null>> | undefined,
      mode: body.mode,
      allowSchemaChange: body.allowSchemaChange
    });
    broadcastDatasetsUpdated("api_patch_dataset");
    res.json({ dataset });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update dataset";
    res.status(400).json({ error: message });
  }
});

app.get("/api/dashboards/:id", async (req, res) => {
  const dashboards = await readDashboards();
  const dashboard = dashboards.find((d) => d.id === req.params.id);

  if (!dashboard) {
    res.status(404).json({ error: "Dashboard not found" });
    return;
  }

  if (!dashboard.published) {
    res.status(404).json({ error: "Dashboard is not published" });
    return;
  }

  res.json({ dashboard });
});

app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true, ts: new Date().toISOString() })}\n\n`);
  sseClients.add(res);

  const keepAlive = setInterval(() => {
    res.write(`: keepalive ${Date.now()}\n\n`);
  }, 20000);

  req.on("close", () => {
    clearInterval(keepAlive);
    sseClients.delete(res);
  });
});

function broadcastDashboardsUpdated(reason: string) {
  const now = Date.now();
  if (now - lastBroadcastAt < 250) return;
  lastBroadcastAt = now;

  const payload = `event: dashboards_updated\ndata: ${JSON.stringify({
    reason,
    ts: new Date().toISOString()
  })}\n\n`;

  for (const client of sseClients) {
    client.write(payload);
  }
}

function broadcastDatasetsUpdated(reason: string) {
  const payload = `event: datasets_updated\ndata: ${JSON.stringify({
    reason,
    ts: new Date().toISOString()
  })}\n\n`;

  for (const client of sseClients) {
    client.write(payload);
  }
}

app.patch("/api/dashboards/:id", async (req, res) => {
  try {
    const body = req.body as { name?: unknown; published?: unknown };
    const tasks: Array<Promise<Dashboard>> = [];
    const reasons: string[] = [];

    if (typeof body?.name === "string") {
      tasks.push(
        renameDashboard({
          dashboardId: req.params.id,
          name: body.name
        })
      );
      reasons.push("rename_dashboard");
    }

    if (typeof body?.published === "boolean") {
      tasks.push(
        setDashboardPublishState({
          dashboardId: req.params.id,
          published: body.published
        })
      );
      reasons.push(body.published ? "publish_dashboard" : "unpublish_dashboard");
    }

    if (tasks.length === 0) {
      res.status(400).json({ error: "Invalid payload. Provide name or published fields." });
      return;
    }

    let dashboard: Dashboard | null = null;
    for (const task of tasks) {
      dashboard = await task;
    }

    broadcastDashboardsUpdated(reasons.join("+") || "dashboard_updated");
    res.json({ dashboard });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update dashboard";
    if (/not found/i.test(message)) {
      res.status(404).json({ error: message });
      return;
    }
    res.status(400).json({ error: message });
  }
});

app.delete("/api/dashboards/:id/filters/:filterId", async (req, res) => {
  try {
    const dashboard = await removeDashboardFilter({
      dashboardId: req.params.id,
      filterId: req.params.filterId
    });
    broadcastDashboardsUpdated("remove_dashboard_filter");
    res.json({ dashboard });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove filter";
    if (/not found/i.test(message)) {
      res.status(404).json({ error: message });
      return;
    }
    res.status(400).json({ error: message });
  }
});

if (SERVE_STATIC_WEB && STATIC_WEB_DIR) {
  app.use(express.static(STATIC_WEB_DIR));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(STATIC_WEB_DIR, "index.html"));
  });
}

const PORT = Number(process.env.RENDERER_PORT ?? process.env.RENDERER_API_PORT ?? (SERVE_STATIC_WEB ? 5173 : 4010));
app.listen(PORT, () => {
  console.log(
    SERVE_STATIC_WEB
      ? `Renderer on http://localhost:${PORT}`
      : `Renderer API on http://localhost:${PORT}`
  );
});

watch(DATA_FILE, { persistent: false }, () => {
  broadcastDashboardsUpdated("storage_changed");
});

watch(DATASETS_FILE, { persistent: false }, () => {
  broadcastDatasetsUpdated("dataset_storage_changed");
});
