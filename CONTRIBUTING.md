# Contributing to MCP Dashboard

Thanks for contributing! This repo is a monorepo (workspaces under `packages/`) for the MCP dashboard: CLI, server, renderer, shared schemas. Keep changes focused and small.

## Quick setup
- Node 18+ recommended.
- Install once at root: `npm install` (workspaces).
- Common scripts:
  - `npm run dev:renderer`
  - `npm run dev:mcp`
  - `npm run build` (runs builds for shared, mcp-server, renderer, cli)

## Checklist for every PR
- `npm run build` passes (tsc + vite bundles).
- Follow style: ESM, TypeScript strict, two-space indent, use shared Zod schemas from `packages/shared` (don’t redefine), keep package boundaries clear.
- UI changes: add a brief description and screenshots.
- Keep diffs minimal; avoid unrelated lockfile churn or reformatting.

## Out of scope (open an issue first)
- Breaking schema/model changes or new required dataset columns.
- Adding authentication, multi-tenant, or external storage backends.
- New heavy dependencies or CSS/JS frameworks; justify any new dep (permissive license, lightweight).
- Changes to built-in templates/data that aren’t validated against `data/sales_xyz_complex.csv`.

## Package structure
- CLI: `packages/cli` (bin `luminon`), server: `packages/mcp-server`, renderer: `packages/renderer`, shared: `packages/shared`.
- Keep helper utilities in `packages/shared`; avoid cross-package imports outside intended boundaries.

## PR etiquette
- Use concise, imperative titles (`feat: …`, `fix: …`).
- Describe what/why; list manual verification steps. Include screenshots for UI.
- If a change might grow bundle size notably, mention it.

## Publishing (maintainers)
- Build all: `npm run build -w @mcp-dashboard/shared && npm run build -w @mcp-dashboard/mcp-server && npm run build -w @mcp-dashboard/renderer && npm run build -w @mcp-dashboard/cli`.
- `npm pack --dry-run` to inspect tarball contents before `npm publish`.
