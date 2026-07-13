import { describe, expect, it } from "vitest";
import {
  isLegacyRoutePath,
  PRODUCT_SURFACE_ROUTE_IDS,
  resolveCanonicalRoutePath,
  resolveRouteInventoryEntry,
} from "@features/routes/routeInventoryContract";

describe("route inventory legacy path contract", () => {
  it("keeps canonical package and route truth explicit", () => {
    expect(resolveCanonicalRoutePath("/order?segment=organisationen")).toBe("/order");
    expect(resolveCanonicalRoutePath("/vormerken?segment=kommunen")).toBe("/order");
    expect(resolveCanonicalRoutePath("/mitglied-werden")).toBe("/pricing");
    expect(resolveCanonicalRoutePath("/beitritt")).toBe("/pricing");
    expect(resolveCanonicalRoutePath("/anlassraum?view=active")).toBe("/runden");
  });

  it("marks legacy and alias paths without promoting them to canonical funnels", () => {
    expect(isLegacyRoutePath("/vormerken")).toBe(true);
    expect(isLegacyRoutePath("/mitglied-werden")).toBe(true);
    expect(isLegacyRoutePath("/beitritt")).toBe(true);
    expect(isLegacyRoutePath("/order")).toBe(false);
    expect(isLegacyRoutePath("/pricing")).toBe(false);
  });

  it("keeps product surfaces and admin surfaces classified on the same contract", () => {
    expect(PRODUCT_SURFACE_ROUTE_IDS["/order"]).toBe("order");
    expect(PRODUCT_SURFACE_ROUTE_IDS["/vormerken"]).toBe("vormerken");

    expect(resolveRouteInventoryEntry("/admin/review")).toMatchObject({
      id: "admin_review",
      audience: "admin",
      lifecycle: "admin_operator",
    });
    expect(resolveRouteInventoryEntry("/dossier/demo")?.id).toBe("dossier");
    expect(resolveRouteInventoryEntry("/beteiligung/mobilitaet")?.id).toBe("beteiligung");
  });
});
