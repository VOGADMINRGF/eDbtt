export const PUBLIC_TERMINOLOGY = {
  withVoxy: "Mit Voxy",
  withoutVoxy: "Ohne Voxy",
  voxy: "Voxy",
  mitmachraum: "Mitmachraum",
  mitmachraeume: "Mitmachräume",
  mitmachschritt: "Mitmachschritt",
  mitmachschritte: "Mitmachschritte",
  themenZusammenfassung: "Themen-Zusammenfassung",
  themenUeberblick: "Themenüberblick",
  zusammenhaenge: "Zusammenhänge",
} as const;

const PUBLIC_TEXT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bAI-Usage-Event\b/g, `${PUBLIC_TERMINOLOGY.voxy}-Schritt`],
  [/\bAI\b/g, PUBLIC_TERMINOLOGY.voxy],
  [/\bKI\b/gi, PUBLIC_TERMINOLOGY.voxy],
  [/\bAnlassräume\b/g, PUBLIC_TERMINOLOGY.mitmachraeume],
  [/\bAnlassraum\b/g, PUBLIC_TERMINOLOGY.mitmachraum],
  [/\bDossiers\b/g, `${PUBLIC_TERMINOLOGY.themenZusammenfassung}en`],
  [/\bDossier\b/g, PUBLIC_TERMINOLOGY.themenZusammenfassung],
  [/\bRunden\b/g, PUBLIC_TERMINOLOGY.mitmachschritte],
  [/\bRunde\b/g, PUBLIC_TERMINOLOGY.mitmachschritt],
  [/\bGraph\b/g, PUBLIC_TERMINOLOGY.zusammenhaenge],
];

export function publicTerminologyText(value: string): string {
  return PUBLIC_TEXT_REPLACEMENTS.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    value,
  );
}
