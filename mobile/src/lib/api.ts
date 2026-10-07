import { API_URL } from "@/lib/config";
import { useAuth } from "@/store/auth";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    /** true when the server could not be reached at all */
    public network = false,
  ) {
    super(message);
  }
}

interface Options {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

const TIMEOUT_MS = 15000;

export async function api<T>(path: string, { method = "GET", body, signal }: Options = {}): Promise<T> {
  const token = useAuth.getState().token;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  signal?.addEventListener("abort", () => controller.abort());
  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      method,
      signal: controller.signal,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const msg = (await res.json().catch(() => null))?.error ?? "Something went wrong";
      throw new ApiError(msg, res.status);
    }
    return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError("Unable to reach the server", 0, true);
  } finally {
    clearTimeout(timer);
  }
}

/** Registers an anonymous device account if the app has no session yet. */
export async function ensureSession(): Promise<void> {
  const { token, setSession, username } = useAuth.getState();
  if (token) return;
  const r = await api<{ token: string; user: { username: string } }>("/auth/anonymous", {
    method: "POST",
    body: { username },
  });
  await setSession(r.token, r.user.username);
}

export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.network ? "No internet connection" : e.message;
  return "Something went wrong";
}
