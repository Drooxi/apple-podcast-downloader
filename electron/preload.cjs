const { contextBridge, ipcRenderer } = require("electron");

const CHANNELS = Object.freeze({
  podcastSearch: "podcast:search",
  podcastCancelSearch: "podcast:cancel-search",
  downloadGetDirectory: "download:get-directory",
  downloadSelectDirectory: "download:select-directory",
  downloadStart: "download:start",
  downloadCancel: "download:cancel",
  downloadLog: "download:log",
  downloadProgress: "download:progress",
  downloadStatus: "download:status",
  historyList: "history:list",
  historyUpdated: "history:updated",
});

function requireCallback(callback) {
  if (typeof callback !== "function") {
    throw new TypeError("Un callback de notification est requis.");
  }
}

function subscribe(channel, callback) {
  requireCallback(callback);
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  let subscribed = true;
  return () => {
    if (!subscribed) return;
    subscribed = false;
    ipcRenderer.removeListener(channel, listener);
  };
}

const api = {
  searchPodcasts: (term) => ipcRenderer.invoke(CHANNELS.podcastSearch, { term }),
  cancelPodcastSearch: () => ipcRenderer.invoke(CHANNELS.podcastCancelSearch),
  getOutputDirectory: () => ipcRenderer.invoke(CHANNELS.downloadGetDirectory),
  selectOutputDirectory: () => ipcRenderer.invoke(CHANNELS.downloadSelectDirectory),
  startDownload: ({ podcastId, podcast } = {}) =>
    ipcRenderer.invoke(CHANNELS.downloadStart, { podcastId, podcast }),
  cancelDownload: () => ipcRenderer.invoke(CHANNELS.downloadCancel),
  onDownloadLog: (callback) => subscribe(CHANNELS.downloadLog, callback),
  onDownloadProgress: (callback) => subscribe(CHANNELS.downloadProgress, callback),
  onDownloadStatus: (callback) => subscribe(CHANNELS.downloadStatus, callback),
  getPodcastHistory: () => ipcRenderer.invoke(CHANNELS.historyList),
  onHistoryUpdated: (callback) => subscribe(CHANNELS.historyUpdated, callback),
};

contextBridge.exposeInMainWorld("podcastDownloader", Object.freeze(api));
