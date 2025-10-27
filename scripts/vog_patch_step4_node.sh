#!/usr/bin/env bash
set -euo pipefail

WEB="apps/web"
PAGE="$WEB/src/app/contributions/new/page.tsx"
ADMIN_ROUTE="$WEB/src/app/api/admin/usage/summary/route.ts"

[ -f "$PAGE" ] || { echo "✗ Datei nicht gefunden: $PAGE"; exit 1; }

cp "$PAGE" "$PAGE.bak.$(date +%s)"
echo "• Backup erstellt: $PAGE.bak.$(date +%s)"

# Node-Transformer inline ausführen
/usr/bin/env node <<'NODE'
const fs = require('fs');
const path = require('path');

const page = path.resolve('apps/web/src/app/contributions/new/page.tsx');
let src = fs.readFileSync(page, 'utf8');

let changed = false;

// 1) activeClaim + canShowPanels + Index-Klemmung
{
  const re = /const\s+activeClaim\s*=\s*claims\[activeClaimIdx\];?/;
  if (re.test(src)) {
    src = src.replace(re,
`const activeClaim = (claims && claims[activeClaimIdx]) ?? null;
const canShowPanels = Boolean(showPanels && !analyzing && activeClaim && (activeClaim as any).text);

// Index klemmen, falls sich die Anzahl der Claims ändert
React.useEffect(() => {
  if (activeClaimIdx > claims.length - 1) {
    setActiveClaimIdx(Math.max(0, claims.length - 1));
  }
}, [claims.length, activeClaimIdx]);`);
    changed = true;
    console.log('✓ activeClaim/canShowPanels + Index-Klemmung gesetzt');
  } else {
    // Falls bereits vorhanden, prüfen wir nur auf canShowPanels
    if (!/canShowPanels/.test(src)) {
      console.log('! Hinweis: activeClaim-Zeile nicht gefunden – evtl. schon gepatcht.');
    } else {
      console.log('• canShowPanels bereits vorhanden – übersprungen.');
    }
  }
}

// 2) ClaimPanelsGate-Block → sichere Bedingung
{
  const reBlock = /<ClaimPanelsGate[\s\S]*?<\/ClaimPanelsGate>/m;
  if (reBlock.test(src)) {
    src = src.replace(
      reBlock,
`{canShowPanels && activeClaim && (activeClaim as any).text && (
  <>
    <StanceSpectrum claimText={(activeClaim as any).text} />
    <ObjectionCollector />
    <CounterSynth text={(activeClaim as any).text} />
  </>
)}`);
    changed = true;
    console.log('✓ ClaimPanelsGate Block durch sichere Bedingung ersetzt');
  } else {
    console.log('• Kein <ClaimPanelsGate> Block gefunden – übersprungen.');
  }
}

// 3) ClaimPanelsGate-Import entfernen, wenn nicht mehr genutzt
{
  const importLine = /import\s+ClaimPanelsGate\s+from\s+"@\/ui\/ClaimPanelsGate";\s*\n/;
  if (importLine.test(src) && !/ClaimPanelsGate\s*\(/.test(src) && !/<ClaimPanelsGate/.test(src)) {
    src = src.replace(importLine, '');
    changed = true;
    console.log('✓ Unbenutzten ClaimPanelsGate-Import entfernt');
  }
}

if (changed) {
  fs.writeFileSync(page, src, 'utf8');
  console.log('✔ Datei aktualisiert:', page);
} else {
  console.log('• Keine relevanten Änderungen am Page-File nötig.');
}

// 4) Admin-Usage-Stub schreiben, falls kein POST exportiert ist
const adminRoute = path.resolve('apps/web/src/app/api/admin/usage/summary/route.ts');
let needStub = true;
if (fs.existsSync(adminRoute)) {
  const r = fs.readFileSync(adminRoute, 'utf8');
  if (/export\s+async\s+function\s+POST/.test(r)) needStub = false;
}
if (needStub) {
  fs.mkdirSync(path.dirname(adminRoute), { recursive: true });
  fs.writeFileSync(adminRoute,
`import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json({ ok: true, items: [], note: "usage summary stub" }, { status: 200 });
}
`, 'utf8');
  console.log('✓ Admin-Usage-Stub geschrieben:', adminRoute);
} else {
  console.log('• Admin-Usage-Route hat bereits einen POST-Handler – übersprungen.');
}
NODE

echo "— Fertig."
