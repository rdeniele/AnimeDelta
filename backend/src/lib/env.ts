import { config } from "dotenv";

config({ path: [".env.local", ".env"], quiet: true });

function str(name: string, fallback = ""): string {
  return process.env[name]?.trim() || fallback;
}

export const env = {
  port: Number(str("PORT", "4000")),
  apiUrl: str("API_URL", "http://localhost:4000").replace(/\/$/, ""),
  databaseUrl: str("DATABASE_URL"),
  databaseSsl: str("DATABASE_SSL") === "true",
  adminToken: str("ADMIN_TOKEN"),
  metadataProvider: str("METADATA_PROVIDER", "mock"),
  metadataApiUrl: str("METADATA_API_URL"),
  metadataApiKey: str("METADATA_API_KEY"),
  videoProvider: str("VIDEO_PROVIDER", "mock"),
  videoProviderUrl: str("VIDEO_PROVIDER_URL"),
  videoProviderApiKey: str("VIDEO_PROVIDER_API_KEY"),
  syncCron: str("SYNC_CRON", "0 */6 * * *"),
};
