import { NextResponse } from "next/server";

/**
 * Liefert Status für AI-Provider OHNE echte Requests (kein Tokenverbrauch).
 * Logik: Wenn KEY fehlt -> skipped(202). Wenn KEY vorhanden -> ok=true (keine externen Calls).
 */
type Prov = { name: string; label: string; envKeys: string[]; note?: string };

export async function GET() {
  const providers = PROVS.map((p) => {
    const hasKey = p.envKeys.some((k) => !!process.env[k]);
    if (!hasKey)
      return {
        name: p.name,
        label: p.label,
        ok: false,
        skipped: true,
        code: 202,
        note: "Kein API-Key gesetzt.",
      };
    return {
      name: p.name,
      label: p.label,
      ok: true,
      code: 202,
      note: p.note || "Key vorhanden, Request übersprungen.",
    };
  });
  return NextResponse.json({ providers, ts: new Date().toISOString() });
}
