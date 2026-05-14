"use client";

import { useState, useTransition } from "react";
import type { PaidDashboardEntitlement } from "@features/region";

type Props = {
  initialEntitlements: PaidDashboardEntitlement[];
};

const STATUS_OPTIONS = ["trial", "active", "suspended", "revoked"] as const;

export function AdminEntitlementsClient({ initialEntitlements }: Props) {
  const [entitlements, setEntitlements] = useState(initialEntitlements);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [createForm, setCreateForm] = useState({
    organizationId: "",
    regionId: "",
    planId: "kommune-aktivierung",
    status: "trial",
    scope: "region",
    source: "admin_grant",
  });

  async function refreshEntitlements() {
    const res = await fetch("/api/admin/entitlements", { cache: "no-store" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body?.ok) {
      throw new Error(body?.error ?? "entitlements_fetch_failed");
    }
    setEntitlements(Array.isArray(body.entitlements) ? body.entitlements : []);
  }

  function updateStatus(id: string, status: string) {
    startTransition(async () => {
      setNotice(null);
      setError(null);
      try {
        const res = await fetch(`/api/admin/entitlements/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status, note: "Admin-Freischaltung aktualisiert" }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body?.ok) {
          throw new Error(body?.error ?? "entitlement_update_failed");
        }
        await refreshEntitlements();
        setNotice(`Entitlement aktualisiert: ${status}`);
      } catch (updateError) {
        setError(updateError instanceof Error ? updateError.message : "entitlement_update_failed");
      }
    });
  }

  function createEntitlement() {
    startTransition(async () => {
      setNotice(null);
      setError(null);
      try {
        const res = await fetch("/api/admin/entitlements", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(createForm),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body?.ok) {
          throw new Error(body?.error ?? "entitlement_create_failed");
        }
        await refreshEntitlements();
        setNotice("Entitlement angelegt. Keine Zahlungsabwicklung ausgelöst.");
      } catch (createError) {
        setError(createError instanceof Error ? createError.message : "entitlement_create_failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">Pilot- oder Admin-Grant setzen</p>
        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
          Diese Eingaben erzeugen nur eine serverseitige Freischaltung. Kein Checkout, keine Abbuchung, keine Rechnung.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            value={createForm.organizationId}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, organizationId: event.target.value }))}
            placeholder="organizationId"
            className="rounded-2xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
          />
          <input
            value={createForm.regionId}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, regionId: event.target.value }))}
            placeholder="regionId (optional)"
            className="rounded-2xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
          />
          <input
            value={createForm.planId}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, planId: event.target.value }))}
            placeholder="planId"
            className="rounded-2xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
          />
          <select
            value={createForm.status}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, status: event.target.value }))}
            className="rounded-2xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
          >
            <option value="trial">trial</option>
            <option value="active">active</option>
          </select>
          <select
            value={createForm.scope}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, scope: event.target.value }))}
            className="rounded-2xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
          >
            <option value="region">region</option>
            <option value="organization">organization</option>
            <option value="organization_unit">organization_unit</option>
          </select>
          <select
            value={createForm.source}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, source: event.target.value }))}
            className="rounded-2xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
          >
            <option value="admin_grant">admin_grant</option>
            <option value="pilot_grant">pilot_grant</option>
            <option value="manual_contract">manual_contract</option>
            <option value="order_request">order_request</option>
          </select>
        </div>
        <button
          type="button"
          disabled={isPending}
          onClick={createEntitlement}
          className="mt-4 rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
        >
          Entitlement anlegen
        </button>
      </section>

      {entitlements.length === 0 ? (
        <p className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 text-sm text-[rgb(var(--muted))]">
          Keine aktiven oder vorbereiteten Entitlements. Pilot- und Admin-Grants bleiben manuelle Freischaltungen
          ohne Zahlungsabwicklung.
        </p>
      ) : (
        entitlements.map((entitlement) => (
          <article
            key={entitlement.id}
            className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">{entitlement.organizationName}</p>
                <p className="text-xs text-[rgb(var(--muted))]">
                  {entitlement.planLabel} · {entitlement.status} · {entitlement.scope}
                </p>
                <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                  noAutoBilling: {entitlement.noAutoBilling ? "true" : "false"} · noAutoCharge:{" "}
                  {entitlement.noAutoCharge ? "true" : "false"}
                </p>
              </div>
              <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                {entitlement.regionId ?? "ohne Region"}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={isPending}
                  onClick={() => updateStatus(entitlement.id, status)}
                  className="rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
                >
                  {status}
                </button>
              ))}
            </div>
          </article>
        ))
      )}
    </div>
  );
}
