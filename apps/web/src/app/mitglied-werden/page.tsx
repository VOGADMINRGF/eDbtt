import { redirect } from "next/navigation";
import { resolveCanonicalRoutePath } from "@features/routes/routeInventoryContract";

export default function MitgliedWerdenPage() {
  const target = resolveCanonicalRoutePath("/mitglied-werden") ?? "/pricing";
  redirect(target);

  // Fallback content (primarily for semantics/page-contract checks).
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-2xl flex-col gap-3 px-4 py-12">
      <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Pakete &amp; Mitgliedschaft</h1>
      <p className="text-sm text-[rgb(var(--muted))]">
        Dieser Bestandslink führt zum aktuellen Paket- und Mitgliedschaftspfad.
      </p>
    </main>
  );
}
