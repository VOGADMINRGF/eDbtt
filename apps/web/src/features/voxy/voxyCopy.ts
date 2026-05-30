export const VOXY_COPY = {
  anlassraum:
    "Du entscheidest zuerst den Rahmen. KI und Prüfung kommen nur dazu, wenn du sie auswählst.",
  rundenEntry: "Du entscheidest zuerst den Rahmen. Alles Weitere bleibt optional.",
  rundenHero:
    "Du startest mit dem Rahmen. Thema, Optionen und Sichtbarkeit zuerst. Alles Weitere bleibt optional.",
  manualFrame: "Noch keine perfekte Formulierung nötig. Lege erst den Rahmen fest.",
  options:
    "Feste Optionen geben Kontrolle. Community-Vorschläge öffnen den Raum.",
  manualOptions:
    "Feste Optionen geben Kontrolle. Community-Vorschläge machen den Raum offener.",
  visibility:
    "Öffentlich heißt nicht automatisch geprüft. Du bestimmst, wann sichtbar wird.",
  manualVisibility:
    "Öffentlich heißt nicht automatisch geprüft. Du bestimmst, wann sichtbar wird.",
  ai: "KI bleibt optional. Nichts wird automatisch veröffentlicht.",
  manualSupport: "KI bleibt optional. Nichts wird automatisch veröffentlicht.",
  completion:
    "Du kannst speichern, prüfen oder in /create weiter ausarbeiten.",
  createContinue:
    "Der Rahmen steht. Ich kann jetzt Frage, Optionen oder Quellenstruktur verbessern.",
  dossier:
    "Du bist im Überblick. Quellen und Prüfung findest du im Prüfmodus.",
} as const;

export type VoxyCopyKey = keyof typeof VOXY_COPY;

export function getVoxyCopy(key: VoxyCopyKey) {
  return VOXY_COPY[key];
}
