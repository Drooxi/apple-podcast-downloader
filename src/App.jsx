import { useEffect, useMemo, useRef, useState } from "react";

const STATUS_LABELS = {
  idle: "Prêt à télécharger",
  running: "Téléchargement en cours",
  completed: "Téléchargement terminé",
  failed: "Téléchargement terminé avec des erreurs",
  cancelled: "Téléchargement annulé",
};

function formatPath(value) {
  if (!value) return "Aucun dossier sélectionné";
  return value.length > 68 ? `…${value.slice(-65)}` : value;
}

function PodcastArtwork({ podcast, className = "" }) {
  const initial = podcast.name?.trim().charAt(0).toUpperCase() || "P";

  return (
    <span className={`podcast-artwork ${className}`}>
      <span className="podcast-artwork-fallback">{initial}</span>
      {podcast.artworkUrl && (
        <img
          src={podcast.artworkUrl}
          alt={`Illustration de ${podcast.name}`}
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      )}
    </span>
  );
}

function App() {
  const [outputDirectory, setOutputDirectory] = useState("");
  const [status, setStatus] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchState, setSearchState] = useState("idle");
  const [searchError, setSearchError] = useState("");
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const searchRequest = useRef(0);

  const isRunning = status === "running";
  const canStart = Boolean(outputDirectory && selectedPodcast?.id && !isRunning);
  const statusLabel = STATUS_LABELS[status] || STATUS_LABELS.idle;
  const statusClass = useMemo(() => `status status-${status}`, [status]);

  useEffect(() => {
    let disposeLog;
    let disposeStatus;
    let isMounted = true;

    window.podcastDownloader.getDefaultDirectory().then((directory) => {
      if (isMounted) setOutputDirectory(directory);
    });

    disposeLog = window.podcastDownloader.onLog(({ message, level }) => {
      setLogs((current) => [
        ...current,
        { id: `${Date.now()}-${Math.random()}`, message, level },
      ]);
    });

    disposeStatus = window.podcastDownloader.onStatus((payload) => {
      setStatus(payload.status);
      setStatusMessage(payload.message || "");
    });

    return () => {
      isMounted = false;
      disposeLog?.();
      disposeStatus?.();
    };
  }, []);

  useEffect(() => {
    const term = searchTerm.trim();
    const requestId = ++searchRequest.current;

    if (selectedPodcast && term === selectedPodcast.name) {
      setSearchResults([]);
      setSearchState("selected");
      setSearchError("");
      return undefined;
    }

    if (term.length < 3) {
      setSearchResults([]);
      setSearchState(term ? "hint" : "idle");
      setSearchError("");
      window.podcastDownloader.searchPodcasts("");
      return undefined;
    }

    setSearchState("loading");
    setSearchError("");

    const timer = window.setTimeout(async () => {
      try {
        const results = await window.podcastDownloader.searchPodcasts(term);
        if (requestId !== searchRequest.current) return;

        setSearchResults(results);
        setSearchState(results.length ? "results" : "empty");
      } catch (error) {
        if (requestId !== searchRequest.current) return;

        setSearchResults([]);
        setSearchState("error");
        setSearchError(error.message || "La recherche est indisponible.");
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [searchTerm, selectedPodcast]);

  function handleSearchChange(event) {
    const value = event.target.value;
    setSearchTerm(value);

    if (selectedPodcast && value !== selectedPodcast.name) {
      setSelectedPodcast(null);
    }
  }

  function handleSelectPodcast(podcast) {
    setSelectedPodcast(podcast);
    setSearchTerm(podcast.name);
    setSearchResults([]);
    setSearchState("selected");
    setSearchError("");
  }

  function handleChangePodcast() {
    if (isRunning) return;
    setSelectedPodcast(null);
    setSearchTerm("");
    setSearchResults([]);
    setSearchState("idle");
    setSearchError("");
  }

  async function handleSelectDirectory() {
    if (isRunning) return;
    const selectedDirectory = await window.podcastDownloader.selectDirectory();
    if (selectedDirectory) {
      setOutputDirectory(selectedDirectory);
      setStatusMessage("");
    }
  }

  async function handleStart() {
    if (!canStart) return;

    setLogs([]);
    setStatus("running");
    setStatusMessage("");

    try {
      await window.podcastDownloader.startDownload({
        outputDirectory,
        podcastId: selectedPodcast.id,
      });
    } catch (error) {
      setStatus("failed");
      setStatusMessage(error.message || "Une erreur inattendue est survenue.");
    }
  }

  async function handleCancel() {
    if (isRunning) {
      await window.podcastDownloader.cancelDownload();
    }
  }

  return (
    <main className="app-shell">
      <div className="glow glow-one" />
      <div className="glow glow-two" />

      <section className="hero-card" aria-labelledby="app-title">
        <div className="hero-copy">
          <div className="app-mark" aria-hidden="true">
            <span className="mark-orb orb-one" />
            <span className="mark-orb orb-two" />
            <span className="mark-orb orb-three" />
            <span className="mark-wave">)))</span>
          </div>
          <p className="eyebrow">PODCASTS, SIMPLEMENT</p>
          <h1 id="app-title">Apple Podcast Downloader</h1>
          <p className="hero-description">
            Retrouvez les épisodes de votre podcast et téléchargez-les en
            quelques instants dans le dossier de votre choix.
          </p>
        </div>

        <div className="download-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-kicker">Votre bibliothèque</p>
              <h2>Préparer le téléchargement</h2>
            </div>
            <span className={statusClass} role="status">
              <span className="status-dot" />
              {statusLabel}
            </span>
          </div>

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
                disabled={isRunning}
                onChange={handleSearchChange}
              />
              {searchState === "loading" && <span className="search-spinner" aria-label="Recherche en cours" />}
            </div>

            {!isRunning && searchState === "hint" && (
              <p className="search-message search-hint">Saisissez au moins 3 caractères.</p>
            )}
            {!isRunning && searchState === "error" && (
              <p className="search-message search-error" role="alert">{searchError}</p>
            )}
            {!isRunning && searchState === "empty" && (
              <p className="search-message">Aucun podcast trouvé pour cette recherche.</p>
            )}

            {!isRunning && !selectedPodcast && searchResults.length > 0 && (
              <div className="search-results" role="listbox" aria-label="Suggestions de podcasts">
                {searchResults.map((podcast) => (
                  <button
                    className="search-result"
                    type="button"
                    role="option"
                    key={podcast.id}
                    onClick={() => handleSelectPodcast(podcast)}
                  >
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
                <button
                  className="change-button"
                  type="button"
                  onClick={handleChangePodcast}
                  disabled={isRunning}
                >
                  Changer
                </button>
              </div>
            )}
          </div>

          <div className="destination-row">
            <div className="folder-icon" aria-hidden="true">⌁</div>
            <div className="destination-copy">
              <span className="field-label">Dossier de destination</span>
              <span className="destination-path" title={outputDirectory}>
                {formatPath(outputDirectory)}
              </span>
            </div>
            <button
              className="secondary-button"
              type="button"
              onClick={handleSelectDirectory}
              disabled={isRunning}
            >
              Choisir
            </button>
          </div>

          <div className="actions">
            <button
              className="primary-button"
              type="button"
              onClick={handleStart}
              disabled={!canStart}
            >
              <span>{isRunning ? "Téléchargement…" : "Lancer le téléchargement"}</span>
              <span className="button-arrow" aria-hidden="true">→</span>
            </button>
            {isRunning && (
              <button className="cancel-button" type="button" onClick={handleCancel}>
                Annuler
              </button>
            )}
          </div>

          {statusMessage && <p className="status-message">{statusMessage}</p>}

          <div className="log-card" aria-live="polite" aria-label="Journal du téléchargement">
            <div className="log-header">
              <span>Journal d’activité</span>
              <span className="log-pulse" />
            </div>
            <div className="log-content">
              {logs.length === 0 ? (
                <p className="log-empty">Les informations du téléchargement apparaîtront ici.</p>
              ) : (
                logs.map((entry) => (
                  <p className={`log-line log-${entry.level}`} key={entry.id}>
                    <span className="log-prefix">›</span>
                    {entry.message}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="app-footer">
        <span>Une expérience locale, pensée pour vos écoutes.</span>
        <span className="footer-line" />
        <span>RSS · MP3 · PRIVÉ</span>
      </footer>
    </main>
  );
}

export default App;
