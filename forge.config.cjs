const path = require("path");

const hasWindowsSigning = Boolean(
  process.env.WINDOWS_CERTIFICATE_FILE && process.env.WINDOWS_CERTIFICATE_PASSWORD,
);

const hasMacSigning = Boolean(
  process.env.APPLE_ID &&
    process.env.APPLE_APP_SPECIFIC_PASSWORD &&
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_DEVELOPER_IDENTITY,
);

module.exports = {
  packagerConfig: {
    asar: true,
    name: "Apple Podcast Downloader",
    executableName: "apple-podcast-downloader",
    icon: path.resolve(__dirname, "assets", "icons", "icon"),
    ...(hasMacSigning
      ? {
          osxSign: {
            identity: process.env.APPLE_DEVELOPER_IDENTITY,
            optionsForFile: () => ({ hardenedRuntime: true }),
          },
          osxNotarize: {
            appleId: process.env.APPLE_ID,
            appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
            teamId: process.env.APPLE_TEAM_ID,
          },
        }
      : {}),
  },
  makers: [
    {
      name: "@electron-forge/maker-squirrel",
      config: {
        name: "apple_podcast_downloader",
        setupExe: "ApplePodcastDownloaderSetup.exe",
        setupIcon: path.resolve(__dirname, "assets", "icons", "icon.ico"),
        ...(hasWindowsSigning
          ? {
              certificateFile: process.env.WINDOWS_CERTIFICATE_FILE,
              certificatePassword: process.env.WINDOWS_CERTIFICATE_PASSWORD,
            }
          : {}),
      },
    },
    {
      name: "@electron-forge/maker-dmg",
      config: {
        name: "Apple Podcast Downloader",
        icon: path.resolve(__dirname, "assets", "icons", "icon.icns"),
        overwrite: true,
      },
    },
    {
      name: "@electron-forge/maker-zip",
      platforms: ["darwin"],
    },
  ],
};
