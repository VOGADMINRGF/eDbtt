import crypto from "node:crypto";
import type {
  AnalyzeResult,
  EventualityNode,
  ConsequenceRecord,
  ResponsibilityPath,
  ResponsibilityRecord,
  ScenarioOption,
} from "@features/analyze/schemas";
import { getGraphDriver } from "./driver";

type SyncArgs = {
  result: AnalyzeResult;
  locale?: string;
  sourceId?: string;
};

export async function syncAnalyzeResultToGraph({ result, locale, sourceId }: SyncArgs) {
  const driver = getGraphDriver();
  if (!driver) return false;

  const session = driver.session();
  const resolvedSourceId =
    sourceId ||
    crypto.createHash("sha1").update(result.sourceText).digest("hex").slice(0, 32);

  const claimsPayload = result.claims.map((claim, index) => {
    const claimIndex =
      typeof (claim as any).index === "number"
        ? (claim as any).index
        : typeof (claim as any).statementIndex === "number"
          ? (claim as any).statementIndex
          : index;

    return {
      id: claim.id || `${resolvedSourceId}-claim-${index}`,
      text: claim.text,
      responsibility: claim.responsibility ?? null,
      topic: claim.topic ?? claim.domain ?? null,
      statementIndex: claimIndex,
      locale: locale ?? result.language ?? "de",
    };
  });
  const statementIdByIndex = new Map<number, string>();
  claimsPayload.forEach((claim) => {
    statementIdByIndex.set(claim.statementIndex, claim.id);
  });

  const knotsPayload = (result.knots ?? []).map((knot) => ({
    id: knot.id,
    label: knot.label,
    description: knot.description,
  }));
  const notesPayload = (result.notes ?? []).map((note, index) => ({
    id: note.id || `${resolvedSourceId}-note-${index}`,
    text: note.text,
    kind: note.kind ?? null,
    locale: locale ?? result.language ?? "de",
  }));
  const questionsPayload = (result.questions ?? []).map((question, index) => ({
    id: question.id || `${resolvedSourceId}-question-${index}`,
    text: question.text,
    dimension: question.dimension ?? null,
    locale: locale ?? result.language ?? "de",
  }));

  const localeForGraph = locale ?? result.language ?? "de";
  const eventualityArtifacts = collectEventualityGraphArtifacts(result, localeForGraph);
  const baseConsequences = Array.isArray(result.consequences?.consequences)
    ? result.consequences!.consequences
    : [];
  const consequenceMap = new Map<string, ConsequenceRecord>();
  for (const entry of baseConsequences) {
    if (entry?.id) consequenceMap.set(entry.id, entry);
  }
  for (const entry of eventualityArtifacts.consequenceRecords) {
    if (entry?.id && !consequenceMap.has(entry.id)) {
      consequenceMap.set(entry.id, entry);
    }
  }
  const mergedConsequences = [...consequenceMap.values()];
  const statementConsequenceLinks: Array<{ statementId: string; consequenceId: string }> = [];
  for (const cons of baseConsequences) {
    if (!cons?.id) continue;
    if (typeof cons.statementIndex !== "number") continue;
    const statementId = statementIdByIndex.get(cons.statementIndex);
    if (!statementId) continue;
    statementConsequenceLinks.push({ statementId, consequenceId: cons.id });
  }

  const responsibilitiesMap = new Map<string, ResponsibilityRecord>();
  for (const entry of result.consequences?.responsibilities ?? []) {
    if (entry?.id) responsibilitiesMap.set(entry.id, entry);
  }
  for (const entry of eventualityArtifacts.responsibilities) {
    if (entry?.id && !responsibilitiesMap.has(entry.id)) {
      responsibilitiesMap.set(entry.id, entry);
    }
  }
  const responsibilities = [...responsibilitiesMap.values()];
  const responsibilityPathArtifacts = normalizeResponsibilityPaths(result.responsibilityPaths, localeForGraph);

  try {
    await session.executeWrite((tx) =>
      tx.run(
        `
        UNWIND $claims AS claim
        MERGE (s:Statement {id: claim.id})
        SET s.text = claim.text,
            s.locale = claim.locale,
            s.updatedAt = timestamp(),
            s.topic = claim.topic,
            s.sourceId = $sourceId,
            s.responsibility = claim.responsibility
        WITH s
        WHERE s.topic IS NOT NULL
        MERGE (t:Topic {name: s.topic})
        MERGE (s)-[:BELONGS_TO_TOPIC]->(t)
        `,
        { claims: claimsPayload, sourceId: resolvedSourceId },
      ),
    );

    if (knotsPayload.length > 0) {
      await session.executeWrite((tx) =>
        tx.run(
          `
          UNWIND $knots AS knot
          MERGE (k:Knot {id: knot.id})
          SET k.label = knot.label,
              k.description = knot.description
          MERGE (source:Source {id: $sourceId})
          MERGE (source)-[:FEATURES]->(k)
          `,
          { knots: knotsPayload, sourceId: resolvedSourceId },
        ),
      );
    }

    if (notesPayload.length > 0) {
      await session.executeWrite((tx) =>
        tx.run(
          `
          UNWIND $notes AS note
          MERGE (n:Note {id: note.id})
          SET n.text = note.text,
              n.kind = note.kind,
              n.locale = note.locale,
              n.updatedAt = timestamp()
          MERGE (source:Source {id: $sourceId})
          MERGE (source)-[:HAS_NOTE]->(n)
          `,
          { notes: notesPayload, sourceId: resolvedSourceId },
        ),
      );
    }

    if (questionsPayload.length > 0) {
      await session.executeWrite((tx) =>
        tx.run(
          `
          UNWIND $questions AS question
          MERGE (q:Question {id: question.id})
          SET q.text = question.text,
              q.dimension = question.dimension,
              q.locale = question.locale
          MERGE (source:Source {id: $sourceId})
          MERGE (source)-[:RAISES_QUESTION]->(q)
          `,
          { questions: questionsPayload, sourceId: resolvedSourceId },
        ),
      );
    }

    if (responsibilities.length > 0) {
      await session.executeWrite((tx) =>
        tx.run(
          `
          UNWIND $responsibilities AS resp
          MERGE (r:Responsibility {id: resp.id})
          SET r.level = resp.level,
              r.actor = resp.actor,
              r.text = resp.text,
              r.relevance = resp.relevance
          MERGE (source:Source {id: $sourceId})
          MERGE (source)-[:ASSIGNS]->(r)
          `,
          { responsibilities, sourceId: resolvedSourceId },
        ),
      );
    }

    if (eventualityArtifacts.nodes.length > 0) {
      await session.executeWrite((tx) =>
        tx.run(
          `
          UNWIND $eventualities AS evt
          MERGE (e:Eventuality {id: evt.id})
          SET e.label = evt.label,
              e.narrative = evt.narrative,
              e.likelihood = evt.likelihood,
              e.impact = evt.impact,
              e.locale = evt.locale,
              e.option = evt.option,
              e.updatedAt = timestamp(),
              e.sourceId = $sourceId
          MERGE (s:Statement {id: evt.statementId})
          SET s.locale = coalesce(s.locale, evt.locale)
          MERGE (s)-[rel:LEADS_TO]->(e)
          SET rel.option = evt.option,
              rel.updatedAt = timestamp()
          `,
          {
            eventualities: eventualityArtifacts.nodes,
            sourceId: resolvedSourceId,
          },
        ),
      );
    }

    if (eventualityArtifacts.parentLinks.length > 0) {
      await session.executeWrite((tx) =>
        tx.run(
          `
          UNWIND $links AS link
          MATCH (child:Eventuality {id: link.childId})
          MATCH (parent:Eventuality {id: link.parentId})
          MERGE (child)-[:CHILD_OF]->(parent)
          `,
          { links: eventualityArtifacts.parentLinks },
        ),
      );
    }

    if (mergedConsequences.length > 0) {
      await session.executeWrite((tx) =>
        tx.run(
          `
          UNWIND $consequences AS cons
          MERGE (c:Consequence {id: cons.id})
          SET c.scope = cons.scope,
              c.statementIndex = cons.statementIndex,
              c.text = cons.text,
              c.confidence = cons.confidence,
              c.updatedAt = timestamp()
          MERGE (source:Source {id: $sourceId})
          MERGE (source)-[:MENTIONS]->(c)
          `,
          { consequences: mergedConsequences, sourceId: resolvedSourceId },
        ),
      );
    }

    if (eventualityArtifacts.consequenceLinks.length > 0) {
      await session.executeWrite((tx) =>
        tx.run(
          `
          UNWIND $links AS link
          MATCH (e:Eventuality {id: link.eventualityId})
          MATCH (c:Consequence {id: link.consequenceId})
          MERGE (e)-[:MAY_CAUSE]->(c)
          `,
          { links: eventualityArtifacts.consequenceLinks },
        ),
      );
    }

    if (statementConsequenceLinks.length > 0) {
      await session.executeWrite((tx) =>
        tx.run(
          `
          UNWIND $links AS link
          MATCH (s:Statement {id: link.statementId})
          MATCH (c:Consequence {id: link.consequenceId})
          MERGE (s)-[:HAS_CONSEQUENCE]->(c)
          `,
          { links: statementConsequenceLinks },
        ),
      );
    }

    if (eventualityArtifacts.responsibilityLinks.length > 0) {
      await session.executeWrite((tx) =>
        tx.run(
          `
          UNWIND $links AS link
          MATCH (e:Eventuality {id: link.eventualityId})
          MATCH (r:Responsibility {id: link.responsibilityId})
          MERGE (e)-[:RESPONSIBILITY_OF]->(r)
          `,
          { links: eventualityArtifacts.responsibilityLinks },
        ),
      );
    }

    if (responsibilityPathArtifacts.paths.length > 0) {
      await session.executeWrite((tx) =>
        tx.run(
          `
          UNWIND $paths AS path
          MERGE (rp:ResponsibilityPath {id: path.pathId})
          SET rp.statementId = path.statementId,
              rp.locale = path.locale,
              rp.sourceId = $sourceId,
              rp.updatedAt = timestamp()
          MERGE (s:Statement {id: path.statementId})
          MERGE (s)-[:HAS_RESPONSIBILITY_PATH]->(rp)
          `,
          { paths: responsibilityPathArtifacts.paths, sourceId: resolvedSourceId },
        ),
      );
    }

    if (responsibilityPathArtifacts.steps.length > 0) {
      await session.executeWrite((tx) =>
        tx.run(
          `
          UNWIND $steps AS step
          MERGE (rs:ResponsibilityStep {id: step.stepId})
          SET rs.displayName = step.displayName,
              rs.level = step.level,
              rs.actorKey = step.actorKey,
              rs.description = step.description,
              rs.contactUrl = step.contactUrl,
              rs.processHint = step.processHint,
              rs.relevance = step.relevance,
              rs.index = step.index,
              rs.locale = step.locale,
              rs.updatedAt = timestamp()
          MATCH (rp:ResponsibilityPath {id: step.pathId})
          MERGE (rp)-[:HAS_STEP {index: step.index}]->(rs)
          `,
          { steps: responsibilityPathArtifacts.steps },
        ),
      );
    }

    if (responsibilityPathArtifacts.nextLinks.length > 0) {
      await session.executeWrite((tx) =>
        tx.run(
          `
          UNWIND $links AS link
          MATCH (from:ResponsibilityStep {id: link.from})
          MATCH (to:ResponsibilityStep {id: link.to})
          MERGE (from)-[:NEXT]->(to)
          `,
          { links: responsibilityPathArtifacts.nextLinks },
        ),
      );
    }

    return true;
  } catch (error) {
    console.error("[graph] syncAnalyzeResultToGraph failed", error);
    return false;
  } finally {
    await session.close();
  }
}

