const STORAGE_SCHEME_PREFIX = 'storage://';
const STORAGE_OBJECT_PATH_PREFIXES = [
  '/storage/v1/object/public/',
  '/storage/v1/object/sign/',
  '/storage/v1/object/authenticated/',
];

function normalizeObjectPath(path: string): string {
  return decodeURIComponent(path).replace(/^\/+/, '').trim();
}

export function toStorageRef(bucket: string, path: string): string {
  return `${STORAGE_SCHEME_PREFIX}${bucket}/${normalizeObjectPath(path)}`;
}

export function extractStoragePath(
  value: string | null | undefined,
  bucket: string
): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  const schemePrefix = `${STORAGE_SCHEME_PREFIX}${bucket}/`;
  if (raw.startsWith(schemePrefix)) {
    const path = normalizeObjectPath(raw.slice(schemePrefix.length));
    return path || null;
  }

  if (/^https?:\/\//i.test(raw)) {
    try {
      const url = new URL(raw);
      for (const prefix of STORAGE_OBJECT_PATH_PREFIXES) {
        const marker = `${prefix}${bucket}/`;
        const idx = url.pathname.indexOf(marker);
        if (idx >= 0) {
          const path = normalizeObjectPath(url.pathname.slice(idx + marker.length));
          return path || null;
        }
      }
    } catch {
      return null;
    }
    return null;
  }

  // Legacy plain-path support (e.g. "task-id.jpg")
  if (/^[a-zA-Z0-9/_-]+\.[a-zA-Z0-9]+$/.test(raw)) {
    return normalizeObjectPath(raw);
  }

  return null;
}

