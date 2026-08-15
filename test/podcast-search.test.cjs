const assert = require("node:assert/strict");
const test = require("node:test");
const {
    PodcastSearchCancelledError,
    buildSearchUrl,
    normalizePodcastResults,
    searchPodcasts,
} = require("../podcast-search.js");

test("buildSearchUrl encode le terme et les paramètres Apple", () => {
    const url = new URL(buildSearchUrl("les podcasts"));

    assert.equal(url.origin, "https://itunes.apple.com");
    assert.equal(url.pathname, "/search");
    assert.equal(url.searchParams.get("term"), "les podcasts");
    assert.equal(url.searchParams.get("country"), "fr");
    assert.equal(url.searchParams.get("media"), "podcast");
    assert.equal(url.searchParams.get("entity"), "podcast");
    assert.equal(url.searchParams.get("limit"), "8");
    assert.equal(url.searchParams.get("lang"), "fr_fr");
});

test("normalizePodcastResults conserve les résultats valides uniquement", () => {
    assert.deepEqual(
        normalizePodcastResults({
            results: [
                {
                    collectionId: 123,
                    collectionName: "Le podcast",
                    artistName: "Une équipe",
                    artworkUrl100: "https://example.com/art.jpg",
                },
                { collectionName: "Sans identifiant" },
                { collectionId: 456 },
            ],
        }),
        [{
            id: "123",
            name: "Le podcast",
            author: "Une équipe",
            artworkUrl: "https://example.com/art.jpg",
        }],
    );
});

test("normalizePodcastResults utilise un fallback pour l’auteur et l’image", () => {
    assert.deepEqual(
        normalizePodcastResults({
            results: [{ collectionId: 789, collectionName: "Sans visuel" }],
        }),
        [{
            id: "789",
            name: "Sans visuel",
            author: "Auteur inconnu",
            artworkUrl: null,
        }],
    );
});

test("searchPodcasts respecte un signal déjà annulé", async () => {
    const controller = new AbortController();
    controller.abort();

    await assert.rejects(
        () => searchPodcasts("podcast", { signal: controller.signal }),
        PodcastSearchCancelledError,
    );
});
