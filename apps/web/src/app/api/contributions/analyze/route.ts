import { NextRequest, NextResponse } from "next/server";
import { extractV4 } from "@features/analyze/wrapper";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { text, maxClaims } = await req.json().catch(() => ({}));
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text missing" }, { status: 400 });
    }
    // Heuristische Extraktion (kostenfrei, offline)
    const data = extractV4(text);
    const claims = Array.isArray(data?.claims) ? data.claims : [];

    // Limit für /new, unbegrenzt für /analyze
    const limited = typeof maxClaims === "number"
      ? claims.slice(0, Math.max(1, maxClaims))
      : claims;

    // Default-Werte für UI
    const withDefaults = limited.map((c: any) => ({
      ...c,
      impact: c.impact ?? 3,          // 1–5 Sterne (Relevanz intern)
      scope:  c.scope  ?? 3,          // 1–5 Punkte (Gesellschaftlicher Umfang)
    }));

    return NextResponse.json({ ...data, claims: withDefaults });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "fail" }, { status: 500 });
  }
}
