const assert = require("node:assert/strict");
const test = require("node:test");
const path = require("node:path");

const { DownloadCancelledError } = require("../core/errors.cjs");
const { DownloadManager } = require("../electron/services/download-manager.cjs");
const { SearchManager } = require("../electron/services/search-manager.cjs");

test("SearchManager annule la recherche précédente", async () => {
  const calls = [];
  const manager = new SearchManager({
    search: (_term, { signal }) => new Promise((resolve, reject) => {
      calls.push(signal);
      signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
      setTimeout(() => resolve(["result"]), 5);
    }),
  });

  const first = manager.searchPodcasts("première");
  const second = manager.searchPodcasts("seconde");
  assert.deepEqual(await first, []);
  assert.deepEqual(await second, ["result"]);
  assert.equal(calls[0].aborted, true);
});

test("DownloadManager conserve le dossier et publie l’annulation", async () => {
  let release;
  let optionsSeen;
  const statuses = [];
  const manager = new DownloadManager({
    outputDirectory: path.resolve("episodes"),
    downloader: async (options) => {
      optionsSeen = options;
      await new Promise((resolve) => { release = resolve; });
      if (options.signal.aborted) throw new DownloadCancelledError();
      return { total: 1, downloaded: 1, failed: 0 };
    },
  });

  const operation = manager.start({
    podcastId: "123",
    senderId: 9,
    emitLog: () => {},
    emitStatus: (status) => statuses.push(status),
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(manager.cancel(9), true);
  release();
  assert.deepEqual(await operation, { status: "cancelled", message: "Le téléchargement a été annulé." });
  assert.equal(optionsSeen.outputDir, path.resolve("episodes"));
  assert.equal("outputDirectory" in optionsSeen, false);
  assert.deepEqual(statuses.map((status) => status.status), ["running", "cancelled"]);
});
