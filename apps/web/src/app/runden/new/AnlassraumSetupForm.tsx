"use client";

import { useEffect, useMemo, useState } from "react";
import MotionStep from "@/components/motion/MotionStep";
import VoxyGuide from "@/components/voxy/VoxyGuide";
import { VOXY_COPY } from "@/features/voxy/voxyCopy";
import {
  buildManualAnlassraumContinueCreateHref,
  createEmptyManualAnlassraumSetup,
  resolveManualAnlassraumActionState,
  sanitizeManualAnlassraumSetup,
  type ManualAnlassraumAiSupportMode,
  type ManualAnlassraumCommunityOptionsMode,
  type ManualAnlassraumNextStep,
  type ManualAnlassraumScope,
  type ManualAnlassraumSetup,
  type ManualAnlassraumVisibility,
} from "@/features/surfaces/runden/manualAnlassraumSetup";
import AnlassraumOptionEditor from "./AnlassraumOptionEditor";
import AnlassraumPrePublishCheck from "./AnlassraumPrePublishCheck";
import AnlassraumSupportSettings from "./AnlassraumSupportSettings";
import AnlassraumVisibilitySettings from "./AnlassraumVisibilitySettings";

const MANUAL_ANLASSRAUM_STORAGE_KEY = "manual-anlassraum-setup.v1";
const MANUAL_STEP_SUMMARY = [
  { id: "rahmen", label: "Rahmen", lead: "Titel, Frage, Beschreibung" },
  { id: "optionen", label: "Optionen", lead: "Feste Antworten und Community-Regeln" },
  { id: "sichtbarkeit", label: "Sichtbarkeit", lead: "Privat, intern oder öffentlich" },
  { id: "unterstuetzung", label: "Unterstützung", lead: "KI bleibt optional" },
] as const;

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function readStoredSetup(): ManualAnlassraumSetup | null {
  try {
    const raw = window.localStorage.getItem(MANUAL_ANLASSRAUM_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ManualAnlassraumSetup;
    return sanitizeManualAnlassraumSetup(parsed);
  } catch {
    return null;
  }
}

function persistSetup(setup: ManualAnlassraumSetup) {
  try {
    window.localStorage.setItem(
      MANUAL_ANLASSRAUM_STORAGE_KEY,
      JSON.stringify(sanitizeManualAnlassraumSetup(setup)),
    );
  } catch {
    // ignore local storage errors
  }
}

type StepGuideProps = {
  copy: string;
  stepId: string;
  title: string;
  variant: "welcome" | "presenting" | "hint" | "thinking" | "check";
};

function MobileStepGuide(props: StepGuideProps) {
  return (
    <div className="lg:hidden" data-manual-anlassraum-voxy-step={props.stepId}>
      <VoxyGuide appearance="compact" title={props.title} variant={props.variant}>
        <p>{props.copy}</p>
      </VoxyGuide>
    </div>
  );
}

function DesktopStepGuide(props: StepGuideProps) {
  return (
    <aside className="hidden lg:block" data-manual-anlassraum-voxy-step={props.stepId}>
      <div className="sticky top-24">
        <VoxyGuide appearance="panel" title={props.title} variant={props.variant}>
          <p>{props.copy}</p>
        </VoxyGuide>
      </div>
    </aside>
  );
}

export default function AnlassraumSetupForm() {
  const [setup, setSetup] = useState<ManualAnlassraumSetup>(createEmptyManualAnlassraumSetup);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    const storedSetup = readStoredSetup();
    if (!storedSetup) return;
    setSetup(storedSetup);
    setRestoreNotice("Ein lokal gespeicherter Entwurf wurde wieder geladen.");
  }, []);

  const actionState = useMemo(() => resolveManualAnlassraumActionState(setup), [setup]);
  const continueCreateHref = useMemo(
    () =>
      buildManualAnlassraumContinueCreateHref({
        setup,
        returnTo: "/runden/new",
      }),
    [setup],
  );

  function patchSetup(
    updater: (current: ManualAnlassraumSetup) => ManualAnlassraumSetup,
  ) {
    setActionNotice(null);
    setSetup((current) => sanitizeManualAnlassraumSetup(updater(current)));
  }

  function persistWithNextStep(nextStep: ManualAnlassraumNextStep): ManualAnlassraumSetup {
    const nextSetup = sanitizeManualAnlassraumSetup({
      ...setup,
      nextStep,
    });
    setSetup(nextSetup);
    persistSetup(nextSetup);
    return nextSetup;
  }

  return (
    <div className="mx-auto w-full max-w-[78rem] space-y-5">
      <section className="vog-surface-elevated vog-surface-brand p-5 md:p-6 lg:p-8">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,26rem)] lg:items-start lg:gap-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
              eDebatte Anlassraum
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[rgb(var(--fg))] md:text-4xl">
              Anlassraum zuerst manuell aufsetzen
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
              Lege Rahmen, Antwortoptionen und Sichtbarkeit zuerst selbst fest. KI, Prüfung und weitere Ausarbeitung
              bleiben bewusste Folgeschritte.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-[rgb(var(--muted))]">
              <span className="vog-chip">
                4 klare Schritte
              </span>
              <span className="vog-chip">
                KI optional
              </span>
              <span className="vog-chip">
                review-first
              </span>
            </div>
          </div>

          <VoxyGuide appearance="panel" title="Voxy begleitet den Start" variant="welcome">
            <p>{VOXY_COPY.manualFrame}</p>
          </VoxyGuide>
        </div>

        <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-4" data-manual-anlassraum-stepper="true">
          {MANUAL_STEP_SUMMARY.map((step, index) => (
            <div
              key={step.id}
              className={joinClasses(
                "rounded-2xl border px-3 py-3",
                index === 0
                  ? "border-[rgb(var(--grad-from))]/35 bg-[color-mix(in_oklab,rgb(var(--card))_88%,rgb(var(--grad-from))_12%)]"
                  : "border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_78%,rgb(var(--bg))_22%)]",
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                Schritt {index + 1}
              </p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">{step.label}</p>
              <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{step.lead}</p>
            </div>
          ))}
        </div>

        {restoreNotice ? (
          <p className="mt-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm text-[rgb(var(--muted))]">
            {restoreNotice}
          </p>
        ) : null}
        {actionNotice ? (
          <p className="mt-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm text-[rgb(var(--fg))]">
            {actionNotice}
          </p>
        ) : null}
      </section>

      <MotionStep stepIndex={0}>
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)] lg:items-start lg:gap-6">
          <div className="space-y-4">
            <MobileStepGuide
              copy={VOXY_COPY.manualFrame}
              stepId="rahmen"
              title="Voxy begleitet Schritt 1"
              variant="welcome"
            />
            <section
              className="vog-surface-elevated p-4 md:p-5"
              data-manual-anlassraum-step="rahmen"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                Schritt 1
              </p>
              <h2 className="mt-1 text-xl font-semibold text-[rgb(var(--fg))]">Rahmen</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
                Gib dem Anlass einen klaren Titel, formuliere die Abstimmungsfrage und halte den Ausgangspunkt knapp fest.
              </p>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                    Titel
                  </span>
                  <input
                    value={setup.title}
                    onChange={(event) =>
                      patchSetup((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2.5 text-sm text-[rgb(var(--fg))] outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-200/60"
                    placeholder="Zum Beispiel: Schulwege rund um die Grundschule sicherer machen"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                    Abstimmungsfrage
                  </span>
                  <input
                    value={setup.votingQuestion}
                    onChange={(event) =>
                      patchSetup((current) => ({
                        ...current,
                        votingQuestion: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2.5 text-sm text-[rgb(var(--fg))] outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-200/60"
                    placeholder="Zum Beispiel: Welche Lösung soll zuerst umgesetzt werden?"
                  />
                </label>
              </div>

              <label className="mt-4 block">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                  Kurzbeschreibung
                </span>
                <textarea
                  value={setup.description}
                  onChange={(event) =>
                    patchSetup((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className="mt-2 min-h-[120px] w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2.5 text-sm text-[rgb(var(--fg))] outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-200/60"
                  placeholder="Beschreibe kurz, worum es geht, wer betroffen ist und warum der Anlass jetzt wichtig ist."
                />
              </label>
            </section>
          </div>
          <DesktopStepGuide
            copy={VOXY_COPY.manualFrame}
            stepId="rahmen"
            title="Voxy begleitet Schritt 1"
            variant="welcome"
          />
        </section>
      </MotionStep>

      <MotionStep stepIndex={1}>
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)] lg:items-start lg:gap-6">
          <div className="space-y-4">
            <MobileStepGuide
              copy={VOXY_COPY.manualOptions}
              stepId="optionen"
              title="Voxy begleitet Schritt 2"
              variant="presenting"
            />
            <AnlassraumOptionEditor
              communityOptionsMode={setup.communityOptionsMode}
              configuredOptionCount={actionState.optionCount}
              onAddOption={() =>
                patchSetup((current) => ({
                  ...current,
                  options: [...current.options, ""],
                }))
              }
              onCommunityOptionsModeChange={(value: ManualAnlassraumCommunityOptionsMode) =>
                patchSetup((current) => ({
                  ...current,
                  communityOptionsMode: value,
                }))
              }
              onOptionChange={(index, value) =>
                patchSetup((current) => ({
                  ...current,
                  options: current.options.map((option, optionIndex) =>
                    optionIndex === index ? value : option,
                  ),
                }))
              }
              onRemoveOption={(index) =>
                patchSetup((current) => ({
                  ...current,
                  options:
                    current.options.length <= 2
                      ? current.options
                      : current.options.filter((_, optionIndex) => optionIndex !== index),
                }))
              }
              options={setup.options}
            />
          </div>
          <DesktopStepGuide
            copy={VOXY_COPY.manualOptions}
            stepId="optionen"
            title="Voxy begleitet Schritt 2"
            variant="presenting"
          />
        </section>
      </MotionStep>

      <MotionStep stepIndex={2}>
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)] lg:items-start lg:gap-6">
          <div className="space-y-4">
            <MobileStepGuide
              copy={VOXY_COPY.manualVisibility}
              stepId="sichtbarkeit"
              title="Voxy begleitet Schritt 3"
              variant="hint"
            />
            <AnlassraumVisibilitySettings
              onScopeChange={(value: ManualAnlassraumScope) =>
                patchSetup((current) => ({
                  ...current,
                  scope: value,
                }))
              }
              onVisibilityChange={(value: ManualAnlassraumVisibility) =>
                patchSetup((current) => ({
                  ...current,
                  visibility: value,
                }))
              }
              scope={setup.scope}
              visibility={setup.visibility}
            />
          </div>
          <DesktopStepGuide
            copy={VOXY_COPY.manualVisibility}
            stepId="sichtbarkeit"
            title="Voxy begleitet Schritt 3"
            variant="hint"
          />
        </section>
      </MotionStep>

      <MotionStep stepIndex={3}>
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,26rem)] lg:items-start lg:gap-6">
          <div className="space-y-4">
            <MobileStepGuide
              copy={VOXY_COPY.manualSupport}
              stepId="unterstuetzung"
              title="Voxy begleitet Schritt 4"
              variant={setup.aiSupportMode === "disabled" ? "thinking" : "check"}
            />
            <div className="space-y-4">
              <AnlassraumSupportSettings
                aiSupportMode={setup.aiSupportMode}
                onAiSupportModeChange={(value: ManualAnlassraumAiSupportMode) =>
                  patchSetup((current) => ({
                    ...current,
                    aiSupportMode: value,
                  }))
                }
              />

              <AnlassraumPrePublishCheck
                actionState={actionState}
                continueCreateHref={continueCreateHref}
                onContinueCreate={() => {
                  if (!actionState.canContinueCreate) return;
                  persistWithNextStep("continue_create");
                }}
                onSaveDraft={() => {
                  if (!actionState.canSaveDraft) return;
                  persistWithNextStep("save_draft");
                  setActionNotice(
                    "Entwurf lokal gespeichert. Du kannst ohne KI weiterarbeiten oder später in /create vertiefen.",
                  );
                }}
                onStartInternal={() => {
                  if (!actionState.canStartInternal) return;
                  persistWithNextStep("start_internal");
                  setActionNotice(
                    "Interner Start vorbereitet. Sichtbarkeit bleibt ein bewusster nächster Schritt.",
                  );
                }}
                onSubmitPublicReview={() => {
                  if (!actionState.canSubmitPublicReview) return;
                  persistWithNextStep("submit_public_review");
                  setActionNotice(
                    "Für öffentliche Prüfung vorbereitet. Es wird hier nichts automatisch veröffentlicht.",
                  );
                }}
                setup={setup}
              />
            </div>
          </div>
          <DesktopStepGuide
            copy={VOXY_COPY.manualSupport}
            stepId="unterstuetzung"
            title="Voxy begleitet Schritt 4"
            variant={setup.aiSupportMode === "disabled" ? "thinking" : "check"}
          />
        </section>
      </MotionStep>

      <div className={joinClasses("flex flex-wrap gap-2 text-sm text-[rgb(var(--muted))]")}>
        <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1">
          Titel oder Frage: {actionState.hasFrameInput ? "gesetzt" : "noch offen"}
        </span>
        <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1">
          Feste Optionen: {actionState.optionCount}
        </span>
        <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1">
          KI: {setup.aiSupportMode === "disabled" ? "nicht aktiv" : "optional"}
        </span>
      </div>
    </div>
  );
}
