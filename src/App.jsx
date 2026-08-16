import { useState } from "react";
import { usePodcastSearch } from "./hooks/usePodcastSearch.js";
import { useDownload } from "./hooks/useDownload.js";
import { DownloadPanel } from "./components/DownloadPanel.jsx";
import { PodcastHistory } from "./components/PodcastHistory.jsx";
import { usePodcastHistory } from "./hooks/usePodcastHistory.js";

function App() {
  const search = usePodcastSearch();
  const download = useDownload();
  const history = usePodcastHistory();
  const [activeView, setActiveView] = useState("download");

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

        <div className="app-panel-column">
          <nav className="view-navigation" aria-label="Navigation principale">
            <button className={activeView === "download" ? "active" : ""} type="button" onClick={() => setActiveView("download")}>Télécharger</button>
            <button className={activeView === "history" ? "active" : ""} type="button" onClick={() => setActiveView("history")}>Historique</button>
          </nav>
          {activeView === "download" ? <DownloadPanel download={download} search={search} /> : <PodcastHistory history={history} />}
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
