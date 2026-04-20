import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import PricingPage from "@/app/pricing/page";

describe("pricing-no-extra-middle-blocks.contract", () => {
  it("does not render extra middle explainer blocks between hero and package decision", async () => {
    const html = renderToStaticMarkup(await PricingPage({}));

    expect(html).not.toContain("Was du konkret machen kannst");
    expect(html).not.toContain("Institutionelle und redaktionelle Konditionen");

    const packageIndex = html.indexOf("eDebatte Interessiert");
    const membershipIndex = html.indexOf("Mitgliedschaft in der Initiative");

    expect(packageIndex).toBeGreaterThan(-1);
    expect(membershipIndex).toBeGreaterThan(packageIndex);
  });
});
