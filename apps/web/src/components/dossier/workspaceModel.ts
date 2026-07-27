import type { Dossier } from "@features/dossier";
import { STATUS_LABELS } from "./labels";
import { getPresentation } from "./presentation";

export type DossierWorkspaceRelationKind =
  | "supports"
  | "contradicts"
  | "mentions"
  | "unclear";

export type DossierWorkspaceSourceLink = {
  sourceId: string;
  relation: DossierWorkspaceRelationKind;
  relationLabel: string;
};

export type DossierWorkspaceClaim = {
  id: string;
  text: string;
  title: string;
  stance: "pro" | "neutral" | "contra" | null;
  evidenceLabel: string;
  evidenceTone: "positive" | "warning" | "danger" | "neutral";
  provenance: string | null;
  uncertainty: string | null;
  sourceLinks: DossierWorkspaceSourceLink[];
  questionIds: string[];
  optionIds: string[];
  opposingClaimIds: string[];
  missingPerspectiveIds: string[];
};

export type DossierWorkspaceQuestionStatus =
  | "open"
  | "in_review"
  | "answered"
  | "closed"
  | "unknown";

export type DossierWorkspaceQuestion = {
  id: string;
  text: string;
  status: DossierWorkspaceQuestionStatus;
  statusLabel: string;
  origin: string | null;
  responsibility: string | null;
  lastUpdate: string | null;
  answer: string | null;
  answeredBy: string | null;
  answerCandidates: string[];
  answerReviewLabel: string;
  claimIds: string[];
  sourceLinks: DossierWorkspaceSourceLink[];
  optionIds: string[];
};

export type DossierWorkspaceSource = {
  id: string;
  title: string;
  publisher: string | null;
  href: string | null;
  typeLabel: string;
  language: string;
  dir: "ltr" | "rtl";
  groupLabel: string;
  evidenceStatus: string | null;
  reviewState: "reviewed" | "unreviewed" | "unknown";
  hasContradiction: boolean;
  claimLinks: Array<{
    claimId: string;
    claimTitle: string;
    relation: DossierWorkspaceRelationKind;
    relationLabel: string;
  }>;
  details: string[];
};

export type DossierWorkspaceSourceGroup = {
  key: string;
  label: string;
  sources: DossierWorkspaceSource[];
};

export type DossierWorkspaceOption = {
  id: string;
  label: string;
  claimIds: string[];
};

export type DossierWorkspacePerspective = {
  id: string;
  label: string;
  dimension: string | null;
  claimIds: string[];
};

export type DossierWorkspaceCount = {
  key: string;
  label: string;
  count: number;
  targetId: string | null;
  tone?: "positive" | "warning" | "danger" | "info" | "question" | "participation" | "neutral";
};

export type DossierWorkspaceMetrics = {
  evidence: {
    available: boolean;
    totalClaims: number | null;
    items: DossierWorkspaceCount[];
  };
  perspectives: {
    missingCount: number;
    linkedMissingCount: number;
    coverageAvailable: false;
  };
  questions: DossierWorkspaceCount[];
  sourceTypes: DossierWorkspaceCount[];
  decisions: {
    optionCount: number;
    linkedOptionCount: number;
    questionedOptionCount: number;
    conflictCount: number;
  };
};

export type DossierWorkspaceModel = {
  title: string;
  coreQuestion: string;
  summary: string;
  statusLabel: string;
  updatedAtLabel: string;
  sourceTrustLabel: string;
  language: string;
  dir: "ltr" | "rtl";
  claims: DossierWorkspaceClaim[];
  overviewClaims: DossierWorkspaceClaim[];
  positions: {
    pro: DossierWorkspaceClaim[];
    neutral: DossierWorkspaceClaim[];
    contra: DossierWorkspaceClaim[];
  };
  sources: DossierWorkspaceSource[];
  sourceGroups: DossierWorkspaceSourceGroup[];
  questions: DossierWorkspaceQuestion[];
  options: DossierWorkspaceOption[];
  perspectives: DossierWorkspacePerspective[];
  conflicts: string[];
  graphAvailable: boolean;
  metrics: DossierWorkspaceMetrics;
  securedCount: number | null;
  disputedCount: number | null;
  missingItems: string[];
};

