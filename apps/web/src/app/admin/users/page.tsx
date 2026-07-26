"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { EDEBATTE_PACKAGES_WITH_NONE, getEdebatePackageLabel } from "@/config/edebatte";
import { ACCESS_TIER_CONFIG } from "@core/access/accessTiers";
import type { AccessTier } from "@features/pricing/types";

const ACCESS_TIER_OPTIONS = Object.keys(ACCESS_TIER_CONFIG) as AccessTier[];

type AdminUser = {
  id: string;
  email: string;
  name?: string | null;
  roles: string[];
  packageCode?: string | null;
  membershipStatus?: string | null;
  newsletterOptIn: boolean;
  accessTier?: AccessTier | null;
  planCode?: string | null;
  createdAt?: string | null;
  lastSeenAt?: string | null;
  lastLoginAt?: string | null;
  emailVerified: boolean;
  credentialsPresent: boolean;
  twoFactorEnabled: boolean;
  accountDisabled: boolean;
  accountPurpose: string | null;
  isQaAccount: boolean;
};

type UsersResponse = {
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [pkg, setPkg] = useState("");
  const [newsletter, setNewsletter] = useState("");
  const [activeDays, setActiveDays] = useState<number | "">("");
  const [createdDays, setCreatedDays] = useState<number | "">("");
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [viewerRoles, setViewerRoles] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [dangerConfirmEmail, setDangerConfirmEmail] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createNotice, setCreateNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [accessError, setAccessError] = useState<string | null>(null);
  const actionInFlightRef = useRef(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    name: "",
    password: "",
    roles: ["user"],
    accessTier: "citizenBasic" as AccessTier,
    newsletterOptIn: false,
    sendVerification: true,
    sendPasswordLink: true,
  });

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.pageSize));
  }, [data]);

  useEffect(() => {
    // initial filter from URL
    const roleParam = searchParams.get("role") ?? "";
    const pkgParam = searchParams.get("package") ?? "";
    const newsletterParam = searchParams.get("newsletter") ?? "";
    const activeDaysParam = searchParams.get("activeDays");
    const createdDaysParam = searchParams.get("createdDays");
    const qParam = searchParams.get("q") ?? "";
    if (roleParam) setRole(roleParam);
    if (pkgParam) setPkg(pkgParam);
    if (newsletterParam) setNewsletter(newsletterParam);
    if (qParam) setQuery(qParam);
    if (activeDaysParam) setActiveDays(Number(activeDaysParam) || "");
    if (createdDaysParam) setCreatedDays(Number(createdDaysParam) || "");
  }, [searchParams]);

  useEffect(() => {
    let alive = true;
    async function loadMe() {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.status === 401 || res.status === 403) {
        router.replace("/login?next=/admin/users");
        return;
      }
      const body = await res.json().catch(() => ({}));
      const roles: string[] = Array.isArray(body?.user?.roles) ? body.user.roles : [];
      if (alive) {
        setIsSuperadmin(roles.includes("superadmin"));
        setViewerRoles(roles);
      }
    }
    loadMe();
    return () => {
      alive = false;
    };
  }, [router]);

  const canCreate = viewerRoles.includes("admin") || viewerRoles.includes("superadmin");

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setAccessError(null);
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (role) params.set("role", role);
      if (pkg) params.set("package", pkg);
      if (newsletter) params.set("newsletter", newsletter);
      if (activeDays) params.set("activeDays", String(activeDays));
      if (createdDays) params.set("createdDays", String(createdDays));
      params.set("page", String(page));
      params.set("pageSize", "25");
      const res = await fetch(`/api/admin/dashboard/users?${params.toString()}`, { cache: "no-store" });
      if (res.status === 401) {
        router.replace("/login?next=/admin/users");
        return;
      }
      if (res.status === 403) {
        const body = await res.json().catch(() => ({}));
        if (body?.error === "two_factor_required") {
          router.replace("/login?next=/admin/users");
          return;
        }
        if (active) setAccessError("Kein Zugriff auf die Admin-Userliste.");
        setLoading(false);
        return;
      }
      const body = (await res.json()) as UsersResponse;
      if (active) {
        setData(body);
        setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [query, role, pkg, newsletter, activeDays, createdDays, page, router, refreshToken]);

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setSaveError(null);
    setSaveNotice(null);
    try {
      const res = await fetch("/api/admin/dashboard/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selected.id,
          roles: selected.roles,
          packageCode: selected.packageCode,
          membershipStatus: selected.membershipStatus,
          newsletterOptIn: selected.newsletterOptIn,
          planCode: selected.accessTier,
          accessTier: selected.accessTier,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(String(body?.error || "save_failed"));
      }
      setSaveNotice("Nutzer aktualisiert.");
      setSelected(null);
      setPage(1);
      setRefreshToken((prev) => prev + 1);
    } catch (err: any) {
      setSaveError(mapAdminUserError(err?.message));
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async () => {
    setCreateLoading(true);
    setCreateError(null);
    setCreateNotice(null);
    try {
      const trimmedPassword = createForm.password.trim();
      const payload: Record<string, unknown> = {
        email: createForm.email,
        name: createForm.name,
        roles: createForm.roles,
        accessTier: createForm.accessTier,
        newsletterOptIn: createForm.newsletterOptIn,
        sendVerification: createForm.sendVerification,
        sendPasswordLink: createForm.sendPasswordLink,
      };
      if (trimmedPassword) {
        payload.password = trimmedPassword;
      }
      const res = await fetch("/api/admin/dashboard/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (body?.partial && body?.userCreated) {
        setCreateOpen(false);
        const notices = ["Nutzer angelegt."];
        if (body?.verificationMailQueued) notices.push("Verifikations-E-Mail eingeplant.");
        if (body?.passwordMailQueued) notices.push("Passwort-Setz-Link eingeplant.");
        notices.push("Der Versand ist fail-closed abgebrochen. Bitte die Lifecycle-Aktionen nach der Korrektur erneut auslösen.");
        setCreateNotice(notices.join(" "));
        setCreateForm({
          email: "",
          name: "",
          password: "",
          roles: ["user"],
          accessTier: "citizenBasic",
          newsletterOptIn: false,
          sendVerification: true,
          sendPasswordLink: true,
        });
        setRefreshToken((prev) => prev + 1);
        return;
      }
      if (!res.ok || !body?.ok) {
        throw new Error(String(body?.error || "create_failed"));
      }
      setCreateOpen(false);
      const notices = ["Nutzer angelegt."];
      if (body?.verificationMailQueued) notices.push("Verifikations-E-Mail eingeplant.");
      if (body?.passwordMailQueued) notices.push("Passwort-Setz-Link eingeplant.");
      setCreateNotice(notices.join(" "));
      setCreateForm({
        email: "",
        name: "",
        password: "",
        roles: ["user"],
        accessTier: "citizenBasic",
        newsletterOptIn: false,
        sendVerification: true,
        sendPasswordLink: true,
      });
      setRefreshToken((prev) => prev + 1);
    } catch (err: any) {
      setCreateError(mapAdminUserError(err?.message));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUserAction = async (
    action:
      | "resend_verification"
      | "send_password_link"
      | "disable_account"
      | "reactivate_account"
      | "hard_delete_qa",
  ) => {
    if (!selected || actionInFlightRef.current) return;
    actionInFlightRef.current = true;
    setActionLoading(action);
    setActionError(null);
    setActionNotice(null);
    try {
      const actionId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${selected.id}:${action}:${Date.now()}`;
      const res = await fetch(`/api/admin/dashboard/users/${selected.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          actionId,
          confirmEmail: action === "hard_delete_qa" ? dangerConfirmEmail : undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        throw new Error(String(body?.error || "action_failed"));
      }
      if (body?.user) {
        setSelected(body.user as AdminUser);
      }
      setActionNotice(mapAdminActionSuccess(action, body));
      setRefreshToken((prev) => prev + 1);
      if (action === "hard_delete_qa") {
        setDangerConfirmEmail("");
      }
    } catch (err: any) {
      setActionError(mapAdminUserError(err?.message));
    } finally {
      actionInFlightRef.current = false;
      setActionLoading(null);
    }
  };

  if (accessError) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {accessError}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="sr-only">Admin Nutzer</h1>
      <div className="flex flex-wrap items-center gap-2 rounded-3xl bg-[rgb(var(--card))] p-4 shadow ring-1 ring-[rgb(var(--border))]">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suche (E-Mail / Name)"
          className="w-48 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1.5 text-sm focus:border-sky-300 focus:outline-none"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1.5 text-sm"
        >
          <option value="">Rolle: alle</option>
          <option value="user">user</option>
          <option value="admin">admin</option>
          <option value="superadmin">superadmin</option>
          <option value="moderator">moderator</option>
        </select>
        <select
          value={pkg}
          onChange={(e) => setPkg(e.target.value)}
          className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1.5 text-sm"
        >
          <option value="">Paket: alle</option>
          {EDEBATTE_PACKAGES_WITH_NONE.map((p) => (
            <option key={p} value={p}>
              {getEdebatePackageLabel(p)}
            </option>
          ))}
        </select>
        <select
          value={newsletter}
          onChange={(e) => setNewsletter(e.target.value)}
          className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1.5 text-sm"
        >
          <option value="">Newsletter: alle</option>
          <option value="true">nur Opt-in</option>
          <option value="false">kein Opt-in</option>
        </select>
        <input
          type="number"
          min={1}
          value={activeDays}
          onChange={(e) => setActiveDays(e.target.value ? Number(e.target.value) : "")}
          placeholder="Aktiv in letzten Tagen"
          className="w-44 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1.5 text-sm"
        />
        <input
          type="number"
          min={1}
          value={createdDays}
          onChange={(e) => setCreatedDays(e.target.value ? Number(e.target.value) : "")}
          placeholder="Neu in letzten Tagen"
          className="w-44 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={() => {
            if (!canCreate) return;
            setCreateError(null);
            setCreateNotice(null);
            setCreateOpen(true);
          }}
          className="rounded-full bg-gradient-to-r from-[rgb(var(--grad-from))] to-[rgb(var(--grad-to))] px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
          disabled={!canCreate}
          title={canCreate ? "Nutzer anlegen" : "Nur Admins dürfen Nutzer anlegen"}
        >
          + Nutzer anlegen
        </button>
        <button
          type="button"
          className="rounded-full border border-[rgb(var(--border))] px-4 py-1.5 text-sm font-semibold text-[rgb(var(--muted))] disabled:opacity-60"
          disabled
          aria-disabled="true"
          title="CSV-Import ist in diesem Slice bewusst noch nicht freigegeben"
        >
          Import (folgt separat)
        </button>
      </div>
      {createNotice && <p className="text-xs text-emerald-700">{createNotice}</p>}
      {saveNotice && <p className="text-xs text-emerald-700">{saveNotice}</p>}
      {saveError && <p className="text-xs text-rose-600">{saveError}</p>}
      {actionNotice && <p className="text-xs text-emerald-700">{actionNotice}</p>}
      {actionError && <p className="text-xs text-rose-600">{actionError}</p>}
      {!canCreate && (
        <p className="text-xs text-[rgb(var(--muted))]">
          Hinweis: Nutzer anlegen ist nur für Admins freigeschaltet.
        </p>
      )}
      <p className="text-xs text-[rgb(var(--muted))]">
        CSV-Import bleibt bis zu einem eigenen freigegebenen Invite-/Import-Slice bewusst deaktiviert.
      </p>

      <div className="overflow-hidden rounded-3xl bg-[rgb(var(--card))] shadow ring-1 ring-[rgb(var(--border))]">
        <table className="min-w-full divide-y divide-[rgb(var(--border))] text-sm">
          <thead className="bg-[rgb(var(--bg))]">
            <tr>
              <th className="px-3 py-2 text-left font-semibold text-[rgb(var(--muted))]">E-Mail</th>
              <th className="px-3 py-2 text-left font-semibold text-[rgb(var(--muted))]">Name</th>
              <th className="px-3 py-2 text-left font-semibold text-[rgb(var(--muted))]">Rollen</th>
              <th className="px-3 py-2 text-left font-semibold text-[rgb(var(--muted))]">Tier</th>
              <th className="px-3 py-2 text-left font-semibold text-[rgb(var(--muted))]">Paket</th>
              <th className="px-3 py-2 text-left font-semibold text-[rgb(var(--muted))]">Newsletter</th>
              <th className="px-3 py-2 text-left font-semibold text-[rgb(var(--muted))]">Status</th>
              <th className="px-3 py-2 text-left font-semibold text-[rgb(var(--muted))]">Erstellt</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgb(var(--border))]">
            {loading && (
              <tr>
                <td colSpan={9} className="px-3 py-4 text-center text-[rgb(var(--muted))]">
                  Lädt …
                </td>
              </tr>
            )}
            {!loading && (!data?.items || data.items.length === 0) && (
              <tr>
                <td colSpan={9} className="px-3 py-4 text-center text-[rgb(var(--muted))]">
                  Keine Nutzer für den aktuellen Filter gefunden.
                </td>
              </tr>
            )}
            {!loading &&
              data?.items?.map((u) => (
                <tr key={u.id} className="hover:bg-[rgb(var(--bg))]">
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="px-3 py-2">{u.name ?? "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <span key={r} className="rounded-full bg-[rgb(var(--bg))] px-2 py-0.5 text-xs text-[rgb(var(--muted))]">
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-[rgb(var(--bg))] px-2 py-0.5 text-xs text-[rgb(var(--muted))]">
                      {u.accessTier ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-[rgb(var(--bg))] px-2 py-0.5 text-xs text-[rgb(var(--muted))]">
                      {getEdebatePackageLabel(u.packageCode ?? "none")}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className="rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: u.newsletterOptIn ? "#ecfdf3" : "#f8fafc", color: u.newsletterOptIn ? "#15803d" : "#475569" }}>
                      {u.newsletterOptIn ? "Opt-in" : "Kein Opt-in"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <StatusBadge tone={u.accountDisabled ? "rose" : u.emailVerified ? "emerald" : "amber"}>
                        {u.accountDisabled ? "Deaktiviert" : u.emailVerified ? "E-Mail bestätigt" : "E-Mail offen"}
                      </StatusBadge>
                      <StatusBadge tone={u.credentialsPresent ? "slate" : "amber"}>
                        {u.credentialsPresent ? "Credentials" : "Kein Credential"}
                      </StatusBadge>
                      <StatusBadge tone={u.twoFactorEnabled ? "sky" : "slate"}>
                        {u.twoFactorEnabled ? "2FA aktiv" : "2FA aus"}
                      </StatusBadge>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-[rgb(var(--muted))]">{u.createdAt?.slice(0, 10) ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      className="text-sm font-semibold text-sky-700 underline-offset-2 hover:underline"
                      onClick={() => {
                        setSelected(u);
                        setActionError(null);
                        setActionNotice(null);
                        setDangerConfirmEmail("");
                      }}
                    >
                      Bearbeiten
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-[rgb(var(--muted))]">
        <span>
          Seite {page} / {totalPages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-full border border-[rgb(var(--border))] px-3 py-1 disabled:opacity-50"
          >
            Zurück
          </button>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-full border border-[rgb(var(--border))] px-3 py-1 disabled:opacity-50"
          >
            Weiter
          </button>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-[rgb(var(--card))] p-5 shadow-[0_32px_90px_rgba(15,23,42,0.45)] ring-1 ring-[rgb(var(--border))] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Bearbeiten</p>
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">{selected.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--bg))] text-sm font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Lifecycle</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <StatusBadge tone={selected.accountDisabled ? "rose" : "emerald"}>
                  {selected.accountDisabled ? "Konto deaktiviert" : "Konto aktiv"}
                </StatusBadge>
                <StatusBadge tone={selected.emailVerified ? "emerald" : "amber"}>
                  {selected.emailVerified ? "E-Mail bestätigt" : "E-Mail unbestätigt"}
                </StatusBadge>
                <StatusBadge tone={selected.credentialsPresent ? "slate" : "amber"}>
                  {selected.credentialsPresent ? "Credentials vorhanden" : "Kein Credential"}
                </StatusBadge>
                <StatusBadge tone={selected.twoFactorEnabled ? "sky" : "slate"}>
                  {selected.twoFactorEnabled ? "2FA aktiv" : "2FA nicht aktiv"}
                </StatusBadge>
                {selected.isQaAccount && <StatusBadge tone="amber">QA-/Testkonto</StatusBadge>}
                {selected.accountPurpose && !selected.isQaAccount && (
                  <StatusBadge tone="slate">Zweck: {selected.accountPurpose}</StatusBadge>
                )}
              </div>
              <div className="mt-3 grid gap-1 text-xs text-[rgb(var(--muted))]">
                <p>Letzter Login: {formatAdminTimestamp(selected.lastLoginAt)}</p>
                <p>Letzte Sichtung: {formatAdminTimestamp(selected.lastSeenAt)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[rgb(var(--muted))]">Rollen</label>
              <div className="flex flex-wrap gap-2">
                {["user", "moderator", "admin", "staff", "creator", ...(isSuperadmin ? ["superadmin"] : [])].map((r) => {
                  const active = selected.roles.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setSelected((prev) =>
                          prev
                            ? {
                                ...prev,
                                roles: active ? prev.roles.filter((x) => x !== r) : [...prev.roles, r],
                              }
                            : prev,
                        );
                      }}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        active ? "bg-sky-100 text-sky-800 ring-1 ring-sky-200" : "bg-[rgb(var(--bg))] text-[rgb(var(--muted))]"
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[rgb(var(--muted))]">Access Tier</label>
              <select
                value={selected.accessTier ?? "citizenBasic"}
                onChange={(e) =>
                  setSelected((prev) =>
                    prev
                      ? {
                          ...prev,
                          accessTier: e.target.value as AccessTier,
                        }
                      : prev,
                  )
                }
                className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
              >
                {ACCESS_TIER_OPTIONS.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[rgb(var(--muted))]">Paket</label>
              <select
                value={selected.packageCode ?? "none"}
                onChange={(e) =>
                  setSelected((prev) => (prev ? { ...prev, packageCode: e.target.value === "none" ? null : e.target.value } : prev))
                }
                className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
              >
                {EDEBATTE_PACKAGES_WITH_NONE.map((p) => (
                  <option key={p} value={p}>
                    {getEdebatePackageLabel(p)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[rgb(var(--muted))]">Newsletter</label>
              <label className="inline-flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
                <input
                  type="checkbox"
                  checked={selected.newsletterOptIn}
                  onChange={(e) => setSelected((prev) => (prev ? { ...prev, newsletterOptIn: e.target.checked } : prev))}
                />
                Opt-in aktiv
              </label>
            </div>

            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                Recovery & Status
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleUserAction("resend_verification")}
                  disabled={actionLoading !== null}
                  className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
                >
                  {actionLoading === "resend_verification" ? "Versende …" : "Verifikationsmail senden"}
                </button>
                <button
                  type="button"
                  onClick={() => handleUserAction("send_password_link")}
                  disabled={actionLoading !== null}
                  className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
                >
                  {actionLoading === "send_password_link" ? "Versende …" : "Passwort-Link senden"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUserAction(selected.accountDisabled ? "reactivate_account" : "disable_account")
                  }
                  disabled={actionLoading !== null}
                  className={`rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
                    selected.accountDisabled ? "bg-emerald-600" : "bg-rose-600"
                  }`}
                >
                  {actionLoading === "disable_account" || actionLoading === "reactivate_account"
                    ? "Speichere …"
                    : selected.accountDisabled
                    ? "Konto reaktivieren"
                    : "Konto deaktivieren"}
                </button>
              </div>
            </div>

            {isSuperadmin && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-700">Danger Zone</p>
                <p className="mt-2 text-sm text-rose-900">
                  QA-Hard-Delete bleibt fail-closed. Nur explizit markierte QA-/Testkonten kommen überhaupt
                  in Frage; bei Referenzen oder Inventarlücken blockiert der Server bewusst.
                </p>
                <div className="mt-3 space-y-2">
                  <label className="text-xs font-semibold text-rose-700">
                    Vollständige E-Mail zur Bestätigung
                  </label>
                  <input
                    value={dangerConfirmEmail}
                    onChange={(e) => setDangerConfirmEmail(e.target.value)}
                    className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm"
                    placeholder={selected.email}
                  />
                  <button
                    type="button"
                    onClick={() => handleUserAction("hard_delete_qa")}
                    disabled={actionLoading !== null}
                    className="rounded-full bg-rose-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {actionLoading === "hard_delete_qa"
                      ? "Prüfe Schutzregeln …"
                      : "QA-Testkonto endgültig löschen"}
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))]"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(14,116,144,0.35)] hover:brightness-105 disabled:opacity-60"
              >
                {saving ? "Speichern …" : "Speichern"}
              </button>
            </div>
          </div>
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-[rgb(var(--card))] p-5 shadow-[0_32px_90px_rgba(15,23,42,0.45)] ring-1 ring-[rgb(var(--border))] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Neuer Nutzer</p>
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">Account anlegen</p>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--bg))] text-sm font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[rgb(var(--muted))]">E-Mail</label>
              <input
                value={createForm.email}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
                placeholder="name@edebatte.org"
              />
              <p className="text-[11px] text-[rgb(var(--muted))]">
                `@edebatte.org` dient hier nur als Formatbeispiel. Angeschrieben wird ausschließlich die
                tatsächlich eingegebene Zieladresse.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[rgb(var(--muted))]">Name</label>
              <input
                value={createForm.name}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
                placeholder="Vor- und Nachname"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[rgb(var(--muted))]">Initiales Passwort</label>
              <div className="flex items-center gap-2">
                <input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                  className="flex-1 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
                  placeholder={createForm.sendPasswordLink ? "wird automatisch erzeugt" : "min. 12 Zeichen, Zahl & Sonderzeichen"}
                  disabled={createForm.sendPasswordLink}
                />
                <button
                  type="button"
                  onClick={() => setCreateForm((prev) => ({ ...prev, password: generatePassword() }))}
                  className="rounded-full border border-[rgb(var(--border))] px-3 py-2 text-xs font-semibold text-[rgb(var(--muted))]"
                  disabled={createForm.sendPasswordLink}
                >
                  Generieren
                </button>
              </div>
              {createForm.sendPasswordLink && (
                <p className="text-[11px] text-[rgb(var(--muted))]">
                  Passwort wird per Link gesetzt; ein Platzhalter wird serverseitig erzeugt.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[rgb(var(--muted))]">Rollen</label>
              <div className="flex flex-wrap gap-2">
                {["user", "moderator", "admin", "staff", "creator", ...(isSuperadmin ? ["superadmin"] : [])].map(
                  (r) => {
                    const active = createForm.roles.includes(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => {
                          setCreateForm((prev) => ({
                            ...prev,
                            roles: active ? prev.roles.filter((x) => x !== r) : [...prev.roles, r],
                          }));
                        }}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          active ? "bg-sky-100 text-sky-800 ring-1 ring-sky-200" : "bg-[rgb(var(--bg))] text-[rgb(var(--muted))]"
                        }`}
                      >
                        {r}
                      </button>
                    );
                  },
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[rgb(var(--muted))]">Access Tier</label>
              <select
                value={createForm.accessTier}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, accessTier: e.target.value as AccessTier }))}
                className="w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm"
              >
                {ACCESS_TIER_OPTIONS.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[rgb(var(--muted))]">Newsletter</label>
              <label className="inline-flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
                <input
                  type="checkbox"
                  checked={createForm.newsletterOptIn}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, newsletterOptIn: e.target.checked }))}
                />
                Opt-in aktiv
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[rgb(var(--muted))]">E-Mail Verifikation</label>
              <label className="inline-flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
                <input
                  type="checkbox"
                  checked={createForm.sendVerification}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, sendVerification: e.target.checked }))}
                />
                Verifikations-E-Mail senden
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[rgb(var(--muted))]">Passwort setzen</label>
              <label className="inline-flex items-center gap-2 text-sm text-[rgb(var(--muted))]">
                <input
                  type="checkbox"
                  checked={createForm.sendPasswordLink}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      sendPasswordLink: e.target.checked,
                      password: e.target.checked ? "" : prev.password,
                    }))
                  }
                />
                Setz-Link per E-Mail senden (empfohlen)
              </label>
            </div>

            {createError && <p className="text-sm text-rose-600">{createError}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))]"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleCreateUser}
                disabled={createLoading}
                className="rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(14,116,144,0.35)] hover:brightness-105 disabled:opacity-60"
              >
                {createLoading ? "Anlegen …" : "Nutzer anlegen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function generatePassword(length = 16) {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const symbols = "!@#$%_-+=*";
  const all = `${letters}${digits}${symbols}`;
  const bytes = new Uint32Array(length);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) {
      bytes[i] = Math.floor(Math.random() * all.length);
    }
  }
  const core = Array.from(bytes, (b) => all[b % all.length]).join("");
  return `${core.slice(0, length - 3)}${digits[0]}${symbols[0]}${letters[0]}`;
}

function mapAdminUserError(code: string | null | undefined) {
  switch (String(code || "")) {
    case "invalid_input":
      return "Die Eingaben sind unvollständig oder ungültig.";
    case "email_in_use":
      return "Die E-Mail-Adresse ist bereits vergeben.";
    case "weak_password":
      return "Das Passwort ist zu schwach. Bitte mindestens 12 Zeichen mit Zahl und Sonderzeichen verwenden.";
    case "missing_password":
      return "Bitte ein initiales Passwort setzen oder den Passwort-Link aktivieren.";
    case "forbidden_superadmin":
      return "Superadmin-Rollen dürfen nur von Superadmins geändert werden.";
    case "superadmin_required":
      return "Diese Aktion ist ausschließlich für Superadmins freigegeben.";
    case "last_admin_required":
      return "Der letzte Admin-Zugang darf nicht entfernt oder herabgestuft werden.";
    case "last_superadmin_required":
      return "Der letzte Superadmin-Zugang muss erhalten bleiben.";
    case "mail_delivery_unavailable":
    case "mail_delivery_failed":
      return "Die E-Mail konnte nicht sicher zugestellt oder gequeued werden.";
    case "mail_action_unavailable":
      return "Die Recovery-Aktion konnte nicht sicher vorbereitet werden.";
    case "mail_action_in_progress":
      return "Für diese Aktion läuft bereits ein Versandversuch.";
    case "mail_sent_audit_failed":
      return "Die E-Mail wurde versendet, aber der Audit-Nachweis fehlt. Bitte nicht erneut klicken.";
    case "account_disabled_audit_failed":
      return "Das Konto wurde deaktiviert, aber der Audit-Nachweis fehlt.";
    case "account_reactivated_audit_failed":
      return "Das Konto wurde reaktiviert, aber der Audit-Nachweis fehlt.";
    case "status_change_unavailable":
      return "Die Statusänderung konnte nicht atomar gespeichert werden.";
    case "nothing_to_update":
      return "Es gibt keine Änderungen zum Speichern.";
    case "user_not_found":
      return "Der Nutzer wurde nicht gefunden.";
    case "already_verified":
      return "Die E-Mail-Adresse ist bereits bestätigt.";
    case "self_disable_forbidden":
      return "Du darfst dein eigenes Konto nicht deaktivieren.";
    case "self_delete_forbidden":
      return "Du darfst dein eigenes Konto nicht löschen.";
    case "hard_delete_requires_qa_account":
      return "Hard-Delete ist ausschließlich für explizit markierte QA-/Testkonten vorgesehen.";
    case "account_has_productive_roles":
      return "Das Konto trägt produktive Rollen und darf daher nicht hard gelöscht werden.";
    case "email_confirmation_mismatch":
      return "Zur Bestätigung muss die vollständige E-Mail-Adresse exakt eingegeben werden.";
    case "account_has_references":
      return "Das Konto hat fachliche oder Audit-Referenzen und darf nicht hard gelöscht werden.";
    case "hard_delete_unavailable":
      return "Hard-Delete bleibt in diesem Slice bewusst fail-closed und derzeit gesperrt.";
    default:
      return "Die Admin-Aktion konnte gerade nicht ausgeführt werden.";
  }
}

function mapAdminActionSuccess(action: string, body: any) {
  switch (action) {
    case "resend_verification":
      return body?.alreadyVerified
        ? "Die E-Mail-Adresse ist bereits bestätigt."
        : "Verifikations-E-Mail wurde sicher erneut eingeplant.";
    case "send_password_link":
      return "Passwort-Setz-/Reset-Link wurde sicher erneut eingeplant.";
    case "disable_account":
      return "Konto wurde deaktiviert.";
    case "reactivate_account":
      return "Konto wurde reaktiviert.";
    default:
      return "Admin-Aktion ausgeführt.";
  }
}

function formatAdminTimestamp(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StatusBadge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "emerald" | "amber" | "rose" | "sky" | "slate";
}) {
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-100 text-emerald-800"
      : tone === "amber"
      ? "bg-amber-100 text-amber-800"
      : tone === "rose"
      ? "bg-rose-100 text-rose-800"
      : tone === "sky"
      ? "bg-sky-100 text-sky-800"
      : "bg-slate-100 text-slate-700";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${toneClass}`}>{children}</span>;
}
