import ReportPage from "@features/report/components/ReportPage";
import demoReports from "@features/report/data/demoReports";
import Link from "next/link";
import { DEMO_CARD, DEMO_MUTED, DEMO_SECONDARY_BUTTON } from "@/lib/ui/demoUi";

export default function DemoDossierPage() {
  if (!Array.isArray(demoReports) || demoReports.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center justify-center px-4 py-12">
        <div className={`${DEMO_CARD} w-full p-6 space-y-3`}>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Demo-Dossier fehlt</h1>
          <p className={`text-sm ${DEMO_MUTED}`}>Aktuell sind keine Demo-Reports hinterlegt.</p>
          <Link href="/demo" className={DEMO_SECONDARY_BUTTON}>
            Zurück zum Studio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <h1 className="sr-only">Demo Dossier</h1>
      <ReportPage initial={demoReports} />
    </main>
  );
}
