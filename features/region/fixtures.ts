import {
  parseCommunitySignal,
  parseRegionalActor,
  parseRegionalAdminCockpit,
  parseRegion,
  parseRegionalAnlassraum,
  type CommunitySignal,
  type RegionalActor,
  type RegionalAdminCockpit,
  type Region,
  type RegionalAnlassraum,
  REGIONAL_ANLASSRAUM_SCOPE_KEYS,
} from "./contracts";

export const REGION_FIXTURES: readonly Region[] = [
  parseRegion({
    id: "region-berlin",
    slug: "berlin",
    name: "Berlin",
    type: "region",
    parentRegionId: null,
    officialBody: {
      id: "body-land-berlin",
      label: "Senat von Berlin",
      bodyType: "regionalverband",
    },
    federalState: "Berlin",
    country: "DE",
    publicVisibility: "public",
    createdAt: "2026-05-03T00:00:00.000Z",
    updatedAt: "2026-05-03T00:00:00.000Z",
  }),
  parseRegion({
    id: "bezirk-berlin-reinickendorf",
    slug: "berlin-reinickendorf",
    name: "Berlin Reinickendorf",
    type: "bezirk",
    parentRegionId: "region-berlin",
    officialBody: {
      id: "body-bezirksamt-reinickendorf",
      label: "Bezirksamt Reinickendorf",
      bodyType: "bezirksamt",
    },
    federalState: "Berlin",
    country: "DE",
    publicVisibility: "public",
    createdAt: "2026-05-03T00:00:00.000Z",
    updatedAt: "2026-05-03T00:00:00.000Z",
  }),
  parseRegion({
    id: "bezirk-berlin-spandau",
    slug: "berlin-spandau",
    name: "Berlin Spandau",
    type: "bezirk",
    parentRegionId: "region-berlin",
    officialBody: {
      id: "body-bezirksamt-spandau",
      label: "Bezirksamt Spandau",
      bodyType: "bezirksamt",
    },
    federalState: "Berlin",
    country: "DE",
    publicVisibility: "public",
    createdAt: "2026-05-14T00:00:00.000Z",
    updatedAt: "2026-05-14T00:00:00.000Z",
  }),
  parseRegion({
    id: "bezirk-berlin-pankow",
    slug: "berlin-pankow",
    name: "Berlin Pankow",
    type: "bezirk",
    parentRegionId: "region-berlin",
    officialBody: {
      id: "body-bezirksamt-pankow",
      label: "Bezirksamt Pankow",
      bodyType: "bezirksamt",
    },
    federalState: "Berlin",
    country: "DE",
    publicVisibility: "public",
    createdAt: "2026-05-14T00:00:00.000Z",
    updatedAt: "2026-05-14T00:00:00.000Z",
  }),
  parseRegion({
    id: "kommune-beispielstadt",
    slug: "beispielstadt",
    name: "Beispielstadt",
    type: "kommune",
    parentRegionId: null,
    officialBody: {
      id: "body-stadtverwaltung-beispielstadt",
      label: "Stadtverwaltung Beispielstadt",
      bodyType: "stadtverwaltung",
    },
    federalState: "Brandenburg",
    country: "DE",
    publicVisibility: "public",
    createdAt: "2026-05-03T00:00:00.000Z",
    updatedAt: "2026-05-03T00:00:00.000Z",
  }),
  parseRegion({
    id: "kommune-magdeburg",
    slug: "magdeburg",
    name: "Magdeburg",
    type: "kommune",
    parentRegionId: null,
    officialBody: {
      id: "body-stadtverwaltung-magdeburg",
      label: "Landeshauptstadt Magdeburg",
      bodyType: "stadtverwaltung",
    },
    federalState: "Sachsen-Anhalt",
    country: "DE",
    publicVisibility: "public",
    createdAt: "2026-05-14T00:00:00.000Z",
    updatedAt: "2026-05-14T00:00:00.000Z",
  }),
  parseRegion({
    id: "quartier-tegel-sued",
    slug: "tegel-sued",
    name: "Quartier Tegel-Sued",
    type: "quartier",
    parentRegionId: "bezirk-berlin-reinickendorf",
    officialBody: {
      id: "body-quartiersrat-tegel-sued",
      label: "Quartiersrat Tegel-Sued",
      bodyType: "quartiersrat",
    },
    federalState: "Berlin",
    country: "DE",
    publicVisibility: "public",
    createdAt: "2026-05-03T00:00:00.000Z",
    updatedAt: "2026-05-03T00:00:00.000Z",
  }),
] as const;

