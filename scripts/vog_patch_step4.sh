#!/usr/bin/env bash
set -euo pipefail

WEB="apps/web"
PAGE="$WEB/src/app/contributions/new/page.tsx"
ADMIN_ROUTE="$WEB/src/app/api/admin/usage/summary/route.ts"

echo "› Backup & Patch: $PAGE"
cp "$PAGE" "$PAGE.bak.$(date +%s)"

# 1) Sichere activeClaim + canShowPanels + Index-Klemmung
#    (ersetzt die alte Zeile:  const activeClaim = claims[activeClaimIdx];)
perl -0777 -pe '
  s/const\s+activeClaim\s*=\s*claims\[activeClaimIdx\];/const activeClaim = (claims && claims[activeClaimIdx]) ?? null;\n  const canShowPanels = Boolean(showPanels && !analyzing && activeClaim && (activeClaim as any).text);\n\n  // Index klemmen, falls sich die Anzahl der Claims aendert\n  React.useEffect(() => {\n    if (activeClaimIdx > claims.length - 1) {\n      setActiveClaimIdx(Math.max(0, claims.length - 1));\n    }\n  }, [claims.length, activeClaimIdx]);/s
' -i "$PAGE"

# 2) Ersetze den ClaimPanelsGate-Block durch eine sichere Bedingung,
#    damit kein Zugriff auf activeClaim!.text passiert, bevor er existiert.
perl -0777 -pe '
  s|<ClaimPanelsGate[\s\S]*?</ClaimPanelsGate>|{canShowPanels && activeClaim && (activeClaim as any).text && (\n            <>\n              <StanceSpectrum claimText={(activeClaim as any).text} />\n              <ObjectionCollector />\n              <CounterSynth text={(activeClaim as any).text} />\n            </>\n          )}|s
' -i "$PAGE"

# Optional: Import von ClaimPanelsGate ausbauen, falls nicht mehr genutzt
if grep -q '@/ui/ClaimPanelsGate' "$PAGE"; then
  if ! grep -q 'ClaimPanelsGate show=' "$PAGE"; then
    perl -0777 -pe 's/^\s*import\s+ClaimPanelsGate\s+from\s+"@\/ui\/ClaimPanelsGate";\s*\n//m' -i "$PAGE" || true
  fi
fi

echo "✓ UI-Guard gepatcht."

# 3) Admin-Usage-Endpoint (405 -> 200 Stub), falls bei dir noch leer
if [ ! -f "$ADMIN_ROUTE" ] || ! grep -q "export async function POST" "$ADMIN_ROUTE"; then
  echo "› Schreiben: $ADMIN_ROUTE"
  mkdir -p "$(dirname "$ADMIN_ROUTE")"
  cat > "$ADMIN_ROUTE" <<'TS'
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Minimaler Stub – liefert leere Zusammenfassung (ersetzt 405).
export async function POST() {
  return NextResponse.json({ ok: true, items: [], note: "usage summary stub" }, { status: 200 });
}
TS
  echo "✓ Admin-Route angelegt."
else
  echo "• Admin-Route existiert bereits – kein Stub noetig."
fi

echo "— Patch fertig."
