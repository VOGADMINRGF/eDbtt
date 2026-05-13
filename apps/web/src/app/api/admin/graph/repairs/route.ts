export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { graphRepairsCol } from "@features/graphAdmin/db";
import { collectGraphHealthSnapshot } from "@features/graphAdmin/diagnostics";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

const MAX_PAGE_SIZE = 100;

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const params = req.nextUrl.searchParams;
  const type = params.get("type")?.trim();
  const status = params.get("status")?.trim();
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(params.get("limit") ?? 30)));

  const filter: Record<string, unknown> = {};
  if (type && type !== "all") filter.type = type;
  if (status && status !== "all") filter.status = status;

  const col = await graphRepairsCol();
  const total = await col.countDocuments(filter);
  const rows = await col
    .find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize)
    .toArray();

  const items = rows.map((row) => ({
    id: row._id ? String(row._id) : undefined,
    type: row.type,
    status: row.status,
    severity: row.severity ?? "medium",
    entityId: row.entityId ?? null,
    entityLabel: row.entityLabel ?? null,
    cause: row.cause ?? row.payload?.healthReason ?? row.payload?.reason ?? null,
    proposedAction: row.proposedAction ?? null,
    nextActions: row.nextActions ?? [],
    systemGenerated: row.systemGenerated ?? false,
    payload: row.payload,
    createdAt: row.createdAt ? row.createdAt.toISOString() : null,
    updatedAt: row.updatedAt ? row.updatedAt.toISOString() : null,
    appliedAt: row.appliedAt ? row.appliedAt.toISOString() : null,
    rejectedAt: row.rejectedAt ? row.rejectedAt.toISOString() : null,
  }));

  const health = await collectGraphHealthSnapshot(30);
  const syntheticItems =
    health.status === "unavailable"
      ? [
          {
            id: `system:${health.reason ?? "graph_unavailable"}`,
            type: health.reason === "missing_env" ? "missing_env" : "graph_unavailable",
            status: "blocked",
            severity: "critical",
            entityId: "graph",
            entityLabel: "Graph-Verbindung",
            cause: health.reason,
            proposedAction: "Graph-Diagnose aktualisieren und Konfiguration prüfen",
            nextActions: health.nextActions,
            systemGenerated: true,
            payload: {
              healthStatus: health.status,
              healthReason: health.reason,
              readError: health.read.error,
              writeError: health.write.error,
            },
            createdAt: health.meta.generatedAt,
            updatedAt: health.meta.generatedAt,
            appliedAt: null,
            rejectedAt: null,
          },
        ]
      : [];

  const mergedItems = items.length > 0 ? items : syntheticItems;

  return NextResponse.json({
    ok: true,
    status: health.status,
    source: mergedItems === syntheticItems ? "system_health" : "real_graph",
    isMock: false,
    items: mergedItems,
    total: mergedItems.length,
    page,
    pageSize,
    filters: {
      type: type && type !== "all" ? type : null,
      status: status && status !== "all" ? status : null,
    },
    message:
      health.status === "unavailable"
        ? "Graph ist nicht verfügbar. Systemdiagnose zeigt mindestens ein Blocker-Ticket."
        : mergedItems.length === 0
          ? "Keine offenen Graph-Reparaturen."
          : null,
  });
}
