import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import {
  anlassraumCol,
  anlassraumSourceLinksCol,
  anlassraumStructureCol,
  outputSeedCol,
} from "@features/anlassraum/db";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const { id } = await context.params;
  let objectId: ObjectId;
  try {
    objectId = new ObjectId(id);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }

  const rooms = await anlassraumCol();
  const room = await rooms.findOne({ _id: objectId });
  if (!room) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const [sources, structure, outputs] = await Promise.all([
    (await anlassraumSourceLinksCol()).find({ anlassraumId: objectId }).toArray(),
    (await anlassraumStructureCol()).findOne({ anlassraumId: objectId }),
    (await outputSeedCol()).find({ anlassraumId: objectId }).toArray(),
  ]);

  return NextResponse.json({
    ok: true,
    item: {
      id: room._id?.toHexString?.() ?? "",
      title: room.title,
      slug: room.slug,
      kind: room.kind,
      sourceMode: room.sourceMode,
      status: room.status,
      scope: room.scope ?? null,
      topicKey: room.topicKey ?? null,
      clusterKey: room.clusterKey ?? null,
      regionCode: room.regionCode ?? null,
      relevanceScore: room.relevanceScore ?? 0,
      reviewMode: room.reviewMode ?? "standard",
      riskFlags: Array.isArray(room.riskFlags) ? room.riskFlags : [],
      createdAt: room.createdAt?.toISOString?.() ?? null,
      updatedAt: room.updatedAt?.toISOString?.() ?? null,
    },
    sources: sources.map((src) => ({
      id: src._id?.toHexString?.() ?? "",
      ingestItemId: src.ingestItemId?.toHexString?.() ?? null,
      statementCandidateId: src.statementCandidateId?.toHexString?.() ?? null,
      sourceUrl: src.sourceUrl ?? null,
      sourceWeight: src.sourceWeight,
      role: src.role,
      publisher: src.publisher ?? null,
      createdAt: src.createdAt?.toISOString?.() ?? null,
      updatedAt: src.updatedAt?.toISOString?.() ?? null,
    })),
    structure: structure
      ? {
          claims: structure.claims ?? [],
          notes: structure.notes ?? [],
          questions: structure.questions ?? [],
          knots: structure.knots ?? [],
          segments: structure.segments ?? [],
          actors: structure.actors ?? [],
          evidenceSummary: structure.evidenceSummary ?? null,
          riskFlags: structure.riskFlags ?? [],
          updatedAt: structure.updatedAt?.toISOString?.() ?? null,
        }
      : null,
    outputs: outputs.map((out) => ({
      id: out._id?.toHexString?.() ?? "",
      outputType: out.outputType,
      status: out.status,
      reviewState: out.reviewState,
      targetRegion: out.targetRegion ?? null,
      targetAudience: out.targetAudience ?? null,
      publishTarget: out.publishTarget ?? null,
      createdAt: out.createdAt?.toISOString?.() ?? null,
      updatedAt: out.updatedAt?.toISOString?.() ?? null,
    })),
  });
}
