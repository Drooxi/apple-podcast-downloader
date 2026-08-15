const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("podcastDownloader", {
  searchPodcasts: (term) => ipcRenderer.invoke("podcast:search", { term }),
  getDefaultDirectory: () => ipcRenderer.invoke("download:default-directory"),
  selectDirectory: () => ipcRenderer.invoke("download:select-directory"),
  startDownload: ({ outputDirectory, podcastId }) =>
    ipcRenderer.invoke("download:start", { outputDirectory, podcastId }),
  cancelDownload: () => ipcRenderer.invoke("download:cancel"),
  onLog: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("download:log", listener);
    return () => ipcRenderer.removeListener("download:log", listener);
  },
  onStatus: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("download:status", listener);
    return () => ipcRenderer.removeListener("download:status", listener);
  },
});
