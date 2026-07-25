import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { metadata as settingsMetadata } from "@/app/settings/layout";

describe("settings indexing contract", () => {
  it("marks the active /settings surface as noindex without broadening the robots baseline", () => {
    expect(settingsMetadata.robots).toMatchObject({
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    });
  });

  it("keeps the public homepage and root shell snippet-capable", () => {
    const homeSource = readFileSync(resolve(process.cwd(), "src/app/page.tsx"), "utf8");
    const layoutSource = readFileSync(resolve(process.cwd(), "src/app/layout.tsx"), "utf8");
    const settingsSource = readFileSync(resolve(process.cwd(), "src/app/settings/page.tsx"), "utf8");

    expect(homeSource).not.toContain("index: false");
    expect(homeSource).not.toContain("robots:");
    expect(layoutSource).toContain('<main data-site-main="true" className="flex-1">');
    expect(layoutSource).not.toContain("data-nosnippet");
    expect(settingsSource).toContain('data-nosnippet="true"');
  });
});
