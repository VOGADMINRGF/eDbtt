import Link from "next/link";
import {
  getAiTransparencyLabel,
  getAiTransparencyLabelKey,
  type AiTransparencyContentKind,
  type AiTransparencyLabelKey,
  type AiTransparencyLocale,
  type AiTransparencyStatus,
} from "@features/ai/aiTransparencyContract";

const VOXY_DISCLOSURE: Record<AiTransparencyLocale, string> = {
  de: "Voxy ist ein KI-System. Antworten und Vorschläge können unvollständig oder fehlerhaft sein. Inhalte werden nicht automatisch veröffentlicht.",
  en: "Voxy is an AI system. Responses and suggestions may be incomplete or incorrect. Content is never published automatically.",
};

const DETAIL_LABEL: Record<AiTransparencyLocale, string> = {
  de: "Wie Voxy und eDebatte KI transparent einsetzen",
  en: "How Voxy and eDebatte use AI transparently",
};

export function VoxyAiSystemDisclosure(props: {
  locale: AiTransparencyLocale;
  compact?: boolean;
}) {
  return (
    <aside
      aria-label={props.locale === "en" ? "AI transparency notice" : "KI-Transparenzhinweis"}
      className={`max-w-full rounded-xl border border-cyan-300/45 bg-cyan-500/[0.07] text-[rgb(var(--fg))] ${
        props.compact ? "px-3 py-2 text-xs leading-5" : "px-3.5 py-3 text-sm leading-6"
      }`}
      data-ai-system-disclosure="voxy"
      data-ai-system="true"
    >
      <p>{VOXY_DISCLOSURE[props.locale]}</p>
      <Link
        className="mt-1.5 inline-flex min-h-8 items-center font-semibold text-cyan-800 underline decoration-cyan-500/50 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:text-cyan-200"
        href="/ki-transparenz#voxy"
      >
        {DETAIL_LABEL[props.locale]}
      </Link>
    </aside>
  );
}

export function AiTransparencyLabel(props: {
  locale: AiTransparencyLocale;
  status: AiTransparencyStatus;
  contentKind: AiTransparencyContentKind;
  humanReviewed?: boolean;
  labelKey?: AiTransparencyLabelKey | null;
  className?: string;
}) {
  const labelKey =
    props.labelKey === undefined
      ? getAiTransparencyLabelKey({
          status: props.status,
          contentKind: props.contentKind,
          humanReviewed: props.humanReviewed,
        })
      : props.labelKey;

  if (!labelKey) return null;
  const label = getAiTransparencyLabel(labelKey, props.locale);

  return (
    <span
      aria-label={label}
      className={`inline-flex max-w-full items-center whitespace-normal rounded-full border border-violet-300/55 bg-violet-500/[0.08] px-2.5 py-1 text-[11px] font-semibold leading-5 text-violet-950 dark:text-violet-100 ${props.className ?? ""}`.trim()}
      data-ai-transparency-label={labelKey}
      data-ai-transparency-status={props.status}
      data-content-kind={props.contentKind}
    >
      {label}
    </span>
  );
}
