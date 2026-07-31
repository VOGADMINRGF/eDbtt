import "server-only";

import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { stableHash } from "@core/utils/hash";
import { getClientIp } from "@/utils/rateLimitHelpers";
import type {
  PersistentRateLimitInput,
  PersistentRateLimitResult,
} from "@/utils/persistentRateLimit";
import { getCreateContributionDraftForResumeRecord } from "@/server/serverDrafts";
import {
  CREATE_MUTATION_CSRF_HEADER,
  CREATE_MUTATION_CSRF_VALUE,
} from "@/features/create/createMutationSecurityContract";

export type CreateMutationScope =
  | "create_save"
  | "create_intelligent_followup"
  | "create_link_analysis";

const RATE_LIMITS: Record<
  CreateMutationScope,
  {
    userLimit: number;
    ipLimit: number;
    windowMs: number;
  }
> = {
  create_save: {
    userLimit: 60,
    ipLimit: 120,
    windowMs: 15 * 60 * 1000,
  },
  create_intelligent_followup: {
    userLimit: 12,
    ipLimit: 30,
    windowMs: 10 * 60 * 1000,
  },
  create_link_analysis: {
    userLimit: 12,
    ipLimit: 30,
    windowMs: 10 * 60 * 1000,
  },
};

const MAX_CREATE_MUTATION_BYTES = 64 * 1024;

type CreateRateLimiter = (
  input: PersistentRateLimitInput,
) => Promise<PersistentRateLimitResult>;

async function loadCreateRateLimiter(): Promise<CreateRateLimiter | null> {
  if (process.env.NEXT_RUNTIME === "edge") return null;
  const module = await import("@/utils/persistentRateLimit");
  return typeof module.consumePersistentRateLimit === "function"
    ? module.consumePersistentRateLimit
    : null;
}

function digest(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function normalizeLocale(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .startsWith("en")
    ? "en"
    : "de";
}

function expectedRequestOrigin(req: NextRequest) {
  return new URL(req.url).origin;
}

function genericSecurityFailure(
  status: 403 | 413 | 429 | 503,
  errorCode:
    | "CREATE_REQUEST_REJECTED"
    | "CREATE_REQUEST_TOO_LARGE"
    | "CREATE_RATE_LIMITED"
    | "CREATE_RATE_LIMIT_UNAVAILABLE",
  retryAfterSeconds?: number,
) {
  const response = NextResponse.json(
    {
      ok: false,
      errorCode,
      message: "Die Anfrage konnte nicht verarbeitet werden.",
    },
    { status },
  );
  if (retryAfterSeconds && retryAfterSeconds > 0) {
    response.headers.set("Retry-After", String(retryAfterSeconds));
  }
  return response;
}

export async function enforceCreateMutationSecurity(input: {
  req: NextRequest;
  scope: CreateMutationScope;
  actorKey: string;
}): Promise<NextResponse | null> {
  const origin = input.req.headers.get("origin")?.trim() ?? "";
  const fetchSite = input.req.headers.get("sec-fetch-site")?.trim().toLowerCase() ?? "";
  const csrfIntent = input.req.headers.get(CREATE_MUTATION_CSRF_HEADER)?.trim() ?? "";
  if (
    !origin ||
    origin !== expectedRequestOrigin(input.req) ||
    fetchSite !== "same-origin" ||
    csrfIntent !== CREATE_MUTATION_CSRF_VALUE
  ) {
    return genericSecurityFailure(403, "CREATE_REQUEST_REJECTED");
  }

  const contentLength = Number(input.req.headers.get("content-length") ?? "0");
  if (
    !Number.isFinite(contentLength) ||
    contentLength < 0 ||
    contentLength > MAX_CREATE_MUTATION_BYTES
  ) {
    return genericSecurityFailure(413, "CREATE_REQUEST_TOO_LARGE");
  }

  const policy = RATE_LIMITS[input.scope];
  try {
    const limiter = await loadCreateRateLimiter();
    if (!limiter) {
      return genericSecurityFailure(503, "CREATE_RATE_LIMIT_UNAVAILABLE");
    }
    const actorHash = digest(`${input.scope}:actor:${input.actorKey}`);
    const ipHash = digest(`${input.scope}:ip:${getClientIp(input.req)}`);
    const [userLimit, ipLimit] = await Promise.all([
      limiter({
        namespace: `create:${input.scope}:actor`,
        subjectHash: actorHash,
        limit: policy.userLimit,
        windowMs: policy.windowMs,
      }),
      limiter({
        namespace: `create:${input.scope}:ip`,
        subjectHash: ipHash,
        limit: policy.ipLimit,
        windowMs: policy.windowMs,
      }),
    ]);
    const limited = !userLimit.ok ? userLimit : !ipLimit.ok ? ipLimit : null;
    if (limited) {
      return genericSecurityFailure(
        429,
        "CREATE_RATE_LIMITED",
        Math.ceil(limited.retryIn / 1000),
      );
    }
  } catch {
    return genericSecurityFailure(503, "CREATE_RATE_LIMIT_UNAVAILABLE");
  }
  return null;
}

export type VerifiedCreateDraftBinding = {
  draftId: string;
  userId: string;
  payloadHash: string;
  inputHash: string;
};

function readDraftPayloadHash(analysis: unknown) {
  if (!analysis || typeof analysis !== "object" || Array.isArray(analysis)) {
    return null;
  }
  const runtime = (analysis as Record<string, unknown>).draftWriteRuntime;
  if (!runtime || typeof runtime !== "object" || Array.isArray(runtime)) {
    return null;
  }
  const payloadHash = String(
    (runtime as Record<string, unknown>).payloadHash ?? "",
  ).trim();
  return payloadHash || null;
}

export async function verifyCreateDraftBinding(input: {
  draftId: string;
  userId: string;
  text: string;
  locale?: string | null;
  anlassraumId?: string | null;
}): Promise<VerifiedCreateDraftBinding | null> {
  const normalizedText = input.text.trim();
  const normalizedLocale = normalizeLocale(input.locale);
  if (!normalizedText) return null;

  const draft = await getCreateContributionDraftForResumeRecord(
    input.draftId.trim(),
    input.userId,
  ).catch(() => null);
  if (
    !draft ||
    draft.storage !== "drafts" ||
    draft.status !== "draft" ||
    draft.userId !== input.userId ||
    normalizeLocale(draft.locale) !== normalizedLocale ||
    (input.anlassraumId !== undefined &&
      String(draft.anlassraumId ?? "") !== String(input.anlassraumId ?? ""))
  ) {
    return null;
  }

  const payloadHash = readDraftPayloadHash(draft.analysis);
  if (!payloadHash) return null;
  const storedTexts = [draft.text, draft.textOriginal, draft.textPrepared]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
  if (!storedTexts.includes(normalizedText)) return null;

  return {
    draftId: draft.id,
    userId: input.userId,
    payloadHash,
    inputHash: stableHash({
      userId: input.userId,
      draftId: draft.id,
      status: draft.status,
      text: normalizedText,
      locale: normalizedLocale,
      anlassraumId: draft.anlassraumId ?? null,
      payloadHash,
      updatedAt: draft.updatedAt?.toISOString() ?? null,
    }),
  };
}
