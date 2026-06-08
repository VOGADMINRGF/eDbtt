export const START_CREATE_VOXY_COPY = {
  start:
    "Schreib kurz, worum es geht. Ich helfe beim Einordnen, bevor du den nächsten Schritt bestätigst.",
  create:
    "Ich helfe dir, deinen Text zu sortieren. Nichts wird automatisch veröffentlicht.",
  ai: "KI bleibt optional. Nichts wird automatisch veröffentlicht.",
  createContinue:
    "Der Rahmen steht. Als Nächstes kannst du Frage, Optionen oder Quellen weiter schärfen.",
} as const;

export type StartCreateVoxyCopyKey = keyof typeof START_CREATE_VOXY_COPY;

export function getStartCreateVoxyCopy(key: StartCreateVoxyCopyKey) {
  return START_CREATE_VOXY_COPY[key];
}
