import "server-only";

import { coreCol } from "@core/db/triMongo";
import {
  normalizeVogPublicBallotLocale,
  resolveVogPublicBallotLifecycle,
  validateVogPublicBallotQuestion,
  type VogOriginMetadata,
  type VogPublicBallotLifecycle,
  type VogPublicBallotLocale,
  type VogPublicBallotRelease,
} from "@features/vog/publicBallotContract";
import { VoteModel } from "@/models/votes/Vote";

type QrQuestionSetRecord = {
  code?: unknown;
  title?: unknown;
  status?: unknown;
  questions?: unknown;
};

export type VogPublicBallotRecord = {
  code: string;
  setStatus: unknown;
  questionId: string;
  canonicalOptions: string[];
  release: VogPublicBallotRelease;
  lifecycle: VogPublicBallotLifecycle;
};

export type VogPublicBallotResultPass = {
  totalVotes: number;
  openGuestVotes: number;
  verifiedMemberVotes: number;
  optionCounts: Array<{ canonicalChoice: string; label: string; count: number }>;
  distributionChannels: Array<{
    source: VogOriginMetadata["source"];
    count: number;
  }>;
  startsAt: string | null;
  closesAt: string | null;
  resultStatus: "public_consultation";
};

export type VogPublicBallotReadModel = {
  code: string;
  questionId: string;
  originId: string;
  locale: VogPublicBallotLocale;
  originalLocale: VogPublicBallotLocale;
  lifecycle: VogPublicBallotLifecycle;
  title: string;
  context: string;
  options: Array<{ canonicalChoice: string; label: string }>;
  sources: Array<{ id: string; label: string; href: string }>;
  counterPositions: Array<{ id: string; label: string; href: string | null }>;
  accessMode: "public_guest";
  attributionMode: "hidden";
  legitimacyClass: "open_public_consultation";
  ownSelection: string | null;
  ownSelectionLabel: string | null;
  results: VogPublicBallotResultPass | null;
};

export async function loadVogPublicBallotRecord(input: {
  code: string;
  questionId: string;
  now?: Date;
}): Promise<VogPublicBallotRecord | null> {
  const code = input.code.trim();
  const questionId = input.questionId.trim();
  if (!code || !questionId || code.length > 120 || questionId.length > 120) {
    return null;
  }

  const sets = await coreCol<QrQuestionSetRecord>("qr_question_sets");
  const set = await sets.findOne({ code });
  const questions = set && Array.isArray(set.questions) ? set.questions : [];
  const question = questions.find(
    (candidate) =>
      candidate &&
      typeof candidate === "object" &&
      String((candidate as Record<string, unknown>).id ?? "") === questionId,
  );
  if (!set || !question || typeof question !== "object") return null;

  const validated = validateVogPublicBallotQuestion(question);
  if (!validated) return null;

  return {
    code,
    setStatus: set.status,
    questionId: validated.id,
    canonicalOptions: validated.canonicalOptions,
    release: validated.release,
    lifecycle: resolveVogPublicBallotLifecycle({
      setStatus: set.status,
      release: validated.release,
      now: input.now,
    }),
  };
}

function shouldExposeResults(input: {
  lifecycle: VogPublicBallotLifecycle;
  visibility: VogPublicBallotRelease["resultsVisibility"];
  hasOwnVote: boolean;
}) {
  if (input.visibility === "always") return true;
  return input.hasOwnVote;
}

type ResultRow = {
  _id?: { participationClass?: unknown; choice?: unknown; source?: unknown };
  count?: unknown;
};

