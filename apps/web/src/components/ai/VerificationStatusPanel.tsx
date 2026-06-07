import {
  resolveVerificationPresentationView,
  type VerificationBadgeTone,
} from "@features/ai/e150/verificationPresentation";
import type {
  E150Lane,
} from "@features/ai/e150/journeyProfiles";
import type {
  ResearchUsed,
  SourceSupport,
  TruthStatus,
  UserFacingVerificationLabel,
  VerificationMode,
} from "@features/ai/e150/verificationContract";

type VerificationStatusPanelProps = {
  lane?: E150Lane | null;
  status?: string | null;
  verificationMode?: VerificationMode | null;
  researchUsed?: ResearchUsed | null;
  sealEligible?: boolean | null;
  sealGranted?: boolean | null;
  verificationLabel?: UserFacingVerificationLabel | null;
  truthStatus?: TruthStatus | null;
  sourceSupport?: SourceSupport | null;
  sourceStatus?: string | null;
  reviewRecommended?: boolean | null;
  showHint?: boolean;
  className?: string;
};

const BADGE_TONE_CLASS: Record<VerificationBadgeTone, string> = {
  neutral:
    "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))]",
  caution:
    "border-amber-300/60 bg-amber-50/80 text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200",
  success:
    "border-emerald-300/60 bg-emerald-50/80 text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-200",
};

function Badge({
  text,
  tone = "neutral",
}: {
  text: string;
  tone?: VerificationBadgeTone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${BADGE_TONE_CLASS[tone]}`}
    >
      {text}
    </span>
  );
}

export default function VerificationStatusPanel(props: VerificationStatusPanelProps) {
  const view = resolveVerificationPresentationView({
    lane: props.lane,
    status: props.status,
    verificationMode: props.verificationMode,
    researchUsed: props.researchUsed,
    sealEligible: props.sealEligible,
    sealGranted: props.sealGranted,
    verificationLabel: props.verificationLabel,
    truthStatus: props.truthStatus,
    sourceSupport: props.sourceSupport,
    sourceStatus: props.sourceStatus,
    reviewRecommended: props.reviewRecommended,
  });
  const showHint = props.showHint !== false;

  return (
    <div
      className={`rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-[11px] text-[rgb(var(--muted))] ${props.className ?? ""}`.trim()}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide">Status</p>
      <div className="mt-1 flex flex-wrap gap-1.5">
        <Badge text={view.verificationLabelDisplay} tone={view.badgeTone} />
        <Badge text={`Quellenlage: ${view.sourceSupportLabel}`} />
        {view.reviewRecommended ? <Badge text="Prüfung empfohlen" tone="caution" /> : null}
        <Badge text="Noch nicht veröffentlicht" />
        <Badge text="Keine automatische Graph-Promotion" />
        <Badge text={view.laneLabel} />
        <Badge text={`Recherche: ${view.researchLabel}`} />
        {view.workflowLabel ? <Badge text={`Workflow: ${view.workflowLabel}`} /> : null}
        <Badge text={`Siegel: ${view.sealLabel}`} tone={view.isVerified ? "success" : "neutral"} />
      </div>
      {showHint ? <p className="mt-2 text-[10px]">{view.verificationHint}</p> : null}
    </div>
  );
}
