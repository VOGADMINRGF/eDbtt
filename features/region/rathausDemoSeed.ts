import { publicationVisibilityLabel } from "./publicationRiskLadder";

export const RATHAUS_DEMO_REGION_ID = "bezirk-berlin-reinickendorf";
export const RATHAUS_DEMO_REGION_SLUG = "berlin-reinickendorf";
export const RATHAUS_DEMO_PROCEDURE_DEADLINE_ISO = "2025-05-04";
export const RATHAUS_DEMO_CANONICAL_SOURCE_URL =
  "https://www.berlin.de/ba-reinickendorf/service/buergerbeteiligung/investitions-haushaltsplanung/";
const RATHAUS_DEMO_PRESS_RELEASE_URL =
  "https://www.berlin.de/ba-reinickendorf/aktuelles/pressemitteilungen/2025/pressemitteilung.1549089.php";

const RATHAUS_DEMO_FULL_ACCESS_ROLES = new Set(["admin", "superadmin", "staff"]);
const RATHAUS_DEMO_SCOPE_TOKENS = new Set([
  RATHAUS_DEMO_REGION_ID,
  RATHAUS_DEMO_REGION_SLUG,
  "reinickendorf",
]);

export type RathausDemoSourceMatch = {
  matchedUrl: string;
  canonicalUrl: string;
  isOfficialRegionalSource: true;
  sourceLabel: string;
  sourceHostLabel: string;
};

export type RathausDemoPreviewCluster = {
  id: string;
  label: string;
  summary: string;
  anlassraumIds: string[];
};

export type RathausDemoDossierSeed = {
  id: string;
  title: string;
  summary: string;
  dossierType: "procedure" | "focus";
  status: "closed" | "reference";
  reviewStatus: "needs_review";
  visibilityState: "internal_review";
  visibilityLabel: string;
  anlassraumIds: string[];
  href: string;
};

export type RathausDemoAnlassraumSeed = {
  id: string;
  title: string;
  summary: string;
  clusterId: string;
  dossierIds: string[];
  reviewStatus: "needs_review";
  visibilityState: "internal_review";
  visibilityLabel: string;
  sourceStatement: string;
  understandingQuestion: string;
  decisionOption: string;
  href: string;
  aliasHref: string;
};

export type RathausDemoClaimKind =
  | "source_statement"
  | "understanding_question"
  | "decision_option";

export type RathausDemoClaimSeed = {
  id: string;
  anlassraumId: string;
  dossierIds: string[];
  title: string;
  text: string;
  kind: RathausDemoClaimKind;
  reviewStatus: "needs_review";
  visibilityState: "internal_review";
  visibilityLabel: string;
};

export type RathausDemoReviewSeed = {
  id: string;
  kind: "dossier" | "anlassraum";
  title: string;
  summary: string;
  href: string;
  regionId: string;
  regionName: string;
  dossierId: string | null;
  visibilityState: "internal_review";
  visibilityLabel: string;
  reviewStatus: "needs_review";
};

export type RathausDemoAccess = {
  canPrepareRegionalProject: boolean;
  accessMode: "public_preview" | "region_admin";
  warning: string | null;
  accessLabel: string;
};

export type RathausDemoGraphSeedPreview = {
  source: RathausDemoSourceMatch;
  regionId: string;
  regionSlug: string;
  regionName: string;
  procedureTitle: string;
  procedureStatus: "closed";
  archiveStatus: "archived";
  deadlineIso: string;
  deadlineLabel: string;
  deadlinePassed: true;
  access: RathausDemoAccess;
  publicPreviewClusters: RathausDemoPreviewCluster[];
  dossiers: RathausDemoDossierSeed[];
  anlassraeume: RathausDemoAnlassraumSeed[];
  claims: RathausDemoClaimSeed[];
  reviewSeeds: RathausDemoReviewSeed[];
  counts: {
    publicClusters: number;
    dossiers: number;
    anlassraeume: number;
    claims: number;
  };
  guardrails: {
    noAutoPublish: true;
    noAutoOfficialApproval: true;
    noAutoDossierFinalization: true;
    noAutoAnlassraumFinalization: true;
    noSilentGraphMerge: true;
  };
};

