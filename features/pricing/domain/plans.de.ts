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
    preisMonat: 29,
    beschreibungKurz:
      "Fuer Vielnutzerinnen, Initiativen und Organisationen mit erweitertem Kontingent.",
    leistungen: [
      "Hohe Kontingente fuer Teams",
      "Priorisierter Zugang zu neuen Funktionen",
      "Unterstuetzung beim Einstieg",
    ],
    ctaText: "Vormerken",
    ctaHref: "/vormerken?paket=pro",
    sekundarCtaText: "Ueber Startnext unterstuetzen",
    sekundarCtaHref: "https://startnext.com/mehrheit",
  },
];

export const EDEBATTE_PACKAGE_IDS: EDebattePackageId[] = EDEBATTE_PACKAGES_DE.map((pkg) => pkg.id);