const SOURCE_LABELS: Record<string, string> = {
  gov: "Behörde oder Verwaltung",
  research: "Forschung",
  media: "Redaktionelles Medium",
  community: "Zivilgesellschaft oder Beteiligung",
  other: "Weitere Quelle",
  academic: "Forschung",
  policy: "Policy",
  city_report: "Kommunaler Bericht",
  evaluation: "Evaluation",
  survey: "Umfrage",
  legal_framework: "Rechtsrahmen",
};

const QUESTION_STATUS_LABELS: Record<DossierWorkspaceQuestionStatus, string> = {
  open: "Offen",
  in_review: "In Prüfung",
  answered: "Beantwortet dokumentiert",
  closed: "Abgeschlossen",
  unknown: "Status nicht verfügbar",
};

const SOURCE_CLUSTER_LABELS: Record<string, string> = {
  air_quality: "Luftqualität",
  traffic_displacement: "Verkehrsverlagerung",
  logistics: "Logistik",
  accessibility: "Barrierefreiheit und Zugang",
  economics: "Ökonomie",
  micromobility: "Mikromobilität",
  participation: "Beteiligung",
  governance: "Governance",
};

type SourceMatrixEntry = {
  title?: string;
  canonicalUrl?: string;
  cluster?: string;
  takeaway?: string;
  notAutomatic?: string;
  evidenceStatus?: string;
  transferability?: string;
  criticalCaveat?: string;
};

type PresentationQuestion = ReturnType<typeof getPresentation>["openQuestions"][number] & {
  answeredByName?: string;
  answeredByRole?: string;
  claimIds?: string[];
  sourceIds?: string[];
  findingIds?: string[];
  optionIds?: string[];
  answerCandidates?: string[];
};

function clean(value: string | null | undefined) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map(clean).filter((value): value is string => Boolean(value))));
}

function uniqueIds(values: Array<string | null | undefined>) {
  return unique(values);
}

function normalizeToken(value: string | null | undefined) {
  return String(value ?? "").trim().toLocaleLowerCase("de");
}

export function getContentDirection(language: string | null | undefined): "ltr" | "rtl" {
  const primary = String(language ?? "").trim().toLowerCase().split(/[-_]/)[0];
  return ["ar", "fa", "he", "ur"].includes(primary) ? "rtl" : "ltr";
}

