#!/usr/bin/env node
/**
 * Replace zero-byte files in repo (and optional _incoming) with counterparts from repair zip.
 * Usage: node scripts/helpers/replace_zero_kb.js REPAIR_ZIP [INCOMING_ZIP_OR_DIR] [TARGET_DIR]
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function listFiles(dir) {
  const out = [];
  (function walk(d) {
    for (const f of fs.readdirSync(d)) {
      const abs = path.join(d, f);
      const st = fs.statSync(abs);
      if (st.isDirectory()) walk(abs);
      else out.push(abs);
    }
  })(dir);
  return out;
}

function unzipTo(zip, dest) {
  execSync(`mkdir -p "${dest}" && unzip -qq -o "${zip}" -d "${dest}"`);
}

const repairZip = process.argv[2];
const incoming = process.argv[3] || "";
const target = process.argv[4] || ".";
if (!repairZip) {
  console.error("repair zip required"); process.exit(1);
}

const tmp = ".tmp_repair_lookup";
execSync(`rm -rf "${tmp}"`);
unzipTo(repairZip, tmp);

const pools = [];
if (incoming) {
  const incDir = incoming.endsWith(".zip") ? ".tmp_incoming" : incoming;
  if (incoming.endsWith(".zip")) {
    execSync(`rm -rf "${incDir}"`);
    unzipTo(incoming, incDir);
  }
  pools.push(incDir);
}
pools.push(target);

let fixed = 0, emptyCount = 0;
for (const pool of pools) {
  const files = listFiles(pool).filter(p => !p.includes("node_modules"));
  for (const f of files) {
    const st = fs.statSync(f);
    if (st.size === 0) {
      emptyCount++;
      // attempt to find same relative path inside tmp
      const rel = path.relative(pool, f);
      const cand = path.join(tmp, rel);
      if (fs.existsSync(cand) && fs.statSync(cand).size > 0) {
        // ensure destination dir exists in target repo
        const dest = path.join(target, rel);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(cand, dest);
        fixed++;
        console.log(`[repair] replaced 0KB: ${rel}`);
      } else {
        console.warn(`[repair] no replacement for: ${rel}`);
      }
    }
  }
}
console.log(`[repair] zero-byte files found: ${emptyCount}, replaced: ${fixed}`);
