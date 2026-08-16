import { useState } from "react";

export function ActivityLog({ logs }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className={`log-card${isOpen ? " log-card-open" : " log-card-collapsed"}`} aria-live="polite" aria-label="Journal du téléchargement">
      <button className="log-header" type="button" onClick={() => setIsOpen((current) => !current)} aria-expanded={isOpen}>
        <span>Journal d’activité{logs.length > 0 ? ` · ${logs.length}` : ""}</span>
        <span className="log-header-controls">
          <span className="log-pulse" />
          <span className="log-toggle" aria-hidden="true">{isOpen ? "⌃" : "⌄"}</span>
        </span>
      </button>
      {isOpen && <div className="log-content">
        {logs.length === 0 ? (
          <p className="log-empty">Les informations du téléchargement apparaîtront ici.</p>
        ) : logs.map((entry) => (
          <p className={`log-line log-${entry.level}`} key={entry.id}>
            <span className="log-prefix">›</span>{entry.message}
          </p>
        ))}
      </div>}
    </section>
  );
}
