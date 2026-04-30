export type ParticipationPackageId =
  | "check"
  | "dossier"
  | "runde"
  | "mandat"
  | "studio"
  | "onlinebeteiligung"
  | "akutlage"
  | "zukunftsprozess";

export type ParticipationPackage = {
  id: ParticipationPackageId;
  title: string;
  subtitle: string;
  audience: string[];
  tenderFit: string[];
  outputs: string[];
  modules: string[];
};

export type TenderLotId = "local" | "regional" | "legal" | "future" | "acute" | "online";

export type TenderLotMapping = {
  id: TenderLotId;
  tenderLot: string;
  eDebatteOffer: string;
  packageIds: ParticipationPackageId[];
  examples: string[];
};

export const participationPackages: ParticipationPackage[] = [
  {
    id: "check",
    title: "eDebatte Check",
    subtitle: "Thema, Quellenlage und Beteiligungsreife schnell pruefen.",
    audience: ["Kommunen", "Redaktionen", "Verbaende", "Beteiligungsbueros"],
    tenderFit: ["Themenklaerung", "Anlassanalyse", "Vorpruefung", "Beteiligungsempfehlung"],
    outputs: ["Kurz-Dossier", "offene Fragen", "erste Optionen", "Beteiligungsempfehlung"],
    modules: ["Quellencheck", "Stakeholder-Skizze", "Risiko-/Konfliktindikator"],
  },
  {
    id: "dossier",
    title: "eDebatte Dossier",
    subtitle: "Positionen, Quellen, Behauptungen und offene Fragen nachvollziehbar buendeln.",
    audience: ["Verwaltungen", "Kommunen", "Medien", "Projekttraeger"],
    tenderFit: ["Sachstandsaufbereitung", "Oeffentlichkeitsinformation", "Entscheidungsvorbereitung"],
    outputs: ["oeffentliches Dossier", "Quellenmatrix", "Pro-/Contra-Struktur", "offene Pruefpunkte"],
    modules: ["Evidenzgraph", "Claim-Struktur", "Zielgruppenlogik"],
  },
  {
    id: "runde",
    title: "eDebatte Runde",
    subtitle: "Digitale oder hybride Beteiligung mit QR-Zugang, Optionen und Auswertung.",
    audience: ["Kommunen", "Verwaltungen", "Beteiligungsbueros", "Organisationen"],
    tenderFit: ["Online-Beteiligung", "Beteiligungsformat", "Buergerdialog", "Zielgruppenaktivierung"],
    outputs: ["Beteiligungsrunde", "Stimmungsbild", "Kommentare", "Optionenergaenzungen"],
    modules: ["QR-Zugang", "Abstimmung", "Kommentierung", "Moderationsstatus"],
  },
  {
    id: "mandat",
    title: "eDebatte Mandat",
    subtitle: "Ergebnisse in Entscheidung, Bericht und Gremienvorlage uebersetzen.",
    audience: ["Gremien", "Verwaltungen", "Repraesentanten", "Projektleitungen"],
    tenderFit: ["Auswertung", "Abschlussbericht", "Gremienpraesentation", "Transparenzarchiv"],
    outputs: ["Mandatsbericht", "Gremienexport", "Ergebnisarchiv", "Presseauszug"],
    modules: ["Mehrheits-/Konfliktmatrix", "Bedingungen", "offene Entscheidungsfragen"],
  },
  {
    id: "studio",
    title: "eDebatte Studio",
    subtitle: "Beteiligungskampagnen, Posts, Briefe und Pressebausteine vor Veroeffentlichung pruefen.",
    audience: ["Kommunikation", "Pressestellen", "Redaktionen", "Initiativen"],
    tenderFit: ["Informationskampagne", "Oeffentlichkeitsarbeit", "Social-Ausspielung", "Einladung"],
    outputs: ["Master-Post", "Carousel", "QR-Brief", "Newsletter", "Pressebaustein"],
    modules: ["Kanalwahl", "Entwurf/Review/Planung", "Live-Freigabe nur nach Admin-Entscheid"],
  },
  {
    id: "onlinebeteiligung",
    title: "Onlinebeteiligung-as-a-Service",
    subtitle: "Vergabefaehiger Kernbaustein fuer digitale Beteiligungsverfahren.",
    audience: ["Kommunen", "Landkreise", "Ministerien", "Beteiligungsdienstleister"],
    tenderFit: ["Los Onlinebeteiligung", "digitale Plattform", "Betrieb", "Support"],
    outputs: ["Beteiligungsplattform", "Adminbereich", "Export", "Ergebnisansicht"],
    modules: ["Rollen", "Datenschutz", "Barrierefreiheit", "Auswertung"],
  },
  {
    id: "akutlage",
    title: "eDebatte Akutlage",
    subtitle: "Zeitkritische Themen schnell strukturieren, erklaeren und beteiligungsfaehig machen.",
    audience: ["Verwaltungen", "Kommunikation", "Projekttraeger"],
    tenderFit: ["akute Themen", "zeitkritische Beteiligung", "Konfliktkommunikation"],
    outputs: ["Sofort-Dossier", "FAQ", "Konfliktpunkte", "Kommunikationspaket"],
    modules: ["Schnellcheck", "Quellenlage", "Fragen/Antworten", "Stakeholder-Hinweise"],
  },
  {
    id: "zukunftsprozess",
    title: "eDebatte Zukunftsprozess",
    subtitle: "Leitbilder, Stadtentwicklung und Zukunftsoptionen nachvollziehbar beteiligen.",
    audience: ["Kommunen", "Regionen", "Verbaende", "Stiftungen"],
    tenderFit: ["Entwicklungsprozess", "Zukunftsprozess", "Leitbild", "Strategie"],
    outputs: ["Szenarien", "Prioritaeten", "Optionen", "Beteiligungsmandat"],
    modules: ["Szenarien", "Priorisierung", "Konsequenzen", "Umsetzungslogik"],
  },
];

