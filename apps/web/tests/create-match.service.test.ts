import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";

type StatementProposalDoc = {
  _id?: ObjectId;
  text?: string;
  title?: string | null;
  topic?: string | null;
  status?: string | null;
  dossierId?: string | null;
  createdAt?: Date | null;
};

type DossierDoc = {
  dossierId: string;
  title?: string | null;
  status?: string | null;
  updatedAt?: Date | null;
  createdAt?: Date | null;
};

type ContextItem = {
  anlassraumId: string;
  title: string;
  summary: string;
  topicKey: string | null;
  anlassraumType: string | null;
  anlassraumStatus: string | null;
  sourceMode: string | null;
  outputStatus: string;
  updatedAt: string | null;
};

const mocks = vi.hoisted(() => {
  const state = {
    proposals: [] as StatementProposalDoc[],
    dossiers: [] as DossierDoc[],
    contextItems: [] as ContextItem[],
    anlassraumById: new Map<string, { _id: ObjectId; title?: string; summary?: string; topicKey?: string | null }>(),
    failContext: false,
    failClaims: false,
    failDossiers: false,
    failAnlassraumLookup: false,
  };

  function reset() {
    state.proposals = [];
    state.dossiers = [];
    state.contextItems = [];
    state.anlassraumById.clear();
    state.failContext = false;
    state.failClaims = false;
    state.failDossiers = false;
    state.failAnlassraumLookup = false;
  }

  function sortRows<T extends Record<string, unknown>>(rows: T[], spec?: Record<string, number>) {
    if (!spec) return rows;
    const [field, dir] = Object.entries(spec)[0] ?? [];
    if (!field || !dir) return rows;
    const direction = dir >= 0 ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = a[field];
      const bv = b[field];
      const at = av instanceof Date ? av.getTime() : typeof av === "number" ? av : 0;
      const bt = bv instanceof Date ? bv.getTime() : typeof bv === "number" ? bv : 0;
      return direction * (at - bt);
    });
  }

  function filterByOrRegex<T extends Record<string, unknown>>(rows: T[], query: Record<string, unknown>) {
    const orConditions = Array.isArray(query?.$or) ? (query.$or as Array<Record<string, unknown>>) : [];
    if (orConditions.length === 0) return rows;

    return rows.filter((row) =>
      orConditions.some((condition) => {
        const [field, expr] = Object.entries(condition)[0] ?? [];
        if (!field || !(expr instanceof RegExp)) return false;
        const value = typeof row[field] === "string" ? String(row[field]) : "";
        return expr.test(value);
      }),
    );
  }

  return {
    state,
    reset,
    setContextItems(items: ContextItem[]) {
      state.contextItems = items;
    },
    setProposals(rows: StatementProposalDoc[]) {
      state.proposals = rows;
    },
    setDossiers(rows: DossierDoc[]) {
      state.dossiers = rows;
    },
    setAnlassraum(id: string, row: { title?: string; summary?: string; topicKey?: string | null }) {
      state.anlassraumById.set(id.toLowerCase(), { _id: new ObjectId(id), ...row });
    },
    failAllSources() {
      state.failContext = true;
      state.failClaims = true;
      state.failDossiers = true;
    },
    listCreateContextPickerItems: vi.fn(async () => {
      if (state.failContext) throw new Error("create_context_source_unavailable");
      return state.contextItems;
    }),
    getCol: vi.fn(async (name: string) => {
      if (name !== "statement_proposals") throw new Error(`unexpected_collection_${name}`);
      if (state.failClaims) throw new Error("claim_read_unavailable");
      return {
        find(query: Record<string, unknown>) {
          let rows = filterByOrRegex(state.proposals as Array<Record<string, unknown>>, query ?? {}) as StatementProposalDoc[];
          return {
            sort(spec: Record<string, number>) {
              rows = sortRows(rows as Array<Record<string, unknown>>, spec) as StatementProposalDoc[];
              return this;
            },
            limit(max: number) {
              rows = rows.slice(0, max);
              return this;
            },
            async toArray() {
              return rows;
            },
          };
        },
      };
    }),
    dossiersCol: vi.fn(async () => {
      if (state.failDossiers) throw new Error("dossier_read_unavailable");
      return {
        find(query: Record<string, unknown>) {
          let rows = [...state.dossiers];
          const titleRegex = query?.title;
          if (titleRegex instanceof RegExp) {
            rows = rows.filter((row) => titleRegex.test(String(row.title ?? "")));
          }
          return {
            sort(spec: Record<string, number>) {
              rows = sortRows(rows as Array<Record<string, unknown>>, spec) as DossierDoc[];
              return this;
            },
            limit(max: number) {
              rows = rows.slice(0, max);
              return this;
            },
            async toArray() {
              return rows;
            },
          };
        },
      };
    }),
    anlassraumCol: vi.fn(async () => ({
      async findOne(filter: Record<string, unknown>) {
        if (state.failAnlassraumLookup) throw new Error("anlassraum_lookup_failed");
        const raw = filter?._id;
        const id =
          raw && typeof raw === "object" && "toHexString" in raw
            ? String((raw as { toHexString: () => string }).toHexString()).toLowerCase()
            : "";
        return state.anlassraumById.get(id) ?? null;
      },
    })),
  };
});

