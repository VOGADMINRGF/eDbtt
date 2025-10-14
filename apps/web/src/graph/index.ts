// apps/web/src/graph/index.ts
import { GRAPH_PRIMARY } from "./config";
import neo4jRepo from "./neo4jRepo";
import arangoRepo from "./arangoRepo";
import memgraphRepo from "./memgraphRepo";

type Repo = {
  ensureSchema?: (...args: any[]) => Promise<any>;
  ensureGraph?: (...args: any[]) => Promise<any>;
  ensure?: (...args: any[]) => Promise<any>;
  seedGraph?: (...args: any[]) => Promise<any>;
  seed?: (...args: any[]) => Promise<any>;
};

let repo: Repo;
switch (GRAPH_PRIMARY) {
  case "arango":
    repo = arangoRepo;
    break;
  case "memgraph":
    repo = memgraphRepo;
    break;
  case "neo4j":
  default:
    repo = neo4jRepo;
    break;
}

const noop = async () => ({ ok: true, skipped: true });

export async function ensureGraph(...args: any[]) {
  const fn = repo.ensureGraph ?? repo.ensureSchema ?? repo.ensure ?? noop;
  return fn(...args);
}

export async function seedGraph(...args: any[]) {
  const fn = repo.seedGraph ?? repo.seed ?? noop;
  return fn(...args);
}

export * from "./types";
export * from "./config";
export default repo;
