import crypto from "node:crypto";
import { coreCol, ObjectId } from "@core/db/triMongo";
import type { AuditEventDoc, AuditScope, AuditTarget } from "./types";
import type { ClientSession } from "mongodb";

const AUDIT_COLLECTION = "audit_events";

let ensured = false;

async function auditCol() {
  const col = await coreCol<AuditEventDoc>(AUDIT_COLLECTION);
  if (!ensured) {
    await col.createIndex({ at: -1 });
    await col.createIndex({ scope: 1, action: 1, "target.type": 1 });
    ensured = true;
  }
  return col;
}

type RecordArgs = {
  scope: AuditScope;
  action: string;
  actorUserId?: string | null;
  actorIp?: string | null;
  target: AuditTarget;
  result?: string | null;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
};

type RecordAuditOptions = {
  at?: Date;
  mongoSession?: ClientSession | null;
};

export async function recordAuditEvent(args: RecordArgs, options?: RecordAuditOptions) {
  const col = await auditCol();
  const actorUserId = args.actorUserId && ObjectId.isValid(args.actorUserId)
    ? new ObjectId(args.actorUserId)
    : null;

  const actor = {
    userId: actorUserId,
    ipHash: args.actorIp ? sha256(args.actorIp) : null,
  };

  const doc: AuditEventDoc = {
    at: options?.at ?? new Date(),
    actor,
    scope: args.scope,
    action: args.action,
    target: args.target,
    result: args.result ?? null,
    before: sanitizeAuditPayload(args.before),
    after: sanitizeAuditPayload(args.after),
    reason: args.reason ?? null,
  };

  await col.insertOne(doc, options?.mongoSession ? { session: options.mongoSession } : undefined);
}

function sha256(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function maskEmail(value: string): string {
  const [name, domain] = value.split("@");
  if (!domain) return value;
  const head = name.slice(0, 2);
  return `${head}${name.length > 2 ? "***" : ""}@${domain}`;
}

function sanitizeAuditPayload(value: unknown, depth = 0): unknown {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (depth > 4) return null;

  if (typeof value === "string") {
    if (/^https?:\/\//i.test(value)) return "[redacted-url]";
    return value.includes("@") ? maskEmail(value) : value;
  }
  if (typeof value === "number" || typeof value === "boolean") return value;

  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    const anyValue = value as any;
    if (anyValue?._bsontype === "ObjectId" && typeof anyValue.toHexString === "function") {
      return anyValue.toHexString();
    }
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((entry) => sanitizeAuditPayload(entry, depth + 1));
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    const keys = Object.keys(obj).slice(0, 50);
    for (const key of keys) {
      if (/password|token|secret|cookie|session|authorization|url/i.test(key)) {
        out[key] = "[redacted]";
        continue;
      }
      const v = obj[key];
      if (typeof v === "string" && /@/.test(v)) {
        out[key] = maskEmail(v);
      } else {
        out[key] = sanitizeAuditPayload(v, depth + 1);
      }
    }
    return out;
  }

  return null;
}
