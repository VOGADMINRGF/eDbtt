// VPM25/features/statement/api.ts
export type StatementDTO = {
    id: string;
    title: string;
    text: string;
    category: string;
    language: string;
    createdAt: string | number | Date;
    updatedAt?: string | number | Date;
    factcheckStatus?: string | null;
    stats?: { views: number; votesAgree: number; votesNeutral: number; votesDisagree: number; votesTotal: number };
  };
  
  export async function listStatements(limit = 20, cursor?: string) {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (cursor) qs.set("cursor", cursor);
    const res = await fetch(`/api/statements?${qs.toString()}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok || !json?.ok) throw new Error(json?.error || "fetch_failed");
    return { items: (json.data || []) as StatementDTO[], nextCursor: (json.nextCursor ?? null) as string | null };
  }
  
  export async function createStatement(input: {
    text: string;
    title?: string;
    category?: string;
    language?: string;   // "de" | "en" | ...
    scope?: string;
    timeframe?: string;
  }) {
    const res = await fetch("/api/statements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error || "create_failed");
    return json.id as string;
  }
  