import Link from "next/link";
import type { SocialCarouselOutput, SocialCarouselSlide } from "@features/outputEngine";

type SocialCarouselPreviewProps = {
  carousel: SocialCarouselOutput;
  reviewRequired: boolean;
};

function kindLabel(kind: SocialCarouselSlide["kind"]): string {
  if (kind === "headline") return "Leitfrage";
  if (kind === "anlass") return "Anlass";
  if (kind === "documented") return "Belegt";
  if (kind === "disputed") return "Offen";
  if (kind === "options") return "Optionen";
  if (kind === "cta") return "Beteiligung";
  return "Hinweis";
}

function sourceStateLabel(state: SocialCarouselSlide["sourceState"]): string | null {
  if (state === "sufficient") return "Quellenstand: ausreichend";
  if (state === "missing") return "Quellenstand: unvollständig";
  return null;
}

function publicationStatusLabel(status: SocialCarouselOutput["publicationStatus"]): string {
  if (status === "draft_review_required") return "Entwurf mit Reviewpflicht";
  return status;
}

export default function SocialCarouselPreview({ carousel, reviewRequired }: SocialCarouselPreviewProps) {
  const defaultVariantLabel =
    carousel.variants.find((variant) => variant.variant === carousel.defaultVariant)?.label ??
    carousel.defaultVariant;

  return (
    <section
      aria-label="Instagram-Version Vorschau"
      className="mt-6 overflow-hidden rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]"
    >
      <div className="bg-[linear-gradient(135deg,rgba(6,78,146,0.9),rgba(8,47,73,0.95)_45%,rgba(76,29,149,0.9))] px-5 py-6 text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">Kanal-Version</p>
        <h3 className="mt-2 text-2xl font-semibold leading-tight">Instagram Carousel · Vorschau</h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-cyan-100">
          Publikationsreif, review-gebunden. Noch nicht live veröffentlicht.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-cyan-200/50 bg-cyan-50/10 px-2 py-1 text-cyan-100">
            Variante: {defaultVariantLabel}
          </span>
          <span className="rounded-full border border-cyan-200/50 bg-cyan-50/10 px-2 py-1 text-cyan-100">
            Status: {publicationStatusLabel(carousel.publicationStatus)}
          </span>
          {reviewRequired ? (
            <span className="rounded-full border border-amber-200/60 bg-amber-300/20 px-2 py-1 font-semibold text-amber-100">
              Review erforderlich
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-2 text-xs text-[rgb(var(--muted))]">
          {carousel.variants.map((variant) => (
            <span key={variant.variant} className="rounded-full border border-[rgb(var(--border))] px-2 py-1">
              {variant.label}
            </span>
          ))}
        </div>

        <ol aria-label="Carousel-Folien" className="mt-4 grid gap-4 md:grid-cols-2">
          {carousel.slides.map((slide, index) => {
            const sourceLabel = sourceStateLabel(slide.sourceState);
            const isFinal = slide.kind === "cta" || index === carousel.slideCount - 1;

            return (
              <li
                key={slide.id}
                aria-label={`Carousel-Folie ${index + 1}`}
                className={`relative overflow-hidden rounded-3xl border p-4 shadow-sm ${
                  isFinal
                    ? "border-emerald-400/50 bg-[linear-gradient(165deg,rgba(6,95,70,0.25),rgba(6,78,59,0.08))]"
                    : "border-[rgb(var(--border))] bg-[linear-gradient(165deg,rgba(14,116,144,0.12),rgba(30,64,175,0.05))]"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                    Folie {index + 1} von {carousel.slideCount}
                  </p>
                  <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-0.5 text-[11px] text-[rgb(var(--muted))]">
                    {slide.eyebrow ?? kindLabel(slide.kind)}
                  </span>
                </div>

                <h4 className="mt-2 text-lg font-semibold leading-snug text-[rgb(var(--fg))]">{slide.title}</h4>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[rgb(var(--fg))]">{slide.body}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {sourceLabel ?
                    <span className="rounded-full border border-sky-400/40 bg-sky-400/10 px-2 py-0.5 text-[11px] text-sky-700 dark:text-sky-200">
                      {sourceLabel}
                    </span>
                  : null}
                  {slide.reviewWarning ?
                    <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-700 dark:text-amber-200">
                      {slide.reviewWarning}
                    </span>
                  : null}
                </div>

                {slide.cta ? (
                  <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Handlung</p>
                    <Link
                      href={slide.cta.target}
                      className="mt-1 inline-flex text-sm font-semibold text-[rgb(var(--fg))] underline underline-offset-2"
                    >
                      {slide.cta.label}
                    </Link>
                  </div>
                ) : null}

                {slide.backlinkTarget ? (
                  <p className="mt-3 text-xs text-[rgb(var(--muted))]">
                    Dossier-Backlink: <span className="break-all">{slide.backlinkTarget}</span>
                  </p>
                ) : null}

                <p className="mt-3 text-[11px] uppercase tracking-wide text-[rgb(var(--muted))]">
                  eDebatte Studio · Review-gebunden
                </p>
              </li>
            );
          })}
        </ol>

        <section
          aria-label="Kanal-Metadaten"
          className="mt-5 grid gap-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 lg:grid-cols-3"
        >
          <article className="lg:col-span-2">
            <h4 className="text-sm font-semibold">Beispieltext</h4>
            <p className="mt-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 text-sm leading-relaxed text-[rgb(var(--fg))]">
              {carousel.suggestedPostText}
            </p>
            <p className="mt-2 text-xs text-[rgb(var(--muted))]">Veröffentlichung erst nach Review.</p>
          </article>

          <article>
            <h4 className="text-sm font-semibold">Beste Zeitfenster</h4>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Beste Zeitfenster</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {carousel.suggestedPostingWindows.map((window) => (
                <span key={window} className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2 py-1 text-xs text-[rgb(var(--fg))]">
                  {window}
                </span>
              ))}
            </div>

            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Hashtag-Vorschlag</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {carousel.suggestedHashtags.map((tag) => (
                <span key={tag} className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-xs text-cyan-700 dark:text-cyan-200">
                  {tag}
                </span>
              ))}
            </div>
          </article>

          <article className="lg:col-span-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Dossier-Bezug</p>
            <p className="mt-2 text-sm text-[rgb(var(--fg))]">{carousel.participationQuestion}</p>
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">Regionaler Kontext: {carousel.regionalContext}</p>
            <p className="mt-1 text-xs text-[rgb(var(--muted))]">Motiv-Hinweis: {carousel.motifHint}</p>
            <p className="mt-2 text-xs text-[rgb(var(--muted))]">{carousel.automationHint}</p>
            <p className="mt-2 text-xs text-[rgb(var(--muted))]">
              Diese Version wird aus dem Dossier-Post abgeleitet und bleibt review-gebunden.
            </p>
          </article>
        </section>
      </div>
    </section>
  );
}
