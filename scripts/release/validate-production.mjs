#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "../..");
const WEB_DIR = path.join(ROOT, "apps/web");
const LOCK_PATH = path.join(WEB_DIR, ".release-validation.lock");
const ROOT_PACKAGE_JSON_PATH = path.join(ROOT, "package.json");
const NVMRC_PATH = path.join(ROOT, ".nvmrc");
const SMOKE_TESTS = [
  "tests/create-mode.page.test.ts",
  "tests/create-handoff.persistence.route.test.ts",
  "tests/account-organization-dashboard.page.test.tsx",
  "tests/admin-review.page.test.tsx",
  "tests/admin-region-source-connections.route.test.ts",
  "tests/uploads-material-intake.route.test.ts",
  "tests/factcheck-enqueue.auth.route.test.ts",
  "tests/dossier-public-route.contract.test.tsx",
  "tests/topic-public-page.contract.test.tsx",
  "tests/runden-public-input.route.test.ts",
  "tests/admin-pricing-orders.route.test.ts",
  "tests/request-scope-context.test.ts",
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function shellEscape(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function parseExpectedNodeMajor() {
  const nvmrc = fs.existsSync(NVMRC_PATH) ? fs.readFileSync(NVMRC_PATH, "utf8").trim() : "";
  const match = nvmrc.match(/(\d+)/);
  if (match) {
    return Number(match[1]);
  }

  const rootPackageJson = readJson(ROOT_PACKAGE_JSON_PATH);
  const engineMatch = String(rootPackageJson?.engines?.node ?? "").match(/(\d+)/);
  if (engineMatch) {
    return Number(engineMatch[1]);
  }

  return 20;
}

function parseExpectedPnpmVersion() {
  const rootPackageJson = readJson(ROOT_PACKAGE_JSON_PATH);
  const packageManager = String(rootPackageJson.packageManager ?? "");
  const match = packageManager.match(/^pnpm@(.+)$/);
  if (!match) {
    throw new Error("`packageManager` fehlt oder ist nicht auf pnpm gesetzt.");
  }
  return match[1];
}

function runCapture(cmd, args, options = {}) {
  return execFileSync(cmd, args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  }).trim();
}

function buildChildEnv() {
  const env = { ...process.env };
  delete env.NODE_ENV;
  env.BROWSERSLIST_IGNORE_OLD_DATA = "1";
  env.FORCE_COLOR = env.FORCE_COLOR || "1";
  env.PATH = [path.dirname(process.execPath), env.PATH].filter(Boolean).join(path.delimiter);
  return env;
}

function runStep(label, cmd, args, options = {}) {
  console.log(`\n[release-gate] ${label}`);
  console.log(`[release-gate] > ${[cmd, ...args].join(" ")}`);
  execFileSync(cmd, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: buildChildEnv(),
    ...options,
  });
}

