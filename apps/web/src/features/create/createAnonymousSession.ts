import "server-only";

import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { coreCol } from "@core/db/triMongo";
import { stableHash } from "@core/utils/hash";
import { env } from "@/utils/env";

const COOKIE_NAME = "edb_create_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const COLLECTION = "create_anonymous_sessions";

type AnonymousSessionRecord = {
  id: string;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  lastVerifiedAt: Date;
};

type AnonymousSessionRepository = {
  create(record: AnonymousSessionRecord): Promise<void>;
  verify(input: {
    id: string;
    tokenHash: string;
    now: Date;
  }): Promise<boolean>;
};

let repoSingleton: AnonymousSessionRepository | null = null;
let indexesReady = false;

function b64url(value: Buffer | string) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeB64url(value: string) {
  const padded = `${value.replace(/-/g, "+").replace(/_/g, "/")}${"=".repeat(
    (4 - (value.length % 4)) % 4,
  )}`;
  return Buffer.from(padded, "base64").toString("utf8");
}

function signPayload(payload: string) {
  return b64url(
    crypto.createHmac("sha256", env.JWT_SECRET!).update(payload).digest(),
  );
}

function createToken(id: string, expiresAt: number) {
  const payload = b64url(JSON.stringify({ id, exp: expiresAt }));
  return `${payload}.${signPayload(payload)}`;
}

function readVerifiedToken(token: string): { id: string; exp: number } | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = signPayload(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }
  try {
    const parsed = JSON.parse(decodeB64url(payload)) as {
      id?: unknown;
      exp?: unknown;
    };
    const id = typeof parsed.id === "string" ? parsed.id.trim() : "";
    const exp = typeof parsed.exp === "number" ? parsed.exp : 0;
    if (!/^create-anon-[a-f0-9-]{36}$/i.test(id) || exp <= Date.now()) {
      return null;
    }
    return { id, exp };
  } catch {
    return null;
  }
}

async function ensureIndexes() {
  if (indexesReady) return;
  const sessions = await coreCol(COLLECTION);
  await Promise.all([
    sessions.createIndex({ id: 1 }, { unique: true }),
    sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
  indexesReady = true;
}

function createMongoRepo(): AnonymousSessionRepository {
  return {
    async create(record) {
      await ensureIndexes();
      const sessions = await coreCol<AnonymousSessionRecord>(COLLECTION);
      await sessions.insertOne(record);
    },
    async verify(input) {
      await ensureIndexes();
      const sessions = await coreCol<AnonymousSessionRecord>(COLLECTION);
      const updated = await sessions.updateOne(
        {
          id: input.id,
          tokenHash: input.tokenHash,
          expiresAt: { $gt: input.now },
        },
        { $set: { lastVerifiedAt: input.now } },
      );
      return updated.matchedCount === 1;
    },
  };
}

function getRepo() {
  if (!repoSingleton) repoSingleton = createMongoRepo();
  return repoSingleton;
}

export type VerifiedCreateActor = {
  actorKey: string;
  affectedUserId: string | null;
  anonymousSessionId: string | null;
  responseCookie: {
    name: typeof COOKIE_NAME;
    value: string;
    maxAge: number;
  } | null;
};

export async function resolveVerifiedCreateActor(
  req: NextRequest,
  affectedUserId: string | null,
): Promise<VerifiedCreateActor> {
  if (affectedUserId) {
    return {
      actorKey: `user:${affectedUserId}`,
      affectedUserId,
      anonymousSessionId: null,
      responseCookie: null,
    };
  }

  const cookie = req.cookies.get(COOKIE_NAME)?.value ?? "";
  const verifiedToken = readVerifiedToken(cookie);
  if (
    verifiedToken &&
    (await getRepo().verify({
      id: verifiedToken.id,
      tokenHash: stableHash(cookie),
      now: new Date(),
    }))
  ) {
    return {
      actorKey: `anonymous:${verifiedToken.id}`,
      affectedUserId: null,
      anonymousSessionId: verifiedToken.id,
      responseCookie: null,
    };
  }

  const id = `create-anon-${crypto.randomUUID()}`;
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const token = createToken(id, expiresAt);
  const now = new Date();
  await getRepo().create({
    id,
    tokenHash: stableHash(token),
    createdAt: now,
    expiresAt: new Date(expiresAt),
    lastVerifiedAt: now,
  });
  return {
    actorKey: `anonymous:${id}`,
    affectedUserId: null,
    anonymousSessionId: id,
    responseCookie: {
      name: COOKIE_NAME,
      value: token,
      maxAge: Math.floor(SESSION_TTL_MS / 1000),
    },
  };
}

export function applyVerifiedCreateActorCookie(
  response: Response & {
    cookies?: {
      set: (input: {
        name: string;
        value: string;
        httpOnly: boolean;
        sameSite: "lax";
        path: string;
        secure: boolean;
        maxAge: number;
      }) => void;
    };
  },
  actor: VerifiedCreateActor,
) {
  if (!actor.responseCookie || !response.cookies) return response;
  response.cookies.set({
    ...actor.responseCookie,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

export function setCreateAnonymousSessionRepoForTests(
  repo: AnonymousSessionRepository | null,
) {
  repoSingleton = repo;
  indexesReady = false;
}
