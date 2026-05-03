import { ObjectId, coreCol } from "@core/db/triMongo";
import type { Collection, Filter, WithId } from "mongodb";
import type { CommunityContribution, CommunityContributionStatus } from "./types";

type CommunityContributionDoc = Omit<CommunityContribution, "id"> & { _id: ObjectId };

type ContributionFilter = {
  topicId?: string | null;
  candidateId?: string | null;
  status?: CommunityContributionStatus;
  limit?: number;
};

async function contributionsCol(): Promise<Collection<CommunityContributionDoc>> {
  return coreCol<CommunityContributionDoc>("communityContributions");
}

function cleanText(value: unknown, maxLength = 4_000): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.slice(0, maxLength);
}

function normalizeLocaleTag(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  const short = normalized.slice(0, 2);
  if (short.length !== 2) return null;
  return short;
}

function normalizeTranslationStatus(value: unknown): "missing" | "pending" | "translated" | "failed" {
  if (value === "pending" || value === "translated" || value === "failed") return value;
  return "missing";
}

function normalizeTranslations(value: unknown, maxLength: number): Record<string, string | null> {
  if (!value || typeof value !== "object") return {};
  const out: Record<string, string | null> = {};
  for (const [rawLocale, rawText] of Object.entries(value as Record<string, unknown>)) {
    const locale = normalizeLocaleTag(rawLocale);
    if (!locale) continue;
    const text = cleanText(rawText, maxLength);
    if (!text) continue;
    out[locale] = text;
  }
  return out;
}

function buildLocalizedContent(params: {
  value: CommunityContribution["titleContent"] | CommunityContribution["bodyContent"];
  fallbackOriginalText: string | null;
  maxLength: number;
}): CommunityContribution["titleContent"] | null {
  const fallback = cleanText(params.fallbackOriginalText, params.maxLength);
  const originalText = cleanText(params.value?.originalText, params.maxLength) || fallback;
  const translations = normalizeTranslations(params.value?.translations, params.maxLength);
  if (!originalText && Object.keys(translations).length === 0) return null;
  return {
    originalLanguage: normalizeLocaleTag(params.value?.originalLanguage),
    originalText: originalText || null,
    translations,
    translationStatus: normalizeTranslationStatus(params.value?.translationStatus),
    translatedAt:
      params.value?.translatedAt instanceof Date || typeof params.value?.translatedAt === "string"
        ? params.value.translatedAt
        : null,
    translationProvider: cleanText(params.value?.translationProvider, 120) || null,
    translationModel: cleanText(params.value?.translationModel, 120) || null,
  };
}

function sanitize(doc: WithId<CommunityContributionDoc>): CommunityContribution {
  const { _id, ...rest } = doc;
  const titleContent = buildLocalizedContent({
    value: rest.titleContent ?? null,
    fallbackOriginalText: cleanText(rest.title, 160) || null,
    maxLength: 160,
  });
  const bodyContent = buildLocalizedContent({
    value: rest.bodyContent ?? null,
    fallbackOriginalText: cleanText(rest.body, 2_000) || null,
    maxLength: 2_000,
  });
  return { ...rest, titleContent, bodyContent, id: _id.toHexString() };
}

function buildFilter(filter?: ContributionFilter): Filter<CommunityContributionDoc> {
  const query: Filter<CommunityContributionDoc> = {};
  if (filter?.topicId) query.topicId = filter.topicId;
  if (filter?.candidateId) query.candidateId = filter.candidateId;
  if (filter?.status) query.status = filter.status;
  return query;
}

export async function listCommunityContributions(
  filter?: ContributionFilter,
): Promise<CommunityContribution[]> {
  const col = await contributionsCol();
  const query = buildFilter(filter);
  const cursor = col.find(query).sort({ createdAt: -1 });
  const docs =
    typeof filter?.limit === "number" ? await cursor.limit(filter.limit).toArray() : await cursor.toArray();
  return docs.map(sanitize);
}

export async function createCommunityContribution(
  input: CommunityContribution,
): Promise<CommunityContribution> {
  const col = await contributionsCol();
  const now = new Date();
  const titleFallback = cleanText(input.title, 160) || null;
  const bodyFallback = cleanText(input.body, 2_000) || null;
  const titleContent = buildLocalizedContent({
    value: input.titleContent ?? null,
    fallbackOriginalText: titleFallback,
    maxLength: 160,
  });
  const bodyContent = buildLocalizedContent({
    value: input.bodyContent ?? null,
    fallbackOriginalText: bodyFallback,
    maxLength: 2_000,
  });
  const normalizedTitle = titleFallback || titleContent?.originalText || null;
  const normalizedBody = bodyFallback || bodyContent?.originalText || null;
  const doc: CommunityContributionDoc = {
    _id: new ObjectId(),
    type: input.type,
    status: input.status ?? "proposed",
    topicId: input.topicId ?? null,
    candidateId: input.candidateId ?? null,
    title: normalizedTitle,
    body: normalizedBody,
    titleContent,
    bodyContent,
    url: input.url ?? null,
    authorName: input.authorName ?? null,
    authorVisibility: input.authorVisibility ?? null,
    authorKind: input.authorKind ?? null,
    organizationLabel: input.organizationLabel ?? null,
    representativeName: input.representativeName ?? null,
    hostedRoomScope: input.hostedRoomScope ?? null,
    confidentialHint: input.confidentialHint ?? null,
    authorId: input.authorId ?? null,
    reviewNote: input.reviewNote ?? null,
    createdAt: now,
    updatedAt: now,
  };
  await col.insertOne(doc);
  return sanitize(doc);
}

export async function updateCommunityContributionStatus(
  id: string,
  status: CommunityContributionStatus,
  reviewNote?: string | null,
): Promise<CommunityContribution | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await contributionsCol();
  const update: Partial<CommunityContributionDoc> = {
    status,
    updatedAt: new Date(),
  };
  if (reviewNote !== undefined) update.reviewNote = reviewNote;
  const result = await col.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: update },
    { returnDocument: "after" },
  );
  return result ? sanitize(result) : null;
}