async function projectResults(input: {
  record: VogPublicBallotRecord;
  locale: VogPublicBallotLocale;
}): Promise<VogPublicBallotResultPass> {
  const votes = await VoteModel();
  const rows = (await votes
    .aggregate<ResultRow>([
      {
        $match: {
          qrSetId: input.record.code,
          qrQuestionId: input.record.questionId,
          participationClass: {
            $in: ["open_guest", "verified_vog_member"],
          },
        },
      },
      {
        $group: {
          _id: {
            participationClass: "$participationClass",
            choice: "$choice",
            source: "$originMetadata.source",
          },
          count: { $sum: 1 },
        },
      },
    ])
    .toArray()) as ResultRow[];

  const optionCounts = new Map<string, number>();
  const distributionChannels = new Map<VogOriginMetadata["source"], number>();
  let openGuestVotes = 0;
  let verifiedMemberVotes = 0;

  for (const row of rows) {
    const count = Number(row.count ?? 0);
    if (!Number.isFinite(count) || count <= 0) continue;
    const participationClass = String(row._id?.participationClass ?? "");
    const choice = String(row._id?.choice ?? "");
    const source = String(row._id?.source ?? "");
    if (
      participationClass !== "open_guest" &&
      participationClass !== "verified_vog_member"
    ) {
      continue;
    }
    if (participationClass === "open_guest") openGuestVotes += count;
    if (participationClass === "verified_vog_member") {
      verifiedMemberVotes += count;
    }
    if (input.record.canonicalOptions.includes(choice)) {
      optionCounts.set(choice, (optionCounts.get(choice) ?? 0) + count);
    }
    if (
      source === "vote4gov" ||
      source === "voiceopengov" ||
      source === "direct"
    ) {
      distributionChannels.set(
        source,
        (distributionChannels.get(source) ?? 0) + count,
      );
    }
  }

  const copy = input.record.release.localized[input.locale];
  return {
    totalVotes: openGuestVotes + verifiedMemberVotes,
    openGuestVotes,
    verifiedMemberVotes,
    optionCounts: input.record.canonicalOptions.map((canonicalChoice, index) => ({
      canonicalChoice,
      label: copy.optionLabels[index],
      count: optionCounts.get(canonicalChoice) ?? 0,
    })),
    distributionChannels: [...distributionChannels.entries()].map(
      ([source, count]) => ({ source, count }),
    ),
    startsAt: input.record.release.startsAt?.toISOString() ?? null,
    closesAt: input.record.release.closesAt?.toISOString() ?? null,
    resultStatus: "public_consultation",
  };
}

export async function getVogPublicBallotReadModel(input: {
  code: string;
  questionId: string;
  locale?: unknown;
  guestTokenHash?: string | null;
  now?: Date;
}): Promise<VogPublicBallotReadModel | null> {
  const record = await loadVogPublicBallotRecord(input);
  if (!record) return null;

  const locale = normalizeVogPublicBallotLocale(input.locale);
  const copy = record.release.localized[locale];
  const votes = await VoteModel();
  const ownVote = input.guestTokenHash
    ? await votes.findOne({
        qrSetId: record.code,
        qrQuestionId: record.questionId,
        participationClass: "open_guest",
        sessionId: input.guestTokenHash,
      })
    : null;
  const ownSelection =
    ownVote?.choice && record.canonicalOptions.includes(String(ownVote.choice))
      ? String(ownVote.choice)
      : null;
  const ownSelectionIndex = ownSelection
    ? record.canonicalOptions.indexOf(ownSelection)
    : -1;
  const exposeResults = shouldExposeResults({
    lifecycle: record.lifecycle,
    visibility: record.release.resultsVisibility,
    hasOwnVote: Boolean(ownSelection),
  });

  return {
    code: record.code,
    questionId: record.questionId,
    originId: record.release.originId,
    locale,
    originalLocale: record.release.originalLocale,
    lifecycle: record.lifecycle,
    title: copy.title,
    context: copy.context,
    options: record.canonicalOptions.map((canonicalChoice, index) => ({
      canonicalChoice,
      label: copy.optionLabels[index],
    })),
    sources: record.release.sources.map((source) => ({
      id: source.id,
      label: source.label[locale],
      href: source.href,
    })),
    counterPositions: record.release.counterPositions.map((position) => ({
      id: position.id,
      label: position.label[locale],
      href: position.href ?? null,
    })),
    accessMode: "public_guest",
    attributionMode: "hidden",
    legitimacyClass: "open_public_consultation",
    ownSelection,
    ownSelectionLabel:
      ownSelectionIndex >= 0 ? copy.optionLabels[ownSelectionIndex] : null,
    results: exposeResults
      ? await projectResults({ record, locale })
      : null,
  };
}
