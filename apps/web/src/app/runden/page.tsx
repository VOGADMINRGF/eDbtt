import type { Metadata } from "next";
import Link from "next/link";
import {
  listRundenEntryItems,
  type RundenEntryItem,
} from "@features/topicRound/entrySource";
import {
  buildOrganizationDashboardReadModel,
  organizationEntitlementAllowsScope,
  organizationContractAllowsProvisionedScope,
} from "@features/region";
import { readSession } from "@/utils/session";
import {
  resolveCurrentRequestScopeContext,
  requestScopeCanManageOrganizationVisibility,
  requestScopeCanWriteOrganizationRoutes,
  type RequestScopeContext,
} from "@/lib/server/auth/requestScope";
import RundenShareActions from "./RundenShareActions";
import RundenGuidedQuestionBuilder from "./RundenGuidedQuestionBuilder";
import RundenCreateHandoffBanner from "./RundenCreateHandoffBanner";
import RundenPublicSharingGuide from "./RundenPublicSharingGuide";

export const metadata: Metadata = {
  title: "Anlassraum - eDebatte",
  description:
    "Öffentlicher Themenraum für Beteiligung, Teilen per Link oder QR und reviewpflichtige Weiterführung.",
};

type RoundEntryView = "active" | "mine" | "results";

const VIEW_ORDER: RoundEntryView[] = ["active", "mine", "results"];

const VIEW_LABELS: Record<RoundEntryView, string> = {
  active: "Laufend",
  mine: "Meine Anlässe",
  results: "Ergebnisse",
};

function readStringParam(val?: string | string[]): string | undefined {
  return Array.isArray(val) ? val[0] : val;
}

function parseView(val?: string): RoundEntryView {
  if (val === "mine" || val === "results") return val;
  return "active";
}

function viewHref(view: RoundEntryView): string {
  return `/runden?view=${view}`;
}

function hasEntryOwnership(entry: RundenEntryItem, sessionUid: string | null): boolean {
  if (!sessionUid) return false;
  return (
    entry.stewardUserId === sessionUid ||
    entry.createdBy === sessionUid ||
    entry.ownerId === sessionUid
  );
}

function formatDate(value?: string | Date | null): string {
  if (!value) return "–";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "–";

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function normalizeAnlassraumId(value?: string | null): string | null {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!/^[a-f0-9]{24}$/.test(normalized)) return null;
  return normalized;
}

function buildRundenReturnHref(anlassraumId?: string | null) {
  const params = new URLSearchParams();
  params.set("view", "active");
  const normalizedAnlassraumId = normalizeAnlassraumId(anlassraumId);
  if (normalizedAnlassraumId) {
    params.set("anlassraumId", normalizedAnlassraumId);
  }
  return `/runden?${params.toString()}`;
}

function buildStartCards(params: {
  existingHref: string | null;
  hasActiveEntries: boolean;
  hasClosedEntries: boolean;
}) {
  const resultsHref = params.hasClosedEntries ? viewHref("results") : viewHref("active");
  return [
    {
      href: "/create?mode=source",
      title: "Neuen Anlass öffnen",
      body: "Ein Thema, eine Frage oder ein Konflikt bekommt einen eigenen Raum für Beiträge, Kontext und Weiterarbeit.",
      cta: "Öffnen",
      priority: "primary" as const,
    },
    {
      href: params.existingHref ?? viewHref("active"),
      title: "Laufenden Anlass weiterführen",
      body: "Aktive Anlässe pflegen, Rückmeldungen bündeln und den aktuellen Stand sichtbar halten.",
      cta: "Weiterführen",
      priority: params.hasActiveEntries ? ("secondary" as const) : ("tertiary" as const),
    },
    {
      href: resultsHref,
      title: "Stand und Ergebnisse ansehen",
      body:
        "Sobald ein Anlass gewachsen ist, werden Arbeitsstand, Dossier und spätere Ergebnisse nachvollziehbar sichtbar.",
      cta: "Ansehen",
      priority: params.hasClosedEntries ? ("secondary" as const) : ("tertiary" as const),
    },
  ] as const;
}

