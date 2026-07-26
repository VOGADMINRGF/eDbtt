import Link from "next/link";
import { buildMarketingRegistryReadModel } from "@/features/marketing/registry/readModel";

export const metadata = {
  title: "Marketing Registry · Admin · eDebatte",
};

type PageProps = {
  searchParams?: Promise<{ lang?: string | string[] }>;
};

type UiLocale = "de" | "en";

const COPY = {
  de: {
    eyebrow: "Admin · Marketing Control Plane",
    title: "Marketing Registry",
    intro:
      "Zentrale, ausschließlich lesende Sicht auf Marketingchancen, Kampagnen, Assets, Evidenz und Brandprofile. Beteiligungskampagnen bleiben unter /admin/campaigns getrennt.",
    readOnly: "read_only · keine Freigabe-, Upload- oder Publishing-Aktion",
    overview: "Übersicht",
    opportunities: "Opportunities",
    campaigns: "Marketingkampagnen",
    assets: "Assets",
    brands: "Brandprofile",
    evidence: "Aktuelle Evidenz",
    blockers: "Blocker",
    sources: "Registry-Quellen",
    totalOpportunities: "Opportunities",
    totalCampaigns: "Marketingkampagnen",
    totalAssets: "Assets",
    totalBrands: "Brandprofile",
    distributions: "Belegte Ausspielungen",
    approvedUndistributed: "Freigegeben, nicht verteilt",
    marketability: "Marketingfähigkeit",
    lifecycle: "Lifecycle",
    approval: "Freigabestatus",
    targetGroups: "Zielgruppen",
    productProof: "Produktbeleg",
    route: "Route",
    cta: "CTA",
    linkedCampaigns: "Kampagnen",
    linkedAssets: "Assets",
    readiness: "Readiness",
    primaryCta: "Primärer CTA",
    brand: "Brandprofil",
    locale: "Sprache",
    version: "Version",
    source: "Quelle",
    publicPath: "Public-Pfad",
    noPublicPath: "kein realer Export/Public-Pfad",
    logo: "Logo",
    tokens: "Tokens",
    legalTargets: "Rechtsziele",
    voxy: "Voxy",
    lastVerified: "Verifiziert",
    noDistribution:
      "Es bestehen noch keine belegten DistributionRecords. Erstellte oder freigegebene Assets werden deshalb nicht als veröffentlicht dargestellt.",
    backAdmin: "Admin Dashboard",
    toRadar: "VOG Themenradar",
    toCampaigns: "Beteiligungskampagnen",
    english: "English",
    german: "Deutsch",
  },
  en: {
    eyebrow: "Admin · Marketing Control Plane",
    title: "Marketing Registry",
    intro:
      "Central read-only view of marketing opportunities, campaigns, assets, evidence and brand profiles. Participation campaigns remain separate under /admin/campaigns.",
    readOnly: "read_only · no approval, upload or publishing action",
    overview: "Overview",
    opportunities: "Opportunities",
    campaigns: "Marketing campaigns",
    assets: "Assets",
    brands: "Brand profiles",
    evidence: "Recent evidence",
    blockers: "Blockers",
    sources: "Registry sources",
    totalOpportunities: "Opportunities",
    totalCampaigns: "Marketing campaigns",
    totalAssets: "Assets",
    totalBrands: "Brand profiles",
    distributions: "Verified distributions",
    approvedUndistributed: "Approved, not distributed",
    marketability: "Marketability",
    lifecycle: "Lifecycle",
    approval: "Approval status",
    targetGroups: "Audiences",
    productProof: "Product proof",
    route: "Route",
    cta: "CTA",
    linkedCampaigns: "Campaigns",
    linkedAssets: "Assets",
    readiness: "Readiness",
    primaryCta: "Primary CTA",
    brand: "Brand profile",
    locale: "Locale",
    version: "Version",
    source: "Source",
    publicPath: "Public path",
    noPublicPath: "no real export/public path",
    logo: "Logo",
    tokens: "Tokens",
    legalTargets: "Legal targets",
    voxy: "Voxy",
    lastVerified: "Verified",
    noDistribution:
      "There are no verified DistributionRecords yet. Created or approved assets are therefore not presented as published.",
    backAdmin: "Admin dashboard",
    toRadar: "VOG topic radar",
    toCampaigns: "Participation campaigns",
    english: "English",
    german: "Deutsch",
  },
} as const;

