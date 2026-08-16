const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { OutputDirectoryStore } = require("../electron/services/output-directory-store.cjs");

function createFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "podcast-directory-store-"));
  const fallback = path.join(root, "episodes");
  const selected = path.join(root, "selected");
  const userData = path.join(root, "user-data");
  fs.mkdirSync(fallback);
  fs.mkdirSync(selected);
  return { fallback, root, selected, userData };
}

test("OutputDirectoryStore utilise le fallback si la configuration est absente", () => {
  const fixture = createFixture();
  try {
    const store = new OutputDirectoryStore({ userDataDirectory: fixture.userData });
    assert.equal(store.load(fixture.fallback), fixture.fallback);
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("OutputDirectoryStore sauvegarde et recharge un dossier valide", () => {
  const fixture = createFixture();
  try {
    const store = new OutputDirectoryStore({ userDataDirectory: fixture.userData });
    assert.equal(store.save(fixture.selected), fixture.selected);
    assert.equal(store.load(fixture.fallback), fixture.selected);
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(fixture.userData, "output-directory.json"), "utf8")), {
      outputDirectory: fixture.selected,
    });
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("OutputDirectoryStore revient au fallback pour un chemin relatif, corrompu ou supprimé", () => {
  const fixture = createFixture();
  const store = new OutputDirectoryStore({ userDataDirectory: fixture.userData });
  try {
    fs.mkdirSync(fixture.userData, { recursive: true });
    const settingsPath = path.join(fixture.userData, "output-directory.json");
    fs.writeFileSync(settingsPath, JSON.stringify({ outputDirectory: "relative/path" }));
    assert.equal(store.load(fixture.fallback), fixture.fallback);
    fs.writeFileSync(settingsPath, "not json");
    assert.equal(store.load(fixture.fallback), fixture.fallback);
    fs.writeFileSync(settingsPath, JSON.stringify({ outputDirectory: path.join(fixture.root, "removed") }));
    assert.equal(store.load(fixture.fallback), fixture.fallback);
    assert.throws(() => store.save(path.join(fixture.root, "missing")), /invalide ou inaccessible/);
    const filePath = path.join(fixture.root, "file.txt");
    fs.writeFileSync(filePath, "not a directory");
    assert.throws(() => store.save(filePath), /invalide ou inaccessible/);
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test("OutputDirectoryStore conserve l’ancien fichier si l’écriture échoue", () => {
  const fixture = createFixture();
  let failWrites = false;
  const fileSystem = {
    ...fs,
    writeFileSync: (...args) => {
      if (failWrites) throw new Error("écriture impossible");
      return fs.writeFileSync(...args);
    },
  };
  try {
    const store = new OutputDirectoryStore({ userDataDirectory: fixture.userData, fileSystem });
    store.save(fixture.selected);
    const filePath = path.join(fixture.userData, "output-directory.json");
    failWrites = true;
    assert.throws(() => store.save(fixture.fallback), /dossier n’a pas pu être mémorisé/);
    assert.equal(store.load(fixture.fallback), fixture.selected);
    assert.equal(fs.existsSync(filePath), true);
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});
