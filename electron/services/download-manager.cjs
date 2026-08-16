const path = require("node:path");

const {
  DownloadCancelledError,
  isCancellationError,
} = require("../../core/errors.cjs");
const { runDownload, validatePodcastId } = require("../../core/podcast-downloader.cjs");

function validateOutputDirectory(outputDirectory) {
  if (typeof outputDirectory !== "string" || !path.isAbsolute(outputDirectory)) {
    throw new Error("Le dossier de destination est invalide.");
  }
  return outputDirectory;
}

class DownloadManager {
  constructor({ outputDirectory, downloader = runDownload } = {}) {
    this.outputDirectory = validateOutputDirectory(outputDirectory);
    this.downloader = downloader;
    this.active = null;
  }

  getOutputDirectory() {
    return this.outputDirectory;
  }

  setOutputDirectory(outputDirectory) {
    this.outputDirectory = validateOutputDirectory(outputDirectory);
    return this.outputDirectory;
  }

  async start({ podcastId, senderId, emitLog, emitProgress = () => {}, emitStatus }) {
    if (this.active) throw new Error("Un téléchargement est déjà en cours.");

    const normalizedPodcastId = validatePodcastId(podcastId);
    const controller = new AbortController();
    this.active = { controller, senderId };
    emitStatus({ status: "running" });

    try {
      const result = await this.downloader({
        outputDir: this.outputDirectory,
        podcastId: normalizedPodcastId,
        signal: controller.signal,
        onLog: emitLog,
        onProgress: emitProgress,
      });
      const outcome = result.failed > 0
        ? { status: "failed", message: `${result.failed} épisode(s) n’ont pas pu être téléchargés.`, result }
        : { status: "completed", result };
      emitStatus(outcome);
      return outcome;
    } catch (error) {
      const outcome = error instanceof DownloadCancelledError || isCancellationError(error, controller.signal)
        ? { status: "cancelled", message: "Le téléchargement a été annulé." }
        : { status: "failed", message: error.message || "Une erreur inattendue est survenue." };
      emitStatus(outcome);
      return outcome;
    } finally {
      if (this.active?.controller === controller) this.active = null;
    }
  }

  cancel(senderId) {
    if (!this.active || (senderId && this.active.senderId !== senderId)) return false;
    this.active.controller.abort();
    return true;
  }

  dispose(senderId) {
    this.cancel(senderId);
  }
}

module.exports = { DownloadManager, validateOutputDirectory };
