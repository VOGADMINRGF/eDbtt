import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("header mobile navigation contract", () => {
  it("keeps only the four go-live core actions in burger menu without start duplication", () => {
    const source = readFileSync(resolve(process.cwd(), "src/app/(components)/SiteHeader.tsx"), "utf8");

    expect(source).toContain('label: "Beitragen"');
    expect(source).toContain('label: "Themen"');
    expect(source).toContain('label: "Anlassraum / Event"');
    expect(source).toContain('label: "Organisation"');
    expect(source).toContain('label: user ? "Profil" : "Anmelden"');
    expect(source).not.toContain('label: "Start"');
    expect(source).not.toContain('label: "Swipes"');
    expect(source).not.toContain('label: "Pakete & Preise"');
    expect(source).not.toContain('cta.register.mobile');
  });
});