function normalizeUrlCandidate(value: string): string | null {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^www\./i.test(trimmed)) return `https://${trimmed}`;
  return null;
}

function normalizeRole(role: string): string {
  return String(role ?? "").trim().toLowerCase();
}

function roleHasReinickendorfScope(role: string): boolean {
  const normalized = normalizeRole(role);
  for (const prefix of ["region_staff:", "region_access:", "region_dashboard:"]) {
    if (!normalized.startsWith(prefix)) continue;
    const scope = normalized.slice(prefix.length).trim();
    return RATHAUS_DEMO_SCOPE_TOKENS.has(scope);
  }
  return false;
}

export function canAccessRathausDemoRegionalSeed(roles: string[]): boolean {
  return roles.some((role) => {
    const normalized = normalizeRole(role);
    return RATHAUS_DEMO_FULL_ACCESS_ROLES.has(normalized) || roleHasReinickendorfScope(normalized);
  });
}

export function matchRathausDemoOfficialSource(urls: string[]): RathausDemoSourceMatch | null {
  for (const candidate of urls) {
    const normalized = normalizeUrlCandidate(candidate);
    if (!normalized) continue;
    try {
      const parsed = new URL(normalized);
      const host = parsed.hostname.toLowerCase();
      const path = parsed.pathname.toLowerCase();
      if (!host.endsWith("berlin.de")) continue;
      if (
        path.includes("/ba-reinickendorf/service/buergerbeteiligung/investitions-haushaltsplanung") ||
        path.endsWith("/pressemitteilung.1549089.php")
      ) {
        return {
          matchedUrl: normalized,
          canonicalUrl: RATHAUS_DEMO_CANONICAL_SOURCE_URL,
          isOfficialRegionalSource: true,
          sourceLabel:
            "Bürgerbeteiligung zum Investitionsprogramm 2025-2029 und zum Haushaltsplan 2026/2027",
          sourceHostLabel: "Berlin.de · Bezirksamt Reinickendorf",
        };
      }
    } catch {
      continue;
    }
  }
  return null;
}

function buildCluster(id: string, label: string, summary: string, anlassraumIds: string[]) {
  return { id, label, summary, anlassraumIds };
}

const CLUSTERS: readonly RathausDemoPreviewCluster[] = [
  buildCluster(
    "rathaus-und-zugang",
    "Rathaus, Haushalt und Zugang",
    "Rathaus-Sanierung, Bürgerort, Barrierefreiheit und verständliche Haushaltslogik bleiben als sichere Themenvorschau sichtbar.",
    [
      "rathaus-demo-anlassraum-01",
      "rathaus-demo-anlassraum-02",
      "rathaus-demo-anlassraum-03",
      "rathaus-demo-anlassraum-04",
      "rathaus-demo-anlassraum-05",
    ],
  ),
  buildCluster(
    "kultur-sport-jugendorte",
    "Kultur-, Sport- und Jugendorte",
    "Fontane-Haus, ATRIUM, Bibliothek, Sportanlage und Freizeitorte erscheinen als review-first Themenbündel ohne automatische Freigabe.",
    [
      "rathaus-demo-anlassraum-06",
      "rathaus-demo-anlassraum-07",
      "rathaus-demo-anlassraum-08",
      "rathaus-demo-anlassraum-09",
      "rathaus-demo-anlassraum-10",
      "rathaus-demo-anlassraum-11",
      "rathaus-demo-anlassraum-12",
    ],
  ),
  buildCluster(
    "verkehr-schule-priorisierung",
    "Verkehr, Schulbau und Priorisierung",
    "Straßenraum, Schulbauoffensive und Investitionspriorisierung werden öffentlich nur als begrenzte, sichere Vorschau gezeigt.",
    [
      "rathaus-demo-anlassraum-13",
      "rathaus-demo-anlassraum-14",
      "rathaus-demo-anlassraum-15",
      "rathaus-demo-anlassraum-16",
    ],
  ),
] as const;

