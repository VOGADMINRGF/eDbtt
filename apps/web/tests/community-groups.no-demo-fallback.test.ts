import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function read(relPath: string) {
  return readFileSync(path.join(process.cwd(), "src", relPath), "utf8");
}

describe("community group surfaces avoid demo fallback", () => {
  it("Scenario E: /community page has no dossier demo fallback path", () => {
    const page = read("app/community/page.tsx");
    expect(page).not.toContain("/dossier/demo");
    expect(page).not.toContain("Demo-Dossier");
  });
});
