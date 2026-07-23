import { expect, test } from "@playwright/test";
import { mutationModeStatus } from "./support";

test("controlled-mutation contract stays fail-closed by default", async ({}, testInfo) => {
  const status = mutationModeStatus();
  testInfo.annotations.push({
    type: "mutation-mode",
    description: status.reason,
  });

  if (status.enabled) {
    expect(status.implemented).toBe(false);
    return;
  }

  expect(status.enabled).toBe(false);
  expect(status.reason).toContain("EDEBATTE_E2E_ALLOW_MUTATION=1");
});
