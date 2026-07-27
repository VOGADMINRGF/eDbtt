import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function readWebSource(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("create debattenstand review fixes", () => {
  it("fails closed and derives topics from one canonical rendered level", () => {
    const client = readWebSource("src/app/create/CreateClient.tsx");

    expect(client).toMatch(
      /intelligentFollowup\s*\?\s*"result_ready"\s*:\s*hasStarted\s*\?\s*"ai_failed"/,
    );
    expect(client).toContain(
      "return dedupeCreatePlannerTopicLabels(fullBranchLabels);",
    );
    expect(client).not.toContain(
      "...intelligentFollowup.understanding.topics.map((topic) => topic.label)",
    );
  });

  it("keeps the Debattenstand reachable below xl", () => {
    const sidecar = readWebSource(
      "src/features/create/CreateDebattenstandSidecar.tsx",
    );
    const shell = readWebSource(
      "src/features/create/CreateWorkspaceShell.tsx",
    );

    expect(sidecar).toContain('className="xl:hidden');
    expect(shell).toContain('className="fixed inset-0 z-40 xl:hidden"');
    expect(shell).toContain("xl:flex xl:flex-col");
  });

  it("contains keyboard focus and restores the Details trigger", () => {
    const shell = readWebSource(
      "src/features/create/CreateWorkspaceShell.tsx",
    );

    expect(shell).toContain("mobileDialogTriggerRef");
    expect(shell).toContain('event.key !== "Tab"');
    expect(shell).toContain('setAttribute("inert", "")');
    expect(shell).toContain("mobileDialogTriggerRef.current?.focus()");
    expect(shell).toContain("dialog.contains(activeElement)");
  });

  it("advances the canonical OpenTasks slice to in_review", () => {
    const openTasks = readFileSync(
      resolve(process.cwd(), "../../docs/E150/OpenTasks.md"),
      "utf8",
    );

    const taskRow = openTasks
      .split("\n")
      .find((line) => line.startsWith("| CREATE-DEBATTENSTAND-01 |"));
    expect(taskRow).toBeDefined();
    expect(taskRow).toContain("| review |");
    expect(taskRow).not.toContain("| codex_ready |");
    expect(openTasks).toContain("CREATE-DEBATTENSTAND-01 evidence: PR #417");
  });
});
