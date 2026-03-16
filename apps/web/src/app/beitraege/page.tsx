import { redirect } from "next/navigation";

export default function BeitraegePage() {
  redirect("/create?intent=source");

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-12">
      <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Beiträge</h1>
      <p className="text-sm text-[rgb(var(--muted))]">Du wirst zu den neuen Beiträgen weitergeleitet.</p>
    </main>
  );
}
