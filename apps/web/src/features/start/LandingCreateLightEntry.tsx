"use client";

import * as React from "react";
import {
  buildLandingContributionDraft,
  buildLandingContributionPreview,
  buildLandingEditorialReviewResumeHref,
  LANDING_CONTRIBUTION_MAX_LENGTH,
  LANDING_EDITORIAL_REVIEW_STORAGE_KEY,
  LANDING_START_CREATE_LIGHT_STORAGE_KEY,
  resolveLandingContinueAction,
  type LandingContributionDraft,
  type LandingContributionPreview,
  type LandingContributionRelevance,
} from "@/features/start/landingCreateLight";
import GlobalDraftStatusBar from "@/features/start/GlobalDraftStatusBar";
import StartDraftWorkspaceChooser from "@/features/start/StartDraftWorkspaceChooser";
import {
  clearStartDraftContext,
  createStartDraftContext,
  normalizeStartDraftIntent,
  readStartDraftContext,
  saveStartDraftContext,
  updateStartDraftContext,
  type StartDraftContext,
  type StartDraftOrigin,
  type StartDraftTarget,
} from "@/features/start/startDraftContext";

type LandingCreateLightEntryProps = {
  trustText: string;
};

type SessionState = "unknown" | "authenticated" | "guest";

type SavedLandingDraft = {
  sourceText: string;
  savedAt: string;
};

type SavedEditorialReviewDraft = {
  sourceText: string;
  reviewReason: string;
  relevanceClassification: LandingContributionRelevance;
  savedAt: string;
};

const QUICK_EXAMPLES_DE = [
  {
    title: "Beispiel: Schulweg im Bezirk",
    lead: "Sicherer Weg für Kinder",
    text: "Bei uns fehlt ein sicherer Schulweg an der Hauptstraße.",
  },
  {
    title: "Beispiel: Pflege vor Ort",
    lead: "Versorgung im Stadtteil",
    text: "Welche Maßnahmen helfen in unserem Stadtteil zuerst gegen den Pflegenotstand?",
  },
  {
    title: "Beispiel: Transparenz im Rathaus",
    lead: "Verwaltung verständlich machen",
    text: "Wie können Entscheidungen der Verwaltung verständlicher erklärt werden?",
  },
] as const;

function readSessionJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeSessionJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(key, JSON.stringify(value));
}

function removeSessionJson(key: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(key);
}

