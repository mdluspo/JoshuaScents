import * as Sentry from "@sentry/react";

export function initializeMonitoring() {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 0,
    beforeSend(event) {
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
        delete event.request.data;
        if (event.request.url) { try { const url = new URL(event.request.url); event.request.url = url.origin + url.pathname; } catch { delete event.request.url; } }
      }
      delete event.user;
      event.breadcrumbs = event.breadcrumbs?.map(breadcrumb => ({ ...breadcrumb, message: breadcrumb.category?.startsWith("ui.input") ? "Input interaction" : breadcrumb.message, data: undefined }));
      return event;
    },
  });
}
