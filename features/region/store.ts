import { z } from "zod";
import {
  buildOfficialRegionalActorsFromDirectory,
  buildOfficialRegionsFromDirectory,
  summarizeOfficialAdministrativeDirectory,
} from "./directory";
import {
  type CommunitySignal,
  type CommunitySignalReviewStatus,
  type CommunitySignalType,
  type Region,
  type RegionalActor,
  type RegionalActorType,
  type RegionalActorVerificationStatus,
  type RegionalAdminCockpit,
  normalizeCommunitySignalReviewStatus,
  normalizeCommunitySignalSubmitterMode,
  normalizeCommunitySignalType,
  normalizeRegionalActorType,
  normalizeRegionalActorVerificationStatus,
  parseCommunitySignal,
  parseRegionalActor,
} from "./contracts";
import {
  getCommunitySignalById,
  getRegionById,
  getRegionalAdminCockpitById,
  listCommunitySignals,
  listRegions,
} from "./fixtures";
import {
  getRegionDataRepo,
  setRegionDataRepoForTests,
  type CommunitySignalRepoListQuery,
  type RegionalActorRepoListQuery,
} from "./server/repo";

export type RegionalActorRegisterQuery = RegionalActorRepoListQuery;
export type CommunitySignalQueueQuery = CommunitySignalRepoListQuery;

export type RegionalAdminCockpitReadModel = {
  region: Region;
  actorCount: number;
  verifiedActorCount: number;
  officialDirectoryActorCount: number;
  signalCount: number;
  pendingSignalCount: number;
  directoryStructureBreakdown: Array<{ administrativeUnitType: string; count: number }>;
  cockpit: RegionalAdminCockpit;
};

const CommunitySignalCreateSchema = z
  .object({
    regionId: z.string().trim().min(1),
    title: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    signalType: z.string().trim().min(1).optional(),
    sourceActorId: z.string().trim().min(1).nullable().optional(),
    sourceUrls: z.array(z.string().trim().url()).optional(),
    submitter: z.object({
      mode: z.string().trim().min(1).optional(),
      displayName: z.string().trim().min(1).nullable().optional(),
      contactChannel: z.string().trim().min(1).nullable().optional(),
    }),
  })
  .strict();

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function buildActorRegisterMap(entries: RegionalActor[]): Map<string, RegionalActor> {
  return new Map(entries.map((entry) => [entry.id, clone(entry)]));
}

function normalizeLimit(value: unknown, fallback = 100) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
  return Math.max(1, Math.min(2000, Math.floor(numeric)));
}

function buildIsoNow(): string {
  return new Date().toISOString();
}

function matchesActorQuery(actor: RegionalActor, query: RegionalActorRegisterQuery): boolean {
  if (query.regionId?.trim() && actor.regionId !== query.regionId.trim()) return false;
  if (query.actorType && query.actorType !== "all" && actor.actorType !== query.actorType) return false;
  if (
    query.verificationStatus &&
    query.verificationStatus !== "all" &&
    actor.verificationStatus !== query.verificationStatus
  ) {
    return false;
  }
  if (query.sourceKind && query.sourceKind !== "all" && actor.sourceKind !== query.sourceKind) return false;
  return true;
}

function matchesSignalQuery(signal: CommunitySignal, query: CommunitySignalQueueQuery): boolean {
  if (query.regionId?.trim() && signal.regionId !== query.regionId.trim()) return false;
  if (query.signalType && query.signalType !== "all" && signal.signalType !== query.signalType) return false;
  if (
    query.reviewStatus &&
    query.reviewStatus !== "all" &&
    signal.reviewStatus !== query.reviewStatus
  ) {
    return false;
  }
  return true;
}

export async function listOperationalRegions(): Promise<Region[]> {
  const fixtureMap = new Map(listRegions().map((region) => [region.id, clone(region)]));
  for (const region of buildOfficialRegionsFromDirectory()) {
    if (!fixtureMap.has(region.id)) fixtureMap.set(region.id, region);
  }
  return Array.from(fixtureMap.values());
}

export async function getOperationalRegionById(id: string): Promise<Region | null> {
  const fixture = getRegionById(id);
  if (fixture) return clone(fixture);
  return (await listOperationalRegions()).find((region) => region.id === id) ?? null;
}

