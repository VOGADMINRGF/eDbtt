import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { NAV_SECTIONS } from "@/app/admin/adminNav";

const APP_DIR = resolve(process.cwd(), "src/app");

function pageRouteExists(pathname: string) {
  const normalized = pathname === "/" ? "" : pathname.replace(/^\//, "");
  const candidates = [
    join(APP_DIR, normalized, "page.tsx"),
    join(APP_DIR, normalized, "page.ts"),
    join(APP_DIR, normalized, "page.jsx"),
  ];
  return candidates.some((candidate) => existsSync(candidate));
}

describe("admin nav routes contract", () => {
  it("keeps admin navigation pointed at real page routes", () => {
    NAV_SECTIONS.flatMap((section) => section.items).forEach((item) => {
      expect(pageRouteExists(item.href)).toBe(true);
    });
  });
});
