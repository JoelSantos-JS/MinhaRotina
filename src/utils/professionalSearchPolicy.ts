export interface SearchCoordinates {
  latitude: number;
  longitude: number;
}

export interface RateLimitEntry {
  windowStartMs: number;
  requestsInWindow: number;
  lastRequestMs: number;
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequestsPerWindow: number;
  minIntervalMs: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  retryAfterMs: number;
  nextEntry: RateLimitEntry;
}

function roundCoord(value: number): number {
  return Number(value.toFixed(3));
}

export function buildProfessionalSearchCacheKey(params: {
  categoryIds: string[];
  locationLabel?: string;
  coordinates?: SearchCoordinates;
  radiusMeters?: number;
  maxPerCategory?: number;
}): string {
  const categoryPart = [...params.categoryIds].sort().join(',');
  const locationPart = params.locationLabel?.trim().toLowerCase() ?? '';
  const coordPart = params.coordinates
    ? `${roundCoord(params.coordinates.latitude)},${roundCoord(params.coordinates.longitude)}`
    : '';
  const radiusPart = String(params.radiusMeters ?? '');
  const maxPerCategoryPart = String(params.maxPerCategory ?? '');

  return [categoryPart, locationPart, coordPart, radiusPart, maxPerCategoryPart].join('|');
}

export function evaluateSearchRateLimit(params: {
  nowMs: number;
  previousEntry?: RateLimitEntry;
  config: RateLimitConfig;
}): RateLimitDecision {
  const { nowMs, previousEntry, config } = params;

  const baseEntry: RateLimitEntry = previousEntry ?? {
    windowStartMs: nowMs,
    requestsInWindow: 0,
    lastRequestMs: 0,
  };

  if (baseEntry.lastRequestMs > 0) {
    const deltaSinceLast = nowMs - baseEntry.lastRequestMs;
    if (deltaSinceLast < config.minIntervalMs) {
      return {
        allowed: false,
        retryAfterMs: config.minIntervalMs - deltaSinceLast,
        nextEntry: baseEntry,
      };
    }
  }

  const windowExpired = nowMs - baseEntry.windowStartMs >= config.windowMs;
  const windowStartMs = windowExpired ? nowMs : baseEntry.windowStartMs;
  const requestsInWindow = windowExpired ? 0 : baseEntry.requestsInWindow;

  if (requestsInWindow >= config.maxRequestsPerWindow) {
    const retryAfterMs = config.windowMs - (nowMs - windowStartMs);
    return {
      allowed: false,
      retryAfterMs: Math.max(1, retryAfterMs),
      nextEntry: {
        windowStartMs,
        requestsInWindow,
        lastRequestMs: baseEntry.lastRequestMs,
      },
    };
  }

  return {
    allowed: true,
    retryAfterMs: 0,
    nextEntry: {
      windowStartMs,
      requestsInWindow: requestsInWindow + 1,
      lastRequestMs: nowMs,
    },
  };
}
