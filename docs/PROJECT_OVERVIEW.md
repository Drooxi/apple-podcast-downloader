# Project Overview

## Purpose

Apple Podcast Downloader is a desktop utility that looks up the RSS feed for a configured Apple Podcasts show and downloads its episode audio files as MP3 files.

The current application is intentionally focused on one podcast and one download flow. It is designed for local use rather than as a hosted service or a multi-user product.

## Current user experience

The application opens on a single React page titled **Apple Podcast Downloader**. The visual direction is inspired by Apple Podcasts through:

- a dark purple background;
- pink, red, and violet gradients;
- rounded translucent panels;
- system-style typography and compact metadata labels;
- an activity log styled like a terminal feed.

The Electron application menu bar is hidden to keep the window focused on the downloader interface.

The default Electron window is sized to `1180×900` with a `860×760` minimum so the initial screen fits without page-level vertical scrolling. Only the activity log has its own internal scroll area.

The user can:

1. Search Apple Podcasts by name from the French storefront.
2. Select a suggestion showing the podcast name, author, and artwork.
3. Review the selected podcast before downloading.
4. Review the default `episodes/` output directory or select another directory through the native Electron folder picker.
5. Start the download with **Lancer le téléchargement**.
6. Watch RSS lookup, episode, and file download messages in the activity log.
7. Follow an episode-count progress bar showing successful downloads out of the RSS total.
8. Cancel an active download with **Annuler**.

The interface opens without a podcast selected. Search suggestions start after three characters and a 500 ms debounce. Results are displayed as an overlay inside the download panel, with an internal scroll when the list is taller than the available result area, so the rest of the interface does not move while searching. The selected Apple ID is kept in the application state and passed to the download flow. The destination directory is held by the Electron main process after selection.

The interface labels are currently in French, while the public README is in English.

## Runtime behavior

The command-line downloader keeps `1463322273` as its default podcast ID, defined as `DEFAULT_PODCAST_ID` in `rss-extract.js`. The Electron interface requires the user to select an Apple Podcasts result and uses that result’s ID.

The downloader:

1. Searches the Apple iTunes Search API when the user types at least three characters.
2. Normalizes valid podcast results into an Apple ID, name, author, and artwork URL.
3. Calls the Apple Podcasts lookup endpoint with the selected Apple ID.
4. Extracts the feed URL from the lookup response.
5. Fetches and parses the RSS XML with `fast-xml-parser`.
6. Iterates over the feed items.
7. Sanitizes each episode title into a Windows-safe filename.
8. Downloads each enclosure URL into the selected directory.
9. Removes a partial file when a download fails or is cancelled.
10. Reports totals as `{ total, downloaded, failed }`.
11. Emits progress as `{ total, downloaded, failed, percent }` after RSS parsing and after each episode.

Episode-level errors are logged and the remaining episodes continue. A run with one or more episode errors ends with a failed UI status. A lookup, RSS, or cancellation error stops the run immediately.

## Scope currently included

- Electron window creation.
- React/Vite renderer.
- Secure preload bridge with sandboxed renderer and sender validation.
- Native destination folder selection.
- Apple Podcasts search and result selection.
- RSS lookup and XML parsing.
- Sequential MP3 downloads.
- Progress logs and status updates.
- Episode-count loading bar based on successful downloads.
- Cancellation through `AbortController`.
- Basic Node.js unit tests for the domain, IPC boundaries, preload contract and secure application protocol.

## Desktop distribution

Electron Builder packages the application into a Windows x64 portable `.exe` and macOS x64/arm64 `.dmg` and `.zip` artifacts. GitHub Actions runs these builds on Windows and macOS runners when a `vX.Y.Z` tag is pushed. The tag must match the version in `package.json`; a final Ubuntu job creates the GitHub release with generated notes and uploads all artifacts.

The initial workflow produces unsigned artifacts. Windows signing and macOS signing/notarization activate only when the documented GitHub secrets are provided.

The optional signing secrets are `WINDOWS_CERTIFICATE_BASE64`, `WINDOWS_CERTIFICATE_PASSWORD`, `MAC_CERTIFICATE_BASE64`, `MAC_CERTIFICATE_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`, and `APPLE_DEVELOPER_IDENTITY`. Certificates are decoded into temporary GitHub runner directories during the workflow.

## Scope currently excluded

- Multiple podcast profiles or persisted podcast selection.
- Auto-updates.
- Download queue management.
- Pause/resume support.
- Episode search, filtering, or playback.
- Byte-level download progress.
- Automated UI/e2e tests.
- Persistent application settings.

## Current validation baseline

- `npm test` contains 20 Node.js tests covering search, downloads, episode progress, release tags, HTTP cancellation/redirections, the application protocol, IPC validation, operation managers, and the preload contract.
- `npm run build` builds the Vite renderer into `dist/`.
- `npm run dev` starts Vite and Electron together.
- `npm start` loads the built renderer from `dist/` through the secured `app://bundle` protocol.
- `npm run make` clears `out/make/` and generates local platform distributables through Electron Builder.
- `npm run check:release-version v1.0.0` validates a release tag against `package.json`.
- Renovate checks npm dependencies weekly and opens grouped pull requests for non-major updates.
- `mise.toml` pins Node.js to `24.19.0` and exposes `dev`, `test`, `build`, and `make` tasks through mise.
- The current toolchain uses npm `11.17.0`, Vite `8.2.1`, and `@vitejs/plugin-react` `6.0.5`.
