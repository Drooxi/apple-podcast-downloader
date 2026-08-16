const fs = require("node:fs");
const path = require("node:path");

const HISTORY_FILE_NAME = "podcast-history.json";

function isValidHistoryEntry(entry) {
  return Boolean(
    entry &&
      typeof entry.id === "string" &&
      /^\d+$/.test(entry.id) &&
      typeof entry.name === "string" &&
      entry.name.trim() &&
      typeof entry.author === "string" &&
      entry.author.trim() &&
      (entry.artworkUrl === null || (typeof entry.artworkUrl === "string" && /^https:\/\//i.test(entry.artworkUrl))) &&
      typeof entry.downloadedAt === "string" &&
      !Number.isNaN(Date.parse(entry.downloadedAt)),
  );
}

function normalizeEntry(entry) {
  return {
    id: entry.id.trim(),
    name: entry.name.trim(),
    author: entry.author.trim(),
    artworkUrl: entry.artworkUrl || null,
    downloadedAt: new Date(entry.downloadedAt).toISOString(),
  };
}

function sortEntries(entries) {
  return [...entries].sort((left, right) => Date.parse(right.downloadedAt) - Date.parse(left.downloadedAt));
}

class PodcastHistoryStore {
  constructor({ userDataDirectory, fileSystem = fs } = {}) {
    if (typeof userDataDirectory !== "string" || !path.isAbsolute(userDataDirectory)) {
      throw new Error("Le dossier de configuration utilisateur est invalide.");
    }
    this.fileSystem = fileSystem;
    this.filePath = path.join(userDataDirectory, HISTORY_FILE_NAME);
  }

  load() {
    let entries;
    try {
      entries = JSON.parse(this.fileSystem.readFileSync(this.filePath, "utf8"));
    } catch {
      return [];
    }
    if (!Array.isArray(entries)) return [];

    const unique = new Map();
    for (const entry of entries) {
      if (!isValidHistoryEntry(entry)) continue;
      const normalized = normalizeEntry(entry);
      const existing = unique.get(normalized.id);
      if (!existing || Date.parse(normalized.downloadedAt) > Date.parse(existing.downloadedAt)) {
        unique.set(normalized.id, normalized);
      }
    }
    return sortEntries([...unique.values()]);
  }

  record(podcast, downloadedAt = new Date().toISOString()) {
    if (!podcast || typeof podcast !== "object") throw new Error("Podcast historique invalide.");
    const entry = normalizeEntry({ ...podcast, downloadedAt });
    if (!isValidHistoryEntry(entry)) throw new Error("Podcast historique invalide.");

    const entries = this.load().filter((current) => current.id !== entry.id);
    entries.unshift(entry);
    this.write(entries);
    return entries;
  }

  write(entries) {
    const parentDirectory = path.dirname(this.filePath);
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    try {
      this.fileSystem.mkdirSync(parentDirectory, { recursive: true });
      this.fileSystem.writeFileSync(temporaryPath, JSON.stringify(sortEntries(entries), null, 2), "utf8");
      this.fileSystem.rmSync(this.filePath, { force: true });
      this.fileSystem.renameSync(temporaryPath, this.filePath);
    } catch (error) {
      try {
        this.fileSystem.rmSync(temporaryPath, { force: true });
      } catch {
        // Preserve the original persistence error.
      }
      throw new Error(`L’historique n’a pas pu être mémorisé : ${error.message}`);
    }
  }
}

module.exports = { HISTORY_FILE_NAME, PodcastHistoryStore, isValidHistoryEntry };
