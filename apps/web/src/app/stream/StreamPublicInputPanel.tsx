"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Link from "next/link";
import {
  STREAM_PUBLIC_INPUT_EMPTY_STATE_COPY,
  STREAM_PUBLIC_INPUT_KINDS,
  type StreamPublicInputKind,
  streamPublicInputKindLabel,
  streamPublicInputPlaceholder,
} from "@features/stream/publicInput";

type SubmissionState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | {
      kind: "success";
      visibilityState: string;
      visibilityLabel: string;
    }
  | { kind: "error"; message: string };

export default function StreamPublicInputPanel(props: {
  streamId: string;
  streamTitle: string;
  anlassraumHref: string | null;
  dossierHref: string | null;
  openForInput: boolean;
}) {
  const [kind, setKind] = useState<StreamPublicInputKind>("question");
  const [text, setText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [submission, setSubmission] = useState<SubmissionState>({ kind: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!props.openForInput) {
      setSubmission({
        kind: "error",
        message: STREAM_PUBLIC_INPUT_EMPTY_STATE_COPY,
      });
      return;
    }

    setSubmission({ kind: "submitting" });

    const response = await fetch("/api/stream/public-input", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        streamId: props.streamId,
        kind,
        text,
        sourceUrl,
      }),
    }).catch(() => null);

    if (!response) {
      setSubmission({
        kind: "error",
        message: "Die Stream-Beteiligung ist gerade nicht verfügbar.",
      });
      return;
    }

    const body = (await response.json().catch(() => null)) as
      | {
          ok?: boolean;
          input?: { visibilityState?: string; visibilityLabel?: string };
          error?: string;
        }
      | null;

    if (!response.ok || !body?.ok || !body.input) {
      setSubmission({
        kind: "error",
        message:
          body?.error === "public_stream_not_open"
            ? STREAM_PUBLIC_INPUT_EMPTY_STATE_COPY
            : "Die Eingabe konnte nicht übernommen werden.",
      });
      return;
    }

    setText("");
    setSourceUrl("");
    setSubmission({
      kind: "success",
      visibilityState: String(body.input.visibilityState ?? "internal_review"),
      visibilityLabel: String(body.input.visibilityLabel ?? "reviewpflichtig"),
    });
  }

  return (
    <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Öffentliche Beteiligung
        </p>
        <h2 className="text-xl font-bold text-[rgb(var(--fg))]">
          Was möchtest du beitragen?
        </h2>
        <p className="text-sm leading-6 text-[rgb(var(--muted))]">
          Frage, Quelle, Perspektive, Option, Bedenken oder Korrektur gehen reviewpflichtig in
          denselben Folgepfad wie Anlassraum- und Dossier-Nachbereitung.
        </p>
        <p className="text-sm leading-6 text-[rgb(var(--muted))]">
          Nichts erscheint automatisch als Chat, amtliche Aussage oder veröffentlichtes Ergebnis.
        </p>
      </div>

      {!props.openForInput ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">
            Öffentliche Eingaben sind gerade nicht geöffnet
          </p>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            {STREAM_PUBLIC_INPUT_EMPTY_STATE_COPY}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid gap-2 sm:grid-cols-4 xl:grid-cols-7">
            {STREAM_PUBLIC_INPUT_KINDS.map((entry) => {
              const active = kind === entry;
              return (
                <button
                  key={entry}
                  type="button"
                  onClick={() => setKind(entry)}
                  aria-pressed={active}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "border-[rgb(var(--grad-from))]/50 bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
                      : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))]"
                  }`}
                >
                  {streamPublicInputKindLabel(entry)}
                </button>
              );
            })}
          </div>

          <div>
            <label
              htmlFor="stream-public-input-text"
              className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]"
            >
              Beitrag zu {props.streamTitle}
            </label>
            <textarea
              id="stream-public-input-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              required
              minLength={8}
              maxLength={2400}
              className="mt-2 min-h-[120px] w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
              placeholder={streamPublicInputPlaceholder(kind)}
            />
          </div>

          {(kind === "source_hint" || kind === "correction") ? (
            <div>
              <label
                htmlFor="stream-public-input-source"
                className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]"
              >
                Link oder Quelle
              </label>
              <input
                id="stream-public-input-source"
                type="url"
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                className="mt-2 w-full rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))] outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                placeholder="https://…"
              />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={submission.kind === "submitting"}
              className="inline-flex items-center justify-center rounded-lg bg-[rgb(var(--grad-from))] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
            >
              {submission.kind === "submitting"
                ? "Wird eingereicht…"
                : `${streamPublicInputKindLabel(kind)} einreichen`}
            </button>
            {props.anlassraumHref ? (
              <Link
                href={props.anlassraumHref}
                className="inline-flex items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition hover:bg-[rgb(var(--card))]"
              >
                Zum Anlassraum
              </Link>
            ) : null}
            {props.dossierHref ? (
              <Link
                href={props.dossierHref}
                className="inline-flex items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition hover:bg-[rgb(var(--card))]"
              >
                Zum Dossier
              </Link>
            ) : null}
          </div>

          {submission.kind === "success" ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              <p className="font-semibold">Eingabe übernommen</p>
              <p className="mt-1">
                Dein Beitrag ist jetzt <strong>{submission.visibilityLabel}</strong>.
              </p>
              <p className="mt-1 text-xs">
                Sichtbar heißt nicht automatisch geprüft oder veröffentlicht. Dossier-, Anlassraum-
                und Social-Folgepfade bleiben review-first.
              </p>
            </div>
          ) : null}

          {submission.kind === "error" ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
              {submission.message}
            </div>
          ) : null}
        </form>
      )}

      <p className="mt-3 text-xs text-[rgb(var(--muted))]">
        Keine automatische Veröffentlichung. Keine ungeprüfte Chat-Anzeige. Keine stille Weitergabe
        an Dossier oder Social-Kanäle.
      </p>
    </section>
  );
}
