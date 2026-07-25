import { beforeEach, describe, expect, it, vi } from "vitest";
import crypto from "node:crypto";

const mocks = vi.hoisted(() => {
  const resetTokens: Record<string, any>[] = [];
  const verificationTokens: Record<string, any>[] = [];
  const users = new Map<string, Record<string, any>>();

  function hash(raw: string) {
    return crypto.createHash("sha256").update(raw).digest("hex");
  }

  function matches(doc: Record<string, any>, filter: Record<string, any>) {
    return Object.entries(filter).every(([key, value]) => {
      if (key === "$or" && Array.isArray(value)) {
        return value.some((entry) => matches(doc, entry as Record<string, any>));
      }
      if (value && typeof value === "object" && "$gt" in value) {
        return doc[key] > value.$gt;
      }
      if (value && typeof value === "object" && "$exists" in value) {
        return value.$exists ? key in doc : !(key in doc);
      }
      return doc[key] === value;
    });
  }

  return {
    piiCol: vi.fn(async () => ({
      createIndex: vi.fn(async () => "expires_ttl"),
      updateMany: vi.fn(async (filter: Record<string, any>, update: Record<string, any>) => {
        for (const doc of resetTokens) {
          if (matches(doc, filter)) Object.assign(doc, update.$set ?? {});
        }
        return { acknowledged: true };
      }),
      insertOne: vi.fn(async (doc: Record<string, any>) => {
        resetTokens.push({ _id: `reset-${resetTokens.length + 1}`, ...doc });
        return { acknowledged: true };
      }),
      findOne: vi.fn(async (filter: Record<string, any>) =>
        resetTokens.find((doc) => matches(doc, filter)) ?? null,
      ),
      findOneAndUpdate: vi.fn(async (filter: Record<string, any>, update: Record<string, any>) => {
        const hit = resetTokens.find((doc) => matches(doc, filter)) ?? null;
        if (!hit) return null;
        Object.assign(hit, update.$set ?? {});
        return hit;
      }),
      updateOne: vi.fn(async (filter: Record<string, any>, update: Record<string, any>) => {
        const hit = resetTokens.find((doc) => matches(doc, filter));
        if (hit) Object.assign(hit, update.$set ?? {});
        return { acknowledged: true };
      }),
    })),
    getCol: vi.fn(async (name: string) => {
      if (name === "email_verification_tokens") {
        return {
          updateMany: vi.fn(async (filter: Record<string, any>, update: Record<string, any>) => {
            for (const doc of verificationTokens) {
              if (matches(doc, filter)) Object.assign(doc, update.$set ?? {});
            }
            return { acknowledged: true };
          }),
          insertOne: vi.fn(async (doc: Record<string, any>) => {
            verificationTokens.push({ _id: `verify-${verificationTokens.length + 1}`, ...doc });
            return { acknowledged: true };
          }),
          findOne: vi.fn(async (filter: Record<string, any>) =>
            verificationTokens.find((doc) => matches(doc, filter)) ?? null,
          ),
          findOneAndUpdate: vi.fn(async (filter: Record<string, any>, update: Record<string, any>) => {
            const hit = verificationTokens.find((doc) => matches(doc, filter)) ?? null;
            if (!hit) return null;
            Object.assign(hit, update.$set ?? {});
            return hit;
          }),
          updateOne: vi.fn(async (filter: Record<string, any>, update: Record<string, any>) => {
            const hit = verificationTokens.find((doc) => matches(doc, filter));
            if (hit) Object.assign(hit, update.$set ?? {});
            return { acknowledged: true };
          }),
        };
      }

      return {
        findOne: vi.fn(async (query: Record<string, any>) => users.get(String(query?._id)) ?? null),
        updateOne: vi.fn(async (query: Record<string, any>, update: Record<string, any>) => {
          const hit = users.get(String(query?._id));
          if (hit) Object.assign(hit, update.$set ?? {});
          return { acknowledged: true };
        }),
      };
    }),
    users,
    resetTokens,
    verificationTokens,
    reset() {
      resetTokens.length = 0;
      verificationTokens.length = 0;
      users.clear();
      vi.clearAllMocks();
    },
    hash,
  };
});

vi.mock("@core/db/triMongo", async () => {
  const actual = await vi.importActual<any>("@core/db/triMongo");
  return {
    ...actual,
    piiCol: (...args: unknown[]) => mocks.piiCol(...args),
    getCol: (...args: unknown[]) => mocks.getCol(...args),
  };
});

describe("token rotation security", () => {
  beforeEach(() => {
    mocks.reset();
  });

  it("rotates older unused reset tokens so only the latest remains valid", async () => {
    const { createToken, consumeToken } = await import("@/utils/tokens");

    const first = await createToken("user-1", "reset", 60);
    const second = await createToken("user-1", "reset", 60);

    expect(await consumeToken(first, "reset")).toBeNull();
    expect(await consumeToken(second, "reset")).toBe("user-1");
    expect(await consumeToken(second, "reset")).toBeNull();
    expect(mocks.resetTokens).toHaveLength(2);
    expect(mocks.resetTokens[0]?.invalidatedAt).toBeTruthy();
    expect(mocks.resetTokens[1]?.usedAt).toBeTruthy();
  });

  it("rotates older unused verification tokens so only the latest remains valid", async () => {
    const { ObjectId } = await import("@core/db/triMongo");
    const { createEmailVerificationToken, consumeEmailVerificationToken } = await import("@core/auth/emailVerificationService");

    const userId = new ObjectId("507f1f77bcf86cd799439011");
    mocks.users.set(String(userId), {
      _id: userId,
      verification: { level: "none", methods: [] },
      verifiedEmail: false,
      emailVerified: false,
    });

    const first = await createEmailVerificationToken(userId, "member@edebatte.org");
    const second = await createEmailVerificationToken(userId, "member@edebatte.org");

    expect(await consumeEmailVerificationToken(first.rawToken)).toBeNull();
    const consumed = await consumeEmailVerificationToken(second.rawToken);
    expect(consumed).toMatchObject({ email: "member@edebatte.org" });
    expect(await consumeEmailVerificationToken(second.rawToken)).toBeNull();
    expect(mocks.verificationTokens).toHaveLength(2);
    expect(mocks.verificationTokens[0]?.invalidatedAt).toBeTruthy();
    expect(mocks.verificationTokens[1]?.usedAt).toBeTruthy();
  });
});
