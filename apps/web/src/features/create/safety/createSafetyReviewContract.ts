import { sanitizeCreateSafetyExcerpt } from "@/features/create/safety/createSafetyLexicon";
import type {
  CreateInputSafetyClarification,
  CreateInputSafetyDecision,
  CreateInputSafetyFactCheckCandidate,
  CreateInputSafetyFinding,
  CreateInputSafetyFindingKind,
  CreateInputSafetySeverity,
} from "@/features/create/safety/createInputSafety";

export type CreateSafetyReviewStatus = "open" | "resolved" | "dismissed";

export type CreateSafetyReviewAction =
  | "allow"
  | "clarify"
  | "review"
  | "redact"
  | "factcheck"
  | "graph_review"
  | "moderate"
  | "block";

export type CreateSafetyReviewCode =
  | "pii_redacted"
  | "threat_blocked"
  | "doxxing_blocked"
  | "self_justice_moderation"
  | "implicit_threat_moderation"
  | "group_abuse_moderation"
  | "third_party_pii_accusation"
  | "unsupported_allegation"
  | "safe_question_proceed"
  | "cross_lingual_review"
  | "insult_revise"
  | "readability_clarify"
  | "quality_clarification_required"
  | "editorial_review_requested"
  | "political_framing_context"
  | "censorship_counterclaim_context"
  | "spam_campaign_clarify";

export type CreateSafetyReviewItem = {
  id: string;
  draftId?: string | null;
  runId?: string | null;
  decision: CreateInputSafetyDecision;
  severity: CreateInputSafetySeverity;
  redactedTextPreview: string;
  findingKinds: CreateInputSafetyFindingKind[];
  blockedReasons: string[];
  factCheckCandidateCount: number;
  graphReviewHintCount: number;
  createdAt: string;
  status: CreateSafetyReviewStatus;
  code: CreateSafetyReviewCode;
  action: CreateSafetyReviewAction;
  summary: string;
  sanitizedExcerpt?: string;
};

type BuildCreateSafetyReviewItemsParams = {
  draftId?: string | null;
  runId?: string | null;
  decision: CreateInputSafetyDecision;
  severity: CreateInputSafetySeverity;
  findings: CreateInputSafetyFinding[];
  redactedText: string;
  factCheckCandidates: CreateInputSafetyFactCheckCandidate[];
  graphReviewHints: string[];
  blockedReasons: string[];
  crossLingualRisk: boolean;
  safeQuestionDetected: boolean;
  hasThirdPartyPii: boolean;
  hasAccusationOrAllegation: boolean;
  hasThreatImplicit: boolean;
  hasGroupAbuse: boolean;
  hasPoliticalFraming: boolean;
  hasCensorshipCounterclaim: boolean;
  hasSpamCampaign: boolean;
  clarifications: CreateInputSafetyClarification[];
  editorialReviewRequested: boolean;
  createdAt: string;
};

function firstFindingExcerpt(
  findings: CreateInputSafetyFinding[],
  kinds: readonly CreateInputSafetyFindingKind[],
): string | undefined {
  const match = findings.find((finding) => kinds.includes(finding.kind));
  const excerpt = typeof match?.excerpt === "string" ? match.excerpt.trim() : "";
  return excerpt || undefined;
}

function firstCandidateExcerpt(candidates: CreateInputSafetyFactCheckCandidate[]): string | undefined {
  const candidate = candidates.find((entry) => entry.text.trim().length > 0);
  return candidate ? sanitizeCreateSafetyExcerpt(candidate.text) : undefined;
}

function previewRedactedText(text: string): string {
  return sanitizeCreateSafetyExcerpt(text, 220);
}

function buildBaseItem(
  params: BuildCreateSafetyReviewItemsParams,
  item: Omit<
    CreateSafetyReviewItem,
    | "id"
    | "draftId"
    | "runId"
    | "decision"
    | "severity"
    | "redactedTextPreview"
    | "blockedReasons"
    | "factCheckCandidateCount"
    | "graphReviewHintCount"
    | "createdAt"
    | "status"
  >,
  index: number,
): CreateSafetyReviewItem {
  return {
    id: `create-safety-review-${index + 1}`,
    draftId: params.draftId ?? null,
    runId: params.runId ?? null,
    decision: params.decision,
    severity: params.severity,
    redactedTextPreview: previewRedactedText(params.redactedText),
    findingKinds: item.findingKinds,
    blockedReasons: [...params.blockedReasons],
    factCheckCandidateCount: params.factCheckCandidates.length,
    graphReviewHintCount: params.graphReviewHints.length,
    createdAt: params.createdAt,
    status: "open",
    ...item,
  };
}

function pushUniqueItem(
  target: CreateSafetyReviewItem[],
  item: CreateSafetyReviewItem,
) {
  const duplicate = target.find(
    (entry) => entry.code === item.code && entry.summary === item.summary && entry.action === item.action,
  );
  if (!duplicate) target.push(item);
}

