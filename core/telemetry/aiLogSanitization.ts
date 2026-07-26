import type { AiUsageEvent } from "./aiUsageTypes";

function safeStringify(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;

  const seen = new WeakSet<object>();
  try {
    return JSON.stringify(value, (_key, entry: unknown) => {
      if (typeof entry === "bigint") return String(entry);
      if (entry && typeof entry === "object") {
        if (seen.has(entry as object)) return "[circular]";
        seen.add(entry as object);
      }
      if (typeof entry === "function") return "[function]";
      if (typeof entry === "symbol") return String(entry);
      return entry;
    });
  } catch {
    try {
      return String(value);
    } catch {
      return "[unserializable]";
    }
  }
}

export function sanitizeAiLogText(value: unknown, max = 500): string | null {
  const base = safeStringify(value);
  if (!base) return null;

  let text = base;
  text = text.replace(/Bearer\s+[A-Za-z0-9._-]{10,}/gi, "Bearer [redacted]");
  text = text.replace(/sk-[A-Za-z0-9_-]{20,}/g, "sk-[redacted]");
  text = text.replace(/sk-ant-[A-Za-z0-9_-]{20,}/g, "sk-ant-[redacted]");
  text = text.replace(/AIza[0-9A-Za-z\\-_]{20,}/g, "AIza[redacted]");
  text = text.replace(/(api[_-]?key\s*[=:]\s*)([^\s,;]+)/gi, "$1[redacted]");
  text = text.replace(/(authorization\s*[=:]\s*)([^\n]+)/gi, "$1[redacted]");
  text = text.replace(/(cookie|set-cookie)\s*[=:]\s*([^\n]+)/gi, "$1=[redacted]");
  text = text.replace(/(session(_token)?|u_id|u_role|u_2fa|u_2fa_fallback)\s*[=:]\s*([^\s,;]+)/gi, "$1=[redacted]");
  text = text.replace(/(token\s*[=:]\s*)([^\s,;]+)/gi, "$1[redacted]");
  text = text.replace(
    /([?&](?:api[_-]?key|key|token|access_token|authorization|auth|session|cookie)=)([^&#\s]+)/gi,
    "$1[redacted]",
  );

  if (text.length > max) return `${text.slice(0, max)}...`;
  return text;
}

export function sanitizeAiUsageEvent(event: AiUsageEvent): AiUsageEvent {
  return {
    ...event,
    promptSnippet: null,
    responseSnippet: null,
    rawError: null,
  };
}
