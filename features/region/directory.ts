import fs from "node:fs";
import path from "node:path";
import * as XLSX from "xlsx";
import {
  normalizeAdministrativeUnitType,
  parseOfficialDirectoryEntry,
  type AdministrativeUnitType,
  type OfficialDirectoryEntry,
  type Region,
  type RegionOfficialBody,
  type RegionType,
  type RegionalActor,
} from "./contracts";

export const OFFICIAL_DIRECTORY_SOURCE_FILE =
  "Anschriften_der_Gemeinde_und_Stadtverwaltungen_Stand_31012023_final.xlsx";
export const OFFICIAL_DIRECTORY_SHEET = "Anschriften_31_01_2023";
export const OFFICIAL_DIRECTORY_SOURCE_AS_OF = "2023-01-31";

type DirectoryWorkbookRow = {
  landCode: string;
  landName: string;
  rawAdministrativeUnitLabel: string;
  ars: string | null;
  ags: string | null;
  municipalityName: string;
  administrativeSeat: string | null;
  street: string | null;
  postalCode: string | null;
  locality: string | null;
  areaKm2: number | null;
  population: number | null;
  administrativeUnitType: AdministrativeUnitType;
};

let cachedRows: DirectoryWorkbookRow[] | null = null;
let cachedDirectorySummary:
  | Array<{ administrativeUnitType: AdministrativeUnitType; count: number }>
  | null = null;
let cachedOfficialRegions: Region[] | null = null;
let cachedOfficialActors: RegionalActor[] | null = null;

function trimOrNull(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = String(value ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[ä]/g, "ae")
    .replace(/[ö]/g, "oe")
    .replace(/[ü]/g, "ue")
    .replace(/[ß]/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function resolveDirectoryFilePath(): string {
  const candidates = [
    path.join(process.cwd(), "public", "Listen", OFFICIAL_DIRECTORY_SOURCE_FILE),
    path.join(process.cwd(), "apps", "web", "public", "Listen", OFFICIAL_DIRECTORY_SOURCE_FILE),
    path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../apps/web/public/Listen", OFFICIAL_DIRECTORY_SOURCE_FILE),
  ];

  for (const candidate of candidates) {
    const normalized = decodeURIComponent(candidate);
    if (fs.existsSync(normalized)) return normalized;
  }

  throw new Error(`official_directory_not_found:${OFFICIAL_DIRECTORY_SOURCE_FILE}`);
}

function readWorkbookRows(): DirectoryWorkbookRow[] {
  if (cachedRows) return cachedRows;

  const workbook = XLSX.readFile(resolveDirectoryFilePath(), { cellDates: false });
  const sheet = workbook.Sheets[OFFICIAL_DIRECTORY_SHEET];
  if (!sheet) {
    throw new Error(`official_directory_sheet_missing:${OFFICIAL_DIRECTORY_SHEET}`);
  }

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: "",
  }) as Array<Array<string | number>>;

  const parsed: DirectoryWorkbookRow[] = [];
  for (const row of rows.slice(5)) {
    const landCode = String(row[0] ?? "").trim();
    const landName = String(row[1] ?? "").trim();
    const rawAdministrativeUnitLabel = String(row[4] ?? "").trim();
    const municipalityName = String(row[7] ?? "").trim();

    if (!landCode || !landName || !rawAdministrativeUnitLabel || !municipalityName) continue;

    parsed.push({
      landCode,
      landName,
      rawAdministrativeUnitLabel,
      ars: trimOrNull(row[5]),
      ags: trimOrNull(row[6]),
      municipalityName,
      administrativeSeat: trimOrNull(row[8]),
      street: trimOrNull(row[9]),
      postalCode: trimOrNull(row[10]),
      locality: trimOrNull(row[11]),
      areaKm2: toNumberOrNull(row[12]),
      population: toNumberOrNull(row[13]),
      administrativeUnitType: normalizeAdministrativeUnitType(rawAdministrativeUnitLabel),
    });
  }

  cachedRows = parsed;
  return parsed;
}

