/**
 * Developer/debug event log (Section 8 of the resolver spec). Records what the provider
 * layer did — which provider, which request, what came back — with secrets redacted, so the
 * owner can see how resolution works without reading logs/source. In-memory ring buffer only;
 * never persisted, never exposed without the admin token.
 */
export interface DebugEvent {
  at: string;
  provider: string;
  operation: string;
  animeId?: string;
  episodeId?: string;
  requestUrl?: string;
  method?: string;
  status?: number;
  contentType?: string | null;
  mediaType?: string;
  sourceUrl?: string;
  subtitles?: { language: string; url: string }[];
  quality?: string[];
  error?: { code?: string; message: string };
}

const REDACT_KEYS = /^(authorization|cookie|set-cookie|x-admin-token|x-api-key|api-?key|token|secret|password)$/i;

/** Strips auth headers/cookies/tokens from a header bag (Section 8: "Redact: passwords,
 * authentication tokens, cookies, session credentials, API secrets"). Also redacts
 * `token=`/`key=`/`auth=`-style query parameters inside URLs so they don't leak via `requestUrl`. */
export function redactHeaders(headers?: Record<string, string> | Headers): Record<string, string> {
  if (!headers) return {};
  const entries = headers instanceof Headers ? Array.from(headers.entries()) : Object.entries(headers);
  const out: Record<string, string> = {};
  for (const [k, v] of entries) out[k] = REDACT_KEYS.test(k) ? "[REDACTED]" : v;
  return out;
}

export function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    for (const key of Array.from(u.searchParams.keys())) {
      if (/token|key|auth|secret|session/i.test(key)) u.searchParams.set(key, "[REDACTED]");
    }
    return u.toString();
  } catch {
    return url;
  }
}

const MAX_EVENTS = 200;
const events: DebugEvent[] = [];

export function recordEvent(e: Omit<DebugEvent, "at">): DebugEvent {
  const full: DebugEvent = {
    ...e,
    at: new Date().toISOString(),
    requestUrl: e.requestUrl ? redactUrl(e.requestUrl) : undefined,
  };
  events.push(full);
  if (events.length > MAX_EVENTS) events.shift();
  return full;
}

export function getEvents(): readonly DebugEvent[] {
  return events;
}

export function clearEvents(): void {
  events.length = 0;
}