const DOSSIERS: readonly RathausDemoDossierSeed[] = [
  {
    id: "dossier-draft-rathaus-reinickendorf-procedure-2025",
    title: "Bürgerbeteiligung Investitionsprogramm 2025-2029 / Haushalt 2026-2027 Reinickendorf",
    summary:
      "Abgeschlossenes Verfahrensdossier zur öffentlichen Beteiligung mit Frist 04.05.2025. Bleibt reviewpflichtiger Seed und wird nicht automatisch finalisiert.",
    dossierType: "procedure",
    status: "closed",
    reviewStatus: "needs_review",
    visibilityState: "internal_review",
    visibilityLabel: publicationVisibilityLabel("internal_review"),
    anlassraumIds: CLUSTERS.flatMap((cluster) => cluster.anlassraumIds),
    href: "/dossier/dossier-draft-rathaus-reinickendorf-procedure-2025/studio",
  },
  {
    id: "dossier-draft-rathaus-reinickendorf-fachdossier",
    title: "Rathaus Reinickendorf",
    summary:
      "Dauerhaftes Fachdossier für Rathaus, Zugang und bürgernahe Nutzung. Ebenfalls nur als reviewpflichtiger Arbeitsstand vorbereitet.",
    dossierType: "focus",
    status: "reference",
    reviewStatus: "needs_review",
    visibilityState: "internal_review",
    visibilityLabel: publicationVisibilityLabel("internal_review"),
    anlassraumIds: [
      "rathaus-demo-anlassraum-01",
      "rathaus-demo-anlassraum-02",
      "rathaus-demo-anlassraum-03",
      "rathaus-demo-anlassraum-04",
      "rathaus-demo-anlassraum-05",
    ],
    href: "/dossier/dossier-draft-rathaus-reinickendorf-fachdossier/studio",
  },
] as const;

const INTERNAL_REVIEW_LABEL = publicationVisibilityLabel("internal_review");

function roomHref(id: string) {
  return `/runden?view=active&anlassraumId=${encodeURIComponent(id)}`;
}

function roomAliasHref(id: string) {
  return `/anlassraum?anlassraumId=${encodeURIComponent(id)}`;
}

function buildAnlassraumSeed(
  id: string,
  title: string,
  summary: string,
  clusterId: string,
  dossierIds: string[],
  sourceStatement: string,
  understandingQuestion: string,
  decisionOption: string,
): RathausDemoAnlassraumSeed {
  return {
    id,
    title,
    summary,
    clusterId,
    dossierIds,
    reviewStatus: "needs_review",
    visibilityState: "internal_review",
    visibilityLabel: INTERNAL_REVIEW_LABEL,
    sourceStatement,
    understandingQuestion,
    decisionOption,
    href: roomHref(id),
    aliasHref: roomAliasHref(id),
  };
}

