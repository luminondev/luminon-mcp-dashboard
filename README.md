# Luminon MCP Dashboard

> Status: **Beta** — expect breaking changes until 1.0.

Luminon is an AI-first dashboard builder with three pieces in one repo:

- an MCP server for dashboards, charts, datasets, filters, and natural-language requests
- a React renderer for local dashboard preview and a static demo build
- a `luminon` CLI for starting the MCP server or the packaged renderer

## Package usage

Run the published package directly with `npx`:

```bash
npx -y @luminondev/mcp-dashboard mcp --mode lite
npx -y @luminondev/mcp-dashboard start renderer
```

Recommended modes:

- `full` for the complete MCP surface
- `lite` for lower token usage while keeping `dashboard_nl`
- `ultra-lite` for the smallest tool surface in quota-limited AI clients

## Local development

```bash
npm install
npm run build
```

Use the built CLI locally:

```bash
node packages/cli/dist/index.js mcp --mode lite
node packages/cli/dist/index.js start renderer
```

For live development:

```bash
npm run dev:mcp
npm run dev:renderer
```

Local URLs:

- renderer UI: `http://localhost:5173`
- renderer API during Vite dev: `http://localhost:4010`

## Built-in demos and seeds

The repo ships seeded datasets and dashboards under `data/`. These are copied into the user data directory on first run and synced incrementally on startup when new seed ids are added.

The renderer build also regenerates the static demo from the same seed files, so demo dashboards stay aligned with the repo state.

## Project layout

- `packages/mcp-server` — MCP tool server
- `packages/renderer` — renderer web app and packaged API/static server
- `packages/cli` — `luminon` CLI
- `packages/shared` — shared schemas and types
- `docs/MCP_DOCUMENTATION.md` — full MCP reference

## Documentation

- Full MCP documentation: `docs/MCP_DOCUMENTATION.md`
- Contribution guide: `CONTRIBUTING.md`
- License: `MIT`