export default async function MarketingAdminPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const locale: UiLocale = normalizeLocale(params?.lang);
  const copy = COPY[locale];
  const readModel = buildMarketingRegistryReadModel();
  const dateLocale = locale === "en" ? "en-GB" : "de-DE";

  return (
    <main className="space-y-6 pb-10" data-testid="admin-marketing-registry" data-mode={readModel.mode}>
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-[0_10px_28px_rgba(15,23,42,0.06)] sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-4xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">
              {copy.eyebrow}
            </p>
            <h1 className="text-3xl font-bold text-[rgb(var(--fg))]">{copy.title}</h1>
            <p className="text-sm leading-6 text-[rgb(var(--muted))]">{copy.intro}</p>
            <span className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 dark:border-amber-300/40 dark:bg-amber-400/10 dark:text-amber-100">
              {copy.readOnly}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <Link
              href="/admin/marketing?lang=de"
              className={languageLinkClass(locale === "de")}
              aria-current={locale === "de" ? "page" : undefined}
            >
              {copy.german}
            </Link>
            <Link
              href="/admin/marketing?lang=en"
              className={languageLinkClass(locale === "en")}
              aria-current={locale === "en" ? "page" : undefined}
            >
              {copy.english}
            </Link>
          </div>
        </div>

        <nav className="mt-5 flex flex-wrap gap-2" aria-label="Marketing Registry navigation">
          {[
            ["#overview", copy.overview],
            ["#opportunities", copy.opportunities],
            ["#campaigns", copy.campaigns],
            ["#assets", copy.assets],
            ["#brands", copy.brands],
          ].map(([href, label]) => (
            <Link key={href} href={href} className="rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--fg))] hover:border-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <section id="overview" className="scroll-mt-6 space-y-4" aria-labelledby="overview-heading">
        <SectionHeading id="overview-heading" title={copy.overview} />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <MetricCard label={copy.totalOpportunities} value={readModel.summary.totalOpportunities} />
          <MetricCard label={copy.totalCampaigns} value={readModel.summary.totalCampaigns} />
          <MetricCard label={copy.totalAssets} value={readModel.summary.totalAssets} />
          <MetricCard label={copy.totalBrands} value={readModel.summary.totalBrands} />
          <MetricCard label={copy.distributions} value={readModel.summary.distributionRecords} />
          <MetricCard label={copy.approvedUndistributed} value={readModel.summary.approvedButUndistributedAssets} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <CountPanel title={copy.marketability} rows={readModel.summary.opportunitiesByMarketability} />
          <CountPanel title={copy.lifecycle} rows={readModel.summary.campaignsByStatus} />
          <CountPanel title={copy.approval} rows={readModel.summary.assetsByStatus} />
          <CountPanel title={copy.blockers} rows={readModel.summary.blockersByKey} emptyLabel="—" />
        </div>

        {readModel.summary.distributionRecords === 0 && (
          <aside className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950 dark:border-sky-300/30 dark:bg-sky-400/10 dark:text-sky-100">
            {copy.noDistribution}
          </aside>
        )}
      </section>

      <section id="opportunities" className="scroll-mt-6 space-y-4" aria-labelledby="opportunities-heading">
        <SectionHeading id="opportunities-heading" title={copy.opportunities} />
        <div className="grid gap-4 xl:grid-cols-2">
          {readModel.opportunities.map((opportunity) => (
            <article key={opportunity.id} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{opportunity.id}</p>
                  <h3 className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">{opportunity.title}</h3>
                </div>
                <StatusBadge value={opportunity.marketability} />
              </div>
              <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">{opportunity.summary}</p>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <Definition label={copy.productProof} value={opportunity.productProofStatus} />
                <Definition label={copy.route} value={opportunity.routeStatus} />
                <Definition label={copy.cta} value={opportunity.ctaStatus} />
              </dl>
              <TagBlock label={copy.targetGroups} values={opportunity.audienceKeys} />
              <TagBlock label={copy.blockers} values={opportunity.blockerKeys} empty="—" />
              <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
                <ReferenceList label={copy.linkedCampaigns} values={opportunity.campaignIds} />
                <ReferenceList label={copy.linkedAssets} values={opportunity.assetIds} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="campaigns" className="scroll-mt-6 space-y-4" aria-labelledby="campaigns-heading">
        <SectionHeading id="campaigns-heading" title={copy.campaigns} />
        <div className="overflow-x-auto rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="border-b border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">{copy.campaigns}</th>
                <th className="px-4 py-3">{copy.lifecycle}</th>
                <th className="px-4 py-3">{copy.readiness}</th>
                <th className="px-4 py-3">{copy.primaryCta}</th>
                <th className="px-4 py-3">{copy.assets}</th>
                <th className="px-4 py-3">{copy.blockers}</th>
              </tr>
            </thead>
            <tbody>
              {readModel.campaigns.map((campaign) => (
                <tr key={campaign.id} className="border-b border-[rgb(var(--border))] last:border-0 align-top">
                  <td className="px-4 py-4 font-mono text-xs text-[rgb(var(--muted))]">{campaign.id}</td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-[rgb(var(--fg))]">{campaign.title}</p>
                    <p className="mt-1 max-w-md text-xs leading-5 text-[rgb(var(--muted))]">{campaign.description}</p>
                  </td>
                  <td className="px-4 py-4"><StatusBadge value={campaign.status} /></td>
                  <td className="px-4 py-4"><StatusBadge value={campaign.readiness} /></td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-[rgb(var(--fg))]">{campaign.primaryCta.label}</p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">{humanize(campaign.primaryCta.status)}</p>
                  </td>
                  <td className="px-4 py-4 text-xs text-[rgb(var(--fg))]">{campaign.assetIds.length ? campaign.assetIds.join(", ") : "—"}</td>
                  <td className="px-4 py-4 text-xs text-[rgb(var(--muted))]">{campaign.blockerKeys.length ? campaign.blockerKeys.join(", ") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="assets" className="scroll-mt-6 space-y-4" aria-labelledby="assets-heading">
        <SectionHeading id="assets-heading" title={copy.assets} />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {readModel.assets.map((asset) => (
            <article key={asset.id} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-[rgb(var(--muted))]">{asset.id}</p>
                  <h3 className="mt-1 font-semibold text-[rgb(var(--fg))]">{asset.title}</h3>
                </div>
                <StatusBadge value={asset.status} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Definition label={copy.locale} value={asset.locale} />
                <Definition label={copy.version} value={`v${asset.version}`} />
                <Definition label={copy.brand} value={asset.brandProfileId} />
                <Definition label={copy.lifecycle} value={asset.assetType} />
              </dl>
              <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-xs leading-5">
                <p className="font-semibold text-[rgb(var(--fg))]">{copy.source}</p>
                <p className="mt-1 break-all text-[rgb(var(--muted))]">{asset.sourcePath}</p>
                <p className="mt-3 font-semibold text-[rgb(var(--fg))]">{copy.publicPath}</p>
                <p className="mt-1 break-all text-[rgb(var(--muted))]">{asset.publicPath ?? copy.noPublicPath}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="brands" className="scroll-mt-6 space-y-4" aria-labelledby="brands-heading">
        <SectionHeading id="brands-heading" title={copy.brands} />
        <div className="grid gap-4 lg:grid-cols-2">
          {readModel.brandProfiles.map((brand) => (
            <article key={brand.id} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs text-[rgb(var(--muted))]">{brand.id}</p>
                  <h3 className="mt-1 text-lg font-semibold text-[rgb(var(--fg))]">{brand.displayName}</h3>
                </div>
                <StatusBadge value={brand.status} />
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <Definition label={copy.logo} value={brand.logoStatus} />
                <Definition label={copy.tokens} value={brand.tokenStatus} />
                <Definition label={copy.legalTargets} value={brand.legalTargetStatus} />
                <Definition label={copy.voxy} value={brand.voxyMode} />
                <Definition label={copy.locale} value={brand.locales.join(", ")} />
                <Definition label={copy.version} value={`v${brand.version}`} />
              </dl>
              <p className="mt-4 break-all text-xs text-[rgb(var(--muted))]">{brand.sourcePath}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-3">
          <SectionHeading id="evidence-heading" title={copy.evidence} />
          <div className="space-y-3">
            {readModel.recentEvidence.map((row) => (
              <article key={`${row.opportunityId}:${row.ref}`} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-semibold text-[rgb(var(--fg))]">{row.opportunityTitle}</p>
                  <StatusBadge value={row.status} />
                </div>
                <p className="mt-2 break-all font-mono text-xs text-[rgb(var(--muted))]">{row.ref}</p>
                {row.note && <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">{row.note}</p>}
                <p className="mt-2 text-[11px] text-[rgb(var(--muted))]">
                  {copy.lastVerified}: {row.verifiedAt ? new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(row.verifiedAt)) : "—"}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <SectionHeading id="sources-heading" title={copy.sources} />
          <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
            <ul className="space-y-2 text-xs text-[rgb(var(--muted))]">
              {readModel.sourcePaths.map((source) => (
                <li key={source} className="break-all rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 font-mono">
                  {source}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="flex flex-wrap gap-2 border-t border-[rgb(var(--border))] pt-5">
        <AdminLink href="/admin" label={copy.backAdmin} />
        <AdminLink href="/admin/themenradar" label={copy.toRadar} />
        <AdminLink href="/admin/campaigns" label={copy.toCampaigns} />
      </footer>
    </main>
  );
}

function normalizeLocale(value: string | string[] | undefined): UiLocale {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate?.toLowerCase().startsWith("en") ? "en" : "de";
}

function languageLinkClass(active: boolean) {
  return `rounded-full border px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
    active
      ? "border-sky-400 bg-sky-100 text-sky-950 dark:bg-sky-400/20 dark:text-sky-50"
      : "border-[rgb(var(--border))] text-[rgb(var(--fg))] hover:border-sky-400"
  }`;
}

function SectionHeading({ id, title }: { id: string; title: string }) {
  return <h2 id={id} className="text-xl font-bold text-[rgb(var(--fg))]">{title}</h2>;
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[rgb(var(--fg))]">{value}</p>
    </article>
  );
}

function CountPanel({ title, rows, emptyLabel = "0" }: { title: string; rows: Array<{ key: string; count: number }>; emptyLabel?: string }) {
  return (
    <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
      <h3 className="font-semibold text-[rgb(var(--fg))]">{title}</h3>
      <dl className="mt-3 space-y-2 text-sm">
        {rows.length ? rows.map((row) => (
          <div key={row.key} className="flex items-center justify-between gap-3">
            <dt className="text-[rgb(var(--muted))]">{humanize(row.key)}</dt>
            <dd className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 font-semibold text-[rgb(var(--fg))]">{row.count}</dd>
          </div>
        )) : <p className="text-[rgb(var(--muted))]">{emptyLabel}</p>}
      </dl>
    </article>
  );
}

function StatusBadge({ value }: { value: string }) {
  const tone = value.includes("required") || value === "blocked" || value === "missing" || value === "stale"
    ? "border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-400/10 dark:text-amber-100"
    : value === "approved" || value === "verified" || value === "ready" || value === "publicly_marketable" || value === "complete"
      ? "border-emerald-300 bg-emerald-50 text-emerald-900 dark:bg-emerald-400/10 dark:text-emerald-100"
      : "border-sky-300 bg-sky-50 text-sky-900 dark:bg-sky-400/10 dark:text-sky-100";
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone}`}>{humanize(value)}</span>;
}

function Definition({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--muted))]">{label}</dt>
      <dd className="mt-1 break-words font-medium text-[rgb(var(--fg))]">{humanize(value)}</dd>
    </div>
  );
}

function TagBlock({ label, values, empty = "—" }: { label: string; values: string[]; empty?: string }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--muted))]">{label}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.length ? values.map((value) => (
          <span key={value} className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2.5 py-1 text-xs text-[rgb(var(--fg))]">{humanize(value)}</span>
        )) : <span className="text-xs text-[rgb(var(--muted))]">{empty}</span>}
      </div>
    </div>
  );
}

function ReferenceList({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
      <p className="font-semibold text-[rgb(var(--fg))]">{label}</p>
      <p className="mt-1 break-words text-[rgb(var(--muted))]">{values.length ? values.join(", ") : "—"}</p>
    </div>
  );
}

function AdminLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] hover:border-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">{label}</Link>;
}

function humanize(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}
