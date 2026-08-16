import { PodcastArtwork } from "./PodcastArtwork.jsx";

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return "Date inconnue";
  }
}

export function PodcastHistory({ history }) {
  return (
    <div className="download-panel history-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Votre bibliothèque</p>
          <h2>Historique</h2>
        </div>
        <span className="history-count">{history.entries.length} podcast{history.entries.length > 1 ? "s" : ""}</span>
      </div>

      {history.isLoading && <p className="history-message">Chargement de l’historique…</p>}
      {!history.isLoading && history.error && <p className="history-message history-error">{history.error}</p>}
      {!history.isLoading && !history.error && history.entries.length === 0 && (
        <p className="history-message">Aucun podcast téléchargé pour le moment.</p>
      )}

      {!history.isLoading && !history.error && history.entries.length > 0 && (
        <div className="history-list" aria-label="Podcasts téléchargés">
          {history.entries.map((entry) => (
            <button className="search-result history-result" type="button" key={entry.id} onClick={() => history.selectEntry(entry)}>
              <PodcastArtwork podcast={entry} />
              <span className="search-result-copy">
                <strong>{entry.name}</strong>
                <span>{entry.author}</span>
              </span>
              <span className="search-result-arrow" aria-hidden="true">→</span>
            </button>
          ))}
        </div>
      )}

      {history.selectedEntry && (
        <div className="history-detail" aria-live="polite">
          <PodcastArtwork podcast={history.selectedEntry} className="history-detail-artwork" />
          <div className="history-detail-copy">
            <span className="field-label">Dernier téléchargement</span>
            <h3>{history.selectedEntry.name}</h3>
            <p>{history.selectedEntry.author}</p>
            <time dateTime={history.selectedEntry.downloadedAt}>{formatDate(history.selectedEntry.downloadedAt)}</time>
          </div>
          <button className="change-button" type="button" onClick={history.clearSelection}>Fermer</button>
        </div>
      )}
    </div>
  );
}
