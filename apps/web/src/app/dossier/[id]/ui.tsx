"use client";

import { useEffect, useState } from "react";
import type { Dossier } from "@features/dossier";
import type { DossierPublicUpdateContext } from "@features/dossier/updateReadModel";
import demoFallback from "@features/dossier/data/demoDossier";
import { DossierViewer } from "@/components/dossier/DossierViewer";
import RouteBoundCompanionPanel from "@/components/ai/RouteBoundCompanionPanel";
import ShareDeepLinkActions from "@/components/mobile/ShareDeepLinkActions";
import SocialOutputPreviewPanel from "@/components/share/SocialOutputPreviewPanel";
import {
  buildNeutralCarouselDraft,
  buildShareOutputAsset,
} from "@features/share/socialOutputContract";
import { BRAND } from "@/lib/brand";
import { CreateHandoffPanel } from "@/features/create/CreateHandoffPanel";
import { useCreateHandoffDraft } from "@/features/create/useCreateHandoffDraft";
import {
  isRegionDraftDossierId,
  shouldAllowDemoDossierFallback,
} from "@/features/runtimeDataGuardrails";
import {
  resolveDossierStatusChips,
  toneClassForB2CStatus,
} from "@/features/b2cJourney/statusContract";
import PwaRouteStatusHint from "@/components/mobile/PwaRouteStatusHint";

type ApiResponse =
  | { ok: true; dossier: Dossier; updateContext?: DossierPublicUpdateContext | null }
  | { ok: false; error?: string; dossierId?: string; status?: string };

type DossierLoadState = "loading" | "ready" | "review_only" | "not_found" | "load_failed";

function extractDossierSubtitle(dossier: Dossier): string {
  const fromAnalyzeSummary = (dossier as any)?.analyze?.summary;
  if (typeof fromAnalyzeSummary === "string" && fromAnalyzeSummary.trim().length > 0) {
    return fromAnalyzeSummary.trim();
  }
  if (fromAnalyzeSummary && typeof fromAnalyzeSummary === "object") {
    const candidate =
      (fromAnalyzeSummary.short ??
        fromAnalyzeSummary.text ??
        fromAnalyzeSummary.summary) as string | undefined;
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  const firstClaim =
    (dossier as any)?.analyze?.claims?.[0]?.title ??
    (dossier as any)?.analyze?.claims?.[0]?.text;
  if (typeof firstClaim === "string" && firstClaim.trim().length > 0) {
    return firstClaim.trim();
  }
  return "Kontext und Einordnung für den weiteren Arbeitsprozess.";
}

function fallbackDossierSubtitle(dossierId: string): string {
  if (isRegionDraftDossierId(dossierId)) {
    return "Reviewpflichtiger Dossier-Draft aus dem Region-Dashboard. Keine veröffentlichte Viewer-Fassung verfügbar.";
  }
  return "Dossierdaten werden geladen oder liegen noch nicht als veröffentlichbare Viewer-Fassung vor.";
}

function shouldShowPublicReadingSurface(loadState: DossierLoadState) {
  return loadState === "ready";
}

function updateToneClass(tone: DossierPublicUpdateContext["publishedItems"][number]["tone"]) {
  switch (tone) {
    case "success":
      return "border-emerald-300/70 bg-emerald-500/10 text-emerald-950";
    case "warning":
      return "border-amber-300/70 bg-amber-500/10 text-amber-950";
    case "danger":
      return "border-rose-300/70 bg-rose-500/10 text-rose-950";
    case "info":
      return "border-sky-300/70 bg-sky-500/10 text-sky-950";
    case "neutral":
    default:
      return "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))]";
  }
}

function formatShortDate(value?: string | null) {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return null;
  }
}

