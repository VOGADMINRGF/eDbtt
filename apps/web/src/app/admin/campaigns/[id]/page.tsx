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
  const [reportSourceFilter, setReportSourceFilter] = useState("all");
  const [reportSessionFilter, setReportSessionFilter] = useState("all");
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
        body: JSON.stringify({ label: sessionLabel }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
      const nextSession = body?.session ? { ...body.session, qrCode: body.qrCode ?? null } : null;
      setSessions((prev) => [nextSession, ...prev].filter(Boolean));
      setSessionLabel("");
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

  const exportCsv = () => {
    if (!report || !campaign) return;
    const lines: string[] = [];
    lines.push(`Campaign,${campaign.title.replace(/,/g, " ")}`);
    lines.push(`Participants,${report.participants}`);
    lines.push(`LastJoinedAt,${report.lastJoinedAt ?? ""}`);
    lines.push("");
    lines.push("JoinsByDay");
    lines.push("date,count");
    report.joinsByDay.forEach((row) => {
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
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin · Campaign</p>
        <h1 className="text-2xl font-bold text-slate-900">Campaign Detail</h1>
        <p className="text-sm text-slate-600">
          Status und Teilnehmerzahlen verwalten. Status-Updates wirken sofort auf den Join-Endpoint.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Lädt …</div>
      )}

      {campaign && (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">{campaign.title}</h2>
                <p className="text-sm text-slate-600">{campaign.description ?? "Keine Beschreibung."}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm">
                Teilnehmer: <span className="font-semibold text-slate-900">{campaign.participants}</span>
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

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              {(["draft", "active", "paused", "ended"] as CampaignDetail["status"][]).map((status) => (
                <button
                  key={status}
                  onClick={() => updateStatus(status)}
                  disabled={saving}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    campaign.status === status
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            {saving && <p className="mt-2 text-xs text-slate-500">Speichert …</p>}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">QR & Join</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
              {qrCode ? (
                <>
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">{qrCode}</span>
                  <a
                    href={`/qr/${encodeURIComponent(qrCode)}`}
                    className="font-semibold text-slate-700 hover:text-slate-900"
                  >
                    /qr/{qrCode}
                  </a>
                </>
              ) : (
                <span className="text-slate-600">Kein QR-Code vorhanden.</span>
              )}
              <button
                onClick={generateQr}
                disabled={qrBusy}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                {qrCode ? "QR neu generieren" : "QR generieren"}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sessions</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <input
                value={sessionLabel}
                onChange={(e) => setSessionLabel(e.target.value)}
                placeholder="Session-Label (optional)"
                aria-label="Session-Label"
                className="flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm sm:max-w-xs"
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
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-left uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Label</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Start</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sessions.map((session) => (
                      <tr key={session.id}>
                        <td className="px-3 py-2 text-slate-700">{session.label ?? "Session"}</td>
                        <td className="px-3 py-2 text-slate-600">
                          <select
                            value={session.status}
                            onChange={(e) =>
                              updateSessionStatus(session.id, e.target.value as CampaignSession["status"])
                            }
                            aria-label="Session Status"
                            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                          >
                            <option value="planned">planned</option>
                            <option value="live">live</option>
                            <option value="ended">ended</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          <div>{session.startsAt ?? "–"}</div>
                          {session.qrCode ? (
                            <a
                              href={`/qr/${encodeURIComponent(session.qrCode)}`}
                              className="text-xs font-semibold text-slate-700 hover:text-slate-900"
                            >
                              QR: {session.qrCode}
                            </a>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">Noch keine Sessions.</p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Campaign Report</p>
            {report ? (
              <div className="mt-3 grid gap-4 text-sm sm:grid-cols-3">
                <Metric label="Teilnahmen" value={report.participants.toString()} />
                <Metric label="Letzte Teilnahme" value={report.lastJoinedAt ?? "–"} />
                <Metric
                  label="Tage (letzte 14)"
                  value={report.joinsByDay.reduce((acc, row) => acc + row.count, 0).toString()}
                />
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">Reportdaten sind derzeit nicht verfügbar.</p>
            )}
            {report ? (
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <select
                  value={reportSourceFilter}
                  onChange={(e) => setReportSourceFilter(e.target.value)}
                  aria-label="Source Filter"
                  className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs"
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
                  className="rounded-full border border-slate-300 bg-white px-3 py-2 text-xs"
                >
                  <option value="all">Alle Sessions</option>
                  {sessionsList.map((sessionId) => (
                    <option key={sessionId} value={sessionId}>
                      {sessionId === "none" ? "ohne Session" : sessionId}
                    </option>
                  ))}
                </select>
                <button
                  onClick={exportCsv}
                  className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
                >
                  CSV Export
                </button>
              </div>
            ) : null}
            {filteredSources.length ? (
              <div className="mt-4 grid gap-2 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Quellen</p>
                {filteredSources.map((row) => (
                  <BarRow key={row.source} label={row.source} value={row.count} />
                ))}
              </div>
            ) : null}
            {filteredSessions.length ? (
              <div className="mt-4 grid gap-2 text-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sessions</p>
                {filteredSessions.map((row, idx) => (
                  <BarRow key={`${row.sessionId ?? "none"}-${idx}`} label={row.label} value={row.count} />
                ))}
              </div>
            ) : null}
            {report?.joinsByDay?.length ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-50 text-left uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">Datum</th>
                      <th className="px-3 py-2">Joins</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.joinsByDay.map((row) => (
                      <tr key={row.date}>
                        <td className="px-3 py-2 text-slate-700">{row.date}</td>
                        <td className="px-3 py-2 text-slate-700">{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>

          <div className="flex gap-4 text-sm">
            <Link href={`/campaign/${encodeURIComponent(campaign.id)}`} className="font-semibold text-slate-700">
              Öffentliche Seite
            </Link>
            <Link href="/admin/campaigns" className="font-semibold text-slate-500">
              Zurück zur Liste
            </Link>
          </div>
        </>
      )}
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm text-slate-800">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function BarRow({ label, value }: { label: string; value: number }) {
  const width = Math.min(100, Math.max(5, value));
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 text-xs text-slate-600">{label}</div>
      <div className="flex-1 rounded-full bg-slate-100">
        <div className="h-2 rounded-full bg-slate-900" style={{ width: `${width}%` }} />
      </div>
      <div className="text-xs font-semibold text-slate-700">{value}</div>
    </div>
  );
}
