"use client";

import * as React from "react";

const PUBLIC_COMMUNITY_SOURCE_SUBMISSION_TARGET = "handoff_review_item";

const KIND_OPTIONS = [
  {
    value: "source_suggestion",
    label: "Quellenvorschlag",
    help: "Ein möglicher Link oder eine Quelle zur späteren Prüfung.",
  },
  {
    value: "counter_source",
    label: "Gegenquelle",
    help: "Ein Gegenbeleg oder eine abweichende Einordnung zur späteren Prüfung.",
  },
  {
    value: "context_note",
    label: "Kontextnotiz",
    help: "Zusätzlicher Kontext, der die öffentliche Einordnung ergänzen kann.",
  },
  {
    value: "lived_experience",
    label: "Erfahrungsbericht",
    help: "Eine eigene Beobachtung oder Erfahrung als prüfpflichtiger Hinweis.",
  },
  {
    value: "unclear_claim",
    label: "Unklarer Claim",
    help: "Eine Stelle, die unklar, missverständlich oder prüfbedürftig wirkt.",
  },
  {
    value: "wording_clarification",
    label: "Begriffsklärung",
    help: "Ein Hinweis zu Sprache, Begriffen oder missverständlicher Formulierung.",
  },
  {
    value: "escalation_request",
    label: "Eskalationshinweis",
    help: "Ein Hinweis, dass die Stelle redaktionell genauer geprüft werden sollte.",
  },
] as const;

type PublicCommunitySourceSubmissionFormProps = {
  participationSpaceId: string;
  participationSpaceSlug: string;
  participationSpaceTitle: string;
};

type SubmissionApiResponse =
  | {
      ok: true;
      message?: string;
    }
  | {
      ok: false;
      message?: string;
    };

function requiresSourceReference(kind: string) {
  return kind === "source_suggestion" || kind === "counter_source";
}

function getFallbackErrorMessage() {
  return "Der Hinweis konnte gerade nicht sicher gesendet werden. Bitte versuche es erneut.";
}

export function PublicCommunitySourceSubmissionForm(
  props: PublicCommunitySourceSubmissionFormProps,
) {
  const [kind, setKind] = React.useState<(typeof KIND_OPTIONS)[number]["value"]>(
    "source_suggestion",
  );
  const [text, setText] = React.useState("");
  const [sourceRef, setSourceRef] = React.useState("");
  const [honeypotValue, setHoneypotValue] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState("");

  const selectedKind =
    KIND_OPTIONS.find((option) => option.value === kind) ?? KIND_OPTIONS[0];
  const sourceRefRequired = requiresSourceReference(kind);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;

    const trimmedText = text.trim();
    const trimmedSourceRef = sourceRef.trim();
    if (!trimmedText) {
      setSuccessMessage("");
      setErrorMessage("Bitte beschreibe den Hinweis zuerst kurz.");
      return;
    }
    if (sourceRefRequired && !trimmedSourceRef) {
      setSuccessMessage("");
      setErrorMessage("Für Quellenvorschläge und Gegenquellen ist ein Link erforderlich.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/community/source-review/submissions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          kind,
          target: PUBLIC_COMMUNITY_SOURCE_SUBMISSION_TARGET,
          targetId: props.participationSpaceId,
          text: trimmedText,
          sourceRefs: trimmedSourceRef ? [trimmedSourceRef] : [],
          participationSpaceSlugOrId: props.participationSpaceSlug,
          honeypotValue,
        }),
      });

      const payload = (await response.json().catch(() => null)) as SubmissionApiResponse | null;
      if (!response.ok || !payload || payload.ok === false) {
        setErrorMessage(payload?.message?.trim() || getFallbackErrorMessage());
        return;
      }

      setText("");
      setSourceRef("");
      setHoneypotValue("");
      setSuccessMessage(
        payload.message?.trim() ||
          "Der Hinweis wurde aufgenommen und zur redaktionellen Prüfung vorgemerkt.",
      );
    } catch {
      setErrorMessage(getFallbackErrorMessage());
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-[1.75rem] border border-sky-500/15 bg-[linear-gradient(180deg,rgba(14,165,233,0.08),rgba(15,23,42,0.01)),rgb(var(--card))] p-6 shadow-sm">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-600">
          Review-first Hinweis
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))]">
          Hinweise zu diesem Raum einreichen
        </h2>
        <p className="mt-3 text-sm leading-7 text-[rgb(var(--muted))] sm:text-base">
          Für <span className="font-semibold text-[rgb(var(--fg))]">{props.participationSpaceTitle}</span> kannst du
          hier Quellen, Gegenbelege, Kontext oder Beobachtungen als prüfpflichtigen
          Hinweis einreichen. Der Hinweis bestätigt keine Wahrheit, veröffentlicht
          nichts automatisch und wird vor jeder weiteren Sichtbarkeit redaktionell
          geprüft.
        </p>
      </div>

      <form
        className="mt-5 grid gap-4"
        data-testid="public-community-source-submission-form"
        onSubmit={handleSubmit}
      >
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-[rgb(var(--fg))]">Hinweisart</span>
          <select
            className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm text-[rgb(var(--fg))] shadow-sm outline-none transition focus:border-sky-500"
            name="kind"
            value={kind}
            onChange={(event) => setKind(event.currentTarget.value as (typeof KIND_OPTIONS)[number]["value"])}
          >
            {KIND_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <span className="text-sm leading-6 text-[rgb(var(--muted))]">{selectedKind.help}</span>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-[rgb(var(--fg))]">Hinweis</span>
          <textarea
            className="min-h-32 rounded-[1.35rem] border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm leading-6 text-[rgb(var(--fg))] shadow-sm outline-none transition focus:border-sky-500"
            name="text"
            maxLength={2400}
            placeholder="Was sollte in diesem öffentlichen Beteiligungsraum aus deiner Sicht geprüft oder ergänzt werden?"
            value={text}
            onChange={(event) => setText(event.currentTarget.value)}
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-[rgb(var(--fg))]">
            Quelle oder Link {sourceRefRequired ? "(erforderlich)" : "(optional)"}
          </span>
          <input
            className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3 text-sm text-[rgb(var(--fg))] shadow-sm outline-none transition focus:border-sky-500"
            name="source-ref"
            placeholder="https://beispiel.de/quelle"
            type="url"
            value={sourceRef}
            onChange={(event) => setSourceRef(event.currentTarget.value)}
          />
          <span className="text-xs leading-5 text-[rgb(var(--muted))]">
            Öffentliche Hinweise bleiben Einordnungen. Links werden nicht automatisch
            bestätigt oder veröffentlicht.
          </span>
        </label>

        <label className="sr-only" aria-hidden="true">
          Nicht ausfüllen
          <input
            autoComplete="off"
            name="website"
            tabIndex={-1}
            type="text"
            value={honeypotValue}
            onChange={(event) => setHoneypotValue(event.currentTarget.value)}
          />
        </label>

        {errorMessage ? (
          <p
            className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-700"
            role="status"
          >
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p
            className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm leading-6 text-emerald-700"
            role="status"
          >
            {successMessage}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            className="vog-btn-brand"
            disabled={submitting}
            type="submit"
          >
            {submitting ? "Hinweis wird gesendet..." : "Hinweis einreichen"}
          </button>
          <p className="text-xs leading-5 text-[rgb(var(--muted))]">
            Maximal wenige Hinweise in kurzer Zeit. Bei Überlastung greift ein Schutzlimit.
          </p>
        </div>
      </form>
    </section>
  );
}
