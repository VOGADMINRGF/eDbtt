// apps/web/src/app/api/contributions/analyze/stream/route.ts
import type { NextRequest } from "next/server";
import { runPipeline } from "@/pipeline/registry";
import { selectStepsFromParam } from "@/pipeline/manifest";

export const dynamic = "force-dynamic";

type Send = (event: string, data?: unknown) => void;
type Inputs = Record<string, unknown>;

/** tolerant JSON-Parser (plain, uri-encoded, base64) */
function parseInputs(raw: string | null): Inputs {
  if (!raw) return {};
  const tryParse = (s: string) => {
    try { return JSON.parse(s); } catch { return null; }
  };
  // 1) direkt
  let obj = tryParse(raw);
  if (obj) return obj as Inputs;
  // 2) URI-decoded
  obj = tryParse(decodeURIComponent(raw));
  if (obj) return obj as Inputs;
  // 3) base64
  try { obj = tryParse(Buffer.from(raw, "base64").toString("utf8")); } catch {}
  return (obj || {}) as Inputs;
}

/** sammelt Inputs auch aus Einzel-Query-Params ein (lang=de&region=DE …) */
function collectInputs(sp: URLSearchParams): Inputs {
  const reserved = new Set(["text", "steps", "inputs", "i", "data"]);
  const bag: Inputs = parseInputs(sp.get("inputs") || sp.get("i") || sp.get("data"));
  for (const [k, v] of sp.entries()) {
    if (reserved.has(k)) continue;
    // einfache Heuristik für Zahlen/Booleans
    if (v === "true" || v === "false") bag[k] = v === "true";
    else if (!Number.isNaN(Number(v)) && v.trim() !== "") bag[k] = Number(v);
    else bag[k] = v;
  }
  return bag;
}

/** kleines SSE-Hilfsgerüst */
function sse(req: Request, handler: (send: Send, signal: AbortSignal) => Promise<void>): Response {
  const enc = new TextEncoder();
  let hb: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send: Send = (event, data) => {
        const payload = data === undefined ? "" : `data:${JSON.stringify(data)}\n`;
        controller.enqueue(enc.encode(`event:${event}\n${payload}\n`));
      };

      hb = setInterval(() => controller.enqueue(enc.encode(`:ping\n\n`)), 15_000);

      const onAbort = () => {
        try { controller.close(); } finally { if (hb) clearInterval(hb); }
      };
      req.signal.addEventListener("abort", onAbort);

      (async () => {
        try {
          await handler(send, req.signal);
          send("done", {});
        } catch (e: any) {
          send("error", { msg: e?.message ?? "Unbekannter Fehler" });
        } finally {
          if (hb) clearInterval(hb);
          controller.close();
          req.signal.removeEventListener("abort", onAbort);
        }
      })();
    },
    cancel() { if (hb) clearInterval(hb); }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no"
    }
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = (searchParams.get("text") || "").trim();
  const stepsParam = searchParams.get("steps") || "";
  const inputs = collectInputs(searchParams);

  return sse(req, async (send, signal) => {
    if (!text) { send("error", { msg: "Kein Text übergeben." }); return; }

    const steps = selectStepsFromParam(stepsParam);
    // dem Client das „Manifest“ inkl. Inputs schicken (praktisch fürs UI)
    send("manifest", {
      steps: steps.map(s => ({ id: s.id, label: s.label })),
      inputs
    });

    // Inputs gehen als data in die Pipeline
    await runPipeline({ text, data: inputs }, send, steps, signal as any);
  });
}
