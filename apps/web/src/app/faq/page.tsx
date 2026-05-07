"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import { mapTranslatableStrings, useAutoTranslateText } from "@/lib/i18n/autoTranslate";
import { FAQ_CATEGORIES, FAQ_HOW_IT_WORKS_STEPS } from "@/app/faq/faqContent";

export default function FaqPage() {
  const { locale } = useLocale();
  const t = useAutoTranslateText({ locale, namespace: "faq" });
  const steps = useMemo(() => {
    if (locale === "de" || locale === "en") return FAQ_HOW_IT_WORKS_STEPS;
    return mapTranslatableStrings(FAQ_HOW_IT_WORKS_STEPS, t, { namespace: "faq.steps" });
  }, [locale, t]);
  const categories = useMemo(() => {
    if (locale === "de" || locale === "en") return FAQ_CATEGORIES;
    return mapTranslatableStrings(FAQ_CATEGORIES, t, { namespace: "faq.categories" });
  }, [locale, t]);

  const [activeCategoryId, setActiveCategoryId] = useState<string>("grundlagen");
  const activeCategory =
    categories.find((cat) => cat.id === activeCategoryId) ?? categories[0];

  const [openQuestionId, setOpenQuestionId] = useState<string>(
    activeCategory.faqs[0]?.id,
  );

  function handleCategoryChange(id: string) {
    setActiveCategoryId(id);
    const cat = categories.find((c) => c.id === id);
    if (cat && cat.faqs.length > 0) {
      setOpenQuestionId(cat.faqs[0].id);
    }
  }

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] pb-16">
      <section className="mx-auto max-w-5xl px-4 pt-14">
        <div className="rounded-3xl bg-[rgb(var(--card))] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-[rgb(var(--border))] md:p-10">
          {/* Hero */}
          <header className="space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
              {t("FAQ & How it works", "hero.overline")}
            </p>
            <h1 className="text-3xl font-extrabold leading-tight text-[rgb(var(--fg))] md:text-4xl">
              {t("eDebatte – kurz erklärt", "hero.title")}
            </h1>
            <p className="text-sm leading-relaxed text-[rgb(var(--muted))] md:text-base">
              {t(
                "Hier erfährst du, was eDebatte als Bewegung ist, wie eDebatte als Werkzeug funktioniert, wer mitmachen kann und wie wir mit Daten und Finanzierung umgehen.",
                "hero.lead",
              )}
            </p>
          </header>

          {/* How it works – 3 Schritte */}
          <section className="mt-8 space-y-4">
            <div className="rounded-2xl bg-sky-50/70 p-4 text-sm text-[rgb(var(--fg))] md:p-6">
              <h2 className="text-base font-semibold text-[rgb(var(--fg))] md:text-lg">
                {t("In drei Schritten von der Idee zur Entscheidung", "steps.title")}
              </h2>
              <p className="mt-1 text-xs text-[rgb(var(--muted))] md:text-sm">
                {t(
                  "Die Idee hinter eDebatte und eDebatte: Themen werden strukturiert vorbereitet, inhaltlich geprüft und anschließend fair, nachvollziehbar und datenschutzfreundlich entschieden.",
                  "steps.lead",
                )}
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {steps.map((step) => (
                  <div
                    key={step.title}
                    className="flex flex-col rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm"
                  >
                    <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-sky-600">
                      <span className="inline-flex h-5 items-center rounded-full bg-sky-50 px-2">
                        {step.badge}
                      </span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">
                      {step.title}
                    </h3>
                    <p className="text-xs font-medium text-[rgb(var(--muted))]">
                      {step.subtitle}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-[rgb(var(--muted))] md:text-sm">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini-Evidenz-Graph-Erklärung im Stil von /vote */}
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-sm text-[rgb(var(--fg))] shadow-[0_16px_40px_rgba(15,23,42,0.06)] md:p-6">
              <h2 className="text-base font-semibold text-[rgb(var(--fg))] md:text-lg">
                {t("Evidenz-Graph – so liest du ihn", "graph.title")}
              </h2>
              <p className="mt-1 text-xs text-[rgb(var(--muted))] md:text-sm">
                {t(
                  "Aussagen werden mit Belegen gestützt, Gegenbelege zeigen Grenzen. Daraus entsteht eine begründete Entscheidung – nicht nur eine Zahl am Ende der Abstimmung.",
                  "graph.lead",
                )}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full bg-sky-50 px-3 py-1 font-semibold text-sky-700">
                  {t("Aussage", "graph.legend.statement")}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                  {t("Beleg / Gegenbeleg", "graph.legend.evidence")}
                </span>
                <span className="rounded-full bg-violet-50 px-3 py-1 font-semibold text-violet-700">
                  {t("Entscheidung", "graph.legend.decision")}
                </span>
              </div>
              <p className="mt-3 text-xs leading-relaxed text-[rgb(var(--muted))] md:text-sm">
                {t(
                  "Jede Aussage verweist auf Quellen. Belege sammeln heißt: Studien, Daten, Erfahrungsberichte – alles mit nachvollziehbarer Herkunft. Gegenpositionen markieren Widersprüche, offene Fragen oder Unsicherheiten. Die Entscheidung am Ende verweist sichtbar auf diese Grundlage – und kann später erneut überprüft werden.",
                  "graph.body",
                )}
              </p>
            </div>
          </section>

          {/* FAQ-Bereich */}
          <section className="mt-10">
            <div className="flex flex-wrap justify-center gap-3">
              {categories.map((cat) => {
                const isActive = cat.id === activeCategoryId;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    className={[
                      "rounded-full border px-4 py-2 text-xs font-semibold transition",
                      isActive
                        ? "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))] shadow-sm"
                        : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--muted))] hover:border-[rgb(var(--border))] hover:text-[rgb(var(--fg))]",
                    ].join(" ")}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 mx-auto max-w-3xl rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] md:p-6">
              <ul className="space-y-3">
                {activeCategory.faqs.map((item) => {
                  const isOpen = item.id === openQuestionId;
                  return (
                    <li
                      key={item.id}
                      className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-sm text-[rgb(var(--fg))] md:p-4"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenQuestionId(isOpen ? "" : item.id)}
                        className="flex w-full items-center justify-between gap-3 text-left"
                      >
                        <span className="font-semibold text-[rgb(var(--fg))]">
                          {item.question}
                        </span>
                        <span
                          className={[
                            "inline-flex h-6 w-6 items-center justify-center rounded-full border text-xs font-bold transition",
                            isOpen
                              ? "rotate-90 border-sky-500 text-sky-600"
                              : "border-[rgb(var(--border))] text-[rgb(var(--muted))]",
                          ].join(" ")}
                          aria-hidden="true"
                        >
                          &gt;
                        </span>
                      </button>

                      {isOpen && (
                        <div className="mt-2 border-t border-[rgb(var(--border))] pt-2 text-xs leading-relaxed text-[rgb(var(--fg))] md:text-sm">
                          {item.answer.split("\n").map((line, idx) => (
                            <p key={idx} className={idx > 0 ? "mt-1" : ""}>
                              {line}
                            </p>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          {/* Footer-CTA */}
          <section className="mt-10 flex flex-col gap-3 text-center text-xs text-[rgb(var(--muted))] md:text-sm">
            <p>
              {t("Noch eine Frage offen? Melde dich jederzeit über das", "footer.lead")}{" "}
              <Link
                href="/kontakt"
                className="font-semibold text-sky-700 underline underline-offset-4"
              >
                {t("Kontaktformular", "footer.contact")}
              </Link>{" "}
              {t("oder trag dich in den Newsletter dort ein.", "footer.tail")}
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
