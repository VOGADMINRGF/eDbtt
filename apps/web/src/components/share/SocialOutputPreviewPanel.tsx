import {
  buildNeutralCarouselDraft,
  buildShareCardPreview,
  type ShareOutputAsset,
  type ShareCarouselSlide,
  type StreamPreparationOutput,
} from "@features/share/socialOutputContract";
import ShareDeepLinkActions from "@/components/mobile/ShareDeepLinkActions";

type SocialOutputPreviewPanelProps = {
  asset: ShareOutputAsset;
  carousel?: ShareCarouselSlide[];
  streamPreparation?: StreamPreparationOutput | null;
  className?: string;
};

function resolvePathFromAsset(asset: ShareOutputAsset): string {
  if (asset.deepLinkPath) return asset.deepLinkPath;
  try {
    const parsed = new URL(asset.canonicalUrl);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return asset.canonicalUrl;
  }
}

export default function SocialOutputPreviewPanel({
  asset,
  carousel,
  streamPreparation,
  className,
}: SocialOutputPreviewPanelProps) {
  const card = buildShareCardPreview(asset);
  const slides = (carousel ?? buildNeutralCarouselDraft(asset)).slice(0, 3);
  const path = resolvePathFromAsset(asset);

  return (
    <section
      className={`space-y-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 ${className ?? ""}`.trim()}
    >
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Share-/Output-Vorbereitung
        </p>
        <p className="text-sm text-[rgb(var(--muted))]">
          Neutraler Vorschaupfad ohne werbliche Zuspitzung. Ausgabe vorbereitet, nicht automatisch verbreitet.
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5 text-[10px]">
        <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-0.5 font-semibold text-[rgb(var(--muted))]">
          Typ: {asset.objectLabel}
        </span>
        <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-0.5 font-semibold text-[rgb(var(--muted))]">
          Status: {asset.verification.verificationLabelDisplay}
        </span>
        <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-0.5 font-semibold text-[rgb(var(--muted))]">
          Quellenlage: {asset.verification.sourceSupportLabel}
        </span>
        {asset.verification.reviewRecommended ? (
          <span className="rounded-full border border-amber-300/60 bg-amber-50/80 px-2 py-0.5 font-semibold text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-200">
            Prüfung empfohlen
          </span>
        ) : null}
        <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-0.5 font-semibold text-[rgb(var(--muted))]">
          Noch nicht veröffentlicht
        </span>
        <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-0.5 font-semibold text-[rgb(var(--muted))]">
          Keine automatische Graph-Promotion
        </span>
        <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-0.5 font-semibold text-[rgb(var(--muted))]">
          Kommunikationsentwurf in Prüfung
        </span>
      </div>

      <p className="text-xs text-[rgb(var(--muted))]">{asset.verification.verificationHint}</p>

      <ShareDeepLinkActions
        path={path}
        title={asset.title}
        text={asset.sharePayload.text}
      />

      <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Card Preview</p>
        <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">{card.headline}</p>
        <p className="mt-1 text-xs text-[rgb(var(--muted))]">{card.subline}</p>
        <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">{card.metaLine}</p>
        <p className="mt-1 text-[11px] text-[rgb(var(--muted))]">{card.ctaLabel}</p>
      </div>

      <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Carousel-Draft</p>
        <ul className="mt-2 space-y-1.5">
          {slides.map((slide) => (
            <li key={slide.id} className="text-xs text-[rgb(var(--muted))]">
              <span className="font-semibold text-[rgb(var(--fg))]">{slide.title}:</span> {slide.body}
            </li>
          ))}
        </ul>
      </div>

      {streamPreparation ? (
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Stream-/Clip-Vorbereitung
          </p>
          <p className="mt-1 text-xs text-[rgb(var(--muted))]">{streamPreparation.shortSummary}</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-[rgb(var(--muted))]">
            {streamPreparation.highlightBullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
          {streamPreparation.quoteCandidate ? (
            <p className="mt-2 text-xs text-[rgb(var(--muted))]">
              Zitatkandidat: <span className="font-medium text-[rgb(var(--fg))]">{streamPreparation.quoteCandidate}</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
