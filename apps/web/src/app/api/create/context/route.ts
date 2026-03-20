import { NextResponse } from "next/server";
import {
  listCreateContextPickerItems,
  normalizeSelectedAnlassraumId,
} from "@/features/create/contextPicker";

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
    const selectedRaw = searchParams.get("selectedAnlassraumId");
    const selectedAnlassraumId = selectedRaw ? normalizeSelectedAnlassraumId(selectedRaw) : null;
    if (selectedRaw && !selectedAnlassraumId) {
      return NextResponse.json({ ok: false, error: "invalid_anlassraum_id" }, { status: 400 });
    }

    const items = await listCreateContextPickerItems({ limit });
    const selectedFound = selectedAnlassraumId
      ? items.some((item) => item.anlassraumId === selectedAnlassraumId)
      : null;

    return NextResponse.json({
      ok: true,
      items,
      selectedAnlassraumId,
      selectedFound,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "create_context_source_unavailable";
    if (message === "invalid_limit") {
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
    if (message === "create_context_source_unavailable") {
      return NextResponse.json({ ok: false, error: message }, { status: 503 });
    }
    return NextResponse.json({ ok: false, error: "create_context_source_unavailable" }, { status: 503 });
  }
}
