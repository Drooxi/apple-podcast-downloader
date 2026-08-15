const path = require("node:path");

const { BrowserWindow } = require("electron");
const { APP_HOST, APP_SCHEME } = require("./app-protocol.cjs");

function isAllowedRendererUrl(url, devServerUrl) {
  try {
    const target = new URL(url);
    if (devServerUrl) {
      return target.origin === new URL(devServerUrl).origin;
    }
    return target.protocol === `${APP_SCHEME}:` && target.host === APP_HOST;
  } catch {
    return false;
  }
}

function configureWindowSecurity(window, devServerUrl) {
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    if (!isAllowedRendererUrl(url, devServerUrl)) {
      event.preventDefault();
    }
  });

  window.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => {
    callback(false);
  });
  window.webContents.session.setPermissionCheckHandler(() => false);
}

function createMainWindow({
  BrowserWindowClass = BrowserWindow,
  devServerUrl = process.env.VITE_DEV_SERVER_URL,
  appIsPackaged = false,
} = {}) {
  const window = new BrowserWindowClass({
    width: 1180,
    height: 900,
    minWidth: 860,
    minHeight: 760,
    autoHideMenuBar: true,
    title: "Apple Podcast Downloader",
    backgroundColor: "#120b1d",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: !appIsPackaged,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  window.setMenuBarVisibility(false);
  configureWindowSecurity(window, devServerUrl);

  if (devServerUrl) {
    window.loadURL(devServerUrl);
  } else {
    window.loadURL(`${APP_SCHEME}://${APP_HOST}/index.html`);
  }

  return window;
}

module.exports = {
  configureWindowSecurity,
  createMainWindow,
  isAllowedRendererUrl,
};
