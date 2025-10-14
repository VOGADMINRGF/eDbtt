/**
 * core/web/worker-client.ts
 * Universeller Web-Client für den Faktencheck-Workflow (enqueue + status).
 * Nicht der BullMQ-Worker! Diese Helfer sprechen nur eure Next-API-Routen.
 */

export type EnqueuePayload = {
    contributionId?: string;
    text?: string;
    language?: string;
    topic?: string;
    priority?: number; // 1..10
  };
  
  export type EnqueueResponse =
    | { ok: true; jobId: string }
    | { ok: false; reason?: string; code?: string; message?: string };
  
  export type StatusResponse =
    | {
        ok: true;
        job: {
          id: string;
          jobId: string;
          status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
          tokensUsed: number;
          durationMs: number;
        };
        claims: Array<{
          id: string;
          text: string;
          language?: string | null;
          topic?: string | null;
          falsifiable: boolean;
          frames: string[];
          rhetoricalFlags: string[];
          providerRuns: Array<{
            id: string;
            provider: string;
            verdict: "true" | "false" | "disputed" | "pending";
            confidence: number;
            costTokens: number;
            latencyMs: number;
            createdAt: string;
          }>;
          evidences: Array<{
            id: string;
            url: string;
            domain: string;
            stance: "FOR" | "AGAINST" | "NEUTRAL";
            trustScore: number | null;
            firstSeenAt: string | null;
          }>;
          consensus: {
            id: string;
            method: string;
            verdict: "true" | "false" | "disputed" | "pending";
            confidence: number;
            balanceScore: number;
            diversityIndex: number;
            createdAt: string;
          } | null;
        }>;
      }
    | { ok: false; reason?: string; code?: string; message?: string };
  
  export type WorkerClientOptions = {
    /**
     * Basis-URL für Server-seitige Aufrufe (z. B. in Server Actions).
     * Browser nutzt automatisch relative Pfade ("").
     * Default (Server): process.env.NEXT_PUBLIC_APP_ORIGIN || "http://localhost:3000"
     */
    baseUrl?: string;
    /** Standardrolle für RBAC-Header/Query, z. B. "editor". */
    defaultRole?: string;
    /**
     * In DEV-Runtime die Rolle zusätzlich als Query-Param übergeben (?role=...),
     * damit Browser-Aufrufe ohne Header funktionieren. Default: true in DEV.
     */
    devQueryRole?: boolean;
    /** Zusätzliche Header (Auth etc.), werden mitgeführt. */
    headers?: Record<string, string>;
  };
  
  const isServer = typeof window === "undefined";
  const nodeEnv =
    typeof process !== "undefined" && process.env && process.env.NODE_ENV
      ? process.env.NODE_ENV
      : "development";
  const isDev = nodeEnv !== "production";
  
  function defaultBaseUrl() {
    if (isServer) {
      // für Server Actions/Routen
      return (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_APP_ORIGIN) || "http://localhost:3000";
    }
    // Browser nutzt relative Pfade
    return "";
  }
  
  async function safeJson(res: Response) {
    try {
      return await res.json();
    } catch {
      return null;
    }
  }
  
  export class WorkerClient {
    private opts: Required<WorkerClientOptions>;
  
    constructor(opts: WorkerClientOptions = {}) {
      this.opts = {
        baseUrl: opts.baseUrl ?? defaultBaseUrl(),
        defaultRole: opts.defaultRole ?? "",
        devQueryRole: opts.devQueryRole ?? isDev,
        headers: opts.headers ?? {}
      };
    }
  
    private headers(role?: string): Record<string, string> {
      const h: Record<string, string> = {
        "Content-Type": "application/json",
        ...this.opts.headers
      };
      const r = role ?? this.opts.defaultRole;
      if (r) h["x-role"] = r;
      return h;
    }
  
    /**
     * Enqueue eines Faktchecks.
     * @param payload  - Text/Beitrag/Meta
     * @param role     - RBAC-Rolle ("editor" empfohlen). Fällt zurück auf defaultRole.
     */
    async enqueueFactcheck(payload: EnqueuePayload, role?: string): Promise<EnqueueResponse> {
      const res = await fetch(`${this.opts.baseUrl}/api/factcheck/enqueue`, {
        method: "POST",
        headers: this.headers(role),
        body: JSON.stringify(payload)
      });
  
      const json = (await safeJson(res)) as any;
      if (!res.ok) {
        return { ok: false, reason: json?.reason, code: json?.code, message: json?.message };
      }
      return json as EnqueueResponse;
    }
  
    /**
     * Status eines Jobs abfragen.
     * In DEV (devQueryRole=true) wird die Rolle als Query-Param übergeben, damit Browser ohne Header testen können.
     */
    async getFactcheckStatus(jobId: string, role?: string): Promise<StatusResponse> {
      const base = `${this.opts.baseUrl}/api/factcheck/status/${encodeURIComponent(jobId)}`;
  
      const r = role ?? this.opts.defaultRole;
      const useQuery = this.opts.devQueryRole && !isServer; // Query nur im Browser/DEV
      const url = useQuery && r ? `${base}?role=${encodeURIComponent(r)}` : base;
  
      const res = await fetch(url, {
        method: "GET",
        headers: useQuery ? {} : this.headers(r),
        cache: "no-store"
      });
  
      const json = (await safeJson(res)) as any;
      if (!res.ok) {
        return { ok: false, reason: json?.reason, code: json?.code, message: json?.message };
      }
      return json as StatusResponse;
    }
  }
  
  /** Bequemer Default-Client (nutzt Defaults/ENV). */
  export const workerClient = new WorkerClient();
  
  /** Komfort-Funktionen (Proxy auf den Default-Client). */
  export async function enqueueFactcheck(payload: EnqueuePayload, role?: string) {
    return workerClient.enqueueFactcheck(payload, role);
  }
  export async function getFactcheckStatus(jobId: string, role?: string) {
    return workerClient.getFactcheckStatus(jobId, role);
  }
  