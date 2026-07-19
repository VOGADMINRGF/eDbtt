import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GET } from "@/app/api/topics/route";

describe("/api/topics route", () => {
  const originalWebDatabaseUrl = process.env.WEB_DATABASE_URL;
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    delete process.env.WEB_DATABASE_URL;
    delete process.env.DATABASE_URL;
  });

  afterEach(() => {
    if (originalWebDatabaseUrl === undefined) delete process.env.WEB_DATABASE_URL;
    else process.env.WEB_DATABASE_URL = originalWebDatabaseUrl;
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
});
