import { dossierSuggestionsCol } from "@features/dossier/db";
import { buildFeedRadarRuntimeReadModel } from "@features/feeds/runtimeReadModel";
import { loadSocialDistributionQueueReadModel } from "@features/outputEngine/socialDistributionQueueReadModel";
import { listPricingOrders } from "@features/pricing/server/leadsRepo";
import {
  buildReviewQueueReadModel,
  type ReviewQueueReadModel,
} from "@features/reviewQueue";
import { getRegionEntitlementRuntimeRepo } from "@features/region";
import { buildAutonomousThemenradarReadModel } from "@features/themenradar/autonomousSupply";
import { buildMaterialExtractionJobReadModel } from "@/features/material/materialExtractionJobs";

export const OPERATOR_CONSOLE_REAL_ACTION_ROUTES = [
  "/admin/review",
  "/admin/themenradar",
  "/admin/feeds",
  "/admin/feeds#source-automation",
  "/admin/feeds#material-extraction-jobs",
  "/atlas/social-review",
  "/admin/entitlements",
  "/admin/pricing/orders",
  "/account/organization/dashboard",
  "/admin/graph/repairs",
] as const;

export type OperatorConsoleActionHref = (typeof OPERATOR_CONSOLE_REAL_ACTION_ROUTES)[number];

export type OperatorConsoleMetric = {
  label: string;
  value: number | string;
};

export type OperatorConsoleAreaState = "attention" | "review" | "ok" | "inactive";

export type OperatorConsoleArea = {
  key:
    | "review_queue"
    | "themenradar"
    | "feed_health"
    | "source_automation"
    | "material_jobs"
    | "dossier_updates"
    | "social_queue"
    | "payments";
  title: string;
  href: OperatorConsoleActionHref;
  actionLabel: string;
  state: OperatorConsoleAreaState;
  stateLabel: string;
  summary: string;
  metrics: OperatorConsoleMetric[];
  guardrail: string;
};

export type OperatorConsoleAction = {
  label: string;
  href: OperatorConsoleActionHref;
  description: string;
  sourceArea: OperatorConsoleArea["key"];
  priority: number;
};

export type OperatorConsoleReadModel = {
  generatedAt: string;
  hero: {
    openOperatorTasks: number | string;
    sourceFailures: number | string;
    waitingMaterialJobs: number | string;
    pendingDossierUpdates: number | string;
    socialQueueReviewOpen: number | string;
  };
  areas: OperatorConsoleArea[];
  nextActions: OperatorConsoleAction[];
  guardrails: {
    noNewBackend: true;
    noFakeActions: true;
    reviewFirst: true;
    noAutoPublish: true;
    noSecretProviderClaims: true;
  };
};

type LoadResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

type DossierUpdateSummary = {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  latestDossierId: string | null;
};

function safeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stateLabel(state: OperatorConsoleAreaState) {
  switch (state) {
    case "attention":
      return "Braucht Eingriff";
    case "review":
      return "Review läuft";
    case "ok":
      return "Stabil";
    case "inactive":
    default:
      return "Leerer, ehrlicher Zustand";
  }
}

async function settle<T>(promise: Promise<T>): Promise<LoadResult<T>> {
  try {
    return { ok: true, value: await promise };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "load_failed",
    };
  }
}

async function loadDossierUpdateSummary(): Promise<DossierUpdateSummary> {
  const col = await dossierSuggestionsCol();
  const [pending, accepted, rejected, latest] = await Promise.all([
    col.countDocuments({ status: "pending" }),
    col.countDocuments({ status: "accepted" }),
    col.countDocuments({ status: "rejected" }),
    col
      .find(
        {},
        {
          projection: {
            dossierId: 1,
            updatedAt: 1,
            createdAt: 1,
          },
        },
      )
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(1)
      .toArray(),
  ]);

  return {
    total: pending + accepted + rejected,
    pending,
    accepted,
    rejected,
    latestDossierId: String(latest[0]?.dossierId ?? "").trim() || null,
  };
}

function fallbackArea(input: {
  key: OperatorConsoleArea["key"];
  title: string;
  href: OperatorConsoleActionHref;
  actionLabel: string;
  summary: string;
  guardrail: string;
}): OperatorConsoleArea {
  return {
    ...input,
    state: "attention",
    stateLabel: stateLabel("attention"),
    metrics: [{ label: "Status", value: "Nicht geladen" }],
  };
}

