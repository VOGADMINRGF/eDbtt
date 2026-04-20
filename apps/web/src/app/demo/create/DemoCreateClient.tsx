"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  resolveCreateSurfaceLocale,
  resolveCreateContextAnchorById,
  resolveCreateModeDefinition,
} from "@/features/create/createSurfaceConfig";
import { getDemoStatusLabel } from "@/features/demo/statusLanguage";
import {
  getDemoPersonaConfig,
  type DemoPersona,
  withPersona,
} from "@/features/demo/personas";
import SharedCreateComposer from "@/features/create/SharedCreateComposer";
import { useLocale } from "@/context/LocaleContext";

type DemoCreateClientProps = {
  persona: DemoPersona;
};

function hasIntakeText(value: string): boolean {
  return Boolean(value.trim());
}

function buildDemoCreateHref(params: {
  mode: CreateProductMode;
  intakeText: string;
  persona: DemoPersona;
}): string {
  const modeConfig = resolveCreateModeDefinition(params.mode);
  const query = new URLSearchParams();
  query.set("entryIntent", modeConfig.entryIntent);
  query.set("entryMode", modeConfig.entryMode);
  query.set("source", "demo");
  query.set("reason", "demo_create_surface");
  query.set("returnTo", withPersona("/demo/create", params.persona));
  const normalizedText = params.intakeText.trim();
  if (normalizedText) {
    query.set("prefill", normalizedText);
  }
  return `/create?${query.toString()}`;
}

export default function DemoCreateClient({ persona }: DemoCreateClientProps) {
  const { locale } = useLocale();
  const surfaceLocale = resolveCreateSurfaceLocale(locale);
  const surfaceTexts = React.useMemo(() => getCreateSurfaceTexts(surfaceLocale), [surfaceLocale]);
  const surfaceComposerTexts = React.useMemo(
    () => getCreateComposerTexts(surfaceLocale),
    [surfaceLocale],
  );
  const surfaceModeDefinitions = React.useMemo(
    () => getCreateSurfaceModeDefinitions(surfaceLocale),
    [surfaceLocale],
  );
  const surfaceContextAnchors = React.useMemo(
    () => getCreateContextAnchorDefinitions(surfaceLocale),
    [surfaceLocale],
  );
  const surfaceHelperLinks = React.useMemo(() => getCreateHelperLinks(surfaceLocale), [surfaceLocale]);

  const personaCfg = React.useMemo(() => getDemoPersonaConfig(persona), [persona]);
  const [productMode, setProductMode] = React.useState<CreateProductMode>("analyze");
  const [activeContextAnchorId, setActiveContextAnchorId] = React.useState<CreateIntent | null>(null);
  const [intakeText, setIntakeText] = React.useState("");
  const [intakeError, setIntakeError] = React.useState<string | null>(null);
  const router = useRouter();

  const productModeConfig = React.useMemo(
    () => resolveCreateModeDefinition(productMode, surfaceLocale),
    [productMode, surfaceLocale],
  );
  const activeContextAnchor = React.useMemo(
    () => resolveCreateContextAnchorById(activeContextAnchorId, surfaceLocale),
    [activeContextAnchorId, surfaceLocale],
  );
  const intakeHelperText = activeContextAnchor?.helperText ?? productModeConfig.helperText;
  const intakePlaceholder = activeContextAnchor?.placeholder ?? productModeConfig.placeholder;

  function handleStart() {
    if (!hasIntakeText(intakeText)) {
      setIntakeError(surfaceTexts.intakeMissingError);
      return;
    }
    setIntakeError(null);
    router.push(buildDemoCreateHref({ mode: productMode, intakeText, persona }) as any);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 md:py-10">
      <div className="space-y-5 md:space-y-6">
        <SharedCreateComposer
          badge={surfaceTexts.demoBadge(personaCfg.label)}
          subline={surfaceTexts.demoSubline}
          texts={surfaceComposerTexts}
          topMeta={
            <p className="text-xs text-[rgb(var(--muted))]">
              {surfaceTexts.demoStatusLine(
                getDemoStatusLabel("community_submitted"),
                getDemoStatusLabel("in_review"),
                getDemoStatusLabel("confirmed"),
              )}
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
          inputId="demo-create-primary-intake"
          inputValue={intakeText}
          inputPlaceholder={intakePlaceholder}
          onInputChange={(value) => {
            setIntakeText(value);
            if (intakeError) setIntakeError(null);
          }}
          onStart={handleStart}
          startLabel={productModeConfig.ctaLabel}
          secondaryAction={{
            href: withPersona("/demo/runden", persona),
            label: surfaceTexts.demoToRoundsLabel,
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
          minRows={10}
        />

        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-xs text-[rgb(var(--muted))]">
          <p className="font-semibold text-[rgb(var(--fg))]">{surfaceTexts.demoStudioTitle}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href={withPersona("/demo/dossier", persona)} className="btn-secondary text-xs">
              Dossier
            </Link>
            <Link href={withPersona("/demo/abstimmungen", persona)} className="btn-secondary text-xs">
              Abstimmungen
            </Link>
            <Link href={withPersona("/demo/swipes", persona)} className="btn-secondary text-xs">
              Swipes
            </Link>
            <Link href={withPersona("/demo/mandat", persona)} className="btn-secondary text-xs">
              Mandat
            </Link>
            <Link href={withPersona("/demo/factcheck", persona)} className="btn-secondary text-xs">
              Factcheck
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
