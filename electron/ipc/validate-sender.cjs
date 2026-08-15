const { APP_HOST, APP_SCHEME } = require("../app-protocol.cjs");

function isTrustedSender(frame, devServerUrl) {
  if (!frame || (frame.top && frame.top !== frame)) {
    return false;
  }

  try {
    const senderUrl = new URL(frame.url);
    if (devServerUrl) {
      return senderUrl.origin === new URL(devServerUrl).origin;
    }
    return senderUrl.protocol === `${APP_SCHEME}:` && senderUrl.host === APP_HOST;
  } catch {
    return false;
  }
}

function assertTrustedSender(event, devServerUrl) {
  if (!isTrustedSender(event?.senderFrame, devServerUrl)) {
    throw new Error("Origine IPC non autorisée.");
  }
}

module.exports = {
  assertTrustedSender,
  isTrustedSender,
};
