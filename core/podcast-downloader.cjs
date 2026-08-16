const fs = require("node:fs");
const path = require("node:path");

const { XMLParser } = require("fast-xml-parser");
const { downloadFile, requestText } = require("./http-client.cjs");
const {
  DownloadCancelledError,
  isCancellationError,
  throwIfAborted,
} = require("./errors.cjs");

const DEFAULT_PODCAST_ID = "1463322273";

function sanitizeFilename(name) {
  return String(name)
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
}

function validatePodcastId(podcastId) {
  const normalizedId = String(podcastId ?? "").trim();
  if (!/^\d+$/.test(normalizedId)) {
    throw new Error("Un podcast doit être sélectionné avant le téléchargement.");
  }
  return normalizedId;
}

async function runDownload({
  outputDir = path.resolve(process.cwd(), "episodes"),
  podcastId = DEFAULT_PODCAST_ID,
  onLog = (message, level = "info") =>
    console[level === "error" ? "error" : "log"](message),
  onProgress = () => {},
  requestTextImpl = requestText,
  downloadFileImpl = downloadFile,
  signal,
} = {}) {
  const log = (message, level = "info") => onLog(message, level);
  const reportProgress = (total, downloaded, failed) => onProgress({
    total,
    downloaded,
    failed,
    percent: total > 0 ? Math.round((downloaded / total) * 100) : 0,
  });
  throwIfAborted(signal, DownloadCancelledError);
  const normalizedPodcastId = validatePodcastId(podcastId);

  fs.mkdirSync(outputDir, { recursive: true });
  log("Recherche du flux RSS...");

  let lookup;
  try {
    lookup = JSON.parse(
      await requestTextImpl(
        `https://itunes.apple.com/lookup?id=${encodeURIComponent(normalizedPodcastId)}`,
        {
          signal,
          createAbortError: () => new DownloadCancelledError(),
        },
      ),
    );
  } catch (error) {
    if (isCancellationError(error, signal)) {
      throw new DownloadCancelledError();
    }
    if (error instanceof SyntaxError) {
      throw new Error("La réponse Apple est invalide.");
    }
    throw error;
  }

  if (!lookup.results?.length || !lookup.results[0].feedUrl) {
    throw new Error("Podcast introuvable.");
  }

  const feedUrl = lookup.results[0].feedUrl;
  log(`Flux : ${feedUrl}`);

  let xml;
  try {
    xml = await requestTextImpl(feedUrl, {
      signal,
      createAbortError: () => new DownloadCancelledError(),
    });
  } catch (error) {
    if (isCancellationError(error, signal)) {
      throw new DownloadCancelledError();
    }
    throw error;
  }

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
  });
  const rss = parser.parse(xml);
  let items = rss?.rss?.channel?.item || [];
  if (!Array.isArray(items)) items = [items];

  log(`${items.length} épisode(s) trouvé(s).`);

  let downloaded = 0;
  let failed = 0;
  reportProgress(items.length, downloaded, failed);

  for (const episode of items) {
    throwIfAborted(signal, DownloadCancelledError);

    const title = String(episode.title || "Épisode sans titre");
    log(`Épisode : ${title}`);

    if (episode.link) log(`Apple : ${episode.link}`);

    if (!episode.enclosure?.url) {
      log("Aucun fichier audio trouvé pour cet épisode.", "error");
      failed += 1;
      reportProgress(items.length, downloaded, failed);
      continue;
    }

    const filename = `${sanitizeFilename(title) || "episode"}.mp3`;
    const filepath = path.join(outputDir, filename);
    log(`Téléchargement : ${filename}`);

    try {
      await downloadFileImpl(episode.enclosure.url, filepath, {
        signal,
        createAbortError: () => new DownloadCancelledError(),
      });
      downloaded += 1;
      log("Téléchargement terminé.");
      reportProgress(items.length, downloaded, failed);
    } catch (error) {
      if (isCancellationError(error, signal)) {
        throw new DownloadCancelledError();
      }
      failed += 1;
      log(`Erreur : ${error.message}`, "error");
      reportProgress(items.length, downloaded, failed);
    }
  }

  log(`Fini — ${downloaded} épisode(s) téléchargé(s), ${failed} erreur(s).`);
  return { total: items.length, downloaded, failed };
}

module.exports = {
  DEFAULT_PODCAST_ID,
  DownloadCancelledError,
  runDownload,
  sanitizeFilename,
  validatePodcastId,
};
