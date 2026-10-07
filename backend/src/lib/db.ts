import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";
import { env } from "./env.js";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({
      // Strip sslmode so pg doesn't override our explicit ssl option below.
      connectionString: env.databaseUrl.replace(/([?&])sslmode=[^&]*&?/, "$1").replace(/[?&]$/, ""),
      // Serverless: one connection per instance; the Supabase pooler multiplexes them.
      ...(process.env.VERCEL ? { max: 1 } : {}),
      ...(env.databaseSsl ? { ssl: { rejectUnauthorized: false } } : {}),
    }),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export * from "../generated/prisma/client.js";
