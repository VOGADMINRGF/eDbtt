import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

import { runPreflight } from "./codex-task-preflight.mjs";

const OPEN_TASKS_TEMPLATE = `# E150 Open Tasks

## Kanonischer Operativteil

## Operative Statuswerte

- \`blocked\`
- \`codex_ready\`
- \`in_progress\`
- \`review\`
- \`manual_gate\`
- \`done\`

## Phase Test

| ID | Status | Priorität | Abhängigkeiten | Scope | Akzeptanzkriterien |
| --- | --- | --- | --- | --- | --- |
| TASK-CODEX-READY | codex_ready | P0 | keine | Test | task is executable |
| TASK-DONE | done | P0 | keine | Test | task is already finished |

## Historischer Katalog und Evidenz

| ID | Status | Priority | Depends on | Scope | Goal | Acceptance Criteria | Decision open | Evidence / Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| HISTORIC-TASK | needs_decision | medium | none | Archive | Archive | Archive | yes | Archive |
`;

function git(cwd, ...args) {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
  }).trim();
}

async function createRepoFixture() {
  const repoRoot = await fs.mkdtemp(path.join(os.tmpdir(), "codex-preflight-"));
  await fs.mkdir(path.join(repoRoot, "docs", "E150"), { recursive: true });
  await fs.writeFile(path.join(repoRoot, "docs", "E150", "OpenTasks.md"), OPEN_TASKS_TEMPLATE, "utf8");
  await fs.writeFile(path.join(repoRoot, "README.md"), "# fixture\n", "utf8");

  git(repoRoot, "init", "-b", "main");
  git(repoRoot, "config", "user.name", "Codex Test");
  git(repoRoot, "config", "user.email", "codex@example.com");
  git(repoRoot, "add", "README.md", "docs/E150/OpenTasks.md");
  git(repoRoot, "commit", "-m", "fixture");

  return repoRoot;
}

test("returns success for a codex_ready task on clean main", async () => {
  const repoRoot = await createRepoFixture();
  const { result, exitCode } = await runPreflight({
    taskId: "TASK-CODEX-READY",
    repoRoot,
  });

  assert.equal(exitCode, 0);
  assert.deepEqual(result, {
    taskId: "TASK-CODEX-READY",
    status: "codex_ready",
    executable: true,
    branchCreationAllowed: true,
  });
});

test("blocks done tasks", async () => {
  const repoRoot = await createRepoFixture();
  const { result, exitCode } = await runPreflight({
    taskId: "TASK-DONE",
    repoRoot,
  });

  assert.equal(exitCode, 1);
  assert.equal(result.taskId, "TASK-DONE");
  assert.equal(result.status, "done");
  assert.equal(result.executable, false);
  assert.equal(result.reason, "task_status_not_executable:done");
});

test("blocks unknown tasks", async () => {
  const repoRoot = await createRepoFixture();
  const { result, exitCode } = await runPreflight({
    taskId: "TASK-UNKNOWN",
    repoRoot,
  });

  assert.equal(exitCode, 1);
  assert.equal(result.taskId, "TASK-UNKNOWN");
  assert.equal(result.status, "missing");
  assert.equal(result.executable, false);
  assert.equal(result.reason, "task_not_found");
});

test("blocks dirty worktrees even for codex_ready tasks", async () => {
  const repoRoot = await createRepoFixture();
  await fs.appendFile(path.join(repoRoot, "README.md"), "dirty\n", "utf8");

  const { result, exitCode } = await runPreflight({
    taskId: "TASK-CODEX-READY",
    repoRoot,
  });

  assert.equal(exitCode, 1);
  assert.equal(result.taskId, "TASK-CODEX-READY");
  assert.equal(result.status, "codex_ready");
  assert.equal(result.executable, false);
  assert.equal(result.reason, "dirty_worktree");
});
