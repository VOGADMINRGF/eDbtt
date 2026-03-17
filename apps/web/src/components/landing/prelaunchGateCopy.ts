import type { Lang } from "@features/landing/landingCopy";

export const PRELAUNCH_GATE_COPY: Record<
  Lang,
  {
    brand: string;
    title: string;
    lead: string;
    bullets: string[];
    refineTitle: string;
    refineText: string;
    refineCta: string;
    submitTitle: string;
    submitText: string;
    submitHint: string;
    submitCta: string;
    registerCta: string;
    productsTitle: string;
    productsHint: string;
    contactCta: string;
    later: string;
  }
> = {
  de: {
    brand: "eDebatte",
    title: "Beitrag jetzt einreichen und per E-Mail auf dem Laufenden bleiben",
    lead: "Wir prüfen neue Beiträge aktuell vor der Freigabe redaktionell.",
    bullets: [
      "Alle starten automatisch kostenfrei",
      "100 Swipes = 1 Beitrags-Credit",
      "Upgrades sind später optional",
      "E-Mail bei Eingang und bei Änderungen im Prüfstatus",
      "Abstimmen auf bestehende Beiträge bleibt offen",
    ],
    refineTitle: "Vor dem Einreichen noch ergänzen?",
    refineText: "Sichtweisen, Adressat und Bewertung noch genauer einordnen.",
    refineCta: "Beitrag weiter ausarbeiten",
    submitTitle: "Jetzt einreichen",
    submitText:
      "Wir übernehmen deinen Beitrag in die Prüfung. Dein Start bleibt kostenfrei. Falls du noch kein Konto hast, meldest du dich im nächsten Schritt kurz kostenlos an und erhältst danach automatische E-Mail-Updates.",
    submitHint: "Bereits registriert? Jetzt anmelden und direkt weiter.",
    submitCta: "Kostenfrei einreichen & Updates erhalten",
    registerCta: "Ich habe bereits ein Konto",
    productsTitle: "Optional: Pakete & Vormerkung",
    productsHint: "sekundär",
    contactCta: "Kontakt / Vorfuehrliste",
    later: "Später",
  },
  en: {
    brand: "eDebatte",
    title: "Submit now and stay informed by email",
    lead: "We currently review new contributions editorially before release.",
    bullets: [
      "Everyone starts automatically on the free access",
      "100 swipes = 1 contribution credit",
      "Upgrades stay optional later",
      "Email updates at intake and status changes",
      "Voting on existing contributions stays open",
    ],
    refineTitle: "Add more before submitting?",
    refineText: "Refine perspectives, audience, and evaluation.",
    refineCta: "Continue refining",
    submitTitle: "Submit now",
    submitText:
      "We move your contribution into review. Your start remains free. If you do not have an account yet, you can sign up for free in the next step and receive automatic email updates.",
    submitHint: "Already registered? Sign in first and continue.",
    submitCta: "Submit for free & get updates",
    registerCta: "I already have an account",
    productsTitle: "Optional: packages & pre-signup",
    productsHint: "secondary",
    contactCta: "Contact / demo list",
    later: "Later",
  },
};
