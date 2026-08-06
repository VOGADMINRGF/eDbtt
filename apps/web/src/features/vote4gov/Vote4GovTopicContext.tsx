import Link from "next/link";
import type {
  Vote4GovResolvedQuestion,
  Vote4GovTopicHandoffResolution,
} from "@features/vote4gov/sourceRegistry";

const COPY = {
  de: {
    issue: "Ausgabe",
    lifecycle: {
      scheduled: "Beteiligung geplant",
      open: "Kontext geöffnet",
      closed: "Beteiligung geschlossen",
    },
    openOriginal: "Originalbeitrag öffnen",
    topic: "Zugeordnetes Thema",
    thesis: "Zentrale Artikelthese",
    participation: "Öffentliche Konsultation",
    original: "Original",
    reading: "Lesesprache",
    missingTranslation: "Übersetzung fehlt · Original wird angezeigt",
    localNotice:
      "Diese Auswahl wurde bei Vote4Gov nur lokal vorgemerkt und noch nicht öffentlich gezählt.",
    privacyNotice:
      "Ein Seitenaufruf übernimmt, verwirft oder verbindet die Vormerkung nicht mit einem Konto. Die offene Konsultation ist nicht repräsentativ und entscheidet nicht über Fakten oder Wahrheit.",
    questions: "Fragen aus dem Artikel",
    questionSingular: "Frage",
    questionPlural: "Fragen",
    of: "von",
    binary: "zustimmungsfähige These",
    open: "offene Frage",
    notTransferred: "Noch nicht übernommen",
    localSelection: {
      agree: "Zustimmung lokal vorgemerkt",
      disagree: "Widerspruch lokal vorgemerkt",
      remembered: "Nur für später vorgemerkt",
    },
    quick: "Schnelle Einordnung",
    agree: "Zustimmen",
    disagree: "Widersprechen",
    ballotUnavailable: "Public Ballot noch nicht freigegeben",
    depthNav: "Vertiefungen zu Frage",
    source: "Quelle öffnen",
    counterposition: "Gegenposition prüfen",
    impact: "Wirkung & nächste Schritte",
    contribution: "Eigenen Beitrag ergänzen",
  },
  en: {
    issue: "Issue",
    lifecycle: {
      scheduled: "Participation scheduled",
      open: "Context open",
      closed: "Participation closed",
    },
    openOriginal: "Open original article",
    topic: "Related topic",
    thesis: "Central article thesis",
    participation: "Open public consultation",
    original: "Original",
    reading: "Reading language",
    missingTranslation: "Translation unavailable · showing the original",
    localNotice:
      "This selection was only saved locally at Vote4Gov and has not been counted publicly.",
    privacyNotice:
      "Opening this page does not transfer or discard the selection and does not link it to an account. This open consultation is not representative and does not decide facts or truth.",
    questions: "Questions from the article",
    questionSingular: "question",
    questionPlural: "questions",
    of: "of",
    binary: "binary thesis",
    open: "open question",
    notTransferred: "Not transferred",
    localSelection: {
      agree: "Agreement saved locally",
      disagree: "Disagreement saved locally",
      remembered: "Saved for later only",
    },
    quick: "Quick response",
    agree: "Agree",
    disagree: "Disagree",
    ballotUnavailable: "Public ballot not yet released",
    depthNav: "Ways to explore question",
    source: "Open source",
    counterposition: "Review counter-position",
    impact: "Impact & next steps",
    contribution: "Add your own contribution",
  },
} as const satisfies Record<
  "de" | "en",
  {
    localSelection: Record<Exclude<Vote4GovResolvedQuestion["localSelection"], null>, string>;
    lifecycle: Record<"scheduled" | "open" | "closed", string>;
  } & Record<string, unknown>
>;

function languageLabel(language: "de" | "en", displayLanguage: "de" | "en") {
  if (displayLanguage === "en") return language === "de" ? "German" : "English";
  return language === "de" ? "Deutsch" : "Englisch";
}

