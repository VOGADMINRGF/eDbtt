import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("create attachment layout contract", () => {
  it("keeps selected attachment previews in a capped disclosure instead of a free-floating block", () => {
    const composerSource = readFileSync(
      resolve(process.cwd(), "src/features/create/SharedCreateComposer.tsx"),
      "utf8",
    );

    expect(composerSource).toContain("attachmentsDisclosureLabel");
    expect(composerSource).toContain("overflow-x-auto");
    expect(composerSource).toContain("break-all");
    expect(composerSource).toContain("max-w-[15rem]");
    expect(composerSource).toContain("attachmentsDisclosureLabel");
  });
});