export const REGIONAL_ANLASSRAUM_FIXTURES: readonly RegionalAnlassraum[] = [
  parseRegionalAnlassraum({
    id: "regional-anlassraum-reinickendorf",
    regionId: "bezirk-berlin-reinickendorf",
    slug: "reinickendorf-beteiligungsraum",
    title: "Regionaler Anlassraum Reinickendorf",
    description:
      "Dauerhafte Arbeitsflaeche fuer lokale Signale, Dossiers, Runden und Mandatsstatus im Bezirk Reinickendorf.",
    status: "active",
    scope: [...REGIONAL_ANLASSRAUM_SCOPE_KEYS],
    guidelineProfile: "berlin_participation_guidelines",
    guardrails: {
      noAutoPublish: true,
      noAutoMandate: true,
      noAutomaticPoliticalAssignment: true,
      noScrapingByDefault: true,
    },
    links: {
      dossierIds: ["dossier-31", "dossier-47"],
      roundIds: ["round-energie-2026-01", "round-schulweg-2026-04"],
      mandateIds: ["vog-mandat-001", "vog-mandat-002"],
    },
    ownershipModel: "reference_only",
    publicReadModel: {
      headline: "Regionales Lagebild Reinickendorf",
      summary:
        "Signale, Themen, Akteure und Beteiligungsstaende werden transparent zusammengefuehrt, ohne Auto-Publish oder Auto-Mandat.",
      regionName: "Berlin Reinickendorf",
      statusLabel: "Aktiv",
      scopeBadges: [...REGIONAL_ANLASSRAUM_SCOPE_KEYS],
      participationPath:
        "Check -> Dossier -> Runde -> Beteiligung -> Ergebnis -> Mandat -> Status",
      lastUpdatedAt: "2026-05-03T00:00:00.000Z",
    },
    createdAt: "2026-05-03T00:00:00.000Z",
    updatedAt: "2026-05-03T00:00:00.000Z",
  }),
  parseRegionalAnlassraum({
    id: "regional-anlassraum-beispielstadt",
    regionId: "kommune-beispielstadt",
    slug: "beispielstadt-beteiligungsraum",
    title: "Regionaler Anlassraum Beispielstadt",
    description:
      "Kommunaler Beteiligungsraum fuer Hinweise aus Quartieren, Vereinen und Verwaltung mit anschlussfaehigen Dossier- und Rundenreferenzen.",
    status: "draft",
    scope: [...REGIONAL_ANLASSRAUM_SCOPE_KEYS],
    guidelineProfile: null,
    guardrails: {
      noAutoPublish: true,
      noAutoMandate: true,
      noAutomaticPoliticalAssignment: true,
      noScrapingByDefault: true,
    },
    links: {
      dossierIds: ["dossier-beispielstadt-001"],
      roundIds: ["round-beispielstadt-001"],
      mandateIds: [],
    },
    ownershipModel: "reference_only",
    publicReadModel: {
      headline: "Beteiligungsraum Beispielstadt",
      summary:
        "Der Raum dokumentiert regionale Aktivitaeten als referenzierte Arbeitskette und bleibt strikt review-first.",
      regionName: "Beispielstadt",
      statusLabel: "Entwurf",
      scopeBadges: [...REGIONAL_ANLASSRAUM_SCOPE_KEYS],
      participationPath:
        "Check -> Dossier -> Runde -> Beteiligung -> Ergebnis -> Mandat -> Status",
      lastUpdatedAt: "2026-05-03T00:00:00.000Z",
    },
    createdAt: "2026-05-03T00:00:00.000Z",
    updatedAt: "2026-05-03T00:00:00.000Z",
  }),
  parseRegionalAnlassraum({
    id: "regional-anlassraum-tegel-sued",
    regionId: "quartier-tegel-sued",
    slug: "tegel-sued-beteiligungsraum",
    title: "Regionaler Anlassraum Tegel-Sued",
    description:
      "Quartiersnaher Beteiligungsraum fuer niedrigschwellige Signale und anschliessende Dossier-/Rundenarbeit im Kiez.",
    status: "active",
    scope: [...REGIONAL_ANLASSRAUM_SCOPE_KEYS],
    guidelineProfile: "berlin_participation_guidelines",
    guardrails: {
      noAutoPublish: true,
      noAutoMandate: true,
      noAutomaticPoliticalAssignment: true,
      noScrapingByDefault: true,
    },
    links: {
      dossierIds: ["dossier-tegel-sued-001", "dossier-tegel-sued-002"],
      roundIds: ["round-tegel-sued-001"],
      mandateIds: ["vog-mandat-002"],
    },
    ownershipModel: "reference_only",
    publicReadModel: {
      headline: "Kiez-Beteiligung Tegel-Sued",
      summary:
        "Kiezsignale werden in dieselbe transparente Arbeitskette ueberfuehrt, ohne automatische Zuweisung oder Verfentlichung.",
      regionName: "Quartier Tegel-Sued",
      statusLabel: "Aktiv",
      scopeBadges: [...REGIONAL_ANLASSRAUM_SCOPE_KEYS],
      participationPath:
        "Check -> Dossier -> Runde -> Beteiligung -> Ergebnis -> Mandat -> Status",
      lastUpdatedAt: "2026-05-03T00:00:00.000Z",
    },
    createdAt: "2026-05-03T00:00:00.000Z",
    updatedAt: "2026-05-03T00:00:00.000Z",
  }),
  parseRegionalAnlassraum({
    id: "regional-anlassraum-magdeburg",
    regionId: "kommune-magdeburg",
    slug: "magdeburg-beteiligungsraum",
    title: "Regionaler Anlassraum Magdeburg",
    description:
      "Kommunaler Pilotraum fuer getrennte Signale, Dossier-Vorschlaege und Review-Queue ohne automatische Freigabe.",
    status: "draft",
    scope: [...REGIONAL_ANLASSRAUM_SCOPE_KEYS],
    guidelineProfile: null,
    guardrails: {
      noAutoPublish: true,
      noAutoMandate: true,
      noAutomaticPoliticalAssignment: true,
      noScrapingByDefault: true,
    },
    links: {
      dossierIds: ["dossier-magdeburg-001"],
      roundIds: [],
      mandateIds: [],
    },
    ownershipModel: "reference_only",
    publicReadModel: {
      headline: "Kommunaler Pilotraum Magdeburg",
      summary:
        "Getrennte Pilot-Fallkonstellation fuer Regionstrennung und reviewpflichtige Signalsichtung.",
      regionName: "Magdeburg",
      statusLabel: "Entwurf",
      scopeBadges: [...REGIONAL_ANLASSRAUM_SCOPE_KEYS],
      participationPath:
        "Check -> Dossier -> Runde -> Beteiligung -> Ergebnis -> Mandat -> Status",
      lastUpdatedAt: "2026-05-14T00:00:00.000Z",
    },
    createdAt: "2026-05-14T00:00:00.000Z",
    updatedAt: "2026-05-14T00:00:00.000Z",
  }),
] as const;

