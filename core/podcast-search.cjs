const { requestText } = require("./http-client.cjs");
const {
  PodcastSearchCancelledError,
  throwIfAborted,
} = require("./errors.cjs");

const DEFAULT_SEARCH_OPTIONS = {
  country: "fr",
  entity: "podcast",
  lang: "fr_fr",
  limit: 8,
  media: "podcast",
};

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

async function searchPodcasts(term, { signal, ...options } = {}) {
  throwIfAborted(signal, PodcastSearchCancelledError);

  let payload;
  try {
    const data = await requestText(buildSearchUrl(term, options), {
      signal,
      createAbortError: () => new PodcastSearchCancelledError(),
    });
    payload = JSON.parse(data);
  } catch (error) {
    if (signal?.aborted) {
      throw new PodcastSearchCancelledError();
    }
    if (error instanceof SyntaxError) {
      throw new Error("La réponse de recherche Apple est invalide.");
    }
    throw error;
  }

  return normalizePodcastResults(payload);
}

module.exports = {
  DEFAULT_SEARCH_OPTIONS,
  PodcastSearchCancelledError,
  buildSearchUrl,
  normalizePodcastResults,
  searchPodcasts,
};
