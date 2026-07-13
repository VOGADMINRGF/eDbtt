"use client";

import Link from "next/link";
import { getMembershipActivationTruth } from "@features/pricing";

const ACTIVATION_TRUTH = getMembershipActivationTruth("de");

export default function AdminMembershipsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">Mitgliedschafts-Support</h1>

      <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 text-sm text-[rgb(var(--muted))] shadow-sm">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">Manueller Supportpfad</p>
        <p className="mt-2">
          {ACTIVATION_TRUTH.adminMembershipSupportHint}
        </p>
        <p className="mt-2">{ACTIVATION_TRUTH.adminMembershipManualActionsHint}</p>
        <p className="mt-2">{ACTIVATION_TRUTH.legacySupportSurfaceHint}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dashboard/admin/memberships"
            className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:opacity-90"
          >
            Offene Beiträge prüfen
          </Link>
          <Link
            href="/admin/pricing/orders"
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-xs font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
          >
            Zu Bestellungen &amp; Freigaben
          </Link>
          <Link
            href="/admin/entitlements"
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-xs font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
          >
            Zu Freischaltungen
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin/support"
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-xs font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
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
