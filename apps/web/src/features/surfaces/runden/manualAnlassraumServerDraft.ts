import "server-only";

import { ObjectId, coreCol } from "@core/db/triMongo";
import { readSession } from "@/utils/session";
import {
  MANUAL_ANLASSRAUM_SERVER_DRAFT_SOURCE,
  readManualAnlassraumServerDraftSnapshot,
  type ManualAnlassraumServerDraftSnapshot,
} from "@/features/surfaces/runden/manualAnlassraumSetup";

type PersistedDraftDoc = {
  _id: ObjectId;
  userId: string;
  source?: string | null;
  text: string;
  textOriginal?: string | null;
  textPrepared?: string | null;
  evidenceInput?: string | null;
  analysis?: unknown;
  status: "draft" | "finalized";
  createdAt: Date;
  updatedAt: Date;
};

export async function readManualAnlassraumServerDraftForCurrentUser(
  draftId: string | null | undefined,
): Promise<ManualAnlassraumServerDraftSnapshot | null> {
  const normalizedDraftId = String(draftId ?? "").trim();
  if (!ObjectId.isValid(normalizedDraftId)) return null;

  const session = await readSession();
  const userId = session?.uid;
  if (!userId || !ObjectId.isValid(userId)) return null;

  const drafts = await coreCol<PersistedDraftDoc>("drafts");
  const record = await drafts.findOne({
    _id: new ObjectId(normalizedDraftId),
    userId,
    source: MANUAL_ANLASSRAUM_SERVER_DRAFT_SOURCE,
  });
  return readManualAnlassraumServerDraftSnapshot(record);
}