export const REGIONAL_ACTOR_FIXTURES: readonly RegionalActor[] = [
  parseRegionalActor({
    id: "actor-reinickendorf-klimaforum",
    regionId: "bezirk-berlin-reinickendorf",
    slug: "klimaforum-reinickendorf",
    name: "Klimaforum Reinickendorf",
    actorType: "initiative",
    verificationStatus: "verified",
    description: "Lokale Initiative fuer klima- und mobilitaetsbezogene Beteiligung im Bezirk.",
    publicVisibility: "public",
    tags: ["klima", "mobilitaet", "bezirk"],
    guardrails: {
      noAutomaticPoliticalAssignment: true,
      noAutomaticVoiceOpenGovMembership: true,
      verificationStatusRequired: true,
    },
    createdAt: "2026-05-10T00:00:00.000Z",
    updatedAt: "2026-05-10T00:00:00.000Z",
  }),
  parseRegionalActor({
    id: "actor-tegel-kieznetz",
    regionId: "quartier-tegel-sued",
    slug: "kieznetz-tegel-sued",
    name: "Kieznetz Tegel-Sued",
    actorType: "lose_gruppe",
    verificationStatus: "review_required",
    description: "Lose Nachbarschaftsgruppe fuer Hinweise aus dem Quartier.",
    publicVisibility: "public",
    tags: ["nachbarschaft", "kiez"],
    guardrails: {
      noAutomaticPoliticalAssignment: true,
      noAutomaticVoiceOpenGovMembership: true,
      verificationStatusRequired: true,
    },
    createdAt: "2026-05-10T00:00:00.000Z",
    updatedAt: "2026-05-10T00:00:00.000Z",
  }),
  parseRegionalActor({
    id: "actor-bezirksamt-reinickendorf",
    regionId: "bezirk-berlin-reinickendorf",
    slug: "bezirksamt-reinickendorf",
    name: "Bezirksamt Reinickendorf",
    actorType: "verwaltung",
    verificationStatus: "verified",
    description: "Verwaltungsakteur fuer regionale Rueckmeldungen und Beteiligungsstaende.",
    publicVisibility: "public",
    tags: ["verwaltung", "bezirk"],
    guardrails: {
      noAutomaticPoliticalAssignment: true,
      noAutomaticVoiceOpenGovMembership: true,
      verificationStatusRequired: true,
    },
    createdAt: "2026-05-10T00:00:00.000Z",
    updatedAt: "2026-05-10T00:00:00.000Z",
  }),
  parseRegionalActor({
    id: "actor-beispielstadt-verkehr",
    regionId: "kommune-beispielstadt",
    slug: "fachamt-verkehr-beispielstadt",
    name: "Fachamt Verkehr Beispielstadt",
    actorType: "verwaltung",
    verificationStatus: "verified",
    description: "Kommunaler Fachakteur fuer verkehrsbezogene Quellen und Rueckmeldungen.",
    publicVisibility: "public",
    tags: ["verwaltung", "verkehr", "kommune"],
    guardrails: {
      noAutomaticPoliticalAssignment: true,
      noAutomaticVoiceOpenGovMembership: true,
      verificationStatusRequired: true,
    },
    createdAt: "2026-05-10T00:00:00.000Z",
    updatedAt: "2026-05-10T00:00:00.000Z",
  }),
  parseRegionalActor({
    id: "actor-magdeburg-jugendamt",
    regionId: "kommune-magdeburg",
    slug: "jugendamt-magdeburg",
    name: "Jugendamt Magdeburg",
    actorType: "verwaltung",
    verificationStatus: "verified",
    description: "Kommunaler Verwaltungsakteur fuer Jugend- und Kulturthemen im Pilot-Scope.",
    publicVisibility: "public",
    tags: ["verwaltung", "jugend", "kommune"],
    guardrails: {
      noAutomaticPoliticalAssignment: true,
      noAutomaticVoiceOpenGovMembership: true,
      verificationStatusRequired: true,
    },
    createdAt: "2026-05-14T00:00:00.000Z",
    updatedAt: "2026-05-14T00:00:00.000Z",
  }),
] as const;

