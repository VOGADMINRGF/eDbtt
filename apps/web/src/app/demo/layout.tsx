import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { isDemoUser } from "@/lib/demo/demoAccess";
import { DEMO_PILL, DEMO_SUBTLE } from "@/lib/ui/demoUi";

type Props = {
  children: ReactNode;
};

const DEMO_NAV = [
  { href: "/demo", label: "Studio" },
  { href: "/demo/dossier", label: "Dossier" },
  { href: "/demo/votes", label: "Votes" },
  { href: "/demo/mandat", label: "Mandat" },
  { href: "/demo/factcheck", label: "Factcheck" },
];

export default async function DemoLayout({ children }: Props) {
  const user = await getSessionUser();
  if (!isDemoUser(user)) notFound();

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white dark:bg-slate-100 dark:text-slate-900">
              Demo
            </span>
            <span className={`text-xs ${DEMO_SUBTLE}`}>nur Demo-Daten · Screenshot Studio</span>
          </div>
          <nav className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            {DEMO_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${DEMO_PILL} hover:border-slate-300 hover:text-slate-900 dark:hover:border-slate-500 dark:hover:text-slate-100`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
