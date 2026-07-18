import type * as React from "react";
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
    summary:
      "Du beschreibst mehrere Mobilitäts- und Planungsfragen rund um Abendtakt, S-Bahn-Anschluss, Straßenumbau und Parkraum.",
    dossierContext: "Mobilität und Straßenumbau im Bezirk",
    categories: [
      { id: "hint", label: "Hinweis", confidence: "high" as const },
    ],
    topics: [
      { id: "housing", label: "Wohnen", confidence: "low" as const },
      { id: "traffic", label: "Verkehr", confidence: "high" as const },
      { id: "education", label: "Bildung", confidence: "low" as const },
      { id: "integration", label: "Migration/Integration", confidence: "low" as const },
    ],
    statements: [
      {
        id: "s1",
        text: "Bei uns im Bezirk fährt der Bus abends nur noch alle 30 Minuten.",
        kind: "claim" as const,
        stance: "open" as const,
        confidence: "high" as const,
      },
      {
        id: "s2",
        text: "Dadurch verpassen viele Beschäftigte den Anschluss an die S-Bahn.",
        kind: "claim" as const,
        stance: "open" as const,
        confidence: "high" as const,
      },
      {
        id: "s3",
        text: "Gleichzeitig soll die Hauptstraße umgebaut werden, aber niemand weiß, ob dabei Parkplätze wegfallen oder neue Radwege entstehen.",
        kind: "claim" as const,
        stance: "open" as const,
        confidence: "high" as const,
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
    "Bei uns im Bezirk fährt der Bus abends nur noch alle 30 Minuten. Dadurch verpassen viele Beschäftigte den Anschluss an die S-Bahn. Gleichzeitig soll die Hauptstraße umgebaut werden, aber niemand weiß, ob dabei Parkplätze wegfallen oder neue Radwege entstehen.",
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
        text: "In Rahnsdorf fehlen sichere Querungen an Kita, Straße und Haltestelle. Grünflächen und Haushalt spielen ebenfalls mit hinein.",
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
    "In Rahnsdorf fehlen sichere Querungen an Kita, Straße und Haltestelle. Radfahrer kommen schlecht durch, Bauprojekte verdrängen Grünflächen und der Haushalt ist knapp.",
  generatedAt: "2026-05-15T12:00:00.000Z",
  meta: {
    planner: {
      source: "heuristic_fallback" as const,
      plannerSource: "heuristic_fallback" as const,
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
      qualityIssues: ["technical_fallback_only"],
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

function renderMultiBranchVisualFollowup(
  isConfirmed = false,
  extraProps: Partial<React.ComponentProps<typeof CreateVisualFollowup>> = {},
) {
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
      {...extraProps}
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
    expect(combined).not.toContain("Anschlussdaten");
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
    expect(texts.followupGuidedTitle).toContain("Ich baue daraus einen kompakten Arbeitsstand");
  });

  it("keeps the pre-confirmation flow statement-first with one primary confirmation action", () => {
    const html = renderVisualFollowup();

    expect(html).toContain("Ich sehe einen gemeinsamen Kern.");
    expect(html).toContain("Themenstruktur bestätigen");
    expect(html).toContain("Themen ändern");
    expect(html).not.toContain("Aussage schärfen");
    expect(html).not.toContain("Quelle vormerken");
    expect(html).not.toContain("Später weiterarbeiten");
    expect((html.match(/btn-primary/g) ?? []).length).toBe(1);
    expect(html).not.toContain("Faktencheck / Deep Search starten");
  });

  it("renders a compact understood state before details", () => {
    const html = renderMultiBranchVisualFollowup();

    expect(html).toContain("Ich habe diese Themen erkannt.");
    expect(html).toContain("Erkannte Themen");
    expect(html).toContain("aus deinem Beitrag erkannt");
    expect(html).toContain("Deine Struktur");
    expect(html).toContain("ÖPNV und Mobilität");
    expect(html).toContain("Straßenraum und Radverkehr");
    expect(html).toContain("Parkraum und kommunale Planung");
    expect(html).toContain("data-create-chat-thread");
    expect(html).toContain("data-create-structure-rail");
    expect(html).toContain("data-mobile-inline-create-actions");
    expect(html).toContain("data-create-pipeline-rail");
    expect(html).toContain("data-create-inline-structure-summary");
    expect(html).toContain("data-create-topic-branches");
    expect(html).toContain("1 · Beitrag aufgenommen");
    expect(html).toContain("3 · Entscheidung offen");
    expect(html).toContain("Was du jetzt tun kannst");
    expect(html).toContain("Themenstruktur bestätigen");
    expect(html).not.toContain("Themenzweig");
    expect(html).toContain("Details &amp; Transparenz");
    expect(html).not.toContain("Korrektur oder Ergänzung");
    expect(html).not.toContain("Original oben anzeigen");
  });

  it("keeps the technical planner fallback in a clearly degraded clarification state", () => {
    const html = renderProvisionalQuotaFollowup();

    expect(html).toContain("Was du jetzt tun kannst");
    expect(html).toContain("Ich habe diese Themen erkannt.");
    expect(html).toContain("Aus deinem Beitrag ergeben sich mehrere Stränge. Du entscheidest, wie wir weiterarbeiten.");
    expect(html).toContain("Themen ändern");
    expect(html).not.toContain("Aussage schärfen");
    expect(html).not.toContain("Quelle vormerken");
    expect(html).not.toContain("Später weiterarbeiten");
    expect(html).not.toContain("Anlassraum vorbereiten");
    expect(html).toContain("Verkehrssicherheit");
    expect(html).toContain("Kita-/Schulweg &amp; Barrierefreiheit");
    expect(html).toContain("Stadtplanung &amp; Finanzierung");
    expect(html).not.toContain("Einordnung erneut versuchen");
    expect(html).not.toContain("Wir haben deinen Beitrag vorläufig eingeordnet.");
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

  it("shows the next-step choices only after confirmation and keeps external source analysis secondary", () => {
    const html = renderMultiBranchVisualFollowup(true);

    expect(html).toContain("Was du jetzt tun kannst");
    expect(html).toContain("Aussage schärfen");
    expect(html).toContain("Frage vormerken");
    expect(html).toContain("Thema vormerken");
    expect(html).toContain("Quelle vormerken");
    expect(html).toContain("Für Community vorbereiten");
    expect(html).toContain("Später weiterarbeiten");
    expect(html).toContain("Kein Auto-Publish");
  });

  it("offers a compact link and overflow decision without auto-starting external search", () => {
    const html = renderMultiBranchVisualFollowup(false, {
      linkDetection: detectCreateLinkIntake("https://example.com/artikel Mehr Themen bitte prüfen"),
      compactBranchLimit: 3,
      expandedBranchLimit: 5,
      expandedTopicAccess: {
        canPreviewAllTopics: true,
        isPrivilegedPreview: false,
        costState: "uses_search_credit",
      },
    });

    expect(html).toContain("Ich habe 4 Themenbereiche");
    expect(html).toContain("Ein weiteres Thema wurde erkannt.");
    expect(html).toContain("Weiteres Thema anzeigen");
    expect(html).toContain("Nur mit diesen 3 weiterarbeiten");
    expect(html).toContain("Später");
    expect(html).toContain("Die vollständige Quellenprüfung nutzt 1 Recherche-Kontingent.");
    expect(html).not.toContain("0 EUR");
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
    expect(html).toContain("Offene Fragen");
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

    expect(followupSource).toContain("Details & Transparenz");
    expect(followupSource).toContain("PlaceClarificationPanel");
    expect(followupSource).toContain("StructureProposalPanel");
    expect(followupSource).toContain("NextStepPanel");
    expect(followupSource).toContain("data-create-chat-thread");
    expect(followupSource).toContain("data-mobile-inline-create-actions");
    expect(followupSource).toContain("nextStepsCount");
    expect(followupSource).toContain("Erkannte Themen");
    expect(followupSource).toContain("unreadLabel");
    expect(followupSource).toContain("data-structure-overview-grid");
    expect(followupSource).toContain("data-create-structure-rail");
    expect(followupSource).toContain("const [detailsOpen, setDetailsOpen] = React.useState(false);");
    expect(followupSource).toContain("{detailsOpen ? (");
    expect(followupSource).toContain("aria-expanded={detailsOpen}");
    expect(clientSource).not.toContain("CreateInlineAnalysisScene");
    expect(clientSource).toContain("CreateWorkspaceShell");
    expect(linkClarificationSource).not.toContain("sourceHints");
  });
});
