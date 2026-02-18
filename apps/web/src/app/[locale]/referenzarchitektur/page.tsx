import Link from "next/link";
import { REFERENZARCHITEKTUR_V2_0 } from "@/content/referenzarchitektur/referenzarchitektur_v2_0";

export default async function ReferenzarchitekturPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;
  const content = REFERENZARCHITEKTUR_V2_0;
  const downloads = Object.values(content.downloads).filter(Boolean) as Array<{
    href: string;
    label: string;
  }>;

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">Referenzarchitektur</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[rgb(var(--fg))]">
          {content.title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[rgb(var(--muted))]">{content.subtitle}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            {content.disclaimer}
          </span>
          <span className="text-xs text-[rgb(var(--muted))]">Version {content.version} · {content.docDate}</span>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {downloads.map((dl) => (
            <a
              key={dl.href}
              href={dl.href}
              className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white"
            >
              {dl.label}
            </a>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-3 md:grid-cols-3">
        {["Grafik-Slot A", "Grafik-Slot B", "Grafik-Slot C"].map((label) => (
          <div key={label} className="rounded-2xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-sm text-[rgb(var(--muted))]">
            {label} – Platzhalter für Diagramm
          </div>
        ))}
      </section>

      <section className="mt-10 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-[rgb(var(--fg))]">Inhalt</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {content.toc.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-xs font-semibold text-[rgb(var(--muted))] hover:border-sky-300"
            >
              {item.label}
            </a>
          ))}
        </div>
      </section>

      <div className="mt-10 space-y-8">
        {content.toc.map((item) => {
          const section = content.sections[item.id as keyof typeof content.sections];
          if (!section) return null;
          return (
            <section key={item.id} id={item.id} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">{section.title}</h3>
              <div className="mt-3 space-y-2 text-sm text-[rgb(var(--muted))]">
                {section.body.map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <section className="mt-10 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Kurz-FAQ</h2>
        <div className="mt-4 space-y-4">
          {content.faqShort.map((item, idx) => (
            <div key={idx} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-3">
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">{item.q}</p>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="downloads" className="mt-10 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Downloads</h2>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Vollfassung als DOCX. Die Landingpage enthält nur Auszüge.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {downloads.map((dl) => (
            <a
              key={dl.href}
              href={dl.href}
              className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))]"
            >
              {dl.label}
            </a>
          ))}
        </div>
      </section>

      <section id="feedback" className="mt-10 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Feedback / Kontakt</h2>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Hinweise, Korrekturen und Ergänzungen sind willkommen. Bitte die Vollfassung
          referenzieren und konkrete Abschnitts-IDs nennen.
        </p>
        <div className="mt-4">
          <Link
            href="/kontakt"
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white"
          >
            Kontakt aufnehmen
          </Link>
        </div>
      </section>
    </main>
  );
}
