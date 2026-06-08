import type { ReactNode } from "react";

type StartDraftResumeAction = {
  label: string;
  onClick?: () => void;
  href?: string;
  tone?: "primary" | "secondary";
};

type StartDraftResumeBannerProps = {
  title: string;
  body: string;
  eyebrow?: string;
  details?: ReactNode;
  primaryAction?: StartDraftResumeAction | null;
  secondaryAction?: StartDraftResumeAction | null;
  tertiaryAction?: StartDraftResumeAction | null;
};

function ActionButton(props: StartDraftResumeAction) {
  const className =
    props.tone === "secondary"
      ? "vog-btn-secondary"
      : "landing-cta-primary public-cta-primary vog-btn-brand";

  if (props.href) {
    return (
      <a href={props.href} className={className} onClick={props.onClick}>
        {props.label}
      </a>
    );
  }

  return (
    <button type="button" className={className} onClick={props.onClick}>
      {props.label}
    </button>
  );
}

export default function StartDraftResumeBanner(props: StartDraftResumeBannerProps) {
  return (
    <section
      className="rounded-[1.4rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4 text-sm text-[rgb(var(--fg))]"
      data-start-draft-resume-banner="true"
    >
      {props.eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          {props.eyebrow}
        </p>
      ) : null}
      <h2 className="mt-1 text-base font-semibold text-[rgb(var(--fg))]">{props.title}</h2>
      <p className="mt-2 max-w-3xl leading-6 text-[rgb(var(--fg))]/84">{props.body}</p>
      {props.details ? <div className="mt-3">{props.details}</div> : null}
      <div className="mt-4 flex flex-wrap gap-3">
        {props.primaryAction ? <ActionButton {...props.primaryAction} /> : null}
        {props.secondaryAction ? <ActionButton {...props.secondaryAction} /> : null}
        {props.tertiaryAction ? <ActionButton {...props.tertiaryAction} /> : null}
      </div>
    </section>
  );
}
