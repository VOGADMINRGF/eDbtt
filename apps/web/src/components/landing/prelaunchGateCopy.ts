import type { Lang } from "@features/landing/landingCopy";

export const PRELAUNCH_GATE_COPY: Record<
  Lang,
  {
    brand: string;
    title: string;
    lead: string;
    bullets: string[];
    registerTitle: string;
    registerText: string;
    registerCta: string;
    refineTitle: string;
    refineText: string;
    refineCta: string;
    submitTitle: string;
    submitText: string;
    submitCta: string;
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
    registerTitle: "Empfehlung: kostenfrei anmelden",
    registerText:
      "Mit Anmeldung informieren wir dich über den Status deines Themas. Upgrade-Vormerkung (9,99 / 29,99) ist optional.",
    registerCta: "Kostenfrei anmelden",
    refineTitle: "Noch ergänzen?",
    refineText: "Sichtweisen, Adressat und Bewertung genauer einordnen.",
    refineCta: "Ergänzen & qualifizieren",
    submitTitle: "So zur Prüfung stellen",
    submitText: "Wir übernehmen dein Anliegen wie eingereicht und prüfen es vor Veröffentlichung.",
    submitCta: "Zur Prüfung einreichen",
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
    registerTitle: "Recommended: create a free account",
    registerText:
      "With an account we can notify you when your topic status changes. Upgrade pre-signup (9.99 / 29.99) stays optional.",
    registerCta: "Create free account",
    refineTitle: "Want to add details?",
    refineText: "Add context, audience, and evaluation.",
    refineCta: "Refine & qualify",
    submitTitle: "Submit as-is",
    submitText: "We take it as submitted and review it before publishing.",
    submitCta: "Submit for review",
    productsTitle: "Packages & pre-signup",
    productsHint: "Swipe",
    contactCta: "Contact / demo list",
    later: "Later",
  },
};
