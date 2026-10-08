import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { z, type ZodType } from "zod";
import { db } from "./db.js";
import { env } from "./env.js";
import { isProviderError } from "../providers/errors.js";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function parse<T>(schema: ZodType<T>, data: unknown): T {
  const r = schema.safeParse(data);
  if (!r.success) throw new HttpError(400, r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  return r.data;
}

export const idParam = z.string().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/);

export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");

declare module "express-serve-static-core" {
  interface Request {
    userId?: string;
  }
}

/** Resolves the Bearer token to a user when present; never rejects. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.slice(7) : null;
  if (token && token.length < 200) {
    const user = await db.user.findUnique({ where: { tokenHash: hashToken(token) }, select: { id: true } });
    if (user) req.userId = user.id;
  }
  next();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  if (!req.userId) throw new HttpError(401, "Authentication required");
  next();
}

/** Admin API is disabled unless ADMIN_TOKEN is configured; compared in constant time. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const given = req.headers["x-admin-token"];
  if (!env.adminToken || typeof given !== "string") throw new HttpError(403, "Forbidden");
  const a = Buffer.from(given);
  const b = Buffer.from(env.adminToken);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new HttpError(403, "Forbidden");
  next();
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (isProviderError(err)) return void res.status(err.status).json(err.toJSON());
  if (err instanceof HttpError) return void res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
}