const ANLASSRAEUME: readonly RathausDemoAnlassraumSeed[] = [
  buildAnlassraumSeed(
    "rathaus-demo-anlassraum-01",
    "Rathaus: Sanierung der Medien ab 2028",
    "Reviewpflichtiger Seed zur verschobenen Mediensanierung im Rathaus Reinickendorf.",
    "rathaus-und-zugang",
    DOSSIERS.map((dossier) => dossier.id),
    "Die offizielle Investitionsplanung nennt für das Rathaus Reinickendorf eine Sanierung der Medien mit verschobenem Baubeginn ab 2028.",
    "Welche Medientechnik ist gemeint und welche Nutzungseinschränkungen entstehen bis zum Start?",
    "Soll die Mediensanierung im Rathaus im nächsten Review-Schritt als prioritäre Maßnahme ausgewiesen werden?",
  ),
  buildAnlassraumSeed(
    "rathaus-demo-anlassraum-02",
    "Rathaus als Bürgerort",
    "Wie das Rathaus als zugänglicher Bürgerort und nicht nur als Verwaltungsgebäude gelesen werden soll.",
    "rathaus-und-zugang",
    DOSSIERS.map((dossier) => dossier.id),
    "Die offizielle Beteiligungsquelle macht das Rathaus als konkreten Investitionsort sichtbar und öffnet damit auch Fragen nach seiner Rolle als Bürgerort.",
    "Wie soll das Rathaus für Besucherinnen und Besucher besser erklärt und genutzt werden?",
    "Soll der Review-Pfad das Rathaus ausdrücklich als öffentlichen Bürgerort rahmen?",
  ),
  buildAnlassraumSeed(
    "rathaus-demo-anlassraum-03",
    "Haushalt verständlich machen",
    "Seed für verständliche Übersetzung von Doppelhaushalt, Planjahren und Prioritäten.",
    "rathaus-und-zugang",
    DOSSIERS.map((dossier) => dossier.id),
    "Die Beteiligungsseite verknüpft Investitionsprogramm 2025-2029 mit dem Haushaltsplan 2026/2027 und erzeugt damit einen erklärungsbedürftigen öffentlichen Kontext.",
    "Welche Teile der Haushalts- und Investitionsplanung sind für Bürgerinnen und Bürger besonders schwer verständlich?",
    "Soll zuerst ein erklärender Haushalts- und Prioritätenpfad vorbereitet werden, bevor Einzelprojekte vertieft werden?",
  ),
  buildAnlassraumSeed(
    "rathaus-demo-anlassraum-04",
    "Barrierefreiheit und Zugang im Rathaus",
    "Anlassraum für Zugang, Aufzug, Erreichbarkeit und inklusive Nutzung des Rathauses.",
    "rathaus-und-zugang",
    DOSSIERS.map((dossier) => dossier.id),
    "Die Investitionsunterlagen benennen im Rathaus-Kontext auch Zugangs- und Aufzugsthemen, die als Barrierefreiheitsfrage reviewpflichtig bleiben.",
    "Welche Zugangsbarrieren bestehen aktuell im Rathaus und für welche Gruppen sind sie besonders relevant?",
    "Soll Barrierefreiheit im Rathaus als eigenständige Priorität hervorgehoben werden?",
  ),
  buildAnlassraumSeed(
    "rathaus-demo-anlassraum-05",
    "Prioritätenvergleich Rathaus, Schulen, Kultur, Sport, Straßen",
    "Queranlassraum für sichtbare Prioritätenkonflikte zwischen Gebäuden, Schulen, Freizeitorten und Straßenraum.",
    "rathaus-und-zugang",
    DOSSIERS.map((dossier) => dossier.id),
    "Die Quelle bündelt sehr unterschiedliche Investitionsorte, sodass ein transparenter Prioritätenvergleich zwischen Rathaus, Schulen, Kultur, Sport und Straßenraum nötig wird.",
    "Nach welchen Kriterien sollen Bürgerinnen und Bürger diese sehr unterschiedlichen Investitionsorte vergleichen können?",
    "Soll der Review-Pfad einen expliziten Prioritätenvergleich als zentrales Entscheidungsformat anlegen?",
  ),
  buildAnlassraumSeed(
    "rathaus-demo-anlassraum-06",
    "Fontane-Haus Innensanierung",
    "Reviewpflichtiger Kultur-Ort aus der Investitionsplanung.",
    "kultur-sport-jugendorte",
    [DOSSIERS[0].id],
    "Die Investitionsplanung nennt die Innensanierung des Fontane-Hauses als eigenes Projekt im Reinickendorfer Beteiligungskontext.",
    "Welche Nutzung des Fontane-Hauses ist betroffen und wie wird die Innensanierung öffentlich erklärt?",
    "Soll die Innensanierung des Fontane-Hauses als kulturelle Priorität separat hervorgehoben werden?",
  ),
  buildAnlassraumSeed(
    "rathaus-demo-anlassraum-07",
    "ATRIUM Wasser, Abwasser, Elektrik, Dachflächen",
    "Technisch erklärungsbedürftiger Seed für das ATRIUM.",
    "kultur-sport-jugendorte",
    [DOSSIERS[0].id],
    "Für das ATRIUM nennt die offizielle Unterlage Wasser, Abwasser, Elektrik und Dachflächen als Sanierungsumfang.",
    "Welche technischen Probleme im ATRIUM sind für die Öffentlichkeit verständlich zu machen?",
    "Soll das ATRIUM als komplexes Technik- und Nutzungsprojekt gesondert priorisiert werden?",
  ),
  buildAnlassraumSeed(
    "rathaus-demo-anlassraum-08",
    "Humboldt-Bibliothek Sanierung",
    "Bibliotheksbezogener Seed mit Fokus auf öffentliche Zugänglichkeit.",
    "kultur-sport-jugendorte",
    [DOSSIERS[0].id],
    "Die Investitionsplanung führt die Sanierung der Humboldt-Bibliothek als eigenen öffentlichen Investitionsfall.",
    "Welche Auswirkungen hätte die Sanierung der Humboldt-Bibliothek auf Zugang, Nutzung und Aufenthaltsqualität?",
    "Soll die Bibliothekssanierung im Review als prioritäre Bildungs- und Kulturmaßnahme markiert werden?",
  ),
  buildAnlassraumSeed(
    "rathaus-demo-anlassraum-09",
    "Sportanlage Goeschenstraße",
    "Sportbezogener Seed aus der Reinickendorfer Investitionsplanung.",
    "kultur-sport-jugendorte",
    [DOSSIERS[0].id],
    "Die offizielle Beteiligungsquelle enthält die Sportanlage Goeschenstraße als investiven Ort im Bezirk.",
    "Welche Sportnutzungen und welche Nutzergruppen betrifft die Maßnahme an der Sportanlage Goeschenstraße?",
    "Soll die Sportanlage Goeschenstraße im nächsten Review-Schritt als gesonderte Sportpriorität vorbereitet werden?",
  ),
  buildAnlassraumSeed(
    "rathaus-demo-anlassraum-10",
    "Seniorenfreizeitstätte Adelheidallee",
    "Seed für altersgerechte Freizeit- und Begegnungsorte.",
    "kultur-sport-jugendorte",
    [DOSSIERS[0].id],
    "Die Investitionsplanung macht die Seniorenfreizeitstätte Adelheidallee als konkreten Freizeitort sichtbar.",
    "Welche Anforderungen älterer Menschen sollen im Beteiligungs- und Review-Pfad besonders verständlich gemacht werden?",
    "Soll die Seniorenfreizeitstätte Adelheidallee als eigenständiger sozialer Schwerpunkt geführt werden?",
  ),
  buildAnlassraumSeed(
    "rathaus-demo-anlassraum-11",
    "Kurt-Schumacher-Quartier Jugendfreizeitstätte",
    "Jugendbezogener Investitionsfall im neuen Quartier.",
    "kultur-sport-jugendorte",
    [DOSSIERS[0].id],
    "Die Unterlagen benennen im Kurt-Schumacher-Quartier eine Jugendfreizeitstätte als konkreten Investitionsort.",
    "Welche Bedürfnisse von Jugendlichen im Quartier sollen im Review-Pfad besonders berücksichtigt werden?",
    "Soll die Jugendfreizeitstätte im Kurt-Schumacher-Quartier als prioritäre Zukunftsinvestition markiert werden?",
  ),
  buildAnlassraumSeed(
    "rathaus-demo-anlassraum-12",
    "Jugendfreizeitstätte Fuchsbau",
    "Weiterer Jugendort mit eigenem Reviewbedarf.",
    "kultur-sport-jugendorte",
    [DOSSIERS[0].id],
    "Auch die Jugendfreizeitstätte Fuchsbau taucht im Beteiligungskontext als konkreter Investitionsort auf.",
    "Welche Unterschiede gibt es zwischen Fuchsbau und anderen Jugendorten, die für die Öffentlichkeit erklärt werden sollten?",
    "Soll der Fuchsbau als eigener Entscheidungs- und Priorisierungspunkt im Seed auftauchen?",
  ),
  buildAnlassraumSeed(
    "rathaus-demo-anlassraum-13",
    "Ollenhauerstraße / Oranienburger Straße",
    "Straßenraum- und Infrastrukturthema im Reinickendorfer Seed.",
    "verkehr-schule-priorisierung",
    [DOSSIERS[0].id],
    "Die offizielle Beteiligungsquelle verweist mit Ollenhauerstraße / Oranienburger Straße auch auf einen konkreten Straßen- und Verkehrsraum.",
    "Welche verkehrlichen oder baulichen Probleme sollen an diesem Straßenraum zuerst verständlich gemacht werden?",
    "Soll der Straßenraum Ollenhauerstraße / Oranienburger Straße im Review als eigene Infrastrukturpriorität geführt werden?",
  ),
  buildAnlassraumSeed(
    "rathaus-demo-anlassraum-14",
    "Schulbauoffensive Reinickendorf",
    "Queranlassraum für Schulbau und langfristige Bildungsinvestitionen.",
    "verkehr-schule-priorisierung",
    [DOSSIERS[0].id],
    "Mehrere Positionen der Investitionsplanung lassen sich als Teil einer größeren Schulbauoffensive in Reinickendorf lesen.",
    "Welche Schulstandorte und Bauphasen sollten in einem verständlichen Überblick zuerst gebündelt werden?",
    "Soll die Schulbauoffensive als übergreifender Bildungsanlassraum priorisiert werden?",
  ),
  buildAnlassraumSeed(
    "rathaus-demo-anlassraum-15",
    "Pauschale Investitionsmittel priorisieren",
    "Seed für die transparente Priorisierung pauschaler Mittel.",
    "verkehr-schule-priorisierung",
    [DOSSIERS[0].id],
    "Die Beteiligungsunterlagen nennen pauschale Investitionsmittel, deren Priorisierung ohne zusätzliche Erklärung schwer nachvollziehbar bleibt.",
    "Nach welchen nachvollziehbaren Kriterien sollen pauschale Investitionsmittel eingeordnet werden?",
    "Soll der Review-Pfad pauschale Mittel zuerst nach Transparenz- und Fairnesskriterien strukturieren?",
  ),
  buildAnlassraumSeed(
    "rathaus-demo-anlassraum-16",
    "Gezielte Zuweisungen erklären",
    "Seed für gezielte Zuweisungen und Restkostenlogik im Investitionsplan.",
    "verkehr-schule-priorisierung",
    [DOSSIERS[0].id],
    "Die Unterlagen zu gezielten Zuweisungen enthalten erklärungsbedürftige Planjahre, Restkosten und projektbezogene Finanzierungslogiken.",
    "Welche Teile der gezielten Zuweisungen sind für nicht-fachliche Leserinnen und Leser besonders unklar?",
    "Soll die Erklärung gezielter Zuweisungen als eigener Entscheidungs- und Verständigungspfad vorbereitet werden?",
  ),
] as const;