export const COMMUNITY_SIGNAL_FIXTURES: readonly CommunitySignal[] = [
  parseCommunitySignal({
    id: "signal-reinickendorf-schulweg-001",
    regionId: "bezirk-berlin-reinickendorf",
    title: "Gefaehrlicher Schulweg an der Ollenhauerstrasse",
    summary:
      "Mehrere Eltern melden unuebersichtliche Querungen und bitten um Pruefung mit Quellen und Ortswissen.",
    signalType: "hint",
    reviewStatus: "in_review",
    sourceActorId: "actor-reinickendorf-klimaforum",
    sourceUrls: ["https://example.org/schulweg-reinickendorf"],
    submitter: {
      mode: "lightweight_contact",
      displayName: "Elterninitiative Nord",
      contactChannel: "kontakt@elterninitiative-nord.example",
    },
    guardrails: {
      moderationRequired: true,
      noAutoPublish: true,
      noAutoMandate: true,
      noAutomaticDossierCreation: true,
    },
    createdAt: "2026-05-10T00:00:00.000Z",
    updatedAt: "2026-05-10T00:00:00.000Z",
  }),
  parseCommunitySignal({
    id: "signal-tegel-ortswissen-001",
    regionId: "quartier-tegel-sued",
    title: "Ortswissen zu fehlenden Sitzgelegenheiten am Kiezplatz",
    summary:
      "Anonyme Rueckmeldung mit lokalem Erfahrungswissen und Hinweisen auf stark genutzte Wegebeziehungen.",
    signalType: "local_knowledge",
    reviewStatus: "submitted",
    sourceActorId: null,
    sourceUrls: [],
    submitter: {
      mode: "anonymous",
      displayName: null,
      contactChannel: null,
    },
    guardrails: {
      moderationRequired: true,
      noAutoPublish: true,
      noAutoMandate: true,
      noAutomaticDossierCreation: true,
    },
    createdAt: "2026-05-10T00:00:00.000Z",
    updatedAt: "2026-05-10T00:00:00.000Z",
  }),
  parseCommunitySignal({
    id: "signal-beispielstadt-quellenvorschlag-001",
    regionId: "kommune-beispielstadt",
    title: "Quellenvorschlag zur Innenstadtlogistik",
    summary:
      "Bestehender Akteur reicht eine Studie und einen Themenvorschlag fuer die kommunale Einordnung ein.",
    signalType: "source",
    reviewStatus: "accepted",
    sourceActorId: "actor-beispielstadt-verkehr",
    sourceUrls: ["https://example.org/innenstadtlogistik-studie"],
    submitter: {
      mode: "registered_reference",
      displayName: "Fachamt Verkehr",
      contactChannel: "verkehr@beispielstadt.example",
    },
    guardrails: {
      moderationRequired: true,
      noAutoPublish: true,
      noAutoMandate: true,
      noAutomaticDossierCreation: true,
    },
    createdAt: "2026-05-10T00:00:00.000Z",
    updatedAt: "2026-05-10T00:00:00.000Z",
  }),
  parseCommunitySignal({
    id: "signal-magdeburg-jugend-001",
    regionId: "kommune-magdeburg",
    title: "Hinweis zu offenen Jugend- und Sportangeboten",
    summary:
      "Pilotischer Community-Hinweis fuer getrennte Kommunal-Tests. Keine automatische Dossier- oder Anlassraum-Erstellung.",
    signalType: "topic_proposal",
    reviewStatus: "submitted",
    sourceActorId: "actor-magdeburg-jugendamt",
    sourceUrls: [],
    submitter: {
      mode: "registered_reference",
      displayName: "Jugendamt Magdeburg",
      contactChannel: "jugendamt@magdeburg.example",
    },
    guardrails: {
      moderationRequired: true,
      noAutoPublish: true,
      noAutoMandate: true,
      noAutomaticDossierCreation: true,
    },
    createdAt: "2026-05-14T00:00:00.000Z",
    updatedAt: "2026-05-14T00:00:00.000Z",
  }),
] as const;

