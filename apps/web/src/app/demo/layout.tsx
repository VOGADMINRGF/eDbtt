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
      <header data-demo-header="true" className="sticky top-0 z-40 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-3 py-2 sm:px-4 sm:py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="rounded-full bg-brand-grad px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
              Demo
            </span>
            <span className="hidden text-[11px] text-[rgb(var(--muted))] sm:inline">nur Demo-Daten - Studio/Simulation</span>
            <div className="hidden flex-wrap gap-1 xl:flex">
              {DEMO_STATUS_GLOSSARY.slice(0, 4).map((status) => (
                <span
                  key={status.key}
                  className="vog-chip vog-chip--status"
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
