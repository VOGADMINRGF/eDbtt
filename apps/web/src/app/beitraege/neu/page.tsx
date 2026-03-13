import { redirect } from "next/navigation";

export default function BeitraegeNeuPage() {
  redirect("/create?intent=source");

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-12">
      <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Neuer Beitrag</h1>
      <p className="text-sm text-[rgb(var(--muted))]">Du wirst zur neuen Beitragsseite weitergeleitet.</p>
    </main>
  );
}
