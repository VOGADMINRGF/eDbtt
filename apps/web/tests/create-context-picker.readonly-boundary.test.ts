import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const root = path.resolve(process.cwd(), "src");

function read(relativePath: string) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

describe("create context picker read-only boundary", () => {
  it("keeps picker route read-only and without mutation handlers", () => {
    const route = read("app/api/create/context/route.ts");
    expect(route).toContain("export async function GET");
    expect(route).not.toContain("export async function POST");
    expect(route).not.toContain("export async function PUT");
    expect(route).not.toContain("export async function PATCH");
    expect(route).not.toContain("export async function DELETE");
  });

  it("keeps picker read model mutation-free", () => {
    const service = read("features/create/contextPicker.ts");
    expect(service).toContain("listRundenEntryItems");
    expect(service).not.toContain("insertOne(");
    expect(service).not.toContain("updateOne(");
    expect(service).not.toContain("findOneAndUpdate(");
    expect(service).not.toContain("deleteOne(");
  });
});
