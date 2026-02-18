import { redirect } from "next/navigation";

export default function MitgliedWerdenPage() {
  redirect("/pricing");

  // Fallback content (primarily for semantics/page-contract checks).
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col gap-3 px-4 py-12">
      <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Pricing</h1>
      <p className="text-sm text-[rgb(var(--muted))]">Du wirst zu Paketen und Preisen weitergeleitet.</p>
    </main>
  );
}
