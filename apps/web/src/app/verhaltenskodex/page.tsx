"use client";

import { useLocale } from "@/context/LocaleContext";
import { useAutoTranslateText } from "@/lib/i18n/autoTranslate";
import PublicPageShell from "@/components/layout/PublicPageShell";

export default function VerhaltenskodexPage() {
  const { locale } = useLocale();
  const t = useAutoTranslateText({ locale, namespace: "verhaltenskodex" });

  return (
    <PublicPageShell contentClassName="max-w-3xl">
      <h1 className="text-3xl font-bold text-coral text-center">
        {t("Verhaltenskodex", "title")}
      </h1>
      <div className="space-y-4 text-gray-700 text-lg">
        <p className="text-center">
          {t(
            "eDebatte lebt von respektvollem Austausch. Unser Anspruch ist ein fairer, sachlicher und sicherer Raum für alle.",
            "lead",
          )}
        </p>
        <ul className="list-disc pl-6 space-y-2 text-base">
          <li>{t("Respektvoller Umgang – Kritik an Inhalten, nicht an Personen.", "rule.respect")}</li>
          <li>{t("Keine Diskriminierung, keine Beleidigungen, keine Hetze.", "rule.nodiscrimination")}</li>
          <li>{t("Quellen sauber angeben und Aussagen nachvollziehbar belegen.", "rule.sources")}</li>
          <li>{t("Moderation schützt faire Regeln und greift bei Verstößen ein.", "rule.moderation")}</li>
        </ul>
        <p className="text-sm text-slate-600 text-center">
          {t("Für Fragen oder Meldungen erreichst du uns über", "contact.prefix")}{" "}
          <a className="text-coral underline" href="/kontakt">
            /kontakt
          </a>
          {t(".", "contact.suffix")}
        </p>
      </div>
    </PublicPageShell>
  );
}
