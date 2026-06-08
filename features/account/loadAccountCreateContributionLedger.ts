import { ObjectId, getCol } from "@core/db/triMongo";
import { DEFAULT_LOCALE, isSupportedLocale } from "@core/locale/locales";
import {
  dedupeCreateContributionLedgerEntries,
  readCreateContributionLedgerEntryFromAnalysis,
} from "@features/create/createContributionLedger";

type ContributionDraftDoc = {
  _id: ObjectId;
  authorId: string;
  text?: string | null;
  locale?: string | null;
  analysis?: unknown;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  status?: "draft" | "finalized" | string | null;
};

function toIsoDate(value?: Date | string | null): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value.trim()) return value;
  return new Date().toISOString();
}

export async function loadAccountCreateContributionLedger(
  userId: string,
  preferredLocale: string,
  limit = 8,
) {
  const Drafts = await getCol<ContributionDraftDoc>("contribution_drafts");
  const contributionDrafts = await Drafts.find(
    { authorId: userId, status: "draft" },
    {
      projection: {
        text: 1,
        locale: 1,
        analysis: 1,
        createdAt: 1,
        updatedAt: 1,
      },
      sort: { updatedAt: -1 },
      limit,
    },
  ).toArray();

  return dedupeCreateContributionLedgerEntries(
    contributionDrafts
      .map((draft) =>
        readCreateContributionLedgerEntryFromAnalysis({
          analysis: draft.analysis,
          ledgerId: String(draft._id),
          userId,
          locale:
            typeof draft.locale === "string" && isSupportedLocale(draft.locale)
              ? draft.locale
              : isSupportedLocale(preferredLocale)
                ? preferredLocale
                : DEFAULT_LOCALE,
          sourceText: draft.text ?? "",
          createdAt: toIsoDate(draft.createdAt),
          updatedAt: toIsoDate(draft.updatedAt),
        }),
      )
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry)),
  );
}
