export const runtime = "nodejs";

import { NextResponse } from "next/server";

type Row = {
  name: string;
  ok: boolean;
  status?: number;
  path?: string;
  error?: string;
};

export async function GET() {
  const base = process.env.ARI_URL || process.env.YOUCOM_ARI_API_URL || "";
  const key = process.env.ARI_API_KEY || process.env.YOUCOM_ARI_API_KEY || "";

  if (!base)
    return NextResponse.json(
      { name: "ai:ari", ok: false, error: "ARI_URL missing" },
      { status: 500 },
    );
  if (!key)
    return NextResponse.json(
      { name: "ai:ari", ok: false, error: "ARI_API_KEY missing" },
      { status: 500 },
    );

  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: `Bearer ${key}`,
  };

  // Wir probieren mehrere gängige Pfade: geschützter (=Key-Test) und Health
  const candidates = [
    "/v1/models",
    "/models",
    "/health",
    "/status",
    "/v1/health",
  ].map((p) => base.replace(/\/+$/, "") + p);

  let lastErr = "unreachable";
  for (const url of candidates) {
    try {
      const res = await fetch(url, { headers, cache: "no-store" });
      if (res.ok) {
        return NextResponse.json({
          name: "ai:ari",
          ok: true,
          status: res.status,
          path: new URL(url).pathname,
        });
      }
      // 401/403 -> Key/Permission-Problem (Diagnose zurückgeben)
      const txt = await res.text().catch(() => "");
      return NextResponse.json(
        {
          name: "ai:ari",
          ok: false,
          status: res.status,
          path: new URL(url).pathname,
          error: txt?.slice(0, 160) || `HTTP ${res.status}`,
        },
        { status: 200 },
      );
    } catch (e: any) {
      lastErr = e?.message ?? "fetch failed";
      continue;
    }
  }

  return NextResponse.json(
    { name: "ai:ari", ok: false, error: lastErr },
    { status: 200 },
  );
}
