"use client";

import { useEffect, useMemo, useState } from "react";
import MotionStep from "@/components/motion/MotionStep";
import VoxyGuide from "@/components/voxy/VoxyGuide";
import StartDraftWorkspaceChooser from "@/features/start/StartDraftWorkspaceChooser";
import {
  clearStartDraftContext,
  saveStartDraftContext,
  getStartDraftForTarget,
  createStartDraftContext,
  updateStartDraftContext,
  type StartDraftContext,
} from "@/features/start/startDraftContext";
import { RUNDEN_VOXY_COPY } from "@/features/voxy/rundenVoxyCopy";
import {
  buildManualAnlassraumStartDraft,
  buildManualAnlassraumServerDraftSavePayload,
  buildManualAnlassraumContinueCreateHref,
  createEmptyManualAnlassraumSetup,
  resolveManualAnlassraumActionState,
  sanitizeManualAnlassraumSetup,
  type ManualAnlassraumAiSupportMode,
  type ManualAnlassraumCommunityOptionsMode,
  type ManualAnlassraumNextStep,
  type ManualAnlassraumScope,
  type ManualAnlassraumServerDraftSnapshot,
  type ManualAnlassraumSetup,
  type ManualAnlassraumVisibility,
} from "@/features/surfaces/runden/manualAnlassraumSetup";
import AnlassraumStartDraftPanel from "./AnlassraumStartDraftPanel";
import AnlassraumOptionEditor from "./AnlassraumOptionEditor";
import AnlassraumPrePublishCheck from "./AnlassraumPrePublishCheck";
import AnlassraumSupportSettings from "./AnlassraumSupportSettings";
import AnlassraumVisibilitySettings from "./AnlassraumVisibilitySettings";

