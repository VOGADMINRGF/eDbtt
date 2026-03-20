import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";

const mocks = vi.hoisted(() => {
  const drafts: Array<Record<string, unknown>> = [];
  const proposals: Array<Record<string, unknown>> = [];
  const applyEvents: Array<Record<string, unknown>> = [];

  const sameId = (left: unknown, right: unknown) => {
    const l = left instanceof ObjectId ? left.toHexString() : String(left || "");
    const r = right instanceof ObjectId ? right.toHexString() : String(right || "");
    return l === r;
  };

  const matches = (doc: Record<string, unknown>, filter: Record<string, unknown>) =>
    Object.entries(filter).every(([key, value]) => {
      if (key === "_id") return sameId(doc._id, value);
      return doc[key] === value;
    });

  return {
    reset() {
      drafts.length = 0;
      proposals.length = 0;
      applyEvents.length = 0;
    },
    seedDraft(doc: Record<string, unknown>) {
      drafts.push({ ...doc });
    },
    seedProposal(doc: Record<string, unknown>) {
      proposals.push({ ...doc });
    },
    readDrafts() {
      return drafts.map((entry) => ({ ...entry }));
    },
    readProposals() {
      return proposals.map((entry) => ({ ...entry }));
    },
    readApplyEvents() {
      return applyEvents.map((entry) => ({ ...entry }));
    },
    getCol: vi.fn(async (name: string) => {
      if (name === "create_prepare_attach_drafts") {
        return {
          async findOne(filter: Record<string, unknown>) {
            const hit = drafts.find((entry) => matches(entry, filter));
            return hit ? { ...hit } : null;
          },
          async updateOne(filter: Record<string, unknown>, update: Record<string, any>) {
            const idx = drafts.findIndex((entry) => matches(entry, filter));
            if (idx < 0) return { matchedCount: 0, modifiedCount: 0 };
            const setValues = update?.$set ?? {};
            drafts[idx] = { ...drafts[idx], ...setValues };
            return { matchedCount: 1, modifiedCount: 1 };
          },
        };
      }
      if (name === "statement_proposals") {
        return {
          async findOne(filter: Record<string, unknown>) {
            const hit = proposals.find((entry) => matches(entry, filter));
            return hit ? { ...hit } : null;
          },
          async updateOne(filter: Record<string, unknown>, update: Record<string, any>) {
            const idx = proposals.findIndex((entry) => matches(entry, filter));
            if (idx < 0) return { matchedCount: 0, modifiedCount: 0 };
            const addSet = update?.$addToSet ?? {};
            const setValues = update?.$set ?? {};
            let next = { ...proposals[idx], ...setValues };
            if (typeof addSet.createPrepareAttachDraftIds === "string") {
              const prev = Array.isArray(next.createPrepareAttachDraftIds)
                ? next.createPrepareAttachDraftIds
                : [];
              if (!prev.includes(addSet.createPrepareAttachDraftIds)) {
                next = {
                  ...next,
                  createPrepareAttachDraftIds: [...prev, addSet.createPrepareAttachDraftIds],
                };
              }
            }
            proposals[idx] = next;
            return { matchedCount: 1, modifiedCount: 1 };
          },
        };
      }
      if (name === "create_prepare_attach_apply_events") {
        return {
          async insertOne(doc: Record<string, unknown>) {
            applyEvents.push({ ...doc, _id: new ObjectId() });
            return { acknowledged: true };
          },
        };
      }
      throw new Error(`unexpected_collection_${name}`);
    }),
  };
});

vi.mock("@core/db/triMongo", async () => {
  const mongodb = await import("mongodb");
  return {
    ObjectId: mongodb.ObjectId,
    getCol: (...args: unknown[]) => mocks.getCol(...args),
  };
});

import { applyCreatePrepareAttachDraft } from "@/features/create/attachDraftApply";

const actor = {
  userId: "u-review",
  role: "reviewer",
  isAdmin: false,
  scopedOwnerIds: ["owner-1"],
  scopedEntityIds: ["owner-1"],
  personTrust: "verified",
} as const;

