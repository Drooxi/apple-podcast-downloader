const assert = require("node:assert/strict");
const test = require("node:test");
const os = require("node:os");
const fs = require("node:fs");
const path = require("node:path");
const {
    DownloadCancelledError,
    runDownload,
    sanitizeFilename,
    validatePodcastId,
} = require("../rss-extract.js");

test("sanitizeFilename removes characters invalides sous Windows", () => {
    assert.equal(
        sanitizeFilename('Épisode: l\'été / 2026?'),
        "Épisode_ l'été _ 2026_",
    );
});

test("runDownload respecte un signal déjà annulé", async () => {
    const controller = new AbortController();
    controller.abort();

    await assert.rejects(
        () => runDownload({ signal: controller.signal }),
        DownloadCancelledError,
    );
});

test("validatePodcastId refuse un identifiant absent", () => {
    assert.throws(
        () => validatePodcastId(""),
        /Un podcast doit être sélectionné/,
    );
    assert.equal(validatePodcastId(" 1463322273 "), "1463322273");
});

test("runDownload émet la progression par épisode téléchargé", async () => {
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "podcast-progress-"));
    const progress = [];
    const xml = `<rss><channel><item><title>Un</title><enclosure url="https://audio.test/un.mp3" /></item><item><title>Deux</title></item></channel></rss>`;

    try {
        const result = await runDownload({
            outputDir,
            podcastId: "123",
            requestTextImpl: async (url) => url.includes("itunes.apple.com")
                ? JSON.stringify({ results: [{ feedUrl: "https://feed.test/rss.xml" }] })
                : xml,
            downloadFileImpl: async () => {},
            onLog: () => {},
            onProgress: (value) => progress.push(value),
        });

        assert.deepEqual(result, { total: 2, downloaded: 1, failed: 1 });
        assert.deepEqual(progress, [
            { total: 2, downloaded: 0, failed: 0, percent: 0 },
            { total: 2, downloaded: 1, failed: 0, percent: 50 },
            { total: 2, downloaded: 1, failed: 1, percent: 50 },
        ]);
    } finally {
        fs.rmSync(outputDir, { recursive: true, force: true });
    }
});

test("runDownload signale une progression nulle pour un flux vide", async () => {
    const progress = [];
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "podcast-empty-"));
    try {
        await runDownload({
            outputDir,
            podcastId: "123",
            requestTextImpl: async (url) => url.includes("itunes.apple.com")
                ? JSON.stringify({ results: [{ feedUrl: "https://feed.test/rss.xml" }] })
                : "<rss><channel></channel></rss>",
            onLog: () => {},
            onProgress: (value) => progress.push(value),
        });
        assert.deepEqual(progress, [{ total: 0, downloaded: 0, failed: 0, percent: 0 }]);
    } finally {
        fs.rmSync(outputDir, { recursive: true, force: true });
    }
});
