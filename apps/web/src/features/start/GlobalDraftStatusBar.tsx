import StartDraftResumeBanner from "@/features/start/StartDraftResumeBanner";
import {
  getStartDraftExcerpt,
  getStartDraftGuardrailSummary,
  getStartDraftStatusLabel,
  getStartDraftSurfaceLabel,
  type StartDraftContext,
  type StartDraftSurface,
} from "@/features/start/startDraftContext";

type DraftStatusAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  tone?: "primary" | "secondary";
};

type GlobalDraftStatusBarProps = {
  draft: StartDraftContext;
  surface: StartDraftSurface;
  title: string;
  body: string;
  eyebrow?: string;
  primaryAction?: DraftStatusAction | null;
  secondaryAction?: DraftStatusAction | null;
  tertiaryAction?: DraftStatusAction | null;
  quaternaryAction?: DraftStatusAction | null;
};

export default function GlobalDraftStatusBar(props: GlobalDraftStatusBarProps) {
  const statusLabel = getStartDraftStatusLabel(props.draft);
  const guardrails = getStartDraftGuardrailSummary(props.draft, props.surface);
  const surfaceLabel = getStartDraftSurfaceLabel(
    props.surface === "start" ? props.draft.targetHint ?? "start" : props.surface,
  );
  const excerpt = getStartDraftExcerpt(props.draft);

  return (
    <div data-testid="global-draft-status-bar" data-start-draft-surface={props.surface}>
      <StartDraftResumeBanner
        eyebrow={props.eyebrow ?? "Aktiver Entwurf"}
        title={props.title}
        body={props.body}
        details={
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className="landing-soft-pill public-soft-pill">{statusLabel}</span>
              <span className="landing-soft-pill public-soft-pill">{surfaceLabel}</span>
              {guardrails.map((item) => (
                <span key={item} className="landing-soft-pill public-soft-pill">
                  {item}
                </span>
              ))}
            </div>
            {excerpt ? (
              <p className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-3 text-sm text-[rgb(var(--fg))]/84">
                {excerpt}
              </p>
            ) : null}
          </div>
        }
        primaryAction={props.primaryAction}
        secondaryAction={props.secondaryAction}
        tertiaryAction={props.tertiaryAction}
      />
      {props.quaternaryAction ? (
        <div className="mt-3 flex flex-wrap gap-3">
          {props.quaternaryAction.href ? (
            <a
              href={props.quaternaryAction.href}
              className="vog-btn-secondary landing-cta-secondary"
              onClick={props.quaternaryAction.onClick}
            >
              {props.quaternaryAction.label}
            </a>
          ) : (
            <button
              type="button"
              className="vog-btn-secondary landing-cta-secondary"
              onClick={props.quaternaryAction.onClick}
            >
              {props.quaternaryAction.label}
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
