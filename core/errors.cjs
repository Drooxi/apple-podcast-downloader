class OperationCancelledError extends Error {
  constructor(message = "L’opération a été annulée.") {
    super(message);
    this.name = "OperationCancelledError";
    this.code = "ERR_OPERATION_CANCELLED";
  }
}

class DownloadCancelledError extends OperationCancelledError {
  constructor() {
    super("Le téléchargement a été annulé.");
    this.name = "DownloadCancelledError";
  }
}

class PodcastSearchCancelledError extends OperationCancelledError {
  constructor() {
    super("La recherche a été annulée.");
    this.name = "PodcastSearchCancelledError";
  }
}

function throwIfAborted(signal, ErrorClass = OperationCancelledError) {
  if (signal?.aborted) {
    throw new ErrorClass();
  }
}

function isCancellationError(error, signal) {
  return Boolean(
    signal?.aborted ||
      error instanceof OperationCancelledError ||
      error?.name === "AbortError",
  );
}

module.exports = {
  DownloadCancelledError,
  OperationCancelledError,
  PodcastSearchCancelledError,
  isCancellationError,
  throwIfAborted,
};
