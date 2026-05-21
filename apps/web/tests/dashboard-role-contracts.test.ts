import path from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ROLE_EXPERIENCE_MATRIX } from "@/features/auth/roleExperienceContract";

const APP_DIR = path.resolve(process.cwd(), "src/app");

function routePageExists(pathname: string) {
  const normalized = pathname === "/" ? "" : pathname.replace(/^\//, "");
  const candidates = [
    path.join(APP_DIR, normalized, "page.tsx"),
    path.join(APP_DIR, normalized, "page.ts"),
    path.join(APP_DIR, normalized, "page.jsx"),
  ];
  return candidates.some((candidate) => existsSync(candidate));
}

function toPathname(href: string) {
  return href.split("?")[0] || "/";
}

describe("dashboard role contracts", () => {
  it("declares reachable default target routes for all role experiences", () => {
    ROLE_EXPERIENCE_MATRIX.forEach((entry) => {
      expect(routePageExists(toPathname(entry.expectedPostLoginRoute))).toBe(true);
      expect(routePageExists(toPathname(entry.expectedPostRegistrationRoute))).toBe(true);
      expect(entry.firstTask.length).toBeGreaterThan(0);
    });
  });

  it("keeps account and admin dashboards textually differentiated", () => {
    const accountPage = readFileSync(path.join(APP_DIR, "account/page.tsx"), "utf8");
    const adminPage = readFileSync(path.join(APP_DIR, "admin/page.tsx"), "utf8");
    const adminLayout = readFileSync(path.join(APP_DIR, "admin/layout.tsx"), "utf8");

    expect(accountPage).toContain("Mein Profil");
    expect(accountPage).toContain("/login?next=");
    expect(adminPage).toContain("Steuerzentrale");
    expect(adminPage).toContain("Pricing Orders");
    expect(adminPage).toContain("Betreiber-Modus aktiv");
    expect(adminLayout).toContain("Betreiber-Modus aktiv");
  });

  it("keeps admin-only visibility restricted to admin/backoffice role", () => {
    const adminRole = ROLE_EXPERIENCE_MATRIX.find((entry) => entry.id === "admin_backoffice");
    expect(adminRole?.visibility.adminDashboard).toBe("visible");
    expect(adminRole?.visibility.pricingOrderAdmin).toBe("visible");

    ROLE_EXPERIENCE_MATRIX.filter((entry) => entry.id !== "admin_backoffice").forEach((entry) => {
      expect(entry.visibility.adminDashboard).toBe("hidden");
      expect(entry.visibility.pricingOrderAdmin).toBe("hidden");
    });
  });
});
