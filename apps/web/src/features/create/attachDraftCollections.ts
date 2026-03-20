import { getCol } from "@core/db/triMongo";
import type { CreatePrepareAttachDraft } from "@/features/create/prepareAttachDraft";
import type { CreatePrepareAttachDraftHistoryEventDoc } from "@/features/create/attachDraftHistory";

type CreatePrepareAttachDraftDoc = Omit<CreatePrepareAttachDraft, "draftId"> & {
  draftId: string;
  authorId: string;
  status: "draft_intent";
};

const ensured = {
  drafts: false,
  history: false,
};

export async function createPrepareAttachDraftsCol() {
  const col = await getCol<CreatePrepareAttachDraftDoc>("create_prepare_attach_drafts");
  if (!ensured.drafts) {
    if (typeof (col as any).createIndex !== "function") {
      ensured.drafts = true;
      return col;
    }
    await Promise.all([
      col.createIndex({ draftId: 1 }, { unique: true }),
      col.createIndex({ reviewState: 1, createdAt: -1 }),
      col.createIndex({ applyState: 1, updatedAt: -1 }),
      col.createIndex({ sourceRunId: 1, createdAt: -1 }),
      col.createIndex({ updatedAt: -1 }),
    ]);
    ensured.drafts = true;
  }
  return col;
}

export async function createPrepareAttachHistoryEventsCol() {
  const col = await getCol<CreatePrepareAttachDraftHistoryEventDoc>("create_prepare_attach_history_events");
  if (!ensured.history) {
    if (typeof (col as any).createIndex !== "function") {
      ensured.history = true;
      return col;
    }
    await Promise.all([
      col.createIndex({ eventId: 1 }, { unique: true }),
      col.createIndex({ draftId: 1, createdAt: -1 }),
      col.createIndex({ draftId: 1, eventType: 1, createdAt: -1 }),
      col.createIndex({ createdAt: -1 }),
    ]);
    ensured.history = true;
  }
  return col;
}
