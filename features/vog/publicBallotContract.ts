import { z } from "zod";

export const VOG_PUBLIC_BALLOT_CONTRACT_VERSION = "vog-public-ballot-v1" as const;
export const VOG_PUBLIC_BALLOT_ACCESS_MODE = "public_guest" as const;
export const VOG_PUBLIC_BALLOT_ATTRIBUTION_MODE = "hidden" as const;
export const VOG_PUBLIC_BALLOT_LEGITIMACY_CLASS = "open_public_consultation" as const;
export const VOG_BALLOT_CSRF_HEADER = "x-edebatte-vog-ballot" as const;
export const VOG_BALLOT_CSRF_VALUE = "vote-v1" as const;
export const VOG_RELEASE_CSRF_HEADER = "x-edebatte-vog-release" as const;
export const VOG_RELEASE_CSRF_VALUE = "release-v1" as const;

export type VogPublicBallotLocale = "de" | "en";
export type VogPublicBallotParticipationClass =
  | "open_guest"
  | "verified_vog_member";

const LocalizedTextSchema = z
  .object({
    de: z.string().trim().min(1).max(500),
    en: z.string().trim().min(1).max(500),
  })
  .strict();

const LocalizedBallotCopySchema = z
  .object({
    title: z.string().trim().min(3).max(240),
    context: z.string().trim().min(3).max(800),
    optionLabels: z.array(z.string().trim().min(1).max(160)).min(2).max(12),
  })
  .strict();

const HttpsUrlSchema = z
  .string()
  .trim()
  .url()
  .max(2_048)
  .refine((value) => new URL(value).protocol === "https:", "https_required");

const EvidenceLinkSchema = z
  .object({
    id: z.string().trim().regex(/^[a-z0-9][a-z0-9_-]{1,63}$/i),
    label: LocalizedTextSchema,
    href: HttpsUrlSchema,
  })
  .strict();

const CounterPositionSchema = z
  .object({
    id: z.string().trim().regex(/^[a-z0-9][a-z0-9_-]{1,63}$/i),
    label: LocalizedTextSchema,
    href: HttpsUrlSchema.optional(),
  })
  .strict();

const DateSchema = z.preprocess((value) => {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed;
  }
  return value;
}, z.date());

export const VogPublicBallotReleaseSchema = z
  .object({
    contractVersion: z.literal(VOG_PUBLIC_BALLOT_CONTRACT_VERSION),
    publicRelease: z.literal(true),
    publicVotingEnabled: z.literal(true),
    accessMode: z.literal(VOG_PUBLIC_BALLOT_ACCESS_MODE),
    attributionMode: z.literal(VOG_PUBLIC_BALLOT_ATTRIBUTION_MODE),
    legitimacyClass: z.literal(VOG_PUBLIC_BALLOT_LEGITIMACY_CLASS),
    status: z.enum(["open", "closed"]),
    originId: z
      .string()
      .trim()
      .regex(/^vog-question-[a-z0-9][a-z0-9-]{0,63}$/),
    originalLocale: z.enum(["de", "en"]),
    resultsVisibility: z.enum(["always", "after_vote"]),
    startsAt: DateSchema.nullable().optional(),
    closesAt: DateSchema.nullable().optional(),
    localized: z
      .object({
        de: LocalizedBallotCopySchema,
        en: LocalizedBallotCopySchema,
      })
      .strict(),
    sources: z.array(EvidenceLinkSchema).min(1).max(12),
    counterPositions: z.array(CounterPositionSchema).min(1).max(12),
  })
  .strict()
  .superRefine((release, ctx) => {
    if (
      release.startsAt &&
      release.closesAt &&
      release.closesAt.getTime() <= release.startsAt.getTime()
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["closesAt"],
        message: "closesAt_must_follow_startsAt",
      });
    }
    if (
      release.localized.de.optionLabels.length !==
      release.localized.en.optionLabels.length
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["localized", "en", "optionLabels"],
        message: "localized_option_count_mismatch",
      });
    }
  });

export type VogPublicBallotRelease = z.infer<
  typeof VogPublicBallotReleaseSchema
>;