function buildReviewArea(result: LoadResult<ReviewQueueReadModel>): OperatorConsoleArea {
  if (!result.ok) {
    return fallbackArea({
      key: "review_queue",
      title: "Review Queue",
      href: "/admin/review",
      actionLabel: "Review Queue öffnen",
      summary: "Die zentrale Review-Queue konnte nicht belastbar geladen werden.",
      guardrail: "Kein Auto-Publish, keine Sammelfreigabe und kein automatisches `public_official`.",
    });
  }

  const summary = result.value.summary;
  const state: OperatorConsoleAreaState =
    summary.highPriorityCount > 0 || summary.blockedCount > 0
      ? "attention"
      : summary.total > 0
        ? "review"
        : "inactive";

  return {
    key: "review_queue",
    title: "Review Queue",
    href: "/admin/review",
    actionLabel: "Review Queue öffnen",
    state,
    stateLabel: stateLabel(state),
    summary:
      summary.total > 0
        ? `${summary.total} offene Aufgaben, ${summary.highPriorityCount} mit hoher Priorität und ${summary.readyCount} direkt bereit.`
        : "Aktuell keine offenen Review-Aufgaben. Die Queue bleibt die einzige globale Betreiber-Arbeitsliste.",
    metrics: [
      { label: "Offen", value: summary.total },
      { label: "Hohe Priorität", value: summary.highPriorityCount },
      { label: "Bereit", value: summary.readyCount },
    ],
    guardrail: "Kein Auto-Publish, keine Sammelfreigabe und kein automatisches `public_official`.",
  };
}

function buildThemenradarArea(
  result: LoadResult<Awaited<ReturnType<typeof buildAutonomousThemenradarReadModel>>>,
): OperatorConsoleArea {
  if (!result.ok) {
    return fallbackArea({
      key: "themenradar",
      title: "Themenradar",
      href: "/admin/themenradar",
      actionLabel: "Themenradar öffnen",
      summary: "Der autonome Themenradar konnte nicht belastbar geladen werden.",
      guardrail: "Themen bleiben review-first, draft-only und ohne automatische Veröffentlichung.",
    });
  }

  const summary = result.value.summary;
  const state: OperatorConsoleAreaState =
    summary.reviewRequired > 0 || summary.weakEvidence > 0
      ? "review"
      : summary.totalClusters > 0
        ? "ok"
        : "inactive";

  return {
    key: "themenradar",
    title: "Themenradar",
    href: "/admin/themenradar",
    actionLabel: "Themenradar öffnen",
    state,
    stateLabel: stateLabel(state),
    summary:
      summary.totalClusters > 0
        ? `${summary.reviewRequired} Cluster brauchen Review, ${summary.strongSignals} sind starke Signale und ${summary.stale} wirken veraltet.`
        : "Noch keine belastbaren Cluster im Themenradar. Das ist ein ehrlicher Leerzustand ohne Seed-Behauptung.",
    metrics: [
      { label: "Review nötig", value: summary.reviewRequired },
      { label: "Starke Signale", value: summary.strongSignals },
      { label: "Veraltet", value: summary.stale },
    ],
    guardrail: "Themen bleiben review-first, draft-only und ohne automatische Veröffentlichung.",
  };
}

function buildFeedArea(
  result: LoadResult<Awaited<ReturnType<typeof buildFeedRadarRuntimeReadModel>>>,
): OperatorConsoleArea {
  if (!result.ok) {
    return fallbackArea({
      key: "feed_health",
      title: "Feed Health",
      href: "/admin/feeds",
      actionLabel: "Feed Runtime öffnen",
      summary: "Die Feed-Runtime konnte nicht belastbar geladen werden.",
      guardrail: "Feed-Runs erzeugen keine automatische Veröffentlichung und keine versteckten Provider-Kosten.",
    });
  }

  const errors = safeNumber(result.value.metrics.errors.value) ?? 0;
  const reviewDrafts = safeNumber(result.value.metrics.review.value) ?? 0;
  const queuedDrafts = safeNumber(result.value.queue.queuedDrafts) ?? 0;
  const state: OperatorConsoleAreaState =
    errors > 0
      ? "attention"
      : reviewDrafts > 0 || queuedDrafts > 0
        ? "review"
        : "ok";

  return {
    key: "feed_health",
    title: "Feed Health",
    href: "/admin/feeds",
    actionLabel: "Feed Runtime öffnen",
    state,
    stateLabel: stateLabel(state),
    summary: `${result.value.sourceStatus.label}. ${result.value.nextAction.label} bleibt der nächste echte Arbeitsschritt.`,
    metrics: [
      { label: "Fehler", value: errors },
      { label: "Review-Entwürfe", value: reviewDrafts },
      { label: "Queue-Entwürfe", value: queuedDrafts },
    ],
    guardrail: "Feed-Runs erzeugen keine automatische Veröffentlichung und keine versteckten Provider-Kosten.",
  };
}

