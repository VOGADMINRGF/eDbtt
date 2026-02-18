import { redirect } from "next/navigation";

export default function StreamerWerdenRedirectPage() {
  redirect("/howtoworks/streamer");

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-3 px-4 py-12">
      <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Streamer werden</h1>
      <p className="text-sm text-[rgb(var(--muted))]">Du wirst zur Streamer-Seite weitergeleitet.</p>
    </main>
  );
}
