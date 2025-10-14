import fs from "fs";
import path from "path";

const repo = process.cwd();
const webDir = path.join(repo, "apps", "web");
const tsconfigWeb = path.join(webDir, "tsconfig.json");
const eslintIgnore = path.join(webDir, ".eslintignore");
const pkgRoot = path.join(repo, "package.json");

// A) tsconfig: src/_disabled/** ausschließen
{
  const j = JSON.parse(fs.readFileSync(tsconfigWeb, "utf8"));
  j.exclude ||= [];
  const need = "src/_disabled/**";
  if (!j.exclude.includes(need)) j.exclude.push(need);
  fs.writeFileSync(tsconfigWeb, JSON.stringify(j, null, 2));
  console.log("✓ tsconfig(web): exclude src/_disabled/**");
}

// B) ESLint: lokales .eslintignore erweitern
{
  let content = "";
  if (fs.existsSync(eslintIgnore)) content = fs.readFileSync(eslintIgnore, "utf8");
  const line = "src/_disabled/**";
  if (!content.split("\n").some(l => l.trim() === line)) {
    content = (content ? content.trimEnd() + "\n" : "") + line + "\n";
    fs.writeFileSync(eslintIgnore, content);
    console.log("✓ .eslintignore(web): src/_disabled/**");
  } else {
    console.log("✓ .eslintignore(web): bereits vorhanden");
  }
}

// C) Root package.json: lint-Script mit ignore-pattern härten (falls du global lintest)
{
  const pkg = JSON.parse(fs.readFileSync(pkgRoot, "utf8"));
  pkg.scripts ||= {};
  const want = 'pnpm -w dlx eslint "apps/web/src/**/*.{ts,tsx}" --ignore-pattern "apps/web/src/_disabled/**" --max-warnings=0';
  if (pkg.scripts.lint !== want) {
    pkg.scripts.lint = want;
    fs.writeFileSync(pkgRoot, JSON.stringify(pkg, null, 2));
    console.log("✓ package.json(root): lint-Script ignoriert _disabled");
  } else {
    console.log("✓ package.json(root): lint-Script ok");
  }
}

console.log("→ Jetzt: pnpm run e200");
