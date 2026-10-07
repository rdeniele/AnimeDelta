import { db } from "../src/lib/db.js";

// Removes the placeholder catalog (mock anime use picsum.photos artwork) before importing real channels.
db.anime
  .deleteMany({ where: { coverImage: { contains: "picsum.photos" } } })
  .then((r) => console.log(`Removed ${r.count} mock anime`))
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
