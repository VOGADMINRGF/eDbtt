import { coreCol, ObjectId } from "@core/db/triMongo";
import { streamSessionsCol } from "@features/stream/db";
import type { StreamSessionDoc } from "@features/stream/types";
import { getRegionReportData, getTopicReportData, type GraphReportSummary } from "@core/graph/queries/reports";

export type StreamDeckItemKind = "statement" | "context";

export type StreamDeckItem = {
  id: string;
  kind: StreamDeckItemKind;
  title: string;
  summary?: string | null;
  statementId?: string | null;
};

export type StreamDeck = {
  items: StreamDeckItem[];
  reportSummary?: GraphReportSummary | null;
};

async function loadSession(sessionId: string): Promise<StreamSessionDoc | null> {
  if (!ObjectId.isValid(sessionId)) return null;
  const col = await streamSessionsCol();
  return col.findOne({ _id: new ObjectId(sessionId) });
}

function truncate(text?: string | null, max = 180): string | null {
  if (!text) return null;
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) return null;
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

async function fetchStatements(topicKey?: string | null, regionCode?: string | null): Promise<StreamDeckItem[]> {
  if (!topicKey && !regionCode) return [];
  const col = await coreCol("statements");
  const query: Record<string, any> = {};
  if (topicKey) {
    query.$or = [{ category: topicKey }, { topic: topicKey }];
  }
  if (regionCode) {
    query.regionCode = regionCode;
  }
  const docs = await col
    .find(query)
    .project({ id: 1, title: 1, text: 1, createdAt: 1, updatedAt: 1 })
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(6)
    .toArray();

  return docs.map((doc: any) => {
    const statementId = doc.id ?? doc._id?.toString?.() ?? "";
    return {
      id: `statement-${statementId}`,
      kind: "statement",
      title: doc.title ?? truncate(doc.text, 120) ?? "Statement",
      summary: truncate(doc.text, 200),
      statementId,
    } satisfies StreamDeckItem;
  });
}

async function fetchReportSummary(topicKey?: string | null, regionCode?: string | null): Promise<GraphReportSummary | null> {
  try {
    if (topicKey) return await getTopicReportData(topicKey);
    if (regionCode) return await getRegionReportData(regionCode);
  } catch {
    return null;
  }
  return null;
}

export async function buildStreamDeck(sessionId: string): Promise<StreamDeck> {
  const session = await loadSession(sessionId);
  if (!session) {
    return { items: [], reportSummary: null };
  }

  const items = await fetchStatements(session.topicKey ?? null, session.regionCode ?? null);
  const reportSummary = await fetchReportSummary(session.topicKey ?? null, session.regionCode ?? null);

  return { items, reportSummary };
}
