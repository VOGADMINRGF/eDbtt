import ReportPage from "@features/report/components/ReportPage";
import demoReports from "@features/report/data/demoReports";

export default function DemoDossierPage() {
  return (
    <main className="min-h-screen bg-white">
      <h1 className="sr-only">Demo Dossier</h1>
      <ReportPage initial={demoReports} />
    </main>
  );
}
