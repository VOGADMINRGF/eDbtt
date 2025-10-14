// features/stream/data/streamData.ts
// E150 V2 – robust + validiert + migration helpers

import { z } from "zod";

/* ─────────── IDs & Enums ─────────── */

export type Id<Kind extends string> = string & { __brand: Kind };

/** ULID bevorzugt (URL/zeitfreundlich); Fallback auf randomUUID / Random */
export async function generateId(): Promise<Id<"stream">> {
  try {
    const { ulid } = await import("ulid");
    return ulid() as Id<"stream">;
  } catch {
    const rnd =
      (globalThis as any)?.crypto?.randomUUID?.() ??
      (await import("node:crypto")).randomUUID();
    return rnd as Id<"stream">;
  }
}

export const StreamStatus = ["live", "replay", "planned"] as const;
export type StreamStatus = (typeof StreamStatus)[number];

export const Visibility = ["public", "unlisted", "private"] as const;
export type Visibility = (typeof Visibility)[number];

export const StreamPlatform = ["youtube", "twitch", "vimeo", "livepeer", "custom"] as const;
export type StreamPlatform = (typeof StreamPlatform)[number];

export type StatementCounts = { agreed: number; rejected: number; unanswered: number };

/* ─────────── Haupttyp ─────────── */

export type StreamEntry = {
  id: Id<"stream">;
  version: 2;

  slug: string;
  title: string;
  description?: string;
  status: StreamStatus;

  schedule: { startAt: string; endAt?: string; timezone?: string };

  visibility: Visibility;
  access?: {
    loginRequired?: boolean;
    memberOnly?: boolean;
    geo?: string[]; // ISO-3166-1 alpha-2
    minAge?: number;
  };

  locale: string; // BCP-47
  region: { code: string; name: string };
  topic: { key: string; label: string };

  media: {
    images: string[];
    trailerUrl?: string;
    streamUrl?: string;
    postUrl?: string;
    platform?: StreamPlatform;
    platformId?: string;
  };

  stats: {
    viewers: number;
    supporter: number;
    bookmarks?: number;
  };

  engagement: {
    statements: StatementCounts;
    bookmarked: boolean;
    inviteSent: boolean;
  };

  tags: string[];
  seo?: { summary?: string; keywords?: string[] };
  i18n?: Record<string, { title?: string; description?: string; tags?: string[] }>;
  moderation?: { locked?: boolean; flagged?: boolean; reason?: string };

  createdAt: string;
  updatedAt?: string;
};

/* ─────────── Zod-Schema ─────────── */

export const StatementCountsSchema = z.object({
  agreed: z.number().int().min(0),
  rejected: z.number().int().min(0),
  unanswered: z.number().int().min(0),
});

