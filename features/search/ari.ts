export type AriResult = { ok: boolean; items?: any[]; error?: string; skipped?: boolean; ms?: number; logs?: string[] };

// Minimal-Stub: Wenn KEY fehlt → sauber 'skipped'. Ansonsten: hier später echten ARI-Call einhängen.
export async function searchWithAriStrict(query: string, opts: { region?: string; limit?: number; timeoutMs?: number } = {}): Promise<AriResult> {
  const key = process.env.YOUCOM_ARI_API_KEY;
  if (!key) return { ok:false, skipped:true, error:"YOUCOM_ARI_API_KEY missing" };
  // TODO: echten Endpunkt/Schema einbauen, sobald Zugang vorliegt.
  return { ok:false, error:"ARI not wired yet (placeholder)", ms: 0, logs:["ari: placeholder"] };
}
