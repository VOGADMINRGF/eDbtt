import { expect, type BrowserContext, type Page, type TestInfo } from "@playwright/test";

const CRITICAL_MARKERS = [
  "CriticalProductionWebRuntimeEnvError",
  "web_database_url_missing",
  "Internal Server Error",
  "Application error: a server-side exception has occurred",
];

const UNEXPECTED_ROUTE_MARKERS = ["/demo/", "/dossier/demo", "/runden/demo"];

type ObservedRuntime = {
  blockedWrites: string[];
  pageErrors: string[];
};

type WriteGuardOptions = {
  allowedRequests?: Array<{
    method: string;
    path: string;
  }>;
};

type AuthEnv = {
  baseURL: string;
  email?: string;
  password?: string;
  dossierId?: string;
  participationSlug?: string;
  hasCredentials: boolean;
};

export function readAuthEnv(): AuthEnv {
  const baseURL = process.env.EDEBATTE_E2E_BASE_URL?.trim() || "https://www.edebatte.org";
  const email = process.env.EDEBATTE_E2E_EMAIL?.trim();
  const password = process.env.EDEBATTE_E2E_PASSWORD?.trim();
  const dossierId = process.env.EDEBATTE_E2E_DOSSIER_ID?.trim();
  const participationSlug = process.env.EDEBATTE_E2E_PARTICIPATION_SLUG?.trim();
  return {
    baseURL,
    email,
    password,
    dossierId,
    participationSlug,
    hasCredentials: Boolean(email && password),
  };
}

export function mutationModeStatus() {
  const enabled = process.env.EDEBATTE_E2E_ALLOW_MUTATION === "1";
  return {
    enabled,
    implemented: false,
    reason: enabled
      ? "Mutation flag explicitly enabled, but the mutating production flow remains intentionally unimplemented in this slice."
      : "Controlled mutation is fail-closed. Set EDEBATTE_E2E_ALLOW_MUTATION=1 only for a future dedicated disposable-account contract.",
  };
}

export async function installObservedRuntime(
  page: Page,
  options: WriteGuardOptions = {},
): Promise<ObservedRuntime> {
  const blockedWrites: string[] = [];
  const pageErrors: string[] = [];
  const base = new URL(readAuthEnv().baseURL);
  const allowed = new Set(
    (options.allowedRequests ?? []).map((entry) => `${entry.method.toUpperCase()} ${entry.path}`),
  );

  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.route("**/*", async (route) => {
    const request = route.request();
    const method = request.method().toUpperCase();
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
      await route.continue();
      return;
    }

    const url = new URL(request.url());
    const sameOrigin = url.origin === base.origin;
    const key = `${method} ${url.pathname}`;
    if (sameOrigin && !allowed.has(key)) {
      blockedWrites.push(key);
      await route.abort("blockedbyclient");
      return;
    }

    await route.continue();
  });

  return { blockedWrites, pageErrors };
}

export async function assertSafePage(page: Page, pathHint: string) {
  await page.waitForLoadState("domcontentloaded");
  const bodyText = await page.locator("body").innerText();

  for (const marker of CRITICAL_MARKERS) {
    expect(bodyText, `${pathHint} leaked critical runtime marker ${marker}`).not.toContain(marker);
  }

  for (const marker of UNEXPECTED_ROUTE_MARKERS) {
    expect(page.url(), `${pathHint} navigated to unexpected demo route`).not.toContain(marker);
  }
  expect(bodyText, `${pathHint} rendered an unexpected error overlay`).not.toContain("Unhandled Runtime Error");
  expect(bodyText, `${pathHint} rendered an unexpected error overlay`).not.toContain("Application error");
}

export async function assertObservedRuntimeClean(
  runtime: ObservedRuntime,
  testInfo: TestInfo,
) {
  if (runtime.pageErrors.length > 0) {
    testInfo.annotations.push({
      type: "runtime-pageerror",
      description: runtime.pageErrors[0],
    });
  }

  if (runtime.blockedWrites.length > 0) {
    testInfo.annotations.push({
      type: "blocked-write",
      description: runtime.blockedWrites.join(", "),
    });
  }

  expect(runtime.pageErrors, "Unexpected pageerror in browser smoke").toEqual([]);
  expect(runtime.blockedWrites, "Unexpected write request in read-only browser smoke").toEqual([]);
}

export async function expectProtectedRedirectToLogin(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await assertSafePage(page, path);
  await expect(page).toHaveURL(/\/login(\?|$)/);
  expect(decodeURIComponent(page.url()), `Protected path ${path} should be carried in next=`).toContain(path);
}

export async function loginThroughVisibleUi(page: Page, params: {
  email: string;
  password: string;
  expectedRedirect?: string;
}) {
  await page.goto(`/login?next=${encodeURIComponent(params.expectedRedirect ?? "/account")}`, {
    waitUntil: "domcontentloaded",
  });
  await assertSafePage(page, "/login");
  await page.getByLabel("E-Mail oder Nickname").fill(params.email);
  await page.locator("#password").fill(params.password);

  const [response] = await Promise.all([
    page.waitForResponse((response) => {
      const url = new URL(response.url());
      return url.pathname === "/api/auth/login" && response.request().method() === "POST";
    }),
    page.getByRole("button", { name: "Einloggen", exact: true }).click(),
  ]);
  const status = response.status();
  const payload = await response.json().catch(() => ({}));

  return {
    status,
    payload: payload as Record<string, unknown>,
  };
}

export async function assertAuthenticatedSessionCookies(context: BrowserContext) {
  const cookies = await context.cookies();
  expect(cookies.some((cookie) => cookie.name === "session_token")).toBe(true);
  expect(cookies.some((cookie) => cookie.name === "u_id")).toBe(true);
}

export async function annotateCreateInputPersistence(params: {
  page: Page;
  textareaSelector: string;
  expectedValue: string;
  testInfo: TestInfo;
}) {
  const locator = params.page.locator(params.textareaSelector).first();
  const restoredValue = await locator.inputValue();
  const restored = restoredValue === params.expectedValue;
  params.testInfo.annotations.push({
    type: "create-unsent-input",
    description: restored ? "retained-after-reload" : "not-retained-after-reload",
  });
}
