export type AiTraceSurfaceAudience = "user" | "operator";

export type AiTraceSurfaceProviderVisibility =
  | "public_safe"
  | "admin_review_only"
  | "missing_runtime_truth";

function containsKeyword(values: readonly string[], keywords: readonly string[]) {
  const haystack = values.join(" ").toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
}

export function getAiTraceSurfaceScopeLine(audience: AiTraceSurfaceAudience): string {
  if (audience === "operator") {
    return "Sichtbar bleiben sichere Arbeitsstände, Review-Handoffs und nächste Entscheidungen, nicht Prompts, Tokens oder Rohdiagnostik.";
  }
  return "Die sichtbare Spur zeigt Arbeitsschritte, Review-Grenzen und nächste manuelle Schritte, nicht Debug- oder Systemdaten.";
}

export function buildAiTraceHiddenByPolicyLines(
  audience: AiTraceSurfaceAudience,
): string[] {
  if (audience === "operator") {
    return [
      "Keine Prompts, Secrets, Tokens, Rohantworten oder Rohdiagnostik in dieser Oberfläche.",
      "Keine technischen Kennungen, Kostenwerte oder Schema-/Parse-Diagnostik als sichtbare Arbeitsspur.",
      "Quellen-, Recherche- und Factcheck-Hinweise bleiben Vorschläge oder Prüfpfade, keine bestätigten Belege.",
    ];
  }
  return [
    "Keine Prompts, Secrets, Tokens oder Rohlogs im Frontend.",
    "Keine technischen Kennungen, Kosten- oder Debugdetails in der sichtbaren Spur.",
    "Recherche-, Quellen- und Factcheck-Hinweise bleiben Vorschläge und keine bestätigten Belege.",
  ];
}

export function formatAiTraceTechnicalVisibility(params: {
  audience?: AiTraceSurfaceAudience;
  providerVisibility: AiTraceSurfaceProviderVisibility;
  providerKnown: boolean;
}): string {
  const audience = params.audience ?? "user";
  if (params.providerVisibility === "admin_review_only") {
    return audience === "operator"
      ? "Technische Laufdetails bleiben bewusst außerhalb dieser Arbeitsansicht und werden hier nicht als sichtbare Prozessspur gezeigt."
      : "Technische Laufdetails bleiben bewusst außerhalb dieser Oberfläche und werden hier nicht als Nutzerhinweis gezeigt.";
  }
  if (params.providerKnown) {
    return audience === "operator"
      ? "Der Schritt ist technisch bestätigt, aber die Oberfläche zeigt nur den sicheren Arbeitsstand."
      : "Der Schritt ist bestätigt, aber die Oberfläche zeigt nur den sicheren Arbeitsstand.";
  }
  return audience === "operator"
    ? "Die Oberfläche bleibt beim sicheren Arbeitsstand, auch wenn der technische Nachweis noch nicht vollständig verknüpft ist."
    : "Die Oberfläche bleibt beim sicheren Arbeitsstand, auch wenn der technische Nachweis noch nicht vollständig vorliegt.";
}

export function formatAiTraceMissingRuntimeLine(
  reasons: readonly string[],
  audience: AiTraceSurfaceAudience = "user",
): string {
  if (reasons.length === 0) {
    return audience === "operator"
      ? "Der Schritt bleibt sichtbar, ohne zusätzlichen Diagnose- oder Providernachweis."
      : "Der Schritt bleibt sichtbar, ohne technische Zusatzdetails zu behaupten.";
  }

  if (containsKeyword(reasons, ["runid", "request", "operation", "korrelation"])) {
    return audience === "operator"
      ? "Der Schritt ist vorbereitet, aber noch nicht vollständig mit einer belastbaren Laufspur verknüpft."
      : "Der Schritt ist vorbereitet, aber technisch noch nicht vollständig belastbar verknüpft.";
  }

  if (containsKeyword(reasons, ["modell", "provider", "anbieter", "fallback"])) {
    return audience === "operator"
      ? "Der Schritt bleibt sichtbar, ohne zusätzliche technische Kennungen oder Fallback-Details als sichere Wahrheit auszugeben."
      : "Der Schritt bleibt sichtbar, ohne zusätzliche technische Kennungen zu behaupten.";
  }

  if (containsKeyword(reasons, ["planner", "analyze", "runtime-wahrheit", "runtime truth"])) {
    return audience === "operator"
      ? "Der Schritt ist als Arbeitsstand sichtbar, aber noch nicht als vollständig belastbare Runtime-Spur bestätigt."
      : "Der Schritt ist sichtbar, aber noch nicht als vollständig belastbarer KI-Arbeitsstand bestätigt.";
  }

  if (containsKeyword(reasons, ["quelle", "evidence", "feed", "material"])) {
    return audience === "operator"
      ? "Der Schritt bleibt ein review-first Hinweis, bis belastbare Quellen- oder Materialwahrheit vorliegt."
      : "Der Schritt bleibt ein Hinweis, bis belastbare Quellen- oder Materialwahrheit vorliegt.";
  }

  return audience === "operator"
    ? "Der Schritt bleibt sichtbar, aber die technische oder betriebliche Wahrheit ist noch nicht vollständig belastbar."
    : "Der Schritt bleibt sichtbar, aber technisch oder betrieblich noch nicht vollständig belastbar.";
}
