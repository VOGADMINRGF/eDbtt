import { vi } from "vitest";
import type { SwipeItem } from "@/features/swipes/types";

type FixtureState = {
  proposals: any[];
  voteDrafts: any[];
  dossierSuggestions: any[];
  anlassraeume: any[];
  createHandoffs: any[];
  clusterCandidates: any[];
  swipeItems: SwipeItem[];
  dossierWorkspaces: Record<string, { regionId?: string | null; organizationId?: string | null }>;
};

const DEFAULT_FIXTURES: FixtureState = {
  proposals: [],
  voteDrafts: [],
  dossierSuggestions: [],
  anlassraeume: [],
  createHandoffs: [],
  clusterCandidates: [],
  swipeItems: [],
  dossierWorkspaces: {},
};

export const autonomousFixtures: FixtureState = structuredClone(DEFAULT_FIXTURES);

export function resetAutonomousFixtures() {
  autonomousFixtures.proposals = [];
  autonomousFixtures.voteDrafts = [];
  autonomousFixtures.dossierSuggestions = [];
  autonomousFixtures.anlassraeume = [];
  autonomousFixtures.createHandoffs = [];
  autonomousFixtures.clusterCandidates = [];
  autonomousFixtures.swipeItems = [];
  autonomousFixtures.dossierWorkspaces = {};
}

export function setAutonomousFixtures(next: Partial<FixtureState>) {
  if (next.proposals) autonomousFixtures.proposals = next.proposals;
  if (next.voteDrafts) autonomousFixtures.voteDrafts = next.voteDrafts;
  if (next.dossierSuggestions) autonomousFixtures.dossierSuggestions = next.dossierSuggestions;
  if (next.anlassraeume) autonomousFixtures.anlassraeume = next.anlassraeume;
  if (next.createHandoffs) autonomousFixtures.createHandoffs = next.createHandoffs;
  if (next.clusterCandidates) autonomousFixtures.clusterCandidates = next.clusterCandidates;
  if (next.swipeItems) autonomousFixtures.swipeItems = next.swipeItems;
  if (next.dossierWorkspaces) autonomousFixtures.dossierWorkspaces = next.dossierWorkspaces;
}

function buildCursor<T>(items: T[]) {
  return {
    find() {
      return this;
    },
    sort() {
      return this;
    },
    limit() {
      return this;
    },
    async toArray() {
      return items;
    },
  };
}

class MockObjectId {
  value: string;

  constructor(value?: string) {
    this.value = String(value ?? "507f1f77bcf86cd799439011");
  }

  toHexString() {
    return this.value;
  }

  static isValid(value: string) {
    return /^[a-f0-9]{24}$/i.test(String(value));
  }
}

vi.mock("@core/db/triMongo", () => ({
  ObjectId: MockObjectId,
  getCol: async (name: string) => {
    if (name === "statement_proposals") {
      return buildCursor(autonomousFixtures.proposals);
    }
    return buildCursor([]);
  },
}));

vi.mock("@features/anlassraum/db", () => ({
  anlassraumCol: async () => buildCursor(autonomousFixtures.anlassraeume),
}));

vi.mock("@features/dossier/db", () => ({
  dossierSuggestionsCol: async () => buildCursor(autonomousFixtures.dossierSuggestions),
}));

vi.mock("@features/dossier/server/studioPersistence", () => ({
  getDossierStudioWorkspaceRepo: () => ({
    async getDossierStudioWorkspace(dossierId: string) {
      return autonomousFixtures.dossierWorkspaces[dossierId] ?? null;
    },
  }),
}));

vi.mock("@features/feeds/db", () => ({
  voteDraftsCol: async () => buildCursor(autonomousFixtures.voteDrafts),
  feedAnlassraumClusterCandidatesCol: async () => buildCursor(autonomousFixtures.clusterCandidates),
}));

vi.mock("@/features/create/persistedHandoffReviewQueue", () => ({
  buildPersistedCreateHandoffSummary: (record: any) => record.summary ?? record.sourceText ?? record.id,
  listPersistedCreateHandoffRecords: async () => autonomousFixtures.createHandoffs,
}));

vi.mock("@/features/swipes/publicTopicSupply", () => ({
  buildPublicTopicSupplyReadModel: async () => ({
    items: autonomousFixtures.swipeItems,
    summary: {
      totalVisible: autonomousFixtures.swipeItems.length,
      reviewRequired: autonomousFixtures.swipeItems.filter((item) => item.statusLabel?.includes("Prüfung")).length,
      buckets: [],
      sources: [],
      nextAction: {
        label: "Swipes prüfen",
        description: "Mock summary",
        href: "/swipes",
      },
    },
  }),
}));

export async function loadAutonomousModule() {
  return import("@features/themenradar/autonomousSupply");
}
