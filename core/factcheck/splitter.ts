// core/factcheck/splitter.ts
import { splitIntoClaims as internalSplit } from "./claimDecompose";

type Lang = "de" | "en";
const MODE = (process.env.CLAIM_SPLITTER || "internal") as "internal" | "spacy";
const URL  = process.env.CLAIM_SPLITTER_URL || "";
const TOK  = process.env.CLAIM_SPLITTER_TOKEN || "";
const TIMEOUT_MS = Number(process.env.CLAIM_SPLITTER_TIMEOUT_MS || 10000);
const LONGFORM_THRESHOLD = Number(process.env.CLAIM_LONGFORM_THRESHOLD || 3000);

// simple circuit
let openUntil = 0;

async function trySpacy(text: string, lang: Lang): Promise<string[] | null> {
  if (MODE !== "spacy" || !URL || Date.now() < openUntil) return null;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort("timeout"), TIMEOUT_MS);
  try {
    const r = await fetch(URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(TOK ? { Authorization: `Bearer ${TOK}` } : {}),
      },
      body: JSON.stringify({ text, lang }),
      signal: ac.signal,
    });
    clearTimeout(t);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json().catch(() => ({}));
    if (Array.isArray(j?.claims) && j.claims.length) return j.claims;
    return null;
  } catch {
    openUntil = Date.now() + 15000; // 15s open
    return null;
  }
}

export async function splitIntoClaimsSmart(text: string, lang: Lang = "de"): Promise<string[]> {
  // kurze Inputs immer intern → beste UX
  if (text.length <= LONGFORM_THRESHOLD) return internalSplit(text, lang);

  // lange Inputs: erst intern (sofortige Basis) an die UI liefern – tiefergehende
  // Varianten im Hintergrund (Worker) nachziehen
  return internalSplit(text, lang);
}
