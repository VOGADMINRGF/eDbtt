/**
 * Zentraler Zugriff auf GPT/ARI Provider.
 * Wichtig: Für GPT-5 (Responses API) KEIN response_format/temperature senden.
 */
import { callOpenAI } from "./providers/openai";

export async function callOpenAIJson(prompt: string, maxOutputTokens = 1200) {
  // Hinweis: maxOutputTokens bleibt ungenutzt – Responses API kann per Policy limitieren,
  // hier reicht die JSON-Struktur-Anweisung im Prompt.
  const { text } = await callOpenAI(
    `${prompt}\n\nGib NUR gültiges JSON (RFC8259) zurück.`,
    { forceJsonMode: true }
  );
  return { text };
}

// Platzhalter – ARI-Key ggf. setzen oder diesen Fallback ignorieren
export async function youcomResearch(_args: any) {
  throw new Error("ARI not configured (YOUCOM_ARI_API_KEY missing)");
}
export async function youcomSearch(_args: any) {
  throw new Error("ARI search not configured");
}
export function extractNewsFromSearch() { return []; }
