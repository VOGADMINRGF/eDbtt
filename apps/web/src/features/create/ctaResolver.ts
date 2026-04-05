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
      label: "Perspektive anhängen",
      reason:
        "Optional kann eine Perspektive manuell an einen bestehenden Kontext angehängt werden.",
    });
    return out;
  }

  if (input.matchType === "same_anlassraum") {
    pushUnique(out, {
      id: "anlassraum_oeffnen",
      label: "Anlassraum öffnen",
      reason:
        "Kontext wurde im selben Anlassraum erkannt; manuelle Bestätigung bleibt erforderlich.",
    });
    pushUnique(out, {
      id: "perspektive_anhaengen",
      label: "Perspektive anhängen",
      reason: "Ursprung bleibt erhalten; Perspektive wird additiv angehängt.",
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
      label: "Dossier öffnen",
      reason:
        "Dossier-Nähe erkannt; Verdichtung ist möglich, Anlassraum-Arbeit bleibt parallel eigenständig.",
    });
    pushUnique(out, {
      id: "perspektive_anhaengen",
      label: "Perspektive anhängen",
      reason:
        "Perspektive kann ohne implizites Zusammenführen angehängt werden.",
    });
  }

  if (input.matchType === "duplicate_risk") {
    pushUnique(out, {
      id: "anders_sehen",
      label: "Anders sehen",
      reason:
        "Mögliches Duplikat erkannt. Bitte manuell prüfen statt automatisch mergen.",
    });
    pushUnique(out, {
      id: "perspektive_anhaengen",
      label: "Perspektive anhängen",
      reason:
        "Bei inhaltlicher Nähe als Perspektive führen, nicht still zusammenführen.",
    });
  }

  if (input.matchType === "exact_claim" || input.matchType === "related_claim") {
    pushUnique(out, {
      id: "zustimmen",
      label: "Zustimmen",
      reason:
        "Claim-Nähe erkannt. Zustimmung ist ein manueller Schritt, kein Publish-Ersatz.",
    });
    pushUnique(out, {
      id: "anders_sehen",
      label: "Anders sehen",
      reason: "Explizite Gegenposition bleibt eigenstaendig nachvollziehbar.",
    });
    pushUnique(out, {
      id: "perspektive_anhaengen",
      label: "Perspektive anhängen",
      reason:
        "Claim kann um Perspektiven erweitert werden, ohne Ursprung zu löschen.",
    });
  }

  if (input.matchEntityType === "anlassraum") {
    pushUnique(out, {
      id: "anlassraum_oeffnen",
      label: "Anlassraum öffnen",
      reason:
        "Treffer liegt im Anlassraum-Kontext und bleibt manuell zu bestätigen.",
    });
  }
  if (input.matchEntityType === "dossier") {
    pushUnique(out, {
      id: "dossier_oeffnen",
      label: "Dossier öffnen",
      reason:
        "Treffer liegt in Dossier-Nähe; bewusste Verdichtung möglich, Anlassraum bleibt optional vorgelagert.",
    });
  }

  pushUnique(out, {
    id: "neu_anlegen",
    label: "Neu anlegen",
    reason: "Unabhängiger neuer Strang bleibt jederzeit möglich.",
  });

  return out;
}
