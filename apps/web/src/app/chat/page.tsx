import { notFound, redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { userIsAdminDashboard } from "@/lib/server/auth/roles";

export const metadata = {
  title: "Chat · eDebatte",
};

export default async function ChatPage() {
  if (process.env.LIVE_CHAT_ENABLED !== "true") {
    notFound();
  }

  const user = await getSessionUser();
  if (!user || !userIsAdminDashboard(user)) {
    redirect("/");
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-6 py-12">
      <h1 className="text-3xl font-semibold text-slate-900">Chat (Skeleton)</h1>
      <p className="text-sm text-slate-600">
        Platzhalter fuer Chat-Funktion. Keine Realtime-Anbindung.
      </p>
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-6 text-sm text-slate-700">
        Chat UI folgt spaeter. Scope: nur Stubs, keine Provider/Keys.
      </div>
    </main>
  );
}
