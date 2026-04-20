#!/usr/bin/env node

import { spawnSync } from "node:child_process";

const MIN_MAJOR = 17;

function parseMajor(versionLine) {
  const match = versionLine.match(/version "([^"]+)"/);
  if (!match) return null;
  const raw = match[1];
  if (raw.startsWith("1.")) {
    const parts = raw.split(".");
    const major = Number(parts[1]);
    return Number.isFinite(major) ? major : null;
  }
  const major = Number(raw.split(".")[0]);
  return Number.isFinite(major) ? major : null;
}

const result = spawnSync("java", ["-version"], { encoding: "utf8" });
const output = `${result.stderr || ""}\n${result.stdout || ""}`;
const firstLine = output
  .split("\n")
  .map((line) => line.trim())
  .find(Boolean);

if (result.error || !firstLine) {
  console.error("[wrapper-android] Java runtime not found.");
  console.error("[wrapper-android] Install Java 17+ and set JAVA_HOME before Android build.");
  process.exit(1);
}

const major = parseMajor(firstLine);
if (!major || major < MIN_MAJOR) {
  console.error(`[wrapper-android] Unsupported Java runtime: ${firstLine}`);
  console.error("[wrapper-android] Android build requires Java 17+ (AGP 8.x).");
  console.error("[wrapper-android] Action: install JDK 17+ and export JAVA_HOME to that JDK.");
  process.exit(1);
}

console.log(`[wrapper-android] Java check ok: ${firstLine}`);
