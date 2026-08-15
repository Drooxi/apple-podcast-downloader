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
│ RSS/download module           │
│ rss-extract.js                │
│ HTTPS, XML parsing, files     │
└──────────────────────────────┘
```

The main process also imports `podcast-search.js` for Apple catalog searches. Search requests are kept in the main process and are exposed to React through the preload bridge.

The renderer does not receive Node.js APIs directly. `contextIsolation` is enabled and `nodeIntegration` is disabled in the `BrowserWindow` configuration.

## Startup modes

### Development

`npm run dev` starts two coordinated processes:

- Vite serves the React renderer on `http://127.0.0.1:5173`.
- Electron waits for that URL and loads it through `VITE_DEV_SERVER_URL`.

### Built application

`npm run build` writes the renderer to `dist/`. When `VITE_DEV_SERVER_URL` is absent, Electron loads `dist/index.html` from disk.

There is currently no packaging step, installer, or production distribution configuration.

## File responsibilities

| File | Responsibility |
| --- | --- |
| `package.json` | Dependencies and development/build commands. |
| `index.html` | Vite HTML shell and document title. |
| `vite.config.mjs` | React plugin and `dist/` build output. |
| `electron/main.cjs` | Electron lifecycle, menu-hidden window, native folder dialog, podcast search, download orchestration, and status IPC. |
| `electron/preload.cjs` | Small renderer-facing API built with `contextBridge`. |
| `src/main.jsx` | React root mounting and global stylesheet import. |
| `src/App.jsx` | Page layout, UI state, IPC event subscriptions, and user actions. |
| `src/styles.css` | Visual system, responsive layout, and status styles. |
| `podcast-search.js` | Apple catalog search URL construction, HTTPS requests, cancellation, and result normalization. |
| `rss-extract.js` | Apple lookup, RSS parsing, HTTPS downloads, cancellation, file cleanup, and CLI compatibility. |
| `test/podcast-search.test.cjs` | Node.js tests for search parameters, normalization, and search cancellation. |
| `test/rss-extract.test.cjs` | Node.js tests for filename behavior, download cancellation, and podcast ID validation. |
| `README.md` | Public English setup and usage documentation. |

## IPC contract

### Renderer to main

| Channel | Payload | Result/behavior |
| --- | --- | --- |
| `podcast:search` | `{ term }` | Searches the French Apple Podcasts catalog; aborts the previous search and returns normalized results. |
| `download:default-directory` | none | Returns the absolute `episodes/` path next to the project. |
| `download:select-directory` | none | Opens a native directory picker and returns a path or `null`. |
| `download:start` | `{ outputDirectory, podcastId }` | Runs one download for the selected Apple ID. Rejects if no valid podcast ID or another run is active. |
| `download:cancel` | none | Aborts the active `AbortController`; returns `true` when a run existed. |

### Main to renderer

| Channel | Payload | Meaning |
| --- | --- | --- |
| `download:log` | `{ message, level }` | Incremental activity log entry. `level` is normally `info` or `error`. |
| `download:status` | `{ status, message?, result? }` | Lifecycle state: `running`, `completed`, `failed`, or `cancelled`. |

The preload listener methods return cleanup functions so React can unsubscribe on unmount.

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

`activeDownload` in the main process is the single-run guard and owns the active `AbortController`.

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
