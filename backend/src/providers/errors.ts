/**
 * Structured error codes for the provider/resolver layer. These are distinct from `HttpError`
 * (lib/http.ts), which maps generic request validation failures to HTTP status codes.
 * `ProviderError` represents *why a source couldn't be resolved* and is always safe to show
 * to the client as-is (no internals leak into `message`).
 */
export const PROVIDER_ERROR_CODES = [
  "SOURCE_NOT_FOUND",
  "PROVIDER_UNAVAILABLE",
  "EPISODE_NOT_FOUND",
  "UNSUPPORTED_FORMAT",
  "ACCESS_RESTRICTED",
  "DRM_PROTECTED",
  "INVALID_RESPONSE",
  "NETWORK_ERROR",
] as const;

export type ProviderErrorCode = (typeof PROVIDER_ERROR_CODES)[number];

const HTTP_STATUS: Record<ProviderErrorCode, number> = {
  SOURCE_NOT_FOUND: 404,
  PROVIDER_UNAVAILABLE: 503,
  EPISODE_NOT_FOUND: 404,
  UNSUPPORTED_FORMAT: 422,
  ACCESS_RESTRICTED: 403,
  DRM_PROTECTED: 403,
  INVALID_RESPONSE: 502,
  NETWORK_ERROR: 502,
};

export class ProviderError extends Error {
  readonly code: ProviderErrorCode;
  readonly status: number;

  constructor(code: ProviderErrorCode, message: string) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
    this.status = HTTP_STATUS[code];
  }

  toJSON() {
    return { success: false as const, error: { code: this.code, message: this.message } };
  }

  static sourceNotFound(message = "No playable source was found for this episode.") {
    return new ProviderError("SOURCE_NOT_FOUND", message);
  }
  static providerUnavailable(message = "The provider is temporarily unavailable.") {
    return new ProviderError("PROVIDER_UNAVAILABLE", message);
  }
  static episodeNotFound(message = "Episode not found.") {
    return new ProviderError("EPISODE_NOT_FOUND", message);
  }
  static unsupportedFormat(message = "This source format isn't supported by the player.") {
    return new ProviderError("UNSUPPORTED_FORMAT", message);
  }
  static accessRestricted(message = "This source requires access this application doesn't have.") {
    return new ProviderError("ACCESS_RESTRICTED", message);
  }
  static drmProtected(message = "This source requires DRM and cannot be resolved by this application.") {
    return new ProviderError("DRM_PROTECTED", message);
  }
  static invalidResponse(message = "The provider returned a response that couldn't be understood.") {
    return new ProviderError("INVALID_RESPONSE", message);
  }
  static networkError(message = "A network error occurred while contacting the provider.") {
    return new ProviderError("NETWORK_ERROR", message);
  }
}

export function isProviderError(err: unknown): err is ProviderError {
  return err instanceof ProviderError;
}