export function Vote4GovTopicContext(props: {
  resolution: Vote4GovTopicHandoffResolution;
  topicTitle: string;
}) {
  if (props.resolution.status === "absent") return null;
  if (props.resolution.status === "invalid") {
    return (
      <section
        data-vote4gov-context="invalid"
        role="status"
        className="rounded-3xl border border-amber-300/60 bg-amber-50/70 p-5 text-amber-950 shadow-sm dark:bg-amber-950/20 dark:text-amber-100 sm:p-6"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em]">Vote4Gov Review</p>
        <h2 className="mt-2 text-xl font-semibold">Artikelkontext nicht verifiziert</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6">
          Die übergebene Zuordnung stimmt nicht mit einer freigegebenen serverseitigen
          Artikel- und Fragenregistrierung überein. Der öffentliche Themenstand bleibt
          lesbar; aus dem Link werden keine Inhalte, Rechte oder Beteiligungen übernommen.
        </p>
      </section>
    );
  }

  const context = props.resolution.value;
  const copy = COPY[context.readingLanguage];
  return (
    <section
      data-vote4gov-context="resolved"
      aria-labelledby="vote4gov-article-title"
      className="rounded-3xl border border-cyan-300/50 bg-[color-mix(in_oklab,rgb(var(--card))_92%,rgb(var(--grad-from))_8%)] p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            <span className="rounded-full border border-cyan-300/60 px-3 py-1 text-cyan-700 dark:text-cyan-200">
              Vote4Gov Review
            </span>
            <span>{copy.issue} {context.issue}</span>
            <span>{copy.lifecycle[context.lifecycle]}</span>
          </div>
          <h2
            id="vote4gov-article-title"
            className="mt-4 text-2xl font-semibold text-[rgb(var(--fg))] sm:text-3xl"
          >
            {context.title}
          </h2>
          <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">
            {copy.topic}: {props.topicTitle}
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
            {context.summary}
          </p>
          <p className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 text-sm leading-6 text-[rgb(var(--fg))]">
            <span className="font-semibold">{copy.thesis}:</span> {context.thesis}
          </p>
        </div>
        <a
          href={context.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          {copy.openOriginal}
        </a>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-[rgb(var(--muted))]">
        <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1">
          {copy.participation}
        </span>
        <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1">
          {copy.original}: {languageLabel(context.originalLanguage, context.readingLanguage)}
        </span>
        <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1">
          {copy.reading}: {languageLabel(context.readingLanguage, context.readingLanguage)}
        </span>
        {context.translationStatus === "missing_fallback" ? (
          <span className="rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1 text-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
            {copy.missingTranslation}
          </span>
        ) : null}
      </div>

      <div className="mt-5 rounded-2xl border border-sky-300/60 bg-sky-50/70 p-4 text-sm leading-6 text-sky-950 dark:bg-sky-950/20 dark:text-sky-100">
        <p className="font-semibold">
          {copy.localNotice}
        </p>
        <p className="mt-1">
          {copy.privacyNotice}
        </p>
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">{copy.questions}</h3>
          <p className="text-xs text-[rgb(var(--muted))]">
            {context.questions.length}{" "}
            {context.questions.length === 1 ? copy.questionSingular : copy.questionPlural}
          </p>
        </div>
        <ol className="mt-3 grid gap-4">
          {context.questions.map((question, index) => (
            <li key={question.questionId}>
              <article
                tabIndex={0}
                aria-label={`${copy.questionSingular} ${index + 1} ${copy.of} ${context.questions.length}`}
                className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 sm:p-5"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                  <span className="font-semibold uppercase tracking-[0.14em]">
                    {copy.questionSingular} {index + 1}
                  </span>
                  <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1">
                    {question.kind === "binary_thesis" ? copy.binary : copy.open}
                  </span>
                  {question.localSelection ? (
                    <span className="rounded-full border border-cyan-300/60 bg-cyan-50 px-2 py-1 text-cyan-900 dark:bg-cyan-950/30 dark:text-cyan-100">
                      {copy.localSelection[question.localSelection]}
                    </span>
                  ) : (
                    <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1">
                      {copy.notTransferred}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-base font-semibold leading-7 text-[rgb(var(--fg))]">
                  {question.prompt}
                </p>

                {question.kind === "binary_thesis" ? (
                  <fieldset className="mt-4" disabled>
                    <legend className="text-xs font-semibold text-[rgb(var(--muted))]">
                      {copy.quick}
                    </legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="min-h-11 rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold opacity-60"
                      >
                        {copy.agree}
                      </button>
                      <button
                        type="button"
                        className="min-h-11 rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold opacity-60"
                      >
                        {copy.disagree}
                      </button>
                    </div>
                  </fieldset>
                ) : null}
                <p className="mt-3 text-sm font-semibold text-amber-800 dark:text-amber-200">
                  {context.readingLanguage === "de"
                    ? context.publicBallot.label
                    : copy.ballotUnavailable}
                </p>

                <nav
                  aria-label={`${copy.depthNav} ${index + 1}`}
                  className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
                >
                  <a
                    href={question.sourceHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-center text-sm font-semibold text-[rgb(var(--fg))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                  >
                    {copy.source}
                  </a>
                  <Link
                    href={question.counterpositionHref}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-center text-sm font-semibold text-[rgb(var(--fg))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                  >
                    {copy.counterposition}
                  </Link>
                  <Link
                    href={question.impactHref}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[rgb(var(--border))] px-3 py-2 text-center text-sm font-semibold text-[rgb(var(--fg))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                  >
                    {copy.impact}
                  </Link>
                  <Link
                    href={question.contributionHref}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-dashed border-[rgb(var(--border))] px-3 py-2 text-center text-sm font-semibold text-[rgb(var(--muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                  >
                    {copy.contribution}
                  </Link>
                </nav>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
