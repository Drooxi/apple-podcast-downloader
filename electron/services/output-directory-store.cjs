const fs = require("node:fs");
const path = require("node:path");

const SETTINGS_FILE_NAME = "output-directory.json";

function isDirectory(directory, fileSystem = fs) {
  if (typeof directory !== "string" || !path.isAbsolute(directory)) return false;
  try {
    return fileSystem.statSync(directory).isDirectory();
  } catch {
    return false;
  }
}

class OutputDirectoryStore {
  constructor({ userDataDirectory, fileSystem = fs } = {}) {
    if (typeof userDataDirectory !== "string" || !path.isAbsolute(userDataDirectory)) {
      throw new Error("Le dossier de configuration utilisateur est invalide.");
    }
    this.fileSystem = fileSystem;
    this.filePath = path.join(userDataDirectory, SETTINGS_FILE_NAME);
  }

  load(fallbackDirectory) {
    if (typeof fallbackDirectory !== "string" || !path.isAbsolute(fallbackDirectory)) {
      throw new Error("Le dossier de fallback est invalide.");
    }

    try {
      const settings = JSON.parse(this.fileSystem.readFileSync(this.filePath, "utf8"));
      if (isDirectory(settings.outputDirectory, this.fileSystem)) return settings.outputDirectory;
    } catch {
      // Missing, malformed or unreadable settings use the safe fallback.
    }
    return fallbackDirectory;
  }

  save(directory) {
    if (!isDirectory(directory, this.fileSystem)) {
      throw new Error("Le dossier de destination est invalide ou inaccessible.");
    }

    const parentDirectory = path.dirname(this.filePath);
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    try {
      this.fileSystem.mkdirSync(parentDirectory, { recursive: true });
      this.fileSystem.writeFileSync(
        temporaryPath,
        JSON.stringify({ outputDirectory: directory }, null, 2),
        "utf8",
      );
      this.fileSystem.rmSync(this.filePath, { force: true });
      this.fileSystem.renameSync(temporaryPath, this.filePath);
    } catch (error) {
      try {
        this.fileSystem.rmSync(temporaryPath, { force: true });
      } catch {
        // Preserve the original persistence error.
      }
      throw new Error(`Le dossier n’a pas pu être mémorisé : ${error.message}`);
    }

    return directory;
  }
}

module.exports = { OutputDirectoryStore, SETTINGS_FILE_NAME, isDirectory };
