# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Shackalope** is an MCP server (HTTP, Streamable HTTP transport) that connects AI agents to amateur radio data and software, with MCP Apps views (interactive UI that hosts like Claude Desktop render in a sandboxed iframe). The project folder is still named `radio-free-ai`, its working name.

## Commands

- `npm run dev`: builds once, then runs three watchers via `concurrently`:
  - `dev:views`: `vite build --watch` (rebuilds the views)
  - `dev:server`: `node --watch dist/server.js` (the MCP server on `http://localhost:3000/mcp`, restarted when its bundle changes)
  - `dev:preview`: the Vite dev server, hosting the view preview at `http://localhost:5173/preview/`
- `npm run build`: `rimraf dist && vite build` (server bundle plus one page per view)
- `npm start`: runs the built server. `PORT` overrides 3000.
- `npm run typecheck`: two passes. The root `tsconfig.json` covers server code; `src/mcp/views/tsconfig.json` covers browser code (DOM types, no Node types).
- `npm run format` / `npm run format:check`: Prettier over the whole project.

There are no tests yet; Vitest is planned and should reuse `vite.config.ts` (aliases included).

## Architecture

Layers, in call order (which is also alphabetical): `http` → `mcp` → `services` → `stores`. Nothing imports upward: stores know nothing of services, and services know nothing of MCP.

- **`src/server.ts`**: the composition root. It creates the `Vault`, then the services (`createServices`), then the HTTP app.
- **`src/http/`**: a Hono app. `/mcp` is handled by `createMcpHandler` from the v2 MCP SDK, which is stateless (a fresh `McpServer` per request), so the server can't push notifications. Every route rejects non-localhost `Host` headers, and `/mcp` rejects foreign `Origin` headers.
- **`src/mcp/`**: the MCP surface, organized by how things are used, not by MCP primitive:
  - `queries/`: read-only. Each is a **resource** (the canonical data), plus a tool only where the model needs reliable access. Hosts handle resources unevenly (Claude Desktop doesn't let the model read them), so anything the model must know comes back from a tool. Read tools return a `resource_link` to their resource.
  - `actions/`: tools with side effects.
  - `views/<name>/`: `show-<name>.ts` registers the show tool and its `ui://` resource. `app/` holds the browser code (`index.html`, `main.ts`, `render.ts`, `styles.css`). Show tools return their data as text and `structuredContent` too, so the model can discuss what the user sees.
  - `views/shared/`: theme and base CSS, and `view-app.ts` (creates and connects the ext-apps `App`, follows the host's theme).
  - `uris.ts`: every URI the server serves. It's browser-safe, so views import URIs from here, never from server modules (which would bundle server code into the view).
- **`src/services/<domain>/`**: domain logic. `model.ts` holds types only (views import them), while I/O and logic live in separate files. Band conditions (HamQSL) and solar images (NASA SDO) are fetched and cached in memory here; they don't touch the vault. Band activity is the one live feed: `BandActivityService` opens an MQTT connection to PSKReporter on the first request, keeps a 15-minute window of receptions in memory, and closes after 10 minutes with no requests. Since the server can't push, its view polls the resource every 10 seconds, and that polling also keeps the feed open.
- **`src/stores/`**: file I/O on the **vault**, a folder of plain, user-owned files in open formats (JSON now, ADIF planned for the logbook). `Vault` does safe writes (temp file, then rename) and refuses paths that escape its root. Stores are classes constructed with a `Vault`, so tests can point one at a temp folder.
- **The vault's location** is the OS's per-user app data folder plus a layout version: `~/.local/share/shackalope/v1` on Linux, with `Shackalope` folders on macOS and Windows. A future layout gets `v2/` and migrates from `v1/`.

### How a view works

Hosts fetch a view's HTML over MCP (`resources/read` on its `ui://` URI) and put it into a sandboxed iframe, so it can't load anything from a URL. Each view must therefore be one self-contained file. `vite.config.ts` builds the server plus one Vite "environment" per view folder that has `app/index.html`, using `vite-plugin-singlefile` to inline the JS and CSS. Output goes to `dist/views/<name>/app/index.html`, which `views/view-resource.ts` reads from disk on each request. Views read images and data through `app.readServerResource()` and call tools through `app.callServerTool()`, both relayed by the host. After a view changes what the user sees, it should tell the model via `app.updateModelContext()`.

### The preview

`src/mcp/views/preview/` is a development-only host page, built on ext-apps' `AppBridge` and the MCP `Client`. It calls the real show tool on the running server (proxied at `/mcp` by the Vite dev server) and renders the view from source, so CSS edits update instantly. A new view needs an entry in `preview/scenarios.ts` (its show tool and sample arguments).

## Conventions

- **Commits:** a single brief line, with no Claude attribution or trailers. The `attribution` setting in `.claude/settings.json` turns off the automatic trailers.
- **Imports:** path aliases `@mcp/*`, `@services/*` and `@stores/*` for any import that goes up a folder; same-folder and child imports stay relative. No `.js` extensions (`moduleResolution: "bundler"`). CSS `@import`s stay relative.
- **TypeScript style** follows Guy's personal style (the `code-typescript-like-guy` skill), enforced for formatting by `.prettierrc`. A Claude Code `PostToolUse` hook (`.claude/hooks/format.ts`) runs Prettier on every file Claude writes or edits; Prettier never rewraps comments or strings, so keep those within 80 columns by hand.
- **Files** are named for what they hold: one file per tool (`get-…`, `set-…`, `show-…`), resources named for their URI scheme.

## Gotchas

- Claude Desktop fetches the tool list when it connects, and this server never announces changes, so after adding, renaming or re-describing a tool, Desktop must be fully restarted. Views showing up as plain text usually means Desktop has a stale tool list, or the model called a `get_` tool, which has no view.
- Desktop can only show views that have been built, so `dist/` must exist (`npm run dev` or `npm run build`).
- A view reports its own height to the host; content that appears after its last report (e.g. a caption that renders when an image loads) may be clipped.
