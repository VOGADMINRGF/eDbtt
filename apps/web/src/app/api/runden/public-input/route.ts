import { ObjectId } from "@core/db/triMongo";
import { anlassraumCol } from "@features/anlassraum/db";
import { getParticipationSignalReviewRuntimeRepo } from "@features/region";
import { PublicAnlassraumInputPayloadSchema } from "@features/topicRound/publicInput";
import { buildPublicAnlassraumParticipationSignal } from "@features/topicRound/server/publicInputSubmission";
import { NextResponse } from "next/server";

function normalizeRoomContext(room: Record<string, unknown>, anlassraumId: string) {
  return {
    anlassraumId,
    title: String(room.title ?? "").trim(),
    summary:
      String(room.summary ?? "").trim() || String(room.description ?? "").trim() || null,
    isPublic: room.isPublic === true,
    regionKey: String(room.regionKey ?? "").trim() || null,
  };
}

function visibilityLabel(value: string): string {
  switch (value) {
    case "public_unverified":
      return "sichtbar, aber nicht geprüft";
    case "public_reviewed":
      return "geprüft";
    case "public_official":
      return "amtlich freigegeben";
    case "blocked":
      return "blockiert";
    default:
      return "reviewpflichtig";
  }
}

export async function POST(req: Request) {
  try {
    const payload = PublicAnlassraumInputPayloadSchema.parse(await req.json());
    const rooms = await anlassraumCol();
    const room =
      (await rooms.findOne({
        _id: new ObjectId(payload.anlassraumId),
      })) as Record<string, unknown> | null;

    if (!room || room.isPublic !== true) {
      return NextResponse.json(
        { ok: false, error: "public_anlassraum_not_found" },
        { status: 404 },
      );
    }

    const roomContext = normalizeRoomContext(room, payload.anlassraumId);
    if (!roomContext.title) {
      return NextResponse.json(
        { ok: false, error: "public_anlassraum_context_invalid" },
        { status: 409 },
      );
    }

    const signal = await buildPublicAnlassraumParticipationSignal({
      payload,
      room: roomContext,
      id: `region-participation-public-anlassraum-${new ObjectId().toHexString()}`,
    });

    const record = await getParticipationSignalReviewRuntimeRepo().createParticipationSignalRecord(
      signal,
    );

    return NextResponse.json(
      {
        ok: true,
        signal: {
          id: record.id,
          anlassraumId: payload.anlassraumId,
          sourceType: record.sourceType,
          reviewStatus: record.reviewStatus,
          visibilityState: record.visibilityState,
          visibilityLabel: visibilityLabel(record.visibilityState),
          noAutoPublish: record.noAutoPublish,
          noAutoCreateDossier: record.noAutoCreateDossier,
          noAutoCreateAnlassraum: record.noAutoCreateAnlassraum,
          noRepresentativeClaim: record.noRepresentativeClaim,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { ok: false, error: "invalid_public_anlassraum_input" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { ok: false, error: "public_anlassraum_input_unavailable" },
      { status: 503 },
    );
  }
}
