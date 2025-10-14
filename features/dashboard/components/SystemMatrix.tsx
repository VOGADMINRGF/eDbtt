// features/dashboard/components/SystemMatrix.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Status = "green" | "yellow" | "red" | "grey";
interface SystemStatus {
  name: string;
  status: Status;
  latency?: number;
  detail?: string;
  error?: string;
  token?: number;
  extra?: Record<string, any>;
}

type HealthShape =
  | { systems?: any[] }                           // /api/health/system (dein altes Schema)
  | { checks?: Record<string, any>; ok?: boolean } // /api/health (neue V2+)
  | Record<string, any>;

const POLL_MS = 30_000;

export default function SystemMatrix() {
  const [systems, setSystems] = useState<SystemStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [auto, setAuto] = useState(true);

  const abortRef = useRef<AbortController | null>(null);
  const backoffRef = useRef(0);

  const fetchOnce = async (immediate = false) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading((l) => l && !immediate); // beim manuellen Refresh nicht flackern lassen
    setErr(null);

    try {
      // erst neue Health-Route, dann Fallback
      const res = await fetch("/api/health", { cache: "no-store", signal: ac.signal }).catch(() => null as any);
      const okHealth = res?.ok;
      const data: HealthShape = okHealth ? await res!.json() : await fetchJSON("/api/health/system", ac.signal);

      const mapped = mapToSystemStatus(data);
      setSystems(mapped);
      setLastUpdated(Date.now());
      backoffRef.current = 0; // Reset Backoff
    } catch (e: any) {
      // Backoff (max ~5 min)
      backoffRef.current = Math.min(backoffRef.current ? backoffRef.current * 2 : 2000, 300_000);
      setErr(typeof e?.message === "string" ? e.message : "Health nicht erreichbar");
      setSystems((prev) => prev.length ? prev : [{ name: "Health", status: "red", detail: "API nicht erreichbar" }]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-Refresh mit Sichtbarkeits-Pause + Backoff
  useEffect(() => {
    let timer: any;

    const tick = async () => {
      if (document.visibilityState === "visible" && auto) await fetchOnce();
      const base = POLL_MS;
      const jitter = Math.floor(Math.random() * 800); // 0-800ms
      const backoff = backoffRef.current || 0;
      timer = setTimeout(tick, base + jitter + backoff);
    };

    // initial
    fetchOnce(true);
    timer = setTimeout(tick, POLL_MS);

    const onVis = () => {
      if (document.visibilityState === "visible" && auto) fetchOnce(true);
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVis);
      abortRef.current?.abort();
    };
  }, [auto]);

  const gridCols = useMemo(() => {
    const n = systems.length;
    if (n >= 10) return "grid-cols-2 md:grid-cols-5";
    if (n >= 6) return "grid-cols-2 md:grid-cols-4";
    return "grid-cols-2 md:grid-cols-3";
  }, [systems.length]);

  return (
    <div className="p-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-sm font-semibold">System Matrix</div>
        <div className="flex items-center gap-2 text-sm">
          <label className="inline-flex items-center gap-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
            />
            Auto
          </label>
          <button
            onClick={() => fetchOnce(true)}
            className="px-3 py-1.5 rounded border"
            aria-busy={loading}
            disabled={loading}
          >
            {loading ? "Lädt…" : "Refresh"}
          </button>
          <span className="text-xs text-neutral-500">
            {lastUpdated ? `Stand: ${formatTime(lastUpdated)}` : "—"}
          </span>
        </div>
      </div>

      {err && (
        <div className="mb-3 text-sm text-red-600">
          {err}
        </div>
      )}

      {loading && !systems.length ? (
        <SkeletonGrid />
      ) : (
        <div className={`grid ${gridCols} gap-4`}>
          {systems.map((sys) => (
            <SystemCard key={sys.name} sys={sys} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Mapping & UI ---------- */

function mapToSystemStatus(data: HealthShape): SystemStatus[] {
  // 1) Neues /api/health-Format (V2+): { ok, ts, uptime, checks: { redis: {ok,ms}, ... } }
  if (data && typeof data === "object" && "checks" in data && data.checks && typeof data.checks === "object") {
    const checks = (data as any).checks as Record<string, any>;
    return Object.entries(checks).map(([name, c]) => {
      const ok = !!c?.ok;
      const ms = typeof c?.ms === "number" ? c.ms : undefined;
      const status: Status = ok ? "green" : c?.info ? "yellow" : "red";
      const detail =
        c?.info ? String(c.info) :
        ok ? (typeof ms === "number" ? "OK" : undefined) :
        undefined;
      return {
        name,
        status,
        latency: ms,
        detail,
        error: ok ? undefined : (c?.error ? String(c.error) : "unhealthy"),
        token: undefined,
        extra: c,
      };
    });
  }

  // 2) Altes /api/health/system: { systems: [{ name, status, latency, detail, error, extra }] }
  if (data && typeof data === "object" && "systems" in data && Array.isArray((data as any).systems)) {
    const arr = (data as any).systems as any[];
    return arr.map((s) => ({
      name: String(s.name ?? "unknown"),
      status: (s.status ?? "grey") as Status,
      latency: typeof s.latency === "number" ? s.latency : undefined,
      detail: s.detail ? String(s.detail) : undefined,
      error: s.error ? String(s.error) : undefined,
      token: typeof s.extra?.tokens === "number" ? s.extra.tokens : undefined,
      extra: s.extra ?? undefined,
    }));
  }

  // 3) Fallback: alles rot, roh anzeigen
  return [{ name: "Health", status: "red", detail: "Unbekanntes Health-Format", extra: data as any }];
}

function SystemCard({ sys }: { sys: SystemStatus }) {
  const border =
    sys.status === "green" ? "border-green-500" :
    sys.status === "red"   ? "border-red-500"   :
    sys.status === "yellow"? "border-yellow-500": "border-gray-300";

  const dot =
    sys.status === "green" ? "bg-green-500" :
    sys.status === "red"   ? "bg-red-500"   :
    sys.status === "yellow"? "bg-yellow-500": "bg-gray-400";

  return (
    <div
      className={`rounded-lg shadow p-4 bg-white dark:bg-neutral-900 border-2 ${border}`}
      role="status"
      aria-label={`${sys.name} ${sys.status}`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="font-bold">{sys.name}</div>
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${dot}`} aria-hidden="true" />
      </div>
      {sys.detail && <div className="text-xs text-gray-600">{sys.detail}</div>}
      <div className="text-xs mt-1">
        {typeof sys.latency === "number" && (
          <>Latenz: {Math.round(sys.latency)} ms<br/></>
        )}
        {sys.error && <span className="text-red-600 break-all">{sys.error}</span>}
        {typeof sys.token === "number" && (
          <>
            Token: {sys.token}
            <br/>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------- Small bits ---------- */

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border-2 border-gray-200 dark:border-neutral-800 p-4">
          <div className="h-4 w-24 bg-gray-200 dark:bg-neutral-800 rounded mb-2" />
          <div className="h-3 w-40 bg-gray-200 dark:bg-neutral-800 rounded mb-1" />
          <div className="h-3 w-28 bg-gray-200 dark:bg-neutral-800 rounded" />
        </div>
      ))}
    </div>
  );
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
function pad(n: number) { return String(n).padStart(2, "0"); }

async function fetchJSON(url: string, signal?: AbortSignal) {
  const r = await fetch(url, { cache: "no-store", signal });
  if (!r.ok) throw new Error(`HTTP ${r.status} @ ${url}`);
  return r.json();
}
