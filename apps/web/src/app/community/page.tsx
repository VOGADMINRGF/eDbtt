import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { DEFAULT_LOCALE, isSupportedLocale, type SupportedLocale } from "@/config/locales";
import { readSession } from "@/utils/session";
import { normalizeCommunityDeepLinkParams } from "@/features/community/deepLinkContract";
import {
  resolveCommunityGroupSurface,
  type GroupContext,
  type GroupMember,
  type OriginType,
} from "@/features/community/groupSurface";

export const metadata: Metadata = {
  title: "Community",
  description: "Räume und Austausch für sachliche Debatten, Moderation und Themenarbeit.",
  openGraph: {
    title: "Community",
    description: "Räume und Austausch für sachliche Debatten, Moderation und Themenarbeit.",
    url: `${BRAND.baseUrl}/community`,
    siteName: BRAND.name,
  },
  twitter: {
    title: "Community",
    description: "Räume und Austausch für sachliche Debatten, Moderation und Themenarbeit.",
  },
};

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function detectLocale(): SupportedLocale {
  const cookieStore = cookies();
  const cookieLang = cookieStore.get("lang")?.value;
  if (cookieLang && isSupportedLocale(cookieLang)) return cookieLang;
  const acceptLanguage = headers().get("accept-language");
  if (acceptLanguage) {
    const primary = acceptLanguage.split(",")[0]?.split(";")[0]?.trim();
    const candidate = primary?.slice(0, 2);
    if (candidate && isSupportedLocale(candidate)) return candidate;
  }
  return DEFAULT_LOCALE;
}

function t(entry: { de: string; en: string }, locale: SupportedLocale) {
  return locale === "en" ? entry.en : entry.de;
}

function groupTypeLabel(type: OriginType, locale: SupportedLocale): string {
  const map = {
    regional_group: { de: "Regional", en: "Regional" },
    interest_match: { de: "Überregional", en: "Cross-regional" },
    dossier: { de: "Dossier", en: "Dossier" },
    topic_round: { de: "Themenrunde", en: "Topic round" },
    founder: { de: "Founder-Kanal", en: "Founder channel" },
    system: { de: "System-Kanal", en: "System channel" },
  } as const;
  return t(map[type], locale);
}

function groupWhyLine(context: GroupContext, locale: SupportedLocale): string {
  if (context.reasonLabel) return context.reasonLabel;
  if (context.type === "regional_group" && context.topicLabel && context.regionLabel) {
    return locale === "en"
      ? `People around ${context.topicLabel} in ${context.regionLabel}.`
      : `Menschen rund um ${context.topicLabel} in ${context.regionLabel}.`;
  }
  if (context.type === "interest_match" && context.topicLabel) {
    return locale === "en"
      ? `People with shared interest ${context.topicLabel}.`
      : `Menschen mit dem gemeinsamen Thema ${context.topicLabel}.`;
  }
  if (context.type === "dossier") {
    return locale === "en"
      ? "Group around a shared dossier context."
      : "Gruppe rund um einen gemeinsamen Dossier-Kontext.";
  }
  if (context.type === "founder") {
    return locale === "en"
      ? "Product onboarding and founder guidance channel."
      : "Produkt-Onboarding und Founder-Hinweise.";
  }
  if (context.type === "system") {
    return locale === "en"
      ? "System and onboarding information channel."
      : "System- und Onboarding-Hinweise.";
  }
  return locale === "en"
    ? "Discovery area for context-based contacts."
    : "Discovery-Raum für kontextbasierte Kontakte.";
}

function relationshipLabel(state: GroupMember["relationshipState"], locale: SupportedLocale): string {
  if (state === "connected") return locale === "en" ? "Connected" : "Verbunden";
  if (state === "incoming_pending") return locale === "en" ? "Incoming request" : "Anfrage erhalten";
  if (state === "outgoing_pending") return locale === "en" ? "Request sent" : "Anfrage gesendet";
  return locale === "en" ? "No connection" : "Keine Verbindung";
}

function relationshipPrimaryCta(member: GroupMember, locale: SupportedLocale): { label: string; href: string } {
  if (member.canMessage) {
    return {
      label: locale === "en" ? "Message in inbox" : "Nachricht in Inbox",
      href: "/account#inbox",
    };
  }
  if (member.relationshipState === "incoming_pending") {
    return {
      label: locale === "en" ? "Review request" : "Anfrage prüfen",
      href: "/account#inbox",
    };
  }
  if (member.relationshipState === "outgoing_pending") {
    return {
      label: locale === "en" ? "Request running" : "Anfrage läuft",
      href: "/account#inbox",
    };
  }
  return {
    label: locale === "en" ? "Request connection" : "Verbindung anfragen",
    href: "/account#inbox",
  };
}

