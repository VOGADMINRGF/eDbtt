import { coreCol } from "@core/db/triMongo";
import { listCommunityRooms } from "@core/community";
import { getCampaignBySlug, listCampaignQuestions, saveCampaign, saveCampaignQuestion } from "./store";
import type { CampaignQuestion } from "./types";

type SeedOptions = {
  statementLimit?: number;
  roomLimit?: number;
  force?: boolean;
};

type SeedResult = {
  ok: boolean;
  status: "seeded" | "already_seeded" | "skipped";
  campaignId?: string;
  createdQuestions: number;
  statementCount: number;
  roomCount: number;
};

type StatementDoc = {
  _id?: any;
  id?: string;
  title?: string;
  text?: string;
  topic?: string | null;
  regionCode?: string | null;
  updatedAt?: Date | string;
  createdAt?: Date | string;
};

const DEFAULT_STATEMENT_LIMIT = 6;
const DEFAULT_ROOM_LIMIT = 4;
const SEED_SLUG = "current-pulse";
const SEED_TAG = "seed:current";

function truncate(input?: string | null, max = 120): string {
  if (!input) return "";
  const trimmed = input.replace(/\s+/g, " ").trim();
  if (!trimmed) return "";
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

function normalizePrompt(prompt: string): string {
  return prompt.trim().toLowerCase();
}

function buildStatementPrompt(doc: StatementDoc) {
  const title = truncate(doc.title || doc.text, 120) || "Statement";
  const topic = doc.topic ? ` (Thema: ${doc.topic})` : "";
  return `Wie bewertest du die Aussage: "${title}"?${topic}`;
}

function buildRoomPrompt(title: string) {
  return `Wie relevant ist das Thema im Raum "${title}"?`;
}

function buildSourceKey(prefix: string, id: string) {
  return `source:${prefix}:${id}`;
}

export async function seedCampaignsFromCurrent(
  options: SeedOptions = {},
): Promise<SeedResult> {
  const statementLimit = options.statementLimit ?? DEFAULT_STATEMENT_LIMIT;
  const roomLimit = options.roomLimit ?? DEFAULT_ROOM_LIMIT;

  const statementsCol = await coreCol<StatementDoc>("statements");
  const statementDocs = await statementsCol
    .find({})
    .project({ id: 1, title: 1, text: 1, topic: 1, regionCode: 1, updatedAt: 1, createdAt: 1 })
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(statementLimit)
    .toArray();

  const rooms = await listCommunityRooms({ status: "open", limit: roomLimit });

  if (!statementDocs.length && !rooms.length) {
    return {
      ok: false,
      status: "skipped",
      createdQuestions: 0,
      statementCount: 0,
      roomCount: 0,
    };
  }

  const existing = await getCampaignBySlug(SEED_SLUG);
  if (existing && !options.force) {
    return {
      ok: true,
      status: "already_seeded",
      campaignId: existing.id,
      createdQuestions: 0,
      statementCount: statementDocs.length,
      roomCount: rooms.length,
    };
  }

  const campaign = await saveCampaign({
    id: existing?.id,
    slug: SEED_SLUG,
    title: "Aktuelle Debatten",
    description: "Automatisch aus aktuellen Statements und Community-Raeumen generiert.",
    status: "active",
    kind: "community",
    tags: Array.from(new Set([...(existing?.tags ?? []), SEED_TAG])),
  });

  const existingQuestions = await listCampaignQuestions(campaign.id!);
  const existingPromptSet = new Set(existingQuestions.map((q) => normalizePrompt(q.prompt)));
  const existingSourceSet = new Set(
    existingQuestions
      .map((q) => q.description ?? "")
      .filter(Boolean)
      .flatMap((desc) => desc.split("\n").filter((line) => line.startsWith("source:"))),
  );

  let createdQuestions = 0;
  let order = existingQuestions.length;

  const addQuestion = async (payload: CampaignQuestion) => {
    await saveCampaignQuestion(payload);
    createdQuestions += 1;
    order += 1;
  };

  for (const stmt of statementDocs) {
    const statementId = stmt.id ?? stmt._id?.toString?.() ?? "";
    if (!statementId) continue;
    const sourceKey = buildSourceKey("statement", statementId);
    if (existingSourceSet.has(sourceKey)) continue;
    const prompt = buildStatementPrompt(stmt);
    if (existingPromptSet.has(normalizePrompt(prompt))) continue;

    const descriptionParts = [sourceKey];
    if (stmt.regionCode) descriptionParts.push(`region:${stmt.regionCode}`);
    if (stmt.topic) descriptionParts.push(`topic:${stmt.topic}`);

    await addQuestion({
      campaignId: campaign.id!,
      prompt,
      description: descriptionParts.join("\n"),
      type: "choice",
      options: ["Stimme zu", "Neutral", "Stimme nicht zu"],
      order,
      status: "active",
    });
  }

  for (const room of rooms) {
    const sourceKey = buildSourceKey("room", room.id);
    if (existingSourceSet.has(sourceKey)) continue;
    const prompt = buildRoomPrompt(room.title);
    if (existingPromptSet.has(normalizePrompt(prompt))) continue;

    const descriptionParts = [sourceKey];
    if (room.tags?.length) descriptionParts.push(`tags:${room.tags.join(",")}`);

    await addQuestion({
      campaignId: campaign.id!,
      prompt,
      description: descriptionParts.join("\n"),
      type: "choice",
      options: ["Sehr relevant", "Teilweise", "Nicht relevant"],
      order,
      status: "active",
    });
  }

  return {
    ok: true,
    status: "seeded",
    campaignId: campaign.id,
    createdQuestions,
    statementCount: statementDocs.length,
    roomCount: rooms.length,
  };
}
