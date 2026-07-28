"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type CampaignDetail = {
  id: string;
  title: string;
  description: string | null;
  regionCode: string | null;
  topicKey: string | null;
  status: "draft" | "active" | "paused" | "ended";
  supportEnabled: boolean;
  supportSlug: string | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
  participants: number;
};

type CampaignReport = {
  participants: number;
  lastJoinedAt: string | null;
  joinsByDay: Array<{ date: string; count: number }>;
  bySource?: Array<{ source: string; count: number }>;
  bySession?: Array<{ sessionId: string | null; label: string; count: number }>;
};

type CampaignSession = {
  id: string;
  label: string | null;
  status: "planned" | "live" | "ended";
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
  qrCode?: string | null;
};

export default function AdminCampaignDetailPage() {
  const params = useParams();
  const campaignId = typeof params?.id === "string" ? params.id : Array.isArray(params?.id) ? params.id[0] : "";
  const [campaign, setCampaign] = useState<CampaignDetail | null>(null);
  const [report, setReport] = useState<CampaignReport | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [sessions, setSessions] = useState<CampaignSession[]>([]);
  const [sessionLabel, setSessionLabel] = useState("");
  const [sessionStartsAt, setSessionStartsAt] = useState("");
  const [sessionEndsAt, setSessionEndsAt] = useState("");
  const [reportSourceFilter, setReportSourceFilter] = useState("all");
  const [reportSessionFilter, setReportSessionFilter] = useState("all");
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [qrBusy, setQrBusy] = useState(false);
  const [sessionBusy, setSessionBusy] = useState(false);

  useEffect(() => {
    if (!campaignId) return;
    let ignore = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/campaigns/${encodeURIComponent(campaignId)}`, { cache: "no-store" });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
        if (!ignore) setCampaign(body?.campaign ?? null);
      } catch (err: any) {
        if (!ignore) setError(err?.message ?? "Kampagne konnte nicht geladen werden.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [campaignId]);

  useEffect(() => {
    if (!campaignId) return;
    let ignore = false;
    async function loadReport() {
      try {
        const res = await fetch(`/api/admin/campaigns/${encodeURIComponent(campaignId)}/report`, {
          cache: "no-store",
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
        if (!ignore) setReport(body?.report ?? null);
      } catch (err: any) {
        if (!ignore) {
          setReport(null);
        }
      }
    }
    async function loadQr() {
      try {
        const res = await fetch(`/api/admin/campaigns/${encodeURIComponent(campaignId)}/qr`, {
          cache: "no-store",
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
        if (!ignore) setQrCode(body?.code ?? null);
      } catch {
        if (!ignore) setQrCode(null);
      }
    }
    async function loadSessions() {
      try {
        const res = await fetch(`/api/admin/campaigns/${encodeURIComponent(campaignId)}/sessions`, {
          cache: "no-store",
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
        if (!ignore) setSessions(Array.isArray(body?.sessions) ? body.sessions : []);
      } catch {
        if (!ignore) setSessions([]);
      }
    }
    loadReport();
    loadQr();
    loadSessions();
    return () => {
      ignore = true;
    };
  }, [campaignId]);

  const generateQr = async () => {
    if (!campaign) return;
    setQrBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/campaigns/${encodeURIComponent(campaign.id)}/qr`, {
        method: "POST",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setQrCode(body?.code ?? null);
    } catch (err: any) {
      setError(err?.message ?? "QR-Code konnte nicht erzeugt werden.");
    } finally {
      setQrBusy(false);
    }
  };

  const createSession = async () => {
    if (!campaign) return;
    setSessionBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/campaigns/${encodeURIComponent(campaign.id)}/sessions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          label: sessionLabel,
          ...(sessionStartsAt ? { startsAt: sessionStartsAt } : {}),
          ...(sessionEndsAt ? { endsAt: sessionEndsAt } : {}),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      const nextSession = body?.session ? { ...body.session, qrCode: body.qrCode ?? null } : null;
      setSessions((prev) => [nextSession, ...prev].filter(Boolean));
      setSessionLabel("");
      setSessionStartsAt("");
      setSessionEndsAt("");
    } catch (err: any) {
      setError(err?.message ?? "Session konnte nicht erstellt werden.");
    } finally {
      setSessionBusy(false);
    }
  };

  const updateSessionStatus = async (sessionId: string, status: CampaignSession["status"]) => {
    if (!campaign) return;
    setSessionBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/campaigns/${encodeURIComponent(campaign.id)}/sessions`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, status }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, ...body.session } : s)));
    } catch (err: any) {
      setError(err?.message ?? "Session-Status konnte nicht aktualisiert werden.");
    } finally {
      setSessionBusy(false);
    }
  };

  const updateSessionTimes = async (sessionId: string, startsAt: string, endsAt: string) => {
    if (!campaign) return;
    setSessionBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/campaigns/${encodeURIComponent(campaign.id)}/sessions`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          startsAt: startsAt || null,
          endsAt: endsAt || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, ...body.session } : s)));
    } catch (err: any) {
      setError(err?.message ?? "Session-Zeiten konnten nicht aktualisiert werden.");
    } finally {
      setSessionBusy(false);
    }
  };

  const sourcesList = report?.bySource?.map((row) => row.source) ?? [];
  const sessionsList = report?.bySession?.map((row) => row.sessionId ?? "none") ?? [];

  const filteredSources =
    reportSourceFilter === "all"
      ? report?.bySource ?? []
      : (report?.bySource ?? []).filter((row) => row.source === reportSourceFilter);

  const filteredSessions =
    reportSessionFilter === "all"
      ? report?.bySession ?? []
      : (report?.bySession ?? []).filter(
          (row) => (row.sessionId ?? "none") === reportSessionFilter,
        );

  const filteredJoinRows = (report?.joinsByDay ?? []).filter((row) => {
    if (!reportStartDate && !reportEndDate) return true;
    if (reportStartDate && row.date < reportStartDate) return false;
    if (reportEndDate && row.date > reportEndDate) return false;
    return true;
  });

  const filteredSourceTotal = filteredSources.reduce((acc, row) => acc + row.count, 0);
  const filteredSessionTotal = filteredSessions.reduce((acc, row) => acc + row.count, 0);
  const topSources = [...filteredSources].sort((a, b) => b.count - a.count).slice(0, 5);
  const topSessions = [...filteredSessions].sort((a, b) => b.count - a.count).slice(0, 5);

  const maxJoinCount = Math.max(1, ...filteredJoinRows.map((row) => row.count));
  const maxSourceCount = Math.max(1, ...filteredSources.map((row) => row.count));
  const maxSessionCount = Math.max(1, ...filteredSessions.map((row) => row.count));

  const exportCsv = () => {
    if (!report || !campaign) return;
    const lines: string[] = [];
    lines.push(`Campaign,${campaign.title.replace(/,/g, " ")}`);
    lines.push(`Participants,${report.participants}`);
    lines.push(`LastJoinedAt,${report.lastJoinedAt ?? ""}`);
    lines.push("");
    lines.push("JoinsByDay");
    lines.push("date,count");
    filteredJoinRows.forEach((row) => {
      lines.push(`${row.date},${row.count}`);
    });
    lines.push("");
    lines.push("Sources");
    lines.push("source,count");
    filteredSources.forEach((row) => {
      lines.push(`${row.source},${row.count}`);
    });
    lines.push("");
    lines.push("Sessions");
    lines.push("sessionId,label,count");
    filteredSessions.forEach((row) => {
      lines.push(`${row.sessionId ?? ""},${row.label ?? ""},${row.count}`);
    });
    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `campaign-report-${campaign.id}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const updateStatus = async (status: CampaignDetail["status"]) => {
    if (!campaign) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/campaigns/${encodeURIComponent(campaign.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      setCampaign(body.campaign ?? campaign);
    } catch (err: any) {
      setError(err?.message ?? "Status konnte nicht aktualisiert werden.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Admin · Campaign</p>
        <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Campaign Detail</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Status und Teilnehmerzahlen verwalten. Status-Updates wirken sofort auf den Join-Endpoint.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {loading && (
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 text-sm text-[rgb(var(--muted))]">Lädt …</div>
      )}

      {campaign && (
        <>
          <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[rgb(var(--fg))]">{campaign.title}</h2>
                <p className="text-sm text-[rgb(var(--muted))]">{campaign.description ?? "Keine Beschreibung."}</p>
              </div>
              <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-2 text-sm">
                Teilnehmer: <span className="font-semibold text-[rgb(var(--fg))]">{campaign.participants}</span>
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <Detail label="Region" value={campaign.regionCode ?? "–"} />
              <Detail label="Topic" value={campaign.topicKey ?? "–"} />
              <Detail label="Start" value={campaign.startsAt ?? "–"} />
              <Detail label="Ende" value={campaign.endsAt ?? "–"} />
              <Detail label="Erstellt" value={campaign.createdAt} />
              <Detail label="Zuletzt aktualisiert" value={campaign.updatedAt} />
            </div>
          </section>

          <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Status</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {(["draft", "active", "paused", "ended"] as CampaignDetail["status"][]).map((status) => (
                <button
                  key={status}
                  onClick={() => updateStatus(status)}
                  disabled={saving}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    campaign.status === status
                      ? "bg-slate-900 text-white"
                      : "bg-[rgb(var(--bg))] text-[rgb(var(--muted))] hover:bg-[rgb(var(--bg))]"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            {saving && <p className="mt-2 text-xs text-[rgb(var(--muted))]">Speichert …</p>}
          </section>

          <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">QR & Join</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              {qrCode ? (
                <>
                  <span className="rounded-full bg-[rgb(var(--bg))] px-3 py-1 font-semibold text-[rgb(var(--muted))]">{qrCode}</span>
                  <a
                    href={`/qr-studio?code=${encodeURIComponent(qrCode)}`}
                    className="font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                  >
                    /qr-studio?code={qrCode}
                  </a>
                </>
              ) : (
                <span className="text-[rgb(var(--muted))]">Kein QR-Code vorhanden.</span>
              )}
              <a
                href={`/campaign/${encodeURIComponent(campaign.id)}/join`}
                className="font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
              >
                /campaign/{campaign.id}/join
              </a>
              <button
                onClick={generateQr}
                disabled={qrBusy}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                {qrCode ? "QR neu generieren" : "QR generieren"}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
              <span>Status: {campaign.status}</span>
              <span>·</span>
              <Link href={`/campaign/${encodeURIComponent(campaign.id)}`} className="font-semibold text-[rgb(var(--muted))]">
                Öffentliche Seite
              </Link>
              <span>·</span>
              <Link
                href={`/admin/support?campaignId=${encodeURIComponent(campaign.id)}`}
                className="font-semibold text-[rgb(var(--muted))]"
              >
                Support verwalten
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Sessions</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <input
                value={sessionLabel}
                onChange={(e) => setSessionLabel(e.target.value)}
                placeholder="Session-Label (optional)"
                aria-label="Session-Label"
                className="flex-1 rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm text-[rgb(var(--muted))] shadow-sm sm:max-w-xs"
              />
              <input
                type="datetime-local"
                value={sessionStartsAt}
                onChange={(e) => setSessionStartsAt(e.target.value)}
                aria-label="Session Start"
                className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-xs text-[rgb(var(--muted))]"
              />
              <input
                type="datetime-local"
                value={sessionEndsAt}
                onChange={(e) => setSessionEndsAt(e.target.value)}
                aria-label="Session Ende"
                className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-xs text-[rgb(var(--muted))]"
              />
              <button
                onClick={createSession}
                disabled={sessionBusy}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Session anlegen
              </button>
            </div>
            {sessions.length > 0 ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-[rgb(var(--border))]">
                <table className="min-w-full divide-y divide-[rgb(var(--border))] text-xs">
                  <thead className="bg-[rgb(var(--bg))] text-left uppercase tracking-wide text-[rgb(var(--muted))]">
                    <tr>
                      <th className="px-3 py-2">Label</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Zeit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgb(var(--border))]">
                    {sessions.map((session) => (
                      <tr key={session.id}>
                        <td className="px-3 py-2 text-[rgb(var(--muted))]">{session.label ?? "Session"}</td>
                        <td className="px-3 py-2 text-[rgb(var(--muted))]">
                          <select
                            value={session.status}
                            onChange={(e) =>
                              updateSessionStatus(session.id, e.target.value as CampaignSession["status"])
                            }
                            aria-label="Session Status"
                            className="rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 text-xs"
                          >
                            <option value="planned">planned</option>
                            <option value="live">live</option>
                            <option value="ended">ended</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 text-[rgb(var(--muted))]">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                              <input
                                type="datetime-local"
                                value={session.startsAt ?? ""}
                                onChange={(e) =>
                                  updateSessionTimes(session.id, e.target.value, session.endsAt ?? "")
                                }
                                aria-label="Session Startzeit"
                                className="rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 text-xs"
                              />
                              <input
                                type="datetime-local"
                                value={session.endsAt ?? ""}
                                onChange={(e) =>
                                  updateSessionTimes(session.id, session.startsAt ?? "", e.target.value)
                                }
                                aria-label="Session Endzeit"
                                className="rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 text-xs"
                              />
                            </div>
                          {session.qrCode ? (
                            <a
                              href={`/qr-studio?code=${encodeURIComponent(session.qrCode)}`}
                              className="text-xs font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                            >
                              QR: /qr-studio?code={session.qrCode}
                            </a>
                          ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-3 text-sm text-[rgb(var(--muted))]">Noch keine Sessions.</p>
            )}
          </section>

          <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Campaign Report</p>
            {report ? (
              <div className="mt-3 grid gap-4 text-sm sm:grid-cols-3">
                <Metric label="Teilnahmen" value={report.participants.toString()} />
                <Metric label="Letzte Teilnahme" value={report.lastJoinedAt ?? "–"} />
                <Metric
                  label="Tage (letzte 14)"
                  value={filteredJoinRows.reduce((acc, row) => acc + row.count, 0).toString()}
                />
              </div>
            ) : (
              <p className="mt-3 text-sm text-[rgb(var(--muted))]">Reportdaten sind derzeit nicht verfügbar.</p>
            )}
            {report ? (
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  aria-label="Startdatum"
                  className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-xs"
                />
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  aria-label="Enddatum"
                  className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-xs"
                />
                <select
                  value={reportSourceFilter}
                  onChange={(e) => setReportSourceFilter(e.target.value)}
                  aria-label="Source Filter"
                  className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-xs"
                >
                  <option value="all">Alle Quellen</option>
                  {sourcesList.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
                <select
                  value={reportSessionFilter}
                  onChange={(e) => setReportSessionFilter(e.target.value)}
                  aria-label="Session Filter"
                  className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-xs"
                >
                  <option value="all">Alle Sessions</option>
                  {sessionsList.map((sessionId) => (
                    <option key={sessionId} value={sessionId}>
                      {sessionId === "none" ? "ohne Session" : sessionId}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setReportStartDate("");
                    setReportEndDate("");
                    setReportSourceFilter("all");
                    setReportSessionFilter("all");
                  }}
                  className="rounded-full border border-[rgb(var(--border))] px-3 py-2 text-xs font-semibold text-[rgb(var(--muted))]"
                >
                  Filter zurücksetzen
                </button>
                <button
                  onClick={exportCsv}
                  className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
                >
                  CSV Export
                </button>
              </div>
            ) : null}
            {report ? (
              <p className="mt-2 text-[11px] text-[rgb(var(--muted))]">
                Hinweis: Export übernimmt die aktiven Filter (Datum/Quelle/Session).
              </p>
            ) : null}
            {(topSources.length || topSessions.length) ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <ComparePanel title="Top Quellen" total={filteredSourceTotal} rows={topSources.map((row) => ({
                  label: row.source,
                  count: row.count,
                }))} />
                <ComparePanel title="Top Sessions" total={filteredSessionTotal} rows={topSessions.map((row) => ({
                  label: row.label,
                  count: row.count,
                }))} />
              </div>
            ) : null}
            {filteredSources.length ? (
              <div className="mt-4 grid gap-2 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Quellen</p>
                {filteredSources.map((row) => (
                  <BarRow key={row.source} label={row.source} value={row.count} max={maxSourceCount} />
                ))}
              </div>
            ) : null}
            {filteredSessions.length ? (
              <div className="mt-4 grid gap-2 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Sessions</p>
                {filteredSessions.map((row, idx) => (
                  <BarRow
                    key={`${row.sessionId ?? "none"}-${idx}`}
                    label={row.label}
                    value={row.count}
                    max={maxSessionCount}
                  />
                ))}
              </div>
            ) : null}
            {filteredJoinRows.length ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-[rgb(var(--border))]">
                <div className="grid grid-cols-7 items-end gap-1 bg-[rgb(var(--bg))] px-4 py-3 sm:grid-cols-14">
                  {filteredJoinRows.map((row) => (
                    <div key={`bar-${row.date}`} className="flex flex-col items-center gap-1">
                      <div
                        className="w-full rounded-sm bg-slate-900/80"
                        style={{
                          height: `${Math.max(6, Math.round((row.count / maxJoinCount) * 60))}px`,
                        }}
                        title={`${row.date}: ${row.count}`}
                      />
                      <span className="text-[10px] text-[rgb(var(--muted))]">{row.date.slice(5)}</span>
                    </div>
                  ))}
                </div>
                <table className="min-w-full divide-y divide-[rgb(var(--border))] text-xs">
                  <thead className="bg-[rgb(var(--bg))] text-left uppercase tracking-wide text-[rgb(var(--muted))]">
                    <tr>
                      <th className="px-3 py-2">Datum</th>
                      <th className="px-3 py-2">Joins</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgb(var(--border))]">
                    {filteredJoinRows.map((row) => (
                      <tr key={row.date}>
                        <td className="px-3 py-2 text-[rgb(var(--muted))]">{row.date}</td>
                        <td className="px-3 py-2 text-[rgb(var(--muted))]">{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>

          <div className="flex gap-4 text-sm">
            <Link href={`/campaign/${encodeURIComponent(campaign.id)}`} className="font-semibold text-[rgb(var(--muted))]">
              Öffentliche Seite
            </Link>
            <Link href="/admin/campaigns" className="font-semibold text-[rgb(var(--muted))]">
              Zurück zur Liste
            </Link>
          </div>
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-sm text-[rgb(var(--muted))]">
            Support: {campaign.supportEnabled && campaign.supportSlug ? (
              <span>
                aktiv ·{" "}
                <Link href={`/support/${encodeURIComponent(campaign.supportSlug)}`} className="font-semibold text-emerald-700">
                  /support/{campaign.supportSlug}
                </Link>
              </span>
            ) : (
              <span>
                nicht aktiv ·{" "}
                <Link href={`/admin/support?campaignId=${encodeURIComponent(campaign.id)}`} className="font-semibold text-[rgb(var(--fg))]">
                  in Admin Support aktivieren
                </Link>
              </span>
            )}
          </div>
        </>
      )}
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{label}</p>
      <p className="text-sm text-[rgb(var(--fg))]">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{label}</p>
      <p className="text-lg font-semibold text-[rgb(var(--fg))]">{value}</p>
    </div>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const normalized = max > 0 ? (value / max) * 100 : 0;
  const width = Math.min(100, Math.max(5, normalized));
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 text-xs text-[rgb(var(--muted))]">{label}</div>
      <div className="flex-1 rounded-full bg-[rgb(var(--bg))]">
        <div className="h-2 rounded-full bg-slate-900" style={{ width: `${width}%` }} />
      </div>
      <div className="text-xs font-semibold text-[rgb(var(--muted))]">{value}</div>
    </div>
  );
}

function ComparePanel({
  title,
  total,
  rows,
}: {
  title: string;
  total: number;
  rows: Array<{ label: string | null; count: number }>;
}) {
  const safeTotal = total > 0 ? total : rows.reduce((acc, row) => acc + row.count, 0) || 1;
  return (
    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-xs">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-2 text-[rgb(var(--muted))]">Keine Daten im aktuellen Filter.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {rows.map((row, idx) => {
            const pct = Math.round((row.count / safeTotal) * 100);
            return (
              <li key={`${row.label ?? "row"}-${idx}`} className="flex items-center justify-between gap-3">
                <span className="text-[rgb(var(--muted))]">{row.label ?? "—"}</span>
                <span className="text-[rgb(var(--muted))]">
                  {row.count} · {pct}%
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
