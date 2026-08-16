import { ActivityLog } from "./ActivityLog.jsx";
import { DownloadProgress } from "./DownloadProgress.jsx";
import { PodcastSearch } from "./PodcastSearch.jsx";
import { formatPath } from "../utils/format-path.js";

const STATUS_LABELS = {
  idle: "Prêt à télécharger",
  running: "Téléchargement en cours",
  completed: "Téléchargement terminé",
  failed: "Téléchargement terminé avec des erreurs",
  cancelled: "Téléchargement annulé",
};

export function DownloadPanel({ download, search }) {
  const statusLabel = STATUS_LABELS[download.status] || STATUS_LABELS.idle;
  const canStart = Boolean(download.outputDirectory && search.selectedPodcast?.id && !download.isRunning);

  return (
    <div className="download-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-kicker">Votre bibliothèque</p>
          <h2>Préparer le téléchargement</h2>
        </div>
        <span className={`status status-${download.status}`} role="status">
          <span className="status-dot" />{statusLabel}
        </span>
      </div>

      <PodcastSearch disabled={download.isRunning} search={search} />

      <div className="destination-row">
        <div className="folder-icon" aria-hidden="true">⌁</div>
        <div className="destination-copy">
          <span className="field-label">Dossier de destination</span>
          <span className="destination-path" title={download.outputDirectory}>{formatPath(download.outputDirectory)}</span>
        </div>
        <button className="secondary-button" type="button" onClick={download.selectDirectory} disabled={download.isRunning}>Choisir</button>
      </div>

      <div className="actions">
        <button className="primary-button" type="button" onClick={() => download.startDownload(search.selectedPodcast.id)} disabled={!canStart}>
          <span>{download.isRunning ? "Téléchargement…" : "Lancer le téléchargement"}</span>
          <span className="button-arrow" aria-hidden="true">→</span>
        </button>
        {download.isRunning && <button className="cancel-button" type="button" onClick={download.cancelDownload}>Annuler</button>}
      </div>

      <DownloadProgress progress={download.progress} isRunning={download.isRunning} hasStarted={download.hasStarted} />
      {download.statusMessage && <p className="status-message">{download.statusMessage}</p>}
      <ActivityLog logs={download.logs} />
    </div>
  );
}