export const REGIONAL_ADMIN_COCKPIT_FIXTURES: readonly RegionalAdminCockpit[] = [
  parseRegionalAdminCockpit({
    id: "admin-cockpit-reinickendorf",
    regionId: "bezirk-berlin-reinickendorf",
    title: "Regionales Lagebild Reinickendorf",
    modules: {
      themenlage: {
        headline: "Themenlage",
        summary: "Zeigt aktive Hinweise, Cluster und priorisierte Themen ohne automatische Entscheidung.",
      },
      akteurskarte: {
        headline: "Akteurskarte",
        summary: "Stellt Vereine, Initiativen, lose Gruppen und Verwaltung referenziert nebeneinander dar.",
      },
      beteiligungsstatus: {
        headline: "Beteiligungsstatus",
        summary: "Dokumentiert laufende Rueckmeldungen, Pruefstaende und offene Beteiligungsschritte.",
      },
      offene_fragen: {
        headline: "Offene Fragen",
        summary: "Benennt unbeantwortete Punkte, die vor Dossier- oder Rundenfortschritt geklaert werden muessen.",
      },
      teilhabegaps: {
        headline: "Teilhabegaps",
        summary: "Markiert sichtbare Beteiligungsluecken ohne Buerger:innen- oder Vereins-Scoring.",
      },
      naechste_rueckmeldungen: {
        headline: "Naechste Rueckmeldungen",
        summary: "Haelt geplante Antworten und Rueckkopplungen fuer Verwaltung und Oeffentlichkeit transparent.",
      },
      mandatsstatus: {
        headline: "Mandatsstatus",
        summary: "Zeigt nur den nachvollziehbaren Status vorhandener Mandate, ohne automatische Ableitung.",
      },
    },
    guardrails: {
      noCitizenScoring: true,
      noAssociationScoring: true,
      noAutomatedEnforcement: true,
    },
    createdAt: "2026-05-10T00:00:00.000Z",
    updatedAt: "2026-05-10T00:00:00.000Z",
  }),
] as const;

