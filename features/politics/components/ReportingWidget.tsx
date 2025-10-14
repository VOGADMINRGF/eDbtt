"use client";
console.log("ReportingWidget RENDERT");

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function ReportingWidget({
  user,
  streams = [],
  region,
  role,
  timeFrame = "month", // "month", "week", "custom"
  exportEnabled = true, // PDF/CSV-Export sichtbar
  analyticsProps = {},   // Zusätzliche AnalyticsBox-Props
}: {
  user?: any;
  streams?: any[];
  region?: string;
  role?: string;
  timeFrame?: "month" | "week" | "custom";
  exportEnabled?: boolean;
  analyticsProps?: Record<string, any>;
}) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Daten laden: Kann Streams, Votes, Beteiligung etc. analysieren – oder per API holen
  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        // Demo: Per API eigene, aggregierte Reportdaten holen (nach Zeit, Region, Rolle)
        const params = new URLSearchParams();
        if (region) params.append("region", region);
        if (role) params.append("role", role);
        if (timeFrame) params.append("timeFrame", timeFrame);

        // Optional: Backend-Logik für tiefergehende Reports
        const res = await fetch(`/api/reporting?${params.toString()}`);
        if (!res.ok) throw new Error("Fehler beim Laden der Reports.");
        setStats(await res.json());
      } catch (err: any) {
        setError(err.message || "Fehler beim Reporting.");
        setStats(null);
      }
      setLoading(false);
    }
    fetchStats();
  }, [region, role, timeFrame]);

  function handleExport(type: "pdf" | "csv") {
    // Hier kannst du Download- oder API-Export-Logik einbauen
    alert(`Exportiere Report als ${type.toUpperCase()} (Demo)`);
  }

  if (loading) return <div className="text-gray-400 py-4">Reporting wird geladen…</div>;
  if (error) return <div className="text-red-600 py-4">{error}</div>;
  if (!stats) return <div className="text-gray-400 py-4">Keine Report-Daten gefunden.</div>;

  // Beispiel: Advanced KPI-Box + Chart für die wichtigsten Kennzahlen
  return (
    <div className="bg-white rounded-xl shadow p-6 mb-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-3">
        <div>
          <h3 className="text-xl font-bold mb-1">Monatsreporting {region && <span>({region})</span>}</h3>
          <div className="text-sm text-gray-500">
            Zeitraum: {stats.timeLabel || "aktuell"} &middot; Rolle: {role || user?.role || "-"}
          </div>
        </div>
        {exportEnabled && (
          <div className="flex gap-2">
            <button
              className="px-3 py-1 rounded bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700"
              onClick={() => handleExport("pdf")}
            >
              PDF-Export
            </button>
            <button
              className="px-3 py-1 rounded bg-gray-600 text-white text-xs font-semibold hover:bg-gray-700"
              onClick={() => handleExport("csv")}
            >
              CSV-Export
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
        <div>
          <div className="text-2xl font-bold">{stats.streamCount ?? "-"}</div>
          <div className="text-xs text-gray-500">Streams gesamt</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{stats.totalVotes ?? "-"}</div>
          <div className="text-xs text-gray-500">Abstimmungen</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{stats.avgApproval !== undefined ? `${(stats.avgApproval * 100).toFixed(1)}%` : "-"}</div>
          <div className="text-xs text-gray-500">Ø Zustimmung</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{stats.participantCount ?? "-"}</div>
          <div className="text-xs text-gray-500">Teilnehmer:innen</div>
        </div>
      </div>

      {/* Beispiel-Chart: Beteiligung im Zeitverlauf */}
      {stats.trendData && (
        <div className="my-4">
          <h4 className="font-semibold mb-1">Beteiligung nach Zeitraum</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.trendData}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="participants" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Erweiterbar: Tiefergehende Analytics oder weitere Charts */}
      <div className="mt-6">
        <h5 className="font-semibold mb-2">Weitere Insights</h5>
        <ul className="space-y-1 text-sm">
          <li>
            <b>Meistdiskutiertes Thema:</b> {stats.topTopic ?? "-"}
          </li>
          <li>
            <b>Engagement-Quote:</b> {stats.engagementRate !== undefined ? `${(stats.engagementRate * 100).toFixed(1)}%` : "-"}
          </li>
          {/* Beliebig viele weitere KPIs */}
        </ul>
      </div>

      {/* Optional: AnalyticsBox oder weitere Props */}
      {analyticsProps && Object.keys(analyticsProps).length > 0 && (
        <div className="mt-6">
          {/* Hier könntest du weitere AnalyticsBox-Komponenten o. Ä. einbinden */}
        </div>
      )}
    </div>
  );
}
