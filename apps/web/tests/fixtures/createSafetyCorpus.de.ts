import type { CreateSafetyCorpusCase } from "../helpers/createSafetyCorpusRunner";

function deCase(
  id: string,
  title: string,
  input: string,
  overrides: Partial<CreateSafetyCorpusCase> = {},
): CreateSafetyCorpusCase {
  return {
    id,
    title,
    locale: "de",
    input,
    expectedDecision: "allow",
    ...overrides,
  };
}

export const CREATE_SAFETY_CORPUS_DE = [
  deCase(
    "de-broken-01",
    "Broken German with civic intent",
    "ich hab frage zu bus und miete bitte helft, die haltestelle ist fuer alte leute zu weit weg",
    {
      expectedDecision: "revise_required",
      allowedDecisions: ["allow"],
      mustNotFind: ["political_framing", "unsupported_allegation"],
    },
  ),
  deCase(
    "de-broken-02",
    "Broken German around school route safety",
    "schule weg dunkel bitte kommune macht licht weil kinder laufen dort jeden morgen",
    {
      expectedDecision: "revise_required",
      allowedDecisions: ["allow"],
    },
  ),
  deCase(
    "de-rambling-01",
    "Long rambling civic input on housing and transit",
    "Seit Monaten versuche ich zu erklaeren, dass bei uns Wohnen, Bus, Schule, Lärm und Terminnot beim Amt zusammenhaengen, aber der Text wird immer laenger, springt zwischen Baustelle, Miete, Kinderweg und Parkdruck hin und her und verliert die eigentliche Frage, wie die Kommune das geordnet aufarbeiten kann.",
    {
      expectedDecision: "revise_required",
      allowedDecisions: ["allow"],
      mustFind: ["low_readability"],
    },
  ),
  deCase(
    "de-rambling-02",
    "Long rambling civic input on district planning",
    "Im Quartier reden alle gleichzeitig ueber Parken, Lieferverkehr, Kita, Nachtruhe, Baustellen und die Frage, wer eigentlich Verantwortung traegt, und ich bekomme das Anliegen kaum sortiert, obwohl ich nur wissen will, welche Schritte die Stadt fuer einen nachvollziehbaren Plan einleiten kann.",
    {
      expectedDecision: "revise_required",
      allowedDecisions: ["allow"],
      mustFind: ["low_readability"],
    },
  ),
  deCase(
    "de-self-pii-01",
    "Self PII only with civic contact offer",
    "Meine Mail ist lena.beispiel@example.org und meine Nummer ist +49 171 2233445, falls jemand fuer die OPNV-Frage nachfragen will.",
    {
      expectedDecision: "allow",
      allowedDecisions: ["revise_required"],
      mustFind: ["email", "phone"],
      mustRedact: ["lena.beispiel@example.org", "+49 171 2233445"],
      mustNotContainInRedacted: ["example.org", "2233445"],
    },
  ),
  deCase(
    "de-third-party-pii-only-01",
    "Third-party phone without accusation",
    "Herr Becker ist unter +49 171 9988776 erreichbar, vielleicht kann die Verwaltung ihn zum Lkw-Laerm befragen.",
    {
      expectedDecision: "allow",
      allowedDecisions: ["revise_required"],
      mustFind: ["phone"],
      mustRedact: ["+49 171 9988776"],
      mustNotFind: ["unsupported_allegation", "doxxing"],
    },
  ),
  deCase(
    "de-third-party-pii-plus-cta-01",
    "Third-party phone plus call to action",
    "Ruft ihn unter +49 171 9999999 an und macht Druck wegen der Sitzung.",
    {
      expectedDecision: "blocked",
      mustFind: ["phone", "third_party_call_to_action", "doxxing"],
      mustRedact: ["+49 171 9999999"],
    },
  ),
  deCase(
    "de-third-party-pii-plus-cta-02",
    "Third-party address plus doxxing language",
    "Teilt die Adresse Musterstrasse 7 und geht heute Abend zu ihm hin.",
    {
      expectedDecision: "blocked",
      mustFind: ["street_address", "third_party_call_to_action", "doxxing"],
      mustRedact: ["Musterstrasse 7"],
      mustNotContainInRedacted: ["Musterstrasse 7"],
    },
  ),
  deCase(
    "de-third-party-pii-plus-accusation-01",
    "Third-party address plus corruption accusation",
    "Er wohnt in der Bahnhofstrasse 12 und ist korrupt, die Stadt soll das endlich pruefen.",
    {
      expectedDecision: "moderation_required",
      mustFind: ["street_address", "corruption_or_capture_claim"],
      mustRedact: ["Bahnhofstrasse 12"],
      mustHaveFactcheckCandidate: true,
    },
  ),
  deCase(
    "de-third-party-pii-plus-accusation-02",
    "Third-party email plus unsupported allegation",
    "Seine Mail ist heinz.berg@example.org und er hat absichtlich Zahlen vertuscht.",
    {
      expectedDecision: "moderation_required",
      mustFind: ["email", "unsupported_allegation"],
      mustRedact: ["heinz.berg@example.org"],
      mustHaveFactcheckCandidate: true,
    },
  ),
  deCase(
    "de-insult-only-01",
    "Insult only against public actor",
    "Diese Verwaltung ist ein Haufen Idioten.",
    {
      expectedDecision: "revise_required",
      mustFind: ["insult_public_actor"],
      mustNotFind: ["unsupported_allegation"],
    },
  ),
  deCase(
    "de-insult-plus-civic-01",
    "Insult plus civic concern on permits",
    "Der Stadtrat handelt wie Idioten, aber meine Frage bleibt, warum die Genehmigung fuer den Spielplatz seit Monaten haengt.",
    {
      expectedDecision: "revise_required",
      mustFind: ["insult_public_actor"],
      mustNotFind: ["unsupported_allegation"],
    },
  ),
  deCase(
    "de-insult-plus-civic-02",
    "Insult plus neighborhood bus concern",
    "Diese Leute im Amt sind Clowns, trotzdem will ich klaeren, warum die Buslinie fuer das Viertel gestrichen wurde.",
    {
      expectedDecision: "revise_required",
      mustFind: ["insult_public_actor"],
    },
  ),
  deCase(
    "de-political-only-01",
    "Political framing only with no allegation",
    "Das wirkt wie typisches Lagerdenken der Altparteien.",
    {
      expectedDecision: "revise_required",
      allowedDecisions: ["allow"],
      mustFind: ["political_framing"],
      mustNotFind: ["unsupported_allegation", "corruption_or_capture_claim"],
      mustHaveFactcheckCandidate: false,
    },
  ),
  deCase(
    "de-political-only-02",
    "Political framing only with civic concern",
    "Die Mainstreammedien und das Establishment reden an der Lebensrealitaet vorbei, aber mein Anliegen betrifft den OPNV im Bezirk.",
    {
      expectedDecision: "revise_required",
      allowedDecisions: ["allow"],
      mustFind: ["political_framing"],
      mustNotFind: ["unsupported_allegation"],
      mustHaveFactcheckCandidate: false,
    },
  ),
  deCase(
    "de-political-allegation-01",
    "Political framing plus supported-looking allegation",
    "Die Altparteien haben das absichtlich vertuscht und jetzt soll niemand ueber die Kosten reden.",
    {
      expectedDecision: "factcheck_required",
      mustFind: ["political_framing", "unsupported_allegation"],
      mustHaveFactcheckCandidate: true,
    },
  ),
  deCase(
    "de-political-allegation-02",
    "Political framing plus corruption claim",
    "Das Establishment schuetzt Investoren, die Presse schreibt nur fuer Investoren und die Kommune schaut weg.",
    {
      expectedDecision: "factcheck_required",
      mustFind: ["political_framing", "corruption_or_capture_claim"],
      mustHaveFactcheckCandidate: true,
    },
  ),
  deCase(
    "de-severe-allegation-01",
    "Severe unsupported allegation on manipulation",
    "Die Verwaltung manipuliert absichtlich die Zahlen zur Unterbringung.",
    {
      expectedDecision: "factcheck_required",
      mustFind: ["unsupported_allegation"],
      mustHaveFactcheckCandidate: true,
    },
  ),
  deCase(
    "de-severe-allegation-02",
    "Severe unsupported allegation on capture",
    "Die lokale Presse ist gekauft und deckt die Sache.",
    {
      expectedDecision: "factcheck_required",
      mustFind: ["unsupported_allegation"],
      mustHaveFactcheckCandidate: true,
    },
  ),
  deCase(
    "de-number-01",
    "Unverified budget claim with explicit uncertainty",
    "Das kostet 40 Millionen, keine Ahnung ob die Zahl stimmt.",
    {
      expectedDecision: "factcheck_required",
      mustFind: ["unverified_number"],
      mustHaveFactcheckCandidate: true,
    },
  ),
  deCase(
    "de-number-02",
    "Unverified large number claim",
    "Fuer dieses Vorhaben werden 2,5 Milliarden verbrannt und niemand legt Belege vor.",
    {
      expectedDecision: "factcheck_required",
      mustFind: ["unverified_number"],
      mustHaveFactcheckCandidate: true,
    },
  ),
  deCase(
    "de-source-bluff-01",
    "Source bluffing around local deal",
    "Aus sicherer Quelle weiss jeder, dass alles absichtlich vertuscht wird.",
    {
      expectedDecision: "factcheck_required",
      mustFind: ["source_bluffing", "unsupported_allegation"],
      mustHaveFactcheckCandidate: true,
    },
  ),
  deCase(
    "de-source-bluff-02",
    "Everyone knows bluffing about procurement",
    "Man weiss doch, dass der Auftrag schon vorher feststand.",
    {
      expectedDecision: "factcheck_required",
      mustFind: ["source_bluffing"],
      mustHaveFactcheckCandidate: true,
    },
  ),
  deCase(
    "de-censorship-01",
    "Factcheck as censorship counterclaim only",
    "Faktencheck ist Zensur und die Altparteien wollen nur Ruhe.",
    {
      expectedDecision: "revise_required",
      allowedDecisions: ["allow"],
      mustFind: ["censorship_counterclaim", "political_framing"],
      mustNotFind: ["unsupported_allegation"],
      mustHaveFactcheckCandidate: false,
    },
  ),
  deCase(
    "de-censorship-02",
    "Censorship framing without factual allegation",
    "Das ist doch wieder Zensur, sobald jemand die Debatte ueber Migration anspricht.",
    {
      expectedDecision: "revise_required",
      allowedDecisions: ["allow"],
      mustFind: ["censorship_counterclaim"],
      mustNotFind: ["unsupported_allegation"],
      mustHaveFactcheckCandidate: false,
    },
  ),
  deCase(
    "de-threat-01",
    "Concrete violence threat",
    "Ich bringe dich um, wenn die Sitzung so ausgeht.",
    {
      expectedDecision: "blocked",
      mustFind: ["threat_concrete"],
    },
  ),
  deCase(
    "de-threat-02",
    "Concrete arson threat",
    "Wenn das Heim bleibt, zuenden wir den Laden an.",
    {
      expectedDecision: "blocked",
      mustFind: ["threat_concrete"],
    },
  ),
  deCase(
    "de-escalation-01",
    "Vague escalation consequence language",
    "Wenn nichts passiert, wird das Folgen haben.",
    {
      expectedDecision: "moderation_required",
      mustFind: ["threat_implicit"],
    },
  ),
  deCase(
    "de-escalation-02",
    "Self justice wording",
    "Wenn die Stadt nicht reagiert, regeln wir das mit Selbstjustiz.",
    {
      expectedDecision: "moderation_required",
      mustFind: ["self_justice"],
    },
  ),
  deCase(
    "de-group-abuse-01",
    "Group abuse language",
    "Diese Leute sind Abschaum von Menschen und gehoeren aus dem Viertel gedrueckt.",
    {
      expectedDecision: "moderation_required",
      mustFind: ["group_abuse"],
    },
  ),
  deCase(
    "de-spam-01",
    "Spam and brigading encouragement",
    "Postet das ueberall, alle sollen das teilen und mass reporten.",
    {
      expectedDecision: "revise_required",
      mustFind: ["spam_campaign"],
    },
  ),
  deCase(
    "de-safe-question-01",
    "Safe question derived from corruption claim",
    "Stimmt es, dass die Presse nur fuer Investoren schreibt? Welche Quellen oder Belege gibt es dafuer?",
    {
      expectedDecision: "allow",
      mustFind: ["corruption_or_capture_claim"],
      mustHaveFactcheckCandidate: true,
      mayProceedAsSafeQuestion: true,
    },
  ),
  deCase(
    "de-safe-question-02",
    "Safe question derived from number claim",
    "Kann das jemand belegen: kostet das Projekt wirklich 40 Millionen und welche Quellen gibt es?",
    {
      expectedDecision: "allow",
      mustFind: ["unverified_number"],
      mustHaveFactcheckCandidate: true,
      mayProceedAsSafeQuestion: true,
    },
  ),
  deCase(
    "de-cross-lingual-01",
    "Mixed German and English review case",
    "Wir brauchen bessere Wege zur Schule, but the claim data is unclear.",
    {
      expectedDecision: "graph_review_required",
      mustFind: ["cross_lingual_review"],
      mustHaveGraphReviewHint: true,
      mustHaveFactcheckCandidate: false,
    },
  ),
  deCase(
    "de-cross-lingual-02",
    "German civic text with Turkish insertion",
    "Bitte prueft die Busverbindung im Bezirk, cunku belediye rotayi staendig aendiriyor.",
    {
      expectedDecision: "graph_review_required",
      mustFind: ["cross_lingual_review"],
      mustHaveGraphReviewHint: true,
    },
  ),
  deCase(
    "de-third-party-pii-only-02",
    "Third-party email without allegation",
    "Die Kontaktadresse fuer Rueckfragen lautet nachbarschaftsrat@example.org, falls die Stadt offiziell nachfragen moechte.",
    {
      expectedDecision: "allow",
      allowedDecisions: ["revise_required"],
      mustFind: ["email"],
      mustRedact: ["nachbarschaftsrat@example.org"],
      mustNotFind: ["unsupported_allegation", "doxxing"],
    },
  ),
] satisfies CreateSafetyCorpusCase[];
