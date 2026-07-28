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
    inventory: "Bestandsdaten verifiziert",
    recommendationConfidence: "Empfehlungssicherheit",
    why: "Grundlage und Grenzen",
    evidence: "Berücksichtigte Belege",
    missing: "Noch fehlende Grundlage",
    nextActions: "Heute sinnvoll",
    noActions: "Aktuell ist keine zusätzliche Aktion erforderlich.",
    noAutomation: "Keine selbstständige Änderung, Terminierung oder Veröffentlichung.",
    open: "Öffnen",
    confidence: { high: "Hoch", medium: "Mittel", low: "Niedrig" },
    confidenceReason: {
      high: "Aktuelle, verifizierte Leistungsdaten liegen vor.",
      medium: "Die Datenbasis ist teilweise verfügbar oder nicht vollständig aktuell.",
      low: "Bestandszahlen sind sicher, Leistungsdaten für Wirkungs- oder Plattformempfehlungen fehlen.",
    },
  },
  en: {
    eyebrow: "Marketing assistant",
    mode: "Recommendations only",
    inventory: "Inventory verified",
    recommendationConfidence: "Recommendation confidence",
    why: "Evidence and limitations",
    evidence: "Evidence considered",
    missing: "Still missing",
    nextActions: "Useful today",
    noActions: "No additional action is required right now.",
    noAutomation: "No autonomous changes, scheduling or publishing.",
    open: "Open",
    confidence: { high: "High", medium: "Medium", low: "Low" },
    confidenceReason: {
      high: "Current, verified performance data is available.",
      medium: "The data basis is partial or not fully current.",
      low: "Inventory counts are reliable, but impact and platform performance data is missing.",
    },
  },
} as const;

export function MarketingAssistantPanel({ model, locale, id = "assistant" }: Props) {
  const copy = COPY[locale];
  const headline = locale === "de" ? model.headlineDe : model.headlineEn;
  const body = locale === "de" ? model.bodyDe : model.bodyEn;
  const missing = locale === "de" ? model.missingDataDe : model.missingDataEn;
  const confidence = recommendationConfidence(model.dataQuality, model.confidence);

  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-3xl border border-violet-300 bg-violet-50/70 p-4 dark:border-violet-400/40 dark:bg-violet-400/10 sm:p-5"
      aria-labelledby={`${id}-heading`}
      data-testid="marketing-contextual-assistant"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700 dark:text-violet-300">{copy.eyebrow}</p>
          <h2 id={`${id}-heading`} className="mt-1 text-lg font-bold text-[rgb(var(--fg))] sm:text-xl">{headline}</h2>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{body}</p>
        </div>
        <span className="rounded-full border border-violet-300 bg-white/70 px-3 py-1 text-xs font-semibold text-violet-800 dark:bg-violet-950/30 dark:text-violet-200">{copy.mode}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
        <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-100">{copy.inventory}</span>
        <span className="rounded-full border border-violet-200 bg-white/70 px-3 py-1 text-violet-900 dark:bg-violet-950/20 dark:text-violet-100">
          {copy.recommendationConfidence}: {copy.confidence[confidence]}
        </span>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">{copy.nextActions}</h3>
        {model.actions.length ? (
          <div className="mt-2 divide-y divide-violet-200 overflow-hidden rounded-2xl border border-violet-200 bg-white/75 dark:divide-violet-400/20 dark:border-violet-400/30 dark:bg-violet-950/20">
            {model.actions.map((action) => (
              <Link
                key={action.id}
                href={withLocale(action.href, locale)}
                className="group grid gap-1 px-4 py-3 transition hover:bg-violet-100/70 dark:hover:bg-violet-400/10 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-4"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.1em] text-violet-700 dark:text-violet-300">
                  {locale === "de" ? `Schritt ${action.priority}` : `Step ${action.priority}`}
                </span>
                <span>
                  <strong className="block text-sm text-[rgb(var(--fg))]">{locale === "de" ? action.titleDe : action.titleEn}</strong>
                  <span className="mt-0.5 block text-xs leading-5 text-[rgb(var(--muted))]">{locale === "de" ? action.rationaleDe : action.rationaleEn}</span>
                </span>
                <span className="text-sm font-semibold text-violet-800 group-hover:underline dark:text-violet-200">{copy.open} →</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">{copy.noActions}</p>
        )}
      </div>

      <details className="mt-4 rounded-2xl border border-violet-200 bg-white/60 p-3 dark:border-violet-400/30 dark:bg-violet-950/20">
        <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">{copy.why}</summary>
        <p className="mt-3 text-xs leading-5 text-[rgb(var(--muted))]">{copy.confidenceReason[confidence]}</p>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
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
            ) : <p className="mt-2 text-sm text-[rgb(var(--muted))]">—</p>}
          </div>
        </div>
      </details>

      <p className="mt-3 text-xs leading-5 text-[rgb(var(--muted))]">{copy.noAutomation}</p>
    </section>
  );
}

function recommendationConfidence(quality: MarketingDataQuality, confidence: number): "low" | "medium" | "high" {
  if (quality === "verified" && confidence >= 0.8) return "high";
  if ((quality === "partial" || quality === "estimated") && confidence >= 0.5) return "medium";
  return "low";
}

function withLocale(href: string, locale: UiLocale) {
  const [pathAndQuery, hash] = href.split("#", 2);
  const separator = pathAndQuery.includes("?") ? "&" : "?";
  return `${pathAndQuery}${separator}lang=${locale}${hash ? `#${hash}` : ""}`;
}
