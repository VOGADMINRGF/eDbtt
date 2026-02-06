"use client";

import { useLocale } from "@/context/LocaleContext";
import { useAutoTranslateText } from "@/lib/i18n/autoTranslate";
import PublicPageShell from "@/components/layout/PublicPageShell";

export default function KiNutzungPage() {
  const { locale } = useLocale();
  const t = useAutoTranslateText({ locale, namespace: "ki-nutzung" });

  return (
    <PublicPageShell contentClassName="max-w-3xl">
      <header className="space-y-4 text-center">
        <h1 className="text-3xl font-bold text-coral">{t("KI-Nutzung", "title")}</h1>
        <p className="text-lg text-gray-700">
          {t(
            "Wir setzen ausgewählte KI-Dienste ein, um Inhalte verständlich und fair aufzubereiten. Diese Übersicht zeigt, welche Anbieter eingebunden sind und nach welchen Prinzipien wir sie nutzen.",
            "lead",
          )}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-900">{t("Eingesetzte Provider", "providers.title")}</h2>
        <p className="text-gray-700">
          {t(
            "Aktuell nutzen wir unter anderem Modelle von OpenAI, Anthropic, Mistral und – wo verfügbar – Gemini. Die konkrete Liste kann sich ändern, wenn wir bessere oder sicherere Alternativen finden.",
            "providers.body",
          )}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-900">{t("Wofür wir KI einsetzen", "usage.title")}</h2>
        <ul className="list-disc space-y-2 pl-6 text-gray-700">
          <li>{t("Analyse und Strukturierung von Beiträgen, Kontextkarten und Stellungnahmen.", "usage.item1")}</li>
          <li>{t("Übersetzungen und sprachliche Vereinheitlichung.", "usage.item2")}</li>
          <li>{t("Erklär- und Kontextkarten, damit Inhalte schneller verständlich werden.", "usage.item3")}</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-900">{t("Leitplanken", "guidelines.title")}</h2>
        <ul className="list-disc space-y-2 pl-6 text-gray-700">
          <li>{t("Grundsatz: minimale personenbezogene Daten und transparente Dokumentation.", "guidelines.item1")}</li>
          <li>{t("Klare Schutzregeln gegen Missbrauch; sensible Felder werden maskiert oder entfernt.", "guidelines.item2")}</li>
          <li>{t("KI-Ergebnisse werden geprüft – Entscheidungen treffen Menschen, nicht Modelle.", "guidelines.item3")}</li>
        </ul>
        <p className="text-gray-700">
          {t("Weitere Hinweise zu Datenverarbeitung, Cookies und Rechten findest du unter", "guidelines.footer")}
          <a className="text-coral underline" href="/datenschutz"> /datenschutz</a>.
        </p>
      </section>
    </PublicPageShell>
  );
}
