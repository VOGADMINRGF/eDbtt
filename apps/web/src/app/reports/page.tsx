"use client";

import Link from "next/link";
import { useLocale } from "@/context/LocaleContext";
import { useAutoTranslateText } from "@/lib/i18n/autoTranslate";

export default function ReportsOverviewPage() {
  const { locale } = useLocale();
  const t = useAutoTranslateText({ locale, namespace: "reports-overview" });

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t("Reports", "header.kicker")}
        </p>
        <h1 className="text-3xl font-bold text-slate-900">
          {t("Report Hub", "header.title")}
        </h1>
        <p className="text-sm text-slate-600">
          {t("Oeffentliche Auswertungen aus dem Graph: Themen, Regionen, Verantwortung.", "header.subtitle")}
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href="/reports/topic"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("Topic", "card.topic.kicker")}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">
            {t("Topic Report", "card.topic.title")}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {t("Statements und Responsibilities nach Themen filtern.", "card.topic.body")}
          </p>
        </Link>

        <Link
          href="/reports/region"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("Region", "card.region.kicker")}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-900">
            {t("Region Report", "card.region.title")}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {t("Summen und Verantwortungen nach Regionen ansehen.", "card.region.body")}
          </p>
        </Link>
      </section>
    </main>
  );
}
