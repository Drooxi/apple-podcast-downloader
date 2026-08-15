import { useEffect, useRef, useState } from "react";
import { getDesktopApi } from "../services/desktop-api.js";

export function useDownload({ api = getDesktopApi() } = {}) {
  const [outputDirectory, setOutputDirectory] = useState("");
  const [status, setStatus] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [logs, setLogs] = useState([]);
  const logId = useRef(0);

  useEffect(() => {
    let mounted = true;
    const disposeLog = api.onDownloadLog(({ message, level }) => {
      if (!mounted) return;
      setLogs((current) => [...current, { id: logId.current++, message, level }]);
    });
    const disposeStatus = api.onDownloadStatus((payload) => {
      if (!mounted) return;
      setStatus(payload.status);
      setStatusMessage(payload.message || "");
    });

    api.getOutputDirectory()
      .then((directory) => {
        if (mounted) setOutputDirectory(directory);
      })
      .catch((error) => {
        if (mounted) {
          setStatus("failed");
          setStatusMessage(error.message || "Le dossier de destination est indisponible.");
        }
      });

    return () => {
      mounted = false;
      disposeLog?.();
      disposeStatus?.();
    };
  }, [api]);

  async function selectDirectory() {
    try {
      const directory = await api.selectOutputDirectory();
      if (directory) {
        setOutputDirectory(directory);
        setStatusMessage("");
      }
    } catch (error) {
      setStatus("failed");
      setStatusMessage(error.message || "Le dossier n’a pas pu être sélectionné.");
    }
  }

  async function startDownload(podcastId) {
    setLogs([]);
    setStatus("running");
    setStatusMessage("");
    try {
      await api.startDownload({ podcastId });
    } catch (error) {
      setStatus("failed");
      setStatusMessage(error.message || "Une erreur inattendue est survenue.");
    }
  }

  async function cancelDownload() {
    if (status !== "running") return;
    try {
      await api.cancelDownload();
    } catch (error) {
      setStatusMessage(error.message || "L’annulation a échoué.");
    }
  }

  return {
    cancelDownload,
    isRunning: status === "running",
    logs,
    outputDirectory,
    selectDirectory,
    startDownload,
    status,
    statusMessage,
  };
}
