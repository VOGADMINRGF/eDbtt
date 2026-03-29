const isDev = process.env.NODE_ENV !== "production";
/**
 * Web-Client-Helfer für den Faktencheck-Workflow (API calls).
 * Diese Datei existiert, weil irgendwo `lib/worker` importiert wird.
 * NICHT der BullMQ-Worker!
 */

type EnqueuePayload = {
  contributionId?: string;
  text?: string;
  language?: string;
  topic?: string;
  priority?: number;
};

type EnqueueResponse =
  | { ok: true; jobId: string; message?: string }
  | { ok: false; reason?: string; code?: string; message?: string };

type StatusResponse =
  | {
      ok: true;
      job: {
        id: string;
        jobId: string;
        status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
        tokensUsed: number;
        durationMs: number;
      };
      claims: any[];
    }
  | { ok: false; reason?: string; code?: string; message?: string };

const isServer = typeof window === "undefined";

function baseUrl() {
  return isServer
    ? (process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000")
    : "";
}

function internalWorkerToken(): string {
  return (process.env.INTERNAL_WORKER_TOKEN ?? process.env.INTERNAL_HEALTH_TOKEN ?? "").trim();
}

function requestRef(): string {
  return `run_${Date.now()}`;
}

function systemHeaders(source: "factcheck_queue" | "factcheck_worker", jobRef?: string) {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (!isServer) return h;
  const token = internalWorkerToken();
  if (!token) {
    throw new Error("internal_worker_token_missing");
  }
  h.authorization = `Bearer ${token}`;
  h["x-internal-source"] = source;
  h["x-internal-actor-kind"] = "queue_worker";
  h["x-internal-run-ref"] = requestRef();
  if (jobRef) h["x-internal-job-ref"] = jobRef;
  return h;
}

export async function enqueueFactcheck(
  payload: EnqueuePayload,
  _role = "editor",
): Promise<EnqueueResponse> {
  const res = await fetch(`${baseUrl()}/api/factcheck/enqueue`, {
    method: "POST",
    headers: systemHeaders("factcheck_queue"),
    body: JSON.stringify(payload),
  });
  try {
    return await res.json();
  } catch {
    return { ok: false, message: "enqueue failed" };
  }
}

export async function getFactcheckStatus(
  jobId: string,
  _role = "editor",
): Promise<StatusResponse> {
  const base = `${baseUrl()}/api/factcheck/status/${encodeURIComponent(jobId)}`;
  const url = !isServer && isDev ? `${base}` : base;
  const res = await fetch(url, {
    headers: isServer ? systemHeaders("factcheck_worker", jobId) : undefined,
    cache: "no-store",
  });
  try {
    return await res.json();
  } catch {
    return { ok: false, message: "status failed" };
  }
}

export default { enqueueFactcheck, getFactcheckStatus };
