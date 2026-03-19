import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import {
  anlassraumCol,
  anlassraumSourceLinksCol,
  outputSeedCol,
} from "@features/anlassraum/db";
import { canActorAccessAnlassraum } from "@features/anlassraum/governance";
import {
  ANLASSRAUM_LIFECYCLE_STATUSES,
  ANLASSRAUM_SOURCE_MODES,
  LEGACY_ANLASSRAUM_STATUSES,
  type AnlassraumSourceMode,
  type AnlassraumStatus,
} from "@features/anlassraum/types";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";

const ALLOWED_STATUS: AnlassraumStatus[] = [
  ...ANLASSRAUM_LIFECYCLE_STATUSES,
  ...LEGACY_ANLASSRAUM_STATUSES,
];

const ALLOWED_SOURCE_MODE: AnlassraumSourceMode[] = [...ANLASSRAUM_SOURCE_MODES];

export async function GET(req: NextRequest) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const params = req.nextUrl.searchParams;
  const limit = Math.max(1, Math.min(100, Number(params.get("limit") ?? 40) || 40));
  const status = String(params.get("status") ?? "all").toLowerCase();
  const sourceMode = String(params.get("sourceMode") ?? "all").toLowerCase();

  const filter: Record<string, unknown> = {};
  if (status !== "all" && ALLOWED_STATUS.includes(status as AnlassraumStatus)) {
    filter.status = status;
  }
  if (sourceMode !== "all" && ALLOWED_SOURCE_MODE.includes(sourceMode as AnlassraumSourceMode)) {
    filter.sourceMode = sourceMode;
  }

  const rooms = await anlassraumCol();
  const docs = await rooms.find(filter).sort({ updatedAt: -1 }).limit(limit).toArray();
  const visibleDocs = docs.filter((doc) => canActorAccessAnlassraum(doc, gate.actor, "read"));

  const roomIds = visibleDocs.map((doc) => doc._id).filter(Boolean) as ObjectId[];
  const [sources, outputs] = await Promise.all([
    roomIds.length
      ? (await anlassraumSourceLinksCol())
          .aggregate<{ _id: ObjectId; count: number }>([
            { $match: { anlassraumId: { $in: roomIds } } },
            { $group: { _id: "$anlassraumId", count: { $sum: 1 } } },
          ])
          .toArray()
      : [],
    roomIds.length
      ? (await outputSeedCol())
          .find(
            { anlassraumId: { $in: roomIds } },
            { projection: { anlassraumId: 1, outputType: 1, status: 1 } },
          )
          .toArray()
      : [],
  ]);

  const sourceCountMap = new Map<string, number>(
    sources.map((entry) => [entry._id.toHexString(), entry.count] as const),
  );
  const outputsByRoom = new Map<string, Array<{ outputType: string; status: string }>>();
  for (const output of outputs) {
    const key = output.anlassraumId.toHexString();
    const list = outputsByRoom.get(key) ?? [];
    list.push({
      outputType: String(output.outputType),
      status: String(output.status),
    });
    outputsByRoom.set(key, list);
  }

  return NextResponse.json({
    ok: true,
    items: visibleDocs.map((doc) => {
      const id = doc._id?.toHexString?.() ?? "";
      return {
        id,
        title: doc.title,
        slug: doc.slug,
        type: doc.type ?? null,
        kind: doc.kind,
        sourceMode: doc.sourceMode,
        status: doc.status,
        scope: doc.scope ?? null,
        decisionScope: doc.decisionScope ?? null,
        maturity: doc.maturity ?? null,
        topicKey: doc.topicKey ?? null,
        clusterKey: doc.clusterKey ?? null,
        regionCode: doc.regionCode ?? null,
        regionKey: doc.regionKey ?? null,
        dossierId: doc.dossierId?.toHexString?.() ?? null,
        dossierType: doc.dossierType ?? null,
        isPublic: doc.isPublic ?? false,
        reviewedBy: doc.reviewedBy ?? null,
        approvedBy: doc.approvedBy ?? null,
        relevanceScore: doc.relevanceScore ?? 0,
        reviewMode: doc.reviewMode ?? "standard",
        riskFlags: Array.isArray(doc.riskFlags) ? doc.riskFlags : [],
        sourceCount: sourceCountMap.get(id) ?? 0,
        outputs: outputsByRoom.get(id) ?? [],
        createdAt: doc.createdAt?.toISOString?.() ?? null,
        updatedAt: doc.updatedAt?.toISOString?.() ?? null,
      };
    }),
  });
}