function buildSourceAutomationArea(
  result: LoadResult<Awaited<ReturnType<typeof buildFeedRadarRuntimeReadModel>>>,
): OperatorConsoleArea {
  if (!result.ok) {
    return fallbackArea({
      key: "source_automation",
      title: "Source Automation",
      href: "/admin/feeds#source-automation",
      actionLabel: "Source Automation öffnen",
      summary: "Die Source-Automation-Zusammenfassung konnte nicht belastbar geladen werden.",
      guardrail: "Quellen bleiben reviewpflichtig, ohne Auto-Publish und ohne Auto-DeepSearch.",
    });
  }

  const summary = result.value.sourceAutomation.summary;
  const state: OperatorConsoleAreaState =
    summary.failingSources > 0 || summary.backoffSources > 0
      ? "attention"
      : summary.reviewCandidateCount > 0
        ? "review"
        : summary.totalSources > 0
          ? "ok"
          : "inactive";

  return {
    key: "source_automation",
    title: "Source Automation",
    href: "/admin/feeds#source-automation",
    actionLabel: "Source Automation öffnen",
    state,
    stateLabel: stateLabel(state),
    summary:
      summary.totalSources > 0
        ? `${summary.failingSources} Quellen sind fehlerhaft, ${summary.reviewCandidateCount} Signale warten auf Review und ${summary.backoffSources} laufen im Backoff.`
        : "Noch keine angeschlossenen Quellen in der Automation. Keine simulierte Feed-Lage.",
    metrics: [
      { label: "Fehlerhafte Quellen", value: summary.failingSources },
      { label: "Review-Kandidaten", value: summary.reviewCandidateCount },
      { label: "Backoff", value: summary.backoffSources },
    ],
    guardrail: "Quellen bleiben reviewpflichtig, ohne Auto-Publish und ohne Auto-DeepSearch.",
  };
}

function buildMaterialArea(
  result: LoadResult<Awaited<ReturnType<typeof buildMaterialExtractionJobReadModel>>>,
): OperatorConsoleArea {
  if (!result.ok) {
    return fallbackArea({
      key: "material_jobs",
      title: "Material Jobs",
      href: "/admin/feeds#material-extraction-jobs",
      actionLabel: "Material Jobs öffnen",
      summary: "Die Material-Extraktionsjobs konnten nicht belastbar geladen werden.",
      guardrail: "Material bleibt review-first, ohne Auto-DeepSearch, Auto-Publish oder versteckte Kostenpfade.",
    });
  }

  const summary = result.value.summary;
  const state: OperatorConsoleAreaState =
    summary.failedJobs > 0 || summary.blockedJobs > 0 || summary.approvalRequiredJobs > 0
      ? "attention"
      : summary.waitingJobs > 0 || summary.reviewReadyJobs > 0
        ? "review"
        : summary.totalJobs > 0
          ? "ok"
          : "inactive";

  return {
    key: "material_jobs",
    title: "Material Jobs",
    href: "/admin/feeds#material-extraction-jobs",
    actionLabel: "Material Jobs öffnen",
    state,
    stateLabel: stateLabel(state),
    summary:
      summary.totalJobs > 0
        ? `${summary.waitingJobs} Jobs warten, ${summary.failedJobs} sind fehlgeschlagen und ${summary.approvalRequiredJobs} brauchen Kostenfreigabe.`
        : "Noch keine Extraktionsjobs vorhanden. Das ist ein ehrlicher Zustand ohne Auto-Extraktion.",
    metrics: [
      { label: "Wartend", value: summary.waitingJobs },
      { label: "Fehlgeschlagen", value: summary.failedJobs },
      { label: "Kostenfreigabe", value: summary.approvalRequiredJobs },
    ],
    guardrail: "Material bleibt review-first, ohne Auto-DeepSearch, Auto-Publish oder versteckte Kostenpfade.",
  };
}

