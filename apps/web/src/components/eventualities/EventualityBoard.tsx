import type { DecisionTree, EventualityNode } from "@features/analyze/schemas";

type Translator = (key: string, fallback: string) => string;

const identityTranslate: Translator = (_key, fallback) => fallback;

type EventualityBoardProps = {
  eventualities: EventualityNode[];
  decisionTrees: DecisionTree[];
  translateText?: Translator;
};

export default function EventualityBoard({
  eventualities,
  decisionTrees,
  translateText = identityTranslate,
}: EventualityBoardProps) {
  if (!eventualities.length && !decisionTrees.length) {
    return (
      <p className="mt-2 text-sm text-slate-500">
        Noch keine Eventualitaeten oder Decision Trees vorhanden.
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-3 text-sm text-slate-700">
      {eventualities.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Eventualitaeten</p>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {eventualities.map((e, idx) => {
              const key = e.id ?? `ev-${idx}`;
              const text = translateText(`eventuality:${key}:text`, e.narrative || e.label || "");
              return <li key={key}>{text}</li>;
            })}
          </ul>
        </div>
      )}
      {decisionTrees.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">Decision Trees</p>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {decisionTrees.map((d, idx) => (
              <li key={d.id ?? `dt-${idx}`}>Decision Tree fuer Statement {d.rootStatementId}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
