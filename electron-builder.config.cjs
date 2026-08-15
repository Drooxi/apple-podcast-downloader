const path = require("node:path");

const hasMacNotarization = Boolean(
  process.env.CSC_LINK &&
    process.env.CSC_KEY_PASSWORD &&
    process.env.APPLE_ID &&
    process.env.APPLE_APP_SPECIFIC_PASSWORD &&
    process.env.APPLE_TEAM_ID,
);
const hasMacCertificate = Boolean(
  process.env.CSC_LINK && process.env.CSC_KEY_PASSWORD,
);

module.exports = {
  appId: "com.drooxi.apple-podcast-downloader",
  productName: "Apple Podcast Downloader",
  directories: {
    output: "out/make",
    buildResources: "assets/icons",
  },
  asar: true,
  files: [
    "**/*",
    "!docs{,/**/*}",
    "!test{,/**/*}",
    "!src{,/**/*}",
    "!scripts{,/**/*}",
    "!out{,/**/*}",
    "!electron-builder.config.cjs",
    "!mise.toml",
    "!renovate.json",
    "!README.md",
    "!AGENTS.md",
  ],
  win: {
    icon: path.resolve(__dirname, "assets", "icons", "icon.ico"),
    target: [
      {
        target: "portable",
        arch: ["x64"],
      },
    ],
    artifactName: "ApplePodcastDownloader-${version}-win-${arch}.${ext}",
  },
  mac: {
    icon: path.resolve(__dirname, "assets", "icons", "icon.icns"),
    category: "public.app-category.utilities",
    hardenedRuntime: true,
    entitlements: path.resolve(__dirname, "assets", "entitlements.mac.plist"),
    entitlementsInherit: path.resolve(
      __dirname,
      "assets",
      "entitlements.mac.inherit.plist",
    ),
    identity: hasMacCertificate
      ? process.env.APPLE_DEVELOPER_IDENTITY || undefined
      : undefined,
    notarize: hasMacNotarization,
    target: [
      {
        target: "dmg",
        arch: ["x64", "arm64"],
      },
      {
        target: "zip",
        arch: ["x64", "arm64"],
      },
    ],
    artifactName: "ApplePodcastDownloader-${version}-mac-${arch}.${ext}",
  },
};
