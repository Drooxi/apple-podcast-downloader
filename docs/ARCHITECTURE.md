# Architecture

## Process model

```text
┌──────────────────────────────┐
│ React renderer                │
│ src/App.jsx + styles.css     │
│ UI state and user actions     │
└──────────────┬───────────────┘
               │ window.podcastDownloader
               │ exposed API only
┌──────────────▼───────────────┐
│ Electron preload              │
│ electron/preload.cjs          │
│ contextBridge + ipcRenderer   │
└──────────────┬───────────────┘
               │ named IPC channels
┌──────────────▼───────────────┐
│ Electron main process         │
│ electron/main.cjs             │
│ BrowserWindow, dialog, IPC    │
└──────────────┬───────────────┘
               │ direct module call
┌──────────────▼───────────────┐
│ Core domain modules           │
│ core/*.cjs                    │
│ HTTP, Apple API, files        │
└──────────────────────────────┘
```

The main process uses `electron/services/search-manager.cjs` and `electron/services/download-manager.cjs`, which call the reusable modules under `core/`. The root `podcast-search.js` and `rss-extract.js` files remain compatibility/CLI façades.

The renderer does not receive Node.js APIs directly. `contextIsolation`, `nodeIntegration: false` and `sandbox: true` are explicit in the `BrowserWindow` configuration. Production content is served through `app://bundle`, and navigation, new windows, permissions and IPC sender origins are restricted.

## Startup modes

### Development

`npm run dev` starts two coordinated processes:

- Vite serves the React renderer on `http://127.0.0.1:5173`.
- Electron waits for that URL and loads it through `VITE_DEV_SERVER_URL`.

### Built application

`npm run build` writes the renderer to `dist/` using Vite 8 and `@vitejs/plugin-react` 6 with relative asset URLs. When `VITE_DEV_SERVER_URL` is absent, Electron serves `dist/index.html` through the secured `app://bundle` protocol.

The renderer declares a restrictive Content Security Policy, uses system fonts and allows only HTTPS podcast artwork as a remote visual resource.

The packaging configuration is defined in `electron-builder.config.cjs`. `npm run make` first clears the generated `out/make/` directory, then builds with Electron Builder. Electron Builder creates a Windows x64 portable `.exe` and macOS DMG/ZIP distributables. The GitHub Actions release workflow builds each platform on its native runner and publishes the collected artifacts in one release job.

## File responsibilities

