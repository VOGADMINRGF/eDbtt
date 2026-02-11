import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createCommunityContribution,
  listCommunityContributions,
  type CommunityContributionStatus,
  type CommunityContributionType,
} from "@core/communityContributions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z
  .object({
    type: z.enum(["source", "option", "question", "impact", "view"] as const),
    topicId: z.string().trim().min(1).optional(),
    candidateId: z.string().trim().min(1).optional(),
    title: z.string().trim().min(1).max(160).optional(),
    body: z.string().trim().min(1).max(2000).optional(),
    url: z.string().url().optional(),
    authorName: z.string().trim().min(1).max(120).optional(),
  })
  .refine((val) => Boolean(val.topicId || val.candidateId), {
    message: "missing_reference",
    path: ["topicId"],
  })
  .refine(
    (val) => {
      if (val.type === "source") return Boolean(val.url);
      return Boolean(val.body || val.title);
    },
    { message: "missing_content", path: ["body"] },
  );

const STATUS_VALUES = new Set<CommunityContributionStatus>(["approved", "proposed", "rejected"]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const topicId = searchParams.get("topicId")?.trim() || undefined;
  const candidateId = searchParams.get("candidateId")?.trim() || undefined;
  const statusRaw = searchParams.get("status")?.trim() as CommunityContributionStatus | null;
  const status = STATUS_VALUES.has(statusRaw as CommunityContributionStatus)
    ? statusRaw!
    : ("approved" as CommunityContributionStatus);
  const limit = Math.max(1, Math.min(100, Number(searchParams.get("limit") ?? 30) || 30));

  const items = await listCommunityContributions({ topicId, candidateId, status, limit });
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: NextRequest) {
  const raw = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;
  const item = await createCommunityContribution({
    type: body.type as CommunityContributionType,
    topicId: body.topicId ?? null,
    candidateId: body.candidateId ?? null,
    title: body.title ?? null,
    body: body.body ?? null,
    url: body.url ?? null,
    authorName: body.authorName ?? null,
    status: "proposed",
  });

  return NextResponse.json({ ok: true, item });
}
