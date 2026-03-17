"use client";

import { usePathname } from "next/navigation";
import type { DemoStatusItem } from "@/features/demo/statusLanguage";
import DemoNavClient from "./DemoNavClient";

type DemoHeaderClientProps = {
  statuses: DemoStatusItem[];
};

export default function DemoHeaderClient({ statuses }: DemoHeaderClientProps) {
  const pathname = usePathname();
  const isSwipeFocusRoute = pathname?.startsWith("/demo/swipes");

  return (
    <header
      data-demo-header="true"
      className={`sticky top-0 z-40 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))] backdrop-blur ${
        isSwipeFocusRoute ? "max-md:hidden" : ""
      }`}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2.5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded-full bg-brand-grad px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
            Demo
          </span>
          <span className={`text-[10px] text-[rgb(var(--muted))] ${isSwipeFocusRoute ? "hidden lg:inline" : "hidden sm:inline"}`}>
            nur Demo-Daten - Studio/Simulation
          </span>
          <div className={`hidden flex-wrap gap-1 ${isSwipeFocusRoute ? "2xl:flex" : "xl:flex"}`}>
            {statuses.map((status) => (
              <span key={status.key} className="vog-chip vog-chip--status">
                {status.label}
              </span>
            ))}
          </div>
        </div>
        <DemoNavClient />
      </div>
    </header>
  );
}

