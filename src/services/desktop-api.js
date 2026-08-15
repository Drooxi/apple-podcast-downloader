export function getDesktopApi() {
  if (!window.podcastDownloader) {
    throw new Error("L’API Electron est indisponible dans cette fenêtre.");
  }
  return window.podcastDownloader;
}
