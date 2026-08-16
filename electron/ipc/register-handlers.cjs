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

function sendToSender(sender, channel, payload) {
  if (!sender.isDestroyed()) sender.send(channel, payload);
}

function registerIpcHandlers({ dialog, downloadManager, getMainWindow, ipcMain, outputDirectoryStore, searchManager, devServerUrl }) {
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
      return downloadManager.start({
        podcastId: requirePodcastId(payload),
        senderId: sender.id,
        emitLog: (message, level = "info") => sendToSender(sender, CHANNELS.downloadLog, { message, level }),
        emitProgress: (progress) => sendToSender(sender, CHANNELS.downloadProgress, progress),
        emitStatus: (status) => sendToSender(sender, CHANNELS.downloadStatus, status),
      });
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

module.exports = { registerIpcHandlers, requirePayloadObject, requirePodcastId };
