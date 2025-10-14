#!/usr/bin/env bash
set -euo pipefail

APP="apps/web"
SRC="$APP/src"

mkdir -p "$SRC/app/admin" "$SRC/app/reports" "$SRC/app/contributions" "$SRC/utils"

# Helper absUrl (falls fehlt)
if [ ! -f "$SRC/utils/serverBaseUrl.ts" ]; then
cat > "$SRC/utils/serverBaseUrl.ts" <<'TS'
import { headers } from "next/headers";
export function serverBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_BASE_URL;
  if (env && /^https?:\/\//i.test(env)) return env.replace(/\/$/, "");
  const h = headers();
  const proto = h.get("x-forwarded-proto") || "http";
  const host  = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}
export function absUrl(path: string): string {
  const base = serverBaseUrl();
  if (/^https?:\/\//i.test(path)) return path;
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}
TS
echo "✓ wrote utils/serverBaseUrl.ts"
fi

# /admin – sauber (richtige Klammerung!)
cat > "$SRC/app/admin/page.tsx" <<'TS'
import "server-only";
import Link from "next/link";
import { absUrl } from "@/utils/serverBaseUrl";

async function getSummary() {
  const r = await fetch(absUrl("/api/admin/analytics/summary"), { cache: "no-store" });
  return r.ok ? r.json() : null;
}
async function getErrors() {
  const r = await fetch(absUrl("/api/admin/errors/last24"), { cache: "no-store" });
  return r.ok ? r.json() : [];
}

export default async function AdminPage() {
  const [sum, errs] = await Promise.all([getSummary(), getErrors()]);
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Admin</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded p-4">
          <div className="font-semibold mb-2">System</div>
          <ul className="text-sm space-y-1">
            <li><Link href="/admin/system" className="underline">SystemMatrix</Link></li>
            <li><Link href="/admin/telemetry" className="underline">Telemetrie</Link></li>
            <li><Link href="/admin/users" className="underline">Benutzer</Link></li>
          </ul>
        </div>
        <div className="border rounded p-4">
          <div className="font-semibold mb-2">Analytics</div>
          {sum ? (
            <ul className="text-sm">
              <li>Contributions: {sum.totals.contribs}</li>
              <li>Statements: {sum.totals.statements}</li>
              <li>Reports: {sum.totals.reports}</li>
              <li>Votes: {sum.totals.votes}</li>
            </ul>
          ) : <div className="text-sm text-gray-500">Keine Daten.</div>}
        </div>
        <div className="border rounded p-4">
          <div className="font-semibold mb-2">Errors (24h)</div>
          <ul className="text-sm list-disc pl-5">
            {(Array.isArray(errs) ? errs : []).slice(0,5).map((e: any) => (
              <li key={e.id}><Link className="underline" href={`/admin/errors/${e.id}`}>{e.msg || e.name || "Error"}</Link></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
TS
echo "✓ fixed app/admin/page.tsx"

# /reports – sicher mit absUrl
cat > "$SRC/app/reports/page.tsx" <<'TS'
import "server-only";
import { absUrl } from "@/utils/serverBaseUrl";

async function getReports() {
  const r = await fetch(absUrl("/api/reports"), { cache: "no-store" });
  return r.ok ? r.json() : [];
}

export default async function ReportsPage() {
  const list = await getReports();
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {list.map((r: any) => (
          <div key={r.id} className="border rounded p-4">
            <div className="font-semibold">{r.title}</div>
            <div className="text-xs text-gray-500">{new Date(r.updatedAt||r.createdAt).toLocaleString()}</div>
            <p className="text-sm mt-2 line-clamp-3">{r.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
TS
echo "✓ fixed app/reports/page.tsx"

# /contributions – sicher mit absUrl
cat > "$SRC/app/contributions/page.tsx" <<'TS'
import "server-only";
import { absUrl } from "@/utils/serverBaseUrl";

async function getContribs() {
  const r = await fetch(absUrl("/api/contributions"), { cache: "no-store" });
  return r.ok ? r.json() : [];
}

export default async function ContributionsPage() {
  const items = await getContribs();
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Beiträge</h1>
      <div className="space-y-3">
        {items.map((c: any) => (
          <div key={c.id} className="border rounded p-3 bg-white/60">
            <div className="font-semibold">{c.title || c.text?.slice(0,80)}</div>
            <div className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleString()}</div>
            <p className="text-sm mt-2">{c.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
TS
echo "✓ fixed app/contributions/page.tsx"

# .env.local absichern (für Base URL)
ENV="$APP/.env.local"
touch "$ENV"
if ! grep -q '^NEXT_PUBLIC_BASE_URL=' "$ENV"; then
  echo 'NEXT_PUBLIC_BASE_URL=http://localhost:3000' >> "$ENV"
  echo "✓ set NEXT_PUBLIC_BASE_URL in $ENV"
fi

# Hinweis auf Rest-Treffer (Server-Dateien ohne 'use client')
echo "— scanning server files for leftover fetch(\"/api/…\")"
grep -Rnl --include='*.ts*' 'fetch("/api/' "$SRC" \
  | xargs -I{} awk 'NR<=5 && /"use client"/{found=1} END{if(!found) print FILENAME}' {} 2>/dev/null \
  | sed '/^$/d' || true

echo "— done. Restart dev: pnpm dev"
