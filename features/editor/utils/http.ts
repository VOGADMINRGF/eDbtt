// features/editor/utils/http.ts
export type HttpOptions = RequestInit & { json?: any };

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try { return localStorage.getItem("editorToken"); } catch { return null; }
}

export async function http(path: string, opts: HttpOptions = {}): Promise<Response> {
  const headers = new Headers(opts.headers ?? {});
  const token = getToken();
  if (token && !headers.has("authorization")) headers.set("authorization", `Bearer ${token}`);
  if (opts.json !== undefined) headers.set("content-type", "application/json");
  const body = opts.json !== undefined ? JSON.stringify(opts.json) : opts.body;
  return fetch(path, { ...opts, headers, body });
}

export async function asJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) {
    const msg = data && typeof data === "object" && "error" in data ? data.error : `HTTP ${res.status}`;
    throw new Error(String(msg));
  }
  return data as T;
}