const REGION_FIXTURE_MAP = new Map(REGION_FIXTURES.map((entry) => [entry.id, entry]));
const REGIONAL_ANLASSRAUM_FIXTURE_MAP = new Map(
  REGIONAL_ANLASSRAUM_FIXTURES.map((entry) => [entry.id, entry]),
);
const REGIONAL_ACTOR_FIXTURE_MAP = new Map(REGIONAL_ACTOR_FIXTURES.map((entry) => [entry.id, entry]));
const COMMUNITY_SIGNAL_FIXTURE_MAP = new Map(
  COMMUNITY_SIGNAL_FIXTURES.map((entry) => [entry.id, entry]),
);
const REGIONAL_ADMIN_COCKPIT_FIXTURE_MAP = new Map(
  REGIONAL_ADMIN_COCKPIT_FIXTURES.map((entry) => [entry.id, entry]),
);

export function listRegions(): readonly Region[] {
  return REGION_FIXTURES;
}

export function getRegionById(id: string): Region | null {
  return REGION_FIXTURE_MAP.get(id) ?? null;
}

export function listRegionalAnlassraeume(): readonly RegionalAnlassraum[] {
  return REGIONAL_ANLASSRAUM_FIXTURES;
}

export function getRegionalAnlassraumById(id: string): RegionalAnlassraum | null {
  return REGIONAL_ANLASSRAUM_FIXTURE_MAP.get(id) ?? null;
}

export function listRegionalActors(): readonly RegionalActor[] {
  return REGIONAL_ACTOR_FIXTURES;
}

export function getRegionalActorById(id: string): RegionalActor | null {
  return REGIONAL_ACTOR_FIXTURE_MAP.get(id) ?? null;
}

export function listCommunitySignals(): readonly CommunitySignal[] {
  return COMMUNITY_SIGNAL_FIXTURES;
}

export function getCommunitySignalById(id: string): CommunitySignal | null {
  return COMMUNITY_SIGNAL_FIXTURE_MAP.get(id) ?? null;
}

export function listRegionalAdminCockpits(): readonly RegionalAdminCockpit[] {
  return REGIONAL_ADMIN_COCKPIT_FIXTURES;
}

export function getRegionalAdminCockpitById(id: string): RegionalAdminCockpit | null {
  return REGIONAL_ADMIN_COCKPIT_FIXTURE_MAP.get(id) ?? null;
}