export async function listRegionalActorRegister(query: RegionalActorRegisterQuery = {}): Promise<RegionalActor[]> {
  const repo = getRegionDataRepo();
  const officialActors = buildOfficialRegionalActorsFromDirectory();
  const manualActors = await repo.listManualActors({
    ...query,
    sourceKind: query.sourceKind === "official_directory" ? "all" : query.sourceKind,
  });

  const merged = buildActorRegisterMap(officialActors);
  for (const actor of manualActors) merged.set(actor.id, clone(actor));

  return Array.from(merged.values())
    .filter((actor) => matchesActorQuery(actor, query))
    .sort((left, right) => String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? "")))
    .slice(0, normalizeLimit(query.limit));
}

export async function getRegionalActorRegisterEntry(id: string): Promise<RegionalActor | null> {
  const repo = getRegionDataRepo();
  const manual = await repo.getManualActorById(id);
  if (manual) return manual;
  return buildOfficialRegionalActorsFromDirectory().find((entry) => entry.id === id) ?? null;
}

export async function saveRegionalActorRegisterEntry(input: Partial<RegionalActor> & {
  id: string;
  regionId: string;
  slug: string;
  name: string;
}): Promise<RegionalActor> {
  const repo = getRegionDataRepo();
  const actor = parseRegionalActor({
    ...input,
    actorType: normalizeRegionalActorType(input.actorType ?? "sonstige"),
    verificationStatus: normalizeRegionalActorVerificationStatus(input.verificationStatus ?? "review_required"),
    sourceKind: input.sourceKind ?? "manual_admin",
    publicVisibility: input.publicVisibility ?? "restricted",
    address: input.address ?? null,
    officialDirectoryEntry: input.officialDirectoryEntry ?? null,
    administrativeUnitType: input.administrativeUnitType ?? null,
    description: input.description ?? null,
    tags: input.tags ?? [],
    guardrails: input.guardrails ?? {
      noAutomaticPoliticalAssignment: true,
      noAutomaticVoiceOpenGovMembership: true,
      verificationStatusRequired: true,
    },
    createdAt: input.createdAt ?? buildIsoNow(),
    updatedAt: buildIsoNow(),
  });
  await repo.upsertManualActor(actor);
  return actor;
}

export async function listRegionalCommunitySignals(query: CommunitySignalQueueQuery = {}): Promise<CommunitySignal[]> {
  const repo = getRegionDataRepo();
  const fixtureSignals = listCommunitySignals();
  const storedSignals = await repo.listSignals(query);
  const merged = new Map<string, CommunitySignal>();

  for (const signal of fixtureSignals) merged.set(signal.id, clone(signal));
  for (const signal of storedSignals) merged.set(signal.id, clone(signal));

  return Array.from(merged.values())
    .filter((signal) => matchesSignalQuery(signal, query))
    .sort((left, right) => String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? "")))
    .slice(0, normalizeLimit(query.limit));
}

export async function getRegionalCommunitySignalById(id: string): Promise<CommunitySignal | null> {
  const repo = getRegionDataRepo();
  const stored = await repo.getSignalById(id);
  if (stored) return stored;
  return getCommunitySignalById(id);
}

export async function createRegionalCommunitySignal(
  input: z.input<typeof CommunitySignalCreateSchema>,
): Promise<CommunitySignal> {
  const repo = getRegionDataRepo();
  const parsedInput = CommunitySignalCreateSchema.parse(input);
  const signal = parseCommunitySignal({
    id: `signal-${parsedInput.regionId}-${Date.now()}`,
    regionId: parsedInput.regionId,
    title: parsedInput.title,
    summary: parsedInput.summary,
    signalType: normalizeCommunitySignalType(parsedInput.signalType),
    reviewStatus: "submitted",
    sourceActorId: parsedInput.sourceActorId ?? null,
    sourceUrls: parsedInput.sourceUrls ?? [],
    submitter: {
      mode: normalizeCommunitySignalSubmitterMode(parsedInput.submitter.mode),
      displayName: parsedInput.submitter.displayName ?? null,
      contactChannel: parsedInput.submitter.contactChannel ?? null,
    },
    guardrails: {
      moderationRequired: true,
      noAutoPublish: true,
      noAutoMandate: true,
      noAutomaticDossierCreation: true,
    },
    createdAt: buildIsoNow(),
    updatedAt: buildIsoNow(),
  });
  await repo.upsertSignal(signal);
  return signal;
}

