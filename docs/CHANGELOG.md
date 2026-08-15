# Documentation and Implementation Changelog

## 1.1.0 - 2026-08-15

- Published the reorganized and hardened Electron application with Apple Podcasts search, main-owned download destinations, secure `app://bundle` loading, and Electron Builder release targets.
- Corrected native icon generation to derive Windows and macOS icons from `assets/icons/icon.svg`.

## 2026-08-15

### Architecture and security refactor

- Extracted shared HTTP, Apple search and download logic into `core/`, while preserving the root CLI and compatibility façades.
- Prepared a dedicated Electron window, application protocol, IPC registration layer and cancellable operation managers.
- Moved destination-directory ownership to the main process and documented the new IPC contract.
- Added the shared HTTPS client, bounded redirects and centralized partial-file cleanup.
- Added explicit sandboxing, `app://bundle` loading, CSP/navigation restrictions and sender validation for privileged IPC.
- Switched Vite output to relative asset URLs and removed the external Google Fonts dependency from the renderer.
- Split the React page into components/hooks and moved renderer API, path formatting and download/search state into dedicated modules.
- Replaced remaining renderer font references with local system font stacks for offline packaged operation.
- Added boundary tests for the application protocol, IPC handlers, managers, preload wrappers and shared HTTP cancellation.
- Finalized the documentation baseline for the secured `app://bundle` renderer, main-owned destination directory, 17-test suite, and Electron lifecycle cleanup.
- Validation passed for the 17-test Node suite, Vite build, relative asset URLs, release-tag check, CJS syntax and diff checks; the local Windows portable packaging reached Electron Builder's portable target but remained blocked in the environment's `signtool.exe` step without a project certificate.
- Fixed shutdown cleanup by avoiding access to destroyed `webContents` in the window `closed` handler.
- Corrected generated native icons with valid PNG checksums and multi-resolution Windows ICO entries so packaged executables can display their application icon.
- Changed icon generation to read `assets/icons/icon.svg` as the single artwork source for the Windows ICO and macOS ICNS outputs.

### Desktop packaging and releases

- Replaced Electron Forge and Squirrel packaging with direct Electron Builder configuration.
- Added a Windows x64 portable `.exe` target and preserved macOS x64/arm64 DMG and ZIP targets under `out/make`.
- Added conditional Windows/macOS certificate handling, macOS hardened runtime entitlements, and optional notarization secrets.
- Passed the optional macOS Developer ID identity to Electron Builder only when a signing certificate is configured.
- Updated the release workflow and documentation to use Electron Builder commands and artifact names.
- Added the desktop packaging pipeline for Windows x64 `.exe` and macOS x64/arm64 `.dmg`/`.zip` artifacts.
- Added generated native application icons and a release-tag/version consistency check.
- Added a GitHub Actions workflow triggered by `v*` tags, with one final job publishing generated release notes and all platform artifacts.
- Prepared conditional Windows signing and macOS signing/notarization without requiring secrets for initial unsigned builds.
- Added the author and description metadata required by the Windows package metadata.
- Added release-version unit coverage and made GitHub artifact collection robust to nested artifact paths.
- Ignored local desktop packaging output under `out/`.
- Corrected the README project tree and documented all optional signing secrets.
- Updated the Windows workflow to decode the certificate from a base64 secret on the temporary runner.
- Added Renovate configuration for scheduled, grouped npm dependency updates without auto-merge.
- Installed mise 2026.8.6 on Windows and added `mise.toml` with the project Node.js version and task aliases.
- Migrated the project runtime from Node.js 22.12.0 to Node.js 24.19.0 LTS and npm 11.17.0.
- Updated Vite to 8.2.1, `@vitejs/plugin-react` to 6.0.5, Electron to 43.4.0, Renovate to 44.30.3, and refreshed the npm lockfile.
- Classified Renovate as development tooling so its native `re2` dependency is excluded from packaged application dependencies.
- Confirmed the local Electron smoke test starts successfully and the previous Windows x64 packaging completed after excluding Renovate's native tooling from production dependencies.
- Validated `npm ci`, nine passing Node.js tests, the Vite build, release-tag matching, Renovate configuration, and an empty `npm outdated` report.
- Recorded the remaining npm audit report from the refreshed tree: 29 vulnerabilities (3 low, 25 high, 1 critical) require separate dependency/security review.
- Added an explicit Electron runtime postinstall step so clean npm installations are ready to start and package the desktop application.
- Added a clean packaging step and excluded `out/` from the packaged file set after detecting recursive inclusion of previous local artifacts.

### Podcast search and selection

- Added Apple Podcasts search with French storefront parameters, three-character minimum, 500 ms debounce, and up to eight normalized results.
- Added podcast selection UI with artwork, author, empty/error/loading states, and a change action.
- Updated the download IPC payload to require the selected Apple ID from the Electron interface.
- Added search cancellation and stale-response protection.
- Added seven automated tests covering search, normalization, cancellation, filename handling, and podcast ID validation.
- Updated the public and internal documentation to describe the new flow.
- Fixed invalid search JSON handling so malformed Apple responses resolve as visible errors instead of leaving a request pending.

### Window layout

- Increased the default Electron window size to `1180×900` and constrained the root viewport to prevent a vertical scrollbar at launch.
- Kept scrolling limited to the activity log.

### Search results layout

- Changed search suggestions to overlay the download panel instead of pushing the destination and activity sections down.
- Added a 340 px maximum height and internal scrolling for long result lists.

### Agent instructions

- Added the root `AGENTS.md` file with the mandatory documentation-first workflow.
- Recorded the requirement to keep `docs/` synchronized after every code change.

### Documentation correction

- Corrected the README license reference from ISC to The Unlicense.
- Synchronized the package metadata and lockfile root license with The Unlicense.

### Window behavior

- Hid the Electron application menu bar from the main downloader window.

### Documentation baseline

- Audited the complete project structure and current runtime behavior.
- Added the internal working rules in `WORKING_RULES.md`.
- Added the product/runtime overview in `PROJECT_OVERVIEW.md`.
- Added the process model and IPC contract in `ARCHITECTURE.md`.
- Added durable technical decisions and known limitations in `DECISIONS.md`.
- Recorded the current test, build, and development commands.

### Current implementation snapshot

- Electron main process creates one window and manages the download lifecycle.
- React/Vite renders the single-page downloader interface.
- The preload bridge exposes directory selection, start/cancel actions, logs, and status events.
- `rss-extract.js` supports both module use and direct CLI execution.
- Electron Builder packages Windows and macOS artifacts, and GitHub Actions publishes tagged releases.
