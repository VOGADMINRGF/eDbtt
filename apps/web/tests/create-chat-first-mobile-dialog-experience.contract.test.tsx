import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import CreateLinkIntakeClarification from "@/features/create/CreateLinkIntakeClarification";
import CreateVisualFollowup from "@/features/create/CreateVisualFollowup";
import { detectCreateLinkIntake } from "@/features/create/linkIntake";
import {
  getCreateSurfaceModeDefinitions,
  getCreateSurfaceTexts,
} from "@/features/create/createSurfaceConfig";

const FOLLOWUP_RESULT = {
  understanding: {
    summary: "Du möchtest die Schulwegsicherheit rund um die Grundschule verbessern.",
    dossierContext: "Sichere Schulwege im Bezirk",
    categories: [
      { id: "hint", label: "Hinweis", confidence: "high" as const },
    ],
    topics: [
      { id: "mobility_urban", label: "Mobilität & Stadtentwicklung", confidence: "high" as const },
      { id: "local_community", label: "Kommunales & Lebensumfeld", confidence: "medium" as const },
    ],
    statements: [
      {
        id: "s1",
        text: "Vor der Schule fehlen sichere Querungen und Tempo-30-Kontrollen.",
        kind: "demand" as const,
        stance: "pro" as const,
        confidence: "high" as const,
      },
    ],
    scopes: ["district" as const],
    confidence: "high" as const,
  },
  suggestions: [
    {
      id: "dossier:auto",
      kind: "dossier" as const,
      title: "Sichere Schulwege im Bezirk",
      reason: "Das Thema passt zu einem bestehenden Arbeitsstand.",
      confidence: "high" as const,
      href: "/dossier?topic=schulwege",
      requiresConfirmation: true as const,
    },
  ],
  sourceText: "Vor der Schule fehlen sichere Querungen und Tempo-30-Kontrollen.",
  generatedAt: "2026-05-08T12:00:00.000Z",
};

const MULTI_BRANCH_FOLLOWUP_RESULT = {
  understanding: {
    summary: "Du beschreibst mehrere kommunale Zielkonflikte rund um Wohnen, Verkehr und Schule.",
    dossierContext: "Kommunale Prioritäten und Zielkonflikte",
    categories: [
      { id: "hint", label: "Hinweis", confidence: "high" as const },
    ],
    topics: [
      { id: "housing", label: "Wohnen", confidence: "high" as const },
      { id: "traffic", label: "Verkehr", confidence: "high" as const },
      { id: "education", label: "Bildung", confidence: "medium" as const },
      { id: "integration", label: "Migration/Integration", confidence: "medium" as const },
      { id: "safety", label: "Sicherheit/Rechtsstaat", confidence: "medium" as const },
    ],
    statements: [
      {
        id: "s1",
        text: "Wohnungsbau und Genehmigungen dauern zu lange.",
        kind: "demand" as const,
        stance: "pro" as const,
        confidence: "high" as const,
      },
      {
        id: "s2",
        text: "Bus, Fahrrad und notwendige Autonutzung müssen im Alltag zusammen gedacht werden.",
        kind: "argument" as const,
        stance: "mixed" as const,
        confidence: "medium" as const,
      },
      {
        id: "s3",
        text: "Schule, Sprachförderung und Sicherheit brauchen klare Prioritäten.",
        kind: "claim" as const,
        stance: "pro" as const,
        confidence: "medium" as const,
      },
    ],
    scopes: ["municipal" as const],
    confidence: "high" as const,
  },
  suggestions: [
    {
      id: "dossier:auto",
      kind: "dossier" as const,
      title: "Kommunale Prioritäten und Zielkonflikte",
      reason: "Mehrere Themen sollen gemeinsam in einen Arbeitsstand überführt werden.",
      confidence: "high" as const,
      href: "/dossier?topic=kommunale-prioritaeten",
      requiresConfirmation: true as const,
    },
    {
      id: "vote:auto",
      kind: "vote" as const,
      title: "Welche Prioritäten sollen zuerst bearbeitet werden?",
      reason: "Die Leitfrage passt zur beschriebenen Abwägung.",
      confidence: "medium" as const,
      href: "/swipes?topic=kommunale-prioritaeten",
      requiresConfirmation: true as const,
    },
  ],
  sourceText:
    "Wohnungsbau und Genehmigungen dauern zu lange. Bus, Fahrrad und notwendige Autonutzung müssen im Alltag zusammen gedacht werden. Schule, Sprachförderung und Sicherheit brauchen klare Prioritäten.",
  generatedAt: "2026-05-09T12:00:00.000Z",
};

