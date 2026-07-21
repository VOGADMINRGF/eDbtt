import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { resolvePostRegistrationRedirect } from "@/features/auth/roleExperienceContract";

function read(relativePath: string) {
  return readFileSync(resolve(process.cwd(), relativePath), "utf8");
}

describe("member system journey handoff contract", () => {
  it("keeps account quick transitions to themes/swipes/pricing visible", () => {
    const accountPage = read("src/app/account/page.tsx");
    const accountClient = read("src/app/account/AccountClient.tsx");

    expect(accountPage).toContain("<AccountClient");
    expect(accountClient).toContain("Interessen");
    expect(accountClient).toContain("/swipes");
    expect(accountClient).toContain("/pricing");
    expect(accountClient).toContain('id="interessen"');
  });

  it("keeps contact-to-confidential-hint handoff explicit", () => {
    const kontaktForm = read("src/app/kontakt/KontaktForm.tsx");

    expect(kontaktForm).toContain('href="/community/contributions"');
    expect(kontaktForm).toContain("Vertraulicher Hinweis?");
    expect(kontaktForm).toContain(
      "nicht automatisch an eine hostende Organisation weitergegeben",
    );
  });

  it("keeps post-registration redirect deterministic for public/member handoff", () => {
    expect(resolvePostRegistrationRedirect({ roleId: "citizens" })).toBe("/swipes?welcome=1");
    expect(
      resolvePostRegistrationRedirect({
        requestedRedirect: "/themen?focus=verkehr",
        roleId: "citizens",
      }),
    ).toBe("/themen?focus=verkehr");
    expect(
      resolvePostRegistrationRedirect({
        requestedRedirect: "https://example.org/evil",
        roleId: "citizens",
      }),
    ).toBe("/swipes?welcome=1");
  });
});
