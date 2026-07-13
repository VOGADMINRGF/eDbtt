import {
  getCanonicalSourcePackOverallEvidenceState,
  type CanonicalSourcePackEvidenceState,
} from "@/features/create/canonicalSourcePackContract";
import type { DossierSocialOutputDraftKind } from "@/features/create/dossierSocialOutputDraftContract";
import type { RoleSpecificReviewType } from "@/features/create/roleSpecificReviewContract";
import type {
  V3UnifiedReviewQueueItem,
} from "@/features/create/unifiedReviewQueueContract";
import type { V3ReviewQueueWiringContext } from "@/features/create/unifiedReviewQueueWiring";
import type { GovernanceActorRole } from "@features/trust/types";
import {
  preparationStatusLabel as sharedPreparationStatusLabel,
  reviewQueueStateLabel as sharedReviewQueueStateLabel,
} from "@/features/review/reviewSurfaceStatusLabels";

export type V3ReviewContextSummaryModel = {
  reviewTypeLabels: string[];
  reviewerRoleLabels: string[];
  statusLabels: string[];
  guardrails: string[];
  languageLine: string;
  evidenceLine: string;
  candidateLine: string;
  blockerLabels: string[];
  nextStepLabel: string;
  technicalLine: string | null;
};

type SummaryAudience = "admin" | "workspace";

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function roleLabel(value: GovernanceActorRole): string {
  if (value === "admin") return "Admin";
  if (value === "editor") return "Redaktion";
  if (value === "editorial_actor") return "Redaktionelle Freigabe";
  if (value === "institutional_actor") return "Organisation/Kommune";
  if (value === "reviewer") return "Prüfung";
  return "Community";
}

function reviewTypeLabel(value: RoleSpecificReviewType): string {
  if (value === "editorial_review") return "Redaktionelle Prüfung";
  if (value === "org_review") return "Organisationsprüfung";
  if (value === "moderation_review") return "Moderation";
  if (value === "cost_provider_review") return "Kosten-/Anbieterprüfung";
  if (value === "publish_review") return "Freigabe vor Sichtbarkeit";
  if (value === "source_review") return "Quellenprüfung";
  if (value === "translation_review") return "Sprachprüfung";
  if (value === "voxy_script_review") return "Voxy-Skriptprüfung";
  if (value === "voxy_render_review") return "Voxy-Renderfreigabe";
  return "Selbstprüfung";
}

function evidenceStateLabel(value: CanonicalSourcePackEvidenceState): string {
  if (value === "supported") return "gut belegt";
  if (value === "partial") return "teilweise belegt";
  if (value === "contested") return "umstritten";
  if (value === "context_missing") return "Kontext fehlt";
  if (value === "outdated") return "veraltet";
  return "Quellen fehlen";
}

function trustStateLabel(value: string | null | undefined): string {
  if (value === "supported") return "getragen";
  if (value === "partially_supported") return "teilweise getragen";
  if (value === "context_missing") return "Kontext fehlt";
  if (value === "contested") return "umstritten";
  if (value === "translation_uncertain") return "Übersetzung unsicher";
  if (value === "outdated") return "veraltet";
  if (value === "normative_position") return "Position, keine Tatsachenbehauptung";
  if (value === "jurisdiction_unclear") return "Zuständigkeit unklar";
  if (value === "source_present") return "Quelle vorhanden";
  return "Quellen fehlen";
}

function socialDraftKindLabel(value: DossierSocialOutputDraftKind): string {
  if (value === "website_update_draft") return "Website-Entwurf";
  if (value === "newsletter_draft") return "Newsletter-Entwurf";
  if (value === "linkedin_draft") return "LinkedIn-Entwurf";
  if (value === "press_note_draft") return "Pressenotiz";
  if (value === "carousel_draft") return "Carousel-Entwurf";
  return "Kurzvideo-Skript";
}

function blockerLabel(value: string): string {
  if (value === "source_needed") return "Quellen fehlen";
  if (value === "context_missing") return "Kontext fehlt";
  if (value === "contested") return "Gegenprüfung oder Einordnung offen";
  if (value === "outdated") return "Quellenstand wirkt veraltet";
  if (value === "translation_uncertain") return "Sprachfassung muss geprüft werden";
  if (value === "blocked_by_provider") return "Anbieter-Anbindung fehlt";
  if (value === "blocked_by_secret") return "Zugangsdaten fehlen";
  if (value === "blocked_by_runtime_truth") return "Laufzeit noch nicht belastbar verdrahtet";
  if (value === "missing_runtime_truth") return "Belastbare Laufzeitwahrheit fehlt";
  if (value === "ready_after_review") return "Vorbereitung endet vor technischem Start";
  return value.replace(/_/g, " ");
}

