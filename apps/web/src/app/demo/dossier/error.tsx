"use client";

import Link from "next/link";
import { DEMO_CARD, DEMO_MUTED, DEMO_PRIMARY_BUTTON, DEMO_SECONDARY_BUTTON } from "@/lib/ui/demoUi";

export default function DemoDossierError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-12">
      <div className={`${DEMO_CARD} w-full p-6 space-y-3`}>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Dossier konnte nicht geladen werden</h1>
        <p className={`text-sm ${DEMO_MUTED}`}>
          Der Demo-Datensatz ist aktuell nicht verfügbar. Bitte versuche es erneut oder gehe zurück ins Demo Studio.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={DEMO_PRIMARY_BUTTON} onClick={reset}>
            Neu laden
          </button>
          <Link href="/demo" className={DEMO_SECONDARY_BUTTON}>
            Zurück zum Studio
          </Link>
        </div>
      </div>
    </div>
  );
}
