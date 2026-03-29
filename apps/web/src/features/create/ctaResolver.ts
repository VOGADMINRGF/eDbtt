import type {
  CreateAnalyzeCtaSuggestion,
  CreateAnalyzeMatchEntityType,
  CreateAnalyzeMatchStrength,
  CreateAnalyzeMatchType,
} from "@/features/create/analyzeContract";

type ResolveCreateCtaSuggestionsInput = {
  matchType: CreateAnalyzeMatchType;
  matchEntityType: CreateAnalyzeMatchEntityType;
  matchStrength: CreateAnalyzeMatchStrength;
};

function pushUnique(
  items: CreateAnalyzeCtaSuggestion[],
  item: CreateAnalyzeCtaSuggestion,
) {
  if (items.some((existing) => existing.id === item.id)) return;
  items.push(item);
}

export function resolveCreateCtaSuggestions(
  input: ResolveCreateCtaSuggestionsInput,
): CreateAnalyzeCtaSuggestion[] {
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
      reason:
        "Optional kann eine Perspektive manuell an einen bestehenden Kontext angehaengt werden.",
    });
    return out;
  }

  if (input.matchType === "same_anlassraum") {
    pushUnique(out, {
      id: "anlassraum_oeffnen",
      label: "Anlassraum oeffnen",
      reason:
        "Kontext wurde im selben Anlassraum erkannt; manuelle Bestaetigung bleibt erforderlich.",
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
      reason:
        "Dossier-Naehe erkannt; Verdichtung ist moeglich, Anlassraum-Arbeit bleibt parallel eigenstaendig.",
    });
    pushUnique(out, {
      id: "perspektive_anhaengen",
      label: "Perspektive anhaengen",
      reason:
        "Perspektive kann ohne implizites Zusammenfuehren angehaengt werden.",
    });
  }

  if (input.matchType === "duplicate_risk") {
    pushUnique(out, {
      id: "anders_sehen",
      label: "Anders sehen",
      reason:
        "Moegliches Duplikat erkannt. Bitte manuell pruefen statt automatisch mergen.",
    });
    pushUnique(out, {
      id: "perspektive_anhaengen",
      label: "Perspektive anhaengen",
      reason:
        "Bei inhaltlicher Naehe als Perspektive fuehren, nicht still zusammenfuehren.",
    });
  }

  if (input.matchType === "exact_claim" || input.matchType === "related_claim") {
    pushUnique(out, {
      id: "zustimmen",
      label: "Zustimmen",
      reason:
        "Claim-Naehe erkannt. Zustimmung ist ein manueller Schritt, kein Publish-Ersatz.",
    });
    pushUnique(out, {
      id: "anders_sehen",
      label: "Anders sehen",
      reason: "Explizite Gegenposition bleibt eigenstaendig nachvollziehbar.",
    });
    pushUnique(out, {
      id: "perspektive_anhaengen",
      label: "Perspektive anhaengen",
      reason:
        "Claim kann um Perspektiven erweitert werden, ohne Ursprung zu loeschen.",
    });
  }

  if (input.matchEntityType === "anlassraum") {
    pushUnique(out, {
      id: "anlassraum_oeffnen",
      label: "Anlassraum oeffnen",
      reason:
        "Treffer liegt im Anlassraum-Kontext und bleibt manuell zu bestaetigen.",
    });
  }
  if (input.matchEntityType === "dossier") {
    pushUnique(out, {
      id: "dossier_oeffnen",
      label: "Dossier oeffnen",
      reason:
        "Treffer liegt in Dossier-Naehe; bewusste Verdichtung moeglich, Anlassraum bleibt optional vorgelagert.",
    });
  }

  pushUnique(out, {
    id: "neu_anlegen",
    label: "Neu anlegen",
    reason: "Unabhaengiger neuer Strang bleibt jederzeit moeglich.",
  });

  return out;
}
