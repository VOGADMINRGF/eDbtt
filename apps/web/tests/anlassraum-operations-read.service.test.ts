import { describe, expect, it } from "vitest";
import { ObjectId } from "mongodb";
import {
  normalizeAnlassraumOperationsDoc,
  normalizeAnlassraumOperationsQuery,
} from "@/features/anlassraumOperationsRead";

describe("anlassraum operations read service", () => {
  it("normalizes query defaults and clamps paging", () => {
    const query = normalizeAnlassraumOperationsQuery({
      q: "   test   query ",
      page: "-5",
      limit: "999",
    });

    expect(query).toEqual({
      q: "test query",
      status: "all",
      scope: "all",
      page: 1,
      limit: 100,
    });
  });

  it("rejects invalid status and scope filters", () => {
    expect(() => normalizeAnlassraumOperationsQuery({ status: "broken" })).toThrow(
      "invalid_anlassraum_operations_status",
    );
    expect(() => normalizeAnlassraumOperationsQuery({ scope: "mars" })).toThrow(
      "invalid_anlassraum_operations_scope",
    );
  });

  it("normalizes heterogeneous docs defensively", () => {
    const normalized = normalizeAnlassraumOperationsDoc({
      _id: new ObjectId("65f000000000000000000111"),
      title: "  Mobilitaet Innenstadt  ",
      slug: "",
      status: "legacy_unknown_status",
      summary: "  ",
      scope: "regional",
      decisionScope: "invalid_scope",
      regionKey: "DE:BE",
      topicKey: "verkehr",
      clusterKey: null,
      sourceMode: "feed",
      maturity: "structured",
      relevanceScore: "0.72",
      riskFlags: ["weak_signal", ""],
      isPublic: true,
      dossierId: "65f000000000000000000211",
      dossierType: "exploration_dossier",
      createdAt: "2026-03-20T10:00:00.000Z",
      updatedAt: new Date("2026-03-21T10:00:00.000Z"),
    });

    expect(normalized).toMatchObject({
      id: "65f000000000000000000111",
      title: "Mobilitaet Innenstadt",
      slug: null,
      status: "unknown",
      scope: "regional",
      decisionScope: null,
      summary: null,
      regionKey: "DE:BE",
      topicKey: "verkehr",
      sourceMode: "feed",
      maturity: "structured",
      relevanceScore: 0.72,
      riskFlags: ["weak_signal"],
      isPublic: true,
      dossierId: "65f000000000000000000211",
      dossierType: "exploration_dossier",
    });
    expect(normalized.createdAt).toBe("2026-03-20T10:00:00.000Z");
    expect(normalized.updatedAt).toBe("2026-03-21T10:00:00.000Z");
  });
});
