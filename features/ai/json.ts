// features/ai/json.ts
export function stripCodeFences(s: string): string {
    if (!s) return s;
    const trimmed = s.trim();
    if (trimmed.startsWith("```")) {
      // ggf. ```json am Anfang & ``` am Ende entfernen
      return trimmed.replace(/^```[a-zA-Z]*\s*/, "").replace(/```$/, "").trim();
    }
    return s;
  }
  
  export function safeParseJson<T=any>(raw: string): { ok: true; data: T } | { ok: false; error: string } {
    try {
      const clean = stripCodeFences(raw);
      return { ok: true, data: JSON.parse(clean) as T };
    } catch (e: any) {
      return { ok: false, error: String(e?.message || e) };
    }
  }
  