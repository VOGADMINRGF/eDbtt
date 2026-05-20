import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { resolveSurfaceContext } from "@/features/surface";
import {
  parseDistributionContext,
  TopicSurface,
  withDistributionQuery,
} from "@/features/surfaces/topic-round";
import {
  buildPreviewablePublicTopicPageBySlug,
  buildVisiblePublicTopicPageBySlug,
  getPublicTopicPageRecordBySlug,
} from "@features/publicTopicPage";
import {
  buildPersistedRegionAccessContext,
  canViewRegionResource,
  regionScopeFromRegionAccessContext,
} from "@features/region";
import {
  findCompanionContextByTopicAndType,
  getTopicBySlug,
  listCompanionContextsByTopicSlug,
  listRoundsByTopicSlug,
} from "@features/topicRound";
import { publicationVisibilityLabel } from "@features/region/publicationRiskLadder";
import { userIsAdminDashboard } from "@/lib/server/auth/admin";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { BRAND } from "@/lib/brand";
import type { RegionPublicationVisibilityState } from "@features/region/publicationRiskLadder";

type Params = {
  params: Promise<{ slug: string }>;
};

type SearchParamsShape = Promise<Record<string, string | string[] | undefined>>;

function readStringParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

async function canPreviewHiddenTopicPage(slug: string) {
  const record = await getPublicTopicPageRecordBySlug(slug);
  if (!record) return false;

  const user = await getSessionUser();
  const userId = user?._id?.toHexString?.() ?? null;
  if (!user || !user.sessionValid || !userId) return false;

  if (userIsAdminDashboard(user)) return true;

  const accessContext = await buildPersistedRegionAccessContext({
    userId,
    roles: (user.roles ?? []).map((role) => String(role).toLowerCase()),
    isAdmin: false,
    actorRole: null,
    regionId: record.regionId ?? undefined,
  });
  const scope = regionScopeFromRegionAccessContext({ accessContext });
  return canViewRegionResource(scope, {
    regionId: record.regionId,
    organizationId: record.organizationId ?? null,
    ownerUserId: record.createdByUserId,
  });
}

function topicHoldingStateCopy(visibilityState: RegionPublicationVisibilityState) {
  switch (visibilityState) {
    case "archived":
      return {
        eyebrow: "Themenseite archiviert",
        title: "Dieser Themenstand ist aktuell archiviert.",
        body: "Die öffentliche Themenseite war bereits sichtbar und wurde anschließend bewusst aus dem aktiven Rollout genommen.",
        hint: "Öffentliche URL, Share-Link und QR bleiben deshalb deaktiviert. Archivierung löscht den Arbeitsstand nicht hart.",
      };
    case "blocked":
      return {
        eyebrow: "Themenseite derzeit nicht öffentlich verfügbar",
        title: "Dieser Themenstand ist aktuell blockiert.",
        body: "Der öffentliche Zielpfad wurde bewusst gestoppt. Die Inhalte sind deshalb nicht frei lesbar.",
        hint: "Öffentliche URL, Share-Link und QR bleiben deaktiviert, bis ein berechtigter Review-Pfad die Sichtbarkeit wieder freigibt.",
      };
    case "internal_review":
    default:
      return {
        eyebrow: "Themenseite in Vorbereitung",
        title: "Dieser Themenstand ist noch nicht öffentlich sichtbar.",
        body: "Die Inhalte werden weiterhin intern geprüft oder vorbereitet und sind deshalb noch kein freier öffentlicher Lesepfad.",
        hint: "Share-Link und QR erscheinen erst nach einer bewussten sichtbaren Freigabe. Sichtbar heißt auch dann nicht automatisch amtlich.",
      };
  }
}

