// features/user/utils/onboarding.ts

import { IUserProfile } from "../../../apps/web/src/models/pii/UserProfile";

/**
 * Liefert den nächsten offenen Schritt im User-Onboarding-Prozess zurück.
 * Nutzt Status, Verification, Legitimation, Premium etc.
 */
export function getNextOnboardingStep(user: IUserProfile): string {
  if (!user) return "Bitte einloggen.";

  if (user.status === "banned") return "Konto gesperrt – Support kontaktieren.";
  if (user.onboardingStatus !== "complete") {
    if (user.verification === "none") return "Bestätige deine E-Mail oder Telefonnummer.";
    if (user.verification === "verified") return "Bitte Legitimiere dich (Adresse/Bürger-ID nachweisen).";
    if (user.onboardingStatus === "pendingDocs") return "Bitte reiche die fehlenden Dokumente ein.";
  }
  if (!user.premium) return "Sichere dir jetzt Premium für exklusive Features!";
  return "Onboarding abgeschlossen – alle Funktionen verfügbar!";
}

/**
 * Liefert einen Fortschrittswert (0-100) für die Visualisierung.
 */
export function getOnboardingProgress(user: IUserProfile): number {
  if (!user) return 0;
  if (user.status === "banned") return 0;
  if (user.onboardingStatus !== "complete") {
    if (user.verification === "none") return 20;
    if (user.verification === "verified") return 60;
    if (user.onboardingStatus === "pendingDocs") return 80;
  }
  if (!user.premium) return 90;
  return 100;
}
