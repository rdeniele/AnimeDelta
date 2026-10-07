import cron from "node-cron";
import { createApp } from "./app.js";
import { env } from "./lib/env.js";
import { runFullSync } from "./sync/syncService.js";

createApp().listen(env.port, "0.0.0.0", () => console.log(`API listening on :${env.port}`));

if (env.syncCron && cron.validate(env.syncCron)) {
  cron.schedule(env.syncCron, () => {
    runFullSync().catch((e) => console.error("Scheduled sync failed", e));
  });
}
