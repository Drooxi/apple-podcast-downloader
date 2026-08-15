# Technical Decisions

## Electron with a React/Vite renderer

The application is a desktop utility, so Electron provides the native window and folder dialog while React/Vite keeps the UI easy to iterate on. The renderer is intentionally separated from privileged APIs.

## Secure preload bridge

The renderer uses a small `window.podcastDownloader` API exposed by `electron/preload.cjs`. Direct Node access is disabled. New native capabilities should be added as narrow methods and named IPC channels, not by exposing `ipcRenderer` or arbitrary Electron objects.

## Direct module integration for downloads

The Electron main process imports `runDownload` from `rss-extract.js` instead of spawning a second Node process. This keeps the integration small and allows the main process to receive structured logs and results directly.

The downloader remains executable as a CLI through its `require.main === module` branch so the original script workflow is preserved.

## Apple catalog search

Podcast selection uses Apple’s iTunes Search API in the Electron main process. Searches use the French storefront (`country=fr`), `media=podcast`, `entity=podcast`, `lang=fr_fr`, and a limit of eight results. The renderer starts searching after three characters with a 500 ms debounce.

Search results are normalized to the smallest UI contract needed by the application: Apple ID, podcast name, author, and artwork URL. The renderer ignores stale responses and the main process aborts the previous request when a new search begins.

The UI has no default selection. The CLI retains the existing default ID for backward compatibility, while Electron requires a selected numeric Apple ID before starting a download.

Search suggestions are positioned as an overlay inside the download panel rather than in the normal document flow. The list is capped at 340 px and scrolls internally when needed. This keeps the destination, action, and activity sections stable while results are visible.

## Sequential downloads

Episodes are downloaded one at a time. This reduces simultaneous network and filesystem pressure and keeps the activity log ordered. Parallel downloads can be considered only after defining concurrency limits, retry behavior, and cancellation semantics.

## AbortController cancellation

The main process creates one `AbortController` per run. Network requests receive its signal, the current stream is destroyed when cancellation occurs, and the partial destination file is removed.

## Output directory

The initial directory is the project-level `episodes/` folder. The user can replace it through Electron’s native directory picker. The directory is created recursively before the RSS lookup/download work starts.

## Error policy

- Lookup and RSS parsing failures reject the whole run.
- An individual episode download failure is logged, counted, and does not prevent later episodes from being attempted.
- Any non-zero failed episode count is reported as a failed overall status.
- Cancellation is represented separately from failure.

## Electron Builder distribution

Electron Builder is used directly for platform packaging. The Windows target is a portable x64 `.exe`, while macOS produces x64/arm64 DMG and ZIP distributables. Builds run on native GitHub-hosted runners because DMG generation requires macOS.

The Builder configuration uses the explicit application ID `com.drooxi.apple-podcast-downloader`, a shared `out/make` output directory, ASAR packaging, and stable platform/architecture artifact names. The local `make` task clears that generated directory before packaging and excludes it from the application file set, preventing previous builds from being recursively packaged or uploaded.

Releases are triggered by `v*` tags, and `scripts/check-release-version.cjs` requires the tag to match the `package.json` version. A single Ubuntu publication job creates the GitHub release and uploads artifacts collected from the platform jobs.

Signing is conditional: unsigned artifacts are valid for the initial workflow, while Windows signing uses `WINDOWS_CERTIFICATE_BASE64` and `WINDOWS_CERTIFICATE_PASSWORD`, and macOS signing/notarization additionally uses `MAC_CERTIFICATE_BASE64`, `MAC_CERTIFICATE_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`, and `APPLE_DEVELOPER_IDENTITY`. Certificates are decoded only into temporary runner directories. Auto-update support remains out of scope.

## Renovate dependency updates

Renovate is configured through `renovate.json` for weekly npm dependency checks. Minor and patch updates are grouped into a single pull request, while major updates remain separate for deliberate review. A dependency dashboard, pull request limits, and the `dependencies` label keep maintenance visible without enabling automatic merges.

## mise project environment

mise is used as the project tool-version manager. `mise.toml` pins Node.js to `24.19.0`, matching the release workflow and the supported Vite 8 runtime, while npm `11.17.0` remains the package manager. mise task aliases call the existing npm scripts instead of duplicating project behavior.

## Node.js 24 and dependency baseline

Node.js 24.19.0 LTS is the supported runtime baseline. Direct dependencies are refreshed to current stable releases, including Vite 8, `@vitejs/plugin-react` 6, Electron 43.4, Renovate 44, and their compatible transitive lockfile dependencies. The `engines` field rejects runtimes older than Node 24.19/npm 11.17.

Electron 43.4.0 exposes its runtime download as the `install-electron` binary rather than a package lifecycle script in the installed package metadata. The project therefore runs it from `postinstall` so `npm ci` consistently prepares the runtime needed by Electron Builder and local startup.

## Current limitations to revisit

- The CLI podcast ID is still hard-coded; the Electron UI now selects an ID through Apple search.
- The output path is accepted through the bridge without a separate allowlist; the UI normally supplies a native-picker result or the known default.
- There is no retry policy for transient HTTP failures.
- There is no byte-level progress indicator.
- The UI has no automated component or end-to-end test coverage.
