import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { getPricingEntryTrustCopy, PRICING_PATH_CONTRACT } from "@features/pricing";

const mockNavigation = vi.hoisted(() => ({
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockNavigation.params,
}));

vi.mock("server-only", () => ({}));

import OrderPage from "@/app/order/page";
import VormerkenPage from "@/app/vormerken/page";

const DE_TRUST = getPricingEntryTrustCopy("de");
const EN_TRUST = getPricingEntryTrustCopy("en");

function setQuery(query = "") {
  mockNavigation.params = new URLSearchParams(query);
}

describe("order entry trust copy contract", () => {
  it("keeps free core and conscious activation visible on the direct /order path", () => {
    setQuery("segment=organisationen");
    const html = renderToStaticMarkup(<OrderPage />);

    expect(html).toContain(DE_TRUST.freeCorePromise);
    expect(html).toContain(DE_TRUST.orderPrimaryHint);
    expect(html).toContain(DE_TRUST.noHiddenAiCosts);
    expect(html).toContain(DE_TRUST.membershipActivationSeparation);
  });

  it("keeps /vormerken as a legacy fallback surface instead of a primary funnel", () => {
    setQuery("segment=kommunen");
    const html = renderToStaticMarkup(<VormerkenPage />);

    expect(html).toContain(DE_TRUST.legacySurfaceTitle);
    expect(html).toContain(DE_TRUST.legacySurfaceBody);
    expect(html).toContain(`href="${PRICING_PATH_CONTRACT.primaryOrderPath}"`);
  });

  it("keeps the same promise in EN order entry", () => {
    setQuery("lang=en&segment=kommunen");
    const html = renderToStaticMarkup(<OrderPage />);

    expect(html).toContain(EN_TRUST.freeCorePromise);
    expect(html).toContain(EN_TRUST.noHiddenAiCosts);
    expect(html).not.toContain(DE_TRUST.freeCorePromise);
  });
});
