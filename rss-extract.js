const https = require("https");
const { XMLParser } = require("fast-xml-parser");
const fs = require("fs");
const path = require("path");

const DEFAULT_PODCAST_ID = "1463322273";

class DownloadCancelledError extends Error {
    constructor() {
        super("Le téléchargement a été annulé.");
        this.name = "DownloadCancelledError";
    }
}

function sanitizeFilename(name) {
    return String(name)
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "_")
        .replace(/\s+/g, " ")
        .trim();
}

function throwIfAborted(signal) {
    if (signal?.aborted) {
        throw new DownloadCancelledError();
    }
}

function removeFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch {
        // Le fichier peut déjà être en cours de fermeture par le système.
    }
}

function get(url, signal) {
    throwIfAborted(signal);

    return new Promise((resolve, reject) => {
        let request;
        let settled = false;

        const fail = (error) => {
            if (settled) return;
            settled = true;
            reject(error);
        };

        const handle = (targetUrl) => {
            try {
                throwIfAborted(signal);
            } catch (error) {
                return fail(error);
            }

            request = https.get(targetUrl, { signal }, (response) => {
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    response.resume();
                    return handle(new URL(response.headers.location, targetUrl).toString());
                }

                if (response.statusCode < 200 || response.statusCode >= 300) {
                    response.resume();
                    return fail(new Error(`La requête a échoué avec le statut ${response.statusCode}.`));
                }

                let data = "";
                response.setEncoding("utf8");
                response.on("data", (chunk) => { data += chunk; });
                response.on("end", () => {
                    if (settled) return;
                    settled = true;
                    resolve(data);
                });
                response.on("error", fail);
            });

            request.on("error", (error) => {
                if (signal?.aborted) {
                    fail(new DownloadCancelledError());
                } else {
                    fail(error);
                }
            });
        };

        handle(url);
    });
}

function download(url, destination, signal) {
    throwIfAborted(signal);

    return new Promise((resolve, reject) => {
        let request;
        let file;
        let settled = false;

        const fail = (error) => {
            if (settled) return;
            settled = true;
            file?.destroy();
            request?.destroy();
            removeFile(destination);
            reject(error);
        };

        const handle = (targetUrl) => {
            try {
                throwIfAborted(signal);
            } catch (error) {
                return fail(error);
            }

            request = https.get(targetUrl, { signal }, (response) => {
                if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                    response.resume();
                    return handle(new URL(response.headers.location, targetUrl).toString());
                }

                if (response.statusCode < 200 || response.statusCode >= 300) {
                    response.resume();
                    return fail(new Error(`Le téléchargement a échoué avec le statut ${response.statusCode}.`));
                }

                file = fs.createWriteStream(destination);
                response.on("error", fail);
                file.on("error", fail);
                file.on("finish", () => {
                    file.close(() => {
                        if (!settled) {
                            settled = true;
                            resolve();
                        }
                    });
                });
                response.pipe(file);
            });

            request.on("error", (error) => {
                if (signal?.aborted) {
                    fail(new DownloadCancelledError());
                } else {
                    fail(error);
                }
            });
        };

        handle(url);
    });
}

async function runDownload({
    outputDir = path.resolve(process.cwd(), "episodes"),
    podcastId = DEFAULT_PODCAST_ID,
    onLog = (message, level = "info") => console[level === "error" ? "error" : "log"](message),
    signal,
} = {}) {
    const log = (message, level = "info") => onLog(message, level);
    throwIfAborted(signal);

    fs.mkdirSync(outputDir, { recursive: true });
    log("Recherche du flux RSS...");

    const lookup = JSON.parse(
        await get(`https://itunes.apple.com/lookup?id=${encodeURIComponent(podcastId)}`, signal),
    );

    if (!lookup.results?.length || !lookup.results[0].feedUrl) {
        throw new Error("Podcast introuvable.");
    }

    const feedUrl = lookup.results[0].feedUrl;
    log(`Flux : ${feedUrl}`);

    const xml = await get(feedUrl, signal);
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

    for (const episode of items) {
        throwIfAborted(signal);

        const title = String(episode.title || "Épisode sans titre");
        log(`Épisode : ${title}`);

        if (episode.link) log(`Apple : ${episode.link}`);

        if (!episode.enclosure?.url) {
            log("Aucun fichier audio trouvé pour cet épisode.", "error");
            failed += 1;
            continue;
        }

        const filename = `${sanitizeFilename(title) || "episode"}.mp3`;
        const filepath = path.join(outputDir, filename);
        log(`Téléchargement : ${filename}`);

        try {
            await download(episode.enclosure.url, filepath, signal);
            downloaded += 1;
            log("Téléchargement terminé.");
        } catch (error) {
            if (error instanceof DownloadCancelledError || signal?.aborted) {
                throw new DownloadCancelledError();
            }
            failed += 1;
            log(`Erreur : ${error.message}`, "error");
        }
    }

    log(`Fini — ${downloaded} épisode(s) téléchargé(s), ${failed} erreur(s).`);
    return { total: items.length, downloaded, failed };
}

if (require.main === module) {
    runDownload({
        outputDir: path.resolve(process.argv[2] || "episodes"),
    }).catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    });
}

module.exports = {
    DEFAULT_PODCAST_ID,
    DownloadCancelledError,
    runDownload,
    sanitizeFilename,
};
