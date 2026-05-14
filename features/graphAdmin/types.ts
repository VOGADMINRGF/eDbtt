import type { ObjectId } from "@core/db/triMongo";

export const GRAPH_REPAIR_TYPES = [
  "graph_unavailable",
  "missing_env",
  "db_unreachable",
  "adapter_not_configured",
  "schema_missing",
  "broken_path",
  "orphan_node",
  "duplicate_candidate",
  "unlinked_evidence",
  "feed_statement_mapping_mismatch",
  "topic_statement_mapping_mismatch",
  "graph_review_required",
  "merge_suggest",
  "relink",
] as const;
export type GraphRepairType = (typeof GRAPH_REPAIR_TYPES)[number];

export const GRAPH_REPAIR_STATUSES = ["open", "in_review", "resolved", "ignored", "blocked", "pending", "applied", "rejected"] as const;
export type GraphRepairStatus = (typeof GRAPH_REPAIR_STATUSES)[number];

export const GRAPH_REPAIR_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type GraphRepairSeverity = (typeof GRAPH_REPAIR_SEVERITIES)[number];

export type GraphRepairDoc = {
  _id?: ObjectId;
  type: GraphRepairType;
  status: GraphRepairStatus;
  severity?: GraphRepairSeverity;
  entityId?: string | null;
  entityLabel?: string | null;
  cause?: string | null;
  proposedAction?: string | null;
  nextActions?: string[] | null;
  systemGenerated?: boolean;
  payload: {
    aId?: string;
    bId?: string;
    fromId?: string;
    toId?: string;
    reason?: string | null;
    healthStatus?: string | null;
    healthReason?: string | null;
    readError?: string | null;
    writeError?: string | null;
  };
  createdByUserId?: ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
  appliedAt?: Date | null;
  appliedByUserId?: ObjectId | null;
  rejectedAt?: Date | null;
  rejectedByUserId?: ObjectId | null;
  rejectReason?: string | null;
};

export type GraphHealthSummary = {
  nodes: number;
  edges: number;
  orphans: number;
  duplicatesSuggested: number;
  brokenPaths: number;
  unlinkedEvidence: number;
  lastSyncAt: string | null;
};
