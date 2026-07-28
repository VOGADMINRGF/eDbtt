import { Suspense, type ReactNode } from "react";
import { getMarketingContentOperations } from "@/features/marketing/contentOperations/data";
import { MarketingWorkspaceNav } from "@/features/marketing/workspace/MarketingWorkspaceNav";

export default function MarketingWorkspaceLayout({ children }: { children: ReactNode }) {
  const reviewCount = getMarketingContentOperations().filter((item) => item.status === "review_ready").length;

  return (
    <section data-testid="marketing-workspace-layout">
      <Suspense fallback={<MarketingWorkspaceNavFallback reviewCount={reviewCount} />}>
        <MarketingWorkspaceNav reviewCount={reviewCount} />
      </Suspense>
      {children}
    </section>
  );
}

function MarketingWorkspaceNavFallback({ reviewCount }: { reviewCount: number }) {
  return (
    <nav
      aria-label="Marketing-Arbeitsbereich"
      className="sticky top-0 z-20 -mx-2 mb-6 border-b border-[rgb(var(--border))] bg-[rgb(var(--bg))]/95 px-2 py-3 backdrop-blur"
    >
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["Cockpit", "Kampagnen", `Inhalte & Freigaben · ${reviewCount}`, "Ergebnisse"].map((label) => (
          <span key={label} className="inline-flex shrink-0 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2 text-sm font-semibold text-[rgb(var(--muted))]">
            {label}
          </span>
        ))}
      </div>
    </nav>
  );
}
