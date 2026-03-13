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
    title: "Wir prüfen jeden Beitrag vor Freigabe",
    lead:
      "Bis zum finalen Rollout prüfen wir Beiträge manuell. Beiträge anlegen und abstimmen bleibt kostenfrei.",
    bullets: [
      "Entwürfe ohne Registrierung möglich",
      "Abstimmen auf vorhandene Beiträge ist offen",
      "Freigabe nach Prüfung (redaktionell)",
    ],
    refineTitle: "Noch ergänzen?",
    refineText: "Sichtweisen, Adressat und Bewertung genauer einordnen.",
    refineCta: "Ergänzen & qualifizieren",
    submitTitle: "So zur Prüfung stellen",
    submitText: "Wir übernehmen dein Anliegen wie eingereicht und prüfen es vor Veröffentlichung.",
    submitCta: "Zur Prüfung einreichen",
    registerCta: "Kostenfrei anmelden",
    productsTitle: "Pakete & Vormerkung",
    productsHint: "Wischen",
    contactCta: "Kontakt / Vorfuehrliste",
    later: "Später",
  },
  en: {
    brand: "eDebatte",
    title: "Every contribution is reviewed before release",
    lead: "Until launch, we review submissions manually. Posting and voting stay free.",
    bullets: [
      "Drafts without registration",
      "Voting on existing contributions is open",
      "Release after editorial review",
    ],
    refineTitle: "Want to add details?",
    refineText: "Add context, audience, and evaluation.",
    refineCta: "Refine & qualify",
    submitTitle: "Submit as-is",
    submitText: "We take it as submitted and review it before publishing.",
    submitCta: "Submit for review",
    registerCta: "Create free account",
    productsTitle: "Packages & pre-signup",
    productsHint: "Swipe",
    contactCta: "Contact / demo list",
    later: "Later",
  },
};