function buildContributionStartHref(entry: RundenEntryItem) {
  const params = new URLSearchParams();
  params.set("mode", "source");
  params.set("intent", "contribution");
  params.set("entryIntent", "content_companion");
  params.set("entryMode", "direct");
  params.set("source", "runden");
  params.set("reason", "round_inline_contribution");
  params.set("signalTitle", entry.title.slice(0, 160));
  if (entry.anlassraumId) params.set("anlassraumId", entry.anlassraumId);
  params.set("returnTo", buildRundenReturnHref(entry.anlassraumId));
  return `/create?${params.toString()}`;
}

function roundOpenHref(entry: RundenEntryItem) {
  return entry.operatingHref ?? entry.entryHref ?? entry.intakeHref ?? "/runden";
}

function roundResultsHref(entry: RundenEntryItem) {
  return entry.resultsHref ?? roundOpenHref(entry);
}

function deriveOperationalStatus(entry: RundenEntryItem): string {
  return entry.productionStateLabel || entry.anlassraumStatus || "in Vorbereitung";
}

function publicShareStateLabel(entry: RundenEntryItem): string {
  switch (entry.publicShareState) {
    case "share_active":
      return "Link und QR aktiv";
    case "ready_for_visibility_decision":
      return "Freigabe für Link/QR offen";
    case "paused":
      return "öffentlich pausiert";
    case "archived":
      return "öffentlich archiviert";
    case "closed":
      return "öffentlich geschlossen";
    case "review_only":
    default:
      return entry.shareActions ? "Link und QR aktiv" : "intern / review-only";
  }
}

function publicShareHintForEntry(entry: RundenEntryItem): string {
  return (
    entry.publicShareHint ||
    (entry.shareActions
      ? "Link, Share und QR sind bewusst freigegeben und bleiben review-first statt automatisch amtlich."
      : "Review-only bleibt intern. Öffentliche Links und QR erscheinen erst nach bewusster Freigabe.")
  );
}

function deriveLastActivity(entry: RundenEntryItem): string {
  return formatDate(entry.lastActionAt ?? entry.updatedAt ?? entry.createdAt);
}

function RoundQuickActions(props: {
  entry: RundenEntryItem;
  isSignedIn: boolean;
  canManageEntry: boolean;
  canQrActions: boolean;
}) {
  const createHref = buildContributionStartHref(props.entry);
  const openHref = roundOpenHref(props.entry);
  const resultsHref = roundResultsHref(props.entry);
  const qrAnchorHref = `#share-${props.entry.id}`;
  const composeAnchorHref = `#compose-${props.entry.id}`;

  if (!props.isSignedIn) {
    return (
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Link
          href={`/login?next=${encodeURIComponent(createHref)}`}
          className="inline-flex items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition hover:bg-[rgb(var(--bg))]"
        >
          Beitrag verfassen
        </Link>
        <Link
          href={openHref}
          className="inline-flex items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition hover:bg-[rgb(var(--bg))]"
        >
          Anlass öffnen / teilnehmen
        </Link>
      </div>
    );
  }

  if (props.canManageEntry) {
    return (
      <>
        <div
          data-round-quick-actions="manager"
          className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4"
        >
          {props.canQrActions && props.entry.shareActions ? (
            <a
              href={qrAnchorHref}
              className="inline-flex items-center justify-center rounded-lg bg-[rgb(var(--grad-from))] px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Teilnahme öffnen
            </a>
          ) : null}
          <a
            href={composeAnchorHref}
            className="inline-flex items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition hover:bg-[rgb(var(--bg))]"
          >
            Beitrag verfassen
          </a>
          <Link
            href={props.entry.intakeHref ?? viewHref("active")}
            className="inline-flex items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition hover:bg-[rgb(var(--bg))]"
          >
            Arbeitsstand pflegen
          </Link>
          <Link
            href={resultsHref}
            className="inline-flex items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition hover:bg-[rgb(var(--bg))]"
          >
            Ergebnisse ansehen
          </Link>
        </div>
        {!props.canQrActions || !props.entry.shareActions ? (
          <p className="mt-2 text-xs text-[rgb(var(--muted))]">
            Teilnahmelink und QR erscheinen, sobald der laufende Anlass im passenden Verteilkontext verfügbar ist.
          </p>
        ) : null}
      </>
    );
  }

  return (
    <>
      <div
        data-round-quick-actions="participant"
        className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3"
      >
        <a
          href={composeAnchorHref}
          className="inline-flex items-center justify-center rounded-lg bg-[rgb(var(--grad-from))] px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Beitrag verfassen
        </a>
        <Link
          href={openHref}
          className="inline-flex items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition hover:bg-[rgb(var(--bg))]"
        >
          Anlass öffnen
        </Link>
        <Link
          href={resultsHref}
          className="inline-flex items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition hover:bg-[rgb(var(--bg))]"
        >
          Ergebnisse ansehen
        </Link>
      </div>
      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
        QR und Verteilung stehen für berechtigte Rollen im laufenden Anlass zur Verfügung.
      </p>
    </>
  );
}

