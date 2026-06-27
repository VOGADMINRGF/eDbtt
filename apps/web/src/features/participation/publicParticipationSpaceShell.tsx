import {
  canShowParticipationPlacePublicly,
  getParticipationPlaceDisplayModeLabel,
} from "@/features/participation/placeFuture";
import type { PublicParticipationSpaceFixture } from "@/features/participation/fixtures/publicParticipationSpace";
import {
  isParticipationSpaceFeedbackPublic,
  summarizeParticipationSpaceReadiness,
} from "@/features/participation/spaceContainer";

type PublicParticipationSpaceShellViewModel = {
  readiness: ReturnType<typeof summarizeParticipationSpaceReadiness>;
  publicPlace: PublicParticipationSpaceFixture["place"];
  canShowFeedbackDetails: boolean;
  canShowPlace: boolean;
  canShowOpenQuestions: boolean;
  canShowMinorityPositions: boolean;
  canShowNextSteps: boolean;
  feedbackPreparationNotice: string | null;
  feedbackUnavailableNotice: string | null;
  safetyNotices: string[];
  noPublicPlaceNotice: string;
  noPublicOpenQuestionsNotice: string;
  noPublicMinorityPositionsNotice: string;
  noPublicNextStepsNotice: string;
};

function getPublicParticipationSpaceShellViewModel(
  fixture: PublicParticipationSpaceFixture,
): PublicParticipationSpaceShellViewModel {
  const { place, space } = fixture;
  const readiness = summarizeParticipationSpaceReadiness(space);
  const canShowFeedbackDetails = isParticipationSpaceFeedbackPublic(space);
  const publicPlace = place && canShowParticipationPlacePublicly(place) ? place : null;

  return {
    readiness,
    publicPlace,
    canShowFeedbackDetails,
    canShowPlace: publicPlace !== null,
    canShowOpenQuestions: canShowFeedbackDetails,
    canShowMinorityPositions: canShowFeedbackDetails,
    canShowNextSteps: canShowFeedbackDetails,
    feedbackPreparationNotice:
      !canShowFeedbackDetails && space.status === "feedback_prepared"
        ? "Eine öffentliche Rückmeldung ist vorbereitet, aber noch nicht als öffentliche Einordnung sichtbar."
        : null,
    feedbackUnavailableNotice:
      !canShowFeedbackDetails && space.status !== "feedback_prepared"
        ? "Für diesen Beteiligungsraum ist aktuell noch keine öffentliche Rückmeldung sichtbar."
        : null,
    safetyNotices: [
      "Rückmeldungen sind Einordnungen, keine amtlichen Entscheidungen.",
      "Sichtbarkeit bedeutet keine automatische Veröffentlichung.",
      "Ortsangaben werden nur sicherheitsbewusst angezeigt.",
      "Nicht öffentliche Review-Inhalte bleiben verborgen.",
    ],
    noPublicPlaceNotice:
      "Öffentliche Ortsangaben werden nur angezeigt, wenn sie geprüft und sicherheitsbewusst freigegeben sind.",
    noPublicOpenQuestionsNotice:
      "Aktuell sind keine öffentlichen offenen Fragen markiert.",
    noPublicMinorityPositionsNotice:
      "Aktuell sind keine öffentlichen Minderheitenpositionen hervorgehoben.",
    noPublicNextStepsNotice:
      "Aktuell sind keine öffentlichen nächsten Schritte veröffentlicht.",
  };
}

export function PublicParticipationSpaceShell(props: {
  fixture: PublicParticipationSpaceFixture;
}) {
  const { feedback, space } = props.fixture;
  const viewModel = getPublicParticipationSpaceShellViewModel(props.fixture);

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
            {viewModel.readiness.statusLabel}
          </span>
          <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1">
            {viewModel.readiness.visibilityLabel}
          </span>
          <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1">
            Read-only Shell auf Fixture-Basis
          </span>
        </div>
        <p className="mt-4 text-sm leading-6 text-[rgb(var(--muted))]">
          Dieser Raum zeigt einen transparenten Beteiligungsstand auf sicher vorbereiteten
          Fixture-Daten. Sichtbarkeit ersetzt keine Prüfung und bedeutet keine automatische
          Veröffentlichung oder amtliche Entscheidung.
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
            {viewModel.safetyNotices.map((notice) => (
              <li key={notice}>{notice}</li>
            ))}
          </ul>
        </aside>
      </section>

      {viewModel.canShowFeedbackDetails ? (
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
          ) : (
            <p className="mt-5 text-sm leading-6 text-[rgb(var(--muted))]">
              Aktuell sind keine thematischen Zusammenfassungen veröffentlicht.
            </p>
          )}
        </section>
      ) : viewModel.feedbackPreparationNotice ? (
        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Rückmeldung in Vorbereitung
          </p>
          <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">
            {viewModel.feedbackPreparationNotice}
          </p>
        </section>
      ) : viewModel.feedbackUnavailableNotice ? (
        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Noch keine öffentliche Rückmeldung
          </p>
          <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">
            {viewModel.feedbackUnavailableNotice}
          </p>
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        {viewModel.canShowOpenQuestions ? (
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
                {viewModel.noPublicOpenQuestionsNotice}
              </p>
            )}
          </article>
        ) : null}
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Ortsbezug
          </p>
          {viewModel.canShowPlace && viewModel.publicPlace ? (
            <div className="mt-3 space-y-2">
              <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">
                {viewModel.publicPlace.label}
              </h2>
              <p className="text-sm leading-6 text-[rgb(var(--muted))]">
                {viewModel.publicPlace.description}
              </p>
              <p className="text-xs text-[rgb(var(--muted))]">
                Anzeigeform: {getParticipationPlaceDisplayModeLabel(viewModel.publicPlace.displayMode)}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">
              {viewModel.noPublicPlaceNotice}
            </p>
          )}
        </article>
      </section>

      {viewModel.canShowMinorityPositions ? (
        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Minderheitenpositionen bleiben sichtbar
          </p>
          {feedback.minorityPositions.length > 0 ? (
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
          ) : (
            <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">
              {viewModel.noPublicMinorityPositionsNotice}
            </p>
          )}
        </section>
      ) : null}

      {viewModel.canShowNextSteps ? (
        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Nächste Schritte
          </p>
          {feedback.nextSteps.length > 0 ? (
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
          ) : (
            <p className="mt-3 text-sm leading-6 text-[rgb(var(--muted))]">
              {viewModel.noPublicNextStepsNotice}
            </p>
          )}
          <p className="mt-4 text-xs text-[rgb(var(--muted))]">
            Rückmeldungen bleiben Einordnungen und nächste Arbeitsschritte, keine Zustimmung oder
            politische Lösung.
          </p>
        </section>
      ) : null}
    </main>
  );
}
