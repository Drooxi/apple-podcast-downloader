const assert = require("node:assert/strict");
const test = require("node:test");
const {
    DownloadCancelledError,
    runDownload,
    sanitizeFilename,
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
