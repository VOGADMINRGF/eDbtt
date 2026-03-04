"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AdminErrorPanel } from "@/components/admin/AdminErrorPanel";

const ROLE_OPTIONS = ["editor", "fact_checker", "publisher", "analyst", "org_admin"] as const;
const STATUS_OPTIONS = ["active", "invited", "disabled"] as const;

type OrgDetail = {
  id: string;
  slug: string;
  name: string;
  archivedAt?: string | null;
};

type OrgMember = {
  id: string;
  userId: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  invitedEmail?: string | null;
  inviteExpiresAt?: string | null;
  createdAt?: string | null;
};

export default function AdminOrgDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = String(params.id || "");
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [memberQuery, setMemberQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [memberLoading, setMemberLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<(typeof ROLE_OPTIONS)[number]>("editor");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    const qParam = searchParams.get("q") ?? "";
    if (qParam) setMemberQuery(qParam);
  }, [searchParams]);

  useEffect(() => {
    let active = true;
    async function loadOrg() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/orgs/${orgId}`, { cache: "no-store" });
        if (res.status === 401) {
          router.replace(`/login?next=/admin/orgs/${orgId}`);
          return;
        }
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || res.statusText);
        }
        const body = await res.json();
        if (active) setOrg(body.item ?? null);
      } catch (err: any) {
        if (active) setError(err?.message ?? "org_load_failed");
      } finally {
        if (active) setLoading(false);
      }
    }
    if (orgId) loadOrg();
    return () => {
      active = false;
    };
  }, [orgId, router]);

  useEffect(() => {
    let active = true;
    async function loadMembers() {
      setMemberLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (memberQuery) params.set("q", memberQuery);
        const res = await fetch(`/api/admin/orgs/${orgId}/members?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || res.statusText);
        }
        const body = await res.json();
        if (active) setMembers(body.items ?? []);
      } catch (err: any) {
        if (active) setError(err?.message ?? "members_load_failed");
      } finally {
        if (active) setMemberLoading(false);
      }
    }
    if (orgId) loadMembers();
    return () => {
      active = false;
    };
  }, [orgId, memberQuery]);

  const filteredMembers = useMemo(() => members, [members]);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orgs/${orgId}/members/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error || "invite_failed");
      }
      setInviteEmail("");
      setMemberQuery("");
    } catch (err: any) {
      setError(err?.message ?? "invite_failed");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleMemberUpdate = async (memberId: string, patch: Partial<OrgMember>) => {
    setStatusLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orgs/${orgId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: patch.role, status: patch.status }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error || "update_failed");
      }
    } catch (err: any) {
      setError(err?.message ?? "update_failed");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDisable = async (memberId: string) => {
    setStatusLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orgs/${orgId}/members/${memberId}/disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "admin_disabled" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error || "disable_failed");
      }
    } catch (err: any) {
      setError(err?.message ?? "disable_failed");
    } finally {
      setStatusLoading(false);
    }
  };

  const handleArchiveToggle = async () => {
    if (!org) return;
    setStatusLoading(true);
    setError(null);
    try {
      const archivedAt = org.archivedAt ? null : new Date().toISOString();
      const res = await fetch(`/api/admin/orgs/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archivedAt }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error || "archive_failed");
      }
      setOrg(body.item ?? org);
    } catch (err: any) {
      setError(err?.message ?? "archive_failed");
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Admin · Orgs</p>
          <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">{org?.name ?? "Organisation"}</h1>
          <p className="text-sm text-[rgb(var(--muted))]">Slug: {org?.slug ?? "—"}</p>
        </div>
        <button
          className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold"
          onClick={handleArchiveToggle}
          disabled={statusLoading}
        >
          {org?.archivedAt ? "Reaktivieren" : "Archivieren"}
        </button>
      </header>

      {error && (<AdminErrorPanel error={error} />)}

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Mitglieder einladen</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="E-Mail"
            className="rounded-2xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as (typeof ROLE_OPTIONS)[number])}
            className="rounded-2xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <button
            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            onClick={handleInvite}
            disabled={inviteLoading}
          >
            {inviteLoading ? "Sende..." : "Invite senden"}
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Mitglieder</h2>
          <input
            value={memberQuery}
            onChange={(e) => setMemberQuery(e.target.value)}
            placeholder="Suchen"
            className="rounded-2xl border border-[rgb(var(--border))] px-3 py-2 text-sm"
          />
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-[rgb(var(--border))]">
          <table className="min-w-full divide-y divide-[rgb(var(--border))] text-sm">
            <thead className="bg-[rgb(var(--bg))]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Person</th>
                <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Rolle</th>
                <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-[rgb(var(--muted))]">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {memberLoading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-[rgb(var(--muted))]">
                    Laedt Mitglieder...
                  </td>
                </tr>
              )}
              {!memberLoading && filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-[rgb(var(--muted))]">
                    Keine Mitglieder gefunden.
                  </td>
                </tr>
              )}
              {!memberLoading &&
                filteredMembers.map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[rgb(var(--fg))]">
                        {member.name || member.email || member.invitedEmail || "—"}
                      </div>
                      <div className="text-xs text-[rgb(var(--muted))]">{member.email ?? member.invitedEmail ?? ""}</div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        defaultValue={member.role}
                        className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs"
                        onChange={(e) => handleMemberUpdate(member.id, { role: e.target.value })}
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        defaultValue={member.status}
                        className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs"
                        onChange={(e) => handleMemberUpdate(member.id, { status: e.target.value })}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                      {member.inviteExpiresAt && (
                        <div className="text-[10px] text-[rgb(var(--muted))]">bis {member.inviteExpiresAt.slice(0, 10)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs"
                        onClick={() => handleDisable(member.id)}
                        disabled={statusLoading}
                      >
                        Deaktivieren
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {loading && (
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 text-sm text-[rgb(var(--muted))]">
          Laedt Organisation...
        </div>
      )}
    </div>
  );
}