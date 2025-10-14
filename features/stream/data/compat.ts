// features/stream/data/compat.ts
import { streamData, type StreamEntry } from "./streamData";

export type LegacyStream = {
  id: string;
  title: string;
  href?: string;                // alias für interne Links
  status: "Live" | "Replay" | "Geplant";
  language: string;
  region?: string;
  topic?: string;
  image?: string;
  statements: number;           // Summe statt Counts
  bookmarked: boolean;
  inviteSent: boolean;
  date: string;                 // ISO startAt
  tags?: string[];
};

export function toLegacyStatus(s: StreamEntry["status"]): LegacyStream["status"] {
  switch (s) {
    case "live":
      return "Live";
    case "replay":
      return "Replay";
    case "planned":
    default:
      return "Geplant";
  }
}

export function totalStatements(e: StreamEntry): number {
  const { agreed, rejected, unanswered } = e.engagement.statements;
  return (agreed ?? 0) + (rejected ?? 0) + (unanswered ?? 0);
}

export function toLegacy(e: StreamEntry): LegacyStream {
  return {
    id: e.id,
    title: e.title,
    href: e.media.postUrl || e.media.streamUrl || `/streams/${e.slug}`,
    status: toLegacyStatus(e.status),
    language: e.locale,
    region: e.region?.name,
    topic: e.topic?.label,
    image: e.media.images?.[0],
    statements: totalStatements(e),
    bookmarked: e.engagement.bookmarked,
    inviteSent: e.engagement.inviteSent,
    date: e.schedule.startAt,
    tags: e.tags,
  };
}

/** Fertige Liste für bestehende Komponenten */
export const streamDataLegacy: LegacyStream[] = streamData.map(toLegacy);