function formatDate(value: string | null | undefined) {
  const normalized = clean(value);
  if (!normalized) return "Kein Update-Zeitpunkt ausgewiesen";
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return normalized;
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function sourceTypeLabel(source: Dossier["sourceSet"][number]) {
  const key = source.sourceType ?? source.sourceClass ?? "other";
  return SOURCE_LABELS[key] ?? key;
}

function publicSourceHref(value: string | null | undefined) {
  const normalized = clean(value);
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function readSourceMatrix(dossier: Dossier) {
  const note = dossier.analyze.notes.find(
    (item) => item.id === "note-source-matrix" && item.kind === "context",
  );
  if (!note?.text) return [] as SourceMatrixEntry[];
  try {
    const parsed = JSON.parse(note.text) as { entries?: SourceMatrixEntry[] };
    return Array.isArray(parsed.entries) ? parsed.entries : [];
  } catch {
    return [] as SourceMatrixEntry[];
  }
}

function normalizeQuestionStatus(
  value: string | null | undefined,
): DossierWorkspaceQuestionStatus {
  switch (value) {
    case "open":
    case "offen":
      return "open";
    case "in_review":
    case "in_pruefung":
    case "delegiert":
      return "in_review";
    case "answered":
    case "beantwortet":
      return "answered";
    case "closed":
      return "closed";
    default:
      return "unknown";
  }
}

function normalizeRelation(value: string | null | undefined): DossierWorkspaceRelationKind {
  if (value === "supports") return "supports";
  if (value === "contradicts" || value === "refutes") return "contradicts";
  if (value === "mentions") return "mentions";
  return "unclear";
}

function relationLabel(value: DossierWorkspaceRelationKind) {
  if (value === "supports") return "stützt";
  if (value === "contradicts") return "widerspricht";
  if (value === "mentions") return "ordnet ein";
  return "bleibt ungeklärt";
}

function sourceReviewState(
  value: string | null | undefined,
): DossierWorkspaceSource["reviewState"] {
  const normalized = normalizeToken(value);
  if (!normalized) return "unknown";
  if (
    normalized.includes("offen") ||
    normalized.includes("ungeprüft") ||
    normalized.includes("ungeprueft") ||
    normalized.includes("unklar") ||
    normalized.includes("plausibel")
  ) {
    return "unreviewed";
  }
  if (
    normalized.includes("belegt") ||
    normalized.includes("geprüft") ||
    normalized.includes("geprueft")
  ) {
    return "reviewed";
  }
  return "unknown";
}

function addToMap(map: Map<string, string[]>, key: string, value: string) {
  map.set(key, uniqueIds([...(map.get(key) ?? []), value]));
}

export function buildDossierWorkspaceModel(
  dossier: Dossier,
  sourceStatusLabel?: string | null,
): DossierWorkspaceModel {
  const { meta, analyze } = dossier;
  const presentation = getPresentation(dossier);
  const language = clean(analyze.language) ?? "de";
  const sourceMatrix = readSourceMatrix(dossier);
  const graphNodes = analyze.evidenceGraph?.nodes ?? [];
  const graphSourceNodes = graphNodes.filter((node) => node.type === "evidence");
  const matchedGraphSourceIds = new Set<string>();

  const sources: DossierWorkspaceSource[] = dossier.sourceSet.map((source, index) => {
    const graphNode = graphSourceNodes.find(
      (node) =>
        clean(node.url) === clean(source.canonicalUrl) ||
        normalizeToken(node.label) === normalizeToken(source.title),
    );
    if (graphNode) matchedGraphSourceIds.add(graphNode.id);
    const matrixEntry = sourceMatrix.find(
      (entry) =>
        clean(entry.canonicalUrl) === clean(source.canonicalUrl) ||
        clean(entry.title) === clean(source.title),
    );
    const groupKey = clean(matrixEntry?.cluster) ?? source.sourceType ?? source.sourceClass ?? "other";
    return {
      id: graphNode?.id ?? `source-${index + 1}`,
      title: clean(source.title) ?? clean(graphNode?.label) ?? clean(source.publisher) ?? "Quelle",
      publisher: clean(source.publisher) ?? clean(graphNode?.publisher),
      href: publicSourceHref(source.canonicalUrl) ?? publicSourceHref(graphNode?.url),
      typeLabel: sourceTypeLabel(source),
      language,
      dir: getContentDirection(language),
      groupLabel: SOURCE_CLUSTER_LABELS[groupKey] ?? sourceTypeLabel(source),
      evidenceStatus: clean(matrixEntry?.evidenceStatus),
      reviewState: sourceReviewState(matrixEntry?.evidenceStatus),
      hasContradiction: false,
      claimLinks: [],
      details: unique([
        matrixEntry?.takeaway ? `Mitnahme: ${matrixEntry.takeaway}` : null,
        matrixEntry?.notAutomatic
          ? `Nicht automatisch ableitbar: ${matrixEntry.notAutomatic}`
          : null,
        matrixEntry?.evidenceStatus ? `Evidenzstatus: ${matrixEntry.evidenceStatus}` : null,
        matrixEntry?.transferability
          ? `Übertragbarkeit: ${matrixEntry.transferability}`
          : null,
        matrixEntry?.criticalCaveat
          ? `Kritischer Hinweis: ${matrixEntry.criticalCaveat}`
          : null,
        source.timeRange ? `Zeitraum: ${source.timeRange}` : null,
        source.location ? `Ort: ${source.location}` : null,
        source.audience ? `Bezugsgruppe: ${source.audience}` : null,
        ...(source.assumptions ?? []).map((item) => `Hinweis: ${item}`),
        source.conflicts ? `Interessenkontext: ${source.conflicts}` : null,
      ]),
    };
  });

  for (const node of graphSourceNodes) {
    if (matchedGraphSourceIds.has(node.id)) continue;
    const sourceClass = clean(node.sourceClass) ?? "other";
    sources.push({
      id: node.id,
      title: node.label,
      publisher: clean(node.publisher),
      href: publicSourceHref(node.url),
      typeLabel: SOURCE_LABELS[sourceClass] ?? sourceClass,
      language,
      dir: getContentDirection(language),
      groupLabel: SOURCE_LABELS[sourceClass] ?? sourceClass,
      evidenceStatus: null,
      reviewState: "unknown",
      hasContradiction: false,
      claimLinks: [],
      details: [],
    });
  }

  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const sourceIds = new Set(sourceById.keys());
  const claimIds = new Set(analyze.claims.map((claim) => claim.id));
  const sourceLinksByClaim = new Map<string, DossierWorkspaceSourceLink[]>();

  function addSourceLink(
    claimId: string,
    sourceId: string,
    relation: DossierWorkspaceRelationKind,
  ) {
    if (!claimIds.has(claimId) || !sourceIds.has(sourceId)) return;
    const current = sourceLinksByClaim.get(claimId) ?? [];
    const key = `${sourceId}:${relation}`;
    if (current.some((item) => `${item.sourceId}:${item.relation}` === key)) return;
    current.push({ sourceId, relation, relationLabel: relationLabel(relation) });
    sourceLinksByClaim.set(claimId, current);
  }

  for (const edge of analyze.evidenceGraph?.edges ?? []) {
    if (claimIds.has(edge.from) && sourceIds.has(edge.to)) {
      addSourceLink(edge.from, edge.to, normalizeRelation(edge.kind));
    } else if (claimIds.has(edge.to) && sourceIds.has(edge.from)) {
      addSourceLink(edge.to, edge.from, normalizeRelation(edge.kind));
    }
  }
  const findingById = new Map((analyze.findings ?? []).map((finding) => [finding.id, finding]));
  for (const finding of analyze.findings ?? []) {
    addSourceLink(finding.claimId, finding.sourceId, normalizeRelation(finding.finding));
  }

  const optionsById = new Map<string, DossierWorkspaceOption>();
  const optionIdsByClaim = new Map<string, string[]>();

  function addOption(optionId: string, label: string, claimId?: string | null) {
    if (!clean(optionId) || !clean(label)) return;
    const previous = optionsById.get(optionId);
    const nextClaimIds = uniqueIds([...(previous?.claimIds ?? []), claimId]);
    optionsById.set(optionId, { id: optionId, label, claimIds: nextClaimIds });
    if (claimId && claimIds.has(claimId)) addToMap(optionIdsByClaim, claimId, optionId);
  }

  for (const claim of analyze.claims) {
    for (const option of claim.debateFrame?.options ?? []) {
      addOption(option.id, option.label, claim.id);
    }
  }
  for (const option of presentation.presentation.options ?? []) {
    if (option.touchesStatements?.length) {
      for (const claimId of option.touchesStatements) addOption(option.id, option.label, claimId);
    } else {
      addOption(option.id, option.label);
    }
  }

  const opposingClaims = new Map<string, string[]>();
  for (const tree of analyze.decisionTrees ?? []) {
    const branches = [
      tree.options.pro,
      ...(tree.options.neutral ? [tree.options.neutral] : []),
      tree.options.contra,
    ];
    for (const branch of branches) {
      addOption(branch.id, branch.label, tree.rootStatementId);
    }
    const proClaimId = tree.options.pro.statementId;
    const contraClaimId = tree.options.contra.statementId;
    if (claimIds.has(proClaimId) && claimIds.has(contraClaimId)) {
      addToMap(opposingClaims, proClaimId, contraClaimId);
      addToMap(opposingClaims, contraClaimId, proClaimId);
    }
  }

  const presentationQuestions = presentation.openQuestions as PresentationQuestion[];
  const rawQuestions: PresentationQuestion[] = presentationQuestions.length
    ? presentationQuestions
    : analyze.questions.map((question) => ({
        id: question.id,
        text: question.text,
        responsible: clean(question.dimension) ?? undefined,
      }));
  const questions: DossierWorkspaceQuestion[] = rawQuestions.map((question) => {
    const directClaimIds = uniqueIds([
      ...(question.claimIds ?? []),
      claimIds.has(question.id) ? question.id : null,
    ]).filter((id) => claimIds.has(id));
    const directSourceIds = uniqueIds(question.sourceIds ?? []).filter((id) => sourceIds.has(id));
    const linkedFindings = uniqueIds(question.findingIds ?? [])
      .map((id) => findingById.get(id))
      .filter((finding): finding is NonNullable<typeof finding> => Boolean(finding));
    const directSourceIdSet = new Set(directSourceIds);
    const findingSourceLinks = linkedFindings
      .filter((finding) => sourceIds.has(finding.sourceId))
      .map((finding) => {
        const relation = normalizeRelation(finding.finding);
        return {
          sourceId: finding.sourceId,
          relation,
          relationLabel: relationLabel(relation),
        } satisfies DossierWorkspaceSourceLink;
      });
    const sourcesWithConcreteFinding = new Set(
      findingSourceLinks
        .filter(
          (link) =>
            link.relation === "supports" || link.relation === "contradicts",
        )
        .map((link) => link.sourceId),
    );
    const questionSourceLinks: DossierWorkspaceSourceLink[] = [];
    for (const sourceId of directSourceIds) {
      if (sourcesWithConcreteFinding.has(sourceId)) continue;
      questionSourceLinks.push({
        sourceId,
        relation: "unclear",
        relationLabel: "zur Prüfung zugeordnet",
      });
    }
    for (const link of findingSourceLinks) {
      const isConcrete =
        link.relation === "supports" || link.relation === "contradicts";
      if (sourcesWithConcreteFinding.has(link.sourceId) && !isConcrete) continue;
      if (
        directSourceIdSet.has(link.sourceId) &&
        !sourcesWithConcreteFinding.has(link.sourceId)
      ) {
        continue;
      }
      if (
        questionSourceLinks.some(
          (item) =>
            item.sourceId === link.sourceId && item.relation === link.relation,
        )
      ) {
        continue;
      }
      questionSourceLinks.push(link);
    }
    const optionIds = uniqueIds(question.optionIds ?? []).filter((id) => optionsById.has(id));
    const status = normalizeQuestionStatus(question.status);
    const answer = clean(question.resolution);
    const answerCandidates = unique([
      ...(question.answerCandidates ?? []),
      ...linkedFindings.map((finding) => finding.rationale),
    ]);
    return {
      id: question.id,
      text: question.text,
      status,
      statusLabel: QUESTION_STATUS_LABELS[status],
      origin: clean(question.sourceNote),
      responsibility: clean(question.responsible),
      lastUpdate: clean(question.lastUpdate) ? formatDate(question.lastUpdate) : null,
      answer,
      answeredBy: unique([question.answeredByName, question.answeredByRole]).join(" · ") || null,
      answerCandidates,
      answerReviewLabel: answer
        ? status === "answered"
          ? "Antwort ist dokumentiert; sie gilt nicht automatisch als fachlich geprüft."
          : "Antworttext ist ein Kandidat und noch nicht als beantwortet bestätigt."
        : answerCandidates.length
          ? "Antwortkandidaten sind vorhanden, aber noch nicht geprüft."
          : "Noch keine Antwort dokumentiert.",
      claimIds: directClaimIds,
      sourceLinks: questionSourceLinks,
      optionIds,
    };
  });
  const questionIdsByClaim = new Map<string, string[]>();
  for (const question of questions) {
    for (const claimId of question.claimIds) addToMap(questionIdsByClaim, claimId, question.id);
  }

  const perspectives: DossierWorkspacePerspective[] = (analyze.missingPerspectives ?? []).map(
    (perspective, index) => {
      const dimension = clean(perspective.dimension);
      const perspectiveClaimIds = dimension
        ? analyze.claims
            .filter((claim) => {
              const candidates = [
                claim.domain,
                ...(claim.domains ?? []),
                claim.topic,
              ].map(normalizeToken);
              return candidates.includes(normalizeToken(dimension));
            })
            .map((claim) => claim.id)
        : [];
      return {
        id: clean(perspective.id) ?? `perspective-${index + 1}`,
        label: perspective.text,
        dimension,
        claimIds: perspectiveClaimIds,
      };
    },
  );
  const perspectiveIdsByClaim = new Map<string, string[]>();
  for (const perspective of perspectives) {
    for (const claimId of perspective.claimIds) {
      addToMap(perspectiveIdsByClaim, claimId, perspective.id);
    }
  }

  const findingsByClaim = new Map<string, Dossier["analyze"]["findings"]>();
  for (const finding of analyze.findings ?? []) {
    findingsByClaim.set(finding.claimId, [
      ...(findingsByClaim.get(finding.claimId) ?? []),
      finding,
    ]);
  }

  const claims = analyze.claims.map((claim): DossierWorkspaceClaim => {
    const findings = findingsByClaim.get(claim.id) ?? [];
    const sourceLinks = sourceLinksByClaim.get(claim.id) ?? [];
    const hasSupport = sourceLinks.some((link) => link.relation === "supports");
    const hasContradiction = sourceLinks.some((link) => link.relation === "contradicts");
    const hasUnclear = sourceLinks.some(
      (link) => link.relation === "unclear" || link.relation === "mentions",
    );
    const sourceLabels = unique(
      sourceLinks.map((link) => sourceById.get(link.sourceId)?.publisher ?? sourceById.get(link.sourceId)?.title),
    );
    const rationale = unique(findings.map((finding) => finding.rationale));
    const evidenceLabel = hasContradiction
      ? "Widerspruch dokumentiert"
      : hasUnclear
        ? "Quellenlage ungeklärt"
        : hasSupport
          ? "Durch Befund gestützt"
          : analyze.evidenceGraph
            ? "Noch ohne verknüpften Befund"
            : "Belegstatus nicht verfügbar";

    return {
      id: claim.id,
      text: claim.text,
      title: clean(claim.title) ?? claim.text,
      stance: claim.stance ?? null,
      evidenceLabel,
      evidenceTone: hasContradiction
        ? "danger"
        : hasUnclear
          ? "warning"
          : hasSupport
            ? "positive"
            : "neutral",
      provenance: sourceLabels.length ? sourceLabels.join(", ") : null,
      uncertainty: rationale.length ? rationale.join(" ") : null,
      sourceLinks,
      questionIds: questionIdsByClaim.get(claim.id) ?? [],
      optionIds: optionIdsByClaim.get(claim.id) ?? [],
      opposingClaimIds: opposingClaims.get(claim.id) ?? [],
      missingPerspectiveIds: perspectiveIdsByClaim.get(claim.id) ?? [],
    };
  });
  for (const claim of claims) {
    if (claim.stance !== "pro" && claim.stance !== "contra") continue;
    const opposite = claim.stance === "pro" ? "contra" : "pro";
    const sharedOptionIds = new Set(claim.optionIds);
    for (const candidate of claims) {
      if (candidate.stance !== opposite) continue;
      if (!candidate.optionIds.some((id) => sharedOptionIds.has(id))) continue;
      claim.opposingClaimIds = uniqueIds([...claim.opposingClaimIds, candidate.id]);
    }
  }

  for (const source of sources) {
    source.claimLinks = claims.flatMap((claim) =>
      claim.sourceLinks
        .filter((link) => link.sourceId === source.id)
        .map((link) => ({
          claimId: claim.id,
          claimTitle: claim.title,
          relation: link.relation,
          relationLabel: link.relationLabel,
        })),
    );
    source.hasContradiction = source.claimLinks.some(
      (link) => link.relation === "contradicts",
    );
  }

  const sourceGroups = Array.from(
    sources.reduce((groups, source) => {
      const list = groups.get(source.groupLabel) ?? [];
      list.push(source);
      groups.set(source.groupLabel, list);
      return groups;
    }, new Map<string, DossierWorkspaceSource[]>()),
  ).map(([label, groupedSources]) => ({
    key: label.toLowerCase().replace(/[^a-z0-9äöüß]+/gi, "-"),
    label,
    sources: groupedSources,
  }));

  const overviewClaims = [...claims]
    .sort((left, right) => {
      const leftClaim = analyze.claims.find((claim) => claim.id === left.id);
      const rightClaim = analyze.claims.find((claim) => claim.id === right.id);
      return (rightClaim?.importance ?? 0) - (leftClaim?.importance ?? 0);
    })
    .slice(0, 8);
  const positions = {
    pro: claims.filter((claim) => claim.stance === "pro"),
    neutral: claims.filter((claim) => claim.stance === "neutral" || claim.stance === null),
    contra: claims.filter((claim) => claim.stance === "contra"),
  };
  const graphAvailable =
    (analyze.evidenceGraph?.edges.length ?? 0) > 0 ||
    claims.some(
      (claim) =>
        claim.questionIds.length > 0 ||
        claim.optionIds.length > 0 ||
        claim.opposingClaimIds.length > 0 ||
        claim.missingPerspectiveIds.length > 0,
    ) ||
    perspectives.length > 0;
  const securedCount = analyze.evidenceGraph
    ? claims.filter((claim) => claim.sourceLinks.some((link) => link.relation === "supports")).length
    : null;
  const disputedCount = analyze.evidenceGraph
    ? claims.filter((claim) =>
        claim.sourceLinks.some(
          (link) => link.relation === "contradicts" || link.relation === "unclear",
        ),
      ).length
    : null;
  const missingItems = unique([
    ...perspectives.map((item) => item.label),
    ...(analyze.report.openQuestions ?? []),
  ]);
  const evidenceItems: DossierWorkspaceCount[] = analyze.evidenceGraph
    ? [
        {
          key: "supported",
          label: "Mit stützender Quelle",
          count: securedCount ?? 0,
          tone: "positive",
          targetId:
            claims.find((claim) =>
              claim.sourceLinks.some((link) => link.relation === "supports"),
            )?.id ?? null,
        },
        {
          key: "disputed",
          label: "Widersprochen oder ungeklärt",
          count: disputedCount ?? 0,
          tone: "danger",
          targetId:
            claims.find((claim) =>
              claim.sourceLinks.some(
                (link) => link.relation === "contradicts" || link.relation === "unclear",
              ),
            )?.id ?? null,
        },
        {
          key: "unlinked",
          label: "Ohne Quellenbezug",
          count: claims.filter((claim) => claim.sourceLinks.length === 0).length,
          tone: "neutral",
          targetId: claims.find((claim) => claim.sourceLinks.length === 0)?.id ?? null,
        },
      ]
    : [];
  const questionStatusOrder: DossierWorkspaceQuestionStatus[] = [
    "open",
    "in_review",
    "answered",
    "closed",
    "unknown",
  ];
  const questionMetrics = questionStatusOrder
    .map((status) => ({
      key: status,
      label: QUESTION_STATUS_LABELS[status],
      count: questions.filter((question) => question.status === status).length,
      tone:
        status === "closed"
          ? ("positive" as const)
          : status === "answered"
            ? ("info" as const)
          : status === "in_review"
            ? ("warning" as const)
            : status === "open"
              ? ("question" as const)
              : ("neutral" as const),
      targetId: questions.find((question) => question.status === status)?.id ?? null,
    }))
    .filter((item) => item.count > 0);
  const sourceTypeMetrics = Array.from(
    sources.reduce((map, source) => {
      const current = map.get(source.typeLabel) ?? { count: 0, targetId: source.id };
      current.count += 1;
      map.set(source.typeLabel, current);
      return map;
    }, new Map<string, { count: number; targetId: string }>()),
  ).map(([label, value]) => ({
    key: label,
    label,
    count: value.count,
    targetId: value.targetId,
    tone: "info" as const,
  }));
  const coreQuestion =
    clean(presentation.presentation.topic?.label) ??
    clean(analyze.questions[0]?.text) ??
    clean(analyze.sourceText) ??
    meta.title;

  return {
    title: meta.title,
    coreQuestion,
    summary:
      clean(analyze.report.summary) ??
      clean(analyze.sourceText) ??
      "Keine Zusammenfassung hinterlegt.",
    statusLabel: STATUS_LABELS[meta.status] ?? meta.status,
    updatedAtLabel: formatDate(meta.updatedAt ?? meta.createdAt),
    sourceTrustLabel:
      clean(sourceStatusLabel) ??
      (sources.length
        ? `${sources.length} Quellen im Dossier; kein gesonderter Prüfstatus ausgewiesen`
        : "Keine Quellen hinterlegt"),
    language,
    dir: getContentDirection(language),
    claims,
    overviewClaims,
    positions,
    sources,
    sourceGroups,
    questions,
    options: Array.from(optionsById.values()),
    perspectives,
    conflicts: analyze.report.keyConflicts ?? [],
    graphAvailable,
    metrics: {
      evidence: {
        available: Boolean(analyze.evidenceGraph),
        totalClaims: analyze.evidenceGraph ? claims.length : null,
        items: evidenceItems,
      },
      perspectives: {
        missingCount: perspectives.length,
        linkedMissingCount: perspectives.filter((perspective) => perspective.claimIds.length > 0)
          .length,
        coverageAvailable: false,
      },
      questions: questionMetrics,
      sourceTypes: sourceTypeMetrics,
      decisions: {
        optionCount: optionsById.size,
        linkedOptionCount: Array.from(optionsById.values()).filter(
          (option) => option.claimIds.length > 0,
        ).length,
        questionedOptionCount: Array.from(optionsById.values()).filter((option) =>
          questions.some((question) => question.optionIds.includes(option.id)),
        ).length,
        conflictCount: analyze.report.keyConflicts?.length ?? 0,
      },
    },
    securedCount,
    disputedCount,
    missingItems,
  };
}
