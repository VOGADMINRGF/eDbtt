"use client";

import { useEffect, useState } from "react";
import type { Dossier } from "@features/dossier";
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

type ApiResponse =
  | { ok: true; dossier: Dossier }
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

export function DossierPagePublicBody({
  dossierId,
  handoffDraft,
  dossier,
  loadState,
}: {
  dossierId: string;
  handoffDraft: ReturnType<typeof useCreateHandoffDraft>;
  dossier: Dossier | null;
  loadState: DossierLoadState;
}) {
  const showPublicReadingSurface = shouldShowPublicReadingSurface(loadState);
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
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
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
      <p className="mb-3 text-xs text-[rgb(var(--muted))]">
        Dossier = strukturierte Verdichtung; der thematische Arbeitskontext bleibt bei den Anlässen (/runden).
      </p>
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
          setLoadState("ready");
          return;
        }
        const errorCode = "error" in data ? data.error : undefined;
        setDossier(null);
        setLoadState(errorCode === "dossier_review_only" ? "review_only" : "not_found");
      })
      .catch(() => {
        if (cancelled) return;
        setDossier(null);
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
    />
  );
}
