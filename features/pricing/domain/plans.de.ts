import type { EDebattePackageDefinition, EDebattePackageId, PackageAudience, PackageStatus } from "./types";

export const PACKAGE_STATUS_LABELS: Record<PackageStatus, string> = {
  verfuegbar: "Verfuegbar",
  pilot: "Pilot",
  vormerkung: "Vormerkung",
  bald: "Bald",
};

export const PACKAGE_AUDIENCE_LABELS: Record<PackageAudience, string> = {
  buerger: "Buergerinnen und Buerger",
  organisation: "Organisationen",
};

export const EDEBATTE_PACKAGES_DE: EDebattePackageDefinition[] = [
  {
    id: "basis",
    titel: "eDebatte Basis",
    zielgruppe: "Buergerinnen und Buerger",
    typ: "buerger",
    status: "pilot",
    preisMonat: 0,
    beschreibungKurz:
      "Kostenfreier Einstieg: Inhalte ansehen, mitwirken und die Gemeinschaft kennenlernen.",
    leistungen: [
      "Lesen und wischen bleiben frei",
      "Eigene Beitraege ueber Aktivitaet freischalten",
      "Teilnahme an Direktformaten und Abstimmungen",
    ],
    ctaText: "Kostenfrei vormerken",
    ctaHref: "/vormerken?paket=basis",
  },
  {
    id: "start",
    titel: "eDebatte Start",
    zielgruppe: "Buergerinnen und Buerger",
    typ: "buerger",
    status: "vormerkung",
    preisMonat: 9.9,
    beschreibungKurz: "Regelmaessig mitbestimmen und eigene Vorschlaege einbringen.",
    leistungen: [
      "Mehr eigene Beitraege und Abstimmungen",
      "Zugang zu Debatten, Datenpaketen und Direktformaten",
      "Frueher Zugriff auf neue Funktionen",
    ],
    hervorgehoben: true,
    ctaText: "Vormerken",
    ctaHref: "/vormerken?paket=start",
    sekundarCtaText: "Ueber Startnext unterstuetzen",
    sekundarCtaHref: "https://startnext.com/mehrheit",
  },
  {
    id: "pro",
    titel: "eDebatte Pro",
    zielgruppe: "Initiativen und Organisationen",
    typ: "organisation",
    status: "vormerkung",
    preisMonat: 29.99,
    beschreibungKurz:
      "Fuer Organisationen, Teams und Pilot-Partner: Themenpakete, Agenda/Umfragen und optionale Faktencheck-Unterstuetzung.",
    leistungen: [
      "5-10 Themen pro Projekt (je Thema min. 5 Optionen)",
      "Zusatzthemen: 1,99 EUR je Thema (Add-on, nur mit Pro)",
      "Agenda & Umfragen: max. 2,99 EUR pro Teilnehmer (preisstaffelbar)",
      "Optional: Faktencheck-Stufen (0/1/2) mit Budget- und Freigabehebeln",
      "Optional: Contributions-Hilfe (Alternativen/Eventualitaeten) mit Preisstaffel",
      "Mindestlaufzeit 24 Monate (Pilot-Setup, Vertrag)",
    ],
    ctaText: "Vormerken",
    ctaHref: "/vormerken?paket=pro",
    sekundarCtaText: "Ueber Startnext unterstuetzen",
    sekundarCtaHref: "https://startnext.com/mehrheit",
  },
  {
    id: "pilot-b2g",
    titel: "B2G Pilot (Kommunen)",
    zielgruppe: "Verwaltungen, Kommunen, Genossenschaften",
    typ: "organisation",
    status: "pilot",
    beschreibungKurz:
      "12-Wochen-Pilot fuer kommunale Beteiligung: 5–10 Themen, klare Verantwortungen, QR-Events & Reports.",
    leistungen: [
      "Pilotlauf 12 Wochen (5–10 Themen, min. 5 Optionen)",
      "Pilot-Charter + Transparenzbericht",
      "QR-Events & geschlossene Sitzungen",
      "Reports & Export fuer Verwaltungsteams",
      "Optional: Faktencheck/Moderation nach Budget",
    ],
    ctaText: "Pilot anmelden",
    ctaHref: "/vormerken?paket=pilot-b2g",
  },
  {
    id: "pilot-b2b",
    titel: "B2B Pilot (Medien & Teams)",
    zielgruppe: "Medien, Unternehmen, Verbaende",
    typ: "organisation",
    status: "pilot",
    beschreibungKurz:
      "Pilot fuer Medienformate & Team-Formate: QR pro Frage, Live-Trends, NPS und Dossier-Export.",
    leistungen: [
      "QR-Set pro Sendung/Artikel (bis 10 Fragen)",
      "Live-Trends & Auswertungen (NPS, Tendenzen)",
      "Themen-Streams inkl. Dossier-Board",
      "Skript-Import (MVP) + strukturierte Fragen",
      "Optional: Faktencheck/Research-Support",
    ],
    ctaText: "Pilot anmelden",
    ctaHref: "/vormerken?paket=pilot-b2b",
  },
];

export const EDEBATTE_PACKAGE_IDS: EDebattePackageId[] = EDEBATTE_PACKAGES_DE.map((pkg) => pkg.id);
