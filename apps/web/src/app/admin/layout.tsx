import { redirect } from "next/navigation";
import Link from "next/link";
import { ReactNode } from "react";
import { maskEmail } from "@core/pii/redact";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { sessionHasPassedTwoFactor, sessionSatisfiesProtectedTwoFactor, userRequiresTwoFactor } from "@/lib/server/auth/twoFactor";
import { userIsAdminDashboard } from "@/lib/server/auth/roles";
import AdminSidebar from "./AdminSidebar";
import AdminSearchButton from "./AdminSearchButton";

type Props = {
  children: ReactNode;
};

export const metadata = {
  title: "Admin · eDebatte",
};

export default async function AdminLayout({ children }: Props) {
  const user = await getSessionUser();
  const sessionValid = user?.sessionValid ?? false;
  const isAdmin = userIsAdminDashboard(user);
  const hasTwoFactorSetup = userRequiresTwoFactor(user);
  const hasProtectedTwoFactor = sessionSatisfiesProtectedTwoFactor(user);
  const hasDirectTwoFactor = sessionHasPassedTwoFactor(user);

  if (!user || !sessionValid) {
    redirect(`/login?next=${encodeURIComponent("/admin")}`);
  }

  if (!isAdmin) {
    redirect("/");
  }

  if (!hasTwoFactorSetup && !hasProtectedTwoFactor) {
    redirect(`/auth/2fa-setup?next=${encodeURIComponent("/admin")}`);
  }

  if (hasTwoFactorSetup && !hasDirectTwoFactor && !hasProtectedTwoFactor) {
    redirect(`/login?next=${encodeURIComponent("/admin")}`);
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <div className="mx-auto flex w-full max-w-[1680px] gap-4 px-4 py-6 lg:px-6">
        <aside className="hidden w-64 shrink-0 flex-col gap-2 rounded-2xl bg-[rgb(var(--card))] p-3 shadow-[0_10px_28px_rgba(15,23,42,0.07)] ring-1 ring-[rgb(var(--border))] md:flex">
          <AdminSidebar userEmail={maskEmail(user.email ?? null)} />
        </aside>

        <main className="min-w-0 flex-1 space-y-5">
          <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[rgb(var(--card))] px-5 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.06)] ring-1 ring-[rgb(var(--border))]">
            <div className="space-y-2">
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-800">
                Betreiber-Modus aktiv
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-600 dark:text-sky-300">Admin Dashboard</p>
              <h1 className="text-xl font-semibold text-[rgb(var(--fg))]">Kontrolle & Insights</h1>
              <p className="text-xs text-[rgb(var(--muted))]">
                Diese Flächen zeigen globale Betreiber- und Systemzustände, nicht nur den Arbeitsstand einer einzelnen Organisation.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <AdminSearchButton />
              <Link
                href="/"
                className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1.5 text-sm font-semibold text-[rgb(var(--fg))] hover:border-sky-300 hover:text-sky-700 dark:hover:text-sky-200"
              >
                Zurück zur App
              </Link>
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
