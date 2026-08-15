# Apple Podcast Downloader

A lightweight Electron desktop application for discovering and downloading podcast episodes from an Apple Podcasts RSS feed.

The app provides a simple React interface inspired by Apple Podcasts, with podcast search and selection, a destination folder picker, live download logs, and cancellation support.

## Features

- Electron desktop application with a React/Vite renderer.
- Apple Podcasts search with autocomplete suggestions.
- Podcast selection with name, author, and artwork preview.
- Apple Podcasts RSS feed lookup.
- MP3 episode downloads to a folder of your choice.
- Live activity log during downloads.
- Download cancellation with partial-file cleanup.
- Secure Electron IPC bridge with `contextIsolation` enabled and Node integration disabled.
- Command-line compatible RSS downloader.

## Requirements

- Node.js 20.19+ or 22.12+.
- npm.
- An internet connection to access the Apple Podcasts lookup API, RSS feed, and audio files.

## Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/Drooxi/apple-podcast-downloader.git
cd apple-podcast-downloader
npm install
```

## Development

Start the Vite development server and Electron together:

```bash
npm run dev
```

The Electron window will load the local Vite application.

## Production build

Build the React renderer:

```bash
npm run build
```

Then launch Electron with the generated build:

```bash
npm start
```

To create a platform installer locally, use Electron Forge on the current operating system:

```bash
npm run make
```

Windows produces an x64 `.exe` installer. macOS produces `.dmg` and `.zip` files for the selected architecture. DMG builds must run on macOS.

## GitHub releases

Releases are built by GitHub Actions when a tag matching `vX.Y.Z` is pushed. The tag must match the version in `package.json`:

```bash
git tag v1.0.0
git push origin v1.0.0
```

The workflow builds Windows x64 and macOS x64/arm64 artifacts, generates release notes, and publishes them to one GitHub release. Initial builds are unsigned. Signing and macOS notarization are enabled automatically when the documented repository secrets are configured.

## Usage

1. Open the application.
2. Search for a podcast by entering at least three characters.
3. Select a podcast suggestion to confirm its Apple ID.
4. Review or change the destination folder.
5. Click **Lancer le téléchargement**.
6. Follow the live activity log.
7. Click **Annuler** if the download needs to be stopped.

The default destination is the project’s `episodes/` directory. Downloaded MP3 files are ignored by Git.

## Command-line downloader

The RSS downloader can also be run directly with Node.js. By default, episodes are saved to `episodes/`:

```bash
node rss-extract.js
```

To provide a custom output directory:

```bash
node rss-extract.js path/to/output-directory
```

The podcast ID is currently defined in `rss-extract.js` as `1463322273`.

## Testing

Run the automated tests with:

```bash
npm test
```

## Project structure

```text
electron/
  main.cjs       Electron main process and IPC handlers
  preload.cjs    Secure renderer bridge
  src/
  App.jsx        Main React interface
  main.jsx       React entry point
  styles.css     Application styling
podcast-search.js Apple Podcasts catalog search logic
rss-extract.js   RSS lookup and episode download logic
test/            Node.js tests
forge.config.cjs Electron Forge packaging configuration
scripts/          Release validation and icon generation scripts
```

## License

This project is released under [The Unlicense](https://unlicense.org). See [LICENSE](LICENSE) for the full dedication to the public domain.