function TopicHoldingStatePage(props: {
  title: string;
  visibilityState: RegionPublicationVisibilityState;
}) {
  const copy = topicHoldingStateCopy(props.visibilityState);
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-10 sm:px-6 sm:py-12">
      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          {copy.eyebrow}
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-[rgb(var(--fg))] sm:text-3xl">
          {props.title}
        </h1>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1">
            {publicationVisibilityLabel(props.visibilityState)}
          </span>
        </div>
        <p className="mt-5 text-sm leading-6 text-[rgb(var(--muted))]">{copy.title}</p>
        <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">{copy.body}</p>
        <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">{copy.hint}</p>
        <p className="mt-4 text-xs text-[rgb(var(--muted))]">
          Amtlich freigegeben bleibt ausschließlich der separate Official-Release-Pfad.
        </p>
      </section>
    </main>
  );
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const publicTopicPage = await buildVisiblePublicTopicPageBySlug(slug);
  if (publicTopicPage) {
    return {
      title: publicTopicPage.title,
      description: publicTopicPage.summary,
      alternates: {
        canonical: `/topic/${publicTopicPage.slug}`,
      },
      openGraph: {
        title: publicTopicPage.title,
        description: publicTopicPage.summary,
        url: `${BRAND.baseUrl}/topic/${publicTopicPage.slug}`,
        siteName: BRAND.name,
        type: "article",
      },
      twitter: {
        title: publicTopicPage.title,
        description: publicTopicPage.summary,
      },
    };
  }

  const topicPageRecord = await getPublicTopicPageRecordBySlug(slug);
  if (topicPageRecord) {
    return {
      title: `${topicPageRecord.title} | öffentliche Themenseite`,
      description: "Dieser Themenstand ist aktuell nicht als frei lesbare öffentliche Themenseite verfügbar.",
      alternates: {
        canonical: `/topic/${topicPageRecord.targetId}`,
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const topic = getTopicBySlug(slug);
  if (!topic) return { title: "Topic nicht gefunden" };
  return {
    title: topic.title,
    description: topic.framingQuestion,
    alternates: {
      canonical: `/topic/${topic.slug}`,
    },
    openGraph: {
      title: topic.title,
      description: topic.currentState,
      url: `${BRAND.baseUrl}/topic/${topic.slug}`,
      siteName: BRAND.name,
      type: "article",
    },
    twitter: {
      title: topic.title,
      description: topic.currentState,
    },
  };
}

function RelatedContentList(props: {
  title: string;
  items: Array<{
    id: string;
    title: string;
    href: string | null;
    visibilityLabel: string;
  }>;
}) {
  return (
    <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
      <h2 className="text-base font-semibold text-[rgb(var(--fg))]">{props.title}</h2>
      {props.items.length === 0 ? (
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Noch keine sichtbare Vertiefung verbunden.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {props.items.map((item) => (
            <article
              key={`${props.title}:${item.id}`}
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1">
                  {item.visibilityLabel}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">{item.title}</p>
              {item.href ? (
                <Link
                  href={item.href}
                  className="mt-3 inline-flex rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--fg))]"
                >
                  Öffnen
                </Link>
              ) : (
                <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                  Vertiefung ist vorbereitet, aber noch nicht öffentlich sichtbar.
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </article>
  );
}

export default async function TopicPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams?: SearchParamsShape;
}) {
  const { slug } = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const previewRequested = readStringParam(resolvedSearch.previewTopicPage) === "1";
  const canPreview = previewRequested ? await canPreviewHiddenTopicPage(slug) : false;
  const topicPageRecord = await getPublicTopicPageRecordBySlug(slug);
  const publicTopicPage = await buildPreviewablePublicTopicPageBySlug({
    slug,
    allowInternalPreview: canPreview,
  });

  if (publicTopicPage) {
    return (
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 py-8 md:py-10">
        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                Öffentliche Themenseite
              </p>
              <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">{publicTopicPage.title}</h1>
              <p className="max-w-4xl text-sm text-[rgb(var(--muted))]">{publicTopicPage.summary}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1">
                {publicTopicPage.statusLabel}
              </span>
              <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1">
                Sichtbarkeit: {publicationVisibilityLabel(publicTopicPage.visibilityState)}
              </span>
              {publicTopicPage.previewMode ? (
                <span className="rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1 text-amber-900">
                  Vorschau
                </span>
              ) : null}
            </div>
          </div>
          <p className="mt-4 text-sm text-[rgb(var(--muted))]">
            Sichtbar heißt nicht automatisch amtlich. Quellenhinweise und Aussagen bleiben
            nachvollziehbare Arbeitsstände; `public_official` bleibt ausschließlich Official
            Release.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {publicTopicPage.links.map((link) => (
              <Link
                key={`${publicTopicPage.id}:${link.kind}`}
                href={link.href}
                className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
            <h2 className="text-base font-semibold text-[rgb(var(--fg))]">Zentrale Aussagen</h2>
            {publicTopicPage.claimCandidates.length === 0 ? (
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Noch keine Aussagen übernommen.
              </p>
            ) : (
              <ul className="mt-3 space-y-3 text-sm">
                {publicTopicPage.claimCandidates.map((claim, index) => (
                  <li
                    key={`${publicTopicPage.id}:claim:${index + 1}`}
                    className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3"
                  >
                    <p className="font-semibold text-[rgb(var(--fg))]">{claim.text}</p>
                    {claim.excerpt ? (
                      <p className="mt-1 text-[rgb(var(--muted))]">{claim.excerpt}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
            <h2 className="text-base font-semibold text-[rgb(var(--fg))]">Offene Fragen</h2>
            {publicTopicPage.openQuestions.length === 0 ? (
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Aktuell keine offenen Fragen markiert.
              </p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm text-[rgb(var(--muted))]">
                {publicTopicPage.openQuestions.map((question, index) => (
                  <li
                    key={`${publicTopicPage.id}:question:${index + 1}`}
                    className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3"
                  >
                    {question}
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>

        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h2 className="text-base font-semibold text-[rgb(var(--fg))]">Quellenhinweise &amp; Belege</h2>
          {publicTopicPage.evidenceHints.length === 0 ? (
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">
              Noch keine Quellenhinweise übernommen.
            </p>
          ) : (
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {publicTopicPage.evidenceHints.map((hint, index) => (
                <article
                  key={`${publicTopicPage.id}:evidence:${index + 1}`}
                  className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3"
                >
                  <p className="text-sm font-semibold text-[rgb(var(--fg))]">{hint.label}</p>
                  {hint.excerpt ? (
                    <p className="mt-1 text-sm text-[rgb(var(--muted))]">{hint.excerpt}</p>
                  ) : null}
                  {hint.url ? (
                    <Link
                      href={hint.url}
                      className="mt-3 inline-flex rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--fg))]"
                    >
                      Quelle öffnen
                    </Link>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <RelatedContentList title="Verbundene Dossiers" items={publicTopicPage.relatedDossiers} />
          <RelatedContentList
            title="Verbundene Anlassräume / Runden"
            items={publicTopicPage.relatedAnlassraeume}
          />
        </section>

        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h2 className="text-base font-semibold text-[rgb(var(--fg))]">Beteiligung ergänzen</h2>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            Hinweise, Perspektiven, Quellen oder Fragen laufen weiter über bestehende Review-Pfade.
            Nichts wird automatisch veröffentlicht oder amtlich gesetzt.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {publicTopicPage.actions.map((action) => (
              <Link
                key={`${publicTopicPage.id}:${action.id}`}
                href={action.href}
                className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))]"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </section>
      </main>
    );
  }

  if (topicPageRecord) {
    return (
      <TopicHoldingStatePage
        title={topicPageRecord.title}
        visibilityState={topicPageRecord.visibilityState}
      />
    );
  }

  const topic = getTopicBySlug(slug);
  if (!topic) notFound();

  const rounds = listRoundsByTopicSlug(topic.slug);
  const distribution = parseDistributionContext(resolvedSearch);
  const companionContexts = listCompanionContextsByTopicSlug(topic.slug);

  if (distribution.entry === "qr") {
    const companion = findCompanionContextByTopicAndType(topic.slug, distribution.source);
    if (companion) {
      redirect(withDistributionQuery(`/companion/${companion.slug}`, distribution));
    }
  }

  const context = resolveSurfaceContext({
    mode: "live",
    audience: "none",
    viewerRole: "public",
    dataSource: "live",
  });

  return (
    <>
      <h1 className="sr-only">Topic</h1>
      <TopicSurface
        context={context}
        topic={topic}
        rounds={rounds}
        companionContexts={companionContexts}
        basePath={`/topic/${topic.slug}`}
        distribution={distribution}
      />
    </>
  );
}
