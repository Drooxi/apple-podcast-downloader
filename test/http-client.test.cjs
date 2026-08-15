const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const test = require("node:test");

const { DEFAULT_MAX_REDIRECTS, requestText } = require("../core/http-client.cjs");
const { OperationCancelledError } = require("../core/errors.cjs");

test("requestText limite les redirections et respecte l’annulation", async () => {
  assert.equal(DEFAULT_MAX_REDIRECTS, 5);
  const requestGet = (_url, _options, callback) => {
    const response = new EventEmitter();
    response.statusCode = 302;
    response.headers = { location: "https://example.com/next" };
    response.resume = () => {};
    queueMicrotask(() => callback(response));
    return new EventEmitter();
  };
  await assert.rejects(
    () => requestText("https://example.com", { requestGet, maxRedirects: 0 }),
    /Trop de redirections/,
  );

  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    () => requestText("https://example.com", { signal: controller.signal }),
    OperationCancelledError,
  );
});