const MANUAL_ANLASSRAUM_STORAGE_KEY = "manual-anlassraum-setup.v1";
const MANUAL_STEP_SUMMARY = [
  { id: "rahmen", label: "Rahmen", lead: "Titel, Leitfrage, Kurzbeschreibung" },
  { id: "optionen", label: "Optionen", lead: "Feste Antworten und Community-Vorschläge" },
  { id: "sichtbarkeit", label: "Sichtbarkeit", lead: "Intern, später öffentlich oder nach Review" },
  { id: "unterstuetzung", label: "Unterstützung & Start", lead: "KI, Graph und Dossier bleiben optional" },
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

function clearStoredSetup() {
  try {
    window.localStorage.removeItem(MANUAL_ANLASSRAUM_STORAGE_KEY);
  } catch {
    // ignore local storage errors
  }
}

type StepGuideProps = {
  copy: string;
  stepId: string;
  label: string;
};

function StepMarker(props: StepGuideProps) {
  return (
    <div className="public-voxy-marker" data-manual-anlassraum-voxy-step={props.stepId}>
      <span aria-hidden="true" className="inline-flex h-1.5 w-1.5 rounded-full bg-[rgb(var(--grad-to))]" />
      <span>{props.label}: {props.copy}</span>
    </div>
  );
}

type AnlassraumSetupFormProps = {
  initialServerDraft?: ManualAnlassraumServerDraftSnapshot | null;
};

function syncDraftUrl(draftId: string) {
  if (typeof window === "undefined") return;
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set("draftId", draftId);
  window.history.replaceState(null, "", nextUrl.toString());
}

export default function AnlassraumSetupForm({
  initialServerDraft = null,
}: AnlassraumSetupFormProps) {
  const [setup, setSetup] = useState<ManualAnlassraumSetup>(createEmptyManualAnlassraumSetup);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [startDraft, setStartDraft] = useState<StartDraftContext | null>(null);
  const [serverDraftId, setServerDraftId] = useState<string | null>(
    initialServerDraft?.draftId ?? null,
  );
  const [isPersisting, setIsPersisting] = useState(false);

  useEffect(() => {
    const existingDraft = getStartDraftForTarget("rounds");
    if (existingDraft) {
      setStartDraft(existingDraft);
    }
    const restoredSetup = initialServerDraft?.setup ?? readStoredSetup();
    const restoreText = initialServerDraft
      ? "Dein serverseitig gespeicherter Entwurf wurde wieder geöffnet."
      : restoredSetup
        ? "Dein lokal gesicherter Entwurf wurde wieder geöffnet."
        : null;
    if (initialServerDraft?.draftId) {
      setServerDraftId(initialServerDraft.draftId);
      syncDraftUrl(initialServerDraft.draftId);
    }
    if (!restoredSetup) return;

    setSetup(restoredSetup);
    setRestoreNotice(restoreText);
    if (!existingDraft) {
      const restoredDraft = buildManualAnlassraumStartDraft(restoredSetup);
      if (restoredDraft) {
        const savedDraft = saveStartDraftContext(restoredDraft);
        if (savedDraft) {
          setStartDraft(savedDraft);
        }
      }
    }
  }, [initialServerDraft]);

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
    setSetup((current) => updater(current));
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

  async function persistServerDraft(nextSetup: ManualAnlassraumSetup) {
    const response = await fetch("/api/drafts/save", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(
        buildManualAnlassraumServerDraftSavePayload({
          setup: nextSetup,
          draftId: serverDraftId,
        }),
      ),
    });
    const body = await response.json().catch(() => ({}));
    if (response.status === 401) {
      return { ok: false as const, error: "not_authenticated" };
    }
    if (!response.ok || !body?.ok || typeof body?.draftId !== "string") {
      return {
        ok: false as const,
        error: String(body?.error ?? "server_draft_save_failed"),
      };
    }
    return {
      ok: true as const,
      draftId: body.draftId,
      updatedAt: typeof body.updatedAt === "string" ? body.updatedAt : null,
    };
  }

  async function persistManualDraftWithNotice(
    nextStep: ManualAnlassraumNextStep,
    notices: {
      serverSaved: string;
      authRequired: string;
      serverFailed: string;
    },
  ) {
    const nextSetup = persistWithNextStep(nextStep);
    const nextDraft =
      buildManualAnlassraumStartDraft(nextSetup, startDraft) ??
      createStartDraftContext({
        text: nextSetup.title || nextSetup.votingQuestion || "Manueller Anlassraum-Entwurf",
        origin: "round_handoff",
        intent: "round_suggestion",
        targetHint: "rounds",
        id: startDraft?.id,
        createdAt: startDraft?.createdAt,
      });
    const savedDraft = saveStartDraftContext(nextDraft);
    if (savedDraft) {
      setStartDraft(savedDraft);
    }
    setRestoreNotice(null);
    setIsPersisting(true);
    try {
      const result = await persistServerDraft(nextSetup);
      if (result.ok) {
        setServerDraftId(result.draftId);
        syncDraftUrl(result.draftId);
        setActionNotice(notices.serverSaved);
        return;
      }
      if (result.error === "not_authenticated") {
        setActionNotice(notices.authRequired);
        return;
      }
      setActionNotice(notices.serverFailed);
    } catch {
      setActionNotice(notices.serverFailed);
    } finally {
      setIsPersisting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[78rem] space-y-5">
      <section className="public-dialog-surface p-5 md:p-6 lg:p-8">
        <div className="public-reader-grid lg:gap-8">
          <aside className="public-voxy-rail order-2 lg:order-1">
            <VoxyGuide
              appearance="panel"
              title="Ich führe dich Schritt für Schritt durch den Entwurf."
              variant="welcome"
            >
              <p>{RUNDEN_VOXY_COPY.manualFrame}</p>
            </VoxyGuide>
          </aside>

          <div className="public-dialog-area order-1 lg:order-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
              eDebatte Anlassraum
            </p>
            <h1 className="mt-2 public-hero-title anlassraum-hero-title font-semibold tracking-tight text-[rgb(var(--fg))]">
              Bereite deinen <span className="public-gradient-text">Anlassraum</span>{" "}
              <span className="public-gradient-text">Schritt für Schritt</span> vor.
            </h1>
            <p className="public-hero-lead mt-3 max-w-3xl">
              Lege Rahmen, Optionen und Sichtbarkeit zuerst selbst fest. Alles Weitere bleibt ein bewusster
              Folgeschritt.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-[rgb(var(--muted))]">
              <span className="anlassraum-soft-signal">
                4 klare Schritte
              </span>
              <span className="anlassraum-soft-signal">
                KI optional
              </span>
              <span className="anlassraum-soft-signal">
                Nichts geht automatisch online
              </span>
            </div>
          </div>
        </div>

        <div className="runden-step-line mt-5" data-manual-anlassraum-stepper="true">
          <ol className="anlassraum-step-track">
            {MANUAL_STEP_SUMMARY.map((step, index) => (
              <li
                key={step.id}
                className={joinClasses(
                  "anlassraum-step-item",
                  index === 0 && "anlassraum-step-item--active",
                )}
              >
                <span className="anlassraum-step-count">0{index + 1}</span>
                <span className="anlassraum-step-body">
                  <span className="anlassraum-step-label">{step.label}</span>
                  <span className="anlassraum-step-lead">{step.lead}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        {restoreNotice ? (
          <p className="mt-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm text-[rgb(var(--muted))]">
            {restoreNotice}
          </p>
        ) : null}
        <AnlassraumStartDraftPanel
          visible={Boolean(startDraft)}
          title="Runde aus deinem Entwurf vorbereiten"
          statusLine="Noch nicht veröffentlicht"
          helperText="Optionen ergänzen. Du kannst Titel, Frage und Optionen weiterbearbeiten."
        />
        {startDraft ? (
          <div className="mt-4">
            <StartDraftWorkspaceChooser
              activeKey="rounds"
              options={[
                {
                  key: "create",
                  title: "Beitrag ausarbeiten",
                  description: "Zum Beitragsmodus wechseln, ohne den Entwurf zu verlieren.",
                  href: "/create?startDraft=1",
                  onClick: () => updateStartDraftContext({ targetHint: "create" }),
                },
                {
                  key: "themes",
                  title: "Passende Themen finden",
                  description: "Mit demselben Anliegen im Themenmodus weiterarbeiten.",
                  href: "/themen?startDraft=1",
                  onClick: () => updateStartDraftContext({ targetHint: "themes" }),
                },
                {
                  key: "rounds",
                  title: "Runde vorbereiten",
                  description: "Optionen weiterbearbeiten und als Runden-Entwurf offen halten.",
                  href: serverDraftId
                    ? `/runden/new?draftId=${encodeURIComponent(serverDraftId)}&startDraft=1&from=rounds`
                    : "/runden/new?startDraft=1&from=rounds",
                  onClick: () => updateStartDraftContext({ targetHint: "rounds" }),
                },
                {
                  key: "editorial",
                  title: "Redaktionelle Prüfung anfragen",
                  description: "Denselben Entwurf manuell prüfen lassen, ohne etwas zu veröffentlichen.",
                  href: "/start?review=editorial",
                  onClick: () => updateStartDraftContext({ origin: "start_relevance_review" }),
                },
                {
                  key: "later",
                  title: "Später weiterarbeiten",
                  description: "Als Arbeitsstand behalten und später im Konto fortsetzen.",
                  href: "/account",
                  onClick: () => updateStartDraftContext({ targetHint: "rounds" }),
                },
              ]}
            />
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                className="vog-btn-secondary"
                onClick={() => {
                  clearStoredSetup();
                  clearStartDraftContext();
                  setSetup(createEmptyManualAnlassraumSetup());
                  setStartDraft(null);
                  setRestoreNotice(null);
                  setActionNotice("Entwurf verworfen. Es wurde kein KI-Lauf gestartet.");
                }}
              >
                Entwurf verwerfen
              </button>
            </div>
          </div>
        ) : null}
        {actionNotice ? (
          <p className="mt-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm text-[rgb(var(--fg))]">
            {actionNotice}
          </p>
        ) : null}
      </section>

      <MotionStep stepIndex={0}>
        <section className="space-y-4">
          <div className="space-y-4">
            <StepMarker
               copy={RUNDEN_VOXY_COPY.manualFrame}
              stepId="rahmen"
              label="Schritt 1"
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
                Noch keine perfekte Formulierung nötig. Lege erst den Rahmen fest.
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
        </section>
      </MotionStep>

      <MotionStep stepIndex={1}>
        <section className="space-y-4">
          <div className="space-y-4">
            <StepMarker
               copy={RUNDEN_VOXY_COPY.manualOptions}
              stepId="optionen"
              label="Schritt 2"
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
        </section>
      </MotionStep>

      <MotionStep stepIndex={2}>
        <section className="space-y-4">
          <div className="space-y-4">
            <StepMarker
               copy={RUNDEN_VOXY_COPY.manualVisibility}
              stepId="sichtbarkeit"
              label="Schritt 3"
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
        </section>
      </MotionStep>

      <MotionStep stepIndex={3}>
        <section className="space-y-4">
          <div className="space-y-4">
            <StepMarker
               copy={RUNDEN_VOXY_COPY.manualSupport}
              stepId="unterstuetzung"
              label="Schritt 4"
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
                isSaving={isPersisting}
                onContinueCreate={() => {
                  if (!actionState.canContinueCreate) return;
                  persistWithNextStep("continue_create");
                }}
                onSaveDraft={() => {
                  if (!actionState.canSaveDraft) return;
                  void persistManualDraftWithNotice(
                    "save_draft",
                    {
                      serverSaved:
                        "Anlassraum-Entwurf lokal und serverseitig gespeichert. Kein KI-Lauf, kein AI-Usage-Event und keine weitere Recherche-Automation wurden gestartet. Du kannst denselben Stand später wieder auf /runden/new öffnen oder bewusst in /create vertiefen.",
                      authRequired:
                        "Anlassraum-Entwurf lokal gespeichert. Zum serverseitigen Speichern bitte anmelden. Kein KI-Lauf, kein AI-Usage-Event und keine weitere Recherche-Automation wurden gestartet.",
                      serverFailed:
                        "Anlassraum-Entwurf lokal gespeichert. Serverseitiges Speichern ist fehlgeschlagen. Kein KI-Lauf, kein AI-Usage-Event und keine weitere Recherche-Automation wurden gestartet.",
                    },
                  );
                }}
                onStartInternal={() => {
                  if (!actionState.canStartInternal) return;
                  void persistManualDraftWithNotice(
                    "start_internal",
                    {
                      serverSaved:
                        "Interner Anlassraum-Entwurf lokal und serverseitig gespeichert. Sichtbarkeit, Prüfung und KI bleiben bewusste nächste Schritte.",
                      authRequired:
                        "Interner Anlassraum-Entwurf lokal gespeichert. Zum serverseitigen Speichern bitte anmelden. Sichtbarkeit, Prüfung und KI bleiben bewusste nächste Schritte.",
                      serverFailed:
                        "Interner Anlassraum-Entwurf lokal gespeichert. Serverseitiges Speichern ist fehlgeschlagen. Sichtbarkeit, Prüfung und KI bleiben bewusste nächste Schritte.",
                    },
                  );
                }}
                onSubmitPublicReview={() => {
                  if (!actionState.canSubmitPublicReview) return;
                  void persistManualDraftWithNotice(
                    "submit_public_review",
                    {
                      serverSaved:
                        "Entwurf lokal und serverseitig für spätere öffentliche Prüfung vorgemerkt. Es wurde nichts automatisch veröffentlicht und kein KI-Lauf gestartet.",
                      authRequired:
                        "Entwurf lokal für spätere öffentliche Prüfung vorgemerkt. Zum serverseitigen Speichern bitte anmelden. Es wurde nichts automatisch veröffentlicht und kein KI-Lauf gestartet.",
                      serverFailed:
                        "Entwurf lokal für spätere öffentliche Prüfung vorgemerkt. Serverseitiges Speichern ist fehlgeschlagen. Es wurde nichts automatisch veröffentlicht und kein KI-Lauf gestartet.",
                    },
                  );
                }}
                setup={setup}
              />
            </div>
          </div>
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