export function buildCreateSafetyReviewItems(
  params: BuildCreateSafetyReviewItemsParams,
): CreateSafetyReviewItem[] {
  const items: CreateSafetyReviewItem[] = [];
  const findingKinds = new Set(params.findings.map((finding) => finding.kind));

  if (
    findingKinds.has("email") ||
    findingKinds.has("phone") ||
    findingKinds.has("street_address") ||
    findingKinds.has("postal_code")
  ) {
    pushUniqueItem(
      items,
      buildBaseItem(
        params,
        {
          code: "pii_redacted",
          action: "redact",
          summary: "Erkannte Kontakt- oder Adressdaten wurden nur in redigierter Form übernommen.",
          findingKinds: ["email", "phone", "street_address", "postal_code"].filter((kind) =>
            findingKinds.has(kind as CreateInputSafetyFindingKind),
          ) as CreateInputSafetyFindingKind[],
        },
        items.length,
      ),
    );
  }

  if (findingKinds.has("threat_concrete")) {
    pushUniqueItem(
      items,
      buildBaseItem(
        params,
        {
          code: "threat_blocked",
          action: "block",
          summary: "Konkrete Drohung erkannt. Dieser Text darf nicht weiterverarbeitet werden.",
          findingKinds: ["threat_concrete"],
          sanitizedExcerpt: firstFindingExcerpt(params.findings, ["threat_concrete"]),
        },
        items.length,
      ),
    );
  }

  if (findingKinds.has("doxxing")) {
    pushUniqueItem(
      items,
      buildBaseItem(
        params,
        {
          code: "doxxing_blocked",
          action: "block",
          summary: "Doxxing- oder Mobilisierungsaufruf mit Drittpersonenbezug erkannt.",
          findingKinds: ["doxxing", "third_party_call_to_action"],
          sanitizedExcerpt: firstFindingExcerpt(params.findings, ["doxxing", "third_party_call_to_action"]),
        },
        items.length,
      ),
    );
  }

  if (findingKinds.has("self_justice")) {
    pushUniqueItem(
      items,
      buildBaseItem(
        params,
        {
          code: "self_justice_moderation",
          action: "moderate",
          summary: "Selbstjustiz-Sprache erkannt. Vor Weiterverwendung ist Moderation nötig.",
          findingKinds: ["self_justice"],
          sanitizedExcerpt: firstFindingExcerpt(params.findings, ["self_justice"]),
        },
        items.length,
      ),
    );
  }

  if (params.hasThreatImplicit) {
    pushUniqueItem(
      items,
      buildBaseItem(
        params,
        {
          code: "implicit_threat_moderation",
          action: "moderate",
          summary: "Implizite Droh- oder Einschüchterungssprache erkannt. Vor Weiterverwendung moderieren.",
          findingKinds: ["threat_implicit"],
          sanitizedExcerpt: firstFindingExcerpt(params.findings, ["threat_implicit"]),
        },
        items.length,
      ),
    );
  }

  if (params.hasGroupAbuse) {
    pushUniqueItem(
      items,
      buildBaseItem(
        params,
        {
          code: "group_abuse_moderation",
          action: "moderate",
          summary: "Abwertende Sprache gegen Gruppen erkannt. Vor Weiterverwendung moderieren.",
          findingKinds: ["group_abuse"],
          sanitizedExcerpt: firstFindingExcerpt(params.findings, ["group_abuse"]),
        },
        items.length,
      ),
    );
  }

  if (params.hasThirdPartyPii && params.hasAccusationOrAllegation) {
    pushUniqueItem(
      items,
      buildBaseItem(
        params,
        {
          code: "third_party_pii_accusation",
          action: params.decision === "blocked" ? "block" : "moderate",
          summary: "Private Daten Dritter zusammen mit Vorwürfen erkannt. Nur redigiert und moderiert weiterverwenden.",
          findingKinds: ["email", "phone", "street_address", "postal_code", "unsupported_allegation"],
          sanitizedExcerpt:
            firstFindingExcerpt(params.findings, ["unsupported_allegation", "corruption_or_capture_claim"]) ??
            firstCandidateExcerpt(params.factCheckCandidates),
        },
        items.length,
      ),
    );
  }

  if (params.factCheckCandidates.length > 0) {
    pushUniqueItem(
      items,
      buildBaseItem(
        params,
        {
          code: params.safeQuestionDetected ? "safe_question_proceed" : "unsupported_allegation",
          action: params.safeQuestionDetected ? "allow" : "factcheck",
          summary: params.safeQuestionDetected
            ? "Prüffrage erkannt. Die Frage darf weiterlaufen, aber nicht still als gesicherte Tatsache übernommen werden."
            : "Prüfpflichtige Tatsachenbehauptung erkannt. Vor Weiterverwendung Belege oder Quellen ergänzen.",
          findingKinds: Array.from(
            new Set(
              params.factCheckCandidates.flatMap((candidate) => {
                if (candidate.reason === "unverified_number") return ["unverified_number"];
                if (candidate.reason === "corruption_or_capture_claim") return ["corruption_or_capture_claim"];
                if (candidate.reason === "source_bluffing") return ["source_bluffing"];
                return ["unsupported_allegation"];
              }),
            ),
          ) as CreateInputSafetyFindingKind[],
          sanitizedExcerpt: firstCandidateExcerpt(params.factCheckCandidates),
        },
        items.length,
      ),
    );
  }

  if (params.crossLingualRisk) {
    pushUniqueItem(
      items,
      buildBaseItem(
        params,
        {
          code: "cross_lingual_review",
          action: "graph_review",
          summary: "Sprachwechsel erkannt. Cross-lingual Matches nur manuell prüfen, kein stilles Zusammenführen.",
          findingKinds: ["cross_lingual_review"],
        },
        items.length,
      ),
    );
  }

  if (params.clarifications.length > 0) {
    const labels = params.clarifications
      .map((clarification) => {
        if (clarification.kind === "place") return "Ort";
        if (clarification.kind === "timeframe") return "Zeitraum";
        if (clarification.kind === "responsibility") return "Zuständigkeit";
        if (clarification.kind === "source") return "Quelle";
        if (clarification.kind === "requested_action") return "gewünschter nächster Schritt";
        return "gemeintes Subjekt";
      })
      .slice(0, 4);

    pushUniqueItem(
      items,
      buildBaseItem(
        params,
        {
          code: "quality_clarification_required",
          action: "clarify",
          summary: `Vor der Einreichung fehlt noch Kontext zu: ${labels.join(", ")}.`,
          findingKinds: Array.from(
            new Set(
              params.clarifications.flatMap((clarification) => {
                if (clarification.kind === "place") return ["missing_place", "private_address_risk"];
                if (clarification.kind === "timeframe") return ["missing_timeframe"];
                if (clarification.kind === "responsibility") return ["missing_responsibility"];
                if (clarification.kind === "source") return ["missing_source"];
                if (clarification.kind === "requested_action") return ["missing_requested_action"];
                return ["ambiguous_subject"];
              }),
            ),
          ).filter((kind) => findingKinds.has(kind as CreateInputSafetyFindingKind)) as CreateInputSafetyFindingKind[],
        },
        items.length,
      ),
    );
  }

  if (params.editorialReviewRequested) {
    pushUniqueItem(
      items,
      buildBaseItem(
        params,
        {
          code: "editorial_review_requested",
          action: "review",
          summary:
            "Manuelle redaktionelle Prüfung wurde angefragt. Kein automatisches Veröffentlichen oder stilles Finalisieren.",
          findingKinds: ["editorial_review_requested"],
        },
        items.length,
      ),
    );
  }

  if (findingKinds.has("insult_public_actor") || findingKinds.has("insult_private_person")) {
    pushUniqueItem(
      items,
      buildBaseItem(
        params,
        {
          code: "insult_revise",
          action: "clarify",
          summary: "Beleidigende Sprache erkannt. Anliegen besser sachlich und ohne persönliche Angriffe formulieren.",
          findingKinds: ["insult_public_actor", "insult_private_person"].filter((kind) =>
            findingKinds.has(kind as CreateInputSafetyFindingKind),
          ) as CreateInputSafetyFindingKind[],
          sanitizedExcerpt: firstFindingExcerpt(params.findings, [
            "insult_public_actor",
            "insult_private_person",
          ]),
        },
        items.length,
      ),
    );
  }

  if (findingKinds.has("low_readability")) {
    pushUniqueItem(
      items,
      buildBaseItem(
        params,
        {
          code: "readability_clarify",
          action: "clarify",
          summary: "Der Text ist schwer lesbar. Kurze Sätze helfen, blockieren aber den Vorgang nicht.",
          findingKinds: ["low_readability"],
        },
        items.length,
      ),
    );
  }

  if (params.hasPoliticalFraming) {
    pushUniqueItem(
      items,
      buildBaseItem(
        params,
        {
          code: "political_framing_context",
          action: "clarify",
          summary: "Politisches Framing erkannt. Perspektive nicht automatisch als gesicherte Tatsache behandeln.",
          findingKinds: ["political_framing"],
        },
        items.length,
      ),
    );
  }

  if (params.hasCensorshipCounterclaim) {
    pushUniqueItem(
      items,
      buildBaseItem(
        params,
        {
          code: "censorship_counterclaim_context",
          action: "clarify",
          summary: "Zensur-/Gegenframing erkannt. Nicht blockieren, aber als Kontext und nicht als Fakt behandeln.",
          findingKinds: ["censorship_counterclaim"],
        },
        items.length,
      ),
    );
  }

  if (params.hasSpamCampaign) {
    pushUniqueItem(
      items,
      buildBaseItem(
        params,
        {
          code: "spam_campaign_clarify",
          action: "clarify",
          summary: "Kampagnen- oder Brigading-Signal erkannt. Mobilisierung nicht still verstärken.",
          findingKinds: ["spam_campaign"],
        },
        items.length,
      ),
    );
  }

  return items;
}