type EventualityGraphNode = {
  id: string;
  statementId: string;
  label: string;
  narrative: string;
  option: ScenarioOption | null;
  likelihood: number | null;
  impact: number | null;
  parentId: string | null;
  locale: string;
};

type EventualityGraphArtifacts = {
  nodes: EventualityGraphNode[];
  parentLinks: Array<{ childId: string; parentId: string }>;
  consequenceRecords: ConsequenceRecord[];
  consequenceLinks: Array<{ eventualityId: string; consequenceId: string }>;
  responsibilities: ResponsibilityRecord[];
  responsibilityLinks: Array<{ eventualityId: string; responsibilityId: string }>;
};

type ResponsibilityPathGraphArtifacts = {
  paths: ResponsibilityPathGraphPath[];
  steps: ResponsibilityPathGraphStep[];
  nextLinks: Array<{ from: string; to: string }>;
};

type ResponsibilityPathGraphPath = {
  pathId: string;
  statementId: string;
  locale: string;
};

type ResponsibilityPathGraphStep = {
  pathId: string;
  stepId: string;
  index: number;
  displayName: string | null;
  level: string | null;
  actorKey: string | null;
  description: string | null;
  contactUrl: string | null;
  processHint: string | null;
  relevance: number | null;
  locale: string;
  nextStepId: string | null;
};

