export const VOXY_COPY = {
  start:
    "Schreib kurz, worum es geht. Ich helfe beim Einordnen, bevor du den nächsten Schritt bestätigst.",
  create:
    "Ich helfe dir, deinen Text zu sortieren. Nichts wird automatisch veröffentlicht.",
  anlassraum:
    "Du hältst Thema, Optionen und Sichtbarkeit zusammen. Prüfung und weitere Hilfe kommen erst dazu, wenn du sie auswählst.",
  rundenEntry: "Du hältst zuerst Thema, Optionen und Sichtbarkeit zusammen. Alles Weitere bleibt optional.",
  rundenHero:
    "Du startest mit dem Rahmen. Alles Weitere bleibt optional.",
  manualFrame:
    "Noch keine perfekte Formulierung nötig. Lege erst den Rahmen fest.",
  options:
    "Feste Optionen geben Kontrolle. Community-Vorschläge öffnen den Raum.",
  manualOptions:
    "Feste Optionen geben Kontrolle. Community-Vorschläge machen den Raum offener.",
  visibility:
    "Öffentlich heißt nicht automatisch geprüft. Du bestimmst, wann sichtbar wird.",
  manualVisibility:
    "Öffentlich heißt nicht automatisch geprüft. Du bestimmst, wann sichtbar wird.",
  ai: "KI bleibt optional. Nichts wird automatisch veröffentlicht.",
  manualSupport: "KI, Graph und Dossier bleiben optional. Nichts startet automatisch.",
  completion:
    "Du kannst speichern, vor Veröffentlichung prüfen oder in /create weiter ausarbeiten.",
  createContinue:
    "Der Rahmen steht. Als Nächstes kannst du Frage, Optionen oder Quellen weiter schärfen.",
  dossier:
    "Du bist im Überblick. Quellen und Prüfung findest du im Prüfmodus.",
  swipes:
    "Deine Reaktion ist kein Endpunkt. Daraus können Fragen, Faktenchecks oder Anlassräume entstehen.",
} as const;

export type VoxyCopyKey = keyof typeof VOXY_COPY;

export function getVoxyCopy(key: VoxyCopyKey) {
  return VOXY_COPY[key];
}
