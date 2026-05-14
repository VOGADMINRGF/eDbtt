import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  mapTwoFactorSetupError,
  normalizeTwoFactorCode,
  TWO_FACTOR_CODE_LENGTH,
} from "@/features/auth/twoFactorSetup";

const componentSource = readFileSync(
  resolve(process.cwd(), "src/components/auth/TwoFactorSetupClient.tsx"),
  "utf8",
);

describe("2FA setup UI contract", () => {
  it("normalizes code input to six digits", () => {
    expect(normalizeTwoFactorCode(" 12 34-56abc78 ")).toBe("123456");
    expect(TWO_FACTOR_CODE_LENGTH).toBe(6);
  });

  it("renders INVALID_CODE as a German UX message", () => {
    expect(mapTwoFactorSetupError("INVALID_CODE")).toBe(
      "Der Code ist ungültig oder abgelaufen. Bitte erneut prüfen.",
    );
  });

  it("keeps the code field directly typable without a mouse click", () => {
    expect(componentSource).toContain("inputRef.current?.focus()");
    expect(componentSource).toContain("autoFocus");
    expect(componentSource).toContain('inputMode="numeric"');
    expect(componentSource).toContain('autoComplete="one-time-code"');
    expect(componentSource).toContain('pattern="[0-9]*"');
    expect(componentSource).toContain("maxLength={6}");
  });

  it("keeps submit disabled until six digits are present", () => {
    expect(componentSource).toContain(
      "const canSubmit = normalizedCode.length === TWO_FACTOR_CODE_LENGTH && !verifying;",
    );
    expect(componentSource).toContain("disabled={!canSubmit}");
  });

  it("offers an email fallback without hiding the setup context", () => {
    expect(componentSource).toContain("Kein Zugriff auf die Authenticator-App?");
    expect(componentSource).toContain("Code per E-Mail senden");
    expect(componentSource).toContain("/api/auth/2fa/email-code/send");
    expect(componentSource).toContain("/api/auth/2fa/email-code/verify");
  });
});