function collectEventualityGraphArtifacts(
  result: AnalyzeResult,
  locale: string,
): EventualityGraphArtifacts {
  const nodes = new Map<string, EventualityGraphNode>();
  const parentLinks: Array<{ childId: string; parentId: string }> = [];
  const consequenceRecords = new Map<string, ConsequenceRecord>();
  const consequenceLinks: Array<{ eventualityId: string; consequenceId: string }> = [];
  const responsibilities = new Map<string, ResponsibilityRecord>();
  const responsibilityLinks: Array<{ eventualityId: string; responsibilityId: string }> = [];

  const pushNode = (
    node: EventualityNode,
    ctx: {
      option?: ScenarioOption | null;
      parentId?: string | null;
      statementId?: string | null;
      fallbackSeed: string;
    },
  ) => {
    const statementId = node.statementId || ctx.statementId;
    if (!statementId) return;
    const nodeId = resolveEventualityId(node, ctx.fallbackSeed);
    const option = ctx.option ?? node.stance ?? null;
    nodes.set(nodeId, {
      id: nodeId,
      statementId,
      label: node.label,
      narrative: node.narrative,
      option,
      likelihood: typeof node.likelihood === "number" ? node.likelihood : null,
      impact: typeof node.impact === "number" ? node.impact : null,
      parentId: ctx.parentId ?? null,
      locale,
    });

    if (ctx.parentId) {
      parentLinks.push({ childId: nodeId, parentId: ctx.parentId });
    }

    for (const cons of node.consequences ?? []) {
      if (!cons?.id) continue;
      if (!consequenceRecords.has(cons.id)) {
        consequenceRecords.set(cons.id, cons);
      }
      consequenceLinks.push({ eventualityId: nodeId, consequenceId: cons.id });
    }

    for (const resp of node.responsibilities ?? []) {
      if (!resp?.id) continue;
      if (!responsibilities.has(resp.id)) {
        responsibilities.set(resp.id, resp);
      }
      responsibilityLinks.push({ eventualityId: nodeId, responsibilityId: resp.id });
    }

    node.children?.forEach((child, idx) =>
      pushNode(child, {
        option: child.stance ?? option ?? null,
        parentId: nodeId,
        statementId: child.statementId || statementId,
        fallbackSeed: `${nodeId}:child:${idx}`,
      }),
    );
  };

  (result.decisionTrees ?? []).forEach((tree, treeIdx) => {
    if (!tree?.rootStatementId) return;
    const optionsEntries: Array<[ScenarioOption, EventualityNode | undefined]> = [
      ["pro", tree.options?.pro],
      ["neutral", tree.options?.neutral],
      ["contra", tree.options?.contra],
    ];
    optionsEntries.forEach(([option, node]) => {
      if (!node) return;
      pushNode(node, {
        option,
        parentId: null,
        statementId: node.statementId || tree.rootStatementId,
        fallbackSeed: `${tree.rootStatementId}:${option}:${treeIdx}`,
      });
    });
  });

  (result.eventualities ?? []).forEach((node, idx) => {
    if (!node?.statementId) return;
    pushNode(node, {
      option: node.stance ?? null,
      parentId: null,
      statementId: node.statementId,
      fallbackSeed: `${node.statementId}:evt:${idx}`,
    });
  });

  return {
    nodes: [...nodes.values()],
    parentLinks,
    consequenceRecords: [...consequenceRecords.values()],
    consequenceLinks,
    responsibilities: [...responsibilities.values()],
    responsibilityLinks,
  };
}

