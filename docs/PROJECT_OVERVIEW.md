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

The user can:

1. Review the default `episodes/` output directory.
2. Select another directory through the native Electron folder picker.
3. Start the download with **Lancer le téléchargement**.
4. Watch RSS lookup, episode, and file download messages in the activity log.
5. Cancel an active download with **Annuler**.

The interface labels are currently in French, while the public README is in English.

## Runtime behavior

The configured podcast ID is `1463322273`, defined as `DEFAULT_PODCAST_ID` in `rss-extract.js`.

The downloader:

1. Calls the Apple Podcasts lookup endpoint.
2. Extracts the feed URL from the lookup response.
3. Fetches and parses the RSS XML with `fast-xml-parser`.
4. Iterates over the feed items.
5. Sanitizes each episode title into a Windows-safe filename.
6. Downloads each enclosure URL into the selected directory.
7. Removes a partial file when a download fails or is cancelled.
8. Reports totals as `{ total, downloaded, failed }`.

Episode-level errors are logged and the remaining episodes continue. A run with one or more episode errors ends with a failed UI status. A lookup, RSS, or cancellation error stops the run immediately.

## Scope currently included

- Electron window creation.
- React/Vite renderer.
- Secure preload bridge.
- Native destination folder selection.
- RSS lookup and XML parsing.
- Sequential MP3 downloads.
- Progress logs and status updates.
- Cancellation through `AbortController`.
- Basic Node.js unit tests.

## Scope currently excluded

- Podcast ID input or multiple podcast profiles.
- Installer generation or auto-updates.
- Download queue management.
- Pause/resume support.
- Episode search, filtering, or playback.
- Download progress percentages or byte-level progress.
- Automated UI/e2e tests.
- Persistent application settings.

## Current validation baseline

- `npm test` contains two tests for filename sanitization and pre-aborted downloads.
- `npm run build` builds the Vite renderer into `dist/`.
- `npm run dev` starts Vite and Electron together.
- `npm start` loads the built renderer from `dist/`.
