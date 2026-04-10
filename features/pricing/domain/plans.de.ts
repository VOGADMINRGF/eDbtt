import type { EDebattePackageDefinition, EDebattePackageId, PackageAudience, PackageStatus } from "./types";

export const PACKAGE_STATUS_LABELS: Record<PackageStatus, string> = {
  verfuegbar: "Direktstart",
  pilot: "Pilotbetrieb",
  vormerkung: "Paketstart",
  bald: "In Vorbereitung",
};

export const PACKAGE_AUDIENCE_LABELS: Record<PackageAudience, string> = {
  buerger: "Bürgerinnen und Bürger",
  organisation: "Organisationen",
};

export const EDEBATTE_PACKAGES_DE: EDebattePackageDefinition[] = [
  {
    id: "basis",
    titel: "eDebatte Basis",
    zielgruppe: "Bürgerinnen und Bürger",
    typ: "buerger",
    status: "pilot",
    preisMonat: 0,
    beschreibungKurz:
      "Kostenfreier Einstieg: Inhalte ansehen, mitwirken und die Gemeinschaft kennenlernen.",
    leistungen: [
      "Lesen und wischen bleiben frei",
      "Eigene Beiträge über Aktivität freischalten",
      "Teilnahme an Direktformaten und Abstimmungen",
    ],
    ctaText: "Paket starten",
    ctaHref: "/vormerken?paket=basis",
  },
  {
    id: "start",
    titel: "eDebatte Start",
    zielgruppe: "Bürgerinnen und Bürger",
    typ: "buerger",
    status: "vormerkung",
    preisMonat: 9.99,
    beschreibungKurz: "Regelmäßig mitbestimmen und eigene Vorschläge einbringen.",
    leistungen: [
      "Mehr eigene Beitraege und Abstimmungen",
      "Zugang zu Debatten, Datenpaketen und Direktformaten",
      "Frueher Zugriff auf neue Funktionen",
    ],
    hervorgehoben: true,
    ctaText: "Paketstart beauftragen",
    ctaHref: "/vormerken?paket=start",
    sekundarCtaText: "VoiceOpenGov unterstuetzen",
    sekundarCtaHref: "https://voiceopengov.org/unterstuetzen#voiceopengov-support",
  },
  {
    id: "pro",
    titel: "eDebatte Pro",
    zielgruppe: "Engagierte Bürger:innen und Initiativen",
    typ: "buerger",
    status: "vormerkung",
    preisMonat: 29,
    beschreibungKurz:
      "Für intensive Nutzung: mehr Credits, strukturierte Beteiligung und optionaler Recherche-Schub.",
    leistungen: [
      "5-10 Themen pro Projekt (2-5 Optionen je Thema)",
      "Zusatzthemen: 1,99 EUR je Thema (Add-on, nur mit Pro, 24 Monate)",
      "Agenda & Umfragen: max. 2,99 EUR pro Teilnehmer (preisstaffelbar)",
      "Optional: Faktencheck-Stufen (0/1/2) mit Budget- und Freigabehebeln",
      "Optional: Contributions-Hilfe (Alternativen/Eventualitaeten) mit Preisstaffel",
      "Mindestlaufzeit 24 Monate (Setup, Vertrag)",
    ],
    ctaText: "Paketstart beauftragen",
    ctaHref: "/vormerken?paket=pro",
    sekundarCtaText: "VoiceOpenGov unterstuetzen",
    sekundarCtaHref: "https://voiceopengov.org/unterstuetzen#voiceopengov-support",
  },
  {
    id: "b2b_basis",
    titel: "B2B Basis",
    zielgruppe: "Organisationen, Unternehmen, Verbaende",
    typ: "organisation",
    status: "vormerkung",
    beschreibungKurz:
      "Ein Projekt, klare Rollen und Export/Embed-Basics für Teams und Organisationen.",
    leistungen: [
      "1 Projekt",
      "Rollen: Owner, Editor, Viewer",
      "Begrenzte Themen je Projekt",
      "Export & Embed (Basis)",
    ],
    ctaText: "Paketstart Organisation",
    ctaHref: "/vormerken?paket=b2b_basis",
  },
  {
    id: "b2b_pro",
    titel: "B2B Pro",
    zielgruppe: "Organisationen, Unternehmen, Verbaende",
    typ: "organisation",
    status: "vormerkung",
    beschreibungKurz:
      "Mehrere Projekte, Team-Workflow und erweiterte Exporte für professionelle Nutzung.",
    leistungen: [
      "Mehrere Projekte & Teams",
      "Rollen & Team-Logik (Owner/Editor/Viewer)",
      "API & Export erweitert",
      "Moderations- und Freigabe-Workflow",
    ],
    hervorgehoben: true,
    ctaText: "Paketstart Organisation",
    ctaHref: "/vormerken?paket=b2b_pro",
  },
  {
    id: "b2g_basis",
    titel: "B2G Basis",
    zielgruppe: "Kommunen, Verwaltungen, Traeger",
    typ: "organisation",
    status: "vormerkung",
    beschreibungKurz:
      "Ein kommunaler Bereich mit Admin-Steuerung, Quellen-Feeds und Projekt-Reports.",
    leistungen: [
      "Kommune: 1 Bereich",
      "Admin-Steuerung & Rollen",
      "Feeds/Quellen je Kommune",
      "Projekt-Reports (Basis)",
    ],
    ctaText: "Paketstart Kommune",
    ctaHref: "/vormerken?paket=b2g_basis",
  },
  {
    id: "b2g_pro",
    titel: "B2G Pro",
    zielgruppe: "Kommunen, Verwaltungen, Traeger",
    typ: "organisation",
    status: "vormerkung",
    beschreibungKurz:
      "Mehrere Bereiche mit Mandantenlogik, erweiterten Auswertungen und Schnittstellen.",
    leistungen: [
      "Mehrere Bereiche / Mandanten",
      "Bereichs- und Rollenlogik",
      "Erweiterte Auswertungen",
      "Schnittstellen & Exporte",
    ],
    hervorgehoben: true,
    ctaText: "Paketstart Kommune",
    ctaHref: "/vormerken?paket=b2g_pro",
  },
];

export const EDEBATTE_PACKAGE_IDS: EDebattePackageId[] = EDEBATTE_PACKAGES_DE.map((pkg) => pkg.id);
