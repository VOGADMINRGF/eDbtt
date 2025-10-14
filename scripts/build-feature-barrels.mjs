#!/usr/bin/env node
/**
 * build-feature-barrels.mjs
 * Erzeugt fehlende index.ts-Files in /features und deren Standard-Unterordnern.
 * - Überschreibt bestehende index.ts NICHT (außer mit --refresh)
 * - Für .json: export { default as <name> } from "./file.json"
 * - Für .ts/.tsx: export { default as Name } from "./File"; export * from "./File";
 *
 * Aufruf:
 *   node scripts/build-feature-barrels.mjs --check
 *   node scripts/build-feature-barrels.mjs --write
 *   node scripts/build-feature-barrels.mjs --refresh   (erzwingt Neuaufbau vorhandener index.ts)
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const featuresDir = path.resolve(repoRoot, "features");

// Nur diese Top-Level-Ordner werden vom Barrel features/index.ts typischerweise re-exportiert
// (genau diese existieren bei dir): editor, statement, swipe, user, contribution, report, stream,
// auth, common, dashboard, event, factcheck, map, organization, politics, qr, utils, vote
const TOP_LEVEL = [
  "editor","statement","swipe","user","contribution","report","stream",
  "auth","common","dashboard","event","factcheck","map","organization",
  "politics","qr","utils","vote"
];

// Reihenfolge für Sub-Exports
const SUBDIR_ORDER = ["components","types","utils","hooks","models","data","context","providers","api"];

const CHECK = process.argv.includes("--check");
const WRITE = process.argv.includes("--write") || process.argv.includes("--refresh");
const REFRESH = process.argv.includes("--refresh");

function isIndex(name) { return /^index\.(t|j)sx?$/.test(name); }
function isTSLike(name){ return /\.(tsx?|jsx?)$/.test(name); }
function isJSON(name){ return /\.json$/i.test(name); }
function ignore(name){
  return /(^_|__tests__|\.d\.ts$|\.test\.(ts|tsx)$|\.spec\.(ts|tsx)$|README\.md$|^\.|\.map$)/i.test(name);
}
function stripExt(n){ return n.replace(/\.(tsx?|jsx?|json)$/i, ""); }
function toExportName(base){
  // fileName -> camelCase; für Default-Reexport
  const clean = base.replace(/[^a-zA-Z0-9]+/g, " ");
  return clean.split(" ").filter(Boolean).map((w,i)=>{
    const lw = w.toLowerCase();
    return i===0 ? lw : lw[0].toUpperCase()+lw.slice(1);
  }).join("");
}
function toDefaultAlias(base){
  // Für Komponenten: PascalCase sinnvoller als alias
  const parts = base.replace(/[^a-zA-Z0-9]+/g," ").split(" ").filter(Boolean);
  return parts.map(p=>p[0].toUpperCase()+p.slice(1)).join("");
}

async function readDirSafe(p){ try { return await fs.readdir(p, { withFileTypes:true }); } catch { return []; } }
async function fileExists(p){ try { await fs.access(p); return true; } catch { return false; } }

async function genIndexForSubdir(dirAbs){
  const entries = await readDirSafe(dirAbs);
  const files = entries.filter(e=>e.isFile() && !ignore(e.name) && !isIndex(e.name));
  const lines = [];

  for (const f of files.sort((a,b)=>a.name.localeCompare(b.name))) {
    const base = stripExt(f.name);
    if (isJSON(f.name)) {
      const named = toExportName(base);
      lines.push(`export { default as ${named} } from "./${base}.json";`);
    } else if (isTSLike(f.name)) {
      const alias = toDefaultAlias(base);
      lines.push(`export { default as ${alias} } from "./${base}";`);
      lines.push(`export * from "./${base}";`);
    }
  }
  return lines.join("\n") + (lines.length ? "\n" : "");
}

async function genIndexForTop(dirAbs){
  const entries = await readDirSafe(dirAbs);
  const subdirs = entries.filter(e=>e.isDirectory());
  const files   = entries.filter(e=>e.isFile() && !ignore(e.name) && !isIndex(e.name));

  const lines = [];

  // 1) Erst bekannte Subdir-Order
  for (const s of SUBDIR_ORDER) {
    if (subdirs.some(d=>d.name===s)) lines.push(`export * from "./${s}";`);
  }
  // 2) Sonstige Subdirs (stabil, alphabetisch)
  for (const s of subdirs.map(d=>d.name).sort()) {
    if (!SUBDIR_ORDER.includes(s)) lines.push(`export * from "./${s}";`);
  }
  // 3) Direkte Dateien im Top-Level (z.B. useVoteStream.ts, api.ts, projekt.tsx, SmartContribution.tsx)
  for (const f of files.sort((a,b)=>a.name.localeCompare(b.name))) {
    const base = stripExt(f.name);
    if (isJSON(f.name)) {
      const named = toExportName(base);
      lines.push(`export { default as ${named} } from "./${base}.json";`);
    } else if (isTSLike(f.name)) {
      const alias = toDefaultAlias(base);
      lines.push(`export { default as ${alias} } from "./${base}";`);
      lines.push(`export * from "./${base}";`);
    }
  }
  return lines.join("\n") + (lines.length ? "\n" : "");
}

async function ensureFile(targetAbs, content){
  const exists = await fileExists(targetAbs);
  if (exists) {
    if (!REFRESH) return { status:"skip-exists" };
    const old = await fs.readFile(targetAbs, "utf8").catch(()=> "");
    if (old.trim() === content.trim()) return { status:"skip-same" };
    if (!WRITE) return { status:"would-refresh" };
    await fs.writeFile(targetAbs, content, "utf8");
    return { status:"refreshed" };
  } else {
    if (!WRITE) return { status:"would-create" };
    await fs.mkdir(path.dirname(targetAbs), { recursive:true });
    await fs.writeFile(targetAbs, content, "utf8");
    return { status:"created" };
  }
}

async function run(){
  if (!(await fileExists(featuresDir))) {
    console.error(`❌ Konnte ${featuresDir} nicht finden. Bitte im Repo-Root ausführen.`);
    process.exit(2);
  }

  const summary = [];
  for (const top of TOP_LEVEL) {
    const topAbs = path.join(featuresDir, top);
    if (!(await fileExists(topAbs))) continue; // falls z.B. top nicht (mehr) existiert

    // (A) Subdir-Indexe
    for (const s of SUBDIR_ORDER) {
      const sdAbs = path.join(topAbs, s);
      if (await fileExists(sdAbs)) {
        const subContent = await genIndexForSubdir(sdAbs);
        const subIdxAbs = path.join(sdAbs, "index.ts");
        const r = await ensureFile(subIdxAbs, subContent);
        summary.push({ file: path.relative(repoRoot, subIdxAbs), ...r });
      }
    }
    // (B) Top-Level-Index
    const topContent = await genIndexForTop(topAbs);
    const topIdxAbs = path.join(topAbs, "index.ts");
    const rTop = await ensureFile(topIdxAbs, topContent);
    summary.push({ file: path.relative(repoRoot, topIdxAbs), ...rTop });
  }

  // Ausgabe kompakt
  const groups = summary.reduce((acc, x)=>{
    (acc[x.status] ||= []).push(x.file);
    return acc;
  }, {});
  const order = ["created","refreshed","would-create","would-refresh","skip-same","skip-exists"];
  for (const k of order) {
    if (groups[k]?.length) {
      console.log(`${k.padEnd(14)}  ${groups[k].length}`);
      for (const f of groups[k]) console.log(`  - ${f}`);
    }
  }
  if (!order.some(k=>groups[k]?.length)) console.log("Alles bereits vollständig.");
}

run().catch((e)=>{ console.error(e); process.exit(1); });
