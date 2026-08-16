const assert = require("node:assert/strict");
const test = require("node:test");
const path = require("node:path");

const { resolveBundlePath } = require("../electron/app-protocol.cjs");
const { isTrustedSender } = require("../electron/ipc/validate-sender.cjs");
const {
  requirePayloadObject,
  requirePodcastId,
  registerIpcHandlers,
} = require("../electron/ipc/register-handlers.cjs");

test("resolveBundlePath autorise uniquement les fichiers du bundle", () => {
  const root = path.resolve("dist");
  assert.equal(resolveBundlePath(root, "/index.html"), path.join(root, "index.html"));
  assert.throws(() => resolveBundlePath(root, "/../package.json"), /invalide/);
  assert.throws(() => resolveBundlePath(root, "/%2e%2e/package.json"), /invalide/);
});

test("isTrustedSender refuse une origine ou une frame secondaire inconnue", () => {
  const top = { url: "app://bundle/index.html" };
  top.top = top;
  assert.equal(isTrustedSender(top, undefined), true);
  assert.equal(isTrustedSender({ url: "https://example.com", top: undefined }, undefined), false);
  assert.equal(isTrustedSender({ url: "app://bundle/index.html", top }, undefined), false);
  assert.equal(isTrustedSender({ url: "http://127.0.0.1:5173/app", top: undefined }, "http://127.0.0.1:5173"), true);
});

test("les payloads IPC sont strictement validés", () => {
  assert.deepEqual(requirePayloadObject({ podcastId: "123" }), { podcastId: "123" });
  assert.equal(requirePodcastId({ podcastId: " 123 " }), " 123 ");
  assert.throws(() => requirePayloadObject(null), /Payload IPC/);
  assert.throws(() => requirePodcastId({ podcastId: "abc" }), /podcast doit être sélectionné/);
});

test("registerIpcHandlers valide l’expéditeur et supprime ses handlers", async () => {
  const handlers = new Map();
  const ipcMain = {
    handle: (channel, handler) => handlers.set(channel, handler),
    removeHandler: (channel) => handlers.delete(channel),
  };
  const searchManager = { searchPodcasts: async () => [], cancel: () => true, dispose: () => {} };
  const downloadManager = {
    getOutputDirectory: () => path.resolve("episodes"),
    setOutputDirectory: (value) => value,
    start: async (options) => { options.emitStatus({ status: "completed" }); return { status: "completed" }; },
    cancel: () => true,
    dispose: () => {},
  };
  const messages = [];
  const sender = { id: 7, isDestroyed: () => false, send: (channel, payload) => messages.push({ channel, payload }) };
  const event = { sender, senderFrame: { url: "app://bundle/index.html" } };
  const cleanup = registerIpcHandlers({
    dialog: { showOpenDialog: async () => ({ canceled: true, filePaths: [] }) },
    downloadManager,
    getMainWindow: () => null,
    ipcMain,
    searchManager,
  });

  assert.equal(handlers.get("download:get-directory")(event), path.resolve("episodes"));
  await assert.rejects(Promise.resolve().then(() => handlers.get("download:get-directory")({ senderFrame: { url: "https://example.com" } })), /Origine IPC/);
  await assert.rejects(Promise.resolve().then(() => handlers.get("download:start")(event, {})), /podcast doit être sélectionné/);
  await handlers.get("download:start")(event, { podcastId: "123" });
  assert.equal(messages.some(({ channel }) => channel === "download:progress"), false);
  downloadManager.start = async (options) => {
    options.emitProgress({ total: 2, downloaded: 1, failed: 0, percent: 50 });
    return { status: "completed" };
  };
  await handlers.get("download:start")(event, { podcastId: "123" });
  assert.deepEqual(messages.find(({ channel }) => channel === "download:progress"), {
    channel: "download:progress",
    payload: { total: 2, downloaded: 1, failed: 0, percent: 50 },
  });
  cleanup();
  assert.equal(handlers.size, 0);
});