function resolveEventualityId(node: EventualityNode, fallbackSeed: string): string {
  const candidate = node.id?.trim();
  if (candidate) return candidate;
  return `evt-${crypto.createHash("sha1").update(fallbackSeed).digest("hex").slice(0, 12)}`;
}

function normalizeResponsibilityPaths(
  paths: ResponsibilityPath[] | undefined,
  locale: string,
): ResponsibilityPathGraphArtifacts {
  if (!Array.isArray(paths) || paths.length === 0) {
    return { paths: [], steps: [], nextLinks: [] };
  }

  const pathsOut: ResponsibilityPathGraphPath[] = [];
  const stepsOut: ResponsibilityPathGraphStep[] = [];
  const links: Array<{ from: string; to: string }> = [];

  paths.forEach((path, pathIdx) => {
    if (!path?.statementId) return;
    const pathId = resolveResponsibilityPathId(path.id, path.statementId, pathIdx);
    const localeValue = path.locale ?? locale;
    pathsOut.push({
      pathId,
      statementId: path.statementId,
      locale: localeValue,
    });

    const nodes = Array.isArray(path.nodes) ? path.nodes : [];
    const stepIds: string[] = [];

    nodes.forEach((node, idx) => {
      const stepId = resolveResponsibilityStepId(pathId, idx);
      stepIds.push(stepId);
      stepsOut.push({
        pathId,
        stepId,
        index: idx,
        displayName: node?.displayName ?? null,
        level: node?.level ?? null,
        actorKey: node?.actorKey ?? null,
        description: node?.description ?? null,
        contactUrl: node?.contactUrl ?? null,
        processHint: node?.processHint ?? null,
        relevance: typeof node?.relevance === "number" ? node!.relevance! : null,
        locale: localeValue,
        nextStepId: null,
      });
    });

    for (let i = 0; i < stepIds.length - 1; i += 1) {
      links.push({ from: stepIds[i], to: stepIds[i + 1] });
      const currentStep = stepsOut.find((step) => step.stepId === stepIds[i]);
      if (currentStep) currentStep.nextStepId = stepIds[i + 1];
    }
  });

  return {
    paths: pathsOut,
    steps: stepsOut,
    nextLinks: links,
  };
}

function resolveResponsibilityPathId(
  candidateId: string | undefined,
  statementId: string,
  index: number,
) {
  const trimmed = candidateId?.trim();
  if (trimmed) return trimmed;
  const seed = `${statementId}:path:${index}`;
  return `rpath-${crypto.createHash("sha1").update(seed).digest("hex").slice(0, 12)}`;
}

function resolveResponsibilityStepId(pathId: string, index: number): string {
  return `${pathId}:step:${index}`;
}