function buildDossierArea(result: LoadResult<DossierUpdateSummary>): OperatorConsoleArea {
  if (!result.ok) {
    return fallbackArea({
      key: "dossier_updates",
      title: "Dossier Updates",
      href: "/atlas/social-review",
      actionLabel: "Dossier-Review öffnen",
      summary: "Die Dossier-Update-Lage konnte nicht belastbar geladen werden.",
      guardrail: "Sichtbarer Dossierstand und neue Hinweise in Prüfung bleiben klar getrennt.",
    });
  }

  const state: OperatorConsoleAreaState =
    result.value.pending > 0
      ? "review"
      : result.value.accepted > 0
        ? "ok"
        : "inactive";

  return {
    key: "dossier_updates",
    title: "Dossier Updates",
    href: "/atlas/social-review",
    actionLabel: "Dossier-Review öffnen",
    state,
    stateLabel: stateLabel(state),
    summary:
      result.value.total > 0
        ? `${result.value.pending} Hinweise sind in Prüfung, ${result.value.accepted} wurden angenommen und ${result.value.rejected} verworfen.`
        : "Noch keine Dossier-Hinweise im Update-Pfad. Kein vorgetäuschter Fortschreibungsstand.",
    metrics: [
      { label: "In Prüfung", value: result.value.pending },
      { label: "Angenommen", value: result.value.accepted },
      { label: "Verworfen", value: result.value.rejected },
    ],
    guardrail: "Sichtbarer Dossierstand und neue Hinweise in Prüfung bleiben klar getrennt.",
  };
}

function buildSocialArea(
  result: LoadResult<Awaited<ReturnType<typeof loadSocialDistributionQueueReadModel>>>,
): OperatorConsoleArea {
  if (!result.ok) {
    return fallbackArea({
      key: "social_queue",
      title: "Social Queue",
      href: "/atlas/social-review",
      actionLabel: "Social Queue öffnen",
      summary: "Die Social Distribution Queue konnte nicht belastbar geladen werden.",
      guardrail: "Nur Queue, Export und Planung; kein Live-Posting, kein OAuth-Connector und kein Auto-Publish.",
    });
  }

  const summary = result.value.summary;
  const state: OperatorConsoleAreaState =
    summary.blocked > 0
      ? "attention"
      : summary.reviewOpen > 0
        ? "review"
        : summary.total > 0
          ? "ok"
          : "inactive";

  return {
    key: "social_queue",
    title: "Social Queue",
    href: "/atlas/social-review",
    actionLabel: "Social Queue öffnen",
    state,
    stateLabel: stateLabel(state),
    summary:
      summary.total > 0
        ? `${summary.reviewOpen} Entwürfe sind offen, ${summary.queued} liegen in der Queue und ${summary.scheduledReady} sind planungsbereit.`
        : "Noch keine Social-Entwürfe in der Queue. Keine simulierten Connector- oder Posting-Zustände.",
    metrics: [
      { label: "Review offen", value: summary.reviewOpen },
      { label: "Queued", value: summary.queued },
      { label: "Blockiert", value: summary.blocked },
    ],
    guardrail: "Nur Queue, Export und Planung; kein Live-Posting, kein OAuth-Connector und kein Auto-Publish.",
  };
}

