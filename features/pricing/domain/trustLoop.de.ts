import type { PricingLocale } from "./i18n";

export type PricingTrustFaqEntry = {
  id: "why_not_party" | "why_digital_legitimacy" | "why_dob_bank_totp";
  question: string;
  answer: string;
};

export type PricingTrustLoopContent = {
  leitsatz: string;
  short: string;
  medium: string;
  long: string;
  context: {
    pricingMembershipHint: string;
    registryVerificationHint: string;
    orderActivationHint: string;
    ageLogicHint: string;
  };
  faq: readonly PricingTrustFaqEntry[];
};

export const TRUST_LOOP_FORBIDDEN_PHRASES = [
  "wir umgehen Parteienrecht",
  "für uns gelten diese Regeln nicht",
  "wir ersetzen Parteien einfach",
  "Papier ist wertlos",
  "digitale Verifikation ist perfekt",
] as const;

export const PRICING_TRUST_LOOP_DE: PricingTrustLoopContent = {
  leitsatz:
    "VoiceOpenGov ist bewusst keine Partei, sondern eine unabhängige Initiative für strukturierte gesellschaftliche Beteiligung und das Mehrheitsprinzip.",
  short:
    "Wir setzen auf hohe digitale Legitimation statt auf papierhafte Hürden: verlässlich, nachvollziehbar und mit möglichst wenig unnötiger Reibung.",
  medium:
    "VoiceOpenGov versteht sich bewusst nicht als Partei, sondern als unabhängige Initiative für strukturierte gesellschaftliche Beteiligung und das Mehrheitsprinzip. Deshalb orientieren wir unsere Mitgliedschafts- und Beteiligungslogik nicht einfach an parteiförmigen Modellen oder an den je nach Land unterschiedlichen politischen Rahmenbedingungen. Gleichzeitig setzen wir auf hohe Legitimation, weil Beteiligung, Mitgliedschaft und Mehrheitsbildung Vertrauen und Schutz vor Missbrauch brauchen. Genau deshalb sträuben wir uns aber gegen papierbasierte Verfahren, Unterschriftenlisten und starre analoge Nachweislogiken. Unser Ansatz ist eine starke digitale Verifikation statt unnötiger Papierbürokratie.",
  long:
    "VoiceOpenGov ist bewusst keine Partei, sondern eine unabhängige Initiative für strukturierte gesellschaftliche Beteiligung und das Mehrheitsprinzip. Würden wir als Partei auftreten, müssten wir uns – je nach Land und Rechtsrahmen – an teils sehr unterschiedliche politische, organisatorische und beitragsbezogene Vorgaben halten. Diese Unterschiede beginnen bei Fragen wie Mindestalter, formalen Mitgliedschaftsmodellen oder Beitragslogiken und reichen deutlich weiter. Unser Ansatz ist deshalb ein eigenständiges, transparentes und zivilgesellschaftliches Initiativenmodell.\n\nGleichzeitig setzen wir bewusst auf hohe Legitimation. Gesellschaftliche Beteiligung, Mitgliedschaft und Mehrheitsbildung müssen belastbar, nachvollziehbar und vor Missbrauch geschützt sein. Hohe Legitimation bedeutet für uns aber nicht automatisch Papier, Unterschriftenlisten oder starre analoge Verfahren. Im Gegenteil: Für unser Modell wären solche Wege oft zu langsam, zu fehleranfällig, zu aufwendig und für viele Menschen unnötig abschreckend.\n\nUnser Ziel ist deshalb nicht weniger Prüfung, sondern eine zeitgemäße digitale Legitimation: mit Registry, Geburtsdatum, Bankverifikation, Authenticator-App, Review-Gates und Human-Loop. Also hohe Verlässlichkeit bei möglichst wenig unnötiger Reibung. Wir wollen keine papierhafte Trägheit reproduzieren, sondern ein digitales Beteiligungsmodell, das zugleich offen, belastbar und fair ist.",
  context: {
    pricingMembershipHint:
      "Unsere Mitgliedschafts- und Beteiligungslogik folgt bewusst keiner klassischen Parteienlogik, sondern einem unabhängigen Initiativenmodell. Gleichzeitig setzen wir auf hohe digitale Legitimation, damit Mitgliedschaft, Alter, Zahlungsbezug und Aktivierung belastbar und nachvollziehbar bleiben — ohne in papierhafte Verfahren zurückzufallen.",
    registryVerificationHint:
      "Wir nehmen Legitimation bewusst ernst. Deshalb benötigen wir für bestimmte Mitgliedschafts-, Alters- und Aktivierungslogiken verlässliche Angaben wie Geburtsdatum, Registry-Daten und Bankverifikation. Unser Ziel ist dabei nicht mehr Bürokratie, sondern belastbare digitale Verifikation statt papierhafter Hürden.",
    orderActivationHint:
      "Bestellung und Aktivierung sind bewusst getrennt, wenn Verifikation oder Review erforderlich sind. So bleibt der Prozess nach außen einfach, nach innen aber belastbar. Das schützt Mitgliedschaft, Beteiligung und Mehrheitsbildung vor Missbrauch, ohne auf unnötige Papierlogik zurückzugreifen.",
    ageLogicHint:
      "Wenn Alter für Mitgliedschaft, Tarif oder Aktivierung relevant ist, braucht es eine belastbare Altersprüfung. Deshalb arbeiten wir hier nicht mit bloßen Selbstauskünften, sondern mit verlässlicher digitaler Verifikation. Das ist für uns konsequenter als eine locker behauptete Altersgrenze und zugleich zeitgemäßer als papierhafte Nachweise.",
  },
  faq: [
    {
      id: "why_not_party",
      question: "Warum ist VoiceOpenGov keine Partei?",
      answer:
        "VoiceOpenGov ist bewusst als unabhängige Initiative aufgebaut. So bleibt das Modell zivilgesellschaftlich, transparent und auf strukturierte Beteiligung sowie Mehrheitsbildung fokussiert, statt parteiförmige Organisationslogik zu kopieren.",
    },
    {
      id: "why_digital_legitimacy",
      question: "Warum setzt ihr hohe Legitimation an, lehnt aber Papier und Unterschriftenlisten ab?",
      answer:
        "Hohe Legitimation heißt für uns belastbare Prüfung, nicht analoge Trägheit. Papierbasierte Prozesse sind oft langsam, fehleranfällig und unnötig abschreckend. Wir setzen deshalb auf starke digitale Verifikation mit klaren Review-Gates.",
    },
    {
      id: "why_dob_bank_totp",
      question: "Warum braucht ihr Geburtsdatum, Bankverifikation oder eine Authenticator-App?",
      answer:
        "Diese Angaben sichern Alterslogik, Zahlungsbezug, Missbrauchsschutz und nachvollziehbare Aktivierung. Das Ziel ist nicht mehr Bürokratie, sondern verlässliche digitale Legitimation bei möglichst wenig unnötiger Reibung.",
    },
  ],
};

