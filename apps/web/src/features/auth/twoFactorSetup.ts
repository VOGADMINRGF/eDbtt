export const TWO_FACTOR_CODE_LENGTH = 6;
export const TWO_FACTOR_EMAIL_COOLDOWN_SECONDS = 60;

export function normalizeTwoFactorCode(raw: string) {
  return String(raw || "")
    .replace(/\D+/g, "")
    .slice(0, TWO_FACTOR_CODE_LENGTH);
}

export function mapTwoFactorSetupError(code?: string | null) {
  switch ((code || "").toUpperCase()) {
    case "INVALID_CODE":
    case "INVALID_CODE_OR_EXPIRED":
      return "Der Code ist ungültig oder abgelaufen. Bitte erneut prüfen.";
    case "CODE_REQUIRED":
      return "Bitte gib den 6-stelligen Code ein.";
    case "NO_PENDING_2FA":
    case "CHALLENGE_MISSING":
      return "Für diese Sitzung liegt kein offener Code vor. Bitte fordere einen neuen Code an.";
    case "CHALLENGE_EXPIRED":
      return "Der Code ist abgelaufen. Bitte fordere einen neuen Code an.";
    case "EMAIL_FALLBACK_NOT_ALLOWED":
    case "EMAIL_FALLBACK_DISABLED":
      return "Ein E-Mail-Code ist für diesen Schritt nicht freigegeben.";
    case "RECOVERY_NOT_AVAILABLE":
      return "Ein E-Mail-Recovery-Code ist für dieses Konto derzeit nicht verfügbar.";
    case "RATE_LIMITED":
      return "Der Code konnte gerade nicht gesendet oder geprüft werden. Bitte warte kurz und versuche es erneut.";
    case "UNAUTHORIZED":
      return "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.";
    case "ALREADY_ENABLED":
      return "2FA ist für dieses Konto bereits aktiviert.";
    default:
      return "Der Schritt konnte gerade nicht abgeschlossen werden. Bitte versuche es erneut.";
  }
}
