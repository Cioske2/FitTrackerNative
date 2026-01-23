type LogContext = Record<string, unknown> | undefined;

export function logError(error: unknown, message?: string, context?: LogContext) {
  const payload = {
    message: message || "Unexpected error",
    context,
    error,
  };
  console.error("[FitTracker]", payload);
}

export function logInfo(message: string, context?: LogContext) {
  console.info("[FitTracker]", { message, context });
}
