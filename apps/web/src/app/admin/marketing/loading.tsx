export default function MarketingLoading() {
  return (
    <main className="space-y-6 pb-12" aria-busy="true" aria-label="Marketing wird geladen" data-testid="marketing-loading-state">
      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 sm:p-7">
        <div className="h-3 w-36 animate-pulse rounded bg-[rgb(var(--border))]" />
        <div className="mt-4 h-9 w-72 max-w-full animate-pulse rounded bg-[rgb(var(--border))]" />
        <div className="mt-4 h-4 w-full max-w-2xl animate-pulse rounded bg-[rgb(var(--border))]" />
      </section>

      <section className="rounded-3xl border border-sky-200 bg-sky-50/70 p-5 dark:border-sky-400/30 dark:bg-sky-400/10">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">Marketing-Arbeitsbereich wird geladen …</p>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">Navigation und Kontext bleiben sichtbar. Kampagnen und Freigaben werden vorbereitet.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
            <div className="h-4 w-2/3 animate-pulse rounded bg-[rgb(var(--border))]" />
            <div className="mt-4 h-3 w-full animate-pulse rounded bg-[rgb(var(--border))]" />
            <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-[rgb(var(--border))]" />
          </div>
        ))}
      </section>
    </main>
  );
}
