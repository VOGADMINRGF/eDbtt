import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SwipeTopicStep } from "@/features/surfaces/swipes/components/SwipeTopicStep";
import type { SwipeItem } from "@/features/swipes/types";

const ITEM: SwipeItem = {
  id: "st_1",
  title: "Soll die Busspur in der Hauptstraße priorisiert werden?",
  text: "Kurzbeschreibung",
  level: "Kommune",
  category: "Mobilität",
  domainLabel: "Verkehr",
  topicTags: ["Busspur"],
  sourceType: "civic",
  sourceLabel: "Bürgerhinweis",
  responsibilityLabel: "Zuständigkeit: Kommune",
  evidenceCount: 2,
  eventualitiesCount: 3,
  hasEventualities: true,
};

describe("swipe topic quick follow-up contract", () => {
  it("renders lightweight follow-up chips when callback is provided", () => {
    const html = renderToStaticMarkup(
      <SwipeTopicStep item={ITEM} step={1} onVote={vi.fn()} onQuickFollowup={vi.fn()} />,
    );

    expect(html).toContain("🤔 Mehr Kontext");
    expect(html).toContain("⚖️ Varianten");
    expect(html).toContain("🔖 Später vertiefen");
  });
});
