import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import {
  buildRegionAccessContext,
  createRegionSignalDraft,
  parseOrganization,
  parseOrganizationMembership,
  type Organization,
  type OrganizationMembership,
} from "@features/region";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DraftBodySchema = z
  .object({
    regionId: z.string().trim().min(1),
    target: z.enum(["dossier", "anlassraum"]),
    title: z.string().trim().min(1).optional(),
    summary: z.string().trim().min(1).optional(),
    openQuestions: z.array(z.string().trim().min(1)).optional(),
  })
  .strict();

function parseFixtureJsonHeader<T>(
  req: NextRequest,
  name: string,
  parser: (value: unknown) => T,
): T[] {
  if (!process.env.VITEST) return [];
  const raw = req.headers.get(name);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((entry) => parser(entry));
  } catch {
    return [];
  }
}

function buildAccessContextFromRequestFixture(
  req: NextRequest,
  gate: Awaited<ReturnType<typeof requireGovernanceActorOrResponse>>,
) {
  if (gate instanceof Response) return null;
  const memberships = parseFixtureJsonHeader<OrganizationMembership>(
    req,
    "x-edebatte-region-memberships",
    parseOrganizationMembership,
  );
  const organizations = parseFixtureJsonHeader<Organization>(
    req,
    "x-edebatte-region-organizations",
    parseOrganization,
  );
  return buildRegionAccessContext({
    userId: gate.actor.userId,
    actorRole: gate.actor.role,
    isAdmin: gate.actor.isAdmin,
    roles: gate.roles,
    organizationIds: gate.actor.scopedOwnerIds,
    memberships,
    organizations,
  });
}

function statusForBlockedReason(reason: string | undefined) {
  switch (reason) {
    case "signal_not_found":
      return 404;
    case "missing_permission":
    case "wrong_region":
      return 403;
    default:
      return 400;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  try {
    const body = DraftBodySchema.parse(await req.json());
    const { id } = await params;
    const accessContext = buildAccessContextFromRequestFixture(req, gate);
    if (!accessContext) {
      return NextResponse.json({ ok: false, error: "missing_access_context" }, { status: 400 });
    }

    const result = await createRegionSignalDraft({
      signalId: id,
      regionId: body.regionId,
      target: body.target,
      accessContext,
      requestedBy: gate.actor.userId,
      title: body.title,
      summary: body.summary,
      openQuestions: body.openQuestions,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          blockedReason: result.blockedReason,
          draftType: result.draftType,
          reviewStatus: result.reviewStatus,
          guardrails: result.guardrails,
        },
        { status: statusForBlockedReason(result.blockedReason) },
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "region_signal_draft_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