function RoundInlineContributionModule(props: {
  entry: RundenEntryItem;
  isSignedIn: boolean;
}) {
  const createHref = buildContributionStartHref(props.entry);
  const composeId = `compose-${props.entry.id}`;

  if (!props.isSignedIn) {
    return null;
  }

  return (
    <section id={composeId} className="mt-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
        Beitrag verfassen
      </p>
      <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
        Schnellstart im Kontext dieses laufenden Anlasses. Hinweis, Frage, Beitrag oder Widerspruch werden direkt in den passenden Arbeitsstand geführt.
      </p>
      <form action="/create" method="get" className="mt-3 space-y-2">
        <input type="hidden" name="mode" value="source" />
        <input type="hidden" name="intent" value="contribution" />
        <input type="hidden" name="entryIntent" value="content_companion" />
        <input type="hidden" name="entryMode" value="direct" />
        <input type="hidden" name="source" value="runden" />
        <input type="hidden" name="reason" value="round_inline_contribution" />
        <input type="hidden" name="signalTitle" value={props.entry.title.slice(0, 160)} />
        {props.entry.anlassraumId ? (
          <input type="hidden" name="anlassraumId" value={props.entry.anlassraumId} />
        ) : null}
        <input type="hidden" name="returnTo" value={buildRundenReturnHref(props.entry.anlassraumId)} />
        <textarea
          name="prefill"
          className="min-h-[96px] w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
          placeholder="Was möchtest du ergänzen? Hinweise, Quelle, Frage oder Einordnung."
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-[rgb(var(--grad-from))] px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Beitrag verfassen
          </button>
          <Link
            href={createHref}
            className="inline-flex items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition hover:bg-[rgb(var(--bg))]"
          >
            Ohne Text starten
          </Link>
        </div>
      </form>
    </section>
  );
}

function RoundParticipationModule(props: {
  entry: RundenEntryItem;
  canQrActions: boolean;
}) {
  if (!props.canQrActions || !props.entry.shareActions) {
    return (
      <p className="mt-3 text-xs text-[rgb(var(--muted))]">
        {publicShareHintForEntry(props.entry)}
      </p>
    );
  }

  return (
    <section id={`share-${props.entry.id}`} className="mt-4">
      <h4 className="text-sm font-semibold text-[rgb(var(--fg))]">Teilnahme öffnen</h4>
      <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
        Mit QR oder Link führst du Menschen direkt in diesen Anlass. So fließen Rückmeldungen mobil, vor Ort oder digital
        in genau den richtigen Arbeitsstand.
      </p>
      <RundenShareActions share={props.entry.shareActions} />
    </section>
  );
}

function entryBelongsToManagedScope(params: {
  entry: RundenEntryItem;
  sessionUid: string | null;
  requestScope: RequestScopeContext | null;
}) {
  if (params.requestScope?.isOperatorMode) return true;
  if (hasEntryOwnership(params.entry, params.sessionUid)) return true;

  const ownerId = String(params.entry.ownerId ?? "").trim();
  if (!ownerId) return false;

  return params.requestScope?.organizationMembership.organizationIds.includes(ownerId) ?? false;
}

