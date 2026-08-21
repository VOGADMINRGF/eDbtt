import { afterEach, describe, expect, it } from "vitest";
import { isWebDatabaseConfigured, resolveWebDatabaseUrl } from "@db/web/client";

describe("db-web datasource contract", () => {
  const originalWebDatabaseUrl = process.env.WEB_DATABASE_URL;

  afterEach(() => {
    if (originalWebDatabaseUrl === undefined) delete process.env.WEB_DATABASE_URL;
    else process.env.WEB_DATABASE_URL = originalWebDatabaseUrl;
  });

  it("rejects a PostgreSQL URL for the MongoDB Prisma datasource", () => {
    process.env.WEB_DATABASE_URL = "postgresql://dev:dev@localhost:5432/vog";

    expect(resolveWebDatabaseUrl()).toBeNull();
    expect(isWebDatabaseConfigured()).toBe(false);
  });

  it("accepts mongodb and mongodb+srv datasource URLs", () => {
    process.env.WEB_DATABASE_URL = "mongodb://localhost:27017/vog";
    expect(resolveWebDatabaseUrl()).toBe("mongodb://localhost:27017/vog");
    expect(isWebDatabaseConfigured()).toBe(true);

    process.env.WEB_DATABASE_URL = "mongodb+srv://example.invalid/vog";
    expect(resolveWebDatabaseUrl()).toBe("mongodb+srv://example.invalid/vog");
    expect(isWebDatabaseConfigured()).toBe(true);
  });
});