function ensureNode20(expectedNodeMajor) {
  const currentMajor = Number(process.versions.node.split(".")[0] ?? "0");
  if (currentMajor === expectedNodeMajor) {
    return;
  }

  if (process.env.RELEASE_VALIDATE_REEXEC === "1") {
    throw new Error(
      `Node ${expectedNodeMajor}.x ist Pflicht fuer den Release-Gate-Lauf; aktuell laeuft Node ${process.version}.`,
    );
  }

  const nvmDir = process.env.NVM_DIR || path.join(process.env.HOME ?? "", ".nvm");
  const nvmScript = path.join(nvmDir, "nvm.sh");
  if (!fs.existsSync(nvmScript)) {
    throw new Error(
      `Node ${expectedNodeMajor}.x ist Pflicht, aber nvm wurde unter ${nvmScript} nicht gefunden. Wechsle vor dem Release auf Node ${expectedNodeMajor}.x.`,
    );
  }

  const forwardedArgs = process.argv.slice(2).map((arg) => shellEscape(arg)).join(" ");
  const reexecCommand = [
    `cd ${shellEscape(ROOT)}`,
    `source ${shellEscape(nvmScript)} >/dev/null 2>&1`,
    `NODE20_BIN="$(nvm which ${expectedNodeMajor})"`,
    '[ -x "$NODE20_BIN" ]',
    `RELEASE_VALIDATE_REEXEC=1 "$NODE20_BIN" ${shellEscape(__filename)}${forwardedArgs ? ` ${forwardedArgs}` : ""}`,
  ].join(" && ");

  console.log(
    `[release-gate] Node ${process.version} erkannt; starte den Release-Gate-Lauf unter .nvmrc (${expectedNodeMajor}.x) neu.`,
  );
  const result = spawnSync("/bin/zsh", ["-lc", reexecCommand], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  process.exit(result.status ?? 1);
}

function ensurePnpmVersion(expectedPnpmVersion) {
  const currentPnpmVersion = runCapture("pnpm", ["-v"]);
  if (currentPnpmVersion !== expectedPnpmVersion) {
    throw new Error(
      `pnpm ${expectedPnpmVersion} ist Pflicht fuer den Release-Gate-Lauf; erkannt wurde pnpm ${currentPnpmVersion}.`,
    );
  }
}

function acquireLock() {
  const payload = {
    pid: process.pid,
    startedAt: new Date().toISOString(),
    node: process.version,
  };

  try {
    const fd = fs.openSync(LOCK_PATH, "wx");
    fs.writeFileSync(fd, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    fs.closeSync(fd);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "EEXIST") {
      const existing = fs.existsSync(LOCK_PATH) ? fs.readFileSync(LOCK_PATH, "utf8").trim() : "";
      throw new Error(
        `Release-Gate ist bereits aktiv oder wurde nicht sauber beendet (${LOCK_PATH}).${existing ? ` Vorhandener Lock:\n${existing}` : ""}`,
      );
    }
    throw error;
  }
}

function releaseLock() {
  if (fs.existsSync(LOCK_PATH)) {
    fs.rmSync(LOCK_PATH, { force: true });
  }
}

function removeNextDir() {
  const nextDir = path.join(WEB_DIR, ".next");
  fs.rmSync(nextDir, { recursive: true, force: true });
}

function printRuntimeSummary(expectedNodeMajor, expectedPnpmVersion) {
  const nodeEnv = process.env.NODE_ENV ? `${process.env.NODE_ENV} (wird fuer Child-Commands neutralisiert)` : "unset";
  console.log("[release-gate] Runtime-Preflight");
  console.log(`[release-gate] repo: ${ROOT}`);
  console.log(`[release-gate] node: ${process.version} (erwartet ${expectedNodeMajor}.x)`);
  console.log(`[release-gate] node_bin: ${process.execPath}`);
  console.log(`[release-gate] pnpm: ${runCapture("pnpm", ["-v"])} (erwartet ${expectedPnpmVersion})`);
  console.log(`[release-gate] NODE_ENV: ${nodeEnv}`);
  console.log("[release-gate] next build/typecheck laufen seriell unter einem Lock; frischer .next-Build ist Pflicht.");
}

function main() {
  const expectedNodeMajor = parseExpectedNodeMajor();
  ensureNode20(expectedNodeMajor);

  const expectedPnpmVersion = parseExpectedPnpmVersion();
  ensurePnpmVersion(expectedPnpmVersion);
  printRuntimeSummary(expectedNodeMajor, expectedPnpmVersion);

  acquireLock();
  process.on("exit", releaseLock);
  process.on("SIGINT", () => {
    releaseLock();
    process.exit(130);
  });
  process.on("SIGTERM", () => {
    releaseLock();
    process.exit(143);
  });

  try {
    runStep("Page contracts", "node", ["scripts/check-page-contracts.mjs"]);
    runStep("Targeted production smoke matrix", "pnpm", [
      "-C",
      "apps/web",
      "exec",
      "vitest",
      "run",
      ...SMOKE_TESTS,
    ]);
    console.log("\n[release-gate] Fresh .next cleanup");
    console.log("[release-gate] > rm -rf apps/web/.next");
    removeNextDir();
    runStep("Clean production build", "pnpm", ["--filter", "@vog/web", "build"]);
    runStep("Explicit web typecheck after fresh build", "pnpm", ["-C", "apps/web", "run", "typecheck"]);
    runStep("Explicit web lint", "pnpm", ["-C", "apps/web", "run", "lint"]);

    console.log("\n[release-gate] PASS");
    console.log(
      "[release-gate] Releasable, wenn dieser Lauf gruen ist, der Commit bewusst freigegeben wurde und der anschliessende Vercel-Deploy ohne zusätzliche lokale Sondergriffe gruen bleibt.",
    );
  } finally {
    releaseLock();
  }
}

try {
  main();
} catch (error) {
  console.error("\n[release-gate] FAIL");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
