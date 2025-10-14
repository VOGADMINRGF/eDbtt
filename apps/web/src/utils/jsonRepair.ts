export function safeJsonParse<T = any>(s: string) {
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}
export function parseJsonOrThrow<T = any>(s: string) {
  return JSON.parse(s) as T;
}
