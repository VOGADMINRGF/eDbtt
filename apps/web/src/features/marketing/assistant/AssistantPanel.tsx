import Link from "next/link";
import type { MarketingDataQuality } from "../campaignControl/contracts";
import type { MarketingAssistantReadModel } from "./contracts";

type UiLocale = "de" | "en";

type Props = {
  model: MarketingAssistantReadModel;
  locale: UiLocale;
  id?: string;
};

const COPY = {
  de: {
    eyebrow: "Marketing-Assistent",
    mode: "Nur Empfehlungen",
    dataQuality: "Datenlage",
    confidence: "Sicherheit der Einordnung",
    why: "Grundlage und Grenzen anzeigen",
    evidence: "Berücksichtigte Belege",
    missing: "Noch fehlende Grundlage",
    nextActions: "Empfohlene nächste Schritte",
    noActions: "Aktuell ist keine zusätzliche Aktion erforderlich.",
    noAutomation: "Der Assistent verändert, terminiert oder veröffentlicht nichts selbstständig.",
  },
  en: {
    eyebrow: "Marketing assistant",
    mode: "Recommendations only",
    dataQuality: "Data quality",
    confidence: "Assessment confidence",
    why: "Show evidence and limitations",
    evidence: "Evidence considered",
    missing: "Still missing",
    nextActions: "Recommended next steps",
    noActions: "No additional action is required right now.",
    noAutomation: "The assistant does not change, schedule or publish anything autonomously.",
  },
} as const;

export function MarketingAssistantPanel({ model, locale, id = "assistant" }: Props) {
  const copy = COPY[locale];
  const headline = locale === "de" ? model.headlineDe : model.headlineEn;
  const body = locale === "de" ? model.bodyDe : model.bodyEn;
  const missing = locale === "de" ? model.missingDataDe : model.missingDataEn;

  return (
    <section
      id={id}
      className="scroll-mt-6 rounded-3xl border border-violet-300 bg-violet-50/70 p-5 dark:border-violet-400/40 dark:bg-violet-400/10 sm:p-6"
      aria-labelledby={`${id}-heading`}
      data-testid="marketing-contextual-assistant"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700 dark:text-violet-300">
            {copy.eyebrow}
          </p>
          <h2 id={`${id}-heading`} className="mt-1 text-xl font-bold text-[rgb(var(--fg))] sm:text-2xl">
            {headline}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">{body}</p>
        </div>
        <span className="rounded-full border border-violet-300 bg-white/70 px-3 py-1 text-xs font-semibold text-violet-800 dark:bg-violet-950/30 dark:text-violet-200">
          {copy.mode}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <InfoCard label={copy.dataQuality} value={qualityLabel(model.dataQuality, locale)} />
        <InfoCard label={copy.confidence} value={formatConfidence(model.confidence, locale)} />
      </div>

      <details className="mt-4 rounded-2xl border border-violet-200 bg-white/60 p-4 dark:border-violet-400/30 dark:bg-violet-950/20">
        <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">{copy.why}</summary>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">{copy.evidence}</h3>
            <ul className="mt-2 space-y-2 text-sm text-[rgb(var(--muted))]">
              {model.evidence.map((item) => (
                <li key={item.key} className="flex items-start justify-between gap-4 rounded-xl bg-[rgb(var(--card))] px-3 py-2">
                  <span>{locale === "de" ? item.labelDe : item.labelEn}</span>
                  <strong className="text-right text-[rgb(var(--fg))]">{item.value}</strong>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">{copy.missing}</h3>
            {missing.length ? (
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-[rgb(var(--muted))]">
                {missing.map((item) => <li key={item}>{item}</li>)}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">—</p>
            )}
          </div>
        </div>
      </details>

      <div className="mt-5">
        <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">{copy.nextActions}</h3>
        {model.actions.length ? (
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            {model.actions.map((action) => (
              <Link
                key={action.id}
                href={withLocale(action.href, locale)}
                className="rounded-2xl border border-violet-200 bg-white/70 p-4 transition hover:border-violet-400 dark:border-violet-400/30 dark:bg-violet-950/20"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-violet-700 dark:text-violet-300">
                  {locale === "de" ? `Schritt ${action.priority}` : `Step ${action.priority}`}
                </p>
                <p className="mt-1 font-semibold text-[rgb(var(--fg))]">
                  {locale === "de" ? action.titleDe : action.titleEn}
                </p>
                <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                  {locale === "de" ? action.rationaleDe : action.rationaleEn}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">{copy.noActions}</p>
        )}
      </div>

      <p className="mt-5 text-xs leading-5 text-[rgb(var(--muted))]">{copy.noAutomation}</p>
    </section>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-violet-200 bg-white/60 p-4 dark:border-violet-400/30 dark:bg-violet-950/20">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-1 font-semibold text-[rgb(var(--fg))]">{value}</p>
    </div>
  );
}

function qualityLabel(value: MarketingDataQuality, locale: UiLocale) {
  const labels = {
    de: {
      verified: "Aktuell und verifiziert",
      partial: "Teilweise verfügbar",
      estimated: "Geschätzt",
      stale: "Veraltet",
      missing: "Noch nicht verbunden",
      rejected: "Nicht verwendbar",
    },
    en: {
      verified: "Current and verified",
      partial: "Partially available",
      estimated: "Estimated",
      stale: "Stale",
      missing: "Not connected yet",
      rejected: "Not usable",
    },
  } as const;
  return labels[locale][value];
}

function formatConfidence(value: number, locale: UiLocale) {
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}

function withLocale(href: string, locale: UiLocale) {
  const [pathAndQuery, hash] = href.split("#", 2);
  const separator = pathAndQuery.includes("?") ? "&" : "?";
  return `${pathAndQuery}${separator}lang=${locale}${hash ? `#${hash}` : ""}`;
}