function buildPaymentsArea(result: LoadResult<{
  entitlements: Awaited<ReturnType<ReturnType<typeof getRegionEntitlementRuntimeRepo>["listEntitlementsForAdmin"]>>;
  orders: Awaited<ReturnType<typeof listPricingOrders>>;
}>): OperatorConsoleArea {
  if (!result.ok) {
    return fallbackArea({
      key: "payments",
      title: "Payment & Entitlements",
      href: "/admin/entitlements",
      actionLabel: "Freischaltungen öffnen",
      summary: "Freischaltungen und Pricing-Orders konnten nicht belastbar geladen werden.",
      guardrail: "Keine versteckten Providerpfade, keine automatische Amtlichkeit und keine Billing-Wahrheit aus Demo-Ständen.",
    });
  }

  const entitlements = result.value.entitlements;
  const orders = result.value.orders;
  const activeEntitlements = entitlements.filter((item) => item.status === "active" || item.status === "trial").length;
  const limitedEntitlements = entitlements.filter((item) =>
    ["past_due", "suspended", "cancelled", "expired", "revoked"].includes(item.status),
  ).length;
  const pendingOrders = orders.filter((item) => item.status === "submitted" || item.status === "under_review").length;
  const checkoutLinkedOrders = orders.filter((item) =>
    item.internal.billingSource === "external_checkout_pending" ||
    item.internal.billingSource === "external_checkout_integrated",
  ).length;
  const href: OperatorConsoleActionHref = pendingOrders > 0 ? "/admin/pricing/orders" : "/admin/entitlements";
  const actionLabel = pendingOrders > 0 ? "Pricing Orders öffnen" : "Freischaltungen öffnen";
  const state: OperatorConsoleAreaState =
    limitedEntitlements > 0 || pendingOrders > 0
      ? "attention"
      : activeEntitlements > 0 || entitlements.length > 0
        ? "ok"
        : "inactive";

  return {
    key: "payments",
    title: "Payment & Entitlements",
    href,
    actionLabel,
    state,
    stateLabel: stateLabel(state),
    summary:
      entitlements.length > 0 || orders.length > 0
        ? `${pendingOrders} Orders warten auf Prüfung, ${activeEntitlements} Freischaltungen sind aktiv und ${limitedEntitlements} liegen in einem eingeschränkten Status.`
        : "Noch keine Freischaltungen oder Pricing-Orders vorhanden. Kein behaupteter Billing-Betrieb.",
    metrics: [
      { label: "Orders in Prüfung", value: pendingOrders },
      { label: "Aktive Freischaltungen", value: activeEntitlements },
      { label: "Checkout-bezogen", value: checkoutLinkedOrders },
    ],
    guardrail: "Keine versteckten Providerpfade, keine automatische Amtlichkeit und keine Billing-Wahrheit aus Demo-Ständen.",
  };
}

function pushAction(
  target: OperatorConsoleAction[],
  input: Omit<OperatorConsoleAction, "priority"> & { priority?: number },
) {
  target.push({
    ...input,
    priority: input.priority ?? 50,
  });
}

function buildNextActions(areas: OperatorConsoleArea[]): OperatorConsoleAction[] {
  const actions: OperatorConsoleAction[] = [];
  const byKey = new Map(areas.map((area) => [area.key, area]));

  const review = byKey.get("review_queue");
  if (review && review.state !== "inactive") {
    pushAction(actions, {
      label: review.actionLabel,
      href: review.href,
      description: review.summary,
      sourceArea: review.key,
      priority: review.state === "attention" ? 100 : 88,
    });
  }

  const sourceAutomation = byKey.get("source_automation");
  if (sourceAutomation && sourceAutomation.state !== "inactive") {
    pushAction(actions, {
      label: sourceAutomation.actionLabel,
      href: sourceAutomation.href,
      description: sourceAutomation.summary,
      sourceArea: sourceAutomation.key,
      priority: sourceAutomation.state === "attention" ? 96 : 78,
    });
  }

  const material = byKey.get("material_jobs");
  if (material && material.state !== "inactive") {
    pushAction(actions, {
      label: material.actionLabel,
      href: material.href,
      description: material.summary,
      sourceArea: material.key,
      priority: material.state === "attention" ? 94 : 76,
    });
  }

  const themenradar = byKey.get("themenradar");
  if (themenradar && themenradar.state !== "inactive") {
    pushAction(actions, {
      label: themenradar.actionLabel,
      href: themenradar.href,
      description: themenradar.summary,
      sourceArea: themenradar.key,
      priority: themenradar.state === "review" ? 84 : 68,
    });
  }

  const dossier = byKey.get("dossier_updates");
  if (dossier && dossier.state !== "inactive") {
    pushAction(actions, {
      label: dossier.actionLabel,
      href: dossier.href,
      description: dossier.summary,
      sourceArea: dossier.key,
      priority: dossier.state === "review" ? 82 : 66,
    });
  }

  const social = byKey.get("social_queue");
  if (social && social.state !== "inactive") {
    pushAction(actions, {
      label: social.actionLabel,
      href: social.href,
      description: social.summary,
      sourceArea: social.key,
      priority: social.state === "attention" ? 80 : 64,
    });
  }

  const payments = byKey.get("payments");
  if (payments && payments.state !== "inactive") {
    pushAction(actions, {
      label: payments.actionLabel,
      href: payments.href,
      description: payments.summary,
      sourceArea: payments.key,
      priority: payments.state === "attention" ? 72 : 58,
    });
  }

  if (actions.length === 0) {
    pushAction(actions, {
      label: "Review Queue öffnen",
      href: "/admin/review",
      description: "Wenn gerade nichts brennt, bleibt die zentrale Review-Queue der sichere Operator-Einstieg.",
      sourceArea: "review_queue",
      priority: 40,
    });
    pushAction(actions, {
      label: "Organisationssicht öffnen",
      href: "/account/organization/dashboard",
      description: "Dieselbe Lage organisationsbezogen und scoped statt global betrachten.",
      sourceArea: "review_queue",
      priority: 36,
    });
  }

  return actions
    .sort((left, right) => right.priority - left.priority)
    .slice(0, 6);
}

