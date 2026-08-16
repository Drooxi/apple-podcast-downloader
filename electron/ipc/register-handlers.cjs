const CHANNELS = require("./channels.cjs");
const { assertTrustedSender } = require("./validate-sender.cjs");

function requirePayloadObject(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Payload IPC invalide.");
  return payload;
}

function requirePodcastId(payload) {
  const { podcastId } = requirePayloadObject(payload);
  if (typeof podcastId !== "string" || !/^\d+$/.test(podcastId.trim())) {
    throw new Error("Un podcast doit être sélectionné avant le téléchargement.");
  }
  return podcastId;
}

function requirePodcastMetadata(payload) {
  const { podcastId, podcast } = requirePayloadObject(payload);
  const normalizedId = requirePodcastId({ podcastId }).trim();
  if (!podcast || typeof podcast !== "object" || Array.isArray(podcast)) {
    throw new Error("Les métadonnées du podcast sont invalides.");
  }
  if (typeof podcast.id !== "string" || podcast.id.trim() !== normalizedId) {
    throw new Error("L’identifiant du podcast est incohérent.");
  }
  if (typeof podcast.name !== "string" || !podcast.name.trim()) {
    throw new Error("Le nom du podcast est invalide.");
  }
  if (typeof podcast.author !== "string" || !podcast.author.trim()) {
    throw new Error("L’auteur du podcast est invalide.");
  }
  if (podcast.artworkUrl !== null && (typeof podcast.artworkUrl !== "string" || !/^https:\/\//i.test(podcast.artworkUrl))) {
    throw new Error("L’illustration du podcast est invalide.");
  }
  return {
    id: normalizedId,
    name: podcast.name.trim(),
    author: podcast.author.trim(),
    artworkUrl: podcast.artworkUrl || null,
  };
}

function sendToSender(sender, channel, payload) {
  if (!sender.isDestroyed()) sender.send(channel, payload);
}

function registerIpcHandlers({ dialog, downloadManager, getMainWindow, historyStore, ipcMain, outputDirectoryStore, searchManager, devServerUrl }) {
  const handlers = [
    [CHANNELS.podcastSearch, async (event, payload = {}) => {
      assertTrustedSender(event, devServerUrl);
      const { term } = requirePayloadObject(payload);
      if (typeof term !== "string") throw new Error("Terme de recherche invalide.");
      return searchManager.searchPodcasts(term);
    }],
    [CHANNELS.podcastCancelSearch, (event) => {
      assertTrustedSender(event, devServerUrl);
      return searchManager.cancel();
    }],
    [CHANNELS.downloadGetDirectory, (event) => {
      assertTrustedSender(event, devServerUrl);
      return downloadManager.getOutputDirectory();
    }],
    [CHANNELS.historyList, (event) => {
      assertTrustedSender(event, devServerUrl);
      return historyStore?.load() || [];
    }],
    [CHANNELS.downloadSelectDirectory, async (event) => {
      assertTrustedSender(event, devServerUrl);
      const result = await dialog.showOpenDialog(getMainWindow(), {
        title: "Choisir le dossier de destination",
        defaultPath: downloadManager.getOutputDirectory(),
        properties: ["openDirectory", "createDirectory"],
      });
      if (result.canceled) return null;
      const selectedDirectory = result.filePaths[0];
      outputDirectoryStore?.save(selectedDirectory);
      return downloadManager.setOutputDirectory(selectedDirectory);
    }],
    [CHANNELS.downloadStart, async (event, payload = {}) => {
      assertTrustedSender(event, devServerUrl);
      const sender = event.sender;
      const podcast = requirePodcastMetadata(payload);
      let latestProgress;
      const outcome = await downloadManager.start({
        podcastId: podcast.id,
        senderId: sender.id,
        emitLog: (message, level = "info") => sendToSender(sender, CHANNELS.downloadLog, { message, level }),
        emitProgress: (progress) => {
          latestProgress = progress;
          sendToSender(sender, CHANNELS.downloadProgress, progress);
        },
        emitStatus: (status) => sendToSender(sender, CHANNELS.downloadStatus, status),
      });
      const downloaded = outcome.result?.downloaded || latestProgress?.downloaded || 0;
      if (downloaded > 0 && historyStore) {
        try {
          sendToSender(sender, CHANNELS.historyUpdated, historyStore.record(podcast));
        } catch (error) {
          sendToSender(sender, CHANNELS.downloadLog, { message: error.message, level: "error" });
        }
      }
      return outcome;
    }],
    [CHANNELS.downloadCancel, (event) => {
      assertTrustedSender(event, devServerUrl);
      return downloadManager.cancel(event.sender.id);
    }],
  ];

  for (const [channel, handler] of handlers) ipcMain.handle(channel, handler);

  return () => {
    for (const [channel] of handlers) ipcMain.removeHandler(channel);
    searchManager.dispose();
    downloadManager.dispose();
  };
}

module.exports = { registerIpcHandlers, requirePayloadObject, requirePodcastId, requirePodcastMetadata };
