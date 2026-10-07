import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { db } from "./lib/db.js";
import { errorHandler, HttpError, optionalAuth } from "./lib/http.js";
import { mockVtt } from "./providers/mock/mockProviders.js";
import { admin } from "./routes/admin.js";
import { catalog } from "./routes/catalog.js";
import { user } from "./routes/user.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors()); // native apps send no Origin; tighten if a web client is added
  app.use(express.json({ limit: "20kb" }));

  app.use(
    "/api",
    rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }),
  );

  app.get("/api/health", async (_req, res) => {
    await db.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  });

  // Mock WebVTT tracks (the dev subtitle provider points here).
  app.get("/api/subtitles/mock/:episodeId/:lang.vtt", (req, res) => {
    const lang = req.params.lang === "ja" ? "ja" : "en";
    res.type("text/vtt").send(mockVtt(lang));
  });

  app.use("/api/admin", admin);
  app.use("/api", optionalAuth, catalog, user);

  app.use((_req, _res, next) => next(new HttpError(404, "Not found")));
  app.use(errorHandler);
  return app;
}
