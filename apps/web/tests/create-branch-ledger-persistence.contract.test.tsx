import * as React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { renderToStaticMarkup } from "react-dom/server";

const routeMocks = vi.hoisted(() => {
  type AnyDoc = Record<string, any>;
  let userId: string | null = "user-1";
  const docs: AnyDoc[] = [];

  function toKey(value: unknown) {
    if (value && typeof value === "object" && "toHexString" in (value as Record<string, unknown>)) {
      const asHex = (value as { toHexString?: () => string }).toHexString;
      if (typeof asHex === "function") return asHex.call(value);
    }
    return String(value ?? "");
  }

  function readPath(source: AnyDoc, path: string) {
    return path.split(".").reduce<unknown>((current, segment) => {
      if (!current || typeof current !== "object") return undefined;
      return (current as Record<string, unknown>)[segment];
    }, source);
  }

  function matchesFilter(doc: AnyDoc, filter: AnyDoc) {
    return Object.entries(filter ?? {}).every(([key, value]) => {
      if (key === "_id") return toKey(doc._id) === toKey(value);
      const currentValue = key.includes(".") ? readPath(doc, key) : doc[key];
      return String(currentValue ?? "") === String(value ?? "");
    });
  }

  return {
    reset() {
      docs.length = 0;
      userId = "user-1";
    },
    readAll() {
      return docs.map((doc) => ({ ...doc }));
    },
    getSessionUser: vi.fn(async () =>
      userId
        ? {
            _id: { toHexString: () => userId },
            roles: ["user"],
            sessionValid: true,
          }
        : null,
    ),
    getCol: vi.fn(async (name: string) => {
      if (!["contribution_drafts", "drafts"].includes(name)) throw new Error(`unexpected_collection_${name}`);
      return {
        async insertOne(doc: AnyDoc) {
          const next = { ...doc, _id: doc._id ?? new ObjectId() };
          docs.push(next);
          return { acknowledged: true, insertedId: next._id };
        },
        async findOne(filter: AnyDoc) {
          return docs.find((doc) => matchesFilter(doc, filter)) ?? null;
        },
        async updateOne(filter: AnyDoc, update: AnyDoc) {
          const idx = docs.findIndex((doc) => matchesFilter(doc, filter));
          if (idx < 0) return { matchedCount: 0, modifiedCount: 0 };
          const set = update?.$set && typeof update.$set === "object" ? update.$set : {};
          docs[idx] = { ...docs[idx], ...set };
          return { matchedCount: 1, modifiedCount: 1 };
        },
        async findOneAndUpdate(filter: AnyDoc, update: AnyDoc) {
          const idx = docs.findIndex((doc) => matchesFilter(doc, filter));
          if (idx < 0) return null;
          const set = update?.$set && typeof update.$set === "object" ? update.$set : {};
          docs[idx] = { ...docs[idx], ...set };
          return docs[idx];
        },
      };
    }),
    resolveRequestScopeContext: vi.fn(async () => null),
    summarizeRequestScopeContext: vi.fn((scope) => scope),
  };
});

vi.mock("@core/db/triMongo", async () => {
  const mongodb = await import("mongodb");
  return {
    ObjectId: mongodb.ObjectId,
    getCol: (...args: unknown[]) => routeMocks.getCol(...args),
    coreCol: (...args: unknown[]) => routeMocks.getCol(...args),
  };
});

vi.mock("@/lib/server/auth/requestScope", () => ({
  resolveRequestScopeContext: (...args: unknown[]) => routeMocks.resolveRequestScopeContext(...args),
  summarizeRequestScopeContext: (...args: unknown[]) => routeMocks.summarizeRequestScopeContext(...args),
}));

vi.mock("@/lib/server/auth/sessionUser", () => ({
  getSessionUser: (...args: unknown[]) => routeMocks.getSessionUser(...args),
}));

import { POST as savePOST } from "@/app/api/create/save/route";
import { buildAccountResumeWorkbenchItems } from "@/app/account/AccountResumeWorkbenchSection";
import CreateContributionLedgerSection from "@/app/account/CreateContributionLedgerSection";

function countOccurrences(haystack: string, needle: string) {
  return haystack.split(needle).length - 1;
}

function req(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/create/save", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      "sec-fetch-site": "same-origin",
      "x-edebatte-create-csrf": "create-mutation-v1",
    },
    body: JSON.stringify(body),
  });
}