const PROVISIONAL_QUOTA_FOLLOWUP_RESULT = {
  understanding: {
    summary:
      "Dein Text bleibt als Entwurf erhalten, bis die GPT-Einordnung bestätigt oder manuell ergänzt wurde.",
    categories: [{ id: "hint", label: "Entwurf", confidence: "low" as const }],
    topics: [],
    statements: [
      {
        id: "s1",
        text: "Der Text bleibt als Entwurf erhalten.",
        kind: "hint" as const,
        stance: "unclear" as const,
        confidence: "low" as const,
      },
    ],
    scopes: ["unclear" as const],
    openQuestion: "Du kannst die GPT-Einordnung erneut versuchen oder selbst ein Thema wählen.",
    confidence: "low" as const,
  },
  suggestions: [],
  sourceText:
    "ich bin gegen frauenquote aber für mehr gleichberechtigung, gibt es eine frauenquote müsste es auch quoten von anderen minderheiten geben, das kann nicht richtig und wirtschaftlich für ein unternehmen sein.",
  generatedAt: "2026-05-15T12:00:00.000Z",
  meta: {
    planner: {
      source: "planner_unavailable" as const,
      plannerSource: "planner_unavailable" as const,
      plannerProvider: "openai" as const,
      plannerRole: "planner_only" as const,
      plannerTopic: "GPT-Einordnung nicht abgeschlossen",
      plannerCore: "Die schnelle GPT-Einordnung konnte nicht abgeschlossen werden.",
      plannerScope: ["unclear" as const],
      plannerStance: "open" as const,
      plannerClusters: [],
      plannerOpenQuestions: ["Du kannst die GPT-Einordnung erneut versuchen oder selbst ein Thema wählen."],
      shortSummary:
        "Dein Text bleibt als Entwurf erhalten. Du kannst die Einordnung erneut versuchen oder selbst ein Thema wählen.",
      topicCandidates: [],
      clusterCandidates: [],
      scopeCandidates: ["unclear" as const],
      stance: "open" as const,
      openQuestions: ["Du kannst die GPT-Einordnung erneut versuchen oder selbst ein Thema wählen."],
      graphSearchTerms: [],
      materialSignals: [],
      recommendedLane: "standard" as const,
      providerPlan: {
        lane: "standard" as const,
        plannerProvider: "openai" as const,
        plannerRole: "planner_only" as const,
        structureProvider: "mistral" as const,
        summaryProvider: "claude" as const,
        researchUsed: "none" as const,
        researchProvider: null,
        deepSearchUsed: false,
        graphMatch: "after_structure" as const,
      },
      permissions: {
        nonMutative: true as const,
        canPublish: false as const,
        canSave: false as const,
        canMerge: false as const,
        canDeepSearch: false as const,
      },
      plannerDegraded: true,
      degradedReason: "missing_provider_key" as const,
      plannerDegradedReason: "missing_provider_key" as const,
      qualityStatus: "failed" as const,
      qualityIssues: ["planner_unavailable"],
      providerCallAttempted: false,
      providerCallSucceeded: false,
      plannerDebug: {
        attemptedProvider: "openai" as const,
        usedProvider: "none" as const,
        providerAvailable: false,
        providerErrorCode: null,
        providerErrorMessage: "missing_openai_api_key",
        errorMessage: "missing_openai_api_key",
        rawPayloadValid: false,
        rawTextValid: false,
        normalizedPayloadValid: false,
        qualityGatePassed: false,
      },
    },
    graphMatch: {
      stage: "after_structure" as const,
      prepared: false,
      requiresConfirmation: true,
      searchTerms: [],
      matches: [],
      matchedTopics: [],
      matchedDossiers: [],
      matchedClaims: [],
      matchedAnlassraeume: [],
      matchedVotes: [],
      shouldCreateNewTopic: false,
    },
    researchUsed: "none" as const,
    researchProvider: null,
    deepSearchUsed: false,
  },
};

const FOLLOWUP_ACTIONS = {
  onPrepareSubmission: () => {},
  onPrepareAnlassraum: () => {},
  onOpenDossierAppend: () => {},
  onOpenDossierCreate: () => {},
  onPrepareVote: () => {},
  onRequestEditorialReview: () => {},
  onStartOptionalService: () => {},
  onSaveOnly: () => {},
};

