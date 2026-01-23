import Constants from "expo-constants";
import * as Sentry from "sentry-expo";

const extra = Constants.expoConfig?.extra || {};
const enabled = !!extra.SENTRY_DSN && extra.SENTRY_ENABLED !== "false";

export function initAnalytics() {
  if (!enabled) return;
  try {
    Sentry.Native.addBreadcrumb({
      category: "app",
      message: "analytics_initialized",
      level: "info",
    });
  } catch {
    // noop
  }
}

export function trackEvent(name: string, props?: Record<string, unknown>) {
  if (!enabled) return;
  try {
    Sentry.Native.addBreadcrumb({
      category: "analytics",
      message: name,
      data: props,
      level: "info",
    });
  } catch {
    // noop
  }
}

export function trackScreen(name: string, props?: Record<string, unknown>) {
  trackEvent(`screen:${name}`, props);
}

export function trackError(error: unknown, message?: string) {
  if (!enabled) return;
  try {
    Sentry.Native.captureException(error, {
      tags: message ? { message } : undefined,
    });
  } catch {
    // noop
  }
}
