#!/usr/bin/env node
import fs from "fs-extra";
import fg from "fast-glob";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.cwd();
const WEB_PUBLIC = path.join(ROOT, "apps/web/public");
const REVIEW_BASE = path.join(WEB_PUBLIC, "_review");

const DEFAULT_EXCLUDES = [
  "**/node_modules/**",
  "**/.next/**",
  "**/dist/**",
  "**/out/**",
  "**/.git/**",
  "**/.turbo/**",
  "**/coverage/**",
  "**/*.log",
  "**/.DS_Store",
  "**/.env",
  "**/.env.*",
  "**/secrets/**",
  "**/*.mbtiles",
  "**/*.pmtiles",
  "**/*.tiff",
];

function randToken(n = 10) { return crypto.randomBytes(n).toString("hex"); }
function toPosix(p) { return p.split(path.sep).join("/"); }

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === "--clean" && args[1]) {
    const dir = path.join(REVIEW_BASE, args[1]);
    if (await fs.pathExists(dir)) { await fs.remove(dir); console.log(`✓ removed snapshot ${args[1]}`); }
    else { console.log(`! not found: ${dir}`); }
    return;
  }

  const token = process.env.REVIEW_TOKEN || randToken();
  const dest = path.join(REVIEW_BASE, token);

  const entries = await fg(["**/*"], {
    cwd: ROOT,
    dot: true,
    onlyFiles: true,
    ignore: DEFAULT_EXCLUDES,
    followSymbolicLinks: false,
  });

  const HARD_DENY = [/\.env(\.|$)/i, /^secrets\//i];
  const files = entries.map(toPosix).filter((p) => !HARD_DENY.some((re) => re.test(p)));
  if (!files.length) { console.error("No files matched."); process.exit(1); }

  await fs.ensureDir(dest);

  const index = [];
  let copied = 0;
  for (const rel of files) {
    const src = path.join(ROOT, rel);
    const dst = path.join(dest, rel);
    await fs.ensureDir(path.dirname(dst));
    await fs.copyFile(src, dst);
    const stat = await fs.stat(src);
    index.push({ path: rel, size: stat.size, mtime: stat.mtimeMs });
    copied++; if (copied % 500 === 0) process.stdout.write(`...${copied}\r`);
  }

  await fs.writeJson(path.join(dest, "index.json"), { createdAt: Date.now(), root: "/", files: index }, { spaces: 2 });

  const html = `<!doctype html><html lang="de"><head>
<meta charset="utf-8"/><meta name="robots" content="noindex,nofollow"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Review Snapshot ${token}</title>
<style>
body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;margin:16px;background:#0b1220;color:#e5e7eb}
input{width:100%;padding:8px 10px;border-radius:8px;border:1px solid #374151;background:#111827;color:#e5e7eb}
a{color:#93c5fd;text-decoration:none}a:hover{text-decoration:underline}
small{color:#9ca3af}.row{display:flex;gap:12px;align-items:center;padding:6px 0;border-bottom:1px solid #111827}
.path{flex:1;overflow:auto;white-space:nowrap}.badge{font-size:12px;color:#d1d5db}
</style></head><body>
<h1>Review Snapshot <small>${token}</small></h1>
<p>Unlisted. <a href="./index.json" target="_blank">index.json</a></p>
<input id="q" placeholder="Datei suchen …"/><div id="list"></div>
<script type="module">
function fmt(n){if(n<1024)return n+" B";let u=["KB","MB","GB"];let i=-1;do{n/=1024;i++}while(n>=1024&&i<u.length-1);return n.toFixed(1)+" "+u[i]}
const list=document.getElementById('list');const q=document.getElementById('q');
const res=await fetch('./index.json',{cache:'no-store'});const data=await res.json();let files=data.files;
function render(f=""){list.innerHTML="";f=f.trim().toLowerCase();for(const it of files){if(f && !it.path.toLowerCase().includes(f)) continue;
const row=document.createElement('div');row.className='row';
const a=document.createElement('a');a.className='path';a.href='./'+it.path;a.textContent=it.path;a.target="_blank";
const s=document.createElement('span');s.className='badge';s.textContent=fmt(it.size);
row.append(a,s);list.append(row);}}
q.addEventListener('input', e=>render(e.target.value));render();
</script></body></html>`;
  await fs.writeFile(path.join(dest, "index.html"), html, "utf8");

  console.log(`\n✓ Snapshot ready at /_review/${token}/index.html`);
  console.log(`   Example file: /_review/${token}/${files[0]}`);
  console.log(`   Files total : ${files.length}\n`);
}
main().catch((e)=>{ console.error(e); process.exit(1); });
