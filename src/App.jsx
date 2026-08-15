import { useEffect, useMemo, useState } from "react";

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

function App() {
  const [outputDirectory, setOutputDirectory] = useState("");
  const [status, setStatus] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [logs, setLogs] = useState([]);

  const isRunning = status === "running";
  const canStart = Boolean(outputDirectory) && !isRunning;
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
      await window.podcastDownloader.startDownload(outputDirectory);
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
