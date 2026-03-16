import { COMPANION_CONTEXT_SEED, ROUND_SEED, TOPIC_SEED } from "./data";
import type { CompanionContext, Round, Topic } from "./types";

export function listTopics(): Topic[] {
  return [...TOPIC_SEED];
}

export function getTopicBySlug(slug: string): Topic | null {
  return TOPIC_SEED.find((topic) => topic.slug === slug) ?? null;
}

export function listRounds(): Round[] {
  return [...ROUND_SEED].sort((a, b) => (a.startedAt > b.startedAt ? -1 : 1));
}

export function getRoundBySlug(slug: string): Round | null {
  return ROUND_SEED.find((round) => round.slug === slug) ?? null;
}

export function listRoundsByTopicSlug(topicSlug: string): Round[] {
  return ROUND_SEED.filter((round) => round.topicSlug === topicSlug).sort((a, b) =>
    a.startedAt > b.startedAt ? -1 : 1,
  );
}

export function listCompanionContexts(): CompanionContext[] {
  return [...COMPANION_CONTEXT_SEED].sort((a, b) => (a.publishedAt > b.publishedAt ? -1 : 1));
}

export function getCompanionContextBySlug(slug: string): CompanionContext | null {
  return COMPANION_CONTEXT_SEED.find((context) => context.slug === slug) ?? null;
}

export function listCompanionContextsByTopicSlug(topicSlug: string): CompanionContext[] {
  return listCompanionContexts().filter((context) => context.linkedTopicSlug === topicSlug);
}

export function findCompanionContextByRoundSlug(roundSlug: string): CompanionContext | null {
  return (
    COMPANION_CONTEXT_SEED.find((context) => context.linkedRoundSlug === roundSlug) ??
    null
  );
}

export function findCompanionContextByTopicAndType(
  topicSlug: string,
  type?: string,
): CompanionContext | null {
  const contexts = listCompanionContextsByTopicSlug(topicSlug);
  if (type) {
    const typed = contexts.find((context) => context.type === type);
    if (typed) return typed;
  }
  return contexts[0] ?? null;
}

export function listTopicReviewLog(topicSlug: string, includeManagementOnly = false) {
  const topic = getTopicBySlug(topicSlug);
  if (!topic) return [];
  return topic.reviewLog
    .filter((entry) => includeManagementOnly || entry.visibility === "public")
    .sort((a, b) => (a.reviewedAt > b.reviewedAt ? -1 : 1));
}
