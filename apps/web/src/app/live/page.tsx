import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { userIsAdminDashboard } from "@/lib/server/auth/roles";

export const metadata = {
  title: "Live · eDebatte",
};

export default async function LivePage() {
  if (process.env.LIVE_CHAT_ENABLED !== "true") {
    notFound();
  }

  const user = await getSessionUser();
  if (!user || !userIsAdminDashboard(user)) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-12">
      <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">Live (Skeleton)</h1>
      <p className="text-sm text-[rgb(var(--muted))]">
        Platzhalter fuer Live-Session Steuerung. Noch keine Realtime-Integration.
      </p>
      <div className="rounded-xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--card))] px-5 py-6 text-sm text-[rgb(var(--muted))]">
        Live-Session UI folgt spaeter. Scope: nur Stubs, keine Provider/Keys.
      </div>
    </main>
  );
}
