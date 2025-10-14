// apps/web/src/shims/core/db/triMongo.ts
// Dünner Back-Compat-Shim auf @vog/tri-mongo.
// Bietet die bekannten Helfer (getDb/coreDb/coreCol/…)
// und leitet intern auf das neue Paket weiter.

import type { Collection, Document, Db } from "mongodb";
import {
  // Verbindungen
  getCoreConn,
  getVotesConn,
  getPiiConn,
  getAiCoreReaderConn,

  // Namespaces mit getCol()
  core as coreNS,
  votes as votesNS,
  pii as piiNS,
  ai_reader as readerNS,
} from "@vog/tri-mongo";

/* -------------------- DB-Resolver (für *Db / getDb) -------------------- */

function must(k: string): string {
  const v = process.env[k];
  if (!v) throw new Error(`[triMongo shim] missing env ${k}`);
  return v;
}

export async function coreDb(): Promise<Db> {
  const conn = await getCoreConn();
  return conn.getClient().db(must("CORE_DB_NAME"));
}
export async function votesDb(): Promise<Db> {
  const conn = await getVotesConn();
  return conn.getClient().db(must("VOTES_DB_NAME"));
}
export async function piiDb(): Promise<Db> {
  const conn = await getPiiConn();
  return conn.getClient().db(must("PII_DB_NAME"));
}
export async function readerDb(): Promise<Db> {
  const conn = await getAiCoreReaderConn();
  return conn.getClient().db(must("AI_CORE_READER_DB_NAME"));
}

/** Legacy-Kompatibilität: alter Code erwartet `getDb()` → Core-DB */
export async function getDb(): Promise<Db> {
  return coreDb();
}

/* -------------------- Col-Shortcuts (für *Col) -------------------- */

export function coreCol<T extends Document = Document>(name: string) {
  return coreNS.getCol<T>(name);
}
export function votesCol<T extends Document = Document>(name: string) {
  return votesNS.getCol<T>(name);
}
export function piiCol<T extends Document = Document>(name: string) {
  return piiNS.getCol<T>(name);
}
export function readerCol<T extends Document = Document>(name: string) {
  return readerNS.getCol<T>(name);
}

/* -------------------- Re-exports der Connection-Getter -------------------- */

export {
  getCoreConn,
  getVotesConn,
  getPiiConn,
  getAiCoreReaderConn as getReaderConn,
};

/* -------------------- Objekt-Style wie im Altcode -------------------- */

export const core = {
  async getCol<T extends Document = Document>(name: string): Promise<Collection<T>> {
    return coreCol<T>(name);
  },
};
export const votes = {
  async getCol<T extends Document = Document>(name: string): Promise<Collection<T>> {
    return votesCol<T>(name);
  },
};
export const pii = {
  async getCol<T extends Document = Document>(name: string): Promise<Collection<T>> {
    return piiCol<T>(name);
  },
};
export const ai_reader = {
  async getCol<T extends Document = Document>(name: string): Promise<Collection<T>> {
    return readerCol<T>(name);
  },
};

/* -------------------- Universeller getCol-Helper (Überladung) -------------------- */

export async function getCol<T extends Document = Document>(
  name: string,
): Promise<Collection<T>>;
export async function getCol<T extends Document = Document>(
  kind: "core" | "votes" | "pii" | "ai_reader" | "ai_core_reader",
  name: string,
): Promise<Collection<T>>;
export async function getCol<T extends Document = Document>(
  a: string,
  b?: string,
): Promise<Collection<T>> {
  if (b) {
    const k = (a === "ai_core_reader" ? "ai_reader" : a) as
      | "core" | "votes" | "pii" | "ai_reader";
    if (k === "core")  return coreCol<T>(b);
    if (k === "votes") return votesCol<T>(b);
    if (k === "pii")   return piiCol<T>(b);
    return readerCol<T>(b);
  }
  return coreCol<T>(a);
}

/* -------------------- Default-Aggregat -------------------- */

const tri = {
  // Conns
  getCoreConn,
  getVotesConn,
  getPiiConn,
  getReaderConn: getAiCoreReaderConn,

  // DBs & Cols
  coreDb,
  votesDb,
  piiDb,
  readerDb,
  coreCol,
  votesCol,
  piiCol,
  readerCol,

  // Objekt-Style + Helper
  core,
  votes,
  pii,
  ai_reader,
  getCol,

  // Legacy
  getDb,
};

export default tri;
