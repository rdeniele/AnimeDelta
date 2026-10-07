import { existsSync, readFileSync } from "node:fs";
import { db } from "../src/lib/db.js";
import { importLibrary, librarySchema } from "../src/library/importLibrary.js";

const dry = process.argv.includes("--dry");
const path = process.argv.find((a) => a.endsWith(".json")) ?? "catalog/library.json";

async function main() {
  if (!existsSync(path)) throw new Error(`${path} not found. Copy catalog/library.example.json to catalog/library.json and edit it.`);
  const parsed = librarySchema.safeParse(JSON.parse(readFileSync(path, "utf8")));
  if (!parsed.success) {
    for (const i of parsed.error.issues) console.error(`  ${i.path.join(".")}: ${i.message}`);
    throw new Error("Catalog file is invalid (see above).");
  }
  const r = await importLibrary(parsed.data, dry);
  console.log(dry ? "Valid (dry run, nothing written):" : "Imported:", r);
}

main()
  .catch((e) => {
    console.error(e.message ?? e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
