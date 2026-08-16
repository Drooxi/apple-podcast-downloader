const path = require("node:path");

const { app, BrowserWindow, dialog, ipcMain, net, protocol } = require("electron");
const { registerAppProtocol, registerAppScheme } = require("./app-protocol.cjs");
const { registerIpcHandlers } = require("./ipc/register-handlers.cjs");
const { createMainWindow } = require("./window.cjs");
const { DownloadManager } = require("./services/download-manager.cjs");
const { OutputDirectoryStore } = require("./services/output-directory-store.cjs");
const { SearchManager } = require("./services/search-manager.cjs");

const defaultOutputDirectory = path.resolve(__dirname, "..", "episodes");
const rendererDirectory = path.resolve(__dirname, "..", "dist");

let mainWindow;
let cleanupIpc;
let searchManager;
let downloadManager;

app.enableSandbox();
registerAppScheme(protocol);

function createApplicationWindow() {
  const window = createMainWindow({ appIsPackaged: app.isPackaged });
  const senderId = window.webContents.id;
  mainWindow = window;
  window.on("closed", () => {
    searchManager?.cancel();
    // `webContents` is already destroyed when the `closed` event fires.
    downloadManager?.dispose(senderId);
    if (mainWindow === window) mainWindow = null;
  });
  return window;
}

app.whenReady().then(() => {
  registerAppProtocol(protocol, net, rendererDirectory);
  searchManager = new SearchManager();
  const outputDirectoryStore = new OutputDirectoryStore({ userDataDirectory: app.getPath("userData") });
  downloadManager = new DownloadManager({
    outputDirectory: outputDirectoryStore.load(defaultOutputDirectory),
  });
  cleanupIpc = registerIpcHandlers({
    dialog,
    downloadManager,
    getMainWindow: () => mainWindow,
    ipcMain,
    outputDirectoryStore,
    searchManager,
    devServerUrl: process.env.VITE_DEV_SERVER_URL,
  });

  createApplicationWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createApplicationWindow();
  });
}).catch((error) => {
  console.error(error);
  app.quit();
});

app.on("before-quit", () => {
  cleanupIpc?.();
  searchManager?.dispose();
  downloadManager?.dispose();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
