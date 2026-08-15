# Apple Podcast Downloader

A lightweight Electron desktop application for discovering and downloading podcast episodes from an Apple Podcasts RSS feed.

The app provides a simple React interface inspired by Apple Podcasts, with a destination folder picker, live download logs, and cancellation support.

## Features

- Electron desktop application with a React/Vite renderer.
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

This project currently targets local development and does not include an installer or packaging configuration.

## Usage

1. Open the application.
2. Review or change the destination folder.
3. Click **Start Download**.
4. Follow the live activity log.
5. Click **Cancel** if the download needs to be stopped.

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
rss-extract.js   RSS lookup and episode download logic
test/            Node.js tests
```

## License

This project is released under [The Unlicense](https://unlicense.org). See [LICENSE](LICENSE) for the full dedication to the public domain.
