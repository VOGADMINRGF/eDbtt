// apps/web/src/app/api/factcheck/intern/enqueue/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { getFactcheckQueue } from "@core/queue/factcheckQueue";

export const runtime = "nodejs";
const log = {
  info: (o: any, m?: string) => {
    try {
      console.log(m ?? "INFO", o);
    } catch {
      /* ignore */
    }
  },
  warn: (o: any, m?: string) => {
    try {
      console.warn(m ?? "WARN", o);
    } catch {
      /* ignore */
    }
  },
  error: (o: any, m?: string) => {
    try {
      console.error(m ?? "ERR", o);
    } catch {
      /* ignore */
    }
  },
};

const json = (body: any, status = 200, extra?: Record<string, string>) => {
  const res = NextResponse.json(body, { status });
  res.headers.set("Cache-Control", "no-store");
  if (extra) for (const [k, v] of Object.entries(extra)) res.headers.set(k, v);
  return res;
};

const LangRe = /^[a-z]{2}(?:-[A-Z]{2})?$/;

function isAuthorized(req: NextRequest): boolean {
  const token = process.env.EDITOR_TOKEN || "";
  if (!token) return false;
  const hdr = req.headers.get("authorization") || "";
  const viaBearer =
    hdr.toLowerCase().startsWith("bearer ") && hdr.slice(7).trim() === token;
  const viaHeader = (req.headers.get("x-editor-token") || "").trim() === token;
  const viaCookie =
    (req.cookies.get("editor_token")?.value || "").trim() === token;
  return viaBearer || viaHeader || viaCookie;
}

export async function POST(req: NextRequest) {
  const traceId =
    (globalThis as any).crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random()}`;
  const t0 = Date.now();

  if (!ENABLED) {
    return json(
      { ok: false, traceId, code: "DISABLED", message: "Endpoint disabled" },
      404,
    );
  }
  if (!isAuthorized(req)) {
    return json(
      { ok: false, traceId, code: "FORBIDDEN", message: "Unauthorized" },
      403,
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(
      { ok: false, traceId, code: "INVALID_JSON", message: "Malformed JSON" },
      400,
    );
  }

  try {
    const payload = EnqueueSchema.parse(body);
    const lang = toShortLang(payload.language);

    const idem = req.headers.get("x-idempotency-key")?.trim();
    const jobId = idem
      ? `fc:${idem}`
      : `fc:${Date.now()}:${(globalThis as any).crypto?.randomUUID?.() ?? Math.random()}`;

    const queue = getFactcheckQueue();

    let job;
    try {
      job = await queue.add(
        "deep-seg-and-check",
        {
          sourceId: payload.contributionId ?? null,
          lang,
          text: payload.text ?? null,
          topic: payload.topic ?? null,
          requestId: traceId,
        },
        {
          jobId,
          priority: payload.priority,
          attempts: 2,
          backoff: { type: "exponential", delay: 3000 },
          removeOnComplete: false,
          removeOnFail: false,
        },
      );
    } catch (e: any) {
      const msg = String(e?.message || e);
      if (idem && /already exists/i.test(msg)) {
        log.info({ jobId, traceId }, "FACTCHECK_ENQUEUE_IDEMPOTENT_HIT");
        return json({ ok: true, jobId, requestId: traceId }, 202, {
          Location: `/api/factcheck/status/${jobId}`,
          "X-Request-Id": traceId,
        });
      }
      throw e;
    }

    const took = Date.now() - t0;
    log.info(
      {
        jobId: job.id ?? jobId,
        tookMs: took,
        hasText: !!payload.text,
        lang,
        traceId,
      },
      "FACTCHECK_ENQUEUE_OK",
    );

    return json({ ok: true, jobId: job.id ?? jobId, requestId: traceId }, 202, {
      Location: `/api/factcheck/status/${job.id ?? jobId}`,
      "X-Request-Id": traceId,
    });
  } catch (e: any) {
    if (e instanceof ZodError) {
      const details = e.issues.map(
        (i) => `${i.path.join(".") || "(root)"}: ${i.message}`,
      );
      log.warn({ traceId, details }, "FACTCHECK_ENQUEUE_VALIDATION_FAIL");
      return json(
        {
          ok: false,
          traceId,
          code: "VALIDATION_FAILED",
          message: "Invalid factcheck request",
          details,
        },
        400,
      );
    }
    log.error(
      { traceId, err: String(e?.message ?? e) },
      "FACTCHECK_ENQUEUE_FAIL",
    );
    return json(
      {
        ok: false,
        traceId,
        code: "INTERNAL_ERROR",
        message: "Unexpected failure",
      },
      500,
    );
  }
}