function deriveBroadRegionType(administrativeUnitType: AdministrativeUnitType): RegionType {
  if (administrativeUnitType === "land") return "land";
  if (administrativeUnitType === "landkreis" || administrativeUnitType === "kreis") return "landkreis";
  if (
    administrativeUnitType === "amt" ||
    administrativeUnitType === "verbandsgemeinde" ||
    administrativeUnitType === "samtgemeinde" ||
    administrativeUnitType === "verwaltungsgemeinschaft" ||
    administrativeUnitType === "verwaltungsverband" ||
    administrativeUnitType === "kirchspielslandgemeinde" ||
    administrativeUnitType === "erfuellende_gemeinde" ||
    administrativeUnitType === "regionalverband"
  ) {
    return "region";
  }
  return "kommune";
}

function deriveOfficialBodyType(administrativeUnitType: AdministrativeUnitType): RegionOfficialBody["bodyType"] {
  if (administrativeUnitType === "land") return "landesverwaltung";
  if (administrativeUnitType === "landkreis" || administrativeUnitType === "kreis") return "kreisverwaltung";
  if (administrativeUnitType === "amt") return "amtverwaltung";
  if (administrativeUnitType === "verbandsgemeinde") return "verbandsgemeindeverwaltung";
  if (administrativeUnitType === "samtgemeinde") return "samtgemeindeverwaltung";
  if (administrativeUnitType === "verwaltungsverband") return "verwaltungsverband";
  if (administrativeUnitType === "verwaltungsgemeinschaft") return "verwaltungsgemeinschaft";
  if (administrativeUnitType === "regionalverband") return "regionalverband";
  if (administrativeUnitType === "kreisangehoerige_gemeinde") return "gemeindeverwaltung";
  return "stadtverwaltung";
}

function buildOfficialDirectoryEntry(row: DirectoryWorkbookRow): OfficialDirectoryEntry {
  return parseOfficialDirectoryEntry({
    ars: row.ars,
    ags: row.ags,
    municipalityName: row.municipalityName,
    administrativeSeat: row.administrativeSeat,
    street: row.street,
    postalCode: row.postalCode,
    locality: row.locality,
    areaKm2: row.areaKm2,
    population: row.population === null ? null : Math.round(row.population),
    administrativeUnitType: row.administrativeUnitType,
    rawAdministrativeUnitLabel: row.rawAdministrativeUnitLabel,
    sourceFile: OFFICIAL_DIRECTORY_SOURCE_FILE,
    sourceAsOf: OFFICIAL_DIRECTORY_SOURCE_AS_OF,
  });
}

function deriveLandRegionId(landCode: string): string {
  return `region-land-${landCode}`;
}

function deriveOfficialRegionId(entry: OfficialDirectoryEntry): string {
  return `region-official-${entry.ags ?? entry.ars ?? slugify(entry.municipalityName)}`;
}

function deriveParentRegionId(entry: OfficialDirectoryEntry): string | null {
  if (entry.administrativeUnitType === "land") return null;
  if (
    entry.administrativeUnitType === "landkreis" ||
    entry.administrativeUnitType === "kreis" ||
    entry.administrativeUnitType === "kreisfreie_stadt" ||
    entry.administrativeUnitType === "stadtkreis" ||
    entry.administrativeUnitType === "stadtstaat" ||
    entry.administrativeUnitType === "regionalverband"
  ) {
    return deriveLandRegionId((entry.ars ?? "").slice(0, 2));
  }
  if (entry.ars && entry.ars.length >= 5) {
    return `region-official-${entry.ars.slice(0, 5)}`;
  }
  return deriveLandRegionId((entry.ars ?? "").slice(0, 2));
}

export function listOfficialMunicipalDirectoryEntries(): OfficialDirectoryEntry[] {
  return readWorkbookRows().map(buildOfficialDirectoryEntry);
}

export function summarizeOfficialAdministrativeDirectory(): Array<{
  administrativeUnitType: AdministrativeUnitType;
  count: number;
}> {
  if (cachedDirectorySummary) return cachedDirectorySummary;
  const counters = new Map<AdministrativeUnitType, number>();
  for (const row of readWorkbookRows()) {
    counters.set(row.administrativeUnitType, (counters.get(row.administrativeUnitType) ?? 0) + 1);
  }
  cachedDirectorySummary = Array.from(counters.entries())
    .map(([administrativeUnitType, count]) => ({ administrativeUnitType, count }))
    .sort((left, right) => right.count - left.count);
  return cachedDirectorySummary;
}

