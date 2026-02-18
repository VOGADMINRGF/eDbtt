"use client";

import Link from "next/link";

export default function AdminMembershipsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">Mitgliedschaften</h1>

      <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 text-sm text-[rgb(var(--muted))] shadow-sm">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">Deaktiviert</p>
        <p className="mt-2">
          eDebatte bietet keine Mitgliedschaften. Verbindliche Zahlungen laufen ueber die
          VoiceOpenGov-Initiative und werden im Support-Ledger verwaltet.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin/support"
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
          >
            Zum Support Ledger
          </Link>
          <Link
            href="/admin/campaigns"
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-xs font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
          >
            Zu Kampagnen
          </Link>
        </div>
      </div>
    </div>
  );
}
