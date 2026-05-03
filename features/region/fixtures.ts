import {
  parseRegion,
  parseRegionalAnlassraum,
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
] as const;

const REGION_FIXTURE_MAP = new Map(REGION_FIXTURES.map((entry) => [entry.id, entry]));
const REGIONAL_ANLASSRAUM_FIXTURE_MAP = new Map(
  REGIONAL_ANLASSRAUM_FIXTURES.map((entry) => [entry.id, entry]),
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
