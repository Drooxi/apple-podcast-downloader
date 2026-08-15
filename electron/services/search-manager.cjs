const { searchPodcasts } = require("../../core/podcast-search.cjs");
const { PodcastSearchCancelledError } = require("../../core/errors.cjs");

class SearchManager {
  constructor({ search = searchPodcasts, minimumLength = 3 } = {}) {
    this.search = search;
    this.minimumLength = minimumLength;
    this.activeController = null;
  }

  async searchPodcasts(term) {
    this.cancel();
    const normalizedTerm = String(term || "").trim();
    if (normalizedTerm.length < this.minimumLength) return [];

    const controller = new AbortController();
    this.activeController = controller;

    try {
      return await this.search(normalizedTerm, { signal: controller.signal });
    } catch (error) {
      if (error instanceof PodcastSearchCancelledError || controller.signal.aborted) return [];
      throw error;
    } finally {
      if (this.activeController === controller) this.activeController = null;
    }
  }

  cancel() {
    if (!this.activeController) return false;
    this.activeController.abort();
    this.activeController = null;
    return true;
  }

  dispose() {
    this.cancel();
  }
}

module.exports = { SearchManager };
