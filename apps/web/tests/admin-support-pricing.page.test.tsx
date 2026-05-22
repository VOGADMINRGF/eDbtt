import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

import AdminSupportPage from "@/app/admin/support/page";
import AdminPricingOrdersPage from "@/app/admin/pricing/orders/page";

describe("admin support and pricing pages", () => {
  it("renders the support admin hub without placeholder CTAs", () => {
    const html = renderToStaticMarkup(<AdminSupportPage />);

    expect(html).toContain("Unterstuetzen verwalten");
    expect(html).toContain("Support-Campaign anlegen");
    expect(html).not.toContain('href="#"');
  });

  it("renders pricing orders with an honest loading state", () => {
    const html = renderToStaticMarkup(<AdminPricingOrdersPage />);

    expect(html).toContain("Bestellungen &amp; Freigaben");
    expect(html).toContain("Lade Bestellungen");
  });
});