export const StreamEntrySchema = z.object({
  id: z.string().min(10),
  version: z.literal(2),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(StreamStatus),
  schedule: z.object({
    startAt: z.string().datetime(),
    endAt: z.string().datetime().optional(),
    timezone: z.string().optional(),
  }),
  visibility: z.enum(Visibility),
  access: z
    .object({
      loginRequired: z.boolean().optional(),
      memberOnly: z.boolean().optional(),
      geo: z.array(z.string().length(2)).optional(),
      minAge: z.number().int().min(0).optional(),
    })
    .optional(),
  locale: z.string().min(2),
  region: z.object({ code: z.string().min(2), name: z.string().min(1) }),
  topic: z.object({ key: z.string().min(1), label: z.string().min(1) }),
  media: z.object({
    images: z.array(z.string().min(1)),
    trailerUrl: z.string().url().optional(),
    streamUrl: z.string().url().optional(),
    postUrl: z.string().url().optional(),
    platform: z.enum(StreamPlatform).optional(),
    platformId: z.string().optional(),
  }),
  stats: z.object({
    viewers: z.number().int().min(0),
    supporter: z.number().int().min(0),
    bookmarks: z.number().int().min(0).optional(),
  }),
  engagement: z.object({
    statements: StatementCountsSchema,
    bookmarked: z.boolean(),
    inviteSent: z.boolean(),
  }),
  tags: z.array(z.string()).default([]),
  seo: z
    .object({
      summary: z.string().optional(),
      keywords: z.array(z.string()).optional(),
    })
    .optional(),
  // explizit mit Key-Typ (kosmetisch; identisch zum impliziten string-Key)
  i18n: z
    .record(
      z.string(),
      z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .optional(),
  moderation: z
    .object({
      locked: z.boolean().optional(),
      flagged: z.boolean().optional(),
      reason: z.string().optional(),
    })
    .optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

export type StreamEntryValidated = z.infer<typeof StreamEntrySchema>;

/* ─────────── Helpers & Migration ─────────── */

export function normalizeStatus(s: unknown): StreamStatus {
  const x = String(s ?? "").trim().toLowerCase();
  if (x.startsWith("live")) return "live";
  if (["replay", "aufzeichnung", "recording"].includes(x)) return "replay";
  if (["planned", "geplant", "upcoming"].includes(x)) return "planned";
  return "planned";
}

export function toImages(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean);
  return [String(v)];
}

export function ensureIso(date: unknown): string {
  try {
    const d = new Date(String(date));
    if (isNaN(d.getTime())) throw new Error("invalid date");
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// V1 (dein altes Shape – nur Felder, die wir brauchen)
export type StreamEntryV1 = {
  id: string;
  title: string;
  slug?: string;
  status: string; // "Live" | "Replay" | "Geplant" | …
  region?: string;
  topic?: string;
  language: string;
  viewers?: number;
  images?: string[];
  image?: string; // Single image fallback
  description?: string;
  trailerUrl?: string;
  supporter?: number;
  statements?: { agreed: number; rejected: number; unanswered: number };
  bookmarked: boolean;
  inviteSent: boolean;
  date: string; // ISO
  tags?: string[];
  visibility?: string; // "public"…
  streamUrl?: string;
  postUrl?: string;
};

function inferRegion(codeOrName?: string): { code: string; name: string } {
  if (!codeOrName) return { code: "UNK", name: "Unknown" };
  return { code: codeOrName.length <= 5 ? codeOrName : "UNK", name: codeOrName };
}

function inferTopic(label?: string): { key: string; label: string } {
  const key = (label ?? "misc").toLowerCase().replace(/\s+/g, "-");
  return { key, label: label ?? "Misc" };
}

/**
 * Migration V1 → V2 (sync):
 * Beibehaltung synchroner Signatur, damit bestehende Call-Sites nicht brechen.
 * ID-Fallback nutzt Web Crypto, sonst einfache Random-ID (nur als Fallback).
 */
export function migrateFromV1(v1: StreamEntryV1): StreamEntry {
  const statements = v1.statements ?? { agreed: 0, rejected: 0, unanswered: 0 };
  const visibility = (v1.visibility ?? "public").toLowerCase() as Visibility;

  const g: any = globalThis as any;
  const fallbackId =
    g?.crypto?.randomUUID?.() ??
    ("id-" + Math.random().toString(36).slice(2));

  return {
    id: ((v1.id as Id<"stream">) ?? (fallbackId as Id<"stream">)),
    version: 2,
    slug:
      v1.slug ??
      v1.title
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]/g, ""),
    title: v1.title,
    description: v1.description,
    status: normalizeStatus(v1.status),

    schedule: { startAt: ensureIso(v1.date) },

    visibility: (Visibility as readonly string[]).includes(visibility)
      ? (visibility as Visibility)
      : "public",
    access: undefined,

    locale: v1.language || "en",
    region: inferRegion(v1.region),
    topic: inferTopic(v1.topic),

    media: {
      images: v1.images?.length ? v1.images : toImages(v1.image),
      trailerUrl: v1.trailerUrl,
      streamUrl: v1.streamUrl,
      postUrl: v1.postUrl,
    },

    stats: {
      viewers: v1.viewers ?? 0,
      supporter: v1.supporter ?? 0,
    },

    engagement: {
      statements,
      bookmarked: !!v1.bookmarked,
      inviteSent: !!v1.inviteSent,
    },

    tags: v1.tags ?? [],

    seo: v1.description ? { summary: v1.description.slice(0, 180) } : undefined,
    i18n: undefined,
    moderation: undefined,

    createdAt: ensureIso(v1.date),
    updatedAt: undefined,
  };
}

/* ─────────── Daten-Export ─────────── */

// Wenn du bereits V1-Daten hast, hier importieren und migrieren:
// import { streamData as streamDataV1 } from "./streamData.v1";
// export const streamData: StreamEntry[] = streamDataV1.map(migrateFromV1);

export const streamData: StreamEntry[] = [];
