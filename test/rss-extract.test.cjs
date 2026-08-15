const assert = require("node:assert/strict");
const test = require("node:test");
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