function renderVisualFollowup() {
  return renderToStaticMarkup(
    <CreateVisualFollowup
      result={FOLLOWUP_RESULT}
      factcheckMessage="Optional. Startet erst nach bewusster Bestätigung. Keine automatische Kostenbuchung."
      onConfirm={() => {}}
      onEdit={() => {}}
      {...FOLLOWUP_ACTIONS}
      continuationValue=""
      onContinuationChange={() => {}}
      onContinueConversation={() => {}}
    />,
  );
}

function renderVisualFollowupInEditMode() {
  return renderToStaticMarkup(
    <CreateVisualFollowup
      result={FOLLOWUP_RESULT}
      showCorrectionComposer
      onConfirm={() => {}}
      onEdit={() => {}}
      {...FOLLOWUP_ACTIONS}
      continuationValue=""
      onContinuationChange={() => {}}
      onContinueConversation={() => {}}
    />,
  );
}

function renderMultiBranchVisualFollowup(isConfirmed = false) {
  return renderToStaticMarkup(
    <CreateVisualFollowup
      result={MULTI_BRANCH_FOLLOWUP_RESULT}
      isConfirmed={isConfirmed}
      factcheckMessage="Optional. Startet erst nach bewusster Bestätigung. Keine automatische Kostenbuchung."
      onConfirm={() => {}}
      onEdit={() => {}}
      {...FOLLOWUP_ACTIONS}
      continuationValue=""
      onContinuationChange={() => {}}
      onContinueConversation={() => {}}
    />,
  );
}

function renderProvisionalQuotaFollowup() {
  return renderToStaticMarkup(
    <CreateVisualFollowup
      result={PROVISIONAL_QUOTA_FOLLOWUP_RESULT}
      onConfirm={() => {}}
      onEdit={() => {}}
      {...FOLLOWUP_ACTIONS}
      continuationValue=""
      onContinuationChange={() => {}}
      onContinueConversation={() => {}}
    />,
  );
}

