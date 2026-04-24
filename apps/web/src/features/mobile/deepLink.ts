export function normalizeDeepLinkPath(path: string): string {
  const raw = String(path || "").trim();
  if (!raw) return "/";
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const url = new URL(raw);
      return `${url.pathname || "/"}${url.search || ""}${url.hash || ""}`;
    } catch {
      return "/";
    }
  }
  return raw.startsWith("/") ? raw : `/${raw}`;
}

export function buildDeepLinkUrl(origin: string | null | undefined, path: string): string {
  const normalizedPath = normalizeDeepLinkPath(path);
  if (!origin) return normalizedPath;
  try {
    const base = new URL(origin);
    return new URL(normalizedPath, base).toString();
  } catch {
    return normalizedPath;
  }
}
