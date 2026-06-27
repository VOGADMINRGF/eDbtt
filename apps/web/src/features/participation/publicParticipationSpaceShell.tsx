import {
  canShowParticipationPlacePublicly,
  getParticipationPlaceDisplayModeLabel,
} from "@/features/participation/placeFuture";
import {
  isParticipationSpaceFeedbackPublic,
  summarizeParticipationSpaceReadiness,
} from "@/features/participation/spaceContainer";
import type { PublicParticipationSpaceFixture } from "@/features/participation/fixtures/publicParticipationSpace";

export function PublicParticipationSpaceShell(props: {
  fixture: PublicParticipationSpaceFixture;
}) {
  const { feedback, place, space } = props.fixture;
  const readiness = summarizeParticipationSpaceReadiness(space);
  const feedbackPublic = isParticipationSpaceFeedbackPublic(space);
  const publicPlace = place && canShowParticipationPlacePublicly(place) ? place : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Öffentlicher Beteiligungsstand
          </p>
          <h1 className="text-3xl font-semibold text-[rgb(var(--fg))] sm:text-4xl">
            {space.title}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
            {space.summary}
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1">
            {readiness.statusLabel}
          </span>
          <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1">
            {readiness.visibilityLabel}
          </span>
          <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1">
            Read-only Shell auf Fixture-Basis
          </span>
        </div>
        <p className="mt-4 text-sm leading-6 text-[rgb(var(--muted))]">
          Dieser Raum zeigt einen transparenten Beteiligungsstand auf sicher vorbereiteten
          Fixture-Daten. Sichtbarkeit heißt nicht automatische Prüfung, Veröffentlichung oder
          amtliche Entscheidung.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Transparenzhinweis
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
            {space.publicSummary.headline}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">
            {space.publicSummary.shortSummary}
          </p>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <dt className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                Offene Fragen
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">
                {space.publicSummary.openQuestionCount}
              </dd>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <dt className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                Nächste Schritte
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">
                {space.publicSummary.nextStepCount}
              </dd>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <dt className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                Minderheitenpositionen
              </dt>
              <dd className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">
                {space.publicSummary.minorityPositionCount}
              </dd>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <dt className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                Letzte Aktualisierung
              </dt>
              <dd className="mt-1 text-sm font-medium text-[rgb(var(--fg))]">
                {space.publicSummary.lastUpdatedAt}
              </dd>
            </div>
          </dl>
        </article>

        <aside className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Safety & Trust
          </p>
          <ul className="mt-3 space-y-3 text-sm leading-6 text-[rgb(var(--muted))]">
            <li>Rückmeldungen sind redaktionelle Einordnungen, keine amtliche Entscheidung.</li>
            <li>Ortsangaben werden nur geprüft und sicherheitsbewusst angezeigt.</li>
            <li>
              Dieser Raum ist ein transparenter Beteiligungsstand, kein automatischer
              Veröffentlichungsworkflow.
            </li>
          </ul>
        </aside>
      </section>

      {feedbackPublic ? (
        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Öffentliche Rückmeldung
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))]">
            {feedback.title}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
            {feedback.summary}
          </p>
          {feedback.topicSummaries.length > 0 ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {feedback.topicSummaries.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
                >
                  <h3 className="text-base font-semibold text-[rgb(var(--fg))]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                    {item.summary}
                  </p>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : space.status === "feedback_prepared" ? (
        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Rückmeldung in Vorbereitung
          </p>
          <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">
            Eine öffentliche Rückmeldung ist vorbereitet, aber noch nicht als öffentliche
            Einordnung sichtbar.
          </p>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        {feedbackPublic ? (
          <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm lg:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
              Offene Fragen
            </p>
            {feedback.openQuestions.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {feedback.openQuestions.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 text-sm leading-6 text-[rgb(var(--fg))]"
                  >
                    {item.question}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">
                Aktuell sind keine offenen Fragen im öffentlichen Beteiligungsstand markiert.
              </p>
            )}
          </article>
        ) : null}
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Ortsbezug
          </p>
          {publicPlace ? (
            <div className="mt-3 space-y-2">
              <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">{publicPlace.label}</h2>
              <p className="text-sm leading-6 text-[rgb(var(--muted))]">
                {publicPlace.description}
              </p>
              <p className="text-xs text-[rgb(var(--muted))]">
                Anzeigeform: {getParticipationPlaceDisplayModeLabel(publicPlace.displayMode)}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">
              Öffentliche Ortsangaben werden nur angezeigt, wenn sie geprüft und
              sicherheitsbewusst freigegeben sind.
            </p>
          )}
        </article>
      </section>

      {feedbackPublic && feedback.minorityPositions.length > 0 ? (
        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Minderheitenpositionen bleiben sichtbar
          </p>
          <ul className="mt-4 space-y-3">
            {feedback.minorityPositions.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
              >
                <h2 className="text-base font-semibold text-[rgb(var(--fg))]">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                  {item.summary}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {feedbackPublic ? (
        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Nächste Schritte
          </p>
          <ul className="mt-4 space-y-3">
            {feedback.nextSteps.map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
              >
                <h2 className="text-base font-semibold text-[rgb(var(--fg))]">{item.label}</h2>
                <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-[rgb(var(--muted))]">
            Rückmeldungen bleiben Einordnungen und nächste Arbeitsschritte, keine Zustimmung oder
            politische Lösung.
          </p>
        </section>
      ) : null}
    </main>
  );
}
