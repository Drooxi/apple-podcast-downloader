export function ActivityLog({ logs }) {
  return (
    <div className="log-card" aria-live="polite" aria-label="Journal du téléchargement">
      <div className="log-header">
        <span>Journal d’activité</span>
        <span className="log-pulse" />
      </div>
      <div className="log-content">
        {logs.length === 0 ? (
          <p className="log-empty">Les informations du téléchargement apparaîtront ici.</p>
        ) : logs.map((entry) => (
          <p className={`log-line log-${entry.level}`} key={entry.id}>
            <span className="log-prefix">›</span>{entry.message}
          </p>
        ))}
      </div>
    </div>
  );
}
