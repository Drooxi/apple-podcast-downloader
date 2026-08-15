const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const {
  runDownload,
  DownloadCancelledError,
  validatePodcastId,
} = require("../rss-extract.js");
const {
  searchPodcasts,
  PodcastSearchCancelledError,
} = require("../podcast-search.js");

let mainWindow;
let activeDownload = null;
let activeSearchController = null;

const defaultOutputDirectory = path.resolve(__dirname, "..", "episodes");

function sendToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 900,
    minWidth: 860,
    minHeight: 760,
    autoHideMenuBar: true,
    title: "Apple Podcast Downloader",
    backgroundColor: "#120b1d",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  mainWindow.setMenuBarVisibility(false);

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function registerIpcHandlers() {
  ipcMain.handle("podcast:search", async (_event, { term } = {}) => {
    if (activeSearchController) {
      activeSearchController.abort();
    }

    const normalizedTerm = String(term || "").trim();
    if (normalizedTerm.length < 3) {
      activeSearchController = null;
      return [];
    }

    const controller = new AbortController();
    activeSearchController = controller;

    try {
      return await searchPodcasts(normalizedTerm, {
        country: "fr",
        lang: "fr_fr",
        limit: 8,
        signal: controller.signal,
      });
    } catch (error) {
      if (error instanceof PodcastSearchCancelledError || controller.signal.aborted) {
        return [];
      }
      throw error;
    } finally {
      if (activeSearchController === controller) {
        activeSearchController = null;
      }
    }
  });

  ipcMain.handle("download:default-directory", () => defaultOutputDirectory);

  ipcMain.handle("download:select-directory", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Choisir le dossier de destination",
      defaultPath: defaultOutputDirectory,
      properties: ["openDirectory", "createDirectory"],
    });

    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle("download:start", async (event, { outputDirectory, podcastId } = {}) => {
    if (activeDownload) {
      throw new Error("Un téléchargement est déjà en cours.");
    }

    const normalizedPodcastId = validatePodcastId(podcastId);

    const controller = new AbortController();
    activeDownload = { controller, sender: event.sender };
    sendToRenderer("download:status", { status: "running" });

    try {
      const result = await runDownload({
        outputDir: outputDirectory || defaultOutputDirectory,
        podcastId: normalizedPodcastId,
        signal: controller.signal,
        onLog: (message, level = "info") => {
          if (!event.sender.isDestroyed()) {
            event.sender.send("download:log", { message, level });
          }
        },
      });

      if (result.failed > 0) {
        sendToRenderer("download:status", {
          status: "failed",
          message: `${result.failed} épisode(s) n’ont pas pu être téléchargés.`,
          result,
        });
      } else {
        sendToRenderer("download:status", { status: "completed", result });
      }

      return result;
    } catch (error) {
      if (error instanceof DownloadCancelledError || controller.signal.aborted) {
        sendToRenderer("download:status", {
          status: "cancelled",
          message: "Le téléchargement a été annulé.",
        });
        return { cancelled: true };
      }

      sendToRenderer("download:status", {
        status: "failed",
        message: error.message || "Une erreur inattendue est survenue.",
      });
      throw error;
    } finally {
      activeDownload = null;
    }
  });

  ipcMain.handle("download:cancel", () => {
    if (!activeDownload) {
      return false;
    }

    activeDownload.controller.abort();
    return true;
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", () => {
  if (activeSearchController) {
    activeSearchController.abort();
  }
  if (activeDownload) {
    activeDownload.controller.abort();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
