import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../../..");
const sourceDashboards = path.join(repoRoot, "data", "dashboards.json");
const sourceDatasets = path.join(repoRoot, "data", "datasets.json");
const targetFile = path.join(repoRoot, "packages", "renderer", "src", "web", "public", "demo-data.json");

function collectDatasetIds(dashboards) {
  const ids = new Set();
  for (const dashboard of dashboards) {
    for (const chart of dashboard.charts ?? []) {
      if (chart.datasetId) ids.add(chart.datasetId);
      if (chart.source?.datasetId) ids.add(chart.source.datasetId);
      if (chart.autoAggregation?.datasetId) ids.add(chart.autoAggregation.datasetId);
    }
  }
  return ids;
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function main() {
  const dashboardPayload = await readJson(sourceDashboards);
  const datasetPayload = await readJson(sourceDatasets);
  const dashboards = dashboardPayload.dashboards ?? [];
  const datasetIds = collectDatasetIds(dashboards);
  const datasets = (datasetPayload.datasets ?? []).filter((dataset) => datasetIds.has(dataset.id));
  const output = `${JSON.stringify({ dashboards, datasets }, null, 2)}\n`;
  await fs.writeFile(targetFile, output, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
