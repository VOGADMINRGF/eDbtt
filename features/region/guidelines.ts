import { z } from "zod";
import type { Region, RegionalAnlassraum } from "./contracts";

export const REGION_GUIDELINE_MATRIX_KEYS = [
  "fruehzeitigkeit",
  "transparenz",
  "rueckmeldung",
  "zielgruppenansprache",
  "barrierefreiheit",
  "dokumentation",
  "nachvollziehbarkeit",
] as const;

export type RegionGuidelineMatrixKey = (typeof REGION_GUIDELINE_MATRIX_KEYS)[number];

export const REGION_GUIDELINE_PROFILES = ["berlin_participation_guidelines"] as const;
export type RegionGuidelineProfileId = (typeof REGION_GUIDELINE_PROFILES)[number];

const RegionGuidelineCriterionSchema = z
  .object({
    key: z.enum(REGION_GUIDELINE_MATRIX_KEYS),
    label: z.string().trim().min(1),
    workingRule: z.string().trim().min(1),
    reviewQuestion: z.string().trim().min(1),
    evidenceHint: z.string().trim().min(1),
  })
  .strict();

export type RegionGuidelineCriterion = z.infer<typeof RegionGuidelineCriterionSchema>;

const RegionGuidelineMatrixSchema = z
  .object({
    profileId: z.enum(REGION_GUIDELINE_PROFILES),
    title: z.string().trim().min(1),
    jurisdiction: z.string().trim().min(1),
    applicableRegionTypes: z.array(z.enum(["bezirk", "quartier", "kommune", "region"])).min(1),
    legalAdvice: z.literal(false),
    reviewRequired: z.literal(true),
    criteria: z.array(RegionGuidelineCriterionSchema).length(REGION_GUIDELINE_MATRIX_KEYS.length),
  })
  .strict();

export type RegionGuidelineMatrix = z.infer<typeof RegionGuidelineMatrixSchema>;

const BERLIN_PARTICIPATION_GUIDELINES = RegionGuidelineMatrixSchema.parse({
  profileId: "berlin_participation_guidelines",
  title: "Leitlinienmatrix Berlin / Bürgerbeteiligung",
  jurisdiction: "Berlin",
  applicableRegionTypes: ["bezirk", "quartier", "region"],
  legalAdvice: false,
  reviewRequired: true,
  criteria: [
    {
      key: "fruehzeitigkeit",
      label: "Frühzeitigkeit",
      workingRule: "Beteiligung möglichst vor Vorfestlegungen und nicht erst am Ende der Maßnahme öffnen.",
      reviewQuestion:
        "Ist der Beteiligungszeitpunkt früh genug, damit Hinweise den weiteren Arbeitsstand noch verändern können?",
      evidenceHint: "Einstiegszeitpunkt, Anlassbeschreibung und Vorentscheidungen im Dossier oder Anlassraum festhalten.",
    },
    {
      key: "transparenz",
      label: "Transparenz",
      workingRule: "Ziele, Zuständigkeiten, Grenzen und nächste Schritte für den Bezirk klar benennen.",
      reviewQuestion:
        "Ist für Außenstehende verständlich, worum es geht und was eDebatte dazu leisten kann oder nicht leisten kann?",
      evidenceHint: "Scope, Zuständigkeiten, Guardrails und offene Punkte im RegionDashboard sichtbar halten.",
    },
    {
      key: "rueckmeldung",
      label: "Rückmeldung",
      workingRule: "Eingänge nicht nur sammeln, sondern ihren Bearbeitungsstand und die nächste Rückmeldung dokumentieren.",
      reviewQuestion: "Ist erkennbar, was mit Hinweisen, Fragen und Signalen nach dem Eingang passiert?",
      evidenceHint: "Review-Queue, Signalstatus und Folgeaktionen nachvollziehbar führen.",
    },
    {
      key: "zielgruppenansprache",
      label: "Zielgruppenansprache",
      workingRule:
        "Betroffene Gruppen und unterschiedliche lokale Perspektiven aktiv mitdenken, statt nur Standardkanäle zu bedienen.",
      reviewQuestion: "Fehlen relevante Gruppen, Nachbarschaften oder Perspektiven im bisherigen Arbeitsstand?",
      evidenceHint: "Missing Perspectives, offene Zielgruppen und Akteursregister als Arbeitslücken markieren.",
    },
    {
      key: "barrierefreiheit",
      label: "Barrierefreiheit",
      workingRule: "Zugänge, Sprache und Rückkanäle so planen, dass Beteiligung nicht an Hürden scheitert.",
      reviewQuestion:
        "Sind Sprache, Formate und Beteiligungskanäle für unterschiedliche Nutzungsrealitäten anschlussfähig?",
      evidenceHint: "Barriere-Hinweise, alternative Kontaktwege und nachvollziehbare Zugangshürden dokumentieren.",
    },
    {
      key: "dokumentation",
      label: "Dokumentation",
      workingRule: "Arbeitsstände, Quellen und Review-Entscheidungen sauber dokumentieren statt implizit zu halten.",
      reviewQuestion: "Ist die Verdichtung von Signalen, Fragen und Dossierständen ausreichend dokumentiert?",
      evidenceHint: "Quellen, Review-Status, Draft-Provenance und evidenzbezogene Folgefragen speichern.",
    },
    {
      key: "nachvollziehbarkeit",
      label: "Nachvollziehbarkeit",
      workingRule: "Beteiligungsschritte, Ableitungen und Freigaben müssen im Nachgang rekonstruierbar bleiben.",
      reviewQuestion:
        "Kann ein Bezirk später erklären, warum ein Signal sichtbar wurde oder ein Draft vorbereitet wurde?",
      evidenceHint: "Audit-Trail, Guardrails und Access-/Entitlement-Kontext im Regionpfad mitführen.",
    },
  ],
});

export function getRegionGuidelineMatrixByProfile(
  profileId: string | null | undefined,
): RegionGuidelineMatrix | null {
  if (profileId === "berlin_participation_guidelines") {
    return BERLIN_PARTICIPATION_GUIDELINES;
  }
  return null;
}

export function resolveGuidelineProfileForRegion(params: {
  region: Region;
  activeAnlassraeume: RegionalAnlassraum[];
}): RegionGuidelineProfileId | null {
  const directProfile = params.activeAnlassraeume.find((entry) => entry.guidelineProfile)?.guidelineProfile;
  if (directProfile === "berlin_participation_guidelines") return directProfile;

  if (
    params.region.country === "DE" &&
    params.region.federalState === "Berlin" &&
    (params.region.type === "bezirk" || params.region.type === "quartier")
  ) {
    return "berlin_participation_guidelines";
  }

  return null;
}

export function listRegionGuidelineMatrices(): RegionGuidelineMatrix[] {
  return [BERLIN_PARTICIPATION_GUIDELINES];
}
