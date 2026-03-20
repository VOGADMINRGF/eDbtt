import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function read(relPath: string) {
  return readFileSync(path.join(process.cwd(), "src", relPath), "utf8");
}

describe("community read-only boundary", () => {
  it("Scenario F: resolver/route/page stay read-only without mutation or publish paths", () => {
    const resolver = read("features/community/groupSurface.ts");
    const route = read("app/api/community/groups/route.ts");
    const page = read("app/community/page.tsx");

    for (const source of [resolver, route, page]) {
      expect(source).not.toContain(".insertOne(");
      expect(source).not.toContain(".updateOne(");
      expect(source).not.toContain(".deleteOne(");
      expect(source).not.toContain(".replaceOne(");
      expect(source).not.toContain(".bulkWrite(");
    }

    expect(route).toContain("export async function GET");
    expect(route).not.toContain("export async function POST");
    expect(route).not.toContain("export async function PUT");
    expect(route).not.toContain("export async function PATCH");
    expect(route).not.toContain("export async function DELETE");

    expect(page).not.toContain("/dossier/demo");
    expect(page).not.toContain("Demo-Dossier");
  });
});
