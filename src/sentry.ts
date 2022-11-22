import * as Sentry from "@sentry/node";
// import * as Tracing from "@sentry/tracing";
import "@sentry/tracing";

Sentry.init({
  dsn: "https://5b7a0b6725ca464aa57838df9e95d154@o544584.ingest.sentry.io/4504196969398272",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
});
