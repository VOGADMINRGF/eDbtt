#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const SCRIPT_FILE = fileURLToPath(import.meta.url);
const DEFAULT_REPO_ROOT = path.resolve(path.dirname(SCRIPT_FILE), "..");
const OPEN_TASKS_RELATIVE_PATH = path.join("docs", "E150", "OpenTasks.md");
const OPERATIVE_HEAD_MARKER = "## Kanonischer Operativteil";
const HISTORY_MARKER = "## Historischer Katalog und Evidenz";
const EXECUTABLE_STATUS = "codex_ready";

function buildResult(taskId, status, executable, reason = null) {
  const result = {
    taskId,
    status,
    executable,
  };

  if (executable) {
    result.branchCreationAllowed = true;
    return result;
  }

  result.reason = reason;
  return result;
}

export function extractOperativeHead(openTasksText) {
  const headStart = openTasksText.indexOf(OPERATIVE_HEAD_MARKER);
  const historyStart = openTasksText.indexOf(HISTORY_MARKER);

  if (headStart === -1 || historyStart === -1 || historyStart <= headStart) {
    throw new Error("ENTSCHEIDUNG ERFORDERLICH: open_tasks_structure_unclear");
  }

  return openTasksText.slice(headStart, historyStart);
}

export function parseOperativeTaskStatuses(operativeHeadText) {
  const lines = operativeHeadText.split(/\r?\n/);
  const taskStatusMap = new Map();
  let activeHeader = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) {
      continue;
    }

    const cells = trimmed
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim());

    if (cells.length === 0) {
      continue;
    }

    const isDividerRow = cells.every((cell) => /^:?-{3,}:?$/.test(cell));
    if (isDividerRow) {
      continue;
    }

    if (cells.includes("ID") && cells.includes("Status")) {
      activeHeader = cells;
      continue;
    }

    if (!activeHeader || cells.length < activeHeader.length) {
      continue;
    }

    const row = Object.fromEntries(activeHeader.map((header, index) => [header, cells[index] ?? ""]));
    const taskId = row.ID;
    const status = row.Status;

    if (!taskId || !status) {
      continue;
    }

    if (taskStatusMap.has(taskId)) {
      throw new Error(`ENTSCHEIDUNG ERFORDERLICH: duplicate_task_id_in_operative_head:${taskId}`);
    }

    taskStatusMap.set(taskId, status);
  }

  return taskStatusMap;
}

export async function getTaskStatus(taskId, repoRoot = DEFAULT_REPO_ROOT) {
  const openTasksPath = path.join(repoRoot, OPEN_TASKS_RELATIVE_PATH);
  const openTasksText = await fs.readFile(openTasksPath, "utf8");
  const operativeHead = extractOperativeHead(openTasksText);
  const taskStatuses = parseOperativeTaskStatuses(operativeHead);
  return taskStatuses.get(taskId) ?? null;
}

async function runGit(repoRoot, args) {
  const { stdout } = await execFileAsync("git", args, { cwd: repoRoot });
  return stdout.trim();
}

export async function isCleanWorktree(repoRoot = DEFAULT_REPO_ROOT) {
  const porcelain = await runGit(repoRoot, ["status", "--porcelain"]);
  return porcelain.length === 0;
}

export async function getCurrentBranch(repoRoot = DEFAULT_REPO_ROOT) {
  return runGit(repoRoot, ["branch", "--show-current"]);
}

export async function runPreflight({ taskId, repoRoot = DEFAULT_REPO_ROOT } = {}) {
  if (!taskId) {
    return {
      result: buildResult(null, "missing", false, "missing_task_id"),
      exitCode: 1,
    };
  }

  let status;
  try {
    status = await getTaskStatus(taskId, repoRoot);
  } catch (error) {
    return {
      result: buildResult(taskId, "unknown", false, error.message),
      exitCode: 1,
    };
  }

  if (!status) {
    return {
      result: buildResult(taskId, "missing", false, "task_not_found"),
      exitCode: 1,
    };
  }

  if (status !== EXECUTABLE_STATUS) {
    return {
      result: buildResult(taskId, status, false, `task_status_not_executable:${status}`),
      exitCode: 1,
    };
  }

  try {
    const cleanWorktree = await isCleanWorktree(repoRoot);
    if (!cleanWorktree) {
      return {
        result: buildResult(taskId, status, false, "dirty_worktree"),
        exitCode: 1,
      };
    }

    const currentBranch = await getCurrentBranch(repoRoot);
    if (currentBranch !== "main") {
      return {
        result: buildResult(taskId, status, false, `branch_not_main:${currentBranch || "detached"}`),
        exitCode: 1,
      };
    }
  } catch (error) {
    return {
      result: buildResult(taskId, status, false, `git_preflight_failed:${error.message}`),
      exitCode: 1,
    };
  }

  return {
    result: buildResult(taskId, status, true),
    exitCode: 0,
  };
}

export function formatResult(result) {
  return JSON.stringify(result, null, 2);
}

export async function main(argv = process.argv.slice(2), repoRoot = DEFAULT_REPO_ROOT) {
  const [taskId] = argv;
  const { result, exitCode } = await runPreflight({ taskId, repoRoot });
  const output = formatResult(result);

  if (exitCode === 0) {
    console.log(output);
  } else {
    console.error(output);
  }

  return exitCode;
}

const isMainModule =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(SCRIPT_FILE);

if (isMainModule) {
  const exitCode = await main();
  process.exit(exitCode);
}