describe("create chat-first mobile dialog experience contract", () => {
  it("keeps visible create copy free of technical internal terms", () => {
    const html = renderVisualFollowup();
    const linkHtml = renderToStaticMarkup(
      <CreateLinkIntakeClarification
        locale="de"
        detection={detectCreateLinkIntake("https://example.com/artikel")}
        selectedIntentId="extract_claims"
        additionalContext=""
        onSelectIntent={() => {}}
        onAdditionalContextChange={() => {}}
      />,
    );
    const surfaceTexts = getCreateSurfaceTexts("de");
    const modeDefinitions = Object.values(getCreateSurfaceModeDefinitions("de"));
    const visibleConfigText = [
      surfaceTexts.followupQuestionLabel,
      surfaceTexts.followupNextStepLabel,
      surfaceTexts.followupNextStepLead,
      surfaceTexts.followupGuidedTitle,
      surfaceTexts.followupGuidedLead,
      ...modeDefinitions.flatMap((mode) => [
        mode.description,
        mode.helperText,
        mode.placeholder,
        mode.ctaLabel,
        mode.firstQuestion,
        mode.firstQuestionPlaceholder,
        mode.postStartTitle,
        mode.postStartLead,
        ...mode.openPoints,
        ...mode.nextActions,
      ]),
    ].join(" ");

    const combined = `${html} ${linkHtml} ${visibleConfigText}`;
    expect(combined).not.toContain("Part06");
    expect(combined).not.toContain("Dossier-Kontext");
    expect(combined).not.toContain("Anschluss");
    expect(combined).not.toContain("sourceHints");
    expect(combined).not.toContain("evidenceNeeds");
    expect(combined).not.toContain("Claims");
  });

  it("shows draft mode as a dialog question instead of a panel-heavy flow", () => {
    const guided = getCreateSurfaceModeDefinitions("de").guided;
    const texts = getCreateSurfaceTexts("de");

    expect(guided.firstQuestion).toBe("Wofür soll der Entwurf zuerst genutzt werden?");
    expect(guided.firstQuestionPlaceholder).toContain("Beitrag");
    expect(guided.postStartLead).toContain("statt dich in ein Formular zu schicken");
    expect(texts.followupGuidedTitle).toContain("Ich bereite daraus einen gemeinsamen Arbeitsstand vor");
  });

  it("keeps the pre-confirmation flow statement-first with two primary branches", () => {
    const html = renderVisualFollowup();

    expect(html).toContain("Haben wir dich richtig verstanden?");
    expect(html).toContain("Ja, so einreichen");
    expect(html).toContain("Ich möchte tiefer ins Thema");
    expect(html).toContain("Ändern");
    expect(html).toContain("Prüfung anfragen");
    expect((html.match(/btn-primary/g) ?? []).length).toBe(2);
    expect(html).not.toContain("Arbeitsstand speichern");
    expect(html).not.toContain("Faktencheck / Deep Search starten");
  });

  it("renders a compact understood state before details", () => {
    const html = renderMultiBranchVisualFollowup();

    expect(html).toContain("Haben wir dich richtig verstanden?");
    expect(html).toContain("Kern");
    expect(html).toContain("Thema");
    expect(html).toContain("Noch offen");
    expect(html).toContain("Mehrere kommunale Zielkonflikte priorisieren");
    expect(html).toContain("Welche Bereiche sollen zuerst bearbeitet werden – und wer ist zuständig?");
    expect(html).toContain("Erkannte Bedarfspunkte");
    expect(html).toContain("Wohnen und Genehmigungen");
    expect(html).toContain("Verkehr, Klima und Alltagstauglichkeit");
    expect(html).toContain("data-mobile-inline-create-actions");
    expect(html).toContain("Details ansehen");
    expect(html).not.toContain("Korrektur oder Ergänzung");
    expect(html).not.toContain("Vorgeschlagener Arbeitsstand");
    expect(html).not.toContain("Gelesene Sinnabschnitte");
    expect(html).not.toContain("Original oben anzeigen");
    expect(html).not.toContain("Kompakte Details");
  });

  it("keeps the technical planner fallback in a clearly degraded clarification state", () => {
    const html = renderProvisionalQuotaFollowup();

    expect(html).toContain("So kannst du weitermachen");
    expect(html).toContain("Automatische Einordnung nicht abgeschlossen");
    expect(html).toContain("Dein Text bleibt als Entwurf erhalten. Du kannst die Einordnung erneut versuchen oder selbst ein Thema wählen.");
    expect(html).toContain("GPT-Einordnung erneut versuchen");
    expect(html).toContain("Beitrag als Entwurf weiter vorbereiten");
    expect(html).toContain("Anlassraum vorbereiten");
    expect(html).toContain("Thema selbst wählen");
    expect(html).not.toContain("Wir haben deinen Beitrag vorläufig eingeordnet.");
    expect(html).not.toContain("Gleichberechtigung");
    expect(html).not.toContain("Frauenquote");
    expect(html).not.toContain("Minderheitenförderung");
    expect(html).not.toContain("wirtschaftliche Auswirkungen für Unternehmen");
    expect(html).not.toContain("Kern");
    expect(html).not.toContain("KI-Suche aktivieren");
    expect(html).not.toContain("Bericht an die Redaktion senden");
  });

  it("only opens the correction composer after edit mode is active", () => {
    const defaultHtml = renderVisualFollowup();
    const editHtml = renderVisualFollowupInEditMode();

    expect(defaultHtml).not.toContain("Korrektur oder Ergänzung");
    expect(defaultHtml).not.toContain("Antwort fortsetzen");
    expect(editHtml).toContain("Korrektur oder Ergänzung");
    expect(editHtml).toContain("Antwort fortsetzen");
  });

  it("shows the next-step choices only after confirmation and keeps Deep Search secondary", () => {
    const html = renderMultiBranchVisualFollowup(true);

    expect(html).toContain("Wie möchtest du tiefer ins Thema gehen?");
    expect(html).toContain("Ja, so einreichen");
    expect(html).toContain("Anlassraum vorbereiten");
    expect(html).toContain("Als Ergänzung anhängen");
    expect(html).toContain("Neues Dossier vorbereiten");
    expect(html).toContain("Beteiligungsfrage vorbereiten");
    expect(html).toContain("Redaktionell prüfen lassen");
    expect(html).toContain("Faktencheck anfragen");
  });

  it("surfaces the place clarification prominently for vague local references", () => {
    const html = renderToStaticMarkup(
      <CreateVisualFollowup
        result={{
          ...FOLLOWUP_RESULT,
          sourceText: "Bei uns in der Stadt ist der Schulweg morgens gefährlich.",
          understanding: {
            ...FOLLOWUP_RESULT.understanding,
            openQuestion: "Auf welchen Ort, Bezirk oder welche Kommune bezieht sich dein Hinweis?",
          },
        }}
        onConfirm={() => {}}
        onEdit={() => {}}
        {...FOLLOWUP_ACTIONS}
        continuationValue=""
        onContinuationChange={() => {}}
        onContinueConversation={() => {}}
      />,
    );

    expect(html).toContain("Um welchen Ort geht es?");
    expect(html).toContain("Ort ergänzen");
    expect(html).toContain("Ort später ergänzen");
  });

  it("does not turn non-local open questions into place clarification", () => {
    const html = renderToStaticMarkup(
      <CreateVisualFollowup
        result={{
          ...FOLLOWUP_RESULT,
          sourceText:
            "Ich bin für besseren Tierschutz und Tierhaltung. Das sollte Europa und weltweit einheitlich umgesetzt werden.",
          understanding: {
            ...FOLLOWUP_RESULT.understanding,
            openQuestion: "Welche Produkte, Länder, Standards und Kontrollmechanismen sind gemeint?",
          },
        }}
        onConfirm={() => {}}
        onEdit={() => {}}
        {...FOLLOWUP_ACTIONS}
        continuationValue=""
        onContinuationChange={() => {}}
        onContinueConversation={() => {}}
      />,
    );

    expect(html).not.toContain("Um welchen Ort geht es?");
    expect(html).not.toContain("Ort ergänzen");
    expect(html).not.toContain("Ort später ergänzen");
    expect(html).toContain("Welche Produkte, Länder, Standards und Kontrollmechanismen sind gemeint?");
  });

  it("shows the correction composer only after the user chooses edit", () => {
    const compactHtml = renderVisualFollowup();
    const editHtml = renderVisualFollowupInEditMode();

    expect(compactHtml).not.toContain("Korrektur oder Ergänzung");
    expect(compactHtml).not.toContain("Antwort fortsetzen");
    expect(editHtml).toContain("Korrektur oder Ergänzung");
    expect(editHtml).toContain("Antwort fortsetzen");
  });

  it("keeps the link flow honest about non-automatic evaluation", () => {
    const html = renderToStaticMarkup(
      <CreateLinkIntakeClarification
        locale="de"
        detection={detectCreateLinkIntake("https://example.com/artikel")}
        selectedIntentId="prepare_factcheck"
        additionalContext=""
        onSelectIntent={() => {}}
        onAdditionalContextChange={() => {}}
      />,
    );

    expect(html).toContain("Quellenhinweis");
    expect(html).toContain("Der Inhalt wurde noch nicht automatisch ausgewertet.");
    expect(html).toContain("Keine automatische Kostenbuchung");
    expect(html).not.toContain("sourceHints");
  });

  it("keeps the mobile follow-up layout single-column with details collapsed by default", () => {
    const followupSource = readFileSync(
      resolve(process.cwd(), "src/features/create/CreateVisualFollowup.tsx"),
      "utf8",
    );
    const clientSource = readFileSync(
      resolve(process.cwd(), "src/app/create/CreateClient.tsx"),
      "utf8",
    );
    const linkClarificationSource = readFileSync(
      resolve(process.cwd(), "src/features/create/CreateLinkIntakeClarification.tsx"),
      "utf8",
    );

    expect(followupSource).toContain("Details ansehen");
    expect(followupSource).toContain("PlaceClarificationPanel");
    expect(followupSource).toContain("StructureProposalPanel");
    expect(followupSource).toContain("NextStepPanel");
    expect(followupSource).toContain("data-mobile-compact-details");
    expect(followupSource).toContain("data-mobile-inline-create-actions");
    expect(followupSource).toContain("nextStepsCount");
    expect(followupSource).toContain("Mehrere kommunale Zielkonflikte priorisieren");
    expect(followupSource).toContain("Welche Bereiche sollen zuerst bearbeitet werden – und wer ist zuständig?");
    expect(followupSource).toContain("unreadLabel");
    expect(followupSource).toContain("data-structure-overview-grid");
    expect(followupSource).toContain("flex flex-wrap items-center gap-2.5");
    expect(followupSource).toContain("const [detailsOpen, setDetailsOpen] = React.useState(false);");
    expect(followupSource).toContain("{detailsOpen ? (");
    expect(followupSource).toContain("aria-expanded={detailsOpen}");
    expect(followupSource).not.toContain("Arbeitsstand speichern");
    expect(clientSource).toContain("CreateInlineAnalysisScene");
    expect(clientSource).toContain("Prüfmodus jetzt im selben Arbeitsraum geöffnet.");
    expect(linkClarificationSource).not.toContain("sourceHints");
  });
});
