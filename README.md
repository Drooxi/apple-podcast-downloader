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
- Episode-count loading bar with download percentage.
- Download cancellation with partial-file cleanup.
- Secure Electron IPC bridge with `contextIsolation` enabled and Node integration disabled.
- Sandboxed renderer served through a restricted `app://bundle` protocol in packaged builds, with relative assets and a restrictive CSP.
- Command-line compatible RSS downloader.

## Requirements

- Node.js 24.19.0 LTS or newer.
- npm.
- mise 2026.8+ (recommended for the project-managed Node.js version).
- An internet connection to access the Apple Podcasts lookup API, RSS feed, and audio files.

## Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/Drooxi/apple-podcast-downloader.git
cd apple-podcast-downloader
npm install
```

The project includes `mise.toml`, which pins Node.js to `24.19.0` and provides shortcuts for development tasks. After installing mise, from the project directory run:

```powershell
mise trust
mise install
```

You can then run `mise run dev`, `mise run test`, `mise run build`, or `mise run make`.

The project dependencies are maintained against Node.js 24 LTS, Vite 8, and the React Vite plugin 6. `npm ci` also downloads the Electron runtime required by the desktop and packaging commands.

## Development

Start the Vite development server and Electron together:

```bash
npm run dev
```

The Electron window will load the local Vite application.

Packaged builds serve the generated renderer from `dist/` through `app://bundle`; the renderer never receives direct Node.js or filesystem access. The main process owns the selected destination directory and the download request contains only the selected podcast ID.

## Production build

Build the React renderer:

```bash
npm run build
```

Then launch Electron with the generated build:

```bash
npm start
```

To create the desktop distributables locally, use Electron Builder on the current operating system. The command clears the generated `out/make/` directory first:

```bash
npm run make
```

Windows produces `out/make/ApplePodcastDownloader-<version>-win-x64.exe` as an x64 portable application. macOS produces `out/make/ApplePodcastDownloader-<version>-mac-<arch>.dmg` and `.zip` files for x64 and arm64. macOS builds must run on macOS.

The local and CI packaging command explicitly disables Electron Builder publishing. GitHub release publication is handled only by the workflow's final `publish` job, so unsigned builds without `GH_TOKEN` or signing credentials still complete successfully.

## GitHub releases

Releases are built by GitHub Actions when a tag matching `vX.Y.Z` is pushed. The tag must match the version in `package.json`:

```bash
git tag v1.1.1
git push origin v1.1.1
```

The workflow builds Windows x64 and macOS x64/arm64 artifacts, generates release notes, and publishes them to one GitHub release. Initial builds are unsigned. Signing and macOS notarization are enabled automatically when the documented repository secrets are configured.

Optional repository secrets for signing are:

- `WINDOWS_CERTIFICATE_BASE64`: base64-encoded Windows `.p12`/`.pfx` certificate.
- `WINDOWS_CERTIFICATE_PASSWORD`: certificate password.
- `MAC_CERTIFICATE_BASE64`: base64-encoded macOS Developer ID `.p12` certificate.
- `MAC_CERTIFICATE_PASSWORD`: macOS certificate password.
- `APPLE_ID`: Apple Developer account email.
- `APPLE_APP_SPECIFIC_PASSWORD`: app-specific password for notarization.
- `APPLE_TEAM_ID`: Apple Developer team ID.
- `APPLE_DEVELOPER_IDENTITY`: Developer ID Application certificate identity.

Certificates are decoded only on the GitHub runner and are never committed to the repository. Without the certificate and notarization secrets, the workflow creates unsigned artifacts.

## Usage

1. Open the application.
2. Search for a podcast by entering at least three characters.
3. Select a podcast suggestion to confirm its Apple ID.
4. Review or change the destination folder.
5. Click **Lancer le téléchargement**.
6. Follow the live activity log and episode-count progress bar.
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

Run the 20 automated Node.js tests with:

```bash
npm test
```

## Project structure

```text
electron/
  main.cjs       Electron bootstrap and lifecycle
  window.cjs     Secure BrowserWindow creation
  preload.cjs    Secure renderer bridge
  app-protocol.cjs Secure app://bundle renderer protocol
  ipc/           IPC channels, sender validation, and handlers
  services/      Search and download lifecycle managers
src/
  App.jsx        Main page composition
  components/    Download, search, artwork, and activity-log components
  hooks/         Search and download state hooks
  services/      Renderer desktop API adapter
  utils/         Renderer formatting helpers
  main.jsx       React entry point
  styles.css     Application styling
core/            Shared HTTP, Apple search, and download modules
podcast-search.js Apple Podcasts catalog search logic
rss-extract.js   RSS lookup and episode download logic
test/
  *.test.cjs     Node.js tests
assets/icons/    Windows, macOS, and source application icons
electron-builder.config.cjs Electron Builder packaging configuration
assets/entitlements*.plist macOS hardened runtime entitlements
scripts/         Release validation, icon generation, and packaging cleanup scripts
.github/workflows/release.yml GitHub release workflow
```

## License

This project is released under [The Unlicense](https://unlicense.org). See [LICENSE](LICENSE) for the full dedication to the public domain.
