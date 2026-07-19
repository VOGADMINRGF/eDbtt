import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/dbWeb", () => ({
  isWebDatabaseConfigured: () =>
    Boolean(
      process.env.WEB_DATABASE_URL ||
        process.env.WEB_POSTGRES_URL ||
        process.env.WEB_POSTGRES_URI,
    ),
  prisma: {
    topic: {
      findMany: vi.fn(),
    },
  },
}));

import { GET } from "@/app/api/topics/route";

describe("/api/topics route", () => {
  const originalWebDatabaseUrl = process.env.WEB_DATABASE_URL;
  const originalWebPostgresUrl = process.env.WEB_POSTGRES_URL;
  const originalWebPostgresUri = process.env.WEB_POSTGRES_URI;
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    delete process.env.WEB_DATABASE_URL;
    delete process.env.WEB_POSTGRES_URL;
    delete process.env.WEB_POSTGRES_URI;
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    if (originalWebDatabaseUrl === undefined) delete process.env.WEB_DATABASE_URL;
    else process.env.WEB_DATABASE_URL = originalWebDatabaseUrl;
    if (originalWebPostgresUrl === undefined) delete process.env.WEB_POSTGRES_URL;
    else process.env.WEB_POSTGRES_URL = originalWebPostgresUrl;
    if (originalWebPostgresUri === undefined) delete process.env.WEB_POSTGRES_URI;
    else process.env.WEB_POSTGRES_URI = originalWebPostgresUri;
    if (originalDatabaseUrl === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it("returns a controlled degraded payload instead of 500 when the web database is not configured", async () => {
    const response = await GET(new Request("http://localhost/api/topics?locale=de"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      topics: [],
      locale: "de",
      degraded: true,
      errorCode: "TOPICS_DB_UNAVAILABLE",
      asOf: expect.any(String),
    });
  });

  it("does not report the web database ready when only the unrelated DATABASE_URL is present", async () => {
    process.env.DATABASE_URL = "postgresql://core.example.invalid/core";

    const response = await GET(new Request("http://localhost/api/topics?locale=de"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      topics: [],
      degraded: true,
      errorCode: "TOPICS_DB_UNAVAILABLE",
    });
  });
});
