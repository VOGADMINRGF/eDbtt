// features/dashboard/components/ApiDashboard.tsx

import { useState, useEffect } from "react";

type ApiStatus = "online" | "offline" | "error" | "slow" | "unknown";

interface ApiEndpoint {
  name: string;
  url: string;
  description: string;
  type: "db" | "ai" | "search" | "custom";
}

const API_ENDPOINTS: ApiEndpoint[] = [
  { name: "MongoDB", url: "/api/health/mongo", description: "Primäre Datenbank", type: "db" },
  { name: "GPT-4", url: "/api/health/gpt", description: "OpenAI GPT Service", type: "ai" },
  { name: "ARI", url: "/api/health/ari", description: "Eigene KI", type: "ai" },
  { name: "Gemini", url: "/api/health/gemini", description: "Google Gemini", type: "ai" },
  { name: "Llama3", url: "/api/health/llama3", description: "Meta Llama3", type: "ai" },
  { name: "Elastic", url: "/api/health/elastic", description: "Volltext-Suche", type: "search" },
  { name: "Typesense", url: "/api/health/typesense", description: "Fast-Search/Filter", type: "search" },
  { name: "Qdrant", url: "/api/health/qdrant", description: "Vektor/Ähnlichkeits-Suche", type: "search" },
  // ... beliebig erweiterbar
];

interface ApiHealth {
  status: ApiStatus;
  latency?: number;
  lastChecked: string;
  lastError?: string;
  details?: any;
}

export default function ApiDashboard() {
  const [health, setHealth] = useState<Record<string, ApiHealth>>({});
  const [loading, setLoading] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    const newHealth: Record<string, ApiHealth> = {};
    await Promise.all(API_ENDPOINTS.map(async (ep) => {
      try {
        const t0 = performance.now();
        const res = await fetch(ep.url);
        const t1 = performance.now();
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        newHealth[ep.name] = {
          status: data.status || "online",
          latency: Math.round(t1 - t0),
          lastChecked: new Date().toLocaleTimeString(),
          lastError: data.error || undefined,
          details: data.details || undefined,
        };
      } catch (e: any) {
        newHealth[ep.name] = {
          status: "offline",
          lastChecked: new Date().toLocaleTimeString(),
          lastError: e.message,
        };
      }
    }));
    setHealth(newHealth);
    setLoading(false);
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000); // alle 15s refreshen
    return () => clearInterval(interval);
  }, []);

  const statusColor = (status: ApiStatus) => {
    switch (status) {
      case "online": return "border-green-500 text-green-700 bg-green-50";
      case "offline": return "border-red-500 text-red-700 bg-red-50";
      case "error": return "border-yellow-500 text-yellow-700 bg-yellow-50";
      case "slow": return "border-orange-500 text-orange-700 bg-orange-50";
      default: return "border-gray-300 text-gray-700 bg-gray-50";
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow">
      <div className="flex justify-between items-center mb-4">
        <div className="text-xl font-bold">API & Service Dashboard</div>
        <button
          onClick={fetchHealth}
          className="px-3 py-1 rounded bg-violet-500 text-white hover:bg-violet-600 text-sm"
          disabled={loading}
        >{loading ? "Lädt..." : "Refresh"}</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {API_ENDPOINTS.map(ep => {
          const h = health[ep.name] || { status: "unknown" as ApiStatus, lastChecked: "-" };
          return (
            <div
              key={ep.name}
              className={`border-2 ${statusColor(h.status)} rounded-lg p-4 flex flex-col gap-2 transition-all`}
            >
              <div className="flex items-center justify-between">
                <div className="font-bold">{ep.name}</div>
                <span className="text-xs px-2 py-1 rounded bg-gray-100">{ep.type}</span>
              </div>
              <div className="text-xs text-gray-600">{ep.description}</div>
              <div className="flex gap-4 text-sm mt-2">
                <span>Status: <b>{h.status}</b></span>
                <span>Latenz: <b>{h.latency ? `${h.latency}ms` : "–"}</b></span>
              </div>
              <div className="text-xs text-gray-400">Geprüft: {h.lastChecked}</div>
              {h.lastError && (
                <div className="text-xs text-red-600">Fehler: {h.lastError}</div>
              )}
              {/* Optional: Button für Details/Logs */}
            </div>
          );
        })}
      </div>
    </div>
  );
}
