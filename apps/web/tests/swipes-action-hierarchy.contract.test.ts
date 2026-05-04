import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("swipes action hierarchy contract", () => {
  it("keeps primary vote actions and optional open reasons in mobile flow", () => {
    const source = readFileSync(resolve(process.cwd(), "src/app/swipes/SwipesClient.tsx"), "utf8");
    const detailSource = readFileSync(
      resolve(process.cwd(), "src/features/surfaces/swipes/components/SwipeDetailSheet.tsx"),
      "utf8",
    );

    expect(source).toContain("Später vertiefen");
    expect(source).toContain("Mehr Kontext");
    expect(source).toContain("Offen");
    expect(source).toContain("Mir fehlen Quellen");
    expect(source).toContain("Zuständigkeit unklar");
    expect(source).toContain("Folgen unklar");
    expect(source).toContain("Mir fehlt eine Option");
    expect(source).toContain("Ich möchte später entscheiden");

    expect(source).toContain("Quellenlage");
    expect(source).toContain("Mögliche Folgen");
    expect(detailSource).toContain("Varianten / mögliche Folgen");
    expect(detailSource).toContain("Quellenlage ansehen");
    expect(detailSource).not.toContain("Evidenz ansehen");
  });
});
