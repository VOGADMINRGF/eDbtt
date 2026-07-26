import type { AiUsageEvent } from "./aiUsageTypes";

export function sanitizeAiLogText(value: unknown, max = 500): string | null {
  if (value === null || value === undefined) return null;
  const base = typeof value === "string" ? value : JSON.stringify(value);
  if (!base) return null;

  let text = base;
  text = text.replace(/Bearer\s+[A-Za-z0-9._-]{10,}/gi, "Bearer [redacted]");
  text = text.replace(/sk-[A-Za-z0-9_-]{20,}/g, "sk-[redacted]");
  text = text.replace(/(api[_-]?key\s*[=:]\s*)([^\s,;]+)/gi, "$1[redacted]");
  text = text.replace(/(authorization\s*[=:]\s*)([^\n]+)/gi, "$1[redacted]");
  text = text.replace(/(cookie|set-cookie)\s*[=:]\s*([^\n]+)/gi, "$1=[redacted]");
  text = text.replace(/(session(_token)?|u_id|u_role|u_2fa|u_2fa_fallback)\s*[=:]\s*([^\s,;]+)/gi, "$1=[redacted]");
  text = text.replace(/(token\s*[=:]\s*)([^\s,;]+)/gi, "$1[redacted]");

  if (text.length > max) return `${text.slice(0, max)}...`;
  return text;
}

export function sanitizeAiUsageEvent(event: AiUsageEvent): AiUsageEvent {
  return {
    ...event,
    promptSnippet: null,
    responseSnippet: null,
    rawError: sanitizeAiLogText(event.rawError, 500),
  };
}
