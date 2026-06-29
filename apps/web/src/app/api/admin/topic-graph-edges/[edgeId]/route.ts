import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import {
  approveTopicGraphEdgeDraft,
  getTopicGraphEdgeDraft,
  rejectTopicGraphEdgeDraft,
  topicGraphRuntimeAvailable,
  writeApprovedTopicGraphEdgeToRuntime,
} from "@/features/create/topicGraphRuntimeServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z
  .object({
    action: z.enum([
      "approveGraphWrite",
      "rejectGraphWrite",
      "writeApprovedGraphEdge",
    ]),
    note: z.string().trim().min(1).optional(),
  })
  .strict();

export async function POST(
  req: NextRequest,
  context: {
    params: Promise<{ edgeId: string }>;
  },
) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const userId = gate?._id?.toHexString?.() ?? "";
  if (!userId) {
    return NextResponse.json({ ok: false, error: "admin_user_id_missing" }, { status: 400 });
  }

  try {
    const params = await context.params;
    const edgeId = decodeURIComponent(String(params.edgeId ?? "").trim());
    const body = BodySchema.parse(await req.json());
    const edge = await getTopicGraphEdgeDraft(edgeId);

    if (!edge) {
      return NextResponse.json({ ok: false, error: "topic_graph_edge_not_found" }, { status: 404 });
    }

    if (body.action === "approveGraphWrite") {
      const note = String(body.note ?? "").trim();
      if (!note) {
        return NextResponse.json({ ok: false, error: "topic_graph_note_required" }, { status: 400 });
      }
      if (
        edge.sourceReviewPending ||
        edge.moderationPending ||
        !edge.source.id ||
        !edge.target.id ||
        !topicGraphRuntimeAvailable()
      ) {
        return NextResponse.json({ ok: false, error: "topic_graph_approval_blocked" }, { status: 409 });
      }

      const nextEdge = await approveTopicGraphEdgeDraft({
        edgeId,
        actorUserId: userId,
        reason: note,
      });

      return NextResponse.json({ ok: true, edge: nextEdge }, { status: 200 });
    }

    if (body.action === "rejectGraphWrite") {
      const note = String(body.note ?? "").trim();
      if (!note) {
        return NextResponse.json({ ok: false, error: "topic_graph_note_required" }, { status: 400 });
      }
      if (edge.mutationStatus === "written") {
        return NextResponse.json({ ok: false, error: "topic_graph_edge_already_written" }, { status: 409 });
      }

      const nextEdge = await rejectTopicGraphEdgeDraft({
        edgeId,
        actorUserId: userId,
        reason: note,
      });

      return NextResponse.json({ ok: true, edge: nextEdge }, { status: 200 });
    }

    if (!edge.approvedForGraphWrite) {
      return NextResponse.json({ ok: false, error: "topic_graph_review_not_approved" }, { status: 409 });
    }
    if (edge.mutationStatus === "rejected") {
      return NextResponse.json({ ok: false, error: "topic_graph_edge_rejected" }, { status: 409 });
    }

    const result = await writeApprovedTopicGraphEdgeToRuntime(edge);
    if (result.ok === false) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          blockers: result.blockers,
          edge: result.edge,
        },
        { status: result.error === "blocked" ? 409 : 500 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        edge: result.edge,
        writtenAt: result.writtenAt,
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "topic_graph_approval_action_failed";
    const status = message === "topic_graph_edge_not_found" ? 404 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