function buildContributionPackage() {
  return {
    id: "package-1",
    kind: "multi_branch_draft" as const,
    headline: "Mehrthemen-Beitrag als Beitragspaket",
    summary: "Du hast mehrere Themen angesprochen.",
    source: "gpt_planner" as const,
    requiresConfirmation: true as const,
    createdAt: "2026-06-03T12:00:00.000Z",
    branches: [
      {
        id: "branch-a",
        title: "Radweg / Clara-Pankowr Allee",
        summary: "Lokales Anliegen zu Radweg rund um Clara-Pankowr Allee.",
        claimCandidates: [
          {
            id: "claim-a",
            branchId: "branch-a",
            text: "Soll mehr Wohnraum entstehen?",
            kind: "question" as const,
            source: "planner_open_question" as const,
            inferredStance: "pro" as const,
            stanceConfirmationStatus: "inferred_only" as const,
          },
        ],
        placeCandidates: ["Clara-Pankowr Allee"],
        localIssueCandidates: ["Radweg"],
        needsPlaceClarification: true,
        placeClarificationQuestion: "In welcher Stadt oder welchem Bezirk liegt Clara-Pankowr Allee?",
        scopeConfidence: "low" as const,
        placeClarificationStatus: "pending" as const,
        detectedStreetName: "Clara-Pankowr Allee",
        correctedStreetName: null,
        suppliedPlace: null,
        placeResolution: {
          normalizedInput: "Clara-Pankowr Allee, Berlin",
          exactStreetMatch: false,
          exactPlaceMatch: false,
          candidates: [
            {
              id: "profile-context:clara-pankowr allee:berlin",
              streetName: "Clara-Pankowr Allee",
              city: "Berlin",
              district: null,
              municipality: "Berlin",
              state: "Berlin",
              country: "DE",
              registryId: null,
              matchType: "profile_context" as const,
              confidence: 0.64,
              reason: "Straße wurde mit deinem Profilort als möglichem Kontext vorgemerkt.",
            },
          ],
          selectedCandidate: {
            id: "profile-context:clara-pankowr allee:berlin",
            streetName: "Clara-Pankowr Allee",
            city: "Berlin",
            district: null,
            municipality: "Berlin",
            state: "Berlin",
            country: "DE",
            registryId: null,
            matchType: "profile_context" as const,
            confidence: 0.64,
            reason: "Straße wurde mit deinem Profilort als möglichem Kontext vorgemerkt.",
          },
          needsUserConfirmation: true,
          confidence: "medium" as const,
          warnings: ["street_not_resolved_exactly"],
          jurisdictionCandidates: [
            {
              level: "municipality" as const,
              label: "Berlin",
              authorityName: "Berlin Verwaltung",
              topicDependency: "Radweg / Clara-Pankowr Allee",
              confidence: 0.7,
              reason: "Abgeleitet aus möglicher Kommune/Stadt.",
              needsReview: true,
            },
          ],
        },
        placeResolutionCandidateLabel: null,
        placeResolutionSource: "none" as const,
        confirmedPlaceCandidateId: "profile-context:clara-pankowr allee:berlin",
        placeConfirmationStatus: "unconfirmed" as const,
        sensitivityLevel: "standard" as const,
        selectedAction: "prepare_qr_poll" as const,
        status: "prepared" as const,
        existingMatches: [],
      },
      {
        id: "branch-b",
        title: "Verkehr",
        summary: "Verkehr im Alltag.",
        placeCandidates: [],
        localIssueCandidates: [],
        claimCandidates: [
          {
            id: "claim-b",
            branchId: "branch-b",
            text: "Soll der Busverkehr ausgebaut werden?",
            kind: "question" as const,
            source: "planner_open_question" as const,
            inferredStance: "mixed" as const,
            stanceConfirmationStatus: "inferred_only" as const,
          },
        ],
        sensitivityLevel: "civic_sensitive" as const,
        selectedAction: "prepare_swipes" as const,
        status: "prepared" as const,
        existingMatches: [],
      },
      {
        id: "branch-c",
        title: "Pflege",
        summary: "Pflege und Versorgung.",
        placeCandidates: [],
        localIssueCandidates: [],
        claimCandidates: [
          {
            id: "claim-c",
            branchId: "branch-c",
            text: "Welche Pflegeplätze fehlen?",
            kind: "question" as const,
            source: "planner_open_question" as const,
            inferredStance: "not_inferred" as const,
            stanceConfirmationStatus: "inferred_only" as const,
            userStanceDecision: "request_review" as const,
          },
        ],
        sensitivityLevel: "legal_sensitive" as const,
        selectedAction: "request_review_or_sources" as const,
        status: "prepared" as const,
        existingMatches: [],
      },
      {
        id: "branch-d",
        title: "Mieten",
        summary: "Mieten und Bestand.",
        placeCandidates: [],
        localIssueCandidates: [],
        claimCandidates: [
          {
            id: "claim-d",
            branchId: "branch-d",
            text: "Sollen bestehende Mieten gedeckelt werden?",
            kind: "question" as const,
            source: "planner_open_question" as const,
            inferredStance: "contra" as const,
            stanceConfirmationStatus: "inferred_only" as const,
          },
        ],
        sensitivityLevel: "standard" as const,
        selectedAction: "save_only" as const,
        status: "draft" as const,
        existingMatches: [
          {
            id: "match-1",
            title: "Mehr bezahlbarer Wohnraum",
            targetType: "claim" as const,
            matchedClaimText: "Mehr bezahlbarer Wohnraum",
            currentSupportCount: 5,
            currentOpposeCount: 1,
            currentNeutralCount: 0,
            matchConfidence: 0.88,
            whyMatched: "Ähnliche wohnungspolitische Stoßrichtung.",
            userDecision: "add_as_nuance" as const,
            differenceReason: "other_reasoning" as const,
            userNuanceText: "Gleiche Richtung, aber mit anderer Begründung.",
            requiresConfirmation: true as const,
            recordedAsDraftOnly: true as const,
            confirmedAt: null,
            countedAt: null,
            mergedAt: null,
          },
        ],
      },
    ],
  };
}