vi.mock("@/features/create/contextPicker", () => ({
  listCreateContextPickerItems: (...args: unknown[]) => mocks.listCreateContextPickerItems(...args),
}));

vi.mock("@core/db/triMongo", () => ({
  ObjectId,
  getCol: (...args: unknown[]) => mocks.getCol(...args),
}));

vi.mock("@features/dossier/db", () => ({
  dossiersCol: (...args: unknown[]) => mocks.dossiersCol(...args),
}));

vi.mock("@features/anlassraum/db", () => ({
  anlassraumCol: (...args: unknown[]) => mocks.anlassraumCol(...args),
}));

import { resolveCreateGraphMatches } from "@/features/create/matchService";

function ctaIds(result: { suggestedCtas: Array<{ id: string }> }) {
  return result.suggestedCtas.map((cta) => cta.id);
}

describe("create match service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reset();
  });

  it("maps explicit anlassraum context to same_anlassraum with manual CTAs", async () => {
    mocks.setContextItems([
      {
        anlassraumId: "65f000000000000000000011",
        title: "Anlassraum Mobilitaet",
        summary: "Debatte zu Mobilitaet in der Innenstadt",
        topicKey: "mobilitaet",
        anlassraumType: "policy",
        anlassraumStatus: "active",
        sourceMode: "source",
        outputStatus: "ready",
        updatedAt: "2026-03-20T00:00:00.000Z",
      },
    ]);

    const result = await resolveCreateGraphMatches({
      text: "Wir brauchen mehr sichere Schulwege in der Innenstadt.",
      normalizedInputSummary: "Wir brauchen mehr sichere Schulwege in der Innenstadt.",
      claims: [{ text: "Mehr sichere Schulwege" }],
      anlassraumId: "65f000000000000000000011",
    });

    expect(result.matchType).toBe("same_anlassraum");
    expect(result.matchEntityType).toBe("anlassraum");
    expect(result.matchStrength).toBe("high");
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(ctaIds(result)).toEqual([
      "anlassraum_oeffnen",
      "perspektive_anhaengen",
      "anders_sehen",
      "neu_anlegen",
    ]);
    expect(result.matches[0]?.targetRef ?? "").toContain("/create?");
    expect(result.matches[0]?.targetRef ?? "").toContain("anlassraumId=65f000000000000000000011");
    expect(result.matches[0]?.targetRef ?? "").toContain("source=create_match_service");
  });

  it("returns related_claim for semantically close productive claim data", async () => {
    mocks.setProposals([
      {
        _id: new ObjectId("65f000000000000000000101"),
        text: "Mehr Zebrastreifen verbessern sichere Schulwege.",
        title: "Sichere Schulwege",
        topic: "verkehr",
        createdAt: new Date("2026-03-19T09:00:00.000Z"),
      },
    ]);

    const result = await resolveCreateGraphMatches({
      text: "Wir brauchen sichere Schulwege mit zusaetzlichen Zebrastreifen.",
      normalizedInputSummary: "Wir brauchen sichere Schulwege mit zusaetzlichen Zebrastreifen.",
      claims: [{ text: "Sichere Schulwege mit Zebrastreifen" }],
    });

    expect(result.matchType).toBe("related_claim");
    expect(result.matchEntityType === "claim" || result.matchEntityType === "perspective").toBe(true);
    expect(result.matchStrength === "low" || result.matchStrength === "medium" || result.matchStrength === "high").toBe(true);
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(ctaIds(result)).toEqual([
      "zustimmen",
      "anders_sehen",
      "perspektive_anhaengen",
      "neu_anlegen",
    ]);
  });

  it("returns related_dossier when dossier title is the closest productive hit", async () => {
    mocks.setDossiers([
      {
        dossierId: "dossier-verkehr-1",
        title: "Dossier Verkehrswende Innenstadt",
        updatedAt: new Date("2026-03-20T08:00:00.000Z"),
        createdAt: new Date("2026-03-01T08:00:00.000Z"),
      },
    ]);

    const result = await resolveCreateGraphMatches({
      text: "Dossier Verkehrswende Innenstadt mit Umsetzungsstand.",
      normalizedInputSummary: "Dossier Verkehrswende Innenstadt mit Umsetzungsstand.",
      claims: [{ text: "Dossier Verkehrswende Innenstadt" }],
    });

    expect(result.matchType).toBe("related_dossier");
    expect(result.matchEntityType).toBe("dossier");
    expect(ctaIds(result)).toEqual([
      "dossier_oeffnen",
      "perspektive_anhaengen",
      "neu_anlegen",
    ]);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("returns duplicate_risk when similarity is very high but not exact", async () => {
    mocks.setProposals([
      {
        _id: new ObjectId("65f000000000000000000202"),
        text: "Tempo 30 in der Innenstadt jetzt sofort einfuehren und konsequent kontrollieren",
        title: "Tempo 30 sofort",
        topic: "verkehr",
        createdAt: new Date("2026-03-20T09:00:00.000Z"),
      },
    ]);

    const result = await resolveCreateGraphMatches({
      text: "Tempo 30 in der Innenstadt jetzt sofort einfuehren",
      normalizedInputSummary: "Tempo 30 in der Innenstadt jetzt sofort einfuehren",
      claims: [{ text: "Tempo 30 in der Innenstadt jetzt sofort einfuehren" }],
    });

    expect(result.matchType).toBe("duplicate_risk");
    expect(result.matchEntityType).toBe("claim");
    expect(result.matchStrength).toBe("high");
    expect(ctaIds(result)).toEqual([
      "anders_sehen",
      "perspektive_anhaengen",
      "neu_anlegen",
    ]);
  });

  it("returns explicit no_match with neu_anlegen CTA when no productive hit exists", async () => {
    const result = await resolveCreateGraphMatches({
      text: "Ein komplett neues Thema ohne erkennbare Produktivtreffer.",
      normalizedInputSummary: "Ein komplett neues Thema ohne erkennbare Produktivtreffer.",
      claims: [],
    });

    expect(result.matchType).toBe("no_match");
    expect(result.matchStrength).toBe("none");
    expect(result.reasons).toEqual([
      "Kein belastbarer Anlassraum-Match, keine Dossier-Naehe und keine belastbare Signalspur gefunden.",
    ]);
    expect(ctaIds(result)).toEqual(["neu_anlegen", "perspektive_anhaengen"]);
  });

  it("degrades explicitly when productive sources are unavailable", async () => {
    mocks.failAllSources();

    const result = await resolveCreateGraphMatches({
      text: "Thema mit aktuell nicht verfuegbaren Quellen.",
      normalizedInputSummary: "Thema mit aktuell nicht verfuegbaren Quellen.",
      claims: [],
    });

    expect(result.matchType).toBe("no_match");
    expect(result.matchStrength).toBe("none");
    expect(result.sourceState).toBe("degraded");
    expect(result.sourceErrors.length).toBeGreaterThan(0);
    expect(result.reasons).toEqual([
      "Produktive Anlassraum-/Dossier-/Signalquellen derzeit nicht verfuegbar.",
    ]);
    expect(ctaIds(result)).toEqual(["neu_anlegen", "perspektive_anhaengen"]);
  });
});
