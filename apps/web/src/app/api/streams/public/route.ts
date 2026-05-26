export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { streamSessionsCol } from "@features/stream/db";
import { resolveSessionStatus } from "@features/stream/types";

function publicStatusLabel(status: ReturnType<typeof resolveSessionStatus>) {
  switch (status) {
    case "live":
      return "Live";
    case "scheduled":
    case "draft":
      return "Geplant";
    case "cancelled":
      return "Abgesagt";
    case "ended":
    default:
      return "Replay";
  }
}

export async function GET() {
  const col = await streamSessionsCol();

  const sessions = await col
    .find({ visibility: "public" })
    .sort({ isLive: -1, startsAt: 1, createdAt: -1 })
    .limit(50)
    .toArray();

  const items = sessions.map((session) => ({
    rawStatus: resolveSessionStatus(session),
    id: (session._id as any)?.toHexString?.() ?? "",
    slug:
      (session as any)?.slug ??
      String(session.title ?? "")
        .trim()
        .toLowerCase()
        .replace(/ä/g, "ae")
        .replace(/ö/g, "oe")
        .replace(/ü/g, "ue")
        .replace(/ß/g, "ss")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    title: session.title,
    description: session.description ?? null,
    status: publicStatusLabel(resolveSessionStatus(session)),
    isLive: !!session.isLive,
    topicKey: session.topicKey ?? null,
    regionCode: session.regionCode ?? null,
    startsAt: session.startsAt ? new Date(session.startsAt).toISOString() : null,
    playerUrl: (session as any)?.playerUrl ?? null,
    visibility: session.visibility,
    hideViewerCount: (session as any)?.hideViewerCount !== false,
    createdAt: (session.createdAt ?? new Date()).toISOString(),
  }));

  return NextResponse.json({ ok: true, sessions: items });
}
