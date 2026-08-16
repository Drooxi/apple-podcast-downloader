import { useEffect, useState } from "react";
import { getDesktopApi } from "../services/desktop-api.js";

export function usePodcastHistory({ api = getDesktopApi() } = {}) {
  const [entries, setEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const applyEntries = (nextEntries) => {
      if (!mounted) return;
      const normalized = Array.isArray(nextEntries) ? nextEntries : [];
      setEntries(normalized);
      setSelectedEntry((current) => current && normalized.find((entry) => entry.id === current.id) || null);
    };
    const dispose = api.onHistoryUpdated((nextEntries) => {
      applyEntries(nextEntries);
      setIsLoading(false);
      setError("");
    });

    api.getPodcastHistory()
      .then((nextEntries) => {
        applyEntries(nextEntries);
        if (mounted) setIsLoading(false);
      })
      .catch((loadError) => {
        if (!mounted) return;
        setIsLoading(false);
        setError(loadError.message || "L’historique est indisponible.");
      });

    return () => {
      mounted = false;
      dispose?.();
    };
  }, [api]);

  return {
    clearSelection: () => setSelectedEntry(null),
    entries,
    error,
    isLoading,
    selectedEntry,
    selectEntry: setSelectedEntry,
  };
}
