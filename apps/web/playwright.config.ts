import { defineConfig, devices } from "@playwright/test";

function resolveBaseURL() {
  const raw = process.env.EDEBATTE_E2E_BASE_URL?.trim() || "https://www.edebatte.org";
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`Invalid EDEBATTE_E2E_BASE_URL: ${raw}`);
  }

  const isLocalhost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (!isLocalhost && parsed.protocol !== "https:") {
    throw new Error(
      `Unsafe EDEBATTE_E2E_BASE_URL protocol for browser smoke: ${parsed.protocol}. Use HTTPS outside localhost.`,
    );
  }

  return parsed.toString().replace(/\/$/, "");
}

const baseURL = resolveBaseURL();
const baseHost = new URL(baseURL).hostname;
const targetsProduction = baseHost === "www.edebatte.org" || baseHost === "edebatte.org";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: targetsProduction ? 1 : 2,
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [["list"]],
  outputDir: "test-results/playwright",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    browserName: "chromium",
    headless: true,
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    ignoreHTTPSErrors: false,
    video: "off",
  },
  projects: [
    {
      name: "production-public-read",
      testMatch: /production-public-read\.spec\.ts/,
      use: {
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
      },
    },
    {
      name: "production-authenticated-read",
      testMatch: /production-authenticated-read\.spec\.ts/,
      use: {
        trace: "off",
        screenshot: "off",
      },
    },
    {
      name: "production-registration-form",
      testMatch: /production-registration-form\.spec\.ts/,
      use: {
        trace: "retain-on-failure",
        screenshot: "only-on-failure",
      },
    },
    {
      name: "production-mutation-contract",
      testMatch: /production-mutation\.contract\.spec\.ts/,
      use: {
        trace: "off",
        screenshot: "off",
      },
    },
  ],
});
