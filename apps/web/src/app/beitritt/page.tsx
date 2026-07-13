import { redirect } from "next/navigation";
import { resolveCanonicalRoutePath } from "@features/routes/routeInventoryContract";

export default function BeitrittPage() {
  const target = resolveCanonicalRoutePath("/beitritt") ?? "/pricing";
  redirect(target);

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-12">
      <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Pakete &amp; Mitgliedschaft</h1>
      <p className="text-sm text-[rgb(var(--muted))]">
        Dieser Legacy-Pfad bleibt nur als Weiterleitung zum aktuellen Paket- und Mitgliedschaftspfad bestehen.
      </p>
    </main>
  );
}
