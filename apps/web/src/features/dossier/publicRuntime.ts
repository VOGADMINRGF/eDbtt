import type {
  Dossier,
  DossierClaimDoc,
  DossierDoc,
  DossierFindingDoc,
  DossierSourceDoc,
  OpenQuestionDoc,
} from "@features/dossier";
import {
  dossierClaimsCol,
  dossierFindingsCol,
  dossierSourcesCol,
  dossiersCol,
  openQuestionsCol,
} from "@features/dossier/db";
import { buildDossierUpdateReadModel, type DossierPublicUpdateContext } from "@features/dossier/updateReadModel";
import {
  getAnyDossierPublicationRecordByDossierId,
  getPublishedDossierPublicationRecordByDossierId,
  listPublishedDossierPublicationRecords,
} from "@/features/create/dossierPublishWorkflowServer";
import {
  stripDossierInternalFieldsForPublic,
  type DossierPublicationRecord,
} from "@/features/create/dossierPublishWorkflow";

export type PublicDossierRuntimeItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  updatedAt: string;
  source: "runtime";
};

export type PublicDossierRuntimeDetail = {
  id: string;
  slug: string;
  dossier: Dossier;
  updateContext: DossierPublicUpdateContext | null;
  materialLinks: [];
  source: "runtime";
};

type AnalyzeClaim = Dossier["analyze"]["claims"][number];
type AnalyzeQuestion = Dossier["analyze"]["questions"][number];
type AnalyzeFinding = Dossier["analyze"]["findings"][number];

function toJurisdiction(
  value: string | null | undefined,
): Dossier["meta"]["jurisdiction"] {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized.includes("bund")) return "federal";
  if (normalized.includes("land")) return "state";
  if (normalized.includes("eu")) return "eu";
  if (normalized.includes("global")) return "global";
  return "municipal";
}

function mapClaim(claim: DossierClaimDoc): AnalyzeClaim {
  return {
    id: claim.claimId,
    text: claim.text,
    title: claim.text,
    topic: null,
    domain: null,
    domains: null,
    responsibility: null,
    importance: null,
    stance: null,
    statementType:
      claim.kind === "fact"
        ? "fact"
        : claim.kind === "value"
          ? "value"
          : claim.kind === "question"
            ? "question"
            : "interpretation",
  };
}

function mapQuestion(question: OpenQuestionDoc): AnalyzeQuestion {
  return {
    id: question.questionId,
    text: question.text,
    dimension: question.responsibility?.label ?? null,
  };
}

function mapFinding(finding: DossierFindingDoc): AnalyzeFinding {
  return {
    id: finding.findingId,
    claimId: finding.claimId,
    sourceId: finding.citations[0]?.sourceId ?? "unknown-source",
    finding:
      finding.verdict === "supports"
        ? "supports"
        : finding.verdict === "refutes"
          ? "contradicts"
          : "unclear",
    rationale: finding.rationale.join(" "),
    excerptRef:
      finding.citations[0]?.locator ?? finding.citations[0]?.quote ?? undefined,
  };
}

function mapSource(source: DossierSourceDoc): Dossier["sourceSet"][number] {
  return {
    canonicalUrl: source.url,
    host: new URL(source.url).host,
    publisher: source.publisher,
    sourceClass:
      source.type === "official"
        ? "gov"
        : source.type === "research"
          ? "research"
          : source.type === "quality_media"
            ? "media"
            : source.type === "stakeholder"
              ? "community"
              : "other",
    sourceType:
      source.type === "official"
        ? "gov"
        : source.type === "research"
          ? "research"
          : source.type === "quality_media"
            ? "media"
            : source.type === "stakeholder"
              ? "community"
              : "other",
    timeRange: source.publishedAt ? new Date(source.publishedAt).toISOString().slice(0, 10) : undefined,
    location: undefined,
    audience: undefined,
    assumptions: source.licenseNote ? [source.licenseNote] : undefined,
    fetchedAt: source.retrievedAt ? new Date(source.retrievedAt).toISOString() : undefined,
    title: source.title,
  };
}

