export function DownloadProgress({ progress, isRunning, hasStarted }) {
  if (!hasStarted && !isRunning) return null;

  return (
    <section className={`download-progress${isRunning ? " download-progress-running" : ""}`} aria-label="Progression du téléchargement">
      <div className="progress-heading">
        <span className="field-label">Progression</span>
        <strong>{progress.percent}%</strong>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={progress.percent}
        aria-label={`${progress.percent}% téléchargé`}
      >
        <div className="progress-fill" style={{ width: `${progress.percent}%` }} />
      </div>
      <div className="progress-meta">
        <span>{progress.total > 0 ? `${progress.downloaded} / ${progress.total} épisode(s) téléchargé(s)` : "Préparation du téléchargement…"}</span>
        {progress.failed > 0 && <span className="progress-failures">{progress.failed} erreur(s)</span>}
      </div>
    </section>
  );
}
