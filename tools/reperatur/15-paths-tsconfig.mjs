#!/usr/bin/env node
import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import ts from "typescript";
import path from "node:path";

const WRITE = process.env.REPERATUR_WRITE === "1";
const report = [];

function readJsonc(p){
  if (!existsSync(p)) return null;
  const res = ts.readConfigFile(p, ts.sys.readFile);
  if (res.error) return null;
  return res.config || null;
}

async function saveJson(p, obj){
  const txt = JSON.stringify(obj, null, 2) + "\n";
  await fs.writeFile(p, txt, "utf-8");
}

const candidates = ["tsconfig.base.json","tsconfig.json"];
let baseFile = candidates.find(f => existsSync(f)) || null;
let base = baseFile ? readJsonc(baseFile) : null;

if (!base){
  console.log("[15-paths-tsconfig] No base tsconfig found (or unreadable).");
  process.exit(0);
}

base.compilerOptions = base.compilerOptions || {};
const paths = base.compilerOptions.paths || {};
let changed = false;

function ensurePath(alias, targets){
  const arr = Array.isArray(targets) ? targets : [targets];
  if (!paths[alias]) {
    paths[alias] = arr;
    report.push(`ADD paths: ${alias} -> ${JSON.stringify(arr)}`);
    changed = true;
  }
}

ensurePath("@db-web", ["packages/db-web/src"]);
ensurePath("@db-core", ["packages/db-core/src"]);
ensurePath("@features/*", ["features/*"]);
ensurePath("@ui/*", ["packages/ui/src/*"]);

if (WRITE && changed){
  base.compilerOptions.paths = paths;
  await saveJson(baseFile, base);
}

const out = `tools/reperatur/reports/15-paths-tsconfig-${Date.now()}-${WRITE?"write":"dry"}.log`;
await fs.mkdir(path.dirname(out), { recursive: true });
await fs.writeFile(out, report.join("\n") || "No changes");
console.log(`[15-paths-tsconfig] ${WRITE? "applied": "dry-run"}; changed: ${changed}`);
