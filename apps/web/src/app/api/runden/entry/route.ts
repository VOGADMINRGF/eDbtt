import { NextResponse } from "next/server";
import { listRundenEntryItems } from "@features/topicRound/entrySource";

function parseLimit(value: string | null): number | undefined {
  if (value === null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("invalid_limit");
  }
  return Math.floor(parsed);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseLimit(searchParams.get("limit"));
    const items = await listRundenEntryItems({ limit });
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "round_entry_source_unavailable";
    if (message === "invalid_limit") {
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
    if (message === "round_entry_source_unavailable") {
      return NextResponse.json({ ok: false, error: message }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: "round_entry_source_unavailable" }, { status: 503 });
  }
}