export const tenderLotMappings: TenderLotMapping[] = [
  {
    id: "local",
    tenderLot: "Lokale Vorhaben",
    eDebatteOffer: "eDebatte Lokalrunde",
    packageIds: ["check", "dossier", "runde", "mandat", "studio"],
    examples: ["Innenstadt", "Spielplatz", "Schulstandort", "Verkehrskonzept", "Waermeplanung"],
  },
  {
    id: "regional",
    tenderLot: "Regionale Vorhaben",
    eDebatteOffer: "eDebatte Regionaldossier",
    packageIds: ["dossier", "runde", "mandat"],
    examples: ["OePNV", "Klinikversorgung", "Gewerbeflaechen", "Energieinfrastruktur"],
  },
  {
    id: "legal",
    tenderLot: "Rechtliche Vorhaben",
    eDebatteOffer: "eDebatte Regelungscheck",
    packageIds: ["check", "dossier", "mandat"],
    examples: ["Satzungen", "Gebuehrenmodelle", "Nutzungskonzepte", "Verordnungen"],
  },
  {
    id: "future",
    tenderLot: "Entwicklungs- und Zukunftsprozesse",
    eDebatteOffer: "eDebatte Zukunftsprozess",
    packageIds: ["zukunftsprozess", "dossier", "runde", "mandat", "studio"],
    examples: ["Leitbild Kommune", "Innenstadt 2035", "Jugendstrategie", "Klimaanpassung"],
  },
  {
    id: "acute",
    tenderLot: "Akute und zeitkritische Themen",
    eDebatteOffer: "eDebatte Akutlage",
    packageIds: ["akutlage", "check", "studio", "runde"],
    examples: ["Standortkonflikt", "Schliessung", "Umwidmung", "Verkehrsversuch"],
  },
  {
    id: "online",
    tenderLot: "Onlinebeteiligung",
    eDebatteOffer: "Onlinebeteiligung-as-a-Service",
    packageIds: ["onlinebeteiligung", "runde", "mandat"],
    examples: ["QR-Zugang", "digitale Abstimmung", "Auswertung", "oeffentliches Ergebnisarchiv"],
  },
];

export const procurementFollowupTasks = [
  {
    id: "PROC-BET-02",
    title: "Muster-Leistungsbeschreibung Buergerbeteiligung",
    scope: "Vergabebausteine fuer digitale/hybride Buergerbeteiligung mit Dossier, Runde, Mandat und Studio.",
  },
  {
    id: "PROC-BET-03",
    title: "Admin Procurement Lead Board",
    scope: "Ausschreibungen erfassen, Lose/Volumen/Relevanz bewerten und eDebatte-Passung ableiten.",
  },
  {
    id: "PROC-BET-04",
    title: "Studio-Ausspielung fuer Beteiligungskampagnen",
    scope: "Master-Post, Kanalwahl, Verbindungen, Entwurf/Review/Planung und echte Freigabe-Grenze.",
  },
  {
    id: "PROC-BET-05",
    title: "Partner-/White-Label-Modus fuer Beteiligungsbueros",
    scope: "Beteiligungsbueros moderieren, eDebatte liefert Dossier, Online-Runde, Auswertung und Mandat.",
  },
] as const;

export function getPackagesForTenderLot(lotId: TenderLotId): ParticipationPackage[] {
  const mapping = tenderLotMappings.find((lot) => lot.id === lotId);
  if (!mapping) return [];
  return mapping.packageIds
    .map((packageId) => participationPackages.find((pkg) => pkg.id === packageId))
    .filter((pkg): pkg is ParticipationPackage => Boolean(pkg));
}
