import { getCol, ObjectId } from "@core/db/triMongo";
import { anlassraumCol } from "@features/anlassraum/db";
import { dossiersCol } from "@features/dossier/db";
import { listCreateContextPickerItems } from "@/features/create/contextPicker";
import type {
  CreateAnalyzeCtaSuggestion,
  CreateAnalyzeMatchEntityType,
  CreateAnalyzeMatchItem,
  CreateAnalyzeMatchResultInput,
  CreateAnalyzeMatchStrength,
  CreateAnalyzeMatchType,
} from "@/features/create/analyzeContract";

type ResolveCreateGraphMatchesInput = {
  text: string;
  normalizedInputSummary: string;
  claims: unknown[];
  anlassraumId?: string | null;
  topicKey?: string | null;
  dossierId?: string | null;
  locale?: string | null;
  maxMatches?: number;
};

type StatementProposalDoc = {
  _id?: ObjectId;
  text?: string;
  title?: string | null;
  topic?: string | null;
  status?: string | null;
  dossierId?: string | null;
  createdAt?: Date | null;
};

type DossierDocPreview = {
  dossierId?: string;
  title?: string | null;
  status?: string | null;
  updatedAt?: Date | null;
  createdAt?: Date | null;
};

type AnlassraumPreview = {
  id: string;
  title: string;
  summary: string;
  topicKey: string | null;
  source: "context_picker" | "direct_room_lookup";
};

const STOPWORDS = new Set([
  "der",
  "die",
  "das",
  "ein",
  "eine",
  "und",
  "oder",
  "aber",
  "ist",
  "sind",
  "mit",
  "fuer",
  "von",
  "auf",
  "im",
  "in",
  "zu",
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "from",
  "into",
  "eintrag",
  "beitrag",
  "frage",
  "claim",
  "source",
]);

const DEFAULT_MAX_MATCHES = 6;

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  const normalized = normalizeText(value);
  if (!normalized) return [];
  return normalized
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function dedupeStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const normalized = asText(value);
    if (!normalized) continue;
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function jaccardScore(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;
  const aSet = new Set(a);
  const bSet = new Set(b);
  let intersection = 0;
  for (const token of aSet) {
    if (bSet.has(token)) intersection += 1;
  }
  const union = aSet.size + bSet.size - intersection;
  if (union <= 0) return 0;
  return intersection / union;
}

function textSimilarity(left: string, right: string): number {
  const a = normalizeText(left);
  const b = normalizeText(right);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length >= 28 && b.includes(a)) return 0.93;
  if (b.length >= 28 && a.includes(b)) return 0.93;
  const tokenScore = jaccardScore(tokenize(a), tokenize(b));
  return Number(tokenScore.toFixed(4));
}

function strengthFromScore(score: number): CreateAnalyzeMatchStrength {
  if (score >= 0.82) return "high";
  if (score >= 0.62) return "medium";
  if (score >= 0.45) return "low";
  return "none";
}

function claimTexts(claims: unknown[]): string[] {
  const values: string[] = [];
  for (const claim of claims) {
    if (!claim || typeof claim !== "object") continue;
    const raw = claim as Record<string, unknown>;
    values.push(asText(raw.text), asText(raw.title));
  }
  return dedupeStrings(values);
}

function claimTopics(claims: unknown[]): string[] {
  const values: string[] = [];
  for (const claim of claims) {
    if (!claim || typeof claim !== "object") continue;
    const raw = claim as Record<string, unknown>;
    values.push(asText(raw.topic));
  }
  return dedupeStrings(values.map((value) => normalizeText(value)));
}

function makeQueryRegex(text: string, extraTokens: string[]): RegExp | null {
  const merged = dedupeStrings([...tokenize(text), ...extraTokens.map((token) => normalizeText(token))]).slice(0, 8);
  if (merged.length === 0) return null;
  const pattern = merged.map((token) => escapeRegex(token)).join("|");
  if (!pattern) return null;
  return new RegExp(pattern, "i");
}

