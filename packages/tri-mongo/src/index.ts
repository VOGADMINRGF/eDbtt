// packages/tri-mongo/src/index.ts
import mongoose, { Connection } from "mongoose";
import type { Collection, Document } from "mongodb";
import type { ConnectOptions } from "mongoose";

// --- strikter ENV-Fetcher ---------------------------------------------------
const MUST = (k: string): string => {
  const v = process.env[k];
  if (!v || v.trim() === "") throw new Error(`@vog/tri-mongo: missing env ${k}`);
  return v;
};

export type DbKind = "core" | "votes" | "pii" | "ai_reader";

type NamesUris = { uri: string; name: string };

const ENV: Record<DbKind, NamesUris> = {
  core:      { uri: MUST("CORE_MONGODB_URI"),           name: MUST("CORE_DB_NAME") },
  votes:     { uri: MUST("VOTES_MONGODB_URI"),          name: MUST("VOTES_DB_NAME") },
  pii:       { uri: MUST("PII_MONGODB_URI"),            name: MUST("PII_DB_NAME") },
  ai_reader: { uri: MUST("AI_CORE_READER_MONGODB_URI"), name: MUST("AI_CORE_READER_DB_NAME") },
};

const conns: Partial<Record<DbKind, Connection>> = {};
const inflight: Partial<Record<DbKind, Promise<Connection>>> = {};

// nur nach kind getrennt verbinden
async function ensure(kind: DbKind): Promise<Connection> {
  if (conns[kind]) return conns[kind]!;
  if (inflight[kind]) return inflight[kind]!;

  const { uri, name } = ENV[kind];

  const opts: ConnectOptions = {
    dbName: name,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 7000,
    appName: `tri-${kind}`,
  };

  inflight[kind] = mongoose
    .createConnection(uri, opts)
    .asPromise()
    .then((c) => {
      conns[kind] = c;
      delete inflight[kind];
      return c;
    });

  return inflight[kind]!;
}

// bewusst ohne Rückgabetyp (kein mongodb.Db-Leak in d.ts)
async function nativeDb(kind: DbKind) {
  const conn = await ensure(kind);
  return conn.getClient().db(ENV[kind].name);
}

/** Factory erzeugt je DB ein Namespace-Objekt (keine Db-Typen in Exporten) */
function mkNamespace(kind: DbKind) {
  return {
    getConn(): Promise<Connection> {
      return ensure(kind);
    },

    async getCol<TSchema extends Document = Document>(name: string): Promise<Collection<TSchema>> {
      // lokaler Cast – Generics bleiben sauber in der öffentlichen API
      const db = (await nativeDb(kind)) as unknown as import("mongodb").Db;
      return db.collection<TSchema>(name);
    },
  };
}

/** Öffentliche Namespaces */
export const core      = mkNamespace("core");
export const votes     = mkNamespace("votes");
export const pii       = mkNamespace("pii");
export const ai_reader = mkNamespace("ai_reader");

/** Convenience-Getter für Verbindungen */
export const getCoreConn         = () => core.getConn();
export const getVotesConn        = () => votes.getConn();
export const getPiiConn          = () => pii.getConn();
export const getAiCoreReaderConn = () => ai_reader.getConn();

/** Überladener Helper: getCol("users") oder getCol("pii", "userProfiles") */
export async function getCol<TSchema extends Document = Document>(
  name: string,
): Promise<Collection<TSchema>>;
export async function getCol<TSchema extends Document = Document>(
  kind: DbKind,
  name: string,
): Promise<Collection<TSchema>>;
export async function getCol<TSchema extends Document = Document>(
  a: string,
  b?: string,
): Promise<Collection<TSchema>> {
  const NS: Record<DbKind, ReturnType<typeof mkNamespace>> = {
    core, votes, pii, ai_reader,
  };
  if (b) {
    const kind = a as DbKind;
    return NS[kind].getCol<TSchema>(b);
  }
  return core.getCol<TSchema>(a);
}

/** Aggregator – optional als Default nutzbar */
const tri = {
  getCoreConn,
  getVotesConn,
  getPiiConn,
  getAiCoreReaderConn,
  core,
  votes,
  pii,
  ai_reader,
  getCol,
};

export default tri;
