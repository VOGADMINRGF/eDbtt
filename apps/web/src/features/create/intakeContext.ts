export type CreateIntakeContext = {
  source: string | null;
  signalTitle: string | null;
  sourceUrl: string | null;
  sourceLabel: string | null;
  region: string | null;
  scope: string | null;
  clusterHint: string | null;
  reviewState: string | null;
  candidateId: string | null;
  draftId: string | null;
  reason: string | null;
};

type IntakeQueryRecord = Record<string, string | string[] | undefined>;
type IntakeField = keyof CreateIntakeContext;

const INTAKE_TEXT_LIMITS: Record<Exclude<IntakeField, "sourceUrl">, number> = {
  source: 64,
  signalTitle: 160,
  sourceLabel: 120,
  region: 64,
  scope: 64,
  clusterHint: 120,
  reviewState: 64,
  candidateId: 64,
  draftId: 64,
  reason: 200,
};

function readParam(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function decodeMaybe(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeText(value: unknown, maxLen: number): string | null {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLen);
}

function normalizeUrl(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString().slice(0, 1000);
  } catch {
    return null;
  }
}

export function normalizeCreateIntakeContextInput(
  input: Partial<Record<IntakeField, unknown>>,
): CreateIntakeContext {
  return {
    source: normalizeText(input.source, INTAKE_TEXT_LIMITS.source),
    signalTitle: normalizeText(input.signalTitle, INTAKE_TEXT_LIMITS.signalTitle),
    sourceUrl: normalizeUrl(input.sourceUrl),
    sourceLabel: normalizeText(input.sourceLabel, INTAKE_TEXT_LIMITS.sourceLabel),
    region: normalizeText(input.region, INTAKE_TEXT_LIMITS.region),
    scope: normalizeText(input.scope, INTAKE_TEXT_LIMITS.scope),
    clusterHint: normalizeText(input.clusterHint, INTAKE_TEXT_LIMITS.clusterHint),
    reviewState: normalizeText(input.reviewState, INTAKE_TEXT_LIMITS.reviewState),
    candidateId: normalizeText(input.candidateId, INTAKE_TEXT_LIMITS.candidateId),
    draftId: normalizeText(input.draftId, INTAKE_TEXT_LIMITS.draftId),
    reason: normalizeText(input.reason, INTAKE_TEXT_LIMITS.reason),
  };
}

export function parseCreateIntakeContextFromQuery(params: IntakeQueryRecord): CreateIntakeContext {
  return normalizeCreateIntakeContextInput({
    source: readParam(params.source),
    signalTitle: decodeMaybe(readParam(params.signalTitle)),
    sourceUrl: decodeMaybe(readParam(params.sourceUrl)),
    sourceLabel: decodeMaybe(readParam(params.sourceLabel)),
    region: decodeMaybe(readParam(params.region)),
    scope: decodeMaybe(readParam(params.scope)),
    clusterHint: decodeMaybe(readParam(params.clusterHint)),
    reviewState: decodeMaybe(readParam(params.reviewState)),
    candidateId: readParam(params.candidateId),
    draftId: readParam(params.draftId),
    reason: decodeMaybe(readParam(params.reason)),
  });
}

export function hasCreateIntakeContext(context?: CreateIntakeContext | null): boolean {
  if (!context) return false;
  return (
    !!context.source ||
    !!context.signalTitle ||
    !!context.sourceUrl ||
    !!context.sourceLabel ||
    !!context.region ||
    !!context.scope ||
    !!context.clusterHint ||
    !!context.reviewState ||
    !!context.candidateId ||
    !!context.draftId ||
    !!context.reason
  );
}
