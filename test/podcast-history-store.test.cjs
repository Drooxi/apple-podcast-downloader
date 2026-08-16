const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { PodcastHistoryStore } = require("../electron/services/podcast-history-store.cjs");

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "podcast-history-"));
  return { root, userData: path.join(root, "user-data") };
}

function podcast(id, name = `Podcast ${id}`) {
  return { id, name, author: "Auteur", artworkUrl: "https://cdn.test/artwork.jpg" };
}

test("PodcastHistoryStore charge une liste vide si le fichier est absent ou corrompu", () => {
  const item = fixture();
  try {
    const store = new PodcastHistoryStore({ userDataDirectory: item.userData });
    assert.deepEqual(store.load(), []);
    fs.mkdirSync(item.userData, { recursive: true });
    fs.writeFileSync(path.join(item.userData, "podcast-history.json"), "not json");
    assert.deepEqual(store.load(), []);
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("PodcastHistoryStore déduplique et place la dernière entrée en tête", () => {
  const item = fixture();
  try {
    const store = new PodcastHistoryStore({ userDataDirectory: item.userData });
    store.record({ ...podcast("1"), downloadedAt: "2026-08-16T10:00:00.000Z" });
    store.record({ ...podcast("2"), downloadedAt: "2026-08-16T11:00:00.000Z" });
    const entries = store.record({ ...podcast("1", "Podcast 1 actualisé"), downloadedAt: "2026-08-16T12:00:00.000Z" });
    assert.deepEqual(entries.map(({ id }) => id), ["1", "2"]);
    assert.equal(entries[0].name, "Podcast 1 actualisé");
    assert.equal(store.load().length, 2);
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("PodcastHistoryStore ignore les entrées invalides", () => {
  const item = fixture();
  try {
    fs.mkdirSync(item.userData, { recursive: true });
    fs.writeFileSync(path.join(item.userData, "podcast-history.json"), JSON.stringify([
      podcast("1"),
      { id: "relative", name: "Invalide" },
      { ...podcast("1"), downloadedAt: "2026-08-16T09:00:00.000Z" },
    ]));
    const store = new PodcastHistoryStore({ userDataDirectory: item.userData });
    assert.deepEqual(store.load().map(({ id }) => id), ["1"]);
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("PodcastHistoryStore conserve le fichier existant si l’écriture échoue", () => {
  const item = fixture();
  let failWrites = false;
  const fileSystem = {
    ...fs,
    writeFileSync: (...args) => {
      if (failWrites) throw new Error("écriture impossible");
      return fs.writeFileSync(...args);
    },
  };
  try {
    const store = new PodcastHistoryStore({ userDataDirectory: item.userData, fileSystem });
    store.record(podcast("1"));
    failWrites = true;
    assert.throws(() => store.record(podcast("2")), /historique n’a pas pu être mémorisé/);
    assert.deepEqual(store.load().map(({ id }) => id), ["1"]);
  } finally {
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});
