export const PUBLIC_TERMINOLOGY = {
  withVoxy: "Mit Voxy",
  withoutVoxy: "Ohne Voxy",
  voxy: "Voxy",
  themensuche: "Themensuche",
  debatteArgumente: "Debatte & Argumente",
  debattenArgumente: "Debatten & Argumente",
  aktivDabei: "Aktiv dabei",
  mitmachraum: "Mitmachraum",
  mitmachraeume: "Mitmachräume",
  mitmachschritt: "Mitmachschritt",
  mitmachschritte: "Mitmachschritte",
  zusammenhaenge: "Zusammenhänge",
} as const;

const PUBLIC_TEXT_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bAI-Usage-Event\b/g, `${PUBLIC_TERMINOLOGY.voxy}-Schritt`],
  [/\bAI\b/g, PUBLIC_TERMINOLOGY.voxy],
  [/\bKI\b/gi, PUBLIC_TERMINOLOGY.voxy],
  [/\bAnlassräume\b/g, PUBLIC_TERMINOLOGY.mitmachraeume],
  [/\bAnlassraum\b/g, PUBLIC_TERMINOLOGY.mitmachraum],
  [/\bDossiers\b/g, PUBLIC_TERMINOLOGY.debattenArgumente],
  [/\bDossier\b/g, PUBLIC_TERMINOLOGY.debatteArgumente],
  [/\bThemen-Zusammenfassungen\b/g, PUBLIC_TERMINOLOGY.debattenArgumente],
  [/\bThemen-Zusammenfassung\b/g, PUBLIC_TERMINOLOGY.debatteArgumente],
  [/\bThemenüberblick\b/g, PUBLIC_TERMINOLOGY.themensuche],
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
