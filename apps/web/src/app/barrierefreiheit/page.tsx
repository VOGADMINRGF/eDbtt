"use client";

import { useLocale } from "@/context/LocaleContext";
import { useAutoTranslateText } from "@/lib/i18n/autoTranslate";
import PublicPageShell from "@/components/layout/PublicPageShell";

export default function BarrierefreiheitPage() {
  const { locale } = useLocale();
  const t = useAutoTranslateText({ locale, namespace: "barrierefreiheit" });

  return (
    <PublicPageShell contentClassName="max-w-3xl">
      <h1 className="text-3xl font-bold text-coral text-center">
        {t("Barrierefreiheit", "title")}
      </h1>
      <div className="space-y-4 text-gray-700 text-lg text-center">
        <p>
          {t(
            "Wir möchten, dass eDebatte für alle Menschen gut nutzbar ist – auf dem Handy ebenso wie am Desktop.",
            "lead",
          )}
        </p>
        <p>
          {t("Wenn dir Barrieren auffallen, melde sie uns bitte über", "contact.prefix")}{" "}
          <a className="text-coral underline" href="/kontakt">
            /kontakt
          </a>
          {t(". Wir prüfen jede Rückmeldung.", "contact.suffix")}
        </p>
      </div>
    </PublicPageShell>
  );
}
