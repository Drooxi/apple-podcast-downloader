# Documentation and Implementation Changelog

## 2026-08-15

### Desktop packaging and releases

- Added Electron Forge packaging for Windows x64 `.exe` and macOS x64/arm64 `.dmg`/`.zip` artifacts.
- Added generated native application icons and a release-tag/version consistency check.
- Added a GitHub Actions workflow triggered by `v*` tags, with one final job publishing generated release notes and all platform artifacts.
- Prepared conditional Windows signing and macOS signing/notarization without requiring secrets for initial unsigned builds.
- Added the author and description metadata required by the Windows Squirrel maker.
- Added release-version unit coverage and made GitHub artifact collection robust to nested artifact paths.
- Ignored local Electron Forge output under `out/`.
- Corrected the README project tree and documented all optional signing secrets.
- Updated the Windows workflow to decode the certificate from a base64 secret on the temporary runner.
- Added Renovate configuration for scheduled, grouped npm dependency updates without auto-merge.
- Installed mise 2026.8.6 on Windows and added `mise.toml` with the project Node.js version and task aliases.
- Migrated the project runtime from Node.js 22.12.0 to Node.js 24.19.0 LTS and npm 11.17.0.
- Updated Vite to 8.2.1, `@vitejs/plugin-react` to 6.0.5, Electron to 43.4.0, Renovate to 44.30.3, and refreshed the npm lockfile.
- Classified Renovate as development tooling so its native `re2` dependency is excluded from packaged application dependencies.
- Confirmed the local Electron smoke test starts successfully and the Windows x64 Forge packaging completes after excluding Renovate's native tooling from production dependencies; the generated installer is `ApplePodcastDownloaderSetup.exe`.
- Validated `npm ci`, nine passing Node.js tests, the Vite build, release-tag matching, Renovate configuration, and an empty `npm outdated` report.
- Recorded the remaining npm audit report from the refreshed tree: 29 vulnerabilities (3 low, 25 high, 1 critical) require separate dependency/security review.
- Added an explicit Electron runtime postinstall step so clean npm installations are ready to start and package the desktop application.

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
- Electron Forge packages Windows and macOS artifacts, and GitHub Actions publishes tagged releases.
