"use client";

import { useEffect, useRef, useState } from "react";
import type { VogOriginMetadata } from "@features/vog/publicBallotContract";
import {
  VOG_BALLOT_CSRF_HEADER,
  VOG_BALLOT_CSRF_VALUE,
} from "@features/vog/publicBallotContract";
import type {
  VogPublicBallotReadModel,
  VogPublicBallotResultPass,
} from "@/features/vog/publicBallotReadModel";

type Copy = {
  eyebrow: string;
  originalLanguage: string;
  participationHeading: string;
  participationBody: string;
  attribution: string;
  legitimacy: string;
  choose: string;
  submit: string;
  submitting: string;
  change: string;
  saved: string;
  updated: string;
  alreadyVoted: string;
  networkError: string;
  rateLimited: string;
  closed: string;
  scheduled: string;
  genericError: string;
  resultUnavailable: string;
  ownSelection: string;
  privacy: string;
  methodology: string;
  resultHeading: string;
  total: string;
  guestVotes: string;
  memberVotes: string;
  period: string;
  openEnded: string;
  sources: string;
  counterPositions: string;
  follow: string;
  login: string;
  publicConsultation: string;
  distribution: string;
  evidenceAccess: string;
};

const COPY: Record<"de" | "en", Copy> = {
  de: {
    eyebrow: "VoiceOpenGov · öffentliche VOG-Frage",
    originalLanguage: "Originalsprache",
    participationHeading: "Offene öffentliche Beteiligung",
    participationBody:
      "Diese Beteiligung ist ohne Konto möglich und wird nicht als verifizierte Mitgliedsentscheidung gezählt.",
    attribution: "Namenszuordnung: nicht öffentlich",
    legitimacy: "Legitimation: nicht verifizierte öffentliche Konsultation",
    choose: "Antwort auswählen",
    submit: "Stimme abgeben",
    submitting: "Stimme wird gespeichert …",
    change: "Auswahl aktualisieren",
    saved: "Ihre Stimme wurde gespeichert.",
    updated: "Ihre Auswahl wurde aktualisiert, ohne eine weitere Stimme zu zählen.",
    alreadyVoted: "Sie haben bereits teilgenommen. Sie können Ihre Auswahl aktualisieren.",
    networkError: "Keine Verbindung. Ihre Stimme wurde nicht gespeichert.",
    rateLimited: "Zu viele Versuche. Bitte warten Sie kurz und versuchen Sie es erneut.",
    closed: "Diese öffentliche Beteiligung ist geschlossen.",
    scheduled: "Diese öffentliche Beteiligung ist noch nicht geöffnet.",
    genericError: "Die Stimme konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.",
    resultUnavailable: " Der Beteiligungspass ist vorübergehend nicht verfügbar.",
    ownSelection: "Ihre Auswahl",
    privacy:
      "Ein zufälliges erstseitiges Teilnahmetoken begrenzt Doppelstimmen. Im neuen Vote-Datensatz werden weder Roh-IP noch vollständiger User-Agent gespeichert.",
    methodology:
      "Dieses Ergebnis ist nicht repräsentativ. Ohne verifizierte Identität kann Mehrfachteilnahme reduziert, aber nicht vollständig ausgeschlossen werden.",
    resultHeading: "Beteiligungspass",
    total: "Stimmen insgesamt",
    guestVotes: "Offene Gaststimmen",
    memberVotes: "Verifizierte VOG-Mitgliedsstimmen",
    period: "Zeitraum",
    openEnded: "offen",
    sources: "Quellen",
    counterPositions: "Gegenpositionen",
    follow: "Nach der Beteiligung können Sie freiwillig ein Konto nutzen, um Themen zu folgen.",
    login: "Freiwillig anmelden",
    publicConsultation: "Öffentliche Konsultation",
    distribution: "Aggregierte Verteilungskanäle",
    evidenceAccess: "Quellen und Gegenpositionen ansehen",
  },
  en: {
    eyebrow: "VoiceOpenGov · public VOG question",
    originalLanguage: "Original language",
    participationHeading: "Open public participation",
    participationBody:
      "You can participate without an account. This is not counted as a verified member decision.",
    attribution: "Name attribution: not public",
    legitimacy: "Legitimacy: unverified public consultation",
    choose: "Choose an answer",
    submit: "Submit vote",
    submitting: "Saving vote …",
    change: "Update selection",
    saved: "Your vote has been saved.",
    updated: "Your selection was updated without counting another vote.",
    alreadyVoted: "You have already participated. You may update your selection.",
    networkError: "No connection. Your vote was not saved.",
    rateLimited: "Too many attempts. Please wait briefly and try again.",
    closed: "This public participation is closed.",
    scheduled: "This public participation has not opened yet.",
    genericError: "The vote could not be saved. Please try again.",
    resultUnavailable: " The participation pass is temporarily unavailable.",
    ownSelection: "Your selection",
    privacy:
      "A random first-party participation token reduces duplicate votes. The new vote record stores neither a raw IP address nor a full user agent.",
    methodology:
      "This result is not representative. Without verified identity, repeat participation can be reduced but not fully prevented.",
    resultHeading: "Participation pass",
    total: "Total votes",
    guestVotes: "Open guest votes",
    memberVotes: "Verified VOG member votes",
    period: "Period",
    openEnded: "open",
    sources: "Sources",
    counterPositions: "Counterpositions",
    follow: "After participating, you may optionally use an account to follow topics.",
    login: "Optional sign in",
    publicConsultation: "Public consultation",
    distribution: "Aggregated distribution channels",
    evidenceAccess: "View sources and counterpositions",
  },
};