export default async function CommunityPage({ searchParams }: Props) {
  const locale = detectLocale();
  const params = await Promise.resolve(searchParams ?? {});
  const deepLinkValidation = normalizeCommunityDeepLinkParams(params);
  if ("error" in deepLinkValidation) {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 md:py-12">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            {locale === "en" ? "Community" : "Community"}
          </p>
          <h1 className="text-3xl font-bold text-[rgb(var(--fg))]">
            {locale === "en" ? "Community Hub" : "Community-Hub"}
          </h1>
        </header>
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {locale === "en"
            ? `Invalid community deep-link parameters (${deepLinkValidation.error}).`
            : `Ungültige Community-Deep-Link-Parameter (${deepLinkValidation.error}).`}
        </section>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link href="/community" className="font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">
            {locale === "en" ? "Open community overview" : "Community-Übersicht öffnen"}
          </Link>
        </div>
      </main>
    );
  }
  const session = await readSession();
  const viewerId = clean(session?.uid) || null;
  const model = await resolveCommunityGroupSurface({ searchParams: params, viewerId });

  if (model.mode === "discovery") {
    return (
      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 md:py-12">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            {locale === "en" ? "Community" : "Community"}
          </p>
          <h1 className="text-3xl font-bold text-[rgb(var(--fg))]">
            {locale === "en" ? "Community Hub" : "Community-Hub"}
          </h1>
          <p className="text-sm text-[rgb(var(--muted))]">
            {locale === "en"
              ? "Discovery, context and contributions. Not a realtime messenger."
              : "Discovery, Kontext und Beiträge. Kein Realtime-Messenger."}
          </p>
        </header>

        {model.source.unavailable ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            Produktive Community-Quelle aktuell nicht verfügbar (`{model.source.error}`).
          </section>
        ) : null}

        {model.groups.length === 0 ? (
          <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-sm text-[rgb(var(--muted))]">
            Noch keine Community-Gruppen aus produktiven Profilsignalen vorhanden.
          </section>
        ) : (
          <section className="grid gap-3 md:grid-cols-2">
            {model.groups.map((group) => (
              <Link
                key={group.key}
                href={group.href}
                className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                  {locale === "en" ? "Group" : "Gruppe"}
                </p>
                <h2 className="mt-1 text-base font-semibold text-[rgb(var(--fg))]">{group.title}</h2>
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">{group.hint}</p>
              </Link>
            ))}
          </section>
        )}

        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
            {locale === "en" ? "What community is today" : "Was Community heute ist"}
          </p>
          <p className="mt-2 text-[rgb(var(--muted))]">
            {locale === "en"
              ? "Community currently means discovery + context + contributions + connections. Messaging remains DM v1 in inbox."
              : "Community bedeutet aktuell Discovery + Kontext + Beiträge + Verbindungen. Nachrichten bleiben DM v1 in der Inbox."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <Link href="/community/contributions" className="font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">
              {locale === "en" ? "Open contributions" : "Beiträge öffnen"}
            </Link>
            <Link href="/account#inbox" className="font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]">
              {locale === "en" ? "Open inbox" : "Inbox öffnen"}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const { context, members, statements, dossier, topicHref, dossierHref } = model;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8 md:py-10">
      {model.source.unavailable ? (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          Produktive Community-Quelle aktuell nicht verfügbar (`{model.source.error}`). Es wird kein statischer Demo-Fallback geladen.
        </section>
      ) : null}

      <header className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-sky-300/60 bg-sky-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-sky-900">
            {groupTypeLabel(context.type, locale)}
          </span>
          <span className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2.5 py-1 text-[10px] font-medium text-[rgb(var(--muted))]">
            {context.scope === "regional"
              ? locale === "en"
                ? "Regional scope"
                : "Regionaler Scope"
              : locale === "en"
                ? "Cross-regional scope"
                : "Überregionaler Scope"}
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))] sm:text-3xl">{context.label}</h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">{groupWhyLine(context, locale)}</p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_1fr]">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
              {locale === "en" ? "Matching people" : "Passende Menschen"}
            </p>
            <span className="text-[11px] text-[rgb(var(--muted))]">{members.length}</span>
          </div>
          {members.length > 0 ? (
            <div className="space-y-2">
              {members.map((member) => {
                const primaryAction = relationshipPrimaryCta(member, locale);
                return (
                  <div key={member.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-2.5">
                    <div className="flex items-start gap-2.5">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-500/85 via-cyan-500/80 to-emerald-500/80 text-xs font-semibold text-white">
                        {member.displayName
                          .split(" ")
                          .map((part) => part.slice(0, 1))
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[rgb(var(--fg))]">{member.displayName}</p>
                        {member.tagline ? <p className="text-xs text-[rgb(var(--muted))]">{member.tagline}</p> : null}
                        {member.reasonLabel ? <p className="text-[11px] text-[rgb(var(--muted))]">{member.reasonLabel}</p> : null}
                        <p className="mt-0.5 text-[10px] font-medium text-[rgb(var(--muted))]">
                          {relationshipLabel(member.relationshipState, locale)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                      {member.shareId ? (
                        <Link
                          href={`/profile/${encodeURIComponent(member.shareId)}`}
                          className="inline-flex w-full items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1.5 text-[11px] font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                        >
                          {locale === "en" ? "Open profile" : "Profil öffnen"}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="inline-flex w-full items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1.5 text-[11px] font-semibold text-[rgb(var(--muted))] opacity-70"
                        >
                          {locale === "en" ? "Profile soon" : "Profil folgt"}
                        </button>
                      )}
                      <Link
                        href={primaryAction.href}
                        className="inline-flex w-full items-center justify-center rounded-full border border-sky-300/70 bg-gradient-to-r from-sky-500/85 to-cyan-500/85 px-3 py-1.5 text-[11px] font-semibold text-white"
                      >
                        {primaryAction.label}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-[rgb(var(--muted))]">
              {locale === "en"
                ? "No matching people yet. Save interests and region to strengthen this group."
                : "Noch keine passenden Menschen sichtbar. Interessen und Region stärken diese Gruppe."}
            </p>
          )}
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
              {locale === "en" ? "Relevant topics" : "Relevante Themen"}
            </p>
            {statements.length > 0 ? (
              <div className="mt-2 space-y-2">
                {statements.map((statement) => (
                  <div key={statement.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
                    <p className="text-sm font-semibold text-[rgb(var(--fg))]">{statement.title}</p>
                    <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">{statement.summary}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                {locale === "en"
                  ? "No content mapped yet for this context."
                  : "Für diesen Kontext sind noch keine Inhalte zugeordnet."}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={topicHref}
                className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1.5 text-[11px] font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
              >
                {locale === "en" ? "Open topic in swipes" : "Thema in Swipes öffnen"}
              </Link>
              <Link
                href="/community/contributions"
                className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1.5 text-[11px] font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
              >
                {locale === "en" ? "Submit contribution" : "Beitrag einreichen"}
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
              {locale === "en" ? "Dossier context" : "Dossier-Kontext"}
            </p>
            {dossier || context.dossierId ? (
              <div className="mt-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">{dossier?.title ?? context.dossierTitle ?? "Dossier"}</p>
                <p className="mt-0.5 text-xs text-[rgb(var(--muted))]">
                  {locale === "en"
                    ? "Shared dossier context for this group."
                    : "Gemeinsamer Dossier-Kontext für diese Gruppe."}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                {locale === "en"
                  ? "No dossier assigned yet. No demo fallback is used."
                  : "Noch kein Dossier hinterlegt. Es wird kein Demo-Fallback verwendet."}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {dossierHref ? (
                <Link
                  href={dossierHref}
                  className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1.5 text-[11px] font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                >
                  {locale === "en" ? "Open dossier" : "Dossier öffnen"}
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1.5 text-[11px] font-semibold text-[rgb(var(--muted))] opacity-70"
                >
                  {locale === "en" ? "No dossier linked" : "Kein Dossier verknüpft"}
                </button>
              )}
              <Link
                href="/account#inbox"
                className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1.5 text-[11px] font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
              >
                {locale === "en" ? "Back to inbox" : "Zur Inbox"}
              </Link>
            </div>
          </section>
        </div>
      </section>

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-xs text-[rgb(var(--muted))]">
        <p className="font-semibold text-[rgb(var(--fg))]">
          {locale === "en" ? "Community scope today" : "Community-Umfang heute"}
        </p>
        <p className="mt-1">
          {locale === "en"
            ? "Discovery + context + contributions + connections. No realtime group chat and no full messenger promise."
            : "Discovery + Kontext + Beiträge + Verbindungen. Kein Realtime-Gruppenchat und kein Voll-Messenger-Versprechen."}
        </p>
      </section>
    </main>
  );
}
