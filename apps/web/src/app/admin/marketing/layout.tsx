import type { ReactNode } from "react";
import { getMarketingContentOperations } from "@/features/marketing/contentOperations/data";
import { MarketingWorkspaceNav } from "@/features/marketing/workspace/MarketingWorkspaceNav";

export default function MarketingWorkspaceLayout({ children }: { children: ReactNode }) {
  const reviewCount = getMarketingContentOperations().filter((item) => item.status === "review_ready").length;

  return (
    <section data-testid="marketing-workspace-layout">
      <MarketingWorkspaceNav reviewCount={reviewCount} />
      {children}
    </section>
  );
}
