import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import {
  createThemenradarItem,
  importIssueSignalFromCreate,
  listThemenradarItems,
} from "@features/themenradar/store";
import type {
  ThemenradarLifecycleStatus,
  ThemenradarSourceType,
} from "@features/themenradar/contracts";

const ALLOWED_STATUSES = [
  "raw",
  "qualified",
  "content_ready",
  "review_ready",
  "published",
  "archived",
] as const;

const ALLOWED_SOURCES = [
  "manual",
  "news",
  "community",
  "create_intake",
] as const;

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const params = req.nextUrl.searchParams;
  const statusRaw = String(params.get("status") ?? "all");
  const sourceRaw = String(params.get("sourceType") ?? "all");
  const q = String(params.get("q") ?? "").trim();
  const limitRaw = Number(params.get("limit") ?? 60);

  const status =
    statusRaw === "all" || ALLOWED_STATUSES.includes(statusRaw as ThemenradarLifecycleStatus)
      ? (statusRaw as ThemenradarLifecycleStatus | "all")
      : "all";
  const sourceType =
    sourceRaw === "all" || ALLOWED_SOURCES.includes(sourceRaw as ThemenradarSourceType)
      ? (sourceRaw as ThemenradarSourceType | "all")
      : "all";

  const items = await listThemenradarItems({
    status,
    sourceType,
    q: q || null,
    limit: Number.isFinite(limitRaw) ? limitRaw : 60,
  });

  return NextResponse.json({
    ok: true,
    items,
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { ok: false, error: "invalid_body" },
      { status: 400 },
    );
  }

  try {
    const sourceType = typeof body.sourceType === "string" ? body.sourceType : "manual";
    const actor = {
      userId: String((gate as any)?._id ?? ""),
      email: typeof (gate as any)?.email === "string" ? (gate as any).email : null,
    };
    const item =
      sourceType === "create_intake"
        ? await importIssueSignalFromCreate({
            title: String(body.title ?? ""),
            rawSignal: String(body.rawSignal ?? ""),
            jurisdiction:
              body.jurisdiction === "bund" ||
              body.jurisdiction === "land" ||
              body.jurisdiction === "kommune" ||
              body.jurisdiction === "mixed"
                ? body.jurisdiction
                : "mixed",
            campaignKey:
              typeof body.campaignKey === "string" ? body.campaignKey : null,
          }, actor)
        : await createThemenradarItem({
            title: String(body.title ?? ""),
            rawSignal: String(body.rawSignal ?? ""),
            sourceType:
              sourceType === "manual" ||
              sourceType === "news" ||
              sourceType === "community" ||
              sourceType === "create_intake"
                ? sourceType
                : "manual",
            jurisdiction:
              body.jurisdiction === "bund" ||
              body.jurisdiction === "land" ||
              body.jurisdiction === "kommune" ||
              body.jurisdiction === "mixed"
                ? body.jurisdiction
                : "mixed",
            heatScore: Number(body.heatScore ?? 50),
            everydayRelevanceScore: Number(body.everydayRelevanceScore ?? 50),
            polarizationScore: Number(body.polarizationScore ?? 40),
            membershipPotentialScore: Number(body.membershipPotentialScore ?? 45),
            linkedAnlassraumId:
              typeof body.linkedAnlassraumId === "string"
                ? body.linkedAnlassraumId
                : null,
            linkedDossierId:
              typeof body.linkedDossierId === "string" ? body.linkedDossierId : null,
            campaignKey:
              typeof body.campaignKey === "string" ? body.campaignKey : null,
          }, actor);

    return NextResponse.json({
      ok: true,
      item,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "themenradar_create_failed";
    const status =
      message === "title_required" || message === "raw_signal_required" ? 400 : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