export function mapDossierToPublicDossier(input: {
  publication: DossierPublicationRecord;
  dossierDoc: DossierDoc | null;
  claims: DossierClaimDoc[];
  sources: DossierSourceDoc[];
  findings: DossierFindingDoc[];
  openQuestions: OpenQuestionDoc[];
}): Dossier {
  const claims = input.claims.map(mapClaim);
  const openQuestions = input.openQuestions.map(mapQuestion);
  const findings = input.findings.map(mapFinding);
  const dossier: Dossier = {
    meta: {
      id: String(input.publication.dossierId),
      title: input.publication.title,
      jurisdiction: toJurisdiction(input.dossierDoc?.title),
      region: undefined,
      status: "published",
      createdAt: input.publication.createdAt,
      updatedAt: input.publication.updatedAt,
    },
    analyze: {
      mode: "E150",
      sourceText: input.publication.summary,
      language: "de",
      claims,
      findings,
      notes: [
        {
          id: `note-publication-${input.publication.sourceHandoffId}`,
          kind: "context",
          text: "Freigabe bedeutet Veröffentlichung, nicht Wahrheitszertifikat.",
        },
        {
          id: `note-sources-${input.publication.sourceHandoffId}`,
          kind: "context",
          text: "Quellen bleiben prüfbare Belege und Kontext, keine automatische Verifikation.",
        },
        {
          id: `note-guardrails-${input.publication.sourceHandoffId}`,
          kind: "context",
          text: "Dossier-Veröffentlichung erzeugt keinen Graph Merge und keinen Anlassraum.",
        },
      ],
      questions: openQuestions,
      missingPerspectives: [],
      knots: input.publication.topicReferences.map((topic, index) => ({
        id: `topic-${index + 1}`,
        label: topic,
        description: `Themenbezug: ${topic}`,
      })),
      consequences: {
        consequences: [],
        responsibilities: [],
      },
      responsibilityPaths: [],
      eventualities: [],
      decisionTrees: [],
      impactAndResponsibility: {
        impacts: [],
        responsibleActors: [],
      },
      participationCandidates: [],
      report: {
        summary: input.publication.summary,
        keyConflicts: input.publication.argumentLines.slice(0, 4),
        facts: {
          local: claims.slice(0, 4).map((claim) => claim.text),
          international: [],
        },
        openQuestions: openQuestions.map((question) => question.text),
        takeaways: [
          "Veröffentlichung bedeutet keinen Wahrheitsbeweis.",
          "Quellen bleiben Einordnung und prüfbarer Kontext.",
        ],
      },
    } as Dossier["analyze"],
    sourceSet: input.sources.map(mapSource),
  };

  return stripDossierInternalFieldsForPublic(dossier);
}

export async function listPublishedDossiers(limit = 40) {
  const records = await listPublishedDossierPublicationRecords(limit);
  return records.map((record): PublicDossierRuntimeItem => ({
    id: String(record.dossierId),
    slug: String(record.dossierId),
    title: record.title,
    summary: record.summary,
    updatedAt: record.updatedAt,
    source: "runtime",
  }));
}

export async function getPublishedDossierBySlugOrId(slugOrId: string) {
  const publication = await getPublishedDossierPublicationRecordByDossierId(slugOrId);
  if (!publication) return null;

  const [dossierDoc, claims, sources, findings, openQuestions, updateReadModel] =
    await Promise.all([
      (await dossiersCol()).findOne({ dossierId: String(publication.dossierId) } as any),
      (await dossierClaimsCol())
        .find({ dossierId: String(publication.dossierId) })
        .sort({ createdAt: 1 })
        .toArray(),
      (await dossierSourcesCol())
        .find({ dossierId: String(publication.dossierId) })
        .sort({ publishedAt: -1, createdAt: -1 })
        .toArray(),
      (await dossierFindingsCol())
        .find({ dossierId: String(publication.dossierId) })
        .sort({ updatedAt: -1 })
        .toArray(),
      (await openQuestionsCol())
        .find({ dossierId: String(publication.dossierId) })
        .sort({ status: 1, createdAt: 1 })
        .toArray(),
      buildDossierUpdateReadModel({
        dossierId: String(publication.dossierId),
        materialize: true,
        publicVisible: true,
      }).catch(() => null),
    ]);

  const dossier = mapDossierToPublicDossier({
    publication,
    dossierDoc,
    claims,
    sources,
    findings,
    openQuestions,
  });

  return {
    detail: {
      id: String(publication.dossierId),
      slug: String(publication.dossierId),
      dossier,
      updateContext: updateReadModel?.publicContext ?? null,
      materialLinks: [],
      source: "runtime" as const,
    },
    record: publication,
  };
}

export async function getDossierPublicationRuntimeHint(slugOrId: string) {
  return getAnyDossierPublicationRecordByDossierId(slugOrId);
}
