import Link from "next/link";
import {
  buildCreateHref,
  CREATE_INTENT_DEFINITIONS,
  type CreateIntent,
} from "@/features/create/intents";
import { getDemoPersonaConfig, parseDemoPersona, withPersona } from "@/features/demo/personas";
import { getDemoStatusLabel } from "@/features/demo/statusLanguage";

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

function readParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

const RECOMMENDED_BY_PERSONA: Record<"journalist" | "administration" | "citizen", CreateIntent[]> = {
  journalist: ["source", "question", "objection"],
  administration: ["option", "source", "claim"],
  citizen: ["perspective", "source", "question"],
};

export default async function DemoCreatePage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  const resolved = searchParams ? await searchParams : {};
  const persona = parseDemoPersona(readParam(resolved?.persona));
  const personaCfg = getDemoPersonaConfig(persona);
  const recommended = new Set(RECOMMENDED_BY_PERSONA[persona]);
  const demoCards = CREATE_INTENT_DEFINITIONS.filter((item) => item.intent !== "factcheck");

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 space-y-6">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">
          Demo - Create Studio
        </p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">
          Einheitlicher Intake fuer {personaCfg.label}
        </h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Diese Demo zeigt die Zielarchitektur fuer Intents auf einem Einstiegspfad. Statussprache
          bleibt konsistent: {getDemoStatusLabel("community_submitted")} {"->"}{" "}
          {getDemoStatusLabel("in_review")} {"->"} {getDemoStatusLabel("confirmed")}.
        </p>
        <p className="text-xs text-[rgb(var(--muted))]">
          Architekturregel: <span className="font-semibold">/create</span> ist der kanonische
          Entry. <span className="font-semibold">/demo/create</span> ist nur die persona-sensitive
          Demo-Huelle auf derselben Intent-Logik.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {demoCards.map((card) => (
          <article
            key={card.intent}
            className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">{card.title}</h2>
              {recommended.has(card.intent) ? (
                <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                  empfohlen
                </span>
              ) : null}
            </div>
            <p className="text-sm text-[rgb(var(--muted))]">{card.lead}</p>
            <Link
              href={buildCreateHref({
                intent: card.intent,
                next: withPersona("/demo/create", persona),
              })}
              className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
            >
              In /create oeffnen
            </Link>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-2">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">Nutzung in der Demo-Experience</p>
        <p className="text-sm text-[rgb(var(--muted))]">
          Du kannst von hier in Dossier, Votes, Mandat und Factcheck wechseln, ohne Persona-Kontext
          zu verlieren.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            href={withPersona("/demo/dossier", persona)}
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-[rgb(var(--muted))]"
          >
            Dossier
          </Link>
          <Link
            href={withPersona("/demo/votes", persona)}
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-[rgb(var(--muted))]"
          >
            Votes
          </Link>
          <Link
            href={withPersona("/demo/mandat", persona)}
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-[rgb(var(--muted))]"
          >
            Mandat
          </Link>
          <Link
            href={withPersona("/demo/factcheck", persona)}
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-[rgb(var(--muted))]"
          >
            Factcheck
          </Link>
        </div>
      </section>
    </main>
  );
}