function PreviewCard(props: {
  draft: LandingContributionDraft;
  preview: LandingContributionPreview;
  sourceText: string;
  isAuthenticated: boolean;
  origin: StartDraftOrigin;
  onEditAgain: () => void;
}) {
  const continueAction = resolveLandingContinueAction(props.preview, props.isAuthenticated);
  const editorialReviewHref =
    props.isAuthenticated
      ? buildLandingEditorialReviewResumeHref()
      : `/login?next=${encodeURIComponent(buildLandingEditorialReviewResumeHref())}&draft=start`;

  function persistDraftForContinue(target: StartDraftTarget) {
    writeSessionJson(LANDING_START_CREATE_LIGHT_STORAGE_KEY, {
      sourceText: props.sourceText,
      savedAt: new Date().toISOString(),
    } satisfies SavedLandingDraft);
    saveStartDraftContext(
      createStartDraftContext({
        text: props.sourceText,
        normalizedText: props.draft.normalizedText,
        origin: props.origin,
        intent: normalizeStartDraftIntent(props.draft.intent),
        targetHint: target,
        preview: {
          contributionType: props.preview.contributionTypeLabel,
          possibleTopics: props.preview.topicLabels,
          openQuestions: props.preview.openQuestionLabels,
          suggestedNextSteps: props.preview.nextStepLabels,
          relevance: props.draft.relevanceClassification,
        },
      }),
    );
  }

  return (
    <article
      className="landing-flow-line public-start-preview-card"
      data-testid="start-create-light-preview"
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="landing-soft-pill public-soft-pill">Erster Entwurf</span>
          <span className="landing-soft-pill public-soft-pill">Noch nicht veröffentlicht</span>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-[rgb(var(--fg))]">{props.preview.title}</h3>
          <p className="mt-2 text-sm leading-7 text-[rgb(var(--fg))]/82">{props.preview.notice}</p>
        </div>
      </div>

      <dl className="public-start-preview-grid mt-5">
        <div className="landing-proof-column">
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Erkannter Beitragstyp
          </dt>
          <dd className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">
            {props.preview.contributionTypeLabel}
          </dd>
        </div>
        <div className="landing-proof-column">
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Mögliche Themenfelder
          </dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {props.preview.topicLabels.map((topic) => (
              <span key={topic} className="landing-soft-pill public-soft-pill">
                {topic}
              </span>
            ))}
          </dd>
        </div>
        <div className="landing-proof-column">
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Offene Fragen
          </dt>
          <dd className="mt-2 space-y-2">
            {props.preview.openQuestionLabels.map((question) => (
              <p key={question} className="text-sm leading-6 text-[rgb(var(--fg))]/84">
                {question}
              </p>
            ))}
          </dd>
        </div>
        <div className="landing-proof-column">
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Mögliche nächste Schritte
          </dt>
          <dd className="mt-2 flex flex-wrap gap-2">
            {props.preview.nextStepLabels.map((step) => (
              <span key={step} className="landing-soft-pill public-soft-pill">
                {step}
              </span>
            ))}
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={continueAction.href}
          data-requires-privacy-gate="true"
          className="landing-cta-primary public-cta-primary vog-btn-brand"
          onClick={() => persistDraftForContinue("create")}
        >
          {continueAction.label}
        </a>
        <a
          href={props.preview.existingTopicHref}
          className="vog-btn-secondary landing-cta-secondary"
          onClick={() => persistDraftForContinue("themes")}
        >
          Zu bestehendem Thema beitragen
        </a>
        <a
          href={props.preview.roundsHref}
          className="vog-btn-secondary landing-cta-secondary"
          onClick={() => persistDraftForContinue("rounds")}
        >
          Anlassraum starten
        </a>
        <button type="button" className="vog-btn-secondary landing-cta-secondary" onClick={props.onEditAgain}>
          Beitrag ändern
        </button>
      </div>

      <div className="mt-6">
        <StartDraftWorkspaceChooser
          options={[
            {
              key: "create",
              title: "Beitrag ausarbeiten",
              description: "Den Text weiter ausformulieren und den nächsten Beitragsschritt vorbereiten.",
              href: continueAction.href,
              onClick: () => persistDraftForContinue("create"),
            },
            {
              key: "themes",
              title: "Passende Themen finden",
              description: "Prüfen, ob dein Anliegen an ein bestehendes Thema anknüpft.",
              href: props.preview.existingTopicHref,
              onClick: () => persistDraftForContinue("themes"),
            },
            {
              key: "rounds",
              title: "Runde vorbereiten",
              description: "Aus demselben Anliegen eine Beteiligung oder Abstimmungsfrage vorbereiten.",
              href: props.preview.roundsHref,
              onClick: () => persistDraftForContinue("rounds"),
            },
            {
              key: "editorial",
              title: "Redaktionelle Prüfung anfragen",
              description: "Denselben Entwurf manuell prüfen lassen, ohne etwas zu veröffentlichen.",
              href: editorialReviewHref,
              onClick: () => {
                persistDraftForContinue("create");
                updateStartDraftContext({ origin: "start_relevance_review" });
              },
            },
            {
              key: "later",
              title: "Später weiterarbeiten",
              description: "Den Entwurf als Arbeitsstand behalten und später im Konto fortsetzen.",
              href: props.isAuthenticated ? "/account" : "/login?next=%2Faccount&draft=start",
              onClick: () => persistDraftForContinue("create"),
            },
          ]}
        />
      </div>
    </article>
  );
}

