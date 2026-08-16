const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function loadPreload() {
  const source = fs.readFileSync(path.resolve("electron/preload.cjs"), "utf8");
  const invocations = [];
  const listeners = new Map();
  const ipcRenderer = {
    invoke: (channel, payload) => { invocations.push({ channel, payload }); return Promise.resolve("ok"); },
    on: (channel, listener) => listeners.set(channel, listener),
    removeListener: (channel, listener) => { if (listeners.get(channel) === listener) listeners.delete(channel); },
  };
  let exposed;
  vm.runInNewContext(source, {
    require: () => ({ contextBridge: { exposeInMainWorld: (_name, api) => { exposed = api; } }, ipcRenderer }),
  });
  return { exposed, invocations, listeners };
}

test("le preload n’expose que des wrappers IPC filtrés", async () => {
  const { exposed, invocations, listeners } = loadPreload();
  await exposed.searchPodcasts("test");
  await exposed.startDownload({ podcastId: "123" });
  assert.equal(JSON.stringify(invocations), JSON.stringify([
    { channel: "podcast:search", payload: { term: "test" } },
    { channel: "download:start", payload: { podcastId: "123" } },
  ]));

  const callback = () => {};
  const dispose = exposed.onDownloadStatus(callback);
  assert.equal(listeners.has("download:status"), true);
  dispose();
  dispose();
  assert.equal(listeners.has("download:status"), false);
  const disposeProgress = exposed.onDownloadProgress(callback);
  assert.equal(listeners.has("download:progress"), true);
  disposeProgress();
  disposeProgress();
  assert.equal(listeners.has("download:progress"), false);
  assert.throws(() => exposed.onDownloadLog(null), /callback/);
});
