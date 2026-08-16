import { useEffect, useRef, useState } from "react";
import { getDesktopApi } from "../services/desktop-api.js";

export function useDownload({ api = getDesktopApi() } = {}) {
  const [outputDirectory, setOutputDirectory] = useState("");
  const [status, setStatus] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState({ total: 0, downloaded: 0, failed: 0, percent: 0 });
  const [hasStarted, setHasStarted] = useState(false);
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
    const disposeProgress = api.onDownloadProgress((payload) => {
      if (!mounted) return;
      setProgress({
        total: Number.isFinite(payload.total) ? payload.total : 0,
        downloaded: Number.isFinite(payload.downloaded) ? payload.downloaded : 0,
        failed: Number.isFinite(payload.failed) ? payload.failed : 0,
        percent: Number.isFinite(payload.percent) ? payload.percent : 0,
      });
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
      disposeProgress?.();
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
    setHasStarted(true);
    setProgress({ total: 0, downloaded: 0, failed: 0, percent: 0 });
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
    hasStarted,
    logs,
    outputDirectory,
    progress,
    selectDirectory,
    startDownload,
    status,
    statusMessage,
  };
}
