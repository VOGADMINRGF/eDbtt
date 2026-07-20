"use client";

import * as React from "react";
import GlobalDraftStatusBar from "@/features/start/GlobalDraftStatusBar";
import StartDraftWorkspaceChooser from "@/features/start/StartDraftWorkspaceChooser";
import {
  clearStartDraftContext,
  getStartDraftForTarget,
  matchStartDraftTopics,
  updateStartDraftContext,
  type StartDraftContext,
} from "@/features/start/startDraftContext";

type TopicCard = {
  slug: string;
  title: string;
  framingQuestion: string;
};

type ThemenStartDraftAssistantProps = {
  topics: TopicCard[];
};

export default function ThemenStartDraftAssistant(props: ThemenStartDraftAssistantProps) {
  const [draft, setDraft] = React.useState<StartDraftContext | null>(null);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    const nextDraft = getStartDraftForTarget("themes");
    if (!nextDraft) return;
    setDraft(nextDraft);
    setQuery(nextDraft.text);
  }, []);

  const matches = React.useMemo(() => {
    if (!draft) return [];
    return matchStartDraftTopics(
      {
        text: query || draft.text,
        preview: draft.preview,
      },
      props.topics,
    );
  }, [draft, props.topics, query]);

  if (!draft) return null;

  const noMatchHref = `/create?intent=contribute&entryIntent=issue_signal&entryMode=direct&startDraft=1`;

  return (
    <div className="space-y-4">
      <GlobalDraftStatusBar
        draft={draft}
        surface="themes"
        eyebrow="Aktiver Entwurf"
        title="Aus dem Voxy-Entwurf übernommen."
        body="Wir prüfen, ob dein Entwurf an bestehende Debatten anschließt. Nichts wird automatisch zusammengeführt oder aufgeteilt."
        primaryAction={{
          label: "Anschluss prüfen",
          tone: "secondary",
          href: "#themen-start-draft-suche",
        }}
        secondaryAction={{
          label: "Als eigenes Thema weiterführen",
          tone: "secondary",
          href: noMatchHref,
        }}
        tertiaryAction={{
          label: "Verwerfen",
          tone: "secondary",
          onClick: () => {
            clearStartDraftContext();
            setDraft(null);
          },
        }}
      />
      <StartDraftWorkspaceChooser
        activeKey="themes"
        options={[
          {
            key: "create",
            title: "Beitrag ausarbeiten",
            description: "Den Text weiter ausarbeiten und wieder in den Beitragsmodus wechseln.",
            href: "/create?startDraft=1",
            onClick: () => updateStartDraftContext({ targetHint: "create" }),
          },
          {
            key: "themes",
            title: "Passende Themen finden",
            description: "Beim selben Anliegen im Themenmodus bleiben.",
            href: "#themen-start-draft-suche",
            onClick: () => updateStartDraftContext({ targetHint: "themes" }),
          },
          {
            key: "rounds",
            title: "Runde vorbereiten",
            description: "Aus demselben Anliegen eine Runde vorbereiten.",
            href: "/runden/new?startDraft=1&from=themes",
            onClick: () => updateStartDraftContext({ targetHint: "rounds" }),
          },
          {
            key: "editorial",
            title: "Redaktionelle Prüfung anfragen",
            description: "Denselben Entwurf manuell prüfen lassen.",
            href: "/start?review=editorial",
            onClick: () => updateStartDraftContext({ origin: "start_relevance_review" }),
          },
          {
            key: "later",
            title: "Später weiterarbeiten",
            description: "Als Arbeitsstand behalten und später im Konto fortsetzen.",
            href: "/account",
            onClick: () => updateStartDraftContext({ targetHint: "themes" }),
          },
        ]}
      />

      <section
        id="themen-start-draft-suche"
        className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm sm:p-6"
      >
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Passende Themen suchen</h2>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
              Such- und Zuordnungskontext
            </span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="mt-2 w-full rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2.5 text-sm text-[rgb(var(--fg))] outline-none focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
            />
          </label>
          {draft.preview?.possibleTopics?.length ? (
            <div className="flex flex-wrap gap-2">
              {draft.preview.possibleTopics.map((topic) => (
                <span key={topic} className="landing-soft-pill public-soft-pill">
                  {topic}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        {matches.length > 0 ? (
          <ul className="mt-4 grid gap-3">
            {matches.map((match) => (
              <li key={match.slug} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[rgb(var(--fg))]">{match.title}</p>
                    <p className="text-xs leading-6 text-[rgb(var(--muted))]">{match.framingQuestion}</p>
                  </div>
                  <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-2.5 py-1 text-xs font-semibold text-[rgb(var(--muted))]">
                    Treffer: {match.score}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {match.matchedKeywords.map((keyword) => (
                    <span key={`${match.slug}-${keyword}`} className="landing-soft-pill public-soft-pill">
                      {keyword}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <a href={`/topic/${match.slug}`} className="landing-cta-primary public-cta-primary vog-btn-brand">
                    Themenraum öffnen
                  </a>
                  <a href={`/runden?topic=${encodeURIComponent(match.slug)}`} className="vog-btn-secondary">
                    Anlassraum dazu nutzen
                  </a>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-[rgb(var(--border))] px-4 py-4 text-sm text-[rgb(var(--muted))]">
            <p className="font-semibold text-[rgb(var(--fg))]">Noch keine passende Themenzuordnung gefunden.</p>
            <p className="mt-2">
              Dein Text bleibt als Entwurf erhalten. Du kannst ihn als neues Thema vorschlagen, ohne jetzt schon produktiv etwas anzulegen.
            </p>
            <div className="mt-4">
              <a href={noMatchHref} className="vog-btn-secondary">
                Als eigenes Thema weiterführen
              </a>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
