import { redirect } from "next/navigation";
import Link from "next/link";
import { ReactNode } from "react";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { sessionHasPassedTwoFactor, userRequiresTwoFactor } from "@/lib/server/auth/twoFactor";
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
  const hasTwoFactor = sessionHasPassedTwoFactor(user);

  logGate({
    path: "/admin",
    userId: user?._id ? String(user._id) : null,
    email: maskEmail((user as any)?.email),
    roles: (user as any)?.roles || (user as any)?.role,
    sessionValid,
    isAdmin,
    hasTwoFactorSetup,
    hasTwoFactor,
  });

  if (!user || !sessionValid) {
    redirect(`/login?next=${encodeURIComponent("/admin")}`);
  }

  if (!isAdmin) {
    redirect("/");
  }

  if (!hasTwoFactorSetup) {
    redirect(`/auth/2fa-setup?next=${encodeURIComponent("/admin")}`);
  }

  if (!hasTwoFactor) {
    redirect(`/login?next=${encodeURIComponent("/admin")}`);
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <div className="mx-auto flex w-full max-w-[1680px] gap-4 px-4 py-6 lg:px-6">
        <aside className="hidden w-64 shrink-0 flex-col gap-2 rounded-2xl bg-[rgb(var(--card))] p-3 shadow-[0_10px_28px_rgba(15,23,42,0.05)] ring-1 ring-[rgb(var(--border))] md:flex">
          <AdminSidebar userEmail={maskEmail(user.email ?? null)} />
        </aside>

        <main className="min-w-0 flex-1 space-y-5">
          <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[rgb(var(--card))] px-5 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.04)] ring-1 ring-[rgb(var(--border))]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-600">Admin Dashboard</p>
              <h1 className="text-xl font-semibold text-[rgb(var(--fg))]">Kontrolle & Insights</h1>
            </div>
            <div className="flex items-center gap-2">
              <AdminSearchButton />
              <Link
                href="/"
                className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1.5 text-sm font-semibold text-[rgb(var(--muted))] hover:border-sky-300 hover:text-sky-700"
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

function maskEmail(email?: string | null) {
  if (!email) return null;
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const head = name.slice(0, 2);
  return `${head}${name.length > 2 ? "***" : ""}@${domain}`;
}

function logGate(payload: Record<string, unknown>) {
  try {
    console.log("[admin-layout]", payload);
  } catch {
    // ignore
  }
}
