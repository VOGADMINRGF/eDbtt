export function RegionalAgentRunsEmptyState({ title, body }: { title: string; body: string }) {
  return (
    <section
      className="rounded-3xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--card))] p-8 text-center"
      data-testid="regional-agent-runs-empty-state"
    >
      <h2 className="text-xl font-semibold text-[rgb(var(--fg))]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">{body}</p>
    </section>
  );
}
