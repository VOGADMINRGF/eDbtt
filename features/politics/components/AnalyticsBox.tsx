// features/politics/components/AnalyticsBox.tsx
"use client";
console.log("AnalyticsBox RENDERT");
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function AnalyticsBox({
  level, district, ministry, party, streams, userId, focus = true,
}: {
  level?: string;
  district?: string;
  ministry?: string;
  party?: string;
  streams?: any[];
  userId?: string;
  focus?: boolean;
}) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const params = new URLSearchParams();
      if (level) params.append("level", level);
      if (district) params.append("district", district);
      if (ministry) params.append("ministry", ministry);
      if (party) params.append("party", party);
      if (focus) params.append("focus", "true");
      try {
        const res = await fetch(`/api/analytics?${params.toString()}`);
        setAnalytics(await res.json());
      } catch {
        setAnalytics(null);
      }
      setLoading(false);
    }
    load();
  }, [level, district, ministry, party, focus]);

  if (loading) return <div className="text-gray-400 py-6">Analytics werden geladen…</div>;
  if (!analytics) return <div className="text-gray-400 py-6">Keine Analytics verfügbar.</div>;

  return (
    <div className="bg-white rounded-xl shadow p-6 mb-8">
      <h3 className="text-lg font-bold mb-2">Analytics</h3>
      <ul className="space-y-1 text-sm mb-4">
        <li><b>Streams insgesamt:</b> {analytics.streamCount ?? "-"}</li>
        <li><b>Teilnahmen:</b> {analytics.totalParticipants ?? "-"}</li>
        <li><b>Durchschnittliche Zustimmung:</b> {analytics.avgApproval !== undefined ? `${(analytics.avgApproval * 100).toFixed(1)}%` : "-"}</li>
        <li><b>Letzte Aktivität:</b> {analytics.lastActivity ? new Date(analytics.lastActivity).toLocaleString() : "-"}</li>
      </ul>
      {/* Beispiel Balkendiagramm für Monatsvergleich */}
      {analytics.monthly && (
        <div className="my-4">
          <h4 className="font-semibold mb-1">Monatliche Teilnahme</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={analytics.monthly}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="participants" fill="#4F46E5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {analytics.trend !== undefined && (
        <div>
          <b>Trend:</b>{" "}
          <span className={analytics.trend > 0 ? "text-green-600" : analytics.trend < 0 ? "text-red-600" : ""}>
            {analytics.trend > 0 ? "↗︎ steigend" : analytics.trend < 0 ? "↘︎ fallend" : "→ stabil"}
          </span>
        </div>
      )}
    </div>
  );
}
