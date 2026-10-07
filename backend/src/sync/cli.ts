import { db } from "../lib/db.js";
import { runFullSync } from "./syncService.js";

runFullSync()
  .then((s) => console.log("Sync complete", s))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
