import type { ResearchContribution, ResearchTask } from "@core/research";
import { getGraphDriver } from "./driver";

type SyncArgs = {
  task: ResearchTask;
  contribution: ResearchContribution;
};

export async function syncResearchContributionToGraph({ task, contribution }: SyncArgs) {
  const driver = getGraphDriver();
  if (!driver) return false;
  if (!task.id || !contribution.id) return false;

  const session = driver.session();

  try {
    await session.executeWrite((tx) =>
      tx.run(
        `
        MERGE (t:ResearchTask {id: $taskId})
        SET t.title = $title,
            t.kind = $kind,
            t.level = $level,
            t.status = $status,
            t.updatedAt = timestamp()
        MERGE (c:ResearchContribution {id: $contributionId})
        SET c.summary = $summary,
            c.status = $contributionStatus,
            c.updatedAt = timestamp()
        MERGE (c)-[:CONTRIBUTES_TO]->(t)
        `,
        {
          taskId: task.id,
          title: task.title,
          kind: task.kind ?? "custom",
          level: task.level ?? "basic",
          status: task.status ?? "open",
          contributionId: contribution.id,
          summary: contribution.summary ?? "",
          contributionStatus: contribution.status ?? "submitted",
        },
      ),
    );

    if (task.source?.statementId) {
      await session.executeWrite((tx) =>
        tx.run(
          `
          MATCH (t:ResearchTask {id: $taskId})
          MERGE (s:Statement {id: $statementId})
          MERGE (t)-[:RELATES_TO]->(s)
          `,
          { taskId: task.id, statementId: task.source?.statementId },
        ),
      );
    }

    if (task.source?.questionId) {
      await session.executeWrite((tx) =>
        tx.run(
          `
          MATCH (t:ResearchTask {id: $taskId})
          MERGE (q:Question {id: $questionId})
          SET q.text = coalesce(q.text, $questionText)
          MERGE (t)-[:DERIVED_FROM]->(q)
          `,
          {
            taskId: task.id,
            questionId: task.source?.questionId,
            questionText: task.title,
          },
        ),
      );
    }

    if (task.source?.knotId) {
      await session.executeWrite((tx) =>
        tx.run(
          `
          MATCH (t:ResearchTask {id: $taskId})
          MERGE (k:Knot {id: $knotId})
          SET k.label = coalesce(k.label, $knotLabel),
              k.description = coalesce(k.description, $knotDescription)
          MERGE (t)-[:DERIVED_FROM]->(k)
          `,
          {
            taskId: task.id,
            knotId: task.source?.knotId,
            knotLabel: task.title,
            knotDescription: task.description ?? "",
          },
        ),
      );
    }

    return true;
  } catch (error) {
    console.error("[graph] syncResearchContributionToGraph failed", error);
    return false;
  } finally {
    await session.close();
  }
}
