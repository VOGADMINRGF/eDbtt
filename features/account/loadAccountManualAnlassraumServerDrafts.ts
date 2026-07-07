import { ObjectId, coreCol } from "@core/db/triMongo";
import {
  MANUAL_ANLASSRAUM_SERVER_DRAFT_SOURCE,
  readManualAnlassraumServerDraftSnapshot,
  type ManualAnlassraumServerDraftSnapshot,
} from "@/features/surfaces/runden/manualAnlassraumSetup";

type PersistedDraftDoc = {
  _id: ObjectId;
  userId: string;
  source?: string | null;
  status?: "draft" | "finalized" | string | null;
  updatedAt?: Date | string | null;
  analysis?: unknown;
};

export async function loadAccountManualAnlassraumServerDrafts(
  userId: string,
  limit = 8,
): Promise<ManualAnlassraumServerDraftSnapshot[]> {
  if (!ObjectId.isValid(userId)) return [];

  const drafts = await coreCol<PersistedDraftDoc>("drafts");
  const records = await drafts
    .find(
      {
        userId,
        source: MANUAL_ANLASSRAUM_SERVER_DRAFT_SOURCE,
        status: "draft",
      },
      {
        projection: {
          source: 1,
          updatedAt: 1,
          analysis: 1,
        },
        sort: { updatedAt: -1 },
        limit,
      },
    )
    .toArray();

  return records
    .map((record) => readManualAnlassraumServerDraftSnapshot(record))
    .filter((record): record is ManualAnlassraumServerDraftSnapshot => Boolean(record));
}
