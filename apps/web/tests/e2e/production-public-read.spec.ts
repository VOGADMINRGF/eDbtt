import { expect, test } from "@playwright/test";
import {
  assertObservedRuntimeClean,
  assertSafePage,
  expectProtectedRedirectToLogin,
  installObservedRuntime,
} from "./support";

test("public-read: auth entry pages render and protected routes redirect without writes", async ({
  page,
}, testInfo) => {
  const runtime = await installObservedRuntime(page);

  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await assertSafePage(page, "/login");
  await expect(page.getByRole("heading", { name: "Bei eDebatte anmelden" })).toBeVisible();

  await page.goto("/register", { waitUntil: "domcontentloaded" });
  await assertSafePage(page, "/register");
  await expect(page.getByRole("heading", { name: "Registrieren" })).toBeVisible();

  await expectProtectedRedirectToLogin(page, "/account");
  await expectProtectedRedirectToLogin(page, "/create");

  await assertObservedRuntimeClean(runtime, testInfo);
});
