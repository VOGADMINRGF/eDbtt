import Link from "next/link";
import { buildMarketingRegistryReadModel } from "@/features/marketing/registry/readModel";
import type {
  MarketingCampaign,
  MarketingOpportunity,
} from "@/features/marketing/registry/contracts";

export const metadata = {
  title: "Marketing · Admin · eDebatte",
};

type UiLocale = "de" | "en";
type MarketingView = "all" | "ready" | "decision" | "proof" | "blocked" | "published";

type PageProps = {
  searchParams?: Promise<{
    lang?: string | string[];
    view?: string | string[];
    campaign?: string | string[];
    opportunity?: string | string[];
  }>;
};

const COPY = {
  de: {
    eyebrow: "Admin · Marketing",
    title: "Marketing-Zentrale",
    intro:
      "Hier siehst du, was als Nächstes sinnvoll ist, welche Entscheidungen fehlen und welche Kampagnen bereits echte Ergebnisse liefern.",
    guardrail: "Veröffentlichungen und Budgets bleiben immer freigabepflichtig.",
    overview: "Übersicht",
    campaigns: "Kampagnen",
    opportunities: "Chancen",
    results: "Ergebnisse",
    ready: "Bereit zur Umsetzung",
    readyNote: "Kampagnen mit geklärtem Ziel und CTA",
    decisions: "Deine Entscheidung nötig",
    decisionsNote: "Angebot, Zielseite, Recht oder Governance",
    proof: "Beleg fehlt",
    proofNote: "Produkt-, Laufzeit- oder Quellenbeleg offen",
    published: "Veröffentlicht",
    publishedNote: "Nur real belegte Ausspielungen",
    today: "Heute wichtig",
    todayIntro: "Die wichtigsten nächsten Schritte – nicht die gesamte technische Registry.",
    open: "Öffnen",
    showAll: "Alle Kampagnen",
    noPriority: "Aktuell gibt es keinen dringenden Marketingpunkt.",
    campaignOverview: "Kampagnenübersicht",
    campaignIntro: "Filtere über die Kennzahlen oben oder öffne eine Kampagne für die Details.",
    all: "Alle",
    blocked: "Blockiert",
    publishedFilter: "Veröffentlicht",
    nextStep: "Nächster sinnvoller Schritt",
    audience: "Zielgruppe",
    materials: "Materialien",
    materialCount: "vorhanden",
    noMaterial: "noch keine Materialien",
    details: "Details ansehen",
    selectedCampaign: "Kampagnendetails",
    primaryCta: "Zielaktion",
    blockers: "Was noch fehlt",
    noBlockers: "Keine offenen Blocker",
    availableAssets: "Vorhandene Materialien",
    noAssets: "Noch keine Materialien angelegt.",
    publicTarget: "Zielseite öffnen",
    opportunityIntro:
      "Chancen werden nach Nutzen und Umsetzbarkeit erklärt – technische Statuscodes bleiben nachrangig.",
    recommendedAction: "Empfohlene Aktion",
    linkedCampaigns: "Verknüpfte Kampagnen",
    resultIntro: "Hier erscheinen ausschließlich reale Ausspielungen und später deren belegte Kennzahlen.",
    noResultsTitle: "Noch keine Kampagne veröffentlicht",
    noResults:
      "Es werden bewusst keine Demo-Zahlen gezeigt. Sobald eine Kampagne real ausgespielt wurde, erscheinen hier Kanal, Link, Zeitpunkt und anschließend belastbare Ergebnisse.",
    channel: "Kanal",
    publishedAt: "Veröffentlicht am",
    openResult: "Ergebnis öffnen",
    backAdmin: "Admin-Übersicht",
    toRadar: "Themenradar",
    toCampaigns: "Beteiligungskampagnen",
    german: "Deutsch",
    english: "English",
  },
  en: {
    eyebrow: "Admin · Marketing",
    title: "Marketing centre",
    intro:
      "See what matters next, which decisions are missing and which campaigns already produce verified results.",
    guardrail: "Publishing and budgets always require explicit approval.",
    overview: "Overview",
    campaigns: "Campaigns",
    opportunities: "Opportunities",
    results: "Results",
    ready: "Ready to execute",
    readyNote: "Campaigns with a clear goal and CTA",
    decisions: "Your decision required",
    decisionsNote: "Offer, route, legal or governance",
    proof: "Proof missing",
    proofNote: "Product, runtime or source proof is open",
    published: "Published",
    publishedNote: "Verified distributions only",
    today: "Important today",
    todayIntro: "The most relevant next steps, not the entire technical registry.",
    open: "Open",
    showAll: "All campaigns",
    noPriority: "There is no urgent marketing item at the moment.",
    campaignOverview: "Campaign overview",
    campaignIntro: "Use the metrics above as filters or open a campaign for details.",
    all: "All",
    blocked: "Blocked",
    publishedFilter: "Published",
    nextStep: "Next meaningful step",
    audience: "Audience",
    materials: "Materials",
    materialCount: "available",
    noMaterial: "no materials yet",
    details: "View details",
    selectedCampaign: "Campaign details",
    primaryCta: "Target action",
    blockers: "What is missing",
    noBlockers: "No open blockers",
    availableAssets: "Available materials",
    noAssets: "No materials have been created yet.",
    publicTarget: "Open target page",
    opportunityIntro:
      "Opportunities are explained by value and feasibility while technical status codes remain secondary.",
    recommendedAction: "Recommended action",
    linkedCampaigns: "Linked campaigns",
    resultIntro: "Only real distributions and later their verified metrics appear here.",
    noResultsTitle: "No campaign has been published yet",
    noResults:
      "No demo metrics are shown. Once a campaign is actually distributed, channel, link and time appear here, followed by verified results.",
    channel: "Channel",
    publishedAt: "Published at",
    openResult: "Open result",
    backAdmin: "Admin overview",
    toRadar: "Topic radar",
    toCampaigns: "Participation campaigns",
    german: "Deutsch",
    english: "English",
  },
} as const;