function rankWeight(match: CreateAnalyzeMatchItem): number {
  const strengthWeight: Record<CreateAnalyzeMatchStrength, number> = {
    high: 400,
    medium: 300,
    low: 200,
    none: 100,
  };
  const typeWeight: Record<CreateAnalyzeMatchType, number> = {
    same_anlassraum: 80,
    duplicate_risk: 75,
    exact_claim: 70,
    related_claim: 60,
    related_dossier: 50,
    no_match: 10,
  };
  return strengthWeight[match.strength] + typeWeight[match.matchType];
}

function dedupeMatches(matches: CreateAnalyzeMatchItem[]): CreateAnalyzeMatchItem[] {
  const seen = new Set<string>();
  const out: CreateAnalyzeMatchItem[] = [];
  for (const match of matches) {
    const key = `${match.matchType}:${match.matchEntityType}:${match.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(match);
  }
  return out;
}

function fallbackNoMatch(args: {
  reason: string;
  sourceState: "ok" | "degraded";
  sourceErrors: string[];
}): CreateAnalyzeMatchResultInput {
  const reasons = [args.reason];
  return {
    matches: [
      {
        id: "no-match",
        matchType: "no_match",
        matchEntityType: "question",
        strength: "none",
        label: "Kein belastbarer Match",
        reason: reasons[0],
        reasons,
        entityId: null,
        targetRef: null,
      },
    ],
    matchStrength: "none",
    matchType: "no_match",
    matchEntityType: "question",
    reasons,
    suggestedCtas: deriveSuggestedCtas({
      matchType: "no_match",
      matchEntityType: "question",
      matchStrength: "none",
    }),
    sourceState: args.sourceState,
    sourceErrors: args.sourceErrors,
  };
}

function deriveSuggestedCtas(input: {
  matchType: CreateAnalyzeMatchType;
  matchEntityType: CreateAnalyzeMatchEntityType;
  matchStrength: CreateAnalyzeMatchStrength;
}): CreateAnalyzeCtaSuggestion[] {
  const pushUnique = (items: CreateAnalyzeCtaSuggestion[], item: CreateAnalyzeCtaSuggestion) => {
    if (items.some((existing) => existing.id === item.id)) return;
    items.push(item);
  };

  const out: CreateAnalyzeCtaSuggestion[] = [];
  if (input.matchType === "no_match") {
    pushUnique(out, {
      id: "neu_anlegen",
      label: "Neu anlegen",
      reason: "Kein belastbarer Match. Ein neuer Strang ist der kanonische Einstieg.",
    });
    pushUnique(out, {
      id: "perspektive_anhaengen",
      label: "Perspektive anhaengen",
      reason: "Optional kann eine Perspektive manuell an einen bestehenden Kontext angehaengt werden.",
    });
    return out;
  }

  if (input.matchType === "same_anlassraum") {
    pushUnique(out, {
      id: "anlassraum_oeffnen",
      label: "Anlassraum oeffnen",
      reason: "Kontext wurde im selben Anlassraum erkannt; manuelle Bestaetigung bleibt erforderlich.",
    });
    pushUnique(out, {
      id: "perspektive_anhaengen",
      label: "Perspektive anhaengen",
      reason: "Ursprung bleibt erhalten; Perspektive wird additiv angehaengt.",
    });
    pushUnique(out, {
      id: "anders_sehen",
      label: "Anders sehen",
      reason: "Gegenposition explizit markieren statt still zu mergen.",
    });
  }

  if (input.matchType === "related_dossier") {
    pushUnique(out, {
      id: "dossier_oeffnen",
      label: "Dossier oeffnen",
      reason: "Dossier-Naehe erkannt; Einlesen vor jeder manuellen Uebernahme.",
    });
    pushUnique(out, {
      id: "perspektive_anhaengen",
      label: "Perspektive anhaengen",
      reason: "Perspektive kann ohne implizites Zusammenfuehren angehaengt werden.",
    });
  }

  if (input.matchType === "duplicate_risk") {
    pushUnique(out, {
      id: "anders_sehen",
      label: "Anders sehen",
      reason: "Moegliches Duplikat erkannt. Bitte manuell pruefen statt automatisch mergen.",
    });
    pushUnique(out, {
      id: "perspektive_anhaengen",
      label: "Perspektive anhaengen",
      reason: "Bei inhaltlicher Naehe als Perspektive fuehren, nicht still zusammenfuehren.",
    });
  }

  if (input.matchType === "exact_claim" || input.matchType === "related_claim") {
    pushUnique(out, {
      id: "zustimmen",
      label: "Zustimmen",
      reason: "Claim-Naehe erkannt. Zustimmung ist ein manueller Schritt, kein Publish-Ersatz.",
    });
    pushUnique(out, {
      id: "anders_sehen",
      label: "Anders sehen",
      reason: "Explizite Gegenposition bleibt eigenstaendig nachvollziehbar.",
    });
    pushUnique(out, {
      id: "perspektive_anhaengen",
      label: "Perspektive anhaengen",
      reason: "Claim kann um Perspektiven erweitert werden, ohne Ursprung zu loeschen.",
    });
  }

  if (input.matchEntityType === "anlassraum") {
    pushUnique(out, {
      id: "anlassraum_oeffnen",
      label: "Anlassraum oeffnen",
      reason: "Treffer liegt im Anlassraum-Kontext und bleibt manuell zu bestaetigen.",
    });
  }
  if (input.matchEntityType === "dossier") {
    pushUnique(out, {
      id: "dossier_oeffnen",
      label: "Dossier oeffnen",
      reason: "Treffer liegt in Dossier-Naehe; manuelles Einlesen vor weiterer Aktion.",
    });
  }

  pushUnique(out, {
    id: "neu_anlegen",
    label: "Neu anlegen",
    reason: "Unabhaengiger neuer Strang bleibt jederzeit moeglich.",
  });

  return out;
}

export async function resolveCreateGraphMatches(
  input: ResolveCreateGraphMatchesInput,
): Promise<CreateAnalyzeMatchResultInput> {
  const sourceErrors: string[] = [];
  const matches: CreateAnalyzeMatchItem[] = [];
  const maxMatches = Math.max(1, Math.min(12, Number(input.maxMatches ?? DEFAULT_MAX_MATCHES)));

  const summary = asText(input.normalizedInputSummary) || asText(input.text);
  const textNormalized = normalizeText(summary);
  const textTokens = tokenize(summary);
  const claimTextCandidates = claimTexts(input.claims);
  const topicCandidates = dedupeStrings([
    normalizeText(asText(input.topicKey)),
    ...claimTopics(input.claims),
  ]).filter(Boolean);
  const queryRegex = makeQueryRegex(summary, [...topicCandidates, ...claimTextCandidates]);

  let contextItems: AnlassraumPreview[] = [];
  let explicitRoomLoaded = false;
  try {
    const raw = await listCreateContextPickerItems({ limit: 80 });
    contextItems = raw.map((item) => ({
      id: item.anlassraumId,
      title: item.title,
      summary: item.summary,
      topicKey: item.topicKey,
      source: "context_picker",
    }));
  } catch {
    sourceErrors.push("anlassraum_read_unavailable");
  }

  if (input.anlassraumId) {
    const normalizedId = asText(input.anlassraumId).toLowerCase();
    const fromPicker = contextItems.find((item) => item.id === normalizedId) ?? null;
    if (fromPicker) {
      explicitRoomLoaded = true;
      const reasons = [
        "Explizit gesetzter Anlassraum-Kontext.",
        "Kontext wurde im produktiven Anlassraum-Read-Model gefunden.",
      ];
      matches.push({
        id: fromPicker.id,
        matchType: "same_anlassraum",
        matchEntityType: "anlassraum",
        strength: claimTextCandidates.length > 0 ? "high" : "medium",
        label: fromPicker.title || "Ausgewaehlter Anlassraum",
        reason: reasons[0],
        reasons,
        entityId: fromPicker.id,
        targetRef: `/create?anlassraumId=${encodeURIComponent(fromPicker.id)}`,
      });
    } else {
      try {
        if (ObjectId.isValid(normalizedId)) {
          const room = await (await anlassraumCol()).findOne(
            { _id: new ObjectId(normalizedId) },
            { projection: { title: 1, summary: 1, topicKey: 1 } },
          );
          if (room?._id) {
            explicitRoomLoaded = true;
            const reasons = [
              "Explizit gesetzter Anlassraum-Kontext.",
              "Kontext wurde direkt gegen die produktive Anlassraum-Collection aufgeloest.",
            ];
            matches.push({
              id: room._id.toHexString(),
              matchType: "same_anlassraum",
              matchEntityType: "anlassraum",
              strength: claimTextCandidates.length > 0 ? "high" : "medium",
              label: asText(room.title) || "Ausgewaehlter Anlassraum",
              reason: reasons[0],
              reasons,
              entityId: room._id.toHexString(),
              targetRef: `/create?anlassraumId=${encodeURIComponent(room._id.toHexString())}`,
            });
            contextItems.push({
              id: room._id.toHexString(),
              title: asText(room.title) || "Anlassraum",
              summary: asText(room.summary),
              topicKey: asText(room.topicKey) || null,
              source: "direct_room_lookup",
            });
          }
        }
      } catch {
        sourceErrors.push("anlassraum_lookup_failed");
      }
    }
  }

  if (!explicitRoomLoaded) {
    for (const room of contextItems) {
      const topicOverlap = room.topicKey ? topicCandidates.includes(normalizeText(room.topicKey)) : false;
      const roomScore = Math.max(
        textSimilarity(summary, `${room.title} ${room.summary}`),
        ...claimTextCandidates.map((claimText) => textSimilarity(claimText, `${room.title} ${room.summary}`)),
      );
      if (roomScore < 0.45 && !topicOverlap) continue;
      const strength = topicOverlap && roomScore >= 0.55 ? "medium" : strengthFromScore(roomScore);
      if (strength === "none") continue;
      const reasons = [
        topicOverlap
          ? "Topic-Ueberschneidung mit produktivem Anlassraum-Kontext."
          : "Semantische Naehe zwischen Input und Anlassraum-Kontext.",
      ];
      if (room.summary) reasons.push("Anlassraum-Summary zeigt thematische Ueberschneidung.");
      matches.push({
        id: room.id,
        matchType: "same_anlassraum",
        matchEntityType: "anlassraum",
        strength,
        label: room.title || "Anlassraum",
        reason: reasons[0],
        reasons,
        entityId: room.id,
        targetRef: `/create?anlassraumId=${encodeURIComponent(room.id)}`,
      });
    }
  }

  try {
    const proposalsCol = await getCol<StatementProposalDoc>("statement_proposals");
    const proposalQuery: Record<string, unknown> = {};
    if (queryRegex) {
      proposalQuery.$or = [{ text: queryRegex }, { title: queryRegex }, { topic: queryRegex }];
    }
    const proposalRows = await proposalsCol
      .find(proposalQuery, {
        projection: { _id: 1, text: 1, title: 1, topic: 1, dossierId: 1, createdAt: 1, status: 1 },
      })
      .sort({ createdAt: -1 })
      .limit(120)
      .toArray();

    for (const row of proposalRows) {
      const proposalText = asText(row.text);
      const proposalTitle = asText(row.title);
      const proposalTopic = normalizeText(asText(row.topic));
      const baseSimilarity = Math.max(
        textSimilarity(summary, `${proposalTitle} ${proposalText}`),
        ...claimTextCandidates.map((claimText) => textSimilarity(claimText, proposalText)),
      );
      const topicOverlap = proposalTopic ? topicCandidates.includes(proposalTopic) : false;
      const exact = proposalText ? normalizeText(proposalText) === textNormalized : false;
      if (!exact && baseSimilarity < 0.48 && !topicOverlap) continue;

      let matchType: CreateAnalyzeMatchType = "related_claim";
      let matchEntityType: CreateAnalyzeMatchEntityType = "claim";
      let strength: CreateAnalyzeMatchStrength = strengthFromScore(baseSimilarity);
      const reasons: string[] = [];

      if (exact) {
        matchType = "exact_claim";
        strength = "high";
        reasons.push("Input ist textnah identisch zu einem bestehenden Claim.");
      } else if (baseSimilarity >= 0.9) {
        matchType = "duplicate_risk";
        matchEntityType = "claim";
        strength = "high";
        reasons.push("Sehr hohe semantische Aehnlichkeit zu bestehendem Claim (Duplikatrisiko).");
      } else if (topicOverlap && baseSimilarity < 0.62) {
        matchType = "related_claim";
        matchEntityType = "perspective";
        strength = "low";
        reasons.push("Topic-Ueberschneidung mit bestehender Perspektive.");
      } else {
        reasons.push("Semantisch verwandter Claim aus produktiver Statement-Quelle.");
      }

      if (proposalTopic) reasons.push(`Topic: ${proposalTopic}`);
      matches.push({
        id: row._id?.toHexString?.() ?? `proposal-${proposalText.slice(0, 24)}`,
        matchType,
        matchEntityType,
        strength,
        label: proposalTitle || proposalText.slice(0, 96) || "Verwandter Claim",
        reason: reasons[0],
        reasons,
        entityId: row._id?.toHexString?.() ?? null,
        targetRef: row._id?.toHexString?.()
          ? `/swipes?statementId=${encodeURIComponent(row._id.toHexString())}`
          : null,
      });
    }
  } catch {
    sourceErrors.push("claim_read_unavailable");
  }

  try {
    const dCol = await dossiersCol();
    const dossierQuery: Record<string, unknown> = {};
    if (queryRegex) {
      dossierQuery.title = queryRegex;
    }
    const dossierRows = await dCol
      .find(dossierQuery, { projection: { dossierId: 1, title: 1, status: 1, updatedAt: 1, createdAt: 1 } })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(80)
      .toArray();

    for (const row of dossierRows as DossierDocPreview[]) {
      const dossierId = asText(row.dossierId);
      if (!dossierId) continue;
      const title = asText(row.title);
      const explicitDossier = input.dossierId && dossierId === asText(input.dossierId);
      const score = title ? textSimilarity(summary, title) : 0;
      if (!explicitDossier && score < 0.5) continue;
      const reasons = [
        explicitDossier
          ? "Explizit gesetzter Dossier-Kontext."
          : "Semantische Naehe zum produktiven Dossier-Titel.",
      ];
      matches.push({
        id: dossierId,
        matchType: "related_dossier",
        matchEntityType: "dossier",
        strength: explicitDossier ? "high" : strengthFromScore(score),
        label: title || `Dossier ${dossierId.slice(0, 8)}`,
        reason: reasons[0],
        reasons,
        entityId: dossierId,
        targetRef: `/dossier/${encodeURIComponent(dossierId)}`,
      });
    }
  } catch {
    sourceErrors.push("dossier_read_unavailable");
  }

  const dedupedMatches = dedupeMatches(matches)
    .filter((match) => match.strength !== "none")
    .sort((a, b) => rankWeight(b) - rankWeight(a))
    .slice(0, maxMatches);

  const sourceState: "ok" | "degraded" =
    sourceErrors.length >= 3 && dedupedMatches.length === 0 ? "degraded" : "ok";

  if (dedupedMatches.length === 0) {
    return fallbackNoMatch({
      reason:
        sourceState === "degraded"
          ? "Produktive Match-Quellen derzeit nicht verfuegbar."
          : "Kein belastbarer Match in produktiven Quellen gefunden.",
      sourceState,
      sourceErrors,
    });
  }

  const top = dedupedMatches[0];
  const reasons = top.reasons.length > 0 ? top.reasons : [top.reason || "Match aus produktiver Quelle."];
  const suggestedCtas = deriveSuggestedCtas({
    matchType: top.matchType,
    matchEntityType: top.matchEntityType,
    matchStrength: top.strength,
  });

  return {
    matches: dedupedMatches,
    matchStrength: top.strength,
    matchType: top.matchType,
    matchEntityType: top.matchEntityType,
    reasons,
    suggestedCtas,
    sourceState,
    sourceErrors,
  };
}

