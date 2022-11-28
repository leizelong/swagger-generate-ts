import * as Sentry from "@sentry/node";
import * as path from "path";
import "@sentry/tracing";

import { getConfig, getPackageJson } from "./utils/common";

const config = getConfig(path.dirname(__dirname));
const isDebug = config.debug;
const environment = isDebug ? "development" : "production";
const packageJson = getPackageJson();
const release = `${packageJson.name}@${packageJson.version}`;

Sentry.init({
  dsn: "https://5b7a0b6725ca464aa57838df9e95d154@o544584.ingest.sentry.io/4504196969398272",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
  normalizeDepth: 6,
  environment,
  release,
  enabled: !isDebug,
  // enabled: true,
});
