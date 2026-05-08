import type { CreateSafetyCorpusCase } from "../helpers/createSafetyCorpusRunner";

function enCase(
  id: string,
  title: string,
  input: string,
  overrides: Partial<CreateSafetyCorpusCase> = {},
): CreateSafetyCorpusCase {
  return {
    id,
    title,
    locale: "en",
    input,
    expectedDecision: "allow",
    ...overrides,
  };
}

export const CREATE_SAFETY_CORPUS_EN = [
  enCase(
    "en-self-pii-01",
    "Self PII with civic contact offer",
    "My email is alex.civic@example.org and my phone is +1 202 555 0147 if anyone needs follow-up on the transit issue.",
    {
      expectedDecision: "allow",
      allowedDecisions: ["revise_required"],
      mustFind: ["email", "phone"],
      mustRedact: ["alex.civic@example.org", "+1 202 555 0147"],
    },
  ),
  enCase(
    "en-third-party-pii-cta-01",
    "Third-party phone plus pressure call",
    "Call him at +1 202 555 0188 and make him pay for the vote.",
    {
      expectedDecision: "blocked",
      mustFind: ["phone", "third_party_call_to_action", "doxxing"],
      mustRedact: ["+1 202 555 0188"],
    },
  ),
  enCase(
    "en-third-party-pii-cta-02",
    "Third-party email plus doxxing wording",
    "Share her address and email maria.council@example.org so people can pressure her.",
    {
      expectedDecision: "blocked",
      mustFind: ["email", "doxxing"],
      mustRedact: ["maria.council@example.org"],
    },
  ),
  enCase(
    "en-third-party-pii-accusation-01",
    "Third-party phone plus allegation",
    "His number is +1 202 555 0166 and he manipulated the meeting notes on purpose.",
    {
      expectedDecision: "moderation_required",
      mustFind: ["phone", "unsupported_allegation"],
      mustRedact: ["+1 202 555 0166"],
      mustHaveFactcheckCandidate: true,
    },
  ),
  enCase(
    "en-insult-only-01",
    "Insult only against public actor",
    "This council is run by idiots.",
    {
      expectedDecision: "revise_required",
      mustFind: ["insult_private_person"],
      mustNotFind: ["unsupported_allegation"],
    },
  ),
  enCase(
    "en-insult-plus-civic-01",
    "Insult plus actual permit concern",
    "These officials act like clowns, but I still need to know why the permit process stalled.",
    {
      expectedDecision: "revise_required",
      mustFind: ["insult_private_person"],
    },
  ),
  enCase(
    "en-political-only-01",
    "Political framing only",
    "This feels like establishment propaganda again.",
    {
      expectedDecision: "revise_required",
      allowedDecisions: ["allow"],
      mustFind: ["political_framing"],
      mustNotFind: ["unsupported_allegation"],
      mustHaveFactcheckCandidate: false,
    },
  ),
  enCase(
    "en-political-allegation-01",
    "Political framing plus capture allegation",
    "Captured media keeps covering for the project and nobody wants to check the facts.",
    {
      expectedDecision: "factcheck_required",
      mustFind: ["corruption_or_capture_claim"],
      mustHaveFactcheckCandidate: true,
    },
  ),
  enCase(
    "en-severe-allegation-01",
    "Severe unsupported allegation on manipulation",
    "The administration manipulated the public numbers on purpose.",
    {
      expectedDecision: "factcheck_required",
      mustFind: ["unsupported_allegation"],
      mustHaveFactcheckCandidate: true,
    },
  ),
  enCase(
    "en-number-01",
    "Unverified number with explicit doubt",
    "This costs 40 million and I am not sure if that number is correct.",
    {
      expectedDecision: "factcheck_required",
      mustFind: ["unverified_number"],
      mustHaveFactcheckCandidate: true,
    },
  ),
  enCase(
    "en-number-02",
    "Large cost claim without evidence",
    "The redesign wastes 2 billion and no one is showing evidence.",
    {
      expectedDecision: "factcheck_required",
      mustFind: ["unverified_number"],
      mustHaveFactcheckCandidate: true,
    },
  ),
  enCase(
    "en-source-bluff-01",
    "Everyone knows bluffing",
    "Everyone knows the mayor already fixed the result behind closed doors.",
    {
      expectedDecision: "factcheck_required",
      mustFind: ["source_bluffing"],
      mustHaveFactcheckCandidate: true,
    },
  ),
  enCase(
    "en-source-bluff-02",
    "Insider says bluffing",
    "Insider say the deal was decided before the hearing even started.",
    {
      expectedDecision: "factcheck_required",
      mustFind: ["source_bluffing"],
      mustHaveFactcheckCandidate: true,
    },
  ),
  enCase(
    "en-censorship-01",
    "Fact checking is censorship counterclaim",
    "Fact checking is censorship and people only use it to silence criticism.",
    {
      expectedDecision: "revise_required",
      allowedDecisions: ["allow"],
      mustFind: ["censorship_counterclaim"],
      mustNotFind: ["unsupported_allegation"],
      mustHaveFactcheckCandidate: false,
    },
  ),
  enCase(
    "en-threat-01",
    "Concrete violence threat",
    "Kill you if this vote passes.",
    {
      expectedDecision: "blocked",
      mustFind: ["threat_concrete"],
    },
  ),
  enCase(
    "en-threat-02",
    "Concrete hurt threat",
    "We will hurt you if the shelter stays here.",
    {
      expectedDecision: "blocked",
      mustFind: ["threat_concrete"],
    },
  ),
  enCase(
    "en-escalation-01",
    "Implicit consequence threat",
    "You will pay if the council ignores us again.",
    {
      expectedDecision: "moderation_required",
      mustFind: ["threat_implicit"],
    },
  ),
  enCase(
    "en-group-abuse-01",
    "Group abuse language",
    "All refugees are trash and should be pushed out.",
    {
      expectedDecision: "moderation_required",
      mustFind: ["group_abuse"],
    },
  ),
  enCase(
    "en-spam-01",
    "Spam and brigading language",
    "Copy paste this everywhere and brigade the comment section.",
    {
      expectedDecision: "revise_required",
      mustFind: ["spam_campaign"],
    },
  ),
  enCase(
    "en-safe-question-01",
    "Safe question derived from claim",
    "Can anyone verify whether captured media covered for the investors, and what evidence is there?",
    {
      expectedDecision: "allow",
      mustFind: ["corruption_or_capture_claim"],
      mustHaveFactcheckCandidate: true,
      mayProceedAsSafeQuestion: true,
    },
  ),
] satisfies CreateSafetyCorpusCase[];
