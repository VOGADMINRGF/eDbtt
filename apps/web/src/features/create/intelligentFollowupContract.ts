export type FollowupConfidence = "low" | "medium" | "high";

export type CreateUnderstandingStatementKind =
  | "question"
  | "claim"
  | "demand"
  | "argument"
  | "source"
  | "option"
  | "objection"
  | "hint";

export type CreateUnderstandingResult = {
  summary: string;
  categories: Array<{
    id: string;
    label: string;
    confidence: FollowupConfidence;
  }>;
  topics: Array<{
    id: string;
    label: string;
    confidence: FollowupConfidence;
  }>;
  statements: Array<{
    id: string;
    text: string;
    kind: CreateUnderstandingStatementKind;
    stance: "pro" | "contra" | "mixed" | "open" | "unclear";
    confidence: FollowupConfidence;
    sourceExcerpt?: string;
  }>;
  scopes: Array<"local" | "district" | "municipal" | "state" | "federal" | "eu" | "international" | "unclear">;
  openQuestion?: string | null;
  confidence: FollowupConfidence;
};

export type CreateConnectionSuggestion = {
  id: string;
  kind: "dossier" | "anlassraum" | "vote" | "topic" | "new_anlassraum";
  title: string;
  reason: string;
  confidence: FollowupConfidence;
  href?: string;
  suggestedContributionKind?: string;
  suggestedStance?: "yes" | "no" | "abstain" | "open" | null;
  requiresConfirmation: true;
};

export type CreateIntelligentFollowupResult = {
  understanding: CreateUnderstandingResult;
  suggestions: CreateConnectionSuggestion[];
  sourceText: string;
  generatedAt: string;
  degraded?: boolean;
  degradedReason?: string | null;
};

export function deriveDominantUnderstandingStance(
  understanding: CreateUnderstandingResult,
): "eher dafür" | "eher dagegen" | "offen/unklar" {
  let pro = 0;
  let contra = 0;
  let mixed = 0;
  for (const statement of understanding.statements) {
    if (statement.stance === "pro") pro += 1;
    if (statement.stance === "contra") contra += 1;
    if (statement.stance === "mixed") mixed += 1;
  }
  if (pro > contra && pro >= mixed) return "eher dafür";
  if (contra > pro && contra >= mixed) return "eher dagegen";
  return "offen/unklar";
}
