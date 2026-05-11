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

type ApiResponse =
  | { ok: true; dossier: Dossier }
  | { ok: false; error?: string };

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

export default function DossierPageClient({
  dossierId,
  handoffId = null,
}: {
  dossierId: string;
  handoffId?: string | null;
}) {
  const [dossier, setDossier] = useState<Dossier>(demoFallback);
  const [loaded, setLoaded] = useState(false);
  const handoffDraft = useCreateHandoffDraft(handoffId);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/dossier/${encodeURIComponent(dossierId)}`, { cache: "no-store" })
      .then((r) => r.json() as Promise<ApiResponse>)
      .then((data) => {
        if (cancelled) return;
        if (data.ok) setDossier(data.dossier);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [dossierId]);

  const shareAsset = buildShareOutputAsset({
    baseUrl: BRAND.baseUrl,
    canonicalPathOrUrl: `/dossier/${dossierId}`,
    objectType: "dossier",
    title: dossier?.meta?.title ?? `Dossier ${dossierId}`,
    subtitle: extractDossierSubtitle(dossier),
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
      {!loaded ? (
        <p className="text-xs text-[rgb(var(--muted))]">Dossier wird geladen…</p>
      ) : null}
      {handoffDraft ? (
        <div className="mb-4">
          <CreateHandoffPanel draft={handoffDraft} title="Aus deinem Beitrag vorbereitet" />
          <p className="mt-2 text-xs text-[rgb(var(--muted))]">
            Keine stille Anheftung an bestehende Dossiers. Der Handoff bleibt reviewbar und bestaetigungspflichtig.
          </p>
        </div>
      ) : null}
      <p className="mb-3 text-xs text-[rgb(var(--muted))]">
        Dossier = strukturierte Verdichtung; der thematische Arbeitskontext bleibt bei den Anlässen (/runden).
      </p>
      <div className="mb-4">
        <ShareDeepLinkActions path={`/dossier/${dossierId}`} title="Dossier" text="Dossier-Link in eDebatte" />
      </div>
      <div className="mb-4">
        <SocialOutputPreviewPanel asset={shareAsset} carousel={carousel} />
      </div>
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
      <DossierViewer dossier={dossier} />
    </div>
  );
}
