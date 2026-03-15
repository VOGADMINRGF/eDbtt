import Link from "next/link";
import { buildCreateHref, type CreateIntent } from "@/features/create/intents";

type FollowUpAction = {
  label: string;
  intent: CreateIntent;
  nextSuffix?: string;
};

const FOLLOW_UP_ACTIONS: FollowUpAction[] = [
  { label: "Frage hinzufuegen", intent: "question" },
  { label: "Quelle einreichen", intent: "source" },
  { label: "Widerspruch einreichen", intent: "objection" },
  { label: "Perspektive teilen", intent: "perspective" },
  { label: "Option verfeinern", intent: "option" },
  { label: "Naechsten Rundenfokus vorschlagen", intent: "question", nextSuffix: "#roadmap" },
];

type Props = {
  title?: string;
  returnPath: string;
};

export default function PublicFollowUpBlock({
  title = "Public Follow-up",
  returnPath,
}: Props) {
  return (
    <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm space-y-3">
      <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">{title}</h2>
      <p className="text-sm text-[rgb(var(--muted))]">
        Strukturierte Folgeaktionen laufen ueber den kanonischen Create-Einstieg.
      </p>
      <div className="flex flex-wrap gap-2">
        {FOLLOW_UP_ACTIONS.map((action) => (
          <Link
            key={action.label}
            href={buildCreateHref({
              intent: action.intent,
              next: action.nextSuffix ? `${returnPath}${action.nextSuffix}` : returnPath,
            })}
            className="btn-secondary text-xs"
          >
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
