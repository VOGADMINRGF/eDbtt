export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { graphRepairsCol } from "@features/graphAdmin/db";
import { collectGraphHealthSnapshot } from "@features/graphAdmin/diagnostics";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { recordAuditEvent } from "@features/audit/recordAuditEvent";

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const snapshot = await collectGraphHealthSnapshot(30);
  const now = new Date();

  if (snapshot.status === "unavailable") {
    const col = await graphRepairsCol();
    const type = snapshot.reason === "missing_env" ? "missing_env" : "graph_unavailable";
    const existing = await col.findOne({
      type,
      status: { $in: ["open", "blocked", "pending", "in_review"] },
      systemGenerated: true,
    });

    const payload = {
      healthStatus: snapshot.status,
      healthReason: snapshot.reason,
      readError: snapshot.read.error,
      writeError: snapshot.write.error,
    };

    if (existing?._id) {
      await col.updateOne(
        { _id: existing._id },
        {
          $set: {
            status: "blocked",
            severity: "critical",
            entityId: "graph",
            entityLabel: "Graph-Verbindung",
            cause: snapshot.reason,
            proposedAction: "Graph-Diagnose aktualisieren und Konfiguration prüfen",
            nextActions: snapshot.nextActions,
            payload,
            updatedAt: now,
            systemGenerated: true,
          },
        },
      );
    } else {
      await col.insertOne({
        type,
        status: "blocked",
        severity: "critical",
        entityId: "graph",
        entityLabel: "Graph-Verbindung",
        cause: snapshot.reason,
        proposedAction: "Graph-Diagnose aktualisieren und Konfiguration prüfen",
        nextActions: snapshot.nextActions,
        systemGenerated: true,
        payload,
        createdByUserId: gate._id ?? null,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  await recordAuditEvent({
    scope: "graph",
    action: "graph.repair.run_diagnostics",
    actorUserId: String(gate._id),
    actorIp: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    target: { type: "graph_health", id: "graph" },
    after: snapshot,
    reason: snapshot.reason,
  });

  return NextResponse.json({ ok: true, snapshot });
}
