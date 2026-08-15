import { PodcastArtwork } from "./PodcastArtwork.jsx";

export function PodcastSearch({ disabled, search }) {
  const {
    changePodcast,
    handleSearchChange,
    searchError,
    searchResults,
    searchState,
    searchTerm,
    selectedPodcast,
    selectPodcast,
  } = search;

  return (
    <div className="podcast-search-section">
      <label className="field-label search-label" htmlFor="podcast-search">
        Rechercher un podcast
      </label>
      <div className="search-input-shell">
        <span className="search-icon" aria-hidden="true">⌕</span>
        <input
          id="podcast-search"
          type="search"
          value={searchTerm}
          placeholder="Nom du podcast…"
          autoComplete="off"
          disabled={disabled}
          onChange={handleSearchChange}
        />
        {searchState === "loading" && <span className="search-spinner" aria-label="Recherche en cours" />}
      </div>

      {!disabled && searchState === "hint" && <p className="search-message search-hint">Saisissez au moins 3 caractères.</p>}
      {!disabled && searchState === "error" && <p className="search-message search-error" role="alert">{searchError}</p>}
      {!disabled && searchState === "empty" && <p className="search-message">Aucun podcast trouvé pour cette recherche.</p>}

      {!disabled && !selectedPodcast && searchResults.length > 0 && (
        <div className="search-results" role="listbox" aria-label="Suggestions de podcasts">
          {searchResults.map((podcast) => (
            <button className="search-result" type="button" role="option" key={podcast.id} onClick={() => selectPodcast(podcast)}>
              <PodcastArtwork podcast={podcast} />
              <span className="search-result-copy">
                <strong>{podcast.name}</strong>
                <span>{podcast.author}</span>
              </span>
              <span className="search-result-arrow" aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      )}

      {selectedPodcast && (
        <div className="selected-podcast" aria-live="polite">
          <PodcastArtwork podcast={selectedPodcast} className="selected-podcast-artwork" />
          <span className="selected-podcast-copy">
            <span className="field-label">Podcast sélectionné</span>
            <strong>{selectedPodcast.name}</strong>
            <span>{selectedPodcast.author}</span>
          </span>
          <button className="change-button" type="button" onClick={changePodcast} disabled={disabled}>Changer</button>
        </div>
      )}
    </div>
  );
}
