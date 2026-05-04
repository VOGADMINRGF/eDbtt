import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("header mobile navigation contract", () => {
  it("keeps public funnel links and pricing visibility in burger menu", () => {
    const source = readFileSync(resolve(process.cwd(), "src/app/(components)/SiteHeader.tsx"), "utf8");

    expect(source).toContain('label: "Start"');
    expect(source).toContain('label: "Themen"');
    expect(source).toContain('label: "Swipes"');
    expect(source).toContain('label: "Anliegen / Hinweis einbringen"');
    expect(source).toContain('label: "So funktioniert’s"');
    expect(source).toContain('label: "Pakete & Preise"');
    expect(source).toContain('label: "Professionell nutzen"');
    expect(source).toContain('label: user ? "Profil" : "Profil / Login"');

    const mobileRegisterCtas = source.match(/cta\.register\.mobile/g) ?? [];
    expect(mobileRegisterCtas.length).toBe(1);
  });
});
