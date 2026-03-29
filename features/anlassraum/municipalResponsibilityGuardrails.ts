import type { AnlassraumOwnerType } from "@features/anlassraum/types";
import type { RoomType } from "@features/trust/types";

export type MunicipalResponsibilityScope =
  | "dezernat"
  | "fachbereich"
  | "amt"
  | "institution_team";

export type MunicipalResponsibilityStatus =
  | "beobachtet"
  | "in_pruefung"
  | "in_bearbeitung"
  | "umgesetzt"
  | "abgeschlossen";

export type MunicipalResponsibilityGuardrailsContract = {
  institutionalContext: boolean;
  monitoringFirst: true;
  allowsResponsibilityContext: boolean;
  allowedScopes: readonly MunicipalResponsibilityScope[];
  allowedStatuses: readonly MunicipalResponsibilityStatus[];
  deniesTruthPrivilege: true;
  deniesPriorityPrivilege: true;
  deniesScoringPrivilege: true;
  deniesOverrideOfAnlassraumDossierMandate: true;
  requiresOpenQuestionsVisibility: true;
  requiresConflictVisibility: true;
  requiresMandateProgressTraceability: true;
  allowsDashboardMonitoringConnection: true;
  allowsInstitutionalToolingWhenTransparent: true;
  forbiddenInferences: readonly string[];
  allowedStrengths: readonly string[];
};

const INSTITUTIONAL_OWNER_TYPES = new Set<AnlassraumOwnerType>([
  "municipality",
  "government",
  "organization",
  "association",
  "ngo",
  "company",
  "initiative",
]);

const INSTITUTIONAL_ROOM_TYPES = new Set<RoomType>(["official", "internal", "hybrid"]);

export const MUNICIPAL_FORBIDDEN_INFERENCES = [
  "truth_status_from_institution_context",
  "priority_rank_from_institution_status",
  "hidden_opportunity_scoring",
  "automatic_override_of_anlassraum_dossier_review_mandate",
] as const;

export const MUNICIPAL_ALLOWED_STRENGTHS = [
  "zustaendigkeit_sichtbar_machen",
  "verantwortungsraeume_ordnen",
  "bearbeitung_und_nachverfolgung_strukturieren",
  "fristen_und_fortschritt_nachvollziehbar_machen",
  "oeffentliche_anschlussfaehigkeit_erhoehen",
] as const;

export const MUNICIPAL_ALLOWED_SCOPES: readonly MunicipalResponsibilityScope[] = [
  "dezernat",
  "fachbereich",
  "amt",
  "institution_team",
] as const;

export const MUNICIPAL_ALLOWED_STATUSES: readonly MunicipalResponsibilityStatus[] = [
  "beobachtet",
  "in_pruefung",
  "in_bearbeitung",
  "umgesetzt",
  "abgeschlossen",
] as const;

function normalizeOwnerType(value: unknown): AnlassraumOwnerType | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "platform" ||
    normalized === "municipality" ||
    normalized === "government" ||
    normalized === "party" ||
    normalized === "organization" ||
    normalized === "association" ||
    normalized === "ngo" ||
    normalized === "company" ||
    normalized === "media" ||
    normalized === "initiative" ||
    normalized === "community" ||
    normalized === "editorial" ||
    normalized === "user" ||
    normalized === "system" ||
    normalized === "other"
  ) {
    return normalized;
  }
  return null;
}

function normalizeRoomType(value: unknown): RoomType | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "public" ||
    normalized === "community" ||
    normalized === "official" ||
    normalized === "editorial" ||
    normalized === "internal" ||
    normalized === "hybrid"
  ) {
    return normalized;
  }
  return null;
}

export function resolveMunicipalResponsibilityGuardrails(
  input: { ownerType: unknown; roomType: unknown },
): MunicipalResponsibilityGuardrailsContract {
  const ownerType = normalizeOwnerType(input.ownerType);
  const roomType = normalizeRoomType(input.roomType);
  const institutionalContext =
    (ownerType ? INSTITUTIONAL_OWNER_TYPES.has(ownerType) : false) ||
    (roomType ? INSTITUTIONAL_ROOM_TYPES.has(roomType) : false);

  return {
    institutionalContext,
    monitoringFirst: true,
    allowsResponsibilityContext: institutionalContext,
    allowedScopes: MUNICIPAL_ALLOWED_SCOPES,
    allowedStatuses: MUNICIPAL_ALLOWED_STATUSES,
    deniesTruthPrivilege: true,
    deniesPriorityPrivilege: true,
    deniesScoringPrivilege: true,
    deniesOverrideOfAnlassraumDossierMandate: true,
    requiresOpenQuestionsVisibility: true,
    requiresConflictVisibility: true,
    requiresMandateProgressTraceability: true,
    allowsDashboardMonitoringConnection: true,
    allowsInstitutionalToolingWhenTransparent: true,
    forbiddenInferences: MUNICIPAL_FORBIDDEN_INFERENCES,
    allowedStrengths: MUNICIPAL_ALLOWED_STRENGTHS,
  };
}
