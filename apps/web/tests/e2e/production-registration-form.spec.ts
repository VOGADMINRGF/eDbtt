import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  assertObservedRuntimeClean,
  assertSafePage,
  installObservedRuntime,
} from "./support";

async function waitForControlledInputReady(page: Page, field: Locator) {
  await expect.poll(async () => {
    await field.fill("HydrationProbe");
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const persistedValue = await field.inputValue();

    await field.fill("");
    await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    const clearedValue = await field.inputValue();

    return persistedValue === "HydrationProbe" && clearedValue === "" ? "ready" : `${persistedValue}|${clearedValue}`;
  }).toBe("ready");
}

test("registration-form: client validation works and /api/auth/register is never posted", async ({
  page,
}, testInfo) => {
  const runtime = await installObservedRuntime(page);
  await page.route("**/api/geo/search**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, suggestions: [] }),
    });
  });
  await page.route("**/api/auth/register**", async (route) => {
    if (route.request().method().toUpperCase() === "POST") {
      throw new Error("Unexpected POST /api/auth/register attempted during read-only registration smoke.");
    }
    await route.continue();
  });

  await page.goto("/register", { waitUntil: "domcontentloaded" });
  await assertSafePage(page, "/register");
  await page.waitForFunction(() => document.readyState === "complete");

  const nextButton = page.getByRole("button", { name: "Weiter" });
  const firstName = page.getByLabel("Vorname");
  const lastName = page.getByLabel("Nachname");
  const accountHolder = page.getByLabel("Kontoinhaber");
  const iban = page.getByLabel("IBAN");
  const email = page.locator("#email");
  const submitButton = page.getByRole("button", { name: "Konto erstellen" });

  await expect(firstName).toBeVisible();
  await expect(lastName).toBeVisible();
  await expect(accountHolder).toHaveCount(0);
  await waitForControlledInputReady(page, firstName);

  const birthDateNative = page.locator("#birthDateNative");
  const useNativeBirthDate = await birthDateNative.isVisible();
  const birthDateInput = useNativeBirthDate ? birthDateNative : page.locator("#birthDate");
  const birthDateValue = useNativeBirthDate ? "1990-01-01" : "01.01.1990";

  const street = page.locator("#street");
  const houseNumber = page.locator("#houseNumber");
  const postalCode = page.locator("#postalCode");
  const city = page.locator("#city");
  const country = page.locator("#country");
  const expectedStepOneValues = {
    firstName: "Test",
    lastName: "Person",
    birthDate: birthDateValue,
    street: "QX",
    houseNumber: "7",
    postalCode: "12345",
    city: "Teststadt",
    country: "Testland",
  };

  await expect.poll(async () => {
    const fields = [
      [firstName, expectedStepOneValues.firstName],
      [lastName, expectedStepOneValues.lastName],
      [birthDateInput, expectedStepOneValues.birthDate],
      [street, expectedStepOneValues.street],
      [houseNumber, expectedStepOneValues.houseNumber],
      [postalCode, expectedStepOneValues.postalCode],
      [city, expectedStepOneValues.city],
      [country, expectedStepOneValues.country],
    ] as const;

    for (const [field, value] of fields) {
      if ((await field.inputValue()) !== value) {
        await field.fill(value);
      }
    }

    return JSON.stringify({
      firstName: await firstName.inputValue(),
      lastName: await lastName.inputValue(),
      birthDate: await birthDateInput.inputValue(),
      street: await street.inputValue(),
      houseNumber: await houseNumber.inputValue(),
      postalCode: await postalCode.inputValue(),
      city: await city.inputValue(),
      country: await country.inputValue(),
    });
  }).toBe(JSON.stringify(expectedStepOneValues));

  await nextButton.click();
  await expect(firstName).toHaveCount(0);
  await expect(accountHolder).toBeVisible();
  await expect(iban).toBeVisible();

  await nextButton.click();
  await expect(accountHolder).toBeVisible();
  await expect(iban).toBeVisible();
  await expect(email).toHaveCount(0);
  await expect(submitButton).toHaveCount(0);
  await expect(page.locator('form p[aria-live="assertive"]')).toBeVisible();

  await assertObservedRuntimeClean(runtime, testInfo);
});