export function buildOfficialRegionsFromDirectory(): Region[] {
  if (cachedOfficialRegions) return cachedOfficialRegions;
  const entries = listOfficialMunicipalDirectoryEntries();
  const rows = readWorkbookRows();
  const landCodeToName = new Map<string, string>();
  for (const row of rows) {
    if (!landCodeToName.has(row.landCode) && row.landName) {
      landCodeToName.set(row.landCode, row.landName);
    }
  }
  const regions = new Map<string, Region>();

  for (const entry of entries) {
    const landCode = (entry.ars ?? "").slice(0, 2);
    const landName = landCodeToName.get(landCode) ?? entry.locality ?? "Bundesland";
    const landRegionId = deriveLandRegionId(landCode);
    if (!regions.has(landRegionId)) {
      regions.set(landRegionId, {
        id: landRegionId,
        slug: `${slugify(entry.municipalityName.split(",")[0] || entry.municipalityName)}-${landCode}`,
        name: landName,
        type: "land",
        administrativeUnitType: "land",
        parentRegionId: null,
        officialBody: {
          id: `body-${landRegionId}`,
          label: landName,
          bodyType: "landesverwaltung",
        },
        officialDirectoryEntry: null,
        federalState: landName,
        country: "DE",
        publicVisibility: "public",
      });
    }

    const regionId = deriveOfficialRegionId(entry);
    if (regions.has(regionId)) continue;

    regions.set(regionId, {
      id: regionId,
      slug: slugify(entry.municipalityName),
      name: entry.municipalityName,
      type: deriveBroadRegionType(entry.administrativeUnitType ?? "sonstige"),
      administrativeUnitType: entry.administrativeUnitType,
      parentRegionId: deriveParentRegionId(entry),
      officialBody: {
        id: `body-${regionId}`,
        label: entry.administrativeSeat ?? entry.municipalityName,
        bodyType: deriveOfficialBodyType(entry.administrativeUnitType ?? "sonstige"),
      },
      officialDirectoryEntry: entry,
      federalState: landName,
      country: "DE",
      publicVisibility: "public",
    });
  }

  cachedOfficialRegions = Array.from(regions.values());
  return cachedOfficialRegions;
}

export function buildOfficialRegionalActorsFromDirectory(): RegionalActor[] {
  if (cachedOfficialActors) return cachedOfficialActors;
  cachedOfficialActors = listOfficialMunicipalDirectoryEntries().map((entry) => {
    const regionId = deriveOfficialRegionId(entry);
    return {
      id: `actor-official-${entry.ags ?? entry.ars ?? slugify(entry.municipalityName)}`,
      regionId,
      slug: slugify(entry.administrativeSeat ?? entry.municipalityName),
      name: entry.administrativeSeat ?? entry.municipalityName,
      actorType: "verwaltung",
      verificationStatus: "verified",
      description: `${entry.rawAdministrativeUnitLabel ?? "Verwaltung"} in ${entry.municipalityName}`,
      sourceKind: "official_directory",
      publicVisibility: "public",
      administrativeUnitType: entry.administrativeUnitType,
      address: {
        street: entry.street,
        postalCode: entry.postalCode,
        locality: entry.locality,
      },
      officialDirectoryEntry: entry,
      tags: [
        "verwaltung",
        entry.administrativeUnitType ?? "sonstige",
        slugify(entry.municipalityName),
      ],
      guardrails: {
        noAutomaticPoliticalAssignment: true,
        noAutomaticVoiceOpenGovMembership: true,
        verificationStatusRequired: true,
      },
      createdAt: `${OFFICIAL_DIRECTORY_SOURCE_AS_OF}T00:00:00.000Z`,
      updatedAt: `${OFFICIAL_DIRECTORY_SOURCE_AS_OF}T00:00:00.000Z`,
    } satisfies RegionalActor;
  });
  return cachedOfficialActors;
}
