const fs = require("node:fs");
const https = require("node:https");

const { OperationCancelledError, throwIfAborted } = require("./errors.cjs");

const DEFAULT_MAX_REDIRECTS = 5;

function removeFile(filePath) {
  try {
    fs.rmSync(filePath, { force: true });
  } catch {
    // The file may still be closing on some platforms.
  }
}

function requestText(
  url,
  {
    signal,
    createAbortError = () => new OperationCancelledError(),
    maxRedirects = DEFAULT_MAX_REDIRECTS,
    requestGet = https.get,
  } = {},
) {
  try {
    throwIfAborted(signal);
  } catch (error) {
    return Promise.reject(error);
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    const request = (targetUrl, redirectsRemaining) => {
      try {
        throwIfAborted(signal);
      } catch (error) {
        fail(createAbortError(error));
        return;
      }

      const requestHandle = requestGet(targetUrl, { signal }, (response) => {
        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          response.resume();
          if (redirectsRemaining <= 0) {
            fail(new Error("Trop de redirections HTTP."));
            return;
          }
          request(
            new URL(response.headers.location, targetUrl).toString(),
            redirectsRemaining - 1,
          );
          return;
        }

        if (response.statusCode < 200 || response.statusCode >= 300) {
          response.resume();
          fail(new Error(`La requête a échoué avec le statut ${response.statusCode}.`));
          return;
        }

        let data = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => {
          if (!settled) {
            settled = true;
            resolve(data);
          }
        });
        response.on("error", (error) => {
          fail(signal?.aborted ? createAbortError(error) : error);
        });
      });

      requestHandle.on("error", (error) => {
        fail(signal?.aborted ? createAbortError(error) : error);
      });
    };

    request(url, maxRedirects);
  });
}

function downloadFile(
  url,
  destination,
  {
    signal,
    createAbortError = () => new OperationCancelledError(),
    maxRedirects = DEFAULT_MAX_REDIRECTS,
    requestGet = https.get,
  } = {},
) {
  try {
    throwIfAborted(signal);
  } catch (error) {
    return Promise.reject(error);
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    let requestHandle;
    let file;

    const fail = (error) => {
      if (settled) return;
      settled = true;
      file?.destroy();
      requestHandle?.destroy();
      removeFile(destination);
      reject(error);
    };

    const request = (targetUrl, redirectsRemaining) => {
      try {
        throwIfAborted(signal);
      } catch (error) {
        fail(createAbortError(error));
        return;
      }

      requestHandle = requestGet(targetUrl, { signal }, (response) => {
        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          response.resume();
          if (redirectsRemaining <= 0) {
            fail(new Error("Trop de redirections HTTP."));
            return;
          }
          request(
            new URL(response.headers.location, targetUrl).toString(),
            redirectsRemaining - 1,
          );
          return;
        }

        if (response.statusCode < 200 || response.statusCode >= 300) {
          response.resume();
          fail(new Error(`Le téléchargement a échoué avec le statut ${response.statusCode}.`));
          return;
        }

        file = fs.createWriteStream(destination);
        response.on("error", (error) => {
          fail(signal?.aborted ? createAbortError(error) : error);
        });
        file.on("error", fail);
        file.on("finish", () => {
          file.close(() => {
            if (!settled) {
              settled = true;
              resolve();
            }
          });
        });
        response.pipe(file);
      });

      requestHandle.on("error", (error) => {
        fail(signal?.aborted ? createAbortError(error) : error);
      });
    };

    request(url, maxRedirects);
  });
}

module.exports = {
  DEFAULT_MAX_REDIRECTS,
  downloadFile,
  removeFile,
  requestText,
};
