# im Repo-Root
cat > scripts/patch_similar_route.sh <<'SH'
#!/usr/bin/env bash
set -euo pipefail
FILE="apps/web/src/app/api/statements/similar/route.ts"
mkdir -p "$(dirname "$FILE")"
cat > "$FILE" <<'TS'
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalize(s: string) {
  // NFKD + Diakritika entfernen + lower
  return s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export async function GET(req: NextRequest) {
  const raw = String(req.nextUrl.searchParams.get("text") ?? "");
  const text = normalize(raw);

  // Beispiele: "touristen abzocke ..."
  if (/(tourist|touristen|abzocke)/.test(text)) {
    return NextResponse.json({
      kind: "verified",
      stmt: {
        id: "stmt-verified-001",
        title: "Faire Preise in Tourismuslagen der EU",
        trust: 0.92,
        version: 3,
        evidenceCount: 7,
        sim: 0.91,
      },
    });
  }

  // ÖPNV/Tram-Cluster (diakritikfrei prüfen)
  if (/(opnv|oepnv|tram|strassenbahn|nahverkehr|bvg|koepenick|kopenick)/.test(text)) {
    return NextResponse.json({
      kind: "cluster",
      clusterId: "clu-berlin-tram",
      top: [
        { id: "stmt-berlin-tram-a", title: "Straßenbahn Ostkreuz–Köpenick ausbauen", trust: 0.62, evidenceCount: 2, sim: 0.82 },
        { id: "stmt-berlin-tram-b", title: "Kostenloser ÖPNV in Berlin", trust: 0.55, evidenceCount: 1, sim: 0.78 },
      ],
    });
  }

  return NextResponse.json({ kind: "none" });
}
TS
echo "✓ Wrote $FILE"
SH

bash scripts/patch_similar_route.sh
pnpm --filter @vog/web dev