function formatDate(value: string | null, locale: "de" | "en") {
  if (!value) return null;
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function ResultPass({
  result,
  locale,
}: {
  result: VogPublicBallotResultPass;
  locale: "de" | "en";
}) {
  const copy = COPY[locale];
  const start = formatDate(result.startsAt, locale) ?? copy.openEnded;
  const end = formatDate(result.closesAt, locale) ?? copy.openEnded;
  return (
    <section
      className="space-y-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm sm:p-5"
      aria-labelledby="vog-participation-pass-title"
      data-testid="vog-participation-pass"
    >
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          {copy.publicConsultation}
        </p>
        <h2 id="vog-participation-pass-title" className="text-lg font-bold text-[rgb(var(--fg))]">
          {copy.resultHeading}
        </h2>
      </div>
      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-[rgb(var(--muted))]">{copy.total}</dt>
          <dd className="text-xl font-bold text-[rgb(var(--fg))]">{result.totalVotes}</dd>
        </div>
        <div>
          <dt className="text-[rgb(var(--muted))]">{copy.guestVotes}</dt>
          <dd className="text-xl font-bold text-[rgb(var(--fg))]">{result.openGuestVotes}</dd>
        </div>
        <div>
          <dt className="text-[rgb(var(--muted))]">{copy.memberVotes}</dt>
          <dd className="text-xl font-bold text-[rgb(var(--fg))]">{result.verifiedMemberVotes}</dd>
        </div>
      </dl>
      <div className="space-y-2">
        {result.optionCounts.map((option) => {
          const percentage = result.totalVotes
            ? Math.round((option.count / result.totalVotes) * 100)
            : 0;
          return (
            <div key={option.canonicalChoice} className="text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="font-medium text-[rgb(var(--fg))]">{option.label}</span>
                <span className="text-[rgb(var(--muted))]">
                  {option.count} · {percentage}%
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-[rgb(var(--border))]">
                <div
                  className="h-full rounded-full bg-[rgb(var(--brand))]"
                  style={{ width: `${percentage}%` }}
                  aria-hidden="true"
                />
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-[rgb(var(--muted))]">
        {copy.period}: {start} – {end}
      </p>
      {result.distributionChannels.length > 0 && (
        <div className="text-xs text-[rgb(var(--muted))]">
          <p className="font-semibold text-[rgb(var(--fg))]">{copy.distribution}</p>
          <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {result.distributionChannels.map((channel) => (
              <li key={channel.source}>
                {channel.source}: {channel.count}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
        {copy.methodology}
      </p>
    </section>
  );
}

export function VogPublicBallotClient({
  initialBallot,
  originMetadata,
  localeHrefs,
}: {
  initialBallot: VogPublicBallotReadModel;
  originMetadata: VogOriginMetadata;
  localeHrefs: { de: string; en: string };
}) {
  const [ballot, setBallot] = useState(initialBallot);
  const [selection, setSelection] = useState(initialBallot.ownSelection ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(
    initialBallot.ownSelection ? COPY[initialBallot.locale].alreadyVoted : "",
  );
  const statusRef = useRef<HTMLParagraphElement>(null);
  const copy = COPY[ballot.locale];
  const canVote = ballot.lifecycle === "open";

  useEffect(() => {
    if (notice) statusRef.current?.focus();
  }, [notice]);

  async function submitVote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selection || !canVote || submitting) return;
    setSubmitting(true);
    setNotice("");
    try {
      const response = await fetch(
        `/api/vog/public-ballots/${encodeURIComponent(ballot.code)}/${encodeURIComponent(ballot.questionId)}/vote`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "content-type": "application/json",
            [VOG_BALLOT_CSRF_HEADER]: VOG_BALLOT_CSRF_VALUE,
          },
          body: JSON.stringify({
            choice: selection,
            source: originMetadata.source,
            origin: originMetadata.origin,
            origin_id: originMetadata.originId,
            locale: ballot.locale,
          }),
        },
      );
      const body = (await response.json().catch(() => null)) as
        | {
            ok?: boolean;
            error?: string;
            ballot?: VogPublicBallotReadModel | null;
            vote?: { updatedExisting?: boolean };
            resultProjectionUnavailable?: boolean;
          }
        | null;
      if (!response.ok || !body?.ok) {
        if (response.status === 429 || body?.error === "rate_limited") {
          setNotice(copy.rateLimited);
        } else if (body?.error === "ballot_closed") {
          setNotice(copy.closed);
        } else {
          setNotice(copy.genericError);
        }
        return;
      }
      if (body.ballot) {
        setBallot(body.ballot);
        setSelection(body.ballot.ownSelection ?? selection);
      } else {
        setBallot((current) => ({
          ...current,
          ownSelection: selection,
          ownSelectionLabel:
            current.options.find(
              (option) => option.canonicalChoice === selection,
            )?.label ?? null,
          results: null,
        }));
      }
      const savedNotice = body.vote?.updatedExisting ? copy.updated : copy.saved;
      setNotice(
        body.resultProjectionUnavailable
          ? `${savedNotice}${copy.resultUnavailable}`
          : savedNotice,
      );
    } catch {
      setNotice(copy.networkError);
    } finally {
      setSubmitting(false);
    }
  }

  const lifecycleMessage =
    ballot.lifecycle === "closed"
      ? copy.closed
      : ballot.lifecycle === "scheduled"
        ? copy.scheduled
        : null;

  return (
    <main
      className="mx-auto flex min-h-[100svh] max-w-3xl flex-col gap-5 px-4 py-5 sm:gap-6 sm:px-6 sm:py-8"
      lang={ballot.locale}
      data-testid="vog-public-ballot"
      data-lifecycle={ballot.lifecycle}
    >
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            {copy.eyebrow} · {ballot.originId}
          </p>
          <nav aria-label="Language" className="flex gap-2 text-xs">
            <a href={localeHrefs.de} hrefLang="de" aria-current={ballot.locale === "de" ? "page" : undefined}>
              DE
            </a>
            <a href={localeHrefs.en} hrefLang="en" aria-current={ballot.locale === "en" ? "page" : undefined}>
              EN
            </a>
          </nav>
        </div>
        <h1 className="text-2xl font-bold leading-tight text-[rgb(var(--fg))] sm:text-3xl">
          {ballot.title}
        </h1>
        <p className="text-sm leading-relaxed text-[rgb(var(--muted))] sm:text-base">
          {ballot.context}
        </p>
        <p className="text-xs text-[rgb(var(--muted))]">
          {copy.originalLanguage}: {ballot.originalLocale.toUpperCase()}
        </p>
        <a
          href="#vog-evidence"
          className="inline-flex text-xs font-semibold underline underline-offset-2"
        >
          {copy.evidenceAccess}
        </a>
      </header>

      <section
        id="vog-participation-class"
        className="rounded-2xl border border-sky-200 bg-sky-50 p-3 text-sm text-sky-950 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-100"
      >
        <h2 className="font-bold">{copy.participationHeading}</h2>
        <p className="mt-1">{copy.participationBody}</p>
        <ul className="mt-2 space-y-1 text-xs">
          <li>{copy.attribution}</li>
          <li>{copy.legitimacy}</li>
        </ul>
      </section>

      <form onSubmit={submitVote} className="space-y-4">
        <fieldset
          disabled={!canVote || submitting}
          aria-describedby="vog-participation-class vog-ballot-privacy"
          className="space-y-3"
        >
          <legend className="text-base font-bold text-[rgb(var(--fg))]">{copy.choose}</legend>
          <div className="grid grid-cols-1 gap-2">
            {ballot.options.map((option) => (
              <label
                key={option.canonicalChoice}
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 text-sm font-medium text-[rgb(var(--fg))] has-[:checked]:border-sky-600 has-[:checked]:ring-2 has-[:checked]:ring-sky-200"
              >
                <input
                  type="radio"
                  name="vog-public-ballot-choice"
                  value={option.canonicalChoice}
                  checked={selection === option.canonicalChoice}
                  onChange={() => setSelection(option.canonicalChoice)}
                  className="h-5 w-5"
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <p id="vog-ballot-privacy" className="text-xs leading-relaxed text-[rgb(var(--muted))]">
          {copy.privacy}
        </p>
        {lifecycleMessage ? (
          <p className="rounded-xl bg-[rgb(var(--card))] p-3 text-sm font-semibold text-[rgb(var(--fg))]">
            {lifecycleMessage}
          </p>
        ) : (
          <button
            type="submit"
            disabled={!selection || submitting}
            className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-sky-700 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {submitting
              ? copy.submitting
              : ballot.ownSelection
                ? copy.change
                : copy.submit}
          </button>
        )}
      </form>

      <p
        ref={statusRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className={notice ? "rounded-xl border border-[rgb(var(--border))] p-3 text-sm text-[rgb(var(--fg))]" : "sr-only"}
      >
        {notice}
      </p>

      {ballot.results && (
        <ResultPass result={ballot.results} locale={ballot.locale} />
      )}

      {ballot.ownSelectionLabel && (
        <p className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 text-sm text-[rgb(var(--fg))]">
          {copy.ownSelection}: <strong>{ballot.ownSelectionLabel}</strong>
        </p>
      )}

      <section id="vog-evidence" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h2 className="font-bold text-[rgb(var(--fg))]">{copy.sources}</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {ballot.sources.map((source) => (
              <li key={source.id}>
                <a className="underline underline-offset-2" href={source.href} rel="noreferrer">
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <h2 className="font-bold text-[rgb(var(--fg))]">{copy.counterPositions}</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {ballot.counterPositions.map((position) => (
              <li key={position.id}>
                {position.href ? (
                  <a className="underline underline-offset-2" href={position.href} rel="noreferrer">
                    {position.label}
                  </a>
                ) : (
                  position.label
                )}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {ballot.ownSelection && (
        <aside className="space-y-2 border-t border-[rgb(var(--border))] pt-4 text-sm text-[rgb(var(--muted))]">
          <p>{copy.follow}</p>
          <a href="/login" className="font-semibold underline underline-offset-2">
            {copy.login}
          </a>
        </aside>
      )}
    </main>
  );
}