export async function buildOperatorConsoleReadModel(input: {
  userId: string;
}): Promise<OperatorConsoleReadModel> {
  const [
    reviewResult,
    themenradarResult,
    feedRuntimeResult,
    materialResult,
    dossierResult,
    socialResult,
    paymentsResult,
  ] = await Promise.all([
    settle(
      buildReviewQueueReadModel({
        mode: "global_operator",
        userId: input.userId,
        isAdmin: true,
        visibleRegionIds: [],
        organizationIds: [],
        canApproveOfficial: true,
        governanceActor: {
          userId: input.userId,
          role: "admin",
          isAdmin: true,
          scopedOwnerIds: [input.userId],
          scopedEntityIds: [input.userId],
          personTrust: null,
        },
      }),
    ),
    settle(buildAutonomousThemenradarReadModel({ scope: { adminContext: true }, limit: 8 })),
    settle(buildFeedRadarRuntimeReadModel()),
    settle(buildMaterialExtractionJobReadModel({ limit: 8 })),
    settle(loadDossierUpdateSummary()),
    settle(loadSocialDistributionQueueReadModel({ limit: 16 })),
    settle(
      Promise.all([
        getRegionEntitlementRuntimeRepo().listEntitlementsForAdmin(),
        listPricingOrders({ limit: 80 }),
      ]).then(([entitlements, orders]) => ({ entitlements, orders })),
    ),
  ]);

  const areas = [
    buildReviewArea(reviewResult),
    buildThemenradarArea(themenradarResult),
    buildFeedArea(feedRuntimeResult),
    buildSourceAutomationArea(feedRuntimeResult),
    buildMaterialArea(materialResult),
    buildDossierArea(dossierResult),
    buildSocialArea(socialResult),
    buildPaymentsArea(paymentsResult),
  ];

  const reviewSummary = reviewResult.ok ? reviewResult.value.summary.total : "Nicht geladen";
  const sourceFailures = feedRuntimeResult.ok
    ? feedRuntimeResult.value.sourceAutomation.summary.failingSources
    : "Nicht geladen";
  const waitingMaterialJobs = materialResult.ok
    ? materialResult.value.summary.waitingJobs
    : "Nicht geladen";
  const pendingDossierUpdates = dossierResult.ok ? dossierResult.value.pending : "Nicht geladen";
  const socialQueueReviewOpen = socialResult.ok ? socialResult.value.summary.reviewOpen : "Nicht geladen";

  return {
    generatedAt: new Date().toISOString(),
    hero: {
      openOperatorTasks: reviewSummary,
      sourceFailures,
      waitingMaterialJobs,
      pendingDossierUpdates,
      socialQueueReviewOpen,
    },
    areas,
    nextActions: buildNextActions(areas),
    guardrails: {
      noNewBackend: true,
      noFakeActions: true,
      reviewFirst: true,
      noAutoPublish: true,
      noSecretProviderClaims: true,
    },
  };
}
