const fs = require("node:fs");
const path = require("node:path");
const { pathToFileURL } = require("node:url");

const APP_SCHEME = "app";
const APP_HOST = "bundle";

function registerAppScheme(protocolModule) {
  protocolModule.registerSchemesAsPrivileged([
    {
      scheme: APP_SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        codeCache: true,
      },
    },
  ]);
}

function resolveBundlePath(bundleRoot, pathname) {
  const decodedPath = decodeURIComponent(pathname || "/");
  const relativePath = decodedPath.replace(/^[/\\]+/, "") || "index.html";
  const candidate = path.resolve(bundleRoot, relativePath);
  const relative = path.relative(bundleRoot, candidate);

  if (
    !relative ||
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    relative.includes("\0")
  ) {
    throw new Error("Chemin de ressource invalide.");
  }

  return candidate;
}

function registerAppProtocol(protocolModule, netModule, bundleRoot) {
  protocolModule.handle(APP_SCHEME, async (request) => {
    const requestUrl = new URL(request.url);

    if (requestUrl.host !== APP_HOST) {
      return new Response("Not found", { status: 404 });
    }

    try {
      const filePath = resolveBundlePath(bundleRoot, requestUrl.pathname);
      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        return new Response("Not found", { status: 404 });
      }
      return netModule.fetch(pathToFileURL(filePath).toString());
    } catch {
      return new Response("Bad request", { status: 400 });
    }
  });
}

module.exports = {
  APP_HOST,
  APP_SCHEME,
  registerAppProtocol,
  registerAppScheme,
  resolveBundlePath,
};