function buildClaimSeed(
  anlassraum: RathausDemoAnlassraumSeed,
  kind: RathausDemoClaimKind,
  text: string,
  label: string,
): RathausDemoClaimSeed {
  return {
    id: `${anlassraum.id}:${kind}`,
    anlassraumId: anlassraum.id,
    dossierIds: [...anlassraum.dossierIds],
    title: `${anlassraum.title} · ${label}`,
    text,
    kind,
    reviewStatus: "needs_review",
    visibilityState: "internal_review",
    visibilityLabel: INTERNAL_REVIEW_LABEL,
  };
}

const CLAIMS: readonly RathausDemoClaimSeed[] = ANLASSRAEUME.flatMap((anlassraum) => [
  buildClaimSeed(anlassraum, "source_statement", anlassraum.sourceStatement, "Quellen-Aussage"),
  buildClaimSeed(
    anlassraum,
    "understanding_question",
    anlassraum.understandingQuestion,
    "Verständlichkeitsfrage",
  ),
  buildClaimSeed(anlassraum, "decision_option", anlassraum.decisionOption, "Priorisierungsoption"),
]) as readonly RathausDemoClaimSeed[];

const REVIEW_SEEDS: readonly RathausDemoReviewSeed[] = [
  ...DOSSIERS.map((dossier) => ({
    id: `review:${dossier.id}`,
    kind: "dossier" as const,
    title: dossier.title,
    summary: dossier.summary,
    href: dossier.href,
    regionId: RATHAUS_DEMO_REGION_ID,
    regionName: "Berlin Reinickendorf",
    dossierId: dossier.id,
    visibilityState: "internal_review" as const,
    visibilityLabel: dossier.visibilityLabel,
    reviewStatus: "needs_review" as const,
  })),
  ...ANLASSRAEUME.map((anlassraum) => ({
    id: `review:${anlassraum.id}`,
    kind: "anlassraum" as const,
    title: anlassraum.title,
    summary: anlassraum.summary,
    href: anlassraum.href,
    regionId: RATHAUS_DEMO_REGION_ID,
    regionName: "Berlin Reinickendorf",
    dossierId: anlassraum.dossierIds[0] ?? null,
    visibilityState: "internal_review" as const,
    visibilityLabel: anlassraum.visibilityLabel,
    reviewStatus: "needs_review" as const,
  })),
] as const;

