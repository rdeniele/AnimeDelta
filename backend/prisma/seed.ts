import { db } from "../src/lib/db.js";
import { MockMetadataProvider } from "../src/providers/mock/mockProviders.js";
import { runFullSync } from "../src/sync/syncService.js";

// Seeds the database from the offline mock catalog regardless of METADATA_PROVIDER.
runFullSync(new MockMetadataProvider())
  .then((s) => console.log("Seeded", s))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
