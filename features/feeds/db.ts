import { coreCol, type ObjectId } from "@core/db/triMongo";
import type {
  StatementCandidate,
  StatementCandidateAnalyzeResultDoc,
  VoteDraftDoc,
  FeedStatementDoc,
  FeedAnlassraumClusterCandidateDoc,
} from "./types";

const CANDIDATE_COLLECTION = "statement_candidates";
const ANALYZE_RESULTS_COLLECTION = "analyze_results";
const VOTE_DRAFTS_COLLECTION = "vote_drafts";
const FEED_STATEMENTS_COLLECTION = "feed_statements";
const FEED_ANLASSRAUM_CLUSTER_CANDIDATES_COLLECTION = "feed_anlassraum_cluster_candidates";

const ensured = {
  candidates: false,
  analyzeResults: false,
  voteDrafts: false,
  feedStatements: false,
  clusterCandidates: false,
};

async function ensureCandidateIndexes() {
  if (ensured.candidates) return;
  const col = await coreCol<StatementCandidate>(CANDIDATE_COLLECTION);
  await col.createIndex({ canonicalHash: 1 }, { unique: true });
  await col.createIndex({ analyzeStatus: 1, analyzeRequestedAt: 1 });
  ensured.candidates = true;
}

async function ensureAnalyzeResultIndexes() {
  if (ensured.analyzeResults) return;
  const col = await coreCol<StatementCandidateAnalyzeResultDoc>(ANALYZE_RESULTS_COLLECTION);
  await col.createIndex({ statementCandidateId: 1 }, { unique: true });
  await col.createIndex({ "pipelineMeta.pipeline": 1, createdAt: -1 });
  ensured.analyzeResults = true;
}

async function ensureVoteDraftIndexes() {
  if (ensured.voteDrafts) return;
  const col = await coreCol<VoteDraftDoc>(VOTE_DRAFTS_COLLECTION);
  await col.createIndex({ statementCandidateId: 1 }, { unique: true });
  await col.createIndex({ status: 1, createdAt: -1 });
  await col.createIndex({ feedReviewState: 1, createdAt: -1 }, { sparse: true });
  await col.createIndex({ anlassraumId: 1, createdAt: -1 }, { sparse: true });
  await col.createIndex({ lastReviewActionAt: -1 }, { sparse: true });
  ensured.voteDrafts = true;
}

async function ensureFeedStatementIndexes() {
  if (ensured.feedStatements) return;
  const col = await coreCol<FeedStatementDoc>(FEED_STATEMENTS_COLLECTION);
  await col.createIndex({ status: 1, createdAt: -1 });
  await col.createIndex({ voteDraftId: 1 }, { unique: true });
  ensured.feedStatements = true;
}

async function ensureClusterCandidateIndexes() {
  if (ensured.clusterCandidates) return;
  const col = await coreCol<FeedAnlassraumClusterCandidateDoc>(
    FEED_ANLASSRAUM_CLUSTER_CANDIDATES_COLLECTION,
  );
  await col.createIndex({ clusterKey: 1 }, { unique: true });
  await col.createIndex({ updatedAt: -1 });
  await col.createIndex({ topicKey: 1, regionCode: 1, windowBucket: 1 });
  ensured.clusterCandidates = true;
}

export async function statementCandidatesCol() {
  await ensureCandidateIndexes();
  return coreCol<StatementCandidate>(CANDIDATE_COLLECTION);
}

export async function analyzeResultsCol() {
  await ensureAnalyzeResultIndexes();
  return coreCol<StatementCandidateAnalyzeResultDoc>(ANALYZE_RESULTS_COLLECTION);
}

export async function voteDraftsCol() {
  await ensureVoteDraftIndexes();
  return coreCol<VoteDraftDoc>(VOTE_DRAFTS_COLLECTION);
}

export async function feedStatementsCol() {
  await ensureFeedStatementIndexes();
  return coreCol<FeedStatementDoc>(FEED_STATEMENTS_COLLECTION);
}

export async function feedAnlassraumClusterCandidatesCol() {
  await ensureClusterCandidateIndexes();
  return coreCol<FeedAnlassraumClusterCandidateDoc>(FEED_ANLASSRAUM_CLUSTER_CANDIDATES_COLLECTION);
}
