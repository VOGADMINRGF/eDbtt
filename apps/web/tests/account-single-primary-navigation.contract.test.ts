import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("account single primary navigation contract", () => {
  it("keeps one dominant profile navigation and removes duplicate top tab shortcuts", () => {
    const file = resolve(process.cwd(), "src/app/account/AccountClient.tsx");
    const content = readFileSync(file, "utf8");

    expect(content.match(/aria-label=\"Profil-Navigation\"/g)?.length ?? 0).toBe(1);

    const marker = "Start mit Interessen, dann Inbox. Profilpflege findest du im dritten Tab.";
    const afterMarker = content.split(marker)[1] ?? "";
    const localExcerpt = afterMarker.slice(0, 700);

    expect(localExcerpt.includes('setActiveTab("interests")')).toBe(false);
    expect(localExcerpt.includes('setActiveTab("inbox")')).toBe(false);
  });
});