export function getRathausDemoGraphSeedPreview(params: {
  urls: string[];
  roles: string[];
}): RathausDemoGraphSeedPreview | null {
  const source = matchRathausDemoOfficialSource(params.urls);
  if (!source) return null;

  const canPrepareRegionalProject = canAccessRathausDemoRegionalSeed(params.roles);

  return {
    source,
    regionId: RATHAUS_DEMO_REGION_ID,
    regionSlug: RATHAUS_DEMO_REGION_SLUG,
    regionName: "Berlin Reinickendorf",
    procedureTitle: DOSSIERS[0].title,
    procedureStatus: "closed",
    archiveStatus: "archived",
    deadlineIso: RATHAUS_DEMO_PROCEDURE_DEADLINE_ISO,
    deadlineLabel: "04.05.2025",
    deadlinePassed: true,
    access: canPrepareRegionalProject
      ? {
          canPrepareRegionalProject: true,
          accessMode: "region_admin",
          warning: null,
          accessLabel: "Admin-/Regionsicht: vollständige reviewpflichtige Seed-Kandidaten sind sichtbar.",
        }
      : {
          canPrepareRegionalProject: false,
          accessMode: "public_preview",
          warning:
            "Dieser Link betrifft Reinickendorf. Ohne Region- oder Admin-Berechtigung darfst du hier nur einen Hinweis einreichen, nicht das regionale Projekt einspeisen.",
          accessLabel: "Öffentliche Vorschau: maximal 3 sichere Themencluster, keine Dossiers, Anlassräume oder Claims werden angelegt.",
        },
    publicPreviewClusters: [...CLUSTERS],
    dossiers: [...DOSSIERS],
    anlassraeume: [...ANLASSRAEUME],
    claims: [...CLAIMS],
    reviewSeeds: [...REVIEW_SEEDS],
    counts: {
      publicClusters: CLUSTERS.length,
      dossiers: DOSSIERS.length,
      anlassraeume: ANLASSRAEUME.length,
      claims: CLAIMS.length,
    },
    guardrails: {
      noAutoPublish: true,
      noAutoOfficialApproval: true,
      noAutoDossierFinalization: true,
      noAutoAnlassraumFinalization: true,
      noSilentGraphMerge: true,
    },
  };
}

export function listRathausDemoReviewSeeds(): RathausDemoReviewSeed[] {
  return [...REVIEW_SEEDS];
}

export function getRathausDemoSourceReferenceUrls(): string[] {
  return [RATHAUS_DEMO_CANONICAL_SOURCE_URL, RATHAUS_DEMO_PRESS_RELEASE_URL];
}
