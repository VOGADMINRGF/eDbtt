import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

const mockNavigation = vi.hoisted(() => ({
  params: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => mockNavigation.params,
}));

import OrderPage from "@/app/order/page";

function setOrderSearch(query = "") {
  mockNavigation.params = new URLSearchParams(query);
}

describe("order entry wrapper contract", () => {
  it("keeps /order as package-start entry with mutable segment and package", () => {
    setOrderSearch("segment=organisationen&paket=b2b_basis");
    const html = renderToStaticMarkup(createElement(OrderPage));

    expect(html).toContain("Vorauswahl aktiv");
    expect(html).toContain("Segment wählen");
    expect(html).toContain("Paket wählen und Start vorbereiten");
    expect(html).toContain("Einzelpersonen");
    expect(html).toContain("Organisationen");
  });
});
