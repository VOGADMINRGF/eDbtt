import Link from "next/link";

export type ComparisonRow = {
  dimension: string;
  platform: string;
  edebatte: string;
};

type Props = {
  platformName: string;
  eyebrow: string;
  headline: string;
  intro: string;
  fairNote: string;
  rows: ComparisonRow[];
  coreQuestion: string;
  coreExplanation: string;
  closingHeadline: string;
  closingBody: string;
};

export default function ComparisonPage({
  platformName,
  eyebrow,
  headline,
  intro,
  fairNote,
  rows,
  coreQuestion,
  coreExplanation,
  closingHeadline,
  closingBody,
}: Props) {
  return (
    <main id="main-content" className="min-h-[100svh] bg-[color:var(--background)] text-[color:var(--foreground)]">
      <section className="border-b border-[color:var(--border)]">
        <div className="mx-auto max-w-[76rem] px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">{eyebrow}</p>
          <h1 className="mt-4 max-w-6xl text-balance text-4xl font-black tracking-[-0.04em] sm:text-6xl lg:text-7xl">{headline}</h1>
          <p className="mt-6 max-w-4xl text-lg leading-8 text-[color:var(--muted)] sm:text-xl">{intro}</p>
          <div className="mt-6 max-w-4xl rounded-[1.25rem] border border-[color:var(--border)] bg-[color:var(--surface)]/35 p-5 text-sm leading-6 text-[color:var(--muted)]">
            <strong className="text-[color:var(--foreground)]">Fairer Vergleich:</strong> {fairNote}
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/warum-edebatte" className="inline-flex min-h-12 items-center justify-center rounded-full bg-cyan-500 px-6 py-3 font-black text-slate-950">
              Warum eDebatte? →
            </Link>
            <Link href="/vergleich" className="inline-flex min-h-12 items-center justify-center rounded-full border border-[color:var(--border)] px-6 py-3 font-black">
              Internationale Landschaft
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[76rem] px-5 py-14 sm:px-8 sm:py-16 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">Der entscheidende Prüfpunkt</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] sm:text-5xl">{coreQuestion}</h2>
          </div>
          <p className="text-base leading-7 text-[color:var(--muted)]">{coreExplanation}</p>
        </div>
      </section>

      <section className="bg-slate-950 py-14 text-white sm:py-16">
        <div className="mx-auto max-w-[76rem] px-5 sm:px-8 lg:px-10">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Vergleich im Kern</p>
          <div className="mt-7 overflow-x-auto rounded-[1.5rem] border border-slate-700">
            <table className="w-full min-w-[820px] border-collapse text-left text-sm">
              <thead className="bg-slate-900">
                <tr>
                  <th className="p-4 font-black">Dimension</th>
                  <th className="p-4 font-black">{platformName}</th>
                  <th className="p-4 font-black text-cyan-300">eDebatte-Zielbild</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.dimension} className="border-t border-slate-800 align-top">
                    <th className="p-4 font-black text-white">{row.dimension}</th>
                    <td className="p-4 leading-6 text-slate-300">{row.platform}</td>
                    <td className="p-4 leading-6 text-slate-300">{row.edebatte}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-t border-[color:var(--border)] px-5 py-14 text-center sm:py-16">
        <h2 className="mx-auto max-w-5xl text-3xl font-black tracking-[-0.03em] sm:text-5xl">{closingHeadline}</h2>
        <p className="mx-auto mt-5 max-w-4xl text-base leading-7 text-[color:var(--muted)]">{closingBody}</p>
        <div className="mt-7">
          <Link href="/create" className="inline-flex min-h-12 items-center justify-center rounded-full bg-cyan-500 px-6 py-3 font-black text-slate-950">
            Anliegen einbringen →
          </Link>
        </div>
      </section>
    </main>
  );
}