function EditorialReviewModeCard(props: {
  draft: LandingContributionDraft;
  reviewReason: string;
  onReviewReasonChange: (value: string) => void;
  onReviewRequest: () => void;
  onBackToDraft: () => void;
  reviewSubmitting: boolean;
  reviewFeedback: string | null;
  guestReviewGateVisible: boolean;
}) {
  return (
    <article className="landing-flow-line public-start-preview-card" data-testid="start-create-light-editorial-mode">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="landing-soft-pill public-soft-pill">Redaktioneller Arbeitsmodus</span>
          <span className="landing-soft-pill public-soft-pill">Noch nicht veröffentlicht</span>
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-[rgb(var(--fg))]">Redaktionelle Prüfung anfragen</h3>
          <p className="text-sm leading-7 text-[rgb(var(--fg))]/84">
            Du willst denselben Entwurf nicht direkt ausarbeiten, sondern zuerst manuell prüfen lassen. Das startet keinen produktiven Beitrag, keine Runde und keine Veröffentlichung.
          </p>
          <p className="text-sm leading-7 text-[rgb(var(--fg))]/78">
            Öffentliche Relevanz, Formulierung und möglicher nächster Schritt werden dabei zuerst gemeinsam geprüft.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="landing-soft-pill public-soft-pill">{props.draft.relevanceClassification === "public_relevant" ? "Bereit zur Weiterarbeit" : "Öffentliche Relevanz klären"}</span>
        <span className="landing-soft-pill public-soft-pill">Keine automatische Prüfung</span>
        <span className="landing-soft-pill public-soft-pill">Du bestätigst den nächsten Schritt</span>
      </div>

      <div className="mt-5 space-y-3">
        <label className="block text-sm font-semibold text-[rgb(var(--fg))]" htmlFor="landing-editorial-mode-reason">
          Warum sollte die Redaktion das prüfen?
        </label>
        <textarea
          id="landing-editorial-mode-reason"
          rows={3}
          value={props.reviewReason}
          onChange={(event) => props.onReviewReasonChange(event.target.value)}
          placeholder="Zum Beispiel: Bitte als öffentlich relevantes Anliegen prüfen oder die Einordnung gegenlesen."
          className="w-full rounded-[1.1rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm text-[rgb(var(--fg))] outline-none transition focus:border-cyan-300/80"
        />
      </div>

      {props.reviewFeedback ? (
        <p className="mt-4 rounded-[1rem] border border-cyan-300/25 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-50">
          {props.reviewFeedback}
        </p>
      ) : null}

      {props.guestReviewGateVisible ? (
        <div className="mt-4 rounded-[1rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))]/70 px-4 py-4 text-sm text-[rgb(var(--fg))]/84">
          <p className="font-semibold text-[rgb(var(--fg))]">
            Melde dich an oder registriere dich, damit wir die redaktionelle Prüfung sicher vormerken können.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a
              href={`/login?next=${encodeURIComponent(buildLandingEditorialReviewResumeHref())}`}
              className="landing-cta-primary public-cta-primary vog-btn-brand"
            >
              Einloggen und weiterarbeiten
            </a>
            <a
              href={`/register?next=${encodeURIComponent(buildLandingEditorialReviewResumeHref())}`}
              className="vog-btn-secondary landing-cta-secondary"
            >
              Registrieren und weiterarbeiten
            </a>
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className="landing-cta-primary public-cta-primary vog-btn-brand" onClick={props.onReviewRequest} disabled={props.reviewSubmitting}>
          {props.reviewSubmitting ? "Wird vorgemerkt …" : "Zur redaktionellen Prüfung geben"}
        </button>
        <button type="button" className="vog-btn-secondary landing-cta-secondary" onClick={props.onBackToDraft}>
          Zur Einordnung zurück
        </button>
      </div>
    </article>
  );
}

function GuidanceCard(props: {
  draft: LandingContributionDraft;
  reviewReason: string;
  onReviewReasonChange: (value: string) => void;
  onReviewRequest: () => void;
  onContinueToCreate?: () => void;
  continueHref?: string | null;
  onEditAgain: () => void;
  reviewSubmitting: boolean;
  reviewFeedback: string | null;
  guestReviewGateVisible: boolean;
}) {
  const { guidance, relevanceClassification } = props.draft;
  const allowReview = guidance.allowEditorialReview;

  return (
    <article className="landing-flow-line public-start-preview-card" data-testid="start-create-light-guidance">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="landing-soft-pill public-soft-pill">Einordnung prüfen</span>
          {relevanceClassification === "needs_reframe" ? (
            <span className="landing-soft-pill public-soft-pill">noch nicht als öffentliches Anliegen erkennbar</span>
          ) : null}
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-[rgb(var(--fg))]">{guidance.title}</h3>
          <p className="text-sm leading-7 text-[rgb(var(--fg))]/84">{guidance.body}</p>
          <p className="text-sm leading-7 text-[rgb(var(--fg))]/78">{guidance.helperText}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {guidance.hintChips.map((hint) => (
          <span key={hint} className="landing-soft-pill public-soft-pill">
            {hint}
          </span>
        ))}
      </div>

      {allowReview ? (
        <div className="mt-5 space-y-3">
          <label className="block text-sm font-semibold text-[rgb(var(--fg))]" htmlFor="landing-editorial-reason">
            Warum sollte die Redaktion das prüfen?
          </label>
          <textarea
            id="landing-editorial-reason"
            rows={3}
            value={props.reviewReason}
            onChange={(event) => props.onReviewReasonChange(event.target.value)}
            placeholder="Zum Beispiel: Es geht mir eigentlich um soziale Teilhabe bei öffentlichen Veranstaltungen …"
            className="w-full rounded-[1.1rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm text-[rgb(var(--fg))] outline-none transition focus:border-cyan-300/80"
          />
        </div>
      ) : null}

      {props.reviewFeedback ? (
        <p className="mt-4 rounded-[1rem] border border-cyan-300/25 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-50">
          {props.reviewFeedback}
        </p>
      ) : null}

      {props.guestReviewGateVisible ? (
        <div className="mt-4 rounded-[1rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))]/70 px-4 py-4 text-sm text-[rgb(var(--fg))]/84">
          <p className="font-semibold text-[rgb(var(--fg))]">
            Melde dich an oder registriere dich, damit wir eine redaktionelle Prüfung sicher vormerken können.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a
              href={`/login?next=${encodeURIComponent(buildLandingEditorialReviewResumeHref())}`}
              className="landing-cta-primary public-cta-primary vog-btn-brand"
            >
              Einloggen und weiterarbeiten
            </a>
            <a
              href={`/register?next=${encodeURIComponent(buildLandingEditorialReviewResumeHref())}`}
              className="vog-btn-secondary landing-cta-secondary"
            >
              Registrieren und weiterarbeiten
            </a>
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className="landing-cta-primary public-cta-primary vog-btn-brand" onClick={props.onEditAgain}>
          Beitrag überarbeiten
        </button>
        {props.continueHref ? (
          <a
            href={props.continueHref}
            className="vog-btn-secondary landing-cta-secondary"
            onClick={props.onContinueToCreate}
          >
            Trotzdem in /create weiter
          </a>
        ) : null}
        {allowReview ? (
          <button
            type="button"
            className="vog-btn-secondary landing-cta-secondary"
            onClick={props.onReviewRequest}
            disabled={props.reviewSubmitting}
          >
            {props.reviewSubmitting ? "Wird vorgemerkt …" : "Zur redaktionellen Prüfung geben"}
          </button>
        ) : null}
      </div>
    </article>
  );
}

export default function LandingCreateLightEntry({ trustText }: LandingCreateLightEntryProps) {
  const [sourceText, setSourceText] = React.useState("");
  const [draftOrigin, setDraftOrigin] = React.useState<StartDraftOrigin>("start_create_light");
  const [activeStartDraft, setActiveStartDraft] = React.useState<StartDraftContext | null>(null);
  const [honeypot, setHoneypot] = React.useState("");
  const [preview, setPreview] = React.useState<LandingContributionPreview | null>(null);
  const [guidanceDraft, setGuidanceDraft] = React.useState<LandingContributionDraft | null>(null);
  const [reviewReason, setReviewReason] = React.useState("");
  const [reviewSubmitting, setReviewSubmitting] = React.useState(false);
  const [reviewFeedback, setReviewFeedback] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [guestReviewGateVisible, setGuestReviewGateVisible] = React.useState(false);
  const [sessionState, setSessionState] = React.useState<SessionState>("unknown");
  const [editorialModeRequested, setEditorialModeRequested] = React.useState(false);

  const characterCount = sourceText.trim().length;
  const currentDraft = React.useMemo(() => buildLandingContributionDraft(sourceText), [sourceText]);
  const reframeContinueHref = React.useMemo(() => {
    const href = "/create?intent=contribute&entryIntent=issue_signal&entryMode=guided&startDraft=1";
    if (sessionState === "authenticated") return href;
    return `/login?next=${encodeURIComponent(href)}&draft=start`;
  }, [sessionState]);

  React.useEffect(() => {
    const activeDraft = readStartDraftContext();
    if (activeDraft) {
      setActiveStartDraft(activeDraft);
    }
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setEditorialModeRequested(params.get("review") === "editorial");
    }
    const savedDraft = readSessionJson<SavedLandingDraft>(LANDING_START_CREATE_LIGHT_STORAGE_KEY);
    const savedReviewDraft = readSessionJson<SavedEditorialReviewDraft>(LANDING_EDITORIAL_REVIEW_STORAGE_KEY);
    if (savedReviewDraft?.sourceText) {
      setSourceText(savedReviewDraft.sourceText);
      setReviewReason(savedReviewDraft.reviewReason ?? "");
      return;
    }
    if (savedDraft?.sourceText) {
      setSourceText(savedDraft.sourceText);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    fetch("/api/session", { method: "GET", cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return;
        setSessionState(payload?.ok ? "authenticated" : "guest");
      })
      .catch(() => {
        if (!cancelled) setSessionState("guest");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!sourceText.trim()) {
      removeSessionJson(LANDING_START_CREATE_LIGHT_STORAGE_KEY);
      return;
    }
    writeSessionJson(LANDING_START_CREATE_LIGHT_STORAGE_KEY, {
      sourceText,
      savedAt: new Date().toISOString(),
    } satisfies SavedLandingDraft);
  }, [sourceText]);

  React.useEffect(() => {
    if (!guidanceDraft || !guidanceDraft.guidance.allowEditorialReview) {
      removeSessionJson(LANDING_EDITORIAL_REVIEW_STORAGE_KEY);
      return;
    }

    writeSessionJson(LANDING_EDITORIAL_REVIEW_STORAGE_KEY, {
      sourceText,
      reviewReason,
      relevanceClassification: guidanceDraft.relevanceClassification,
      savedAt: new Date().toISOString(),
    } satisfies SavedEditorialReviewDraft);
  }, [guidanceDraft, reviewReason, sourceText]);

  function resetOutcomeState() {
    setPreview(null);
    setGuidanceDraft(null);
    setReviewFeedback(null);
    setGuestReviewGateVisible(false);
  }

  function handleExamplePick(exampleText: string) {
    setDraftOrigin("start_example");
    setSourceText(exampleText);
    resetOutcomeState();
    setError(null);
  }

  function handleEditAgain() {
    setPreview(null);
    setGuidanceDraft(null);
    setReviewFeedback(null);
    setGuestReviewGateVisible(false);
    setEditorialModeRequested(false);
    setError(null);
  }

  function clearLandingDraftState() {
    clearStartDraftContext();
    removeSessionJson(LANDING_START_CREATE_LIGHT_STORAGE_KEY);
    removeSessionJson(LANDING_EDITORIAL_REVIEW_STORAGE_KEY);
    setActiveStartDraft(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (honeypot.trim().length > 0) {
      setError("Bitte sende das Formular erneut.");
      resetOutcomeState();
      return;
    }

    const next = buildLandingContributionPreview(sourceText);
    if (next.preview) {
      setError(null);
      setGuidanceDraft(null);
      setPreview(next.preview);
      setReviewFeedback(null);
      setGuestReviewGateVisible(false);
      return;
    }

    setPreview(null);
    setGuidanceDraft(next.draft);
    setReviewFeedback(null);
    setGuestReviewGateVisible(false);
    setError(next.draft.guardrails.blockingMessage);
  }

  function persistCurrentStartDraftForTarget(target: StartDraftTarget) {
    saveStartDraftContext(
      createStartDraftContext({
        text: sourceText,
        normalizedText: currentDraft.normalizedText,
        origin: draftOrigin,
        intent:
          currentDraft.relevanceClassification === "needs_reframe"
            ? "needs_reframe"
            : normalizeStartDraftIntent(currentDraft.intent),
        targetHint: target,
        preview: {
          contributionType: currentDraft.intent,
          possibleTopics: currentDraft.suggestedThemes,
          openQuestions: currentDraft.guidance.allowEditorialReview ? [] : undefined,
          suggestedNextSteps: currentDraft.suggestedNextSteps,
          relevance: currentDraft.relevanceClassification,
        },
      }),
    );
  }

  async function handleEditorialReviewRequest() {
    if (!guidanceDraft?.guidance.allowEditorialReview) return;

    if (sessionState !== "authenticated") {
      setGuestReviewGateVisible(true);
      setReviewFeedback(null);
      return;
    }

    if (guidanceDraft.guidance.editorialReviewReasonRequired && reviewReason.trim().length < 12) {
      setReviewFeedback(
        "Bitte beschreibe kurz, warum dein Anliegen aus deiner Sicht öffentlich relevant ist.",
      );
      return;
    }

    setReviewSubmitting(true);
    setReviewFeedback(null);
    try {
      const response = await fetch("/api/start/editorial-review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          originalText: sourceText,
          userReason: reviewReason,
          relevanceClassification: guidanceDraft.relevanceClassification,
          source: "start_create_light",
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.ok) {
        setReviewFeedback(
          payload?.message ??
            "Die redaktionelle Prüfung konnte gerade nicht vorgemerkt werden. Dein Text bleibt lokal gesichert.",
        );
        return;
      }

      setReviewFeedback(
        "Danke. Dein Beitrag wurde nicht veröffentlicht, sondern zur manuellen Prüfung vorgemerkt.",
      );
      removeSessionJson(LANDING_EDITORIAL_REVIEW_STORAGE_KEY);
    } catch {
      setReviewFeedback(
        "Die redaktionelle Prüfung konnte gerade nicht vorgemerkt werden. Dein Text bleibt lokal gesichert.",
      );
    } finally {
      setReviewSubmitting(false);
    }
  }

  return (
    <div className="space-y-8" data-testid="start-create-light-entry">
      {activeStartDraft ? (
        <GlobalDraftStatusBar
          draft={activeStartDraft}
          surface="start"
          eyebrow="Aktiver Entwurf"
          title="Letzten Entwurf fortsetzen"
          body="Du kannst deinen letzten Arbeitsstand weiterführen, einen neuen Beitrag beginnen oder den Entwurf verwerfen."
          primaryAction={{
            label: "Letzten Entwurf fortsetzen",
            onClick: () => {
              setSourceText(activeStartDraft.text);
              setReviewReason("");
              setPreview(null);
              setGuidanceDraft(null);
              setReviewFeedback(null);
              setGuestReviewGateVisible(false);
              setError(null);
            },
          }}
          secondaryAction={{
            label: "Neuen Beitrag beginnen",
            tone: "secondary",
            onClick: () => {
              clearLandingDraftState();
              setSourceText("");
              setReviewReason("");
              resetOutcomeState();
              setError(null);
            },
          }}
          tertiaryAction={{
            label: "Entwurf verwerfen",
            tone: "secondary",
            onClick: () => {
              clearLandingDraftState();
              setSourceText("");
              setReviewReason("");
              resetOutcomeState();
              setError(null);
            },
          }}
        />
      ) : null}

      <div className="space-y-4">
        <h1 className="no-grad landing-hero-title public-hero-title public-hero-title--start font-semibold tracking-tight">
          Dein Beitrag kann mehr bewirken.
        </h1>
        <p className="max-w-4xl text-lg font-semibold text-[rgb(var(--fg))] sm:text-xl">
          Was soll öffentlich besser <span className="public-gradient-text">verstanden</span>, geprüft oder entschieden werden?
        </p>
        <p className="max-w-3xl text-base font-medium text-[rgb(var(--fg))]/88 sm:text-lg">
          Schreib einen Gedanken, eine Frage, ein Problem oder einen Vorschlag. eDebatte hilft
          dabei, deinen Beitrag einzuordnen und mit bestehenden Themen, Argumenten und offenen
          Fragen zu verbinden.
        </p>
      </div>

      <form className="landing-proof-zone public-start-intake-card space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label htmlFor="start-light-intake" className="text-sm font-semibold text-[rgb(var(--fg))]">
            Beitrag eingeben
          </label>
          <textarea
            id="start-light-intake"
            name="start-light-intake"
            rows={7}
            value={sourceText}
            onChange={(event) => {
              setDraftOrigin("start_create_light");
              setSourceText(event.target.value);
              setError(null);
              setGuestReviewGateVisible(false);
            }}
            placeholder="Zum Beispiel: Bei uns fehlt ein sicherer Schulweg … / Ich frage mich, ob … / Ich möchte vorschlagen, dass …"
            className="public-start-intake-field w-full rounded-[1.25rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-5 py-5 text-base text-[rgb(var(--fg))] outline-none transition focus:border-cyan-300/80"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[rgb(var(--muted))]">
            <p>Noch keine Veröffentlichung. Erst wird dein Beitrag strukturiert und von dir bestätigt.</p>
            <span>{characterCount}/{LANDING_CONTRIBUTION_MAX_LENGTH}</span>
          </div>
        </div>

        <div className="hidden">
          <label htmlFor="start-light-company">Unternehmen</label>
          <input
            id="start-light-company"
            name="company"
            autoComplete="off"
            tabIndex={-1}
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
          />
        </div>

        {error ? (
          <p className="rounded-[1rem] border border-amber-300/35 bg-amber-400/10 px-4 py-3 text-sm font-medium text-amber-100">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="landing-cta-primary public-cta-primary vog-btn-brand">
            Beitrag einordnen
          </button>
          <a href="#start-beispiele" className="vog-btn-secondary landing-cta-secondary">
            Beispiele ansehen
          </a>
        </div>

        <p className="public-start-trust-line text-sm font-medium text-[rgb(var(--fg))]/86">
          Noch keine Veröffentlichung · keine automatische Prüfung · du bestätigst jeden nächsten Schritt
        </p>
        <p className="public-hero-trust max-w-3xl text-sm">{trustText}</p>
      </form>

      {preview ? (
        <PreviewCard
          draft={currentDraft}
          preview={preview}
          sourceText={sourceText}
          isAuthenticated={sessionState === "authenticated"}
          origin={draftOrigin}
          onEditAgain={handleEditAgain}
        />
      ) : null}

      {!preview && !guidanceDraft && editorialModeRequested && sourceText.trim().length > 0 ? (
        <EditorialReviewModeCard
          draft={currentDraft}
          reviewReason={reviewReason}
          onReviewReasonChange={setReviewReason}
          onReviewRequest={handleEditorialReviewRequest}
          onBackToDraft={() => {
            setEditorialModeRequested(false);
            setReviewFeedback(null);
            setGuestReviewGateVisible(false);
          }}
          reviewSubmitting={reviewSubmitting}
          reviewFeedback={reviewFeedback}
          guestReviewGateVisible={guestReviewGateVisible}
        />
      ) : null}

      {guidanceDraft ? (
        <GuidanceCard
          draft={guidanceDraft}
          reviewReason={reviewReason}
          onReviewReasonChange={setReviewReason}
          onReviewRequest={handleEditorialReviewRequest}
          continueHref={
            guidanceDraft.relevanceClassification === "needs_reframe" ||
            guidanceDraft.relevanceClassification === "personal_only"
              ? reframeContinueHref
              : null
          }
          onContinueToCreate={() => persistCurrentStartDraftForTarget("create")}
          onEditAgain={handleEditAgain}
          reviewSubmitting={reviewSubmitting}
          reviewFeedback={reviewFeedback}
          guestReviewGateVisible={guestReviewGateVisible}
        />
      ) : null}

      <section id="start-beispiele" className="landing-flow-line space-y-4">
        <div className="space-y-2">
          <p className="landing-eyebrow text-xs font-semibold uppercase tracking-[0.16em]">
            Beispiele zum Ausprobieren
          </p>
          <h2 className="text-xl font-semibold text-[rgb(var(--fg))]">Erst klicken, dann mit deinem eigenen Beitrag weitermachen.</h2>
          <p className="max-w-3xl text-sm leading-7 sm:text-base">
            Diese Karten sind ausdrücklich Beispiele. Sie zeigen nur, wie ein Anliegen aussehen kann
            und schreiben nichts produktiv fort.
          </p>
        </div>
        <div className="public-start-example-grid">
          {QUICK_EXAMPLES_DE.map((card) => (
            <button
              key={card.title}
              type="button"
              className="public-start-example-card landing-proof-column text-left"
              onClick={() => handleExamplePick(card.text)}
            >
              <span className="landing-soft-pill public-soft-pill">Beispiel</span>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                {card.lead}
              </p>
              <h3 className="mt-2 text-base font-semibold text-[rgb(var(--fg))]">{card.title}</h3>
              <p className="mt-2 text-sm leading-7 text-[rgb(var(--fg))]/82">{card.text}</p>
              <span className="landing-inline-link mt-4 inline-flex">Als Beispiel übernehmen</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
