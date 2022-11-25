import * as Sentry from "@sentry/node";
import "@sentry/tracing";

export function initSentry(enabled: boolean) {
  Sentry.init({
    dsn: "https://5b7a0b6725ca464aa57838df9e95d154@o544584.ingest.sentry.io/4504196969398272",

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
    enabled,
  });
}
