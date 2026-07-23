import { expect, test } from "@playwright/test";
import {
  annotateCreateInputPersistence,
  assertAuthenticatedSessionCookies,
  assertObservedRuntimeClean,
  assertSafePage,
  installObservedRuntime,
  loginThroughVisibleUi,
  readAuthEnv,
} from "./support";

const CREATE_TEXTAREA = '[data-create-composer-bar="true"] textarea';
const env = readAuthEnv();

test.skip(
  !env.hasCredentials,
  "authenticated-read skipped: set EDEBATTE_E2E_BASE_URL, EDEBATTE_E2E_EMAIL and EDEBATTE_E2E_PASSWORD locally.",
);

test("authenticated-read: login, session retention, create workspace and optional read-only fixtures", async ({
  context,
  page,
}, testInfo) => {
  const runtime = await installObservedRuntime(page, {
    allowedRequests: [{ method: "POST", path: "/api/auth/login" }],
  });

  const login = await loginThroughVisibleUi(page, {
    email: env.email!,
    password: env.password!,
    expectedRedirect: "/account",
  });

  if (login.status === 401) {
    throw new Error("authenticated-read stopped safely: login returned 401.");
  }
  if (login.status === 429) {
    throw new Error("authenticated-read stopped safely: login returned 429 rate_limited.");
  }

  const require2fa = login.payload.require2fa === true;
  test.skip(
    require2fa,
    "authenticated-read skipped safely: login requires 2FA. Use a dedicated test account without 2FA or define a separate approved 2FA contract.",
  );

  await page.waitForURL(/\/account(\?|$)/, { timeout: 15_000 });
  await assertSafePage(page, "/account");
  await assertAuthenticatedSessionCookies(context);
  await expect(page.getByRole("heading", { name: "Mein Profil" })).toBeVisible();

  await page.reload({ waitUntil: "domcontentloaded" });
  await assertSafePage(page, "/account reload");
  await expect(page.getByRole("heading", { name: "Mein Profil" })).toBeVisible();

  await page.goto("/create", { waitUntil: "domcontentloaded" });
  await assertSafePage(page, "/create");
  await expect(page.locator("[data-create-workspace-shell]")).toBeVisible();
  await expect(page.locator(CREATE_TEXTAREA).first()).toBeVisible();

  const unsentText =
    "Dies ist ein lokaler authenticated-read smoke input. Nicht absenden, nicht analysieren, nicht speichern.";
  const textarea = page.locator(CREATE_TEXTAREA).first();
  await textarea.fill(unsentText);
  await page.reload({ waitUntil: "domcontentloaded" });
  await assertSafePage(page, "/create reload");
  await annotateCreateInputPersistence({
    page,
    textareaSelector: CREATE_TEXTAREA,
    expectedValue: unsentText,
    testInfo,
  });

  if (env.dossierId) {
    await page.goto(`/dossier/${encodeURIComponent(env.dossierId)}`, { waitUntil: "domcontentloaded" });
    await assertSafePage(page, "/dossier/[id]");
    await expect(page.getByRole("main")).toBeVisible();
  } else {
    testInfo.annotations.push({
      type: "fixture-skip",
      description: "EDEBATTE_E2E_DOSSIER_ID not set; dossier read-only fixture skipped.",
    });
  }

  if (env.participationSlug) {
    await page.goto(`/beteiligung/${encodeURIComponent(env.participationSlug)}`, {
      waitUntil: "domcontentloaded",
    });
    await assertSafePage(page, "/beteiligung/[slug]");
    await expect(page.getByRole("main")).toBeVisible();
  } else {
    testInfo.annotations.push({
      type: "fixture-skip",
      description: "EDEBATTE_E2E_PARTICIPATION_SLUG not set; participation read-only fixture skipped.",
    });
  }

  await assertObservedRuntimeClean(runtime, testInfo);
});