function resolveRundenManagementCapabilities(input: {
  requestScope: RequestScopeContext | null;
  dashboardReadModel:
    | Awaited<ReturnType<typeof buildOrganizationDashboardReadModel>>
    | null;
}) {
  const operatorMode = input.requestScope?.isOperatorMode ?? false;
  if (operatorMode) {
    return {
      canManageProductiveRounds: true,
      canActivatePublicShare: true,
    } as const;
  }

  if (!input.requestScope || !input.dashboardReadModel) {
    return {
      canManageProductiveRounds: false,
      canActivatePublicShare: false,
    } as const;
  }

  const scopeAllowsWrites = requestScopeCanWriteOrganizationRoutes(input.requestScope);
  const scopeAllowsVisibility = requestScopeCanManageOrganizationVisibility(
    input.requestScope,
  );
  const reviewQueueEntitled = organizationEntitlementAllowsScope(
    input.dashboardReadModel.entitlementSummary,
    "review_queue",
  );
  const reviewQueueContracted = organizationContractAllowsProvisionedScope(
    input.dashboardReadModel.contractSummary,
    "review_queue",
  );
  const publicShareEntitled = organizationEntitlementAllowsScope(
    input.dashboardReadModel.entitlementSummary,
    "public_share",
  );
  const publicShareContracted = organizationContractAllowsProvisionedScope(
    input.dashboardReadModel.contractSummary,
    "public_share",
  );
  const canPrepareRounds =
    input.dashboardReadModel.allowedActions.includes("create_anlassraum_draft") ||
    input.dashboardReadModel.allowedActions.includes("submit_for_review");
  const canActivatePublicShare =
    scopeAllowsVisibility &&
    publicShareEntitled &&
    publicShareContracted &&
    input.dashboardReadModel.allowedActions.includes("approve_publication");

  return {
    canManageProductiveRounds:
      scopeAllowsWrites &&
      reviewQueueEntitled &&
      reviewQueueContracted &&
      canPrepareRounds,
    canActivatePublicShare,
  } as const;
}

