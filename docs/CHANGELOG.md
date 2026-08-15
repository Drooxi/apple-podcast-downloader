# Documentation and Implementation Changelog

## 2026-08-15

### Agent instructions

- Added the root `AGENTS.md` file with the mandatory documentation-first workflow.
- Recorded the requirement to keep `docs/` synchronized after every code change.

### Documentation correction

- Corrected the README license reference from ISC to The Unlicense.
- Synchronized the package metadata and lockfile root license with The Unlicense.

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
- The repository has no installer or packaging workflow.
