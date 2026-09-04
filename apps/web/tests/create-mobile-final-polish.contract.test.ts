import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("final create mobile-first presentation contract", () => {
  it("keeps the citizen input ahead of process chrome and Voxy decoration", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/app/create-mobile-polish.css"),
      "utf8",
    );

    expect(css).toContain(".create-chat-spine::before");
    expect(css).toContain("[data-create-thread-prompt-chip]");
    expect(css).toContain("[data-create-shell-pipeline]");
    expect(css).toContain("[data-create-workspace-shell] [data-voxy-avatar]");
    expect(css).toContain("width: 3.25rem !important");
    expect(css).toContain('[data-create-composer-bar="true"] textarea');
    expect(css).toContain("min-height: clamp(16rem, 42svh, 28rem) !important");
    expect(css).toContain("resize: vertical !important");
  });

  it("does not describe mandatory login protection as optional", () => {
    const login = readFileSync(
      resolve(process.cwd(), "src/components/auth/LoginPageShell.tsx"),
      "utf8",
    );

    expect(login).toContain("Anmeldung mit 2FA");
    expect(login).not.toContain("optional mit 2FA");
  });
});
