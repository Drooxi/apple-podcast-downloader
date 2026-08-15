# Documentation and Implementation Changelog

## 2026-08-15

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
- The repository has no installer or packaging workflow.
