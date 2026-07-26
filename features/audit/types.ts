import type { ObjectId } from "@core/db/triMongo";

export const AUDIT_SCOPES = [
  "admin",
  "org",
  "editorial",
  "access",
  "report",
  "graph",
  "user",
] as const;
export type AuditScope = (typeof AUDIT_SCOPES)[number];

export type AuditActor = {
  userId?: ObjectId | null;
  ipHash?: string | null;
};

export type AuditTarget = {
  type: string;
  id?: string | null;
};

export type AuditEventDoc = {
  _id?: ObjectId;
  at: Date;
  actor: AuditActor;
  scope: AuditScope;
  action: string;
  target: AuditTarget;
  result?: string | null;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
};