function sourceLabel(value: V3UnifiedReviewQueueItem["source"]): string {
  if (value === "create_handoff") return "Create-Handoff";
  if (value === "participation_candidate") return "Beteiligungskandidat";
  if (value === "social_output_draft") return "Social-Entwurf";
  return "Voxy-Briefing";
}

function collectRelevantItems(
  context: V3ReviewQueueWiringContext,
): V3UnifiedReviewQueueItem[] {
  const items = context.primaryUnifiedItem
    ? [context.primaryUnifiedItem, ...context.unifiedItems]
    : context.unifiedItems;
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function buildCandidateLine(context: V3ReviewQueueWiringContext): string {
  const parts: string[] = [];
  if (context.participationCandidates.length > 0) {
    parts.push(`${context.participationCandidates.length} Beteiligungskandidaten`);
  }
  if (context.socialOutputDrafts.length > 0) {
    const labels = unique(
      context.socialOutputDrafts.slice(0, 3).map((draft) => socialDraftKindLabel(draft.kind)),
    );
    parts.push(
      `${context.socialOutputDrafts.length} Social-Entwürfe${
        labels.length > 0 ? ` (${labels.join(", ")})` : ""
      }`,
    );
  }
  if (context.voxyBriefing) {
    const voxyState =
      context.voxyRenderJob?.status === "ready_after_review"
        ? "nur als Vorschlag in Prüfung"
        : context.voxyRenderJob?.status
          ? blockerLabel(context.voxyRenderJob.status)
          : "nur als Vorschlag in Prüfung";
    parts.push(`Voxy-Briefing: ${voxyState}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "Keine zusätzlichen Folgekandidaten sichtbar.";
}

function buildBlockerLabels(context: V3ReviewQueueWiringContext): string[] {
  const blockers = [
    ...(context.sourcePack?.openGaps ?? []),
    ...(context.multilingualEvidence?.overallUncertaintyReasons ?? []),
  ];
  if (context.voxyRenderJob) blockers.push(context.voxyRenderJob.status);
  if (context.voxyPublishDraft) blockers.push(context.voxyPublishDraft.status);
  return unique(
    blockers
      .filter((value) => value !== "none" && value !== "draft_only")
      .map(blockerLabel),
  );
}

function buildNextStepLabel(
  items: readonly V3UnifiedReviewQueueItem[],
  blockers: readonly string[],
): string {
  if (blockers.some((blocker) => blocker.includes("Quellen") || blocker.includes("Kontext"))) {
    return "Zuerst Quellenlage, Kontext oder offene Fragen klären.";
  }
  if (blockers.some((blocker) => blocker.includes("Anbieter") || blocker.includes("Laufzeit"))) {
    return "Zuerst Review abschließen, dann technische Blocker bewusst prüfen.";
  }
  if (items.some((item) => item.queueState === "publish_ready")) {
    return "Freigabe bewusst entscheiden; bereit für Freigabe ist noch nicht veröffentlicht.";
  }
  if (items.some((item) => item.queueState === "approval_required")) {
    return "Passende Freigaberolle einbinden, bevor Sichtbarkeit vorbereitet wird.";
  }
  return "Review abschließen und den nächsten Arbeitsentwurf bewusst wählen.";
}

export function buildV3ReviewContextSummaryModel(
  context: V3ReviewQueueWiringContext,
  audience: SummaryAudience = "admin",
): V3ReviewContextSummaryModel {
  const items = collectRelevantItems(context);
  const reviewTypeLabels = unique(items.map((item) => reviewTypeLabel(item.requiredReviewType)));
  const reviewerRoleLabels = unique(
    items.flatMap((item) => item.requiredReviewerRoles.map(roleLabel)),
  );
  const statusLabels = unique([
    ...items.map((item) => sharedReviewQueueStateLabel(item.queueState)),
    ...(context.dossierWorkspaceSurface
      ? [sharedPreparationStatusLabel(context.dossierWorkspaceSurface.preparationStatus)]
      : []),
  ]);
  const evidenceState = context.sourcePack
    ? getCanonicalSourcePackOverallEvidenceState(context.sourcePack)
    : null;
  const evidenceLine = context.sourcePack
    ? `${context.sourcePack.sources.length} Quellenhinweise · ${evidenceStateLabel(evidenceState ?? "source_needed")} · Vertrauensstatus ${trustStateLabel(context.multilingualEvidence?.overallTrustStatus)}`
    : "Noch keine belastbare Quellenlesart im V3-Kontext sichtbar.";
  const languageLine = context.languageBridge
    ? `Originalsprache: ${context.languageBridge.original.language} · Lesefassung: ${context.languageBridge.translation.language} · Übersetzungsstatus: ${context.languageBridge.translation.state}`
    : "Keine Sprachbrücke im V3-Kontext sichtbar.";
  const guardrails = [
    "Keine automatische Veröffentlichung.",
    "Prüfung bleibt erforderlich.",
    "Keine öffentliche Aktivierung ohne bewusste Freigabe.",
  ];
  const blockerLabels = buildBlockerLabels(context);
  const nextStepLabel = buildNextStepLabel(items, blockerLabels);
  const technicalLine =
    audience === "admin" && items.length > 0
      ? `Aktive Kontexte: ${unique(items.map((item) => sourceLabel(item.source))).join(", ")}`
      : null;

  return {
    reviewTypeLabels:
      reviewTypeLabels.length > 0 ? reviewTypeLabels : ["Prüfkontext noch nicht ausdifferenziert"],
    reviewerRoleLabels:
      reviewerRoleLabels.length > 0 ? reviewerRoleLabels : ["Rolle noch offen"],
    statusLabels:
      statusLabels.length > 0 ? statusLabels : ["Entwurf"],
    guardrails,
    languageLine,
    evidenceLine,
    candidateLine: buildCandidateLine(context),
    blockerLabels,
    nextStepLabel,
    technicalLine,
  };
}

export default function V3ReviewContextSummary(props: {
  context: V3ReviewQueueWiringContext;
  audience?: SummaryAudience;
  title?: string;
  className?: string;
  dataTestId?: string;
}) {
  const model = buildV3ReviewContextSummaryModel(
    props.context,
    props.audience ?? "admin",
  );

  return (
    <section
      data-testid={props.dataTestId}
      className={`rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 ${props.className ?? ""}`.trim()}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
        {props.title ?? "V3-Review-Kontext"}
      </p>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {model.statusLabels.map((label) => (
          <span
            key={`status-${label}`}
            className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[rgb(var(--muted))]"
          >
            {label}
          </span>
        ))}
      </div>
      <dl className="mt-3 space-y-2 text-xs text-[rgb(var(--muted))]">
        <div>
          <dt className="font-semibold text-[rgb(var(--fg))]">Prüftyp</dt>
          <dd>{model.reviewTypeLabels.join(" · ")}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[rgb(var(--fg))]">Erforderliche Rolle</dt>
          <dd>{model.reviewerRoleLabels.join(" · ")}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[rgb(var(--fg))]">Guardrails</dt>
          <dd>{model.guardrails.join(" · ")}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[rgb(var(--fg))]">Sprache und Lesefassung</dt>
          <dd>{model.languageLine}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[rgb(var(--fg))]">Quellen, Belege und Vertrauen</dt>
          <dd>{model.evidenceLine}</dd>
        </div>
        <div>
          <dt className="font-semibold text-[rgb(var(--fg))]">Folgekandidaten</dt>
          <dd>{model.candidateLine}</dd>
        </div>
        {model.blockerLabels.length > 0 ? (
          <div>
            <dt className="font-semibold text-[rgb(var(--fg))]">Blocker heute</dt>
            <dd>{model.blockerLabels.join(" · ")}</dd>
          </div>
        ) : null}
        <div>
          <dt className="font-semibold text-[rgb(var(--fg))]">Nächster sinnvoller Review-Schritt</dt>
          <dd>{model.nextStepLabel}</dd>
        </div>
        {model.technicalLine ? (
          <div>
            <dt className="font-semibold text-[rgb(var(--fg))]">Interne Einordnung</dt>
            <dd>{model.technicalLine}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  );
}
