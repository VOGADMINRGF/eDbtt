import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  REGISTER_FEEDBACK_MESSAGE_CLASSNAME,
  readRegisterHoneypotValue,
  validateRegisterStep3,
} from "@/features/auth/registerSecurityContract";
import { derivePuzzle } from "@/lib/security/human-puzzle";

describe("register security contract", () => {
  it("shows the email error before any captcha requirement when the final step is incomplete", () => {
    expect(
      validateRegisterStep3({
        email: "",
        password: "kurz",
        humanToken: null,
      }),
    ).toBe("E-Mail: bitte angeben.");
  });

  it("keeps an empty honeypot neutral", () => {
    expect(
      readRegisterHoneypotValue({
        reg_guardian_reference: "",
        hp_register: "",
      }),
    ).toBe("");
  });

  it("uses a mobile-safe feedback class that keeps errors inside the card", () => {
    expect(REGISTER_FEEDBACK_MESSAGE_CLASSNAME).toContain("break-words");
    expect(REGISTER_FEEDBACK_MESSAGE_CLASSNAME).toContain("whitespace-normal");
    expect(REGISTER_FEEDBACK_MESSAGE_CLASSNAME).toContain("overflow-hidden");
  });

  it("does not render a second register-level security note below the captcha card", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/register/RegisterPageClient.tsx"),
      "utf8",
    );

    expect(source).not.toContain("humanNote &&");
    expect(source).not.toContain("setHumanNote(");
  });

  it("keeps the same captcha task for one stable challenge seed between display and verification", () => {
    const first = derivePuzzle("seed-0034-41");
    const second = derivePuzzle("seed-0034-41");

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      first: 3,
      second: 3,
      expected: 6,
    });
  });
});
