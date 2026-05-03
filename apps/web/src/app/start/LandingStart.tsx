"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExampleItem } from "@/lib/examples/types";
import type { BucketBlock } from "@/components/landing/ExamplesBackdrop";
import { ExamplesMarqueeRows } from "@/components/landing/ExamplesMarqueeRows";
import { useLocale } from "@/context/LocaleContext";
import { normalizeLang } from "@features/landing/landingCopy";
import {
  CREATE_PRODUCT_MODE_VALUES,
  type CreateProductMode,
} from "@/features/create/createProductModes";
import type { CreateIntent } from "@/features/create/intents";
import {
  getCreateComposerTexts,
  getCreateContextAnchorDefinitions,
  getCreateHelperLinks,
  getCreateSurfaceModeDefinitions,
  getCreateSurfaceTexts,
  resolveCreateContextAnchorById,
  resolveCreateModeDefinition,
  resolveCreateSurfaceLocale,
} from "@/features/create/createSurfaceConfig";
import SharedCreateComposer from "@/features/create/SharedCreateComposer";

type LandingStartProps = {
  blocks: BucketBlock[];
};

export default function LandingStart({ blocks }: LandingStartProps) {
  const { locale } = useLocale();
  const lang = useMemo(() => normalizeLang(locale), [locale]);
  const surfaceLocale = useMemo(() => resolveCreateSurfaceLocale(locale), [locale]);
  const surfaceTexts = useMemo(() => getCreateSurfaceTexts(surfaceLocale), [surfaceLocale]);
  const surfaceComposerTexts = useMemo(
    () => getCreateComposerTexts(surfaceLocale),
    [surfaceLocale],
  );
  const surfaceModeDefinitions = useMemo(
    () => getCreateSurfaceModeDefinitions(surfaceLocale),
    [surfaceLocale],
  );
  const surfaceContextAnchors = useMemo(
    () => getCreateContextAnchorDefinitions(surfaceLocale),
    [surfaceLocale],
  );
  const surfaceHelperLinks = useMemo(() => getCreateHelperLinks(surfaceLocale), [surfaceLocale]);
  const router = useRouter();

  const [liveBlocks, setLiveBlocks] = useState<BucketBlock[]>(() => blocks);
  const [productMode, setProductMode] = useState<CreateProductMode>("analyze");
  const [activeContextAnchorId, setActiveContextAnchorId] = useState<CreateIntent | null>(null);
  const [intakeText, setIntakeText] = useState("");
  const [intakeError, setIntakeError] = useState<string | null>(null);

  const titleForLang = useCallback(
    (item: ExampleItem) => (lang === "en" ? item.title_en || item.title_de : item.title_de),
    [lang],
  );

  const ingestExample = useCallback(
    (item: ExampleItem) => {
      const title = titleForLang(item);
      const topics = lang === "en" ? item.topics_en || item.topics : item.topics;
      try {
        void fetch("/api/examples/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          keepalive: true,
          body: JSON.stringify({
            exampleId: item.id,
            lang,
            title,
            kind: item.kind,
            scope: item.scope,
            topics,
            country: item.country,
            region: item.region,
          }),
        });
      } catch {
        // ignore
      }
    },
    [lang, titleForLang],
  );

  const productModeConfig = useMemo(
    () => resolveCreateModeDefinition(productMode, surfaceLocale),
    [productMode, surfaceLocale],
  );
  const activeContextAnchor = useMemo(
    () => resolveCreateContextAnchorById(activeContextAnchorId, surfaceLocale),
    [activeContextAnchorId, surfaceLocale],
  );
  const intakeHelperText = activeContextAnchor?.helperText ?? productModeConfig.helperText;
  const intakePlaceholder = activeContextAnchor?.placeholder ?? productModeConfig.placeholder;

  const handleStart = useCallback(() => {
    if (!intakeText.trim()) {
      setIntakeError(surfaceTexts.intakeMissingError);
      return;
    }
    const query = new URLSearchParams();
    query.set("entryIntent", productModeConfig.entryIntent);
    query.set("entryMode", productModeConfig.entryMode);
    query.set("source", "start_surface");
    query.set("reason", "shared_composer_primary_entry");
    query.set("prefill", intakeText.trim());
    router.push(`/create?${query.toString()}` as any);
  }, [
    intakeText,
    productModeConfig.entryIntent,
    productModeConfig.entryMode,
    router,
    surfaceTexts.intakeMissingError,
  ]);

  return (
    <section className="relative h-[100svh] min-h-screen overflow-hidden bg-[rgb(var(--bg))]">
      <ExamplesMarqueeRows
        blocks={liveBlocks}
        lang={lang}
        onPick={(item) => {
          setIntakeText(titleForLang(item));
        }}
        onOpen={(item) => {
          ingestExample(item);
          const target =
            `/demo/dossier?persona=citizen` +
            `&from=landing` +
            `&kind=${encodeURIComponent(item.kind)}` +
            `&scope=${encodeURIComponent(item.scope)}`;
          router.push(target as any);
        }}
      />

      <div className="relative z-10 mx-auto grid h-full w-full max-w-5xl place-items-center px-4 py-6 sm:px-6 [@media(max-height:740px)]:py-3">
        <div className="w-full max-w-3xl">
          <div className="max-h-[calc(100svh-3rem)] overflow-y-auto [scrollbar-gutter:stable]">
            <section className="mb-4 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                {lang === "en" ? "Public participation clarity" : "Öffentliche Beteiligung klar erklärt"}
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-[rgb(var(--fg))] sm:text-2xl">
                {lang === "en"
                  ? "Public participation starts with a clear dossier."
                  : "Öffentliche Beteiligung beginnt mit einem klaren Dossier."}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">
                {lang === "en"
                  ? "eDebatte is the participation and dossier tool. VoiceOpenGov is the initiative and civic framework behind it."
                  : "eDebatte ist das Beteiligungs- und Dossier-Tool. VoiceOpenGov ist die Initiative und der Beteiligungsrahmen dahinter."}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">
                {lang === "en"
                  ? "Signal -> Dossier -> Round -> Mandate -> Implementation"
                  : "Signal -> Dossier -> Runde -> Mandat -> Umsetzung"}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {(lang === "en"
                  ? ["Citizens", "Municipalities", "Participation offices", "Journalists"]
                  : ["Bürger:innen", "Kommunen", "Beteiligungsbüros", "Journalist:innen"]
                ).map((label) => (
                  <article
                    key={label}
                    className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
                  >
                    {label}
                  </article>
                ))}
              </div>
            </section>
            <SharedCreateComposer
              badge={surfaceTexts.badgeCanonical}
              subline={surfaceTexts.sublineCanonical}
              texts={surfaceComposerTexts}
              topMeta={
                <p className="max-w-2xl text-xs text-[rgb(var(--muted))]">
                  {lang === "en"
                    ? "Use one canonical input for contribute, review or draft."
                    : "Nutze einen kanonischen Einstieg für Beitragen, Prüfen oder Entwerfen."}
                </p>
              }
              modeOrder={CREATE_PRODUCT_MODE_VALUES}
              modeDefinitions={surfaceModeDefinitions}
              activeMode={productMode}
              onModeChange={(modeOption) => {
                setProductMode(modeOption);
                setActiveContextAnchorId(null);
              }}
              helperText={intakeHelperText}
              inputId="start-primary-intake"
              inputValue={intakeText}
              inputPlaceholder={intakePlaceholder}
              onInputChange={(value) => {
                setIntakeText(value);
                if (intakeError) setIntakeError(null);
              }}
              onStart={handleStart}
              startLabel={productModeConfig.ctaLabel}
              secondaryAction={{
                href: "/runden",
                label: surfaceTexts.goToRoundsLabel,
              }}
              contextAnchors={surfaceContextAnchors}
              activeContextAnchorId={activeContextAnchorId}
              onContextAnchorSelect={(anchorId) => {
                const anchor = resolveCreateContextAnchorById(anchorId, surfaceLocale);
                setActiveContextAnchorId(anchorId);
                if (anchor) setProductMode(anchor.mode);
              }}
              activeContextAnchorLead={activeContextAnchor?.lead}
              helperLinks={surfaceHelperLinks}
              error={intakeError}
              minRows={9}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
