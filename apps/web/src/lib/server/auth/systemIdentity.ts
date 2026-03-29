import type { NextRequest } from "next/server";

const SYSTEM_SOURCES = [
  "factcheck_queue",
  "factcheck_worker",
  "finding_queue",
  "finding_worker",
] as const;

const SYSTEM_ACTOR_KINDS = [
  "queue_scheduler",
  "queue_worker",
] as const;

export type InternalSystemSource = (typeof SYSTEM_SOURCES)[number];
export type InternalSystemActorKind = (typeof SYSTEM_ACTOR_KINDS)[number];

export type InternalSystemIdentity = {
  source: InternalSystemSource;
  actorKind: InternalSystemActorKind;
  runRef: string | null;
  jobRef: string | null;
  requestId: string | null;
};

function readConfiguredSystemToken(): string {
  const token = (process.env.INTERNAL_WORKER_TOKEN ?? process.env.INTERNAL_HEALTH_TOKEN ?? "").trim();
  return token;
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i += 1) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function readToken(headers: Headers, key: string, maxLength = 128): string | null {
  const raw = headers.get(key);
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;
  return value.slice(0, maxLength);
}

function parseSource(value: string | null): InternalSystemSource | null {
  if (!value) return null;
  return SYSTEM_SOURCES.find((candidate) => candidate === value) ?? null;
}

function parseActorKind(value: string | null): InternalSystemActorKind | null {
  if (!value) return null;
  return SYSTEM_ACTOR_KINDS.find((candidate) => candidate === value) ?? null;
}

export function resolveInternalSystemIdentity(
  req: Pick<NextRequest, "headers">,
): InternalSystemIdentity | null {
  const source = parseSource(readToken(req.headers, "x-internal-source", 64));
  const actorKind = parseActorKind(readToken(req.headers, "x-internal-actor-kind", 64));
  if (!source || !actorKind) return null;

  return {
    source,
    actorKind,
    runRef: readToken(req.headers, "x-internal-run-ref"),
    jobRef: readToken(req.headers, "x-internal-job-ref"),
    requestId:
      readToken(req.headers, "x-internal-request-id") ?? readToken(req.headers, "x-request-id"),
  };
}

function readPresentedSystemToken(headers: Headers): string {
  const bearer = readToken(headers, "authorization");
  const fromAuthorization =
    bearer && bearer.toLowerCase().startsWith("bearer ")
      ? bearer.slice(7).trim()
      : "";
  return fromAuthorization || readToken(headers, "x-internal-token") || "";
}

export function resolveTrustedInternalSystemIdentity(
  req: Pick<NextRequest, "headers">,
): InternalSystemIdentity | null {
  const identity = resolveInternalSystemIdentity(req);
  if (!identity) return null;
  const expectedToken = readConfiguredSystemToken();
  if (!expectedToken) return null;
  const presentedToken = readPresentedSystemToken(req.headers);
  if (!presentedToken) return null;
  if (!safeEqual(presentedToken, expectedToken)) return null;
  return identity;
}

export function internalSystemIdentityAuditFields(identity: InternalSystemIdentity | null) {
  return {
    systemIdentitySource: identity?.source ?? null,
    systemIdentityActorKind: identity?.actorKind ?? null,
    systemIdentityRunRef: identity?.runRef ?? null,
    systemIdentityJobRef: identity?.jobRef ?? null,
    systemIdentityRequestId: identity?.requestId ?? null,
  };
}