| File | Responsibility |
| --- | --- |
| `package.json` | Runtime dependencies, development tooling (including Renovate), Node/npm engine constraints, Electron runtime installation, and build commands. |
| `index.html` | Vite HTML shell and document title. |
| `vite.config.mjs` | React plugin and `dist/` build output. |
| `electron/main.cjs` | Electron bootstrap, lifecycle and service initialization. |
| `electron/window.cjs` | Secure BrowserWindow creation, navigation policy and development/production loading. |
| `electron/preload.cjs` | Self-contained sandbox-compatible renderer API built with `contextBridge`. |
| `electron/ipc/register-handlers.cjs` | Validated IPC handlers and cleanup registration. |
| `electron/services/search-manager.cjs` | Search cancellation and active-search state. |
| `electron/services/download-manager.cjs` | Download lifecycle, destination ownership and status/log events. |
| `electron/app-protocol.cjs` | Secure `app://bundle` serving of built renderer files. |
| `src/main.jsx` | React root mounting and global stylesheet import. |
| `src/App.jsx` | Page composition and hero layout. |
| `src/components/DownloadPanel.jsx` | Download panel composition, destination controls, status and action buttons. |
| `src/components/PodcastSearch.jsx` | Search input, suggestions and selected podcast card. |
| `src/components/ActivityLog.jsx` | Scrollable download activity log. |
| `src/hooks/usePodcastSearch.js` | Debounce, stale-response protection, search cancellation and selection state. |
| `src/hooks/useDownload.js` | Directory initialization, IPC subscriptions, download actions and status state. |
| `src/services/desktop-api.js` | Renderer-side bridge availability check. |
| `src/utils/format-path.js` | Destination path display formatting. |
| `src/styles.css` | Visual system, responsive layout, and status styles. |
| `core/http-client.cjs` | Shared HTTPS text/file requests, redirects, cancellation and partial-file cleanup. |
| `core/podcast-search.cjs` | Apple catalog search URL construction and result normalization. |
| `core/podcast-downloader.cjs` | Apple lookup, RSS parsing, sequential downloads and cancellation. |
| `rss-extract.js` | CLI entry point and compatibility façade for the downloader core. |
| `podcast-search.js` | Compatibility façade for the podcast search core. |
| `test/podcast-search.test.cjs` | Node.js tests for search parameters, normalization, and search cancellation. |
| `test/rss-extract.test.cjs` | Node.js tests for filename behavior, download cancellation, and podcast ID validation. |
| `test/http-client.test.cjs` | Tests for bounded redirects and pre-aborted shared HTTP requests. |
| `test/security-ipc.test.cjs` | Tests for application protocol path safety, sender origins, payloads and handler cleanup. |
| `test/managers.test.cjs` | Tests for search cancellation and single-download lifecycle ownership. |
| `test/preload.test.cjs` | VM-based tests for the sandbox-compatible preload API and subscriptions. |
| `README.md` | Public English setup and usage documentation. |
| `electron-builder.config.cjs` | Electron Builder targets, application identity, icons, artifact names, entitlements, and conditional notarization configuration. |
| `assets/entitlements.mac.plist` | Hardened runtime entitlements for the macOS application and child processes. |
| `assets/entitlements.mac.inherit.plist` | Inherited hardened runtime entitlements for Electron child processes. |
| `scripts/clean-artifacts.cjs` | Removes the generated `out/make/` directory before a local package build. |
| `scripts/generate-icons.cjs` | Generates the versioned Windows ICO, macOS ICNS, and SVG source icon. |
| `scripts/check-release-version.cjs` | Ensures a release tag matches the npm package version and exports the validation for tests. |
| `.github/workflows/release.yml` | Builds Windows/macOS artifacts and publishes GitHub releases for `v*` tags. |
| `renovate.json` | Configures scheduled npm dependency updates, grouping, limits, and review labels. |
| `mise.toml` | Pins the project Node.js version and defines mise task aliases for development, tests, builds, and packaging. |

## IPC contract

### Renderer to main

| Channel | Payload | Result/behavior |
| --- | --- | --- |
| `podcast:search` | `{ term }` | Searches the French Apple Podcasts catalog; aborts the previous search and returns normalized results. |
| `podcast:cancel-search` | none | Cancels the active catalog search. |
| `download:get-directory` | none | Returns the directory currently owned by the main process. |
| `download:select-directory` | none | Opens a native directory picker, updates main-process state and returns a path or `null`. |
| `download:start` | `{ podcastId }` | Runs one download using the main-process-owned destination. Rejects invalid payloads or concurrent runs. |
| `download:cancel` | none | Aborts the active `AbortController`; returns `true` when a run existed. |

### Main to renderer

| Channel | Payload | Meaning |
| --- | --- | --- |
| `download:log` | `{ message, level }` | Incremental activity log entry. `level` is normally `info` or `error`. |
| `download:status` | `{ status, message?, result? }` | Lifecycle state: `running`, `completed`, `failed`, or `cancelled`. |

The preload listener methods return idempotent cleanup functions so React can unsubscribe on unmount. Every handler validates the sender frame before performing a privileged operation. The renderer starts downloads with only `{ podcastId }`; the main process supplies the destination.

## Download state flow

```text
idle
  │ start
  ▼
running ── cancel ──► cancelled
  │
  ├─ all episodes succeed ─► completed
  ├─ some episode errors ───► failed
  └─ lookup/RSS error ──────► failed
```

`download-manager.cjs` is the single-run guard and owns the active `AbortController` and output directory.

The main process captures the window webContents identifier when the window is created. The closed-window cleanup uses that identifier without dereferencing the destroyed `webContents` object.

## Podcast search flow

```text
user types 3+ characters
          │
          ▼ 500 ms debounce
React calls podcast:search
          │
          ▼
main aborts previous search and calls Apple Search API
          │
          ▼
normalized suggestions: id, name, author, artworkUrl
          │
          ▼
user selects result
          │
          ▼
download:start receives selected podcastId
```
