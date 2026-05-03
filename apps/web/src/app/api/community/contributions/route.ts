import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runContentTranslationProduction } from "@/features/i18n/contentTranslationProduction";
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
    authorVisibility: z.enum(["anonymous", "nickname", "real_name"] as const).optional(),
    authorKind: z.enum(["person", "organization", "representative_person"] as const).optional(),
    organizationLabel: z.string().trim().min(1).max(120).optional(),
    representativeName: z.string().trim().min(1).max(120).optional(),
    hostedRoomScope: z.enum(["public_open", "closed_hosted"] as const).optional(),
    confidentialHint: z.boolean().optional(),
    originalLanguage: z.string().trim().min(2).max(10).optional(),
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
  )
  .refine(
    (val) => {
      const visibility = val.authorVisibility ?? "anonymous";
      if (visibility === "anonymous") return true;
      return Boolean(val.authorName);
    },
    { message: "author_name_required_for_visibility", path: ["authorName"] },
  )
  .refine(
    (val) => {
      if (val.authorKind !== "organization") return true;
      return Boolean(val.organizationLabel || val.authorName);
    },
    {
      message: "organization_label_required",
      path: ["organizationLabel"],
    },
  )
  .refine(
    (val) => {
      if (val.authorKind !== "representative_person") return true;
      return Boolean(val.representativeName || val.authorName);
    },
    {
      message: "representative_name_required",
      path: ["representativeName"],
    },
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
  const authorVisibility = body.authorVisibility ?? "anonymous";
  const authorName =
    authorVisibility === "anonymous" ? null : body.authorName ?? null;
  const titleLocalized = await runContentTranslationProduction({
    originalText: body.title ?? null,
    originalLanguage: body.originalLanguage ?? null,
    maxLength: 160,
  });
  const bodyLocalized = await runContentTranslationProduction({
    originalText: body.body ?? null,
    originalLanguage: body.originalLanguage ?? null,
    maxLength: 2_000,
  });
  const item = await createCommunityContribution({
    type: body.type as CommunityContributionType,
    topicId: body.topicId ?? null,
    candidateId: body.candidateId ?? null,
    title: body.title ?? null,
    body: body.body ?? null,
    titleContent: titleLocalized.content,
    bodyContent: bodyLocalized.content,
    url: body.url ?? null,
    authorName,
    authorVisibility,
    authorKind: body.authorKind ?? "person",
    organizationLabel: body.organizationLabel ?? null,
    representativeName: body.representativeName ?? null,
    hostedRoomScope: body.hostedRoomScope ?? "public_open",
    confidentialHint: body.confidentialHint ?? false,
    status: "proposed",
  });

  return NextResponse.json({ ok: true, item });
}