export function DossierPagePublicBody({
  dossierId,
  handoffDraft,
  dossier,
  loadState,
  updateContext = null,
}: {
  dossierId: string;
  handoffDraft: ReturnType<typeof useCreateHandoffDraft>;
  dossier: Dossier | null;
  loadState: DossierLoadState;
  updateContext?: DossierPublicUpdateContext | null;
}) {
  const showPublicReadingSurface = shouldShowPublicReadingSurface(loadState);
  const statusChips = resolveDossierStatusChips({
    loadState,
    handoffDraft,
  });
  const shareAsset = buildShareOutputAsset({
    baseUrl: BRAND.baseUrl,
    canonicalPathOrUrl: `/dossier/${dossierId}`,
    objectType: "dossier",
    title: dossier?.meta?.title ?? `Dossier ${dossierId}`,
    subtitle: dossier ? extractDossierSubtitle(dossier) : fallbackDossierSubtitle(dossierId),
    lane: "standard",
    verificationMode: "precheck",
    researchUsed: "none",
    sealEligible: false,
    sealGranted: false,
    topic: (dossier as any)?.meta?.jurisdiction ?? null,
    region: dossier?.meta?.region ?? null,
    neutralCtaLabel: "Dossier öffnen",
    deepLinkPath: `/dossier/${dossierId}`,
  });

  const carousel = buildNeutralCarouselDraft(shareAsset, {
    highlights: [
      (dossier as any)?.analyze?.open_questions?.[0]?.q,
      (dossier as any)?.analyze?.openQuestions?.[0],
      (dossier as any)?.analyze?.claims?.[0]?.title,
    ].filter((item): item is string => typeof item === "string" && item.trim().length > 0),
  });

  return (
    <div className="public-shell mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
      {loadState === "loading" ? (
        <p className="text-xs text-[rgb(var(--muted))]">Dossier wird geladen…</p>
      ) : null}
      {handoffDraft ? (
        <div className="mb-4">
          <CreateHandoffPanel draft={handoffDraft} title="Aus deinem Beitrag vorbereitet" />
          <p className="mt-2 text-xs text-[rgb(var(--muted))]">
            Keine stille Anheftung an bestehende Dossiers. Der Handoff bleibt reviewbar und bestätigungspflichtig.
          </p>
        </div>
      ) : null}
      <div className="mb-4 flex flex-wrap gap-2">
        {statusChips.map((chip) => (
          <span
            key={`${dossierId}-${chip.key}`}
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${toneClassForB2CStatus(chip.tone)}`}
          >
            {chip.label}
          </span>
        ))}
      </div>
      <div className="mb-4">
        <PwaRouteStatusHint
          title="Dossier-Kontext mobil"
          body="Dieses Dossier bleibt ein lesbarer Kontextpfad zwischen Swipes, Anlassraum und späteren Event-/Stream-Follow-ups. Sichtbar ist nur der aktuelle Stand, nicht automatisch eine Freigabe."
          caution="Ohne Verbindung bleiben nur bereits geladene Dossier-Inhalte lesbar. Share-, Watchlist- oder Folgeaktionen werden nicht offline übernommen."
          actions={[
            { href: "/swipes", label: "Themenlage öffnen" },
            { href: "/runden", label: "Anlassraum ansehen" },
            { href: "/stream", label: "Event-Pfade öffnen" },
          ]}
          tone="light"
        />
      </div>
      <p className="mb-3 text-xs text-[rgb(var(--muted))]">
        Dossier = strukturierte Verdichtung; der thematische Arbeitskontext bleibt bei den Anlässen (/runden).
      </p>
      <section className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Quellenlage</h2>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
            Das Dossier sammelt Belege, Material und Referenzen, ohne daraus automatisch amtliche Wahrheit abzuleiten.
          </p>
        </article>
        <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Offene Fragen</h2>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
            Offene Punkte bleiben sichtbar. Ein Dossier soll Unsicherheit markieren, nicht verstecken.
          </p>
        </article>
        <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Verschiedene Perspektiven</h2>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
            Beiträge, Gegenpositionen und Einordnungen bleiben nebeneinander nachvollziehbar, statt in einer Meinung zu verschwinden.
          </p>
        </article>
        <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Stand und Update</h2>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
            Sichtbar heißt hier: aktueller Arbeitsstand. Prüfung, Veröffentlichung und spätere Archivierung bleiben getrennte Schritte.
          </p>
        </article>
      </section>
      {updateContext ? (
        <section className="mb-4 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h2 className="text-base font-semibold text-[rgb(var(--fg))]">Stand, neue Hinweise und nächste Schritte</h2>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                {updateContext.checkedStandLabel}: {updateContext.checkedStandHint}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {updateContext.originSummary.map((entry) => (
                  <span
                    key={`origin-${entry.origin}`}
                    className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2.5 py-1 font-medium text-[rgb(var(--fg))]"
                  >
                    {entry.label}: {entry.count}
                  </span>
                ))}
                {updateContext.sectionSummary.map((entry) => (
                  <span
                    key={`section-${entry.section}`}
                    className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2.5 py-1 font-medium text-[rgb(var(--fg))]"
                  >
                    {entry.label}: {entry.count}
                  </span>
                ))}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                  <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Neu oder in Prüfung</h3>
                  {updateContext.reviewItems.length > 0 ? (
                    <div className="mt-3 space-y-3">
                      {updateContext.reviewItems.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
                          <div className="flex flex-wrap gap-2 text-[11px]">
                            <span className={`rounded-full border px-2 py-0.5 font-semibold ${updateToneClass(item.tone)}`}>
                              {item.statusLabel}
                            </span>
                            <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[rgb(var(--muted))]">
                              {item.originLabel}
                            </span>
                            <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[rgb(var(--muted))]">
                              {item.sectionLabel}
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">{item.title}</p>
                          <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">{item.summary}</p>
                          <p className="mt-2 text-xs leading-5 text-[rgb(var(--muted))]">
                            {item.reviewHint}
                            {item.riskHint ? ` ${item.riskHint}` : ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                      Aktuell liegen keine zusätzlichen Update-Vorschläge in Prüfung vor.
                    </p>
                  )}
                </article>
                <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                  <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Bereits im Dossier-Kontext</h3>
                  {updateContext.publishedItems.length > 0 ? (
                    <div className="mt-3 space-y-3">
                      {updateContext.publishedItems.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
                          <div className="flex flex-wrap gap-2 text-[11px]">
                            <span className={`rounded-full border px-2 py-0.5 font-semibold ${updateToneClass(item.tone)}`}>
                              {item.statusLabel}
                            </span>
                            <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[rgb(var(--muted))]">
                              {item.originLabel}
                            </span>
                          </div>
                          <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">{item.title}</p>
                          <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">{item.summary}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                      Dieser Dossierstand zeigt vor allem Kontext, Quellen und offene Fragen. Neue Übernahmen bleiben getrennt reviewbar.
                    </p>
                  )}
                </article>
              </div>
            </div>
            <aside className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Verknüpfte Bürgerpfade</h3>
              <div className="mt-3 space-y-3 text-sm text-[rgb(var(--muted))]">
                {updateContext.relatedContext.anlassraumHref ? (
                  <div>
                    <p className="font-medium text-[rgb(var(--fg))]">Anlassraum</p>
                    <p className="mt-1">{updateContext.relatedContext.anlassraumLabel ?? "Beteiligung läuft im Anlassraum weiter."}</p>
                    <a
                      href={updateContext.relatedContext.anlassraumHref}
                      className="mt-2 inline-flex font-semibold text-[rgb(var(--fg))] hover:text-[rgb(var(--grad-from))]"
                    >
                      Zum Anlassraum
                    </a>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium text-[rgb(var(--fg))]">Anlassraum</p>
                    <p className="mt-1">Noch kein direkter Anlassraum verknüpft. Beteiligung kann später dort weiterlaufen.</p>
                  </div>
                )}
                {updateContext.relatedContext.swipesHref ? (
                  <div>
                    <p className="font-medium text-[rgb(var(--fg))]">Swipes</p>
                    <p className="mt-1">Wenn aus dem Dossier eine konkrete Aussage oder Entscheidungslinie entsteht, kann sie dort weiter beteiligt werden.</p>
                    <a
                      href={updateContext.relatedContext.swipesHref}
                      className="mt-2 inline-flex font-semibold text-[rgb(var(--fg))] hover:text-[rgb(var(--grad-from))]"
                    >
                      {updateContext.relatedContext.swipesLabel ?? "Zu Swipes"}
                    </a>
                  </div>
                ) : null}
                <div>
                  <p className="font-medium text-[rgb(var(--fg))]">Letzter sichtbarer Stand</p>
                  <p className="mt-1">
                    Öffentlich eingebundene Updates: {formatShortDate(updateContext.latestPublicUpdateAt) ?? "noch kein zusätzlicher Updatehinweis"}
                  </p>
                  <p className="mt-1">
                    Offene Prüfung: {formatShortDate(updateContext.latestReviewUpdateAt) ?? "derzeit keine neuen Review-Hinweise"}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>
      ) : null}
      {showPublicReadingSurface ? (
        <section className="mb-4 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
          <h2 className="text-base font-semibold text-[rgb(var(--fg))]">Öffentlich lesbarer Dossierstand</h2>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            Diese Dossieransicht ist als lesbarer öffentlicher Arbeitsstand gedacht. Sichtbar heißt
            nicht automatisch geprüft oder amtlich.
          </p>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            Amtlich freigegeben bleibt ausschließlich der Official-Release-Pfad. Wird Sichtbarkeit
            zurückgenommen oder archiviert, verschwindet auch dieser öffentliche Linkpfad wieder.
          </p>
        </section>
      ) : null}
      {showPublicReadingSurface ? (
        <div className="mb-4">
          <ShareDeepLinkActions path={`/dossier/${dossierId}`} title="Dossier" text="Dossier-Link in eDebatte" />
        </div>
      ) : null}
      {showPublicReadingSurface ? (
        <div className="mb-4">
          <p className="mb-2 text-xs text-[rgb(var(--muted))]">
            Die folgende Share-/Output-Vorschau ist ein Kommunikationsentwurf. Sie zeigt vorbereitete Ausgabeformen, nicht eine externe Veröffentlichung.
          </p>
          <SocialOutputPreviewPanel asset={shareAsset} carousel={carousel} />
        </div>
      ) : null}
      {showPublicReadingSurface ? (
        <div className="mb-4">
          <RouteBoundCompanionPanel
            contextKind="dossier"
            title="Dossier"
            routePath={`/dossier/${dossierId}`}
            analysisMode="media"
            intro="Companion für Dossier-Nachfragen auf Media-/Dossier-Journey, ohne implizites Siegel."
            placeholder="Welche Konfliktlinie oder Quelle soll im Dossier als Nächstes geklärt werden?"
            parentStatus={{
              lane: "standard",
              verificationMode: "precheck",
              researchUsed: "none",
              sealEligible: false,
              sealGranted: false,
            }}
          />
        </div>
      ) : null}
      {loadState === "review_only" ? (
        <section className="rounded-3xl border border-amber-500/40 bg-amber-500/10 p-5 text-sm text-amber-950">
          <h2 className="text-base font-semibold">Reviewpflichtiger Dossier-Draft</h2>
          <p className="mt-2">
            Dieser Dossierpfad verweist auf einen reviewpflichtigen Draft. Solange noch keine vollständige
            Viewer-Fassung vorliegt, wird bewusst kein Demo-Dossier eingeblendet.
          </p>
          <p className="mt-2">
            Öffentlicher Link, Share-Fläche und QR bleiben aus, solange dieser Stand nur intern geprüft
            wird.
          </p>
          <p className="mt-2 text-xs">
            Status: Draft/Review-only. Keine automatische Veröffentlichung, keine produktive Demo-Ersetzung.
          </p>
        </section>
      ) : null}
      {loadState === "not_found" ? (
        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 text-sm text-[rgb(var(--muted))]">
          <h2 className="text-base font-semibold text-[rgb(var(--fg))]">Dossier nicht gefunden</h2>
          <p className="mt-2">
            Für diese ID liegt aktuell kein verfügbares Dossier vor. Es wird kein generischer Demo-Inhalt als
            Ersatz angezeigt.
          </p>
          {isRegionDraftDossierId(dossierId) ? (
            <p className="mt-2 text-xs">
              Region-Draft-IDs bleiben reviewpflichtig und zeigen ohne Runtime-Daten einen ehrlichen Leerzustand.
            </p>
          ) : null}
        </section>
      ) : null}
      {loadState === "load_failed" ? (
        <section className="rounded-3xl border border-rose-500/40 bg-rose-500/10 p-5 text-sm text-rose-950">
          <h2 className="text-base font-semibold">Dossier konnte nicht geladen werden</h2>
          <p className="mt-2">
            Die Runtime-Daten sind aktuell nicht verfügbar. Es wird bewusst kein Demo-Fallback aus einem
            produktnahen Dossierpfad angezeigt.
          </p>
        </section>
      ) : null}
      {dossier ? <DossierViewer dossier={dossier} /> : null}
    </div>
  );
}

export default function DossierPageClient({
  dossierId,
  handoffId = null,
}: {
  dossierId: string;
  handoffId?: string | null;
}) {
  const demoAllowed = shouldAllowDemoDossierFallback(dossierId);
  const [dossier, setDossier] = useState<Dossier | null>(demoAllowed ? demoFallback : null);
  const [loadState, setLoadState] = useState<DossierLoadState>(demoAllowed ? "ready" : "loading");
  const [updateContext, setUpdateContext] = useState<DossierPublicUpdateContext | null>(null);
  const handoffDraft = useCreateHandoffDraft(handoffId);

  useEffect(() => {
    if (demoAllowed) return;
    let cancelled = false;
    fetch(`/api/dossier/${encodeURIComponent(dossierId)}`, { cache: "no-store" })
      .then((r) => r.json() as Promise<ApiResponse>)
      .then((data) => {
        if (cancelled) return;
        if (data.ok) {
          setDossier(data.dossier);
          setUpdateContext(data.updateContext ?? null);
          setLoadState("ready");
          return;
        }
        const errorCode = "error" in data ? data.error : undefined;
        setDossier(null);
        setUpdateContext(null);
        setLoadState(errorCode === "dossier_review_only" ? "review_only" : "not_found");
      })
      .catch(() => {
        if (cancelled) return;
        setDossier(null);
        setUpdateContext(null);
        setLoadState("load_failed");
      });
    return () => {
      cancelled = true;
    };
  }, [demoAllowed, dossierId]);
  return (
    <DossierPagePublicBody
      dossierId={dossierId}
      handoffDraft={handoffDraft}
      dossier={dossier}
      loadState={loadState}
      updateContext={updateContext}
    />
  );
}