export type VogPublicBallotQuestionRecord = {
  id?: unknown;
  title?: unknown;
  description?: unknown;
  options?: unknown;
  publicAttribution?: unknown;
  allowAnonymousVoting?: unknown;
  vogPublicBallot?: unknown;
};

export type ValidatedVogPublicBallotQuestion = {
  id: string;
  canonicalOptions: string[];
  release: VogPublicBallotRelease;
};

export function validateVogPublicBallotQuestion(
  question: VogPublicBallotQuestionRecord,
): ValidatedVogPublicBallotQuestion | null {
  const id = typeof question.id === "string" ? question.id.trim() : "";
  const canonicalOptions = Array.isArray(question.options)
    ? question.options
        .map((option) => (typeof option === "string" ? option.trim() : ""))
        .filter(Boolean)
    : [];
  const release = VogPublicBallotReleaseSchema.safeParse(
    question.vogPublicBallot,
  );

  if (
    !id ||
    canonicalOptions.length < 2 ||
    !release.success ||
    question.publicAttribution !== "hidden" ||
    question.allowAnonymousVoting !== true ||
    release.data.attributionMode !== "hidden" ||
    release.data.localized.de.optionLabels.length !== canonicalOptions.length ||
    release.data.localized.en.optionLabels.length !== canonicalOptions.length
  ) {
    return null;
  }

  return { id, canonicalOptions, release: release.data };
}

export type VogPublicBallotLifecycle = "open" | "scheduled" | "closed";

export function resolveVogPublicBallotLifecycle(input: {
  setStatus: unknown;
  release: VogPublicBallotRelease;
  now?: Date;
}): VogPublicBallotLifecycle {
  const now = input.now ?? new Date();
  if (input.setStatus !== "active" || input.release.status !== "open") {
    return "closed";
  }
  if (input.release.startsAt && input.release.startsAt.getTime() > now.getTime()) {
    return "scheduled";
  }
  if (input.release.closesAt && input.release.closesAt.getTime() <= now.getTime()) {
    return "closed";
  }
  return "open";
}

export type VogOriginMetadata = {
  source: "vote4gov" | "voiceopengov" | "direct";
  origin: "voiceopengov" | "vote4gov" | "edebatte";
  originId: string;
  locale: VogPublicBallotLocale;
};

export function normalizeVogPublicBallotLocale(
  value: unknown,
): VogPublicBallotLocale {
  return typeof value === "string" && value.trim().toLowerCase().startsWith("en")
    ? "en"
    : "de";
}

function readSingleMetadataValue(value: unknown): string {
  if (Array.isArray(value)) return readSingleMetadataValue(value[0]);
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function normalizeVogOriginMetadata(
  input: Record<string, unknown> | null | undefined,
  canonicalOriginId: string,
): VogOriginMetadata {
  const sourceValue = readSingleMetadataValue(input?.source);
  const originValue = readSingleMetadataValue(input?.origin);
  const source =
    sourceValue === "vote4gov" || sourceValue === "voiceopengov"
      ? sourceValue
      : "direct";
  const origin =
    originValue === "voiceopengov" ||
    originValue === "vote4gov" ||
    originValue === "edebatte"
      ? originValue
      : "edebatte";

  return {
    source,
    origin,
    // The release contract is authoritative. Query/body metadata can never replace it.
    originId: canonicalOriginId,
    locale: normalizeVogPublicBallotLocale(input?.locale),
  };
}

export function buildVogPublicBallotHref(input: {
  code: string;
  questionId: string;
  source?: VogOriginMetadata["source"];
  origin?: VogOriginMetadata["origin"];
  originId?: string;
  locale?: VogPublicBallotLocale;
}) {
  const params = new URLSearchParams();
  if (input.source) params.set("source", input.source);
  if (input.origin) params.set("origin", input.origin);
  if (input.originId) params.set("origin_id", input.originId);
  if (input.locale) params.set("locale", input.locale);
  const query = params.toString();
  const pathname = `/vog/fragen/${encodeURIComponent(input.code)}/${encodeURIComponent(input.questionId)}`;
  return query ? `${pathname}?${query}` : pathname;
}