export async function reviewRegionalCommunitySignal(params: {
  id: string;
  reviewStatus: CommunitySignalReviewStatus;
}): Promise<CommunitySignal> {
  const repo = getRegionDataRepo();
  const existing = await getRegionalCommunitySignalById(params.id);
  if (!existing) {
    throw new Error("community_signal_not_found");
  }
  const updated = parseCommunitySignal({
    ...existing,
    reviewStatus: normalizeCommunitySignalReviewStatus(params.reviewStatus),
    updatedAt: buildIsoNow(),
  });
  await repo.upsertSignal(updated);
  return updated;
}

function buildDefaultCockpit(region: Region, signals: CommunitySignal[], actors: RegionalActor[]): RegionalAdminCockpit {
  const fixtureCockpit = getRegionalAdminCockpitById(`admin-cockpit-${region.slug}`);
  const base = fixtureCockpit ?? getRegionalAdminCockpitById(`admin-cockpit-${region.id}`);

  return {
    id: base?.id ?? `admin-cockpit-${region.id}`,
    regionId: region.id,
    title: base?.title ?? `Verwaltungscockpit ${region.name}`,
    modules: {
      themenlage: {
        headline: "Themenlage",
        summary: `${signals.length} reviewbare Signale liegen aktuell für ${region.name} vor.`,
      },
      akteurskarte: {
        headline: "Akteurskarte",
        summary: `${actors.length} regionale Akteure sind sichtbar, davon ${actors.filter((actor) => actor.actorType === "verwaltung").length} Verwaltungseinträge.`,
      },
      beteiligungsstatus: {
        headline: "Beteiligungsstatus",
        summary: `${signals.filter((signal) => signal.reviewStatus === "in_review").length} Signale befinden sich gerade in Prüfung.`,
      },
      offene_fragen: {
        headline: "Offene Fragen",
        summary: `${signals.filter((signal) => signal.reviewStatus === "submitted").length} Signale warten noch auf erste Sichtung oder Rückfrage.`,
      },
      teilhabegaps: {
        headline: "Teilhabegaps",
        summary: "Das Lagebild bleibt ausdrücklich ohne Scoring und hebt nur sichtbare Beteiligungslücken hervor.",
      },
      naechste_rueckmeldungen: {
        headline: "Nächste Rückmeldungen",
        summary: "Review-first: Rückmeldungen an Verwaltung und Öffentlichkeit werden erst nach Sichtung vorbereitet.",
      },
      mandatsstatus: {
        headline: "Mandatsstatus",
        summary: "Kein Auto-Mandat: Verortung und Weitergabe bleiben bewusste redaktionelle Schritte.",
      },
    },
    guardrails: {
      noCitizenScoring: true,
      noAssociationScoring: true,
      noAutomatedEnforcement: true,
    },
    createdAt: base?.createdAt ?? buildIsoNow(),
    updatedAt: buildIsoNow(),
  };
}

export async function getRegionalAdminCockpitReadModel(
  regionId: string,
): Promise<RegionalAdminCockpitReadModel> {
  const region = await getOperationalRegionById(regionId);
  if (!region) throw new Error("region_not_found");

  const [signals, actors] = await Promise.all([
    listRegionalCommunitySignals({ regionId, limit: 2000 }),
    listRegionalActorRegister({ regionId, limit: 2000 }),
  ]);

  const cockpit = buildDefaultCockpit(region, signals, actors);
  const structureCounts = new Map<string, number>();
  for (const actor of actors) {
    const key = actor.administrativeUnitType ?? "sonstige";
    structureCounts.set(key, (structureCounts.get(key) ?? 0) + 1);
  }

  return {
    region,
    actorCount: actors.length,
    verifiedActorCount: actors.filter((actor) => actor.verificationStatus === "verified").length,
    officialDirectoryActorCount: actors.filter((actor) => actor.sourceKind === "official_directory").length,
    signalCount: signals.length,
    pendingSignalCount: signals.filter((signal) => signal.reviewStatus === "submitted").length,
    directoryStructureBreakdown:
      actors.length > 0
        ? Array.from(structureCounts.entries())
            .map(([administrativeUnitType, count]) => ({ administrativeUnitType, count }))
            .sort((left, right) => right.count - left.count)
        : summarizeOfficialAdministrativeDirectory().slice(0, 12).map((entry) => ({
            administrativeUnitType: entry.administrativeUnitType,
            count: entry.count,
          })),
    cockpit,
  };
}

export { setRegionDataRepoForTests };