describe("create branch ledger persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.reset();
  });

  it("persists a multibranch contribution ledger inside the saved draft payload", async () => {
    const res = await savePOST(
      req({
        textPrepared: "Mehrthemen-Beitrag mit Wohnen, Verkehr, Pflege und Mieten.",
        locale: "de",
        source: "create_multibranch_package",
        createMode: "source",
        packageId: "package-1",
        analysis: {
          intelligentFollowup: {
            sourceText: "Mehrthemen-Beitrag mit Wohnen, Verkehr, Pflege und Mieten.",
            contributionPackage: buildContributionPackage(),
          },
        },
      }),
    );

    expect(res.status).toBe(200);
    const saved = routeMocks.readAll();
    expect(saved).toHaveLength(1);
    expect(saved[0].analysis?.intelligentFollowup?.contributionPackage).toBeTruthy();
    expect(saved[0].analysis?.createContributionLedger).toMatchObject({
      entryPoint: "create",
      draftSaveStatus: "server_saved",
      branches: [
        expect.objectContaining({
          branchId: "branch-a",
          status: "qr_draft_prepared",
          visibilityIntent: "private_qr",
          handoffTargetType: "place_clarification",
          handoffStatus: "route_missing",
          placeCandidates: ["Clara-Pankowr Allee"],
          localIssueCandidates: ["Radweg"],
          needsPlaceClarification: true,
          placeClarificationQuestion: "In welcher Stadt oder welchem Bezirk liegt Clara-Pankowr Allee?",
          placeClarificationStatus: "pending",
          detectedStreetName: "Clara-Pankowr Allee",
          correctedStreetName: null,
          suppliedPlace: null,
          placeResolutionCandidateLabel: null,
          placeResolutionSource: "none",
          confirmedPlaceCandidateId: "profile-context:clara-pankowr allee:berlin",
          placeConfirmationStatus: "unconfirmed",
        }),
        expect.objectContaining({
          branchId: "branch-b",
          status: "swipe_draft_prepared",
          visibilityIntent: "public_swipes",
          handoffTargetType: "swipe_review",
          handoffStatus: "prepared",
        }),
        expect.objectContaining({
          branchId: "branch-c",
          status: "review_draft_prepared",
          visibilityIntent: "public_after_review",
          handoffTargetType: "factcheck_review",
          handoffStatus: "prepared",
        }),
        expect.objectContaining({
          branchId: "branch-d",
          status: "match_decision_recorded",
          visibilityIntent: "public_after_review",
          handoffTargetType: "ledger_detail",
          handoffStatus: "prepared",
        }),
      ],
    });
    expect(
      saved[0].analysis?.createContributionLedger?.branches.filter(
        (branch: { needsPlaceClarification?: boolean }) => branch.needsPlaceClarification,
      ),
    ).toHaveLength(1);
    expect(saved[0].analysis?.createContributionLedger?.branches[0]?.qrParticipationDraft).toMatchObject({
      packageId: "package-1",
      branchId: "branch-a",
      title: "Radweg / Clara-Pankowr Allee",
      question: "Soll mehr Wohnraum entstehen?",
      shareUrl: null,
      qrCodeUrl: null,
      publishedAt: null,
      guardrails: {
        noAutoPublish: true,
        noAutoVote: true,
        noAutoShare: true,
      },
    });
    expect(saved[0].analysis?.createContributionLedger?.branches[0]?.placeResolution).toMatchObject({
      selectedCandidate: expect.objectContaining({
        streetName: "Clara-Pankowr Allee",
        city: "Berlin",
        matchType: "profile_context",
      }),
      jurisdictionCandidates: [
        expect.objectContaining({
          level: "municipality",
          label: "Berlin",
          needsReview: true,
        }),
      ],
    });
    expect(saved[0].analysis?.createContributionLedger?.branches[1]?.swipeDraft).toMatchObject({
      packageId: "package-1",
      branchId: "branch-b",
      publishedAt: null,
      guardrails: {
        noAutoPublish: true,
        noAutoVote: true,
        noAutoMerge: true,
      },
      statements: [
        expect.objectContaining({
          text: "Soll der Busverkehr ausgebaut werden?",
          sourceClaimId: "claim-b",
        }),
      ],
    });
    expect(saved[0].analysis?.createContributionLedger?.branches[3]?.existingMatchDecision).toMatchObject({
      matchId: "match-1",
      targetTitle: "Mehr bezahlbarer Wohnraum",
      matchedClaimText: "Mehr bezahlbarer Wohnraum",
      currentSupportCount: 5,
      currentOpposeCount: 1,
      currentNeutralCount: 0,
      userDecision: "add_as_nuance",
      differenceReason: "other_reasoning",
      userNuanceText: "Gleiche Richtung, aber mit anderer Begründung.",
      recordedAsDraftOnly: true,
      confirmedAt: null,
      countedAt: null,
      mergedAt: null,
    });
    expect(saved[0].analysis?.createContributionLedger?.branches[2]?.stanceConfirmationStatus).toBe("inferred_only");
    expect(saved[0].analysis?.createContributionLedger?.branches[2]?.userStanceDecision).toBe("request_review");
    expect(saved[0].analysis?.createContributionLedger?.branches[2]?.reviewPreparationDraft).toMatchObject({
      autoStartBlocked: true,
    });
    expect(JSON.stringify(saved[0].analysis?.createContributionLedger)).not.toContain('"published":');
    expect(JSON.stringify(saved[0].analysis?.createContributionLedger)).not.toContain('"voted":');
    expect(saved[0].analysis?.createContributionLedger?.branches[3]?.existingMatchDecision?.mergedAt).toBeNull();
    expect(saved[0].analysis?.createContributionLedger).not.toHaveProperty("needsPlaceClarification");
    expect(saved[0].analysis?.createContributionLedger).not.toHaveProperty("placeClarificationQuestion");
  });

  it("upserts the same packageId instead of creating duplicate ledger packages", async () => {
    const first = await savePOST(
      req({
        textPrepared: "Mehrthemen-Beitrag A.",
        locale: "de",
        source: "create_multibranch_package",
        createMode: "source",
        packageId: "package-1",
        analysis: {
          intelligentFollowup: {
            sourceText: "Mehrthemen-Beitrag A.",
            contributionPackage: buildContributionPackage(),
          },
        },
      }),
    );
    expect(first.status).toBe(200);
    const firstBody = await first.json();
    expect(firstBody).toMatchObject({ ok: true });
    const createdAt = routeMocks.readAll()[0]?.analysis?.createContributionLedger?.createdAt;

    const second = await savePOST(
      req({
        draftId: firstBody.draftId,
        textPrepared: "Mehrthemen-Beitrag A mit weiteren Entscheidungen.",
        locale: "de",
        source: "create_multibranch_package",
        createMode: "source",
        packageId: "package-1",
        analysis: {
          intelligentFollowup: {
            sourceText: "Mehrthemen-Beitrag A mit weiteren Entscheidungen.",
            contributionPackage: {
              ...buildContributionPackage(),
              branches: buildContributionPackage().branches.map((branch) =>
                branch.id === "branch-d"
                  ? {
                      ...branch,
                      existingMatches: [],
                      selectedAction: "save_only",
                    }
                  : branch,
              ),
            },
          },
        },
      }),
    );
    expect(second.status).toBe(200);

    const saved = routeMocks.readAll();
    expect(saved).toHaveLength(1);
    expect(saved[0].analysis?.createContributionLedger?.packageId).toBe("package-1");
    expect(saved[0].analysis?.createContributionLedger?.branches).toHaveLength(4);
    expect(saved[0].analysis?.createContributionLedger?.createdAt).toBe(createdAt);
    expect(Date.parse(String(saved[0].analysis?.createContributionLedger?.updatedAt))).toBeGreaterThanOrEqual(
      Date.parse(String(createdAt)),
    );
  });

  it("stores corrected street name and supplied place branch-scoped in the ledger", async () => {
    const contributionPackage = buildContributionPackage();
    contributionPackage.branches = contributionPackage.branches.map((branch) =>
      branch.id === "branch-a"
        ? {
            ...branch,
            placeClarificationStatus: "answered" as const,
            detectedStreetName: "Clara-Pankowr Allee",
            correctedStreetName: "Clara-Pankower Allee",
            suppliedPlace: "Berlin-Pankow",
            placeResolutionStatus: "unresolved" as const,
            placeResolutionCandidateLabel: null,
            placeResolutionSource: "user_input" as const,
            placeConfirmationStatus: "corrected" as const,
          }
        : branch,
    );

    const res = await savePOST(
      req({
        textPrepared: "Mehrthemen-Beitrag mit lokalem Radweg.",
        locale: "de",
        source: "create_multibranch_package",
        createMode: "source",
        packageId: "package-2",
        analysis: {
          intelligentFollowup: {
            sourceText: "Mehrthemen-Beitrag mit lokalem Radweg.",
            contributionPackage,
          },
        },
      }),
    );

    expect(res.status).toBe(200);
    const saved = routeMocks.readAll();
    expect(saved[0].analysis?.createContributionLedger?.branches[0]).toMatchObject({
      branchId: "branch-a",
      detectedStreetName: "Clara-Pankowr Allee",
      correctedStreetName: "Clara-Pankower Allee",
      suppliedPlace: "Berlin-Pankow",
      placeClarificationStatus: "answered",
      placeResolutionSource: "user_input",
    });
  });

  it("renders the account section for saved create contribution ledgers as draft-only history", () => {
    const entries = [
          {
            ledgerId: "draft-1",
            packageId: "package-1",
            userId: "user-1",
            sourceText: "Mehrthemen-Beitrag mit Wohnen, Verkehr, Pflege und Mieten.",
            createdAt: "2026-06-03T12:00:00.000Z",
            updatedAt: "2026-06-03T12:05:00.000Z",
            locale: "de",
            entryPoint: "create",
            draftSaveStatus: "server_saved",
            branches: [
              {
                branchId: "branch-a",
                title: "Wohnen",
                summary: "Wohnen im Bezirk.",
                selectedAction: "qr_poll_prepare",
                status: "qr_draft_prepared",
                visibilityIntent: "private_qr",
                placeCandidates: [],
                needsPlaceClarification: false,
                placeClarificationStatus: "answered",
                detectedStreetName: "Clara-Pankower Allee",
                correctedStreetName: "Clara-Pankower Allee",
                inferredStance: "pro",
                stanceConfirmationStatus: "inferred_only",
                sensitivityLevel: "standard",
                needsReview: false,
                suppliedPlace: "Berlin-Pankow",
                placeResolutionSource: "user_input",
                qrParticipationDraft: {
                  draftId: "qr-draft-package-1-branch-a",
                  packageId: "package-1",
                  branchId: "branch-a",
                  title: "Wohnen",
                  question: "Soll mehr Wohnraum entstehen?",
                  description: "Beteiligung zu Wohnen. Pro/Contra und mögliche Folgen können vor Veröffentlichung ergänzt werden.",
                  proPrompt: "Was spricht für Wohnen?",
                  contraPrompt: "Was spricht gegen Wohnen?",
                  eventualitiesPrompt: "Welche möglichen Folgen oder Eventualitäten gibt es bei Wohnen?",
                  visibilityIntent: "private_qr",
                  status: "ready_for_review",
                  shareUrl: null,
                  qrCodeUrl: null,
                  publishedAt: null,
                  createdAt: "2026-06-03T12:00:00.000Z",
                  updatedAt: "2026-06-03T12:05:00.000Z",
                  guardrails: {
                    noAutoPublish: true,
                    noAutoVote: true,
                    noAutoShare: true,
                  },
                },
              },
              {
                branchId: "branch-b",
                title: "Mieten",
                summary: "Mieten und Bestand.",
                selectedAction: "add_nuance_to_existing",
                status: "match_decision_recorded",
                visibilityIntent: "public_after_review",
                claimCandidates: [],
                placeCandidates: [],
                localIssueCandidates: [],
                needsPlaceClarification: false,
                placeClarificationStatus: "answered",
                placeResolutionSource: "none",
                inferredStance: "mixed",
                stanceConfirmationStatus: "inferred_only",
                sensitivityLevel: "civic_sensitive",
                needsReview: true,
                existingMatchDecision: {
                  matchId: "match-1",
                  targetType: "claim",
                  targetTitle: "Mehr bezahlbarer Wohnraum",
                  matchedClaimText: "Mehr bezahlbarer Wohnraum",
                  currentSupportCount: 5,
                  currentOpposeCount: 0,
                  currentNeutralCount: 0,
                  matchConfidence: 0.88,
                  whyMatched: "Ähnliche wohnungspolitische Stoßrichtung.",
                  userDecision: "add_as_nuance",
                  differenceReason: "other_reasoning",
                  userNuanceText: "Gleiche Richtung, aber mit anderer Begründung.",
                  recordedAsDraftOnly: true,
                  confirmedAt: null,
                  countedAt: null,
                  mergedAt: null,
                },
              },
            ],
          },
          {
            ledgerId: "draft-2",
            packageId: "package-1",
            userId: "user-1",
            sourceText: "Mehrthemen-Beitrag mit Wohnen, Verkehr, Pflege und Mieten. Aktualisiert.",
            createdAt: "2026-06-03T12:00:00.000Z",
            updatedAt: "2026-06-03T12:15:00.000Z",
            locale: "de",
            entryPoint: "create",
            draftSaveStatus: "server_saved",
            branches: [
              {
                branchId: "branch-a",
                title: "Wohnen",
                summary: "Wohnen im Bezirk. Neuester Stand.",
                selectedAction: "qr_poll_prepare",
                status: "qr_draft_prepared",
                visibilityIntent: "private_qr",
                placeCandidates: [],
                needsPlaceClarification: false,
                placeClarificationStatus: "answered",
                detectedStreetName: "Clara-Pankower Allee",
                correctedStreetName: "Clara-Pankower Allee",
                inferredStance: "pro",
                stanceConfirmationStatus: "inferred_only",
                sensitivityLevel: "standard",
                needsReview: false,
                suppliedPlace: "Berlin-Pankow",
                placeResolutionSource: "user_input",
                qrParticipationDraft: {
                  draftId: "qr-draft-package-1-branch-a",
                  packageId: "package-1",
                  branchId: "branch-a",
                  title: "Wohnen",
                  question: "Soll mehr Wohnraum entstehen?",
                  description: "Beteiligung zu Wohnen. Pro/Contra und mögliche Folgen können vor Veröffentlichung ergänzt werden.",
                  proPrompt: "Was spricht für Wohnen?",
                  contraPrompt: "Was spricht gegen Wohnen?",
                  eventualitiesPrompt: "Welche möglichen Folgen oder Eventualitäten gibt es bei Wohnen?",
                  visibilityIntent: "private_qr",
                  status: "ready_for_review",
                  shareUrl: null,
                  qrCodeUrl: null,
                  publishedAt: null,
                  createdAt: "2026-06-03T12:00:00.000Z",
                  updatedAt: "2026-06-03T12:15:00.000Z",
                  guardrails: {
                    noAutoPublish: true,
                    noAutoVote: true,
                    noAutoShare: true,
                  },
                },
              },
            ],
          },
          {
            ledgerId: "draft-3",
            packageId: "package-2",
            userId: "user-1",
            sourceText: "Ähnlicher Mehrthemen-Beitrag mit Wohnen.",
            createdAt: "2026-06-03T12:20:00.000Z",
            updatedAt: "2026-06-03T12:25:00.000Z",
            locale: "de",
            entryPoint: "create",
            draftSaveStatus: "server_saved",
            branches: [
              {
                branchId: "branch-z",
                title: "Wohnen",
                summary: "Ähnlicher Wohnen-Entwurf.",
                selectedAction: "save_branch_only",
                status: "draft_saved",
                visibilityIntent: "draft",
                claimCandidates: [],
                placeCandidates: [],
                localIssueCandidates: [],
                needsPlaceClarification: false,
                placeClarificationStatus: "answered",
                placeResolutionSource: "none",
                inferredStance: "pro",
                stanceConfirmationStatus: "inferred_only",
                sensitivityLevel: "standard",
                needsReview: false,
              },
              {
                branchId: "branch-y",
                title: "Mieten",
                summary: "Ähnlicher Mieten-Entwurf.",
                selectedAction: "save_branch_only",
                status: "draft_saved",
                visibilityIntent: "draft",
                claimCandidates: [],
                placeCandidates: [],
                localIssueCandidates: [],
                needsPlaceClarification: false,
                placeClarificationStatus: "answered",
                placeResolutionSource: "none",
                inferredStance: "mixed",
                stanceConfirmationStatus: "inferred_only",
                sensitivityLevel: "civic_sensitive",
                needsReview: false,
              },
            ],
          },
        ];
    const resumeItems = buildAccountResumeWorkbenchItems({
      entries,
      startDraft: null,
      manualAnlassraumServerDrafts: [],
    });
    const latestWohnenItem = resumeItems.find((item) => item.id === "package-1-branch-a");

    const ledgerHtml = renderToStaticMarkup(<CreateContributionLedgerSection entries={entries} />);
    const html = ledgerHtml;

    expect(
      latestWohnenItem?.workflow.steps.find((step) => step.id === "contribution_classified")?.summary,
    ).toBe("Der Beitrag wurde als eigener Themenast eingeordnet.");
    expect(
      latestWohnenItem?.voxyCocreationDialog?.cards.some(
        (card) => card.dialogueMode === "counterposition_probe",
      ),
    ).toBe(true);
    expect(html).toContain("Meine Beiträge und Themenstände");
    expect(html).toContain("QR-Beteiligung als Entwurf vorbereitet");
    expect(html).toContain("Mögliche Zuordnung vorgemerkt");
    expect(html).toContain("Straße: Clara-Pankower Allee");
    expect(html).toContain("Ort: Berlin-Pankow");
    expect(html).toContain("Noch nicht veröffentlicht");
    expect(html).toContain("Noch kein QR-Link erzeugt");
    expect(html).toContain("Noch nicht gezählt");
    expect(html).toContain("Noch nicht mit bestehendem Thema zusammengeführt");
    expect(html).toContain("Nuance zu Mehr bezahlbarer Wohnraum vorgemerkt – noch nicht zusammengeführt.");
    expect(html).toContain("Unterschied: andere Begründung");
    expect(html).toContain("Nuance: Gleiche Richtung, aber mit anderer Begründung.");
    expect(html).toContain("QR-Beteiligung: Soll mehr Wohnraum entstehen?");
    expect(html).toContain("QR-Beteiligung öffnen");
    expect(html).toContain("Entwurf ansehen");
    expect(html).toContain("Ein Beteiligungsentwurf mit Frage, Pro/Contra und möglichen Folgen. Noch kein QR-Link, nicht veröffentlicht.");
    expect(html).toContain("Ähnliche Entwürfe erkannt. Diese Arbeitsstände können später zusammengeführt oder getrennt bleiben.");
    expect(html).toContain("Draft ansehen");
    expect(html).toContain("Wohnen im Bezirk. Neuester Stand.");
    expect(html).not.toContain("Wohnen im Bezirk.</p>");
    expect(html).not.toContain("Fake-5");
  });
});
