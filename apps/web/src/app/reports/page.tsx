import { redirect } from "next/navigation";

export default function ReportsOverviewPage() {
  redirect("/archiv");

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-12">
      <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Reports</h1>
      <p className="text-sm text-[rgb(var(--muted))]">Du wirst zum Archiv weitergeleitet.</p>
    </main>
  );
}
