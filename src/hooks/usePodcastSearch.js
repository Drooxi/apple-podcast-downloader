import { useEffect, useRef, useState } from "react";
import { getDesktopApi } from "../services/desktop-api.js";

export function usePodcastSearch({ api = getDesktopApi() } = {}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchState, setSearchState] = useState("idle");
  const [searchError, setSearchError] = useState("");
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  const requestId = useRef(0);

  useEffect(() => {
    const term = searchTerm.trim();
    const currentRequestId = ++requestId.current;

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
      void api.cancelPodcastSearch().catch(() => {});
      return undefined;
    }

    setSearchState("loading");
    setSearchError("");

    const timer = window.setTimeout(async () => {
      try {
        const results = await api.searchPodcasts(term);
        if (currentRequestId !== requestId.current) return;
        setSearchResults(results);
        setSearchState(results.length ? "results" : "empty");
      } catch (error) {
        if (currentRequestId !== requestId.current) return;
        setSearchResults([]);
        setSearchState("error");
        setSearchError(error.message || "La recherche est indisponible.");
      }
    }, 500);

    return () => {
      window.clearTimeout(timer);
      void api.cancelPodcastSearch().catch(() => {});
    };
  }, [api, searchTerm, selectedPodcast]);

  function handleSearchChange(event) {
    const value = event.target.value;
    setSearchTerm(value);
    if (selectedPodcast && value !== selectedPodcast.name) setSelectedPodcast(null);
  }

  function selectPodcast(podcast) {
    setSelectedPodcast(podcast);
    setSearchTerm(podcast.name);
    setSearchResults([]);
    setSearchState("selected");
    setSearchError("");
  }

  function changePodcast() {
    setSelectedPodcast(null);
    setSearchTerm("");
    setSearchResults([]);
    setSearchState("idle");
    setSearchError("");
  }

  return {
    changePodcast,
    handleSearchChange,
    searchError,
    searchResults,
    searchState,
    searchTerm,
    selectedPodcast,
    selectPodcast,
  };
}
