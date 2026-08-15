const https = require("https");

const DEFAULT_SEARCH_OPTIONS = {
    country: "fr",
    entity: "podcast",
    lang: "fr_fr",
    limit: 8,
    media: "podcast",
};

class PodcastSearchCancelledError extends Error {
    constructor() {
        super("La recherche a été annulée.");
        this.name = "PodcastSearchCancelledError";
    }
}

function throwIfAborted(signal) {
    if (signal?.aborted) {
        throw new PodcastSearchCancelledError();
    }
}

function buildSearchUrl(term, options = {}) {
    const normalizedTerm = String(term || "").trim();
    if (!normalizedTerm) {
        throw new Error("Le terme de recherche est requis.");
    }

    const params = new URLSearchParams({
        ...DEFAULT_SEARCH_OPTIONS,
        ...options,
        term: normalizedTerm,
    });

    return `https://itunes.apple.com/search?${params.toString()}`;
}

function normalizePodcastResults(payload) {
    if (!Array.isArray(payload?.results)) {
        return [];
    }

    return payload.results
        .filter((result) => result?.collectionId && result?.collectionName)
        .map((result) => ({
            id: String(result.collectionId),
            name: String(result.collectionName),
            author: result.artistName ? String(result.artistName) : "Auteur inconnu",
            artworkUrl: result.artworkUrl100 || result.artworkUrl600 || null,
        }));
}

function getJson(url, signal) {
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
                    return fail(new Error(`La recherche a échoué avec le statut ${response.statusCode}.`));
                }

                let data = "";
                response.setEncoding("utf8");
                response.on("data", (chunk) => { data += chunk; });
                response.on("end", () => {
                    if (settled) return;
                    try {
                        const payload = JSON.parse(data);
                        settled = true;
                        resolve(payload);
                    } catch {
                        fail(new Error("La réponse de recherche Apple est invalide."));
                    }
                });
                response.on("error", fail);
            });

            request.on("error", (error) => {
                if (signal?.aborted) {
                    fail(new PodcastSearchCancelledError());
                } else {
                    fail(error);
                }
            });
        };

        handle(url);
    });
}

async function searchPodcasts(term, { signal, ...options } = {}) {
    throwIfAborted(signal);
    const payload = await getJson(buildSearchUrl(term, options), signal);
    return normalizePodcastResults(payload);
}

module.exports = {
    DEFAULT_SEARCH_OPTIONS,
    PodcastSearchCancelledError,
    buildSearchUrl,
    normalizePodcastResults,
    searchPodcasts,
};