export default async function RundenPage({
  searchParams,
}: {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const handoffId = readStringParam(resolvedSearchParams.handoffId) ?? null;
  const createAction = readStringParam(resolvedSearchParams.createAction) ?? null;

  const session = await readSession().catch(() => null);
  const isSignedIn = Boolean(session?.uid);
  const sessionUid = session?.uid ?? null;
  const requestScope = isSignedIn
    ? await resolveCurrentRequestScopeContext({
        allowOperatorFallback: true,
      }).catch(() => null)
    : null;
  const dashboardReadModel =
    requestScope?.actorId
      ? await buildOrganizationDashboardReadModel({
          userId: requestScope.actorId,
          roles: requestScope.actor.roles,
          isAdmin: requestScope.isOperatorMode,
          actorRole: requestScope.actor.governanceRole,
        }).catch(() => null)
      : null;
  const capabilitySummary = resolveRundenManagementCapabilities({
    requestScope,
    dashboardReadModel,
  });

  const signedInViewOrder = VIEW_ORDER;

  const requestedView = parseView(readStringParam(resolvedSearchParams.view));
  const view: RoundEntryView =
    isSignedIn && signedInViewOrder.includes(requestedView)
      ? requestedView
      : "active";

  const compat = readStringParam(resolvedSearchParams.compat) === "demo_runden";
  const queryAnlassraumId = normalizeAnlassraumId(
    readStringParam(resolvedSearchParams.anlassraumId) ?? null,
  );

  let entries: RundenEntryItem[] = [];
  let sourceError: string | null = null;

  try {
    entries = await listRundenEntryItems({ limit: 80 });
  } catch {
    sourceError = "round_entry_source_unavailable";
  }

  const activeEntries = entries.filter((entry) => entry.lifecycle === "active");
  const closedEntries = entries.filter((entry) => entry.lifecycle === "closed");

  const featured =
    (queryAnlassraumId
      ? activeEntries.find((entry) => entry.anlassraumId === queryAnlassraumId)
      : null) ??
    activeEntries[0] ??
    null;
  const remainingActive = featured
    ? activeEntries.filter((entry) => entry.id !== featured.id)
    : activeEntries;

  const existingHref =
    activeEntries.find((entry) => entry.operatingHref)?.operatingHref ??
    activeEntries.find((entry) => entry.entryHref)?.entryHref ??
    featured?.operatingHref ??
    featured?.entryHref ??
    null;

  const startCards = buildStartCards({
    existingHref,
    hasActiveEntries: activeEntries.length > 0,
    hasClosedEntries: closedEntries.length > 0,
  });
  const legacyCount = entries.filter((entry) => entry.legacyIncomplete).length;
  const featuredOwned = featured
    ? entryBelongsToManagedScope({
        entry: featured,
        sessionUid,
        requestScope,
      })
    : false;
  const canManageFeatured = featured
    ? featuredOwned && capabilitySummary.canManageProductiveRounds
    : false;
  const canQrFeatured = featured
    ? canManageFeatured &&
      capabilitySummary.canActivatePublicShare &&
      Boolean(featured.shareActions)
    : false;
  const quickStartParticipationHref =
    featured ? roundOpenHref(featured) : existingHref ?? "/runden?view=active";
  const quickStartParticipationAnchorId =
    featured && canQrFeatured ? `share-${featured.id}` : null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[92rem] space-y-6 px-4 py-6 md:px-8 md:py-10 lg:px-10">
      <header className="relative overflow-hidden rounded-2xl border bg-[rgb(var(--card))] p-5 shadow-sm md:p-6">
        <div className="pointer-events-none absolute -right-28 -top-24 h-72 w-72 rounded-full bg-[rgb(var(--grad-from))]/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-[rgb(var(--grad-to))]/10 blur-3xl" />

        <div className="relative space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
            ANLASSRAUM
          </p>

          <div className="space-y-2">
            <h1
              className="text-3xl font-semibold leading-tight md:text-4xl"
              style={{
                backgroundImage: `linear-gradient(120deg,
                  rgba(var(--fg),0.98) 0%,
                  rgba(var(--grad-to),0.82) 92%)`,
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              Anlassraum
            </h1>

            <p className="max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
              Ein öffentlicher Themenraum zu einem konkreten Anlass.
            </p>
            <p className="max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
              Lass das beste Argument gewinnen.
            </p>
            <p className="max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
              Hier sammelst du Fragen, Perspektiven, Quellen und Optionen. Ein Anlassraum hilft dabei,
              Hinweise, Widerspruch und Vorschläge nicht im Kommentarstrom zu verlieren, sondern
              geordnet in einen gemeinsamen Arbeitsstand mit offenen Fragen und nächsten Schritten zu
              überführen.
            </p>
          </div>

          <section
            aria-label="Schneller Einstieg"
            className="grid gap-3 md:grid-cols-3"
          >
            {startCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                aria-label={card.title}
                className={
                  "group block h-full rounded-xl border bg-[rgb(var(--bg))] p-4 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))] " +
                  (card.priority === "primary"
                    ? "border-[rgb(var(--grad-from))]/45"
                    : card.priority === "secondary"
                      ? "border-[rgb(var(--border))]"
                      : "border-[rgb(var(--border))] opacity-75")
                }
              >
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                  {card.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                  {card.body}
                </p>
                <p className="mt-3 text-xs font-semibold text-[rgb(var(--grad-from))] transition group-hover:text-[rgb(var(--grad-to))]">
                  {card.cta} →
                </p>
              </Link>
            ))}
          </section>
          <p className="text-xs text-[rgb(var(--muted))]">
            <Link href="/runden/demo" className="underline underline-offset-4 hover:text-[rgb(var(--fg))]">
              So funktioniert ein Anlassraum
            </Link>
          </p>

          {!isSignedIn ? (
            <p className="text-xs text-[rgb(var(--muted))]">
              {activeEntries.length === 0
                ? "Aktuell sind noch keine laufenden Anlässe sichtbar."
                : `${activeEntries.length} laufende Anlässe sind aktuell verfügbar.`}
            </p>
          ) : (
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[rgb(var(--muted))]">
              <span>Gesamt: {entries.length}</span>
              <span>Laufend: {activeEntries.length}</span>
              <span>Abgeschlossen: {closedEntries.length}</span>
              <span>Offener Altstand: {legacyCount}</span>
            </div>
          )}
        </div>
      </header>

      {isSignedIn && !capabilitySummary.canManageProductiveRounds ? (
        <section className="rounded-xl border border-amber-300/70 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Produktive Raumverwaltung noch nicht freigeschaltet</p>
          <p className="mt-1">
            Lesen und Beiträge bleiben möglich. Produktive Org-Verwaltung, sichtbare Aktivierung sowie Link- und
            QR-Freigabe verlangen aber verifizierte Membership, passende Entitlements und eine aktive Vertragslage.
          </p>
        </section>
      ) : null}

      {handoffId ? (
        <RundenCreateHandoffBanner handoffId={handoffId} createAction={createAction} />
      ) : null}

      <RundenPublicSharingGuide
        featuredAnlassraumId={featured?.anlassraumId ?? null}
        featuredAnlassraumTitle={featured?.title ?? null}
      />

      <RundenGuidedQuestionBuilder
        returnTo={buildRundenReturnHref(featured?.anlassraumId)}
        featuredAnlassraumId={featured?.anlassraumId ?? null}
        participationHref={quickStartParticipationHref}
        participationAnchorId={quickStartParticipationAnchorId}
      />

      {isSignedIn && (
        <section className="space-y-3">
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">Arbeitsbereiche</p>

          <nav aria-label="Rundenbereiche" className="overflow-x-auto pb-1">
            <div className="inline-flex min-w-full gap-1 rounded-lg border bg-[rgb(var(--card))] p-1">
              {signedInViewOrder.map((entryView) => {
                const isActive = view === entryView;

                return (
                  <Link
                    key={entryView}
                    href={viewHref(entryView)}
                    aria-current={isActive ? "page" : undefined}
                    className={
                      "flex-1 whitespace-nowrap rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))] " +
                      (isActive
                        ? "bg-[rgb(var(--bg))] text-[rgb(var(--fg))] shadow-sm"
                        : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]")
                    }
                  >
                    {VIEW_LABELS[entryView]}
                  </Link>
                );
              })}
            </div>
          </nav>
        </section>
      )}

      {compat && (
        <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
          Hinweis: Ein früherer Demo-Link führt jetzt auf die aktuelle
          Anlassseite.
        </section>
      )}

      {sourceError && (
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          Die Anlassdaten sind gerade nicht verfügbar. Bitte versuche es später
          erneut.
        </section>
      )}

      {!sourceError && entries.length === 0 && (
        <section className="rounded-2xl border bg-[rgb(var(--card))] p-6 text-sm text-[rgb(var(--muted))]">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">
            Noch kein Anlass aktiv
          </h2>
          <p className="mt-2">
            Nutze den Arbeitsstart in drei Schritten. Sobald ein Anlass läuft, wird dieser Bereich zur operativen
            Fläche für Beiträge, Verteilung und Status.
          </p>
          <ol className="mt-4 grid gap-3 md:grid-cols-3">
            <li className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Schritt 1</p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">Anlass öffnen</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                Ein Thema, eine Frage oder ein Konflikt bekommt einen eigenen Raum.
              </p>
            </li>
            <li className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Schritt 2</p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">Beiträge einsammeln</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                Menschen kommen per Link oder QR direkt in genau diesen Anlass und können Hinweise, Fragen oder Beiträge
                einreichen.
              </p>
            </li>
            <li className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Schritt 3</p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">Stand sichtbar weiterführen</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                Beiträge werden gebündelt statt verstreut, damit daraus ein nachvollziehbarer Arbeitsstand entstehen
                kann.
              </p>
            </li>
          </ol>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/create?mode=source"
              className="inline-flex items-center justify-center rounded-lg bg-[rgb(var(--grad-from))] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Neuen Anlass öffnen
            </Link>
            <Link
              href={`/create?${new URLSearchParams({
                mode: "source",
                intent: "contribution",
                entryIntent: "content_companion",
                entryMode: "direct",
                source: "runden",
                reason: "round_first_contribution",
                returnTo: buildRundenReturnHref(null),
              }).toString()}`}
              className="inline-flex items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition hover:bg-[rgb(var(--bg))]"
            >
              Ersten Beitrag vorbereiten
            </Link>
            <Link
              href="/runden/demo"
              className="inline-flex items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-transparent px-4 py-2 text-sm font-semibold text-[rgb(var(--muted))] transition hover:text-[rgb(var(--fg))]"
            >
              Mehr erfahren
            </Link>
          </div>
        </section>
      )}

      {!sourceError && view === "active" && entries.length > 0 && (
        <section id="aktive-runden" className="space-y-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">
                Laufende Anlässe
              </h2>
              <p className="text-sm text-[rgb(var(--muted))]">
                Hier führst du laufende Anlässe weiter, bündelst Rückmeldungen und hältst den Arbeitsstand nachvollziehbar.
              </p>
            </div>

            <Link
              href="/create?mode=source"
              className="inline-flex w-full items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition hover:bg-[rgb(var(--bg))] sm:w-auto"
            >
              Neuen Anlass öffnen
            </Link>
          </div>

          {activeEntries.length === 0 ? (
            <div className="rounded-2xl border bg-[rgb(var(--card))] p-5 text-sm text-[rgb(var(--muted))]">
              <p>Aktuell sind keine laufenden Anlässe vorhanden.</p>
              <p className="mt-2">
                Öffne zuerst einen Anlass. Sobald er läuft, erscheinen hier direkte Arbeitsaktionen für Beiträge,
                Teilnahme, Verteilung und Status.
              </p>
            </div>
          ) : (
            <>
              {featured && (
                <article className="rounded-2xl border border-[rgb(var(--grad-from))]/40 bg-[rgb(var(--card))] p-5 shadow-sm">
                  <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                        Empfohlener Anlass
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))] md:text-2xl">
                        {featured.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">
                        Öffne den Anlass, um Beiträge, Verlauf und aktuellen
                        Stand zu sehen.
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[rgb(var(--muted))]">
                        Eröffnet: {formatDate(featured.createdAt)}
                      </p>
                      <p className="text-xs text-[rgb(var(--muted))]">
                        Letzte Aktivität: {deriveLastActivity(featured)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-[rgb(var(--muted))]">
                    <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-0.5">
                      Status: {deriveOperationalStatus(featured)}
                    </span>
                    <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-0.5">
                      Share: {publicShareStateLabel(featured)}
                    </span>
                    <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-0.5">
                      Letzte Aktion: {featured.lastAction ?? "noch offen"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-[rgb(var(--muted))]">
                    {publicShareHintForEntry(featured)}
                  </p>
                  {featured.relatedTopicPageHref && featured.relatedTopicPageTitle ? (
                    <p className="mt-3 text-sm text-[rgb(var(--muted))]">
                      Verbundenes Thema:{" "}
                      <Link href={featured.relatedTopicPageHref} className="font-semibold text-[rgb(var(--fg))]">
                        {featured.relatedTopicPageTitle}
                      </Link>
                      {featured.relatedTopicPageVisibilityLabel
                        ? ` · ${featured.relatedTopicPageVisibilityLabel}`
                        : ""}
                    </p>
                  ) : null}

                  <Link
                    href={roundOpenHref(featured)}
                    className="mt-4 block w-full rounded-md bg-[rgb(var(--grad-from))] px-4 py-2 text-center text-sm font-semibold text-white shadow transition hover:opacity-90"
                  >
                    Anlass öffnen
                  </Link>

                  {featured.intakeHref ? (
                    <Link
                      href={featured.intakeHref}
                      className="mt-2 block w-full text-center text-xs font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                    >
                      Anlass weiter vorbereiten
                    </Link>
                  ) : null}

                  <RoundQuickActions
                    entry={featured}
                    isSignedIn={isSignedIn}
                    canManageEntry={canManageFeatured}
                    canQrActions={canQrFeatured}
                  />

                  <RoundInlineContributionModule
                    entry={featured}
                    isSignedIn={isSignedIn}
                  />

                  <RoundParticipationModule
                    entry={featured}
                    canQrActions={canQrFeatured}
                  />
                </article>
              )}

                  {remainingActive.length > 0 && (
                <div className="grid gap-4 lg:grid-cols-2">
                  {remainingActive.map((entry) => {
                    const entryOwned = entryBelongsToManagedScope({
                      entry,
                      sessionUid,
                      requestScope,
                    });
                    const canManageEntry =
                      entryOwned && capabilitySummary.canManageProductiveRounds;
                    const canQrActions =
                      canManageEntry &&
                      capabilitySummary.canActivatePublicShare &&
                      Boolean(entry.shareActions);

                    return (
                      <article
                        key={entry.id}
                        className="rounded-2xl border bg-[rgb(var(--card))] p-5 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                          <span>Eröffnet: {formatDate(entry.createdAt)}</span>
                          {entry.legacyIncomplete ? (
                            <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                              Altstand offen
                            </span>
                          ) : null}
                        </div>

                        <h3 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
                          {entry.title}
                        </h3>
                        {entry.relatedTopicPageHref && entry.relatedTopicPageTitle ? (
                          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                            Verbundenes Thema:{" "}
                            <Link href={entry.relatedTopicPageHref} className="font-semibold text-[rgb(var(--fg))]">
                              {entry.relatedTopicPageTitle}
                            </Link>
                            {entry.relatedTopicPageVisibilityLabel
                              ? ` · ${entry.relatedTopicPageVisibilityLabel}`
                              : ""}
                          </p>
                        ) : null}

                        <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">
                          Anlass öffnen, um Beiträge und aktuellen Stand einzusehen.
                        </p>
                        <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                          {publicShareHintForEntry(entry)}
                        </p>

                        <RoundQuickActions
                          entry={entry}
                          isSignedIn={isSignedIn}
                          canManageEntry={canManageEntry}
                          canQrActions={canQrActions}
                        />

                        {entry.intakeHref ? (
                          <Link
                            href={entry.intakeHref}
                            className="mt-3 inline-block text-xs font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                          >
                            Anlass weiter vorbereiten
                          </Link>
                        ) : null}

                        <RoundParticipationModule
                          entry={entry}
                          canQrActions={canQrActions}
                        />
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {!sourceError && isSignedIn && view === "mine" && (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">
              Meine Anlässe
            </h2>
            <p className="text-sm text-[rgb(var(--muted))]">
              Für persönliche Zuständigkeit, Follow-up und Nachverfolgung.
            </p>
          </div>

          <div className="rounded-2xl border bg-[rgb(var(--card))] p-5 text-sm text-[rgb(var(--muted))]">
            Persönliche Zuordnungen werden fortlaufend erweitert. Bis dahin bleiben laufende Anlässe weiterhin im Bereich
            „Laufend“ vollständig sichtbar.
          </div>
        </section>
      )}

      {!sourceError && isSignedIn && view === "results" && (
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">
              Ergebnisse
            </h2>
            <p className="text-sm text-[rgb(var(--muted))]">
              Abgeschlossene Anlässe und ihre Verläufe.
            </p>
          </div>

          {closedEntries.length === 0 ? (
            <div className="rounded-2xl border bg-[rgb(var(--card))] p-5 text-sm text-[rgb(var(--muted))]">
              Noch keine abgeschlossenen Anlässe vorhanden.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {closedEntries.map((entry) => {
                const entryOwned = entryBelongsToManagedScope({
                  entry,
                  sessionUid,
                  requestScope,
                });
                const canQrActions =
                  entryOwned &&
                  capabilitySummary.canActivatePublicShare &&
                  Boolean(entry.shareActions);

                return (
                  <article
                    key={entry.id}
                    className="rounded-2xl border bg-[rgb(var(--card))] p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3 text-xs text-[rgb(var(--muted))]">
                      <span>Eröffnet: {formatDate(entry.createdAt)}</span>
                      <span className="rounded-full border border-stone-300 bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-800">
                        {entry.productionStateLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      Abschluss: {formatDate(entry.finishedAt)}
                    </p>

                    <h3 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
                      {entry.title}
                    </h3>
                    {entry.relatedTopicPageHref && entry.relatedTopicPageTitle ? (
                      <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                        Verbundenes Thema:{" "}
                        <Link href={entry.relatedTopicPageHref} className="font-semibold text-[rgb(var(--fg))]">
                          {entry.relatedTopicPageTitle}
                        </Link>
                        {entry.relatedTopicPageVisibilityLabel
                          ? ` · ${entry.relatedTopicPageVisibilityLabel}`
                          : ""}
                      </p>
                    ) : null}

                    <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">
                      Anlass öffnen, um Verlauf und Abschlussstand anzusehen.
                    </p>
                    <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                      {publicShareHintForEntry(entry)}
                    </p>

                    <Link
                      href={roundResultsHref(entry)}
                      className="mt-3 inline-block text-sm font-semibold text-[rgb(var(--grad-from))] hover:text-[rgb(var(--grad-to))]"
                    >
                      Ergebnis öffnen →
                    </Link>

                    <RoundParticipationModule
                      entry={entry}
                      canQrActions={canQrActions}
                    />
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

    </main>
  );
}
