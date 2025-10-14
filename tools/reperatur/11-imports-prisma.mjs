import fg from "fast-glob";
import fs from "node:fs/promises";
import path from "node:path";
import { Project } from "ts-morph";

const WRITE = process.env.REPERATUR_WRITE === "1";
const cfg = JSON.parse(await fs.readFile("tools/reperatur/config.json","utf-8"));
const mapping = cfg.dbClientMapping || {};
const report = [];

import { existsSync } from "node:fs";
const __tscfg = ["tsconfig.base.json","tsconfig.json"].find(f=>existsSync(f));
const project = __tscfg
  ? new Project({ tsConfigFilePath: __tscfg, skipAddingFilesFromTsConfig: true })
  : new Project({ skipAddingFilesFromTsConfig: true });
const files = await fg(["**/*.{ts,tsx}","!**/node_modules/**","!**/dist/**","!**/build/**"]);
files.forEach(f => project.addSourceFileAtPath(f));

function pickClient(filePath){
  const norm = filePath.replace(/\\/g,"/");
  const keys = Object.keys(mapping);
  // longest prefix wins
  let best = null;
  for (const k of keys){
    if (norm.startsWith(k + "/")){
      if (!best || k.length > best.length) best = k;
    }
  }
  return best ? mapping[best] : null;
}

let changedCount = 0;

for (const sf of project.getSourceFiles()){
  const clientPkg = pickClient(sf.getFilePath());
  if (!clientPkg) continue;

  const imports = sf.getImportDeclarations();
  const hasPrismaClient = imports.some(im => im.getModuleSpecifierValue() === "@prisma/client");
  if (!hasPrismaClient) continue;

  // Remove direct prisma imports, add { prisma } from clientPkg
  let changed = false;
  for (const im of imports){
    const mod = im.getModuleSpecifierValue();
    if (mod === "@prisma/client"){
      im.remove();
      changed = true;
      report.push(`REMOVE @prisma/client in ${sf.getFilePath()}`);
    }
  }
  const alreadyHasPrismaImport = sf.getImportDeclarations().some(im => im.getModuleSpecifierValue() === clientPkg);
  if (!alreadyHasPrismaImport){
    sf.addImportDeclaration({ namedImports: ["prisma"], moduleSpecifier: clientPkg });
    changed = true;
    report.push(`ADD { prisma } from ${clientPkg} in ${sf.getFilePath()}`);
  }

  // Replace "new PrismaClient()" usages with "prisma"
  const text = sf.getFullText();
  const next = text.replace(/new\s+PrismaClient\s*\(\s*\)/g, "prisma");
  if (next !== text){
    sf.replaceWithText(next);
    changed = true;
    report.push(`REPLACE new PrismaClient() -> prisma in ${sf.getFilePath()}`);
  }

  if (changed) changedCount++;
}

if (WRITE){
  await project.save();
}

const out = `tools/reperatur/reports/11-imports-prisma-${Date.now()}-${WRITE?"write":"dry"}.log`;
await fs.mkdir(path.dirname(out), { recursive: true });
await fs.writeFile(out, report.join("\n") || "No changes");
console.log(`[11-imports-prisma] ${WRITE? "applied": "dry-run"}; files changed: ${changedCount}`);