const DECISION_READINESS = new Set([
  "governance_decision_required",
  "offer_decision_required",
  "routing_decision_required",
  "legal_review_required",
  "translation_review_required",
]);

const PROOF_READINESS = new Set(["product_proof_required", "runtime_proof_required"]);

export default async function MarketingAdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const locale = normalizeLocale(params?.lang);
  const copy = COPY[locale];
  const view = normalizeView(params?.view);
  const selectedCampaignId = first(params?.campaign);
  const selectedOpportunityId = first(params?.opportunity);
  const readModel = buildMarketingRegistryReadModel();
  const publishedCampaignIds = new Set(
    readModel.distributionRecords
      .filter((record) => record.status === "published")
      .map((record) => record.campaignId),
  );
  const readyCampaigns = readModel.campaigns.filter(isReadyCampaign);
  const decisionCampaigns = readModel.campaigns.filter(requiresDecision);
  const proofCampaigns = readModel.campaigns.filter(requiresProof);
  const filteredCampaigns = readModel.campaigns.filter((campaign) =>
    campaignMatchesView(campaign, view, publishedCampaignIds),
  );
  const selectedCampaign = readModel.campaigns.find((campaign) => campaign.id === selectedCampaignId) ?? null;
  const selectedOpportunity = readModel.opportunities.find((opportunity) => opportunity.id === selectedOpportunityId) ?? null;
  const priorityCampaigns = buildPriorityCampaigns(readModel.campaigns).slice(0, 5);
  const dateLocale = locale === "en" ? "en-GB" : "de-DE";

  return (
    <main className="space-y-8 pb-12" data-testid="admin-marketing-dashboard">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-[0_10px_28px_rgba(15,23,42,0.06)] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-4xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">{copy.eyebrow}</p>
            <h1 className="text-3xl font-bold text-[rgb(var(--fg))] sm:text-4xl">{copy.title}</h1>
            <p className="max-w-3xl text-sm leading-6 text-[rgb(var(--muted))] sm:text-base">{copy.intro}</p>
            <p className="inline-flex rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900 dark:border-emerald-300/40 dark:bg-emerald-400/10 dark:text-emerald-100">{copy.guardrail}</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <Link href={hrefFor("de", view)} className={languageLinkClass(locale === "de")} aria-current={locale === "de" ? "page" : undefined}>{copy.german}</Link>
            <Link href={hrefFor("en", view)} className={languageLinkClass(locale === "en")} aria-current={locale === "en" ? "page" : undefined}>{copy.english}</Link>
          </div>
        </div>
        <nav className="mt-6 flex flex-wrap gap-2" aria-label="Marketing navigation">
          <AnchorLink href="#overview" label={copy.overview} />
          <AnchorLink href="#campaigns" label={copy.campaigns} />
          <AnchorLink href="#opportunities" label={copy.opportunities} />
          <AnchorLink href="#results" label={copy.results} />
        </nav>
      </header>

      <section id="overview" className="scroll-mt-6 space-y-5" aria-labelledby="overview-heading">
        <SectionHeading id="overview-heading" title={copy.overview} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricLink href={`${hrefFor(locale, "ready")}#campaigns`} label={copy.ready} value={readyCampaigns.length} note={copy.readyNote} active={view === "ready"} tone="emerald" />
          <MetricLink href={`${hrefFor(locale, "decision")}#campaigns`} label={copy.decisions} value={decisionCampaigns.length} note={copy.decisionsNote} active={view === "decision"} tone="amber" />
          <MetricLink href={`${hrefFor(locale, "proof")}#campaigns`} label={copy.proof} value={proofCampaigns.length} note={copy.proofNote} active={view === "proof"} tone="rose" />
          <MetricLink href={`${hrefFor(locale, "published")}#results`} label={copy.published} value={publishedCampaignIds.size} note={copy.publishedNote} active={view === "published"} tone="violet" />
        </div>
      </section>

      <section className="space-y-4" aria-labelledby="today-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionHeading id="today-heading" title={copy.today} />
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">{copy.todayIntro}</p>
          </div>
          <Link href={`${hrefFor(locale, "all")}#campaigns`} className="text-sm font-semibold text-sky-700 hover:underline dark:text-sky-300">{copy.showAll}</Link>
        </div>
        {priorityCampaigns.length ? (
          <div className="grid gap-3">
            {priorityCampaigns.map((campaign) => {
              const action = actionForCampaign(campaign, locale);
              return (
                <article key={campaign.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-[rgb(var(--fg))]">{campaign.title}</h3>
                        <PlainStatusBadge label={campaignStatusLabel(campaign, locale)} tone={campaignTone(campaign)} />
                      </div>
                      <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">{nextActionForCampaign(campaign, locale)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link href={`${hrefFor(locale, view, { campaign: campaign.id })}#campaign-detail`} className="rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm font-semibold text-[rgb(var(--fg))] hover:border-sky-400">{copy.open}</Link>
                      <ActionLink href={action.href} label={action.label} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : <EmptyState title={copy.noPriority} body="" />}
      </section>

      <section id="campaigns" className="scroll-mt-6 space-y-5" aria-labelledby="campaigns-heading">
        <div>
          <SectionHeading id="campaigns-heading" title={copy.campaignOverview} />
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">{copy.campaignIntro}</p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Campaign filters">
          <FilterLink locale={locale} value="all" current={view} label={copy.all} count={readModel.campaigns.length} />
          <FilterLink locale={locale} value="ready" current={view} label={copy.ready} count={readyCampaigns.length} />
          <FilterLink locale={locale} value="decision" current={view} label={copy.decisions} count={decisionCampaigns.length} />
          <FilterLink locale={locale} value="proof" current={view} label={copy.proof} count={proofCampaigns.length} />
          <FilterLink locale={locale} value="blocked" current={view} label={copy.blocked} count={readModel.campaigns.filter((item) => item.status === "blocked").length} />
          <FilterLink locale={locale} value="published" current={view} label={copy.publishedFilter} count={publishedCampaignIds.size} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {filteredCampaigns.map((campaign) => {
            const action = actionForCampaign(campaign, locale);
            return (
              <article key={campaign.id} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-xl">
                    <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">{campaign.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{campaign.description}</p>
                  </div>
                  <PlainStatusBadge label={campaignStatusLabel(campaign, locale)} tone={campaignTone(campaign)} />
                </div>
                <dl className="mt-4 grid gap-3 rounded-2xl bg-[rgb(var(--bg))] p-4 text-sm sm:grid-cols-2">
                  <Definition label={copy.nextStep} value={nextActionForCampaign(campaign, locale)} humanizeValue={false} />
                  <Definition label={copy.audience} value={campaign.audienceKeys.map((item) => audienceLabel(item, locale)).join(", ")} humanizeValue={false} />
                  <Definition label={copy.materials} value={campaign.assetIds.length ? `${campaign.assetIds.length} ${copy.materialCount}` : copy.noMaterial} humanizeValue={false} />
                  <Definition label={copy.primaryCta} value={campaign.primaryCta.label} humanizeValue={false} />
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`${hrefFor(locale, view, { campaign: campaign.id })}#campaign-detail`} className="rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm font-semibold text-[rgb(var(--fg))] hover:border-sky-400">{copy.details}</Link>
                  <ActionLink href={action.href} label={action.label} />
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {selectedCampaign && (
        <section id="campaign-detail" className="scroll-mt-6 space-y-4 rounded-3xl border-2 border-sky-300 bg-sky-50/70 p-5 dark:border-sky-400/40 dark:bg-sky-400/10" aria-labelledby="campaign-detail-heading">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700 dark:text-sky-300">{copy.selectedCampaign}</p>
              <h2 id="campaign-detail-heading" className="mt-1 text-2xl font-bold text-[rgb(var(--fg))]">{selectedCampaign.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">{selectedCampaign.description}</p>
            </div>
            <PlainStatusBadge label={campaignStatusLabel(selectedCampaign, locale)} tone={campaignTone(selectedCampaign)} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <DetailPanel title={copy.nextStep} body={nextActionForCampaign(selectedCampaign, locale)} />
            <DetailPanel title={copy.primaryCta} body={selectedCampaign.primaryCta.label} />
            <DetailPanel title={copy.audience} body={selectedCampaign.audienceKeys.map((item) => audienceLabel(item, locale)).join(", ")} />
          </div>
          <div className="flex flex-wrap gap-2">
            <ActionLink href={actionForCampaign(selectedCampaign, locale).href} label={actionForCampaign(selectedCampaign, locale).label} />
            {selectedCampaign.primaryCta.url && <a href={selectedCampaign.primaryCta.url} target="_blank" rel="noreferrer" className="inline-flex rounded-xl border border-sky-300 px-4 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-50 dark:text-sky-200">{copy.publicTarget}</a>}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
              <h3 className="font-semibold text-[rgb(var(--fg))]">{copy.blockers}</h3>
              {selectedCampaign.blockerKeys.length ? (
                <ul className="mt-3 space-y-2 text-sm text-[rgb(var(--muted))]">
                  {selectedCampaign.blockerKeys.map((blocker) => <li key={blocker}>• {blockerLabel(blocker, locale)}</li>)}
                </ul>
              ) : <p className="mt-3 text-sm text-emerald-800 dark:text-emerald-200">{copy.noBlockers}</p>}
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
              <h3 className="font-semibold text-[rgb(var(--fg))]">{copy.availableAssets}</h3>
              {campaignAssets(selectedCampaign, readModel.assets).length ? (
                <ul className="mt-3 space-y-2 text-sm text-[rgb(var(--muted))]">
                  {campaignAssets(selectedCampaign, readModel.assets).map((asset) => (
                    <li key={asset.id} className="flex items-center justify-between gap-3">
                      <span>{asset.title}</span>
                      <PlainStatusBadge label={assetStatusLabel(asset.status, locale)} tone={asset.status === "approved" || asset.status === "published" ? "emerald" : asset.status === "review_ready" ? "sky" : "slate"} />
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-3 text-sm text-[rgb(var(--muted))]">{copy.noAssets}</p>}
            </div>
          </div>
        </section>
      )}

      <section id="opportunities" className="scroll-mt-6 space-y-5" aria-labelledby="opportunities-heading">
        <div>
          <SectionHeading id="opportunities-heading" title={copy.opportunities} />
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">{copy.opportunityIntro}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {readModel.opportunities.map((opportunity) => {
            const action = actionForOpportunity(opportunity, locale);
            return (
              <article key={opportunity.id} className={`rounded-3xl border bg-[rgb(var(--card))] p-5 ${selectedOpportunity?.id === opportunity.id ? "border-sky-400 ring-2 ring-sky-200" : "border-[rgb(var(--border))]"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-xl">
                    <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">{opportunity.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{opportunity.summary}</p>
                  </div>
                  <PlainStatusBadge label={opportunityStatusLabel(opportunity, locale)} tone={opportunityTone(opportunity)} />
                </div>
                <div className="mt-4 rounded-2xl bg-[rgb(var(--bg))] p-4 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--muted))]">{copy.recommendedAction}</p>
                  <p className="mt-1 font-medium leading-6 text-[rgb(var(--fg))]">{nextActionForOpportunity(opportunity, locale)}</p>
                  <p className="mt-3 text-xs text-[rgb(var(--muted))]">{copy.linkedCampaigns}: {opportunity.campaignIds.length}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`${hrefFor(locale, view, { opportunity: opportunity.id })}#opportunities`} className="rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-sm font-semibold text-[rgb(var(--fg))] hover:border-sky-400">{copy.details}</Link>
                  <ActionLink href={action.href} label={action.label} />
                </div>
                {selectedOpportunity?.id === opportunity.id && (
                  <details open className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 text-sm">
                    <summary className="cursor-pointer font-semibold text-[rgb(var(--fg))]">{copy.blockers}</summary>
                    <ul className="mt-3 space-y-2 text-[rgb(var(--muted))]">
                      {opportunity.blockerKeys.length
                        ? opportunity.blockerKeys.map((blocker) => <li key={blocker}>• {blockerLabel(blocker, locale)}</li>)
                        : <li>{copy.noBlockers}</li>}
                    </ul>
                  </details>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section id="results" className="scroll-mt-6 space-y-4" aria-labelledby="results-heading">
        <div>
          <SectionHeading id="results-heading" title={copy.results} />
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">{copy.resultIntro}</p>
        </div>
        {readModel.distributionRecords.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {readModel.distributionRecords.map((record) => {
              const campaign = readModel.campaigns.find((item) => item.id === record.campaignId);
              const asset = readModel.assets.find((item) => item.id === record.assetId);
              return (
                <article key={record.id} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
                  <h3 className="font-semibold text-[rgb(var(--fg))]">{campaign?.title ?? record.campaignId}</h3>
                  <p className="mt-1 text-sm text-[rgb(var(--muted))]">{asset?.title ?? record.assetId}</p>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <Definition label={copy.channel} value={record.channel} />
                    <Definition label={copy.publishedAt} value={record.publishedAt ? formatDate(record.publishedAt, dateLocale) : "—"} humanizeValue={false} />
                  </dl>
                  {record.publicUrl && <a href={record.publicUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex rounded-xl border border-sky-300 px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-50 dark:text-sky-200">{copy.openResult}</a>}
                </article>
              );
            })}
          </div>
        ) : <EmptyState title={copy.noResultsTitle} body={copy.noResults} />}
      </section>

      <footer className="flex flex-wrap gap-2 border-t border-[rgb(var(--border))] pt-5">
        <AdminLink href="/admin" label={copy.backAdmin} />
        <AdminLink href="/admin/themenradar" label={copy.toRadar} />
        <AdminLink href="/admin/campaigns" label={copy.toCampaigns} />
      </footer>
    </main>
  );
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeLocale(value: string | string[] | undefined): UiLocale {
  return first(value)?.toLowerCase().startsWith("en") ? "en" : "de";
}

function normalizeView(value: string | string[] | undefined): MarketingView {
  const candidate = first(value);
  return ["all", "ready", "decision", "proof", "blocked", "published"].includes(candidate ?? "")
    ? candidate as MarketingView
    : "all";
}

function hrefFor(locale: UiLocale, view: MarketingView, selection?: { campaign?: string; opportunity?: string }) {
  const params = new URLSearchParams({ lang: locale, view });
  if (selection?.campaign) params.set("campaign", selection.campaign);
  if (selection?.opportunity) params.set("opportunity", selection.opportunity);
  return `/admin/marketing?${params.toString()}`;
}

function isReadyCampaign(campaign: MarketingCampaign) {
  return campaign.readiness === "ready" && !["completed", "retired", "cancelled"].includes(campaign.status);
}

function requiresDecision(campaign: MarketingCampaign) {
  return DECISION_READINESS.has(campaign.readiness);
}

function requiresProof(campaign: MarketingCampaign) {
  return PROOF_READINESS.has(campaign.readiness);
}

function campaignMatchesView(campaign: MarketingCampaign, view: MarketingView, publishedCampaignIds: Set<string>) {
  switch (view) {
    case "ready": return isReadyCampaign(campaign);
    case "decision": return requiresDecision(campaign);
    case "proof": return requiresProof(campaign);
    case "blocked": return campaign.status === "blocked";
    case "published": return publishedCampaignIds.has(campaign.id);
    case "all":
    default: return true;
  }
}

function buildPriorityCampaigns(campaigns: MarketingCampaign[]) {
  return [...campaigns]
    .filter((campaign) => !["completed", "retired", "cancelled"].includes(campaign.status))
    .sort((left, right) => priorityScore(right) - priorityScore(left) || left.title.localeCompare(right.title));
}

function priorityScore(campaign: MarketingCampaign) {
  if (isReadyCampaign(campaign)) return 100;
  if (requiresDecision(campaign)) return 85;
  if (requiresProof(campaign)) return 70;
  if (campaign.status === "blocked") return 55;
  if (campaign.status === "planned" || campaign.status === "qualified") return 45;
  return 20;
}

function nextActionForCampaign(campaign: MarketingCampaign, locale: UiLocale) {
  const de: Record<string, string> = {
    ready: "Kampagnenbrief finalisieren, Materialien prüfen und zur Freigabe vorlegen.",
    product_proof_required: "Reale Produktansicht oder belastbaren Produktbeleg ergänzen.",
    runtime_proof_required: "Funktion erst praktisch belegen, bevor sie vermarktet wird.",
    governance_decision_required: "Grundsatzentscheidung treffen und dokumentieren.",
    offer_decision_required: "Leistungspaket, Zielgruppe und Angebot verbindlich festlegen.",
    routing_decision_required: "Zielseite und konkrete Zielaktion festlegen.",
    legal_review_required: "Rechtliche Aussagen und Zielseiten prüfen lassen.",
    translation_review_required: "Sprachvarianten fachlich und sprachlich prüfen.",
  };
  const en: Record<string, string> = {
    ready: "Finalise the campaign brief, review materials and submit for approval.",
    product_proof_required: "Add a real product surface or reliable product proof.",
    runtime_proof_required: "Prove the feature in practice before marketing it.",
    governance_decision_required: "Make and document the governance decision.",
    offer_decision_required: "Define the offer, audience and service package.",
    routing_decision_required: "Define the target page and concrete action.",
    legal_review_required: "Review legal claims and target pages.",
    translation_review_required: "Review language variants professionally.",
  };
  return (locale === "de" ? de : en)[campaign.readiness] ?? humanize(campaign.readiness);
}

function nextActionForOpportunity(opportunity: MarketingOpportunity, locale: UiLocale) {
  if (opportunity.marketability === "review_ready") return locale === "de" ? "Kampagnenbrief erstellen und zur fachlichen Prüfung vorlegen." : "Create a campaign brief and submit it for professional review.";
  if (opportunity.marketability === "proof_required") return locale === "de" ? "Realen Produktbeleg und verwendbare Screens oder Beispiele ergänzen." : "Add real product proof and usable screens or examples.";
  if (opportunity.marketability === "concept_only" || opportunity.marketability === "preview_only") return locale === "de" ? "Nutzen, Zielgruppe und Produktreife weiter klären; noch nicht öffentlich bewerben." : "Clarify value, audience and product maturity; do not market publicly yet.";
  if (opportunity.marketability === "publicly_marketable") return locale === "de" ? "Passende Kampagne auswählen und konkrete Ausspielung vorbereiten." : "Select a suitable campaign and prepare a concrete distribution.";
  return locale === "de" ? "Erst nach Evidenz- und Produktprüfung weiterbearbeiten." : "Continue only after evidence and product review.";
}

function actionForCampaign(campaign: MarketingCampaign, locale: UiLocale) {
  if (campaign.readiness === "ready") return { href: "/admin/editorial/queue", label: locale === "de" ? "Zur Prüfung weitergeben" : "Hand off for review" };
  if (requiresProof(campaign)) return { href: "/admin/evidence/items", label: locale === "de" ? "An Evidence weitergeben" : "Hand off to evidence" };
  if (campaign.readiness === "translation_review_required") return { href: "/admin/review", label: locale === "de" ? "Zur Sprachprüfung" : "Open language review" };
  if (campaign.status === "idea" || campaign.status === "qualified") return { href: "/admin/research/tasks", label: locale === "de" ? "An Recherche weitergeben" : "Hand off to research" };
  return { href: "/admin/review", label: locale === "de" ? "Im Review klären" : "Clarify in review" };
}

function actionForOpportunity(opportunity: MarketingOpportunity, locale: UiLocale) {
  if (opportunity.marketability === "proof_required") return { href: "/admin/evidence/items", label: locale === "de" ? "An Evidence weitergeben" : "Hand off to evidence" };
  if (opportunity.marketability === "review_ready" || opportunity.marketability === "publicly_marketable") return { href: "/admin/editorial/queue", label: locale === "de" ? "Zur Inhaltsprüfung" : "Open content review" };
  return { href: "/admin/research/tasks", label: locale === "de" ? "An Recherche weitergeben" : "Hand off to research" };
}

function campaignStatusLabel(campaign: MarketingCampaign, locale: UiLocale) {
  if (campaign.readiness === "ready") return locale === "de" ? "Bereit zur Umsetzung" : "Ready to execute";
  if (requiresDecision(campaign)) return locale === "de" ? "Entscheidung nötig" : "Decision required";
  if (requiresProof(campaign)) return locale === "de" ? "Beleg fehlt" : "Proof missing";
  const labels: Record<UiLocale, Record<string, string>> = {
    de: { idea: "Idee", qualified: "Vorbereitet", planned: "Geplant", in_production: "In Erstellung", review_ready: "Zur Prüfung", approved: "Freigegeben", scheduled: "Eingeplant", active: "Aktiv", paused: "Pausiert", blocked: "Blockiert", completed: "Abgeschlossen", retired: "Beendet", cancelled: "Abgebrochen" },
    en: { idea: "Idea", qualified: "Qualified", planned: "Planned", in_production: "In production", review_ready: "Ready for review", approved: "Approved", scheduled: "Scheduled", active: "Active", paused: "Paused", blocked: "Blocked", completed: "Completed", retired: "Retired", cancelled: "Cancelled" },
  };
  return labels[locale][campaign.status] ?? humanize(campaign.status);
}

function campaignTone(campaign: MarketingCampaign): Tone {
  if (campaign.readiness === "ready") return "emerald";
  if (requiresDecision(campaign)) return "amber";
  if (campaign.status === "blocked" || requiresProof(campaign)) return "rose";
  return "sky";
}

function opportunityStatusLabel(opportunity: MarketingOpportunity, locale: UiLocale) {
  const labels: Record<UiLocale, Record<string, string>> = {
    de: { publicly_marketable: "Öffentlich nutzbar", review_ready: "Zur Prüfung bereit", proof_required: "Beleg fehlt", preview_only: "Nur Vorschau", concept_only: "Konzept", not_marketable: "Nicht vermarktbar", retired: "Beendet" },
    en: { publicly_marketable: "Publicly marketable", review_ready: "Ready for review", proof_required: "Proof missing", preview_only: "Preview only", concept_only: "Concept", not_marketable: "Not marketable", retired: "Retired" },
  };
  return labels[locale][opportunity.marketability] ?? humanize(opportunity.marketability);
}

function opportunityTone(opportunity: MarketingOpportunity): Tone {
  if (opportunity.marketability === "publicly_marketable" || opportunity.marketability === "review_ready") return "emerald";
  if (opportunity.marketability === "proof_required") return "amber";
  if (opportunity.marketability === "not_marketable") return "rose";
  return "sky";
}

function blockerLabel(blocker: string, locale: UiLocale) {
  const labels: Record<UiLocale, Record<string, string>> = {
    de: {
      "real-product-screens-required": "Reale Produktscreenshots oder Produktbelege fehlen",
      "runtime-proof-required": "Die Funktion muss praktisch belegt werden",
      "translation-review-required": "Sprachvarianten müssen geprüft werden",
      "offer-decision-required": "Angebot und Leistungspaket müssen entschieden werden",
      "legal-review-required": "Rechtliche Prüfung fehlt",
      "routing-decision-required": "Zielseite und Zielaktion fehlen",
      "tenant-model-required": "Mandanten- und White-Label-Modell ist offen",
      "product-proof-required": "Produktbeleg fehlt",
      "real-source-surface-required": "Eine reale Quellenansicht fehlt",
      "registry-readmodel-required": "Die operative Marketing-Grundlage muss geprüft werden",
      "source-provider-decision-required": "Quellen- und Providerregeln müssen entschieden werden",
    },
    en: {
      "real-product-screens-required": "Real product screens or product proof are missing",
      "runtime-proof-required": "The feature must be proven in practice",
      "translation-review-required": "Language variants require review",
      "offer-decision-required": "Offer and service package require a decision",
      "legal-review-required": "Legal review is missing",
      "routing-decision-required": "Target page and action are missing",
      "tenant-model-required": "Tenant and white-label model are open",
      "product-proof-required": "Product proof is missing",
      "real-source-surface-required": "A real source surface is missing",
      "registry-readmodel-required": "The operating marketing foundation requires review",
      "source-provider-decision-required": "Source and provider rules require a decision",
    },
  };
  return labels[locale][blocker] ?? humanize(blocker);
}

function audienceLabel(audience: string, locale: UiLocale) {
  const de: Record<string, string> = {
    citizens: "Bürgerinnen und Bürger", public: "Öffentlichkeit", community: "Community", "editorial-teams": "Redaktionen", initiatives: "Initiativen", "social-audiences": "Social-Media-Zielgruppen", media: "Medien", science: "Wissenschaft", municipalities: "Kommunen", "public-administration": "Verwaltungen", associations: "Verbände und Vereine", ngos: "NGOs", organizations: "Organisationen", partners: "Partner", "individual-members": "Einzelmitglieder", "mission-supporters": "Unterstützende", "multilingual-users": "Mehrsprachige Nutzer", "international-communities": "Internationale Communities", operators: "Betreiber", "technology-partners": "Technologiepartner", "open-source-partners": "Open-Source-Partner", "research-institutes": "Forschungseinrichtungen" };
  return locale === "de" ? (de[audience] ?? humanize(audience)) : humanize(audience);
}

function assetStatusLabel(status: string, locale: UiLocale) {
  const labels: Record<UiLocale, Record<string, string>> = {
    de: { draft: "Entwurf", review_ready: "Zur Prüfung", approved: "Freigegeben", published: "Veröffentlicht", retired: "Beendet" },
    en: { draft: "Draft", review_ready: "Ready for review", approved: "Approved", published: "Published", retired: "Retired" },
  };
  return labels[locale][status] ?? humanize(status);
}

function campaignAssets(campaign: MarketingCampaign, assets: ReturnType<typeof buildMarketingRegistryReadModel>["assets"]) {
  return assets.filter((asset) => campaign.assetIds.includes(asset.id));
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function languageLinkClass(active: boolean) {
  return `rounded-full border px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${active ? "border-sky-400 bg-sky-100 text-sky-950 dark:bg-sky-400/20 dark:text-sky-50" : "border-[rgb(var(--border))] text-[rgb(var(--fg))] hover:border-sky-400"}`;
}

type Tone = "emerald" | "amber" | "sky" | "rose" | "violet" | "slate";

function toneClass(tone: Tone) {
  const tones: Record<Tone, string> = {
    emerald: "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-300/40 dark:bg-emerald-400/10 dark:text-emerald-100",
    amber: "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-300/40 dark:bg-amber-400/10 dark:text-amber-100",
    sky: "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-300/40 dark:bg-sky-400/10 dark:text-sky-100",
    rose: "border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-300/40 dark:bg-rose-400/10 dark:text-rose-100",
    violet: "border-violet-300 bg-violet-50 text-violet-950 dark:border-violet-300/40 dark:bg-violet-400/10 dark:text-violet-100",
    slate: "border-slate-300 bg-slate-50 text-slate-900 dark:border-slate-500 dark:bg-slate-700/30 dark:text-slate-100",
  };
  return tones[tone];
}

function SectionHeading({ id, title }: { id: string; title: string }) {
  return <h2 id={id} className="text-xl font-bold text-[rgb(var(--fg))] sm:text-2xl">{title}</h2>;
}

function AnchorLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--fg))] hover:border-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">{label}</Link>;
}

function MetricLink({ href, label, value, note, active, tone }: { href: string; label: string; value: number; note: string; active: boolean; tone: Tone }) {
  return (
    <Link href={href} className={`rounded-3xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${active ? toneClass(tone) : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))]"}`}>
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-3 text-4xl font-bold">{value}</p>
      <p className={`mt-2 text-xs leading-5 ${active ? "opacity-80" : "text-[rgb(var(--muted))]"}`}>{note}</p>
    </Link>
  );
}

function FilterLink({ locale, value, current, label, count }: { locale: UiLocale; value: MarketingView; current: MarketingView; label: string; count: number }) {
  const active = value === current;
  return <Link href={`${hrefFor(locale, value)}#campaigns`} aria-current={active ? "page" : undefined} className={`rounded-full border px-3 py-2 text-sm font-semibold ${active ? "border-sky-500 bg-sky-100 text-sky-950 dark:bg-sky-400/20 dark:text-sky-50" : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))] hover:border-sky-400"}`}>{label} <span className="ml-1 opacity-70">{count}</span></Link>;
}

function ActionLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="rounded-xl bg-sky-700 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">{label}</Link>;
}

function PlainStatusBadge({ label, tone }: { label: string; tone: Tone }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass(tone)}`}>{label}</span>;
}

function Definition({ label, value, humanizeValue = true }: { label: string; value: string; humanizeValue?: boolean }) {
  return <div><dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--muted))]">{label}</dt><dd className="mt-1 break-words font-medium leading-6 text-[rgb(var(--fg))]">{humanizeValue ? humanize(value) : value}</dd></div>;
}

function DetailPanel({ title, body }: { title: string; body: string }) {
  return <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--muted))]">{title}</p><p className="mt-2 text-sm font-medium leading-6 text-[rgb(var(--fg))]">{body}</p></article>;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return <div className="rounded-3xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 text-center"><h3 className="font-semibold text-[rgb(var(--fg))]">{title}</h3>{body && <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[rgb(var(--muted))]">{body}</p>}</div>;
}

function AdminLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] hover:border-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">{label}</Link>;
}

function humanize(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}