export const PRICING_TRUST_LOOP_EN: PricingTrustLoopContent = {
  leitsatz:
    "VoiceOpenGov is deliberately not a political party, but an independent initiative for structured civic participation and the majority principle.",
  short:
    "We rely on strong digital legitimacy rather than paper-heavy barriers: reliable, transparent and with as little unnecessary friction as possible.",
  medium:
    "VoiceOpenGov is deliberately not a political party, but an independent initiative for structured civic participation and the majority principle. That is why our membership and participation model is not simply copied from party-based structures or from political frameworks that differ from country to country. At the same time, we apply high legitimacy standards because participation, membership and majority-building require trust and protection against abuse. Precisely for that reason, we do not want to fall back on paper-based procedures, signature sheets or rigid analogue verification models. Our approach is strong digital verification instead of unnecessary paper bureaucracy.",
  long:
    "VoiceOpenGov is deliberately not a political party, but an independent initiative for structured civic participation and the majority principle. If we were organised as a political party, we would have to comply — depending on the country and legal framework — with very different political, organisational and contribution-related rules. Those differences already begin with questions such as minimum age, formal membership models or contribution logic, and extend much further. Our approach is therefore an independent, transparent and civic initiative model.\n\nAt the same time, we deliberately apply high legitimacy standards. Civic participation, membership and majority-building must be robust, understandable and protected against abuse. For us, however, high legitimacy does not automatically mean paper forms, signature sheets or rigid analogue procedures. On the contrary, for our model such approaches are often too slow, too error-prone, too labour-intensive and unnecessarily discouraging for many people.\n\nOur goal is therefore not less scrutiny, but modern digital legitimacy: through registry data, date of birth, bank verification, authenticator apps, review gates and human-loop checks. In other words: high reliability with as little unnecessary friction as possible. We do not want to reproduce paper-heavy inertia, but to build a digital participation model that is at the same time open, robust and fair.",
  context: {
    pricingMembershipHint:
      "Our membership and participation logic is deliberately not based on a traditional party model, but on an independent initiative model. At the same time, we rely on strong digital legitimacy so that membership, age, payment connection and activation remain robust and transparent — without falling back into paper-based procedures.",
    registryVerificationHint:
      "We take legitimacy seriously by design. That is why certain membership, age and activation rules require reliable information such as date of birth, registry data and bank verification. Our goal is not more bureaucracy, but robust digital verification instead of paper-heavy barriers.",
    orderActivationHint:
      "Ordering and activation are deliberately separated whenever verification or review is required. This keeps the process simple on the outside, while remaining robust on the inside. It protects membership, participation and majority-building against abuse without falling back on unnecessary paper logic.",
    ageLogicHint:
      "Whenever age matters for membership, pricing or activation, it requires a reliable age check. That is why we do not rely on mere self-declaration, but on dependable digital verification. For us, that is more consistent than loosely claimed age limits and more contemporary than paper-based proof.",
  },
  faq: [
    {
      id: "why_not_party",
      question: "Why is VoiceOpenGov not a political party?",
      answer:
        "VoiceOpenGov is intentionally built as an independent initiative. This keeps the model civic, transparent and focused on structured participation and majority-building instead of copying party-style organization logic.",
    },
    {
      id: "why_digital_legitimacy",
      question: "Why do you apply high legitimacy standards but reject paper-based procedures?",
      answer:
        "For us, high legitimacy means robust verification, not analogue inertia. Paper-heavy flows are often slow, error-prone and unnecessarily discouraging. We therefore use strong digital verification with clear review gates.",
    },
    {
      id: "why_dob_bank_totp",
      question: "Why do you require date of birth, bank verification or an authenticator app?",
      answer:
        "These checks secure age logic, payment relevance, abuse protection and transparent activation. The goal is not more bureaucracy, but reliable digital legitimacy with as little unnecessary friction as possible.",
    },
  ],
};

export function getPricingTrustLoop(locale: PricingLocale = "de") {
  return locale === "en" ? PRICING_TRUST_LOOP_EN : PRICING_TRUST_LOOP_DE;
}
