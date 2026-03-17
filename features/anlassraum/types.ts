import type { ObjectId } from "mongodb";
import type { RegionCode } from "@core/regions/types";
import type {
  StatementRecord,
  NoteRecord,
  QuestionRecord,
  KnotRecord,
} from "@features/analyze/schemas";

export type AnlassraumKind =
  | "event"
  | "issue"
  | "cluster"
  | "research_window"
  | "media_window";

export type AnlassraumSourceMode =
  | "manual"
  | "feed"
  | "single_source"
  | "cluster"
  | "ai_assist";

export type AnlassraumStatus =
  | "auto_ingested"
  | "auto_clustered"
  | "needs_editor_review"
  | "ready_for_round"
  | "published"
  | "archived";

export type AnlassraumReviewMode = "light" | "standard" | "strict";

export type AnlassraumSourceRole = "primary" | "supporting" | "counter" | "context";

export type OutputSeedType =
  | "round_seed"
  | "dossier_seed"
  | "embed_seed"
  | "social_seed"
  | "regional_briefing_seed"
  | "editorial_pitch_seed";

export type OutputSeedStatus =
  | "draft"
  | "queued"
  | "review"
  | "ready"
  | "published"
  | "discarded";

export type OutputSeedReviewState = "pending" | "approved" | "rejected";

export interface AnlassraumDoc {
  _id?: ObjectId;
  kind: AnlassraumKind;
  title: string;
  slug: string;
  regionCode?: RegionCode | null;
  scope?: string | null;
  topicKey?: string | null;
  clusterKey?: string | null;
  sourceMode: AnlassraumSourceMode;
  status: AnlassraumStatus;
  relevanceScore: number;
  reviewMode: AnlassraumReviewMode;
  riskFlags: string[];
  pipeline?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnlassraumSourceLinkDoc {
  _id?: ObjectId;
  anlassraumId: ObjectId;
  ingestItemId?: ObjectId | null;
  statementCandidateId?: ObjectId | null;
  sourceUrl?: string | null;
  sourceWeight: number;
  role: AnlassraumSourceRole;
  publisher?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnlassraumStructureDoc {
  _id?: ObjectId;
  anlassraumId: ObjectId;
  claims: StatementRecord[];
  notes: NoteRecord[];
  questions: QuestionRecord[];
  knots: KnotRecord[];
  segments: string[];
  actors: string[];
  evidenceSummary?: string | null;
  riskFlags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OutputSeedDoc {
  _id?: ObjectId;
  anlassraumId: ObjectId;
  outputType: OutputSeedType;
  status: OutputSeedStatus;
  targetRegion?: RegionCode | null;
  targetAudience?: string | null;
  reviewState: OutputSeedReviewState;
  publishTarget?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
