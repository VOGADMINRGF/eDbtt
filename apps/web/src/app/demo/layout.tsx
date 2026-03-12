import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { isDemoUser } from "@/lib/demo/demoAccess";
import { DEMO_STATUS_GLOSSARY } from "@/features/demo/statusLanguage";
import DemoNavClient from "./DemoNavClient";

type Props = {
  children: ReactNode;
};

export default async function DemoLayout({ children }: Props) {
  const user = await getSessionUser();
  if (!isDemoUser(user)) notFound();

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))]">
      <header className="sticky top-0 z-40 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              Demo
            </span>
            <span className="text-xs text-[rgb(var(--muted))]">nur Demo-Daten - Studio/Simulation</span>
            <div className="hidden flex-wrap gap-1 lg:flex">
              {DEMO_STATUS_GLOSSARY.slice(0, 4).map((status) => (
                <span
                  key={status.key}
                  className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-0.5 text-[10px] font-semibold text-[rgb(var(--muted))]"
                >
                  {status.label}
                </span>
              ))}
            </div>
          </div>
          <DemoNavClient />
        </div>
      </header>
      {children}
    </div>
  );
}
