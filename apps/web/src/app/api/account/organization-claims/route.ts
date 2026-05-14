import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import {
  getRegionOrganizationRuntimeRepo,
  ORGANIZATION_TYPES,
  parseOptionalLocation,
} from "@features/region";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CreateOrganizationClaimBodySchema = z
  .object({
    organizationName: z.string().trim().min(1),
    organizationType: z.enum(ORGANIZATION_TYPES),
    countryCode: z.string().trim().min(2).max(3).optional(),
    regionId: z.string().trim().min(1).optional(),
    unitName: z.string().trim().min(1).optional(),
    roleLabel: z.string().trim().min(1).optional(),
    optionalLocation: z.string().trim().min(1).optional(),
    website: z.string().trim().url().optional(),
    note: z.string().trim().min(1).optional(),
  })
  .strict();

function normalizeOptionalStringRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => {
      if (typeof entry !== "string") return [key, entry];
      const trimmed = entry.trim();
      return [key, trimmed.length > 0 ? trimmed : undefined];
    }),
  );
}

function extractEmailDomain(email: string | null | undefined): string | null {
  const raw = String(email ?? "").trim().toLowerCase();
  const parts = raw.split("@");
  return parts.length === 2 && parts[1] ? parts[1] : null;
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || !user.sessionValid) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const userId = user._id?.toHexString?.() ?? "";
  if (!userId) {
    return NextResponse.json({ ok: false, error: "missing_user_id" }, { status: 400 });
  }

  const repo = getRegionOrganizationRuntimeRepo();
  const claims = await repo.listOrganizationClaimsForUser(userId);
  return NextResponse.json({ ok: true, claims });
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || !user.sessionValid) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const userId = user._id?.toHexString?.() ?? "";
  if (!userId) {
    return NextResponse.json({ ok: false, error: "missing_user_id" }, { status: 400 });
  }

  try {
    const rawBody = await req.json();
    const body = CreateOrganizationClaimBodySchema.parse(normalizeOptionalStringRecord(rawBody));
    const repo = getRegionOrganizationRuntimeRepo();
    const claim = await repo.createOrganizationClaim({
      userId,
      organizationName: body.organizationName,
      organizationType: body.organizationType,
      countryCode: body.countryCode ?? null,
      regionId: body.regionId ?? null,
      unitName: body.unitName ?? null,
      roleLabel: body.roleLabel ?? null,
      optionalLocation: body.optionalLocation
        ? parseOptionalLocation({ label: null, name: body.optionalLocation })
        : null,
      evidence: {
        emailDomain: extractEmailDomain(user.email),
        website: body.website ?? null,
        note: body.note ?? null,
      },
      source: "self_declared",
    });

    return NextResponse.json(
      {
        ok: true,
        claimId: claim.id,
        verificationStatus: claim.verificationStatus,
        noAutoAuthority: claim.noAutoAuthority,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "organization_claim_create_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
