const FULLWIDTH_DIGIT_OFFSET = "０".charCodeAt(0) - "0".charCodeAt(0);

function normalizeDigits(value: string) {
  return Array.from(value)
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code >= "０".charCodeAt(0) && code <= "９".charCodeAt(0)) {
        return String.fromCharCode(code - FULLWIDTH_DIGIT_OFFSET);
      }
      return char;
    })
    .join("");
}

export function normalizeHumanPuzzleAnswerInput(value: unknown): string {
  return normalizeDigits(String(value ?? "").trim());
}

export function parseHumanPuzzleAnswer(value: unknown): number | null {
  const normalized = normalizeHumanPuzzleAnswerInput(value);
  if (!/^\d+$/.test(normalized)) return null;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function getHumanCheckFailureMessage(code?: string | null): string {
  if (code === "puzzle") {
    return "Das Ergebnis stimmt noch nicht. Bitte rechne kurz erneut.";
  }
  return "Der Sicherheitscheck konnte nicht geprüft werden. Bitte lade die Seite neu oder versuche es gleich erneut.";
}