function seedAcceptedDraft(overrides?: Record<string, unknown>) {
  const draftId = new ObjectId();
  const proposalId = new ObjectId();
  mocks.seedDraft({
    _id: draftId,
    draftId: draftId.toHexString(),
    authorId: "u-author",
    status: "draft_intent",
    schemaVersion: "create_prepare_attach_draft.v1",
    sourceRunId: "run-1",
    ctaId: "perspektive_anhaengen",
    matchType: "related_claim",
    matchEntityType: "claim",
    attachTargetType: "claim",
    attachTargetId: proposalId.toHexString(),
    attachTargetRef: "/swipes?statementId=abc",
    attachTargetLabel: "Claim A",
    sourceSummary: "summary",
    selectedReason: "reason",
    reasons: ["reason"],
    sourceLanguage: "de",
    contentLanguage: "de",
    uiLocale: "de",
    requiresReview: true,
    noAutoPublish: true,
    noSilentMerge: true,
    originPreserved: true,
    duplicateRisk: false,
    reviewState: "accepted_for_apply",
    applyState: "not_applied",
    reviewNote: "ok",
    reviewedAt: "2026-03-20T10:00:00.000Z",
    reviewedBy: "u-review",
    appliedAt: null,
    appliedBy: null,
    applyNote: null,
    applyError: null,
    userConfirmedAt: "2026-03-20T09:00:00.000Z",
    createdAt: "2026-03-20T09:00:00.000Z",
    updatedAt: "2026-03-20T10:00:00.000Z",
    ...overrides,
  });
  return { draftId: draftId.toHexString(), proposalId: proposalId.toHexString() };
}

describe("create prepare-attach apply service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reset();
  });

  it("applies accepted_for_apply claim drafts manually and writes audit event", async () => {
    const { draftId, proposalId } = seedAcceptedDraft();
    mocks.seedProposal({ _id: new ObjectId(proposalId), text: "claim text", status: "proposed" });

    const result = await applyCreatePrepareAttachDraft({
      actor: actor as any,
      draftId,
      applyNote: "manual apply",
    });

    expect(result.reviewState).toBe("accepted_for_apply");
    expect(result.applyState).toBe("applied");
    expect(result.appliedBy).toBe("u-review");
    expect(result.applyNote).toBe("manual apply");
    const proposals = mocks.readProposals();
    expect(proposals[0].createPrepareAttachDraftIds).toEqual([draftId]);
    expect(mocks.readApplyEvents()).toHaveLength(1);
  });

  it("blocks apply when review state is not accepted_for_apply", async () => {
    const { draftId } = seedAcceptedDraft({ reviewState: "pending" });
    await expect(
      applyCreatePrepareAttachDraft({ actor: actor as any, draftId }),
    ).rejects.toThrow("attach_draft_review_state_not_accepted");
  });

  it("blocks repeated apply when already applied", async () => {
    const { draftId } = seedAcceptedDraft({ applyState: "applied", appliedBy: "u-review" });
    await expect(
      applyCreatePrepareAttachDraft({ actor: actor as any, draftId }),
    ).rejects.toThrow("attach_draft_already_applied");
  });

  it("marks unsupported target types as apply_failed", async () => {
    const { draftId } = seedAcceptedDraft({ attachTargetType: "dossier", attachTargetId: "dossier-1" });
    await expect(
      applyCreatePrepareAttachDraft({ actor: actor as any, draftId }),
    ).rejects.toThrow("unsupported_attach_target_type");
    const draft = mocks.readDrafts()[0];
    expect(draft.applyState).toBe("apply_failed");
    expect(draft.applyError).toBe("unsupported_attach_target_type");
  });

  it("marks missing claim targets as apply_failed", async () => {
    const { draftId } = seedAcceptedDraft();
    await expect(
      applyCreatePrepareAttachDraft({ actor: actor as any, draftId }),
    ).rejects.toThrow("attach_target_not_found");
    const draft = mocks.readDrafts()[0];
    expect(draft.applyState).toBe("apply_failed");
    expect(draft.applyError).toBe("attach_target_not_found");
  });
});
