import { timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { env } from "../lib/env.js";
import { HttpError } from "../lib/http.js";
import { runFullSync } from "../sync/syncService.js";

export const cron = Router();

/**
 * Called by Vercel Cron (it sends `Authorization: Bearer $CRON_SECRET`). Runs a time-boxed
 * sync so it finishes inside the function's limit; the next run continues where it left off
 * because every step is idempotent.
 */
cron.get("/cron/sync", async (req, res) => {
  const given = req.headers.authorization ?? "";
  const expected = `Bearer ${env.cronSecret}`;
  const ok = env.cronSecret && given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  if (!ok) throw new HttpError(401, "Unauthorized");
  const stats = await runFullSync(undefined, { deadline: Date.now() + 240_000 });
  res.json(stats);
});
