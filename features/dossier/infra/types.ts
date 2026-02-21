export type DossierSnapshot = {
  snapshotId: string;
  dossierId: string;
  createdAt: string;
  contentHash: string;
  previousHash?: string;
  signature: string;
  publicKey: string;
  publicKeyId: string;
};

export type AuditEvent = {
  eventId: string;
  dossierId: string;
  actorRole: string;
  action: string;
  diff?: unknown;
  timestamp: string;
  previousHash?: string;
  eventHash: string;
};

export type WorkflowState = "draft" | "in_review" | "approved" | "published" | "archived";

export type WorkflowDoc = {
  dossierId: string;
  state: WorkflowState;
  updatedAt: string;
  updatedByRole: string;
  updatedByUserId?: string;
};

export type IssueDelegation = {
  delegationId: string;
  dossierId: string;
  questionId: string;
  status: "offen" | "in_bearbeitung" | "abgeschlossen" | string;
  delegatedTo?: string;
  level?: "kommune" | "land" | "bund" | string;
  requestedAt?: string;
  updatedAt?: string;
  note?: string;
};

export type MaterialKind = "statement" | "contribution";

export type MaterialLink = {
  linkId: string;
  dossierId: string;
  kind: MaterialKind;
  itemId: string;
  createdAt: string;
  createdByRole: string;
  createdByUserId?: string;
  note?: string;
  edgeType?: "supports" | "mentions" | "contradicts" | "unknown";
  itemTitle?: string;
  itemExcerpt?: string;
  itemSource?: string;
};

export type StoredDossier = {
  dossierId: string;
  createdAt: string;
  updatedAt: string;
  createdByRole: string;
  createdByUserId?: string;
  dossier: unknown;
};

export type DossierExportBundle = {
  ok: true;
  exportedAt: string;
  dossier: unknown;
  snapshot: DossierSnapshot | null;
  auditTrail: AuditEvent[];
  workflow?: WorkflowDoc | null;
  delegations?: IssueDelegation[];
  materialLinks?: MaterialLink[];
};

export type ClarificationRequest = {
  requestId: string;
  dossierId?: string;
  municipality?: string;
  topic?: string;
  questionText: string;
  context?: string;
  requestedByRole: string;
  requestedByUserId?: string;
  status: "open" | "accepted" | "rejected" | "in_progress" | "done";
  createdAt: string;
  updatedAt: string;
  decidedAt?: string;
  decidedByRole?: string;
  decidedByUserId?: string;
  decisionNote?: string;
  linkedDossierId?: string;
};

export type WatchlistEntry = {
  entryId: string;
  userId: string;
  dossierId: string;
  createdAt: string;
  lastSeenAt?: string;
};

export type EditorialInboxItem = {
  itemId: string;
  kind: "clarification_request";
  requestId: string;
  dossierId?: string;
  municipality?: string;
  topic?: string;
  title: string;
  subtitle?: string;
  status: "open" | "accepted" | "rejected";
  createdAt: string;
};
