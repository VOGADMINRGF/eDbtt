export const REGISTER_HONEYPOT_FIELD_NAME = "reg_guardian_reference";
export const LEGACY_REGISTER_HONEYPOT_FIELD_NAME = "hp_register";

export const REGISTER_FEEDBACK_MESSAGE_CLASSNAME =
  "rounded-xl border px-3 py-2 text-sm break-words whitespace-normal overflow-hidden";

type RegisterStep3Input = {
  email: string;
  password: string;
  humanToken?: string | null;
};

function isStrongPassword(value: string) {
  return value.length >= 12 && /[0-9]/.test(value) && /[^A-Za-z0-9]/.test(value);
}

export function validateRegisterStep3(input: RegisterStep3Input): string | null {
  if (!input.email.trim()) return "E-Mail: bitte angeben.";
  if (!isStrongPassword(input.password)) {
    return "Passwort: min. 12 Zeichen, inkl. Zahl und Sonderzeichen.";
  }
  if (!input.humanToken) {
    return "Bitte Sicherheitscheck bestätigen.";
  }
  return null;
}

export function readRegisterHoneypotValue(
  input: Partial<Record<string, unknown>>,
): string {
  const current = String(input[REGISTER_HONEYPOT_FIELD_NAME] ?? "").trim();
  const legacy = String(input[LEGACY_REGISTER_HONEYPOT_FIELD_NAME] ?? "").trim();
  return [current, legacy].filter(Boolean).join(" ").trim();
}
