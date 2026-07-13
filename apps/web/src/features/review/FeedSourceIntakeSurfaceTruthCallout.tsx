import {
  buildFeedSourceIntakeSurfaceTruth,
  type FeedSourceIntakeSurfaceTruthSurface,
} from "./feedSourceIntakeSurfaceTruth";

export default function FeedSourceIntakeSurfaceTruthCallout(props: {
  surface: FeedSourceIntakeSurfaceTruthSurface;
}) {
  const truth = buildFeedSourceIntakeSurfaceTruth(props.surface);

  return (
    <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
        Kanonischer Review-first Pfad
      </p>
      <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">{truth.title}</p>
      <p className="mt-2 text-sm text-[rgb(var(--muted))]">{truth.body}</p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        {truth.phases.map((phase) => (
          <div
            key={phase.key}
            className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[rgb(var(--muted))]">
              {phase.label}
            </p>
            <p className="mt-1 text-sm text-[rgb(var(--fg))]">{phase.body}</p>
            <p className="mt-2 text-xs text-[rgb(var(--muted))]">{phase.guardrail}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-[rgb(var(--muted))]">{truth.footer}</p>
    </div>
  );
}
