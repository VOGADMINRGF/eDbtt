import type { CreateEntryIntent, CreateEntryMode } from "@/features/create/orchestratorIntentContract";
import type { CreateProductMode } from "@/features/create/createProductModes";
import type { CreateIntent } from "@/features/create/intents";

export type CreateSurfaceLocale = "de" | "en";

export function resolveCreateSurfaceLocale(locale: string | null | undefined): CreateSurfaceLocale {
  if (String(locale ?? "").toLowerCase().startsWith("en")) return "en";
  return "de";
}

export type CreateSurfaceModeDefinition = {
  id: CreateProductMode;
  label: string;
  description: string;
  inputLabel: string;
  helperText: string;
  placeholder: string;
  ctaLabel: string;
  minimumInputHint: string;
  firstQuestion: string;
  firstQuestionPlaceholder: string;
  workingStateTitle: string;
  recognizedTypeLabel: string;
  openPoints: string[];
  nextActions: string[];
  postStartTitle: string;
  postStartLead: string;
  entryIntent: CreateEntryIntent;
  entryMode: CreateEntryMode;
};

export type CreateContextAnchorDefinition = {
  id: CreateIntent;
  label: string;
  lead: string;
  mode: CreateProductMode;
  helperText: string;
  placeholder?: string;
};

export type CreateHelperLinkDefinition = {
  href: string;
  label: string;
};

export type CreateComposerHeadlineText = {
  line1Lead: string;
  line1Accent: string;
  line1Tail: string;
  line2Lead: string;
  line2Accent: string;
  line2Mid: string;
  line2AccentB: string;
  line2Tail: string;
};

export type CreateComposerTexts = {
  headline: CreateComposerHeadlineText;
  modeSwitchAriaLabel: string;
  quickActionsTitle: string;
  inputLabel: string;
  attachLabel: string;
  attachAria: string;
  voiceStartAria: string;
  voiceStopAria: string;
  voiceStartLabel: string;
  voiceStopLabel: string;
  contextEntryTitle: string;
  orientationTitle: string;
  attachmentsSelected: (files: File[]) => string;
  attachmentsTooMany: (maxFiles: number) => string;
  attachmentsTooLarge: string;
  attachmentFileTooLarge: (name: string) => string;
  voiceUnsupported: string;
  voiceFailed: string;
};

export type CreateSurfaceTexts = {
  badgeCanonical: string;
  sublineCanonical: string;
  followupQuestionLabel: string;
  followupQuestionSaveLabel: string;
  followupQuestionSavedLabel: string;
  actionNotAvailableLabel: string;
  returnToContextLabel: string;
  goToRoundsLabel: string;
  rundenContextTitle: string;
  rundenContextWithLabel: (label: string) => string;
  rundenContextFallback: string;
  rundenContextReturnHint: string;
  intakeMissingError: string;
  followupContextPrefix: string;
  guidedTitle: string;
  guidedLead: string;
  guidedInputLabel: string;
  guidedPlaceholder: string;
  guidedCta: string;
  guidedHint: string;
  guidedMissingError: string;
  guidedWorkspacePrefix: string;
  startBusyStatus: string;
  startBusyLead: string;
  startFailedError: string;
  followupContributeStatus: string;
  followupContributeTitle: string;
  followupContributeLead: string;
  followupOriginalTextLabel: string;
  followupUnderstandingLabel: string;
  followupUnderstandingLine: (label: string) => string;
  followupNotPublishedLabel: string;
  followupNextStepLabel: string;
  followupNextStepLead: string;
  followupGuidedStatus: string;
  followupGuidedTitle: string;
  followupGuidedLead: string;
  followupReviewFrameTitle: string;
  followupReviewFrameLead: string;
  followupActionToReview: string;
  followupActionToGuided: string;
  demoBadge: (personaLabel: string) => string;
  demoSubline: string;
  demoStatusLine: (submitted: string, inReview: string, confirmed: string) => string;
  demoToRoundsLabel: string;
  demoStudioTitle: string;
};

type CreateSurfaceLocaleBundle = {
  modeDefinitions: Record<CreateProductMode, CreateSurfaceModeDefinition>;
  contextAnchors: readonly CreateContextAnchorDefinition[];
  helperLinks: readonly CreateHelperLinkDefinition[];
  composer: CreateComposerTexts;
  texts: CreateSurfaceTexts;
};

const CREATE_SURFACE_BUNDLES: Record<CreateSurfaceLocale, CreateSurfaceLocaleBundle> = {
  de: {
    modeDefinitions: {
      analyze: {
        id: "analyze",
        label: "Beitragen",
        description: "Hinweise, Quellen oder Anliegen einbringen.",
        inputLabel: "Beitrag einbringen",
        helperText:
          "Teile einen Hinweis, eine Beobachtung, eine Quelle oder ein Anliegen. eDebatte ordnet deinen Beitrag einem Thema, Dossier oder Anlassraum zu.",
        placeholder:
          "Beschreibe deinen Hinweis, deine Beobachtung oder dein Anliegen …",
        ctaLabel: "Beitrag strukturieren",
        minimumInputHint:
          "Beschreibe dein Anliegen noch etwas genauer, damit eDebatte daraus einen Arbeitsstand bilden kann.",
        firstQuestion: "Was ist der wichtigste Punkt, der aus deinem Beitrag nicht verloren gehen darf?",
        firstQuestionPlaceholder:
          "Formuliere den Kernpunkt in einem Satz, damit die Einordnung belastbar bleibt.",
        workingStateTitle: "Erster Arbeitsstand für deinen Beitrag",
        recognizedTypeLabel: "Erkannter Beitragstyp",
        openPoints: [
          "Welche Quelle stützt den Kernpunkt?",
          "Welche Perspektive fehlt noch?",
          "Wer sollte als Nächstes eingebunden werden?",
        ],
        nextActions: [
          "Als Hinweis speichern",
          "Dossier-Bezug prüfen",
          "Weitere Quelle ergänzen",
          "Beteiligung vorbereiten",
        ],
        postStartTitle: "Beitragsmodus aktiv",
        postStartLead:
          "Dein Text wurde aufgenommen. Prüfe die Einordnung und wähle danach den nächsten Schritt.",
        entryIntent: "issue_signal",
        entryMode: "direct",
      },
      media: {
        id: "media",
        label: "Prüfen",
        description: "Aussagen, Texte oder Themen auf Belege und offene Fragen prüfen.",
        inputLabel: "Thema oder Aussage prüfen",
        helperText:
          "Prüfe eine Behauptung, einen Text, eine Quelle oder ein Thema auf Belege, offene Fragen, Gegenpositionen und Zuständigkeiten.",
        placeholder:
          "Füge eine Aussage, einen Text, eine Quelle oder ein Thema ein, das geprüft werden soll …",
        ctaLabel: "Prüfung starten",
        minimumInputHint:
          "Nenne die Aussage oder den Text etwas genauer, damit die Prüfung sinnvoll starten kann.",
        firstQuestion: "Welche Aussage oder Entscheidung soll besonders genau geprüft werden?",
        firstQuestionPlaceholder:
          "Benenne die zentrale Aussage oder Entscheidung, die im Fokus stehen soll.",
        workingStateTitle: "Erster Prüfstand",
        recognizedTypeLabel: "Erkannter Prüfgegenstand",
        openPoints: [
          "Welche Belege fehlen noch?",
          "Welche Gegenposition ist bisher unterbelichtet?",
          "Welche Stelle ist zuständig für die Entscheidung?",
        ],
        nextActions: [
          "Als Dossier weiterführen",
          "Quellen ergänzen",
          "Gegenpositionen sammeln",
          "Prüfbericht vorbereiten",
        ],
        postStartTitle: "Prüfmodus aktiv",
        postStartLead: "Der Originaltext bleibt erhalten. Das System ergänzt Prüfstellen und redaktionelle Hinweise.",
        entryIntent: "content_companion",
        entryMode: "direct",
      },
      guided: {
        id: "guided",
        label: "Entwerfen",
        description: "Dossiers, Fragenkataloge oder Beteiligungsrunden vorbereiten.",
        inputLabel: "Entwurf vorbereiten",
        helperText:
          "Skizziere ein Thema, eine Idee oder ein Ziel. eDebatte hilft dir, daraus einen strukturierten Entwurf, Fragenkatalog oder Beteiligungsansatz zu entwickeln.",
        placeholder:
          "Beschreibe, was entstehen soll — zum Beispiel ein Dossier, eine Beteiligungsrunde, ein Fragenkatalog oder ein Vorschlag …",
        ctaLabel: "Entwurf ausarbeiten",
        minimumInputHint:
          "Beschreibe den Entwurfswunsch etwas konkreter, damit daraus ein belastbarer Arbeitsstand werden kann.",
        firstQuestion:
          "Für wen soll der Entwurf am Ende nutzbar sein und welche Entscheidung soll vorbereitet werden?",
        firstQuestionPlaceholder:
          "Beschreibe Zielgruppe und Entscheidungskontext, damit der Entwurf sauber ausgerichtet werden kann.",
        workingStateTitle: "Erster Entwurfsstand",
        recognizedTypeLabel: "Erkannter Entwurfszweck",
        openPoints: [
          "Welche Bausteine fehlen für einen belastbaren Entwurf?",
          "Welche Perspektiven müssen vorab einbezogen werden?",
          "Welche Zuständigkeit entscheidet über die Umsetzung?",
        ],
        nextActions: [
          "Dossier-Struktur erstellen",
          "Fragenkatalog ausarbeiten",
          "Beteiligungsrunde vorbereiten",
          "Mandatslogik skizzieren",
        ],
        postStartTitle: "Entwurfsmodus aktiv",
        postStartLead:
          "Der Einstieg fokussiert Rückfragen und nächsten Arbeitsschritt statt einer einmaligen Snapshot-Analyse.",
        entryIntent: "round_setup",
        entryMode: "guided",
      },
    },
    contextAnchors: [
      {
        id: "source",
        label: "Quelle einreichen",
        lead: "Link, Dokument oder Hinweis mit kurzer Relevanzbeschreibung.",
        mode: "media",
        helperText:
          "Füge hier eine Quelle, einen Link, ein Dokument oder einen Hinweis ein. Beschreibe kurz, warum diese Quelle relevant ist.",
        placeholder:
          "Teile die Quelle und beschreibe kurz, was daran geprüft oder öffentlich eingeordnet werden soll.",
      },
      {
        id: "question",
        label: "Offene Frage",
        lead: "Unklare Punkte konkretisieren und klärbar machen.",
        mode: "analyze",
        helperText:
          "Formuliere die offene Frage so konkret wie möglich. Worum geht es, wer ist betroffen und was ist noch unklar?",
      },
      {
        id: "perspective",
        label: "Perspektive ergänzen",
        lead: "Ergänzende Sichtweise mit Kontext und Betroffenheit einbringen.",
        mode: "analyze",
        helperText: "Beschreibe deine Perspektive mit Kontext, damit fehlende Sichtweisen im Ergebnis sichtbar werden.",
      },
      {
        id: "objection",
        label: "Widerspruch einreichen",
        lead: "Punkte markieren, die aus deiner Sicht nicht tragen.",
        mode: "analyze",
        helperText:
          "Beschreibe, welcher Punkt aus deiner Sicht nicht stimmt, unvollständig ist oder neu eingeordnet werden muss.",
      },
      {
        id: "option",
        label: "Option vorschlagen",
        lead: "Konstruktive Alternative mit Umsetzungsskizze einbringen.",
        mode: "guided",
        helperText:
          "Skizziere die Option so, dass Ziel, Wirkung und offene Abwägungen gemeinsam geklärt werden können.",
      },
      {
        id: "claim",
        label: "Kernaussage formulieren",
        lead: "Klaren Kernpunkt für Diskussion und Abstimmung ausarbeiten.",
        mode: "analyze",
        helperText:
          "Formuliere die Kernaussage präzise. Wir helfen dir bei Einordnung, offenen Fragen und Anschlussfähigkeit.",
      },
    ] as const,
    helperLinks: [
      { href: "/runden/demo", label: "So funktioniert's" },
      { href: "/dossier/demo", label: "Dossier & Faktencheck" },
      { href: "/pricing", label: "Preise" },
      { href: "/unterstuetzen", label: "Zur Initiative" },
    ] as const,
    composer: {
      headline: {
        line1Lead: "Beschreibe,",
        line1Accent: "was geklärt werden soll",
        line1Tail: ".",
        line2Lead: "",
        line2Accent: "",
        line2Mid: "",
        line2AccentB: "",
        line2Tail: "",
      },
      modeSwitchAriaLabel: "Modusauswahl",
      quickActionsTitle: "Schnell starten",
      inputLabel: "Beitrag",
      attachLabel: "Anhang",
      attachAria: "Anhang hinzufügen",
      voiceStartAria: "Sprachaufnahme starten",
      voiceStopAria: "Sprachaufnahme stoppen",
      voiceStartLabel: "Sprache",
      voiceStopLabel: "Stoppen",
      contextEntryTitle: "Kontext (optional)",
      orientationTitle: "Hilfebereich",
      attachmentsSelected: (files) =>
        `${files.length} Anhang${files.length === 1 ? "" : "e"} ausgewählt: ${files
          .map((file) => file.name)
          .join(", ")}`,
      attachmentsTooMany: (maxFiles) => `Bitte maximal ${maxFiles} Dateien auswählen.`,
      attachmentsTooLarge: "Anhänge sind zu groß (max. 20 MB gesamt).",
      attachmentFileTooLarge: (name) => `Datei zu groß: ${name} (max. 8 MB).`,
      voiceUnsupported: "Sprachaufnahme wird in diesem Browser nicht unterstützt.",
      voiceFailed: "Sprachaufnahme ist fehlgeschlagen. Bitte erneut versuchen.",
    },
    texts: {
      badgeCanonical: "THEMA STARTEN",
      sublineCanonical:
        "Ob Hinweis, Prüfanfrage oder Entwurf: eDebatte macht aus deinem Text einen strukturierten Arbeitsstand mit offenen Fragen, möglichen Quellen, Optionen und Zuständigkeiten.",
      followupQuestionLabel: "Erste Rückfrage zum Arbeitsstart",
      followupQuestionSaveLabel: "Rückfrage speichern",
      followupQuestionSavedLabel: "Rückfrage beantwortet. Nächster Schritt ist möglich.",
      actionNotAvailableLabel: "Dieser Schritt ist in diesem Pfad noch nicht verfügbar.",
      returnToContextLabel: "Zum Anlass zurück",
      goToRoundsLabel: "Zu den Anlässen",
      rundenContextTitle: "Aus laufendem Anlass gestartet",
      rundenContextWithLabel: (label) => `Kontext: ${label}.`,
      rundenContextFallback: "Dieser Beitrag bleibt im laufenden Anlasskontext.",
      rundenContextReturnHint: "Nach dem Abschluss geht es zurück in den Arbeitsstand.",
      intakeMissingError: "Bitte beschreibe zuerst deinen Beitrag.",
      followupContextPrefix: "Kontext",
      guidedTitle: "Erste Rückfrage zum Arbeitsstart",
      guidedLead:
        "Welchen Kernkonflikt möchtest du als Erstes klären und welche Entscheidung ist dabei besonders wichtig?",
      guidedInputLabel: "Erste Rückfrage beantworten",
      guidedPlaceholder:
        "Zum Beispiel: Welche Entscheidung steht an, wer ist betroffen und was muss dafür geklärt werden?",
      guidedCta: "Arbeitsstand starten",
      guidedHint: "Danach startet die geführte Erarbeitung im nächsten Schritt.",
      guidedMissingError:
        "Bitte beantworte die erste Rückfrage, damit der Arbeitsstand starten kann.",
      guidedWorkspacePrefix: "Geführter Fokus",
      startBusyStatus: "Wird eingeordnet …",
      startBusyLead: "Wir ordnen deinen Beitrag ein …",
      startFailedError:
        "Dein Beitrag konnte gerade nicht aufgenommen werden. Bitte versuche es erneut.",
      followupContributeStatus: "Beitrag aufgenommen",
      followupContributeTitle: "Dein Text wurde aufgenommen.",
      followupContributeLead:
        "Bitte prüfe die Einordnung, bevor er weiterverwendet wird.",
      followupOriginalTextLabel: "Dein Originaltext",
      followupUnderstandingLabel: "So haben wir es verstanden",
      followupUnderstandingLine: (label) => `Eingeordnet als: ${label}`,
      followupNotPublishedLabel: "Noch nicht veröffentlicht.",
      followupNextStepLabel: "Nächster Schritt",
      followupNextStepLead:
        "Wähle den nächsten Schritt: Anlass öffnen, prüfen oder als Entwurf weiterführen.",
      followupGuidedStatus: "Entwurfsmodus aktiv",
      followupGuidedTitle: "Der Entwurf läuft jetzt als gemeinsamer Arbeitsstand",
      followupGuidedLead:
        "Du kannst den Entwurf im Anlasskontext weiterführen oder ihn bei Bedarf bewusst in den Prüfbereich übergeben.",
      followupReviewFrameTitle: "Prüfbereich aktiv",
      followupReviewFrameLead:
        "Die Prüfung wird vorbereitet. Der folgende Bereich ist auf Analyse, Fakten- und Qualitätsprüfung ausgerichtet.",
      followupActionToReview: "Zur Prüfung weitergeben",
      followupActionToGuided: "Als Entwurf weiterführen",
      demoBadge: (personaLabel) => `Demo · ${personaLabel}`,
      demoSubline:
        "Teile deine Aussage, Frage, Quelle oder Einschätzung in einem Feld. Die Demo nutzt dieselbe Eingabemaske wie `/create` und hält den Persona-Kontext stabil.",
      demoStatusLine: (submitted, inReview, confirmed) =>
        `Statussprache bleibt konsistent: ${submitted} → ${inReview} → ${confirmed}`,
      demoToRoundsLabel: "Zu den Demo-Anlässen",
      demoStudioTitle: "Weiter im Demo-Studio",
    },
  },
  en: {
    modeDefinitions: {
      analyze: {
        id: "analyze",
        label: "Contribute",
        description: "Bring in concerns, signals and open questions.",
        inputLabel: "Contribute input",
        helperText:
          "Share your concern, signal or question. We classify the text and make next steps visible.",
        placeholder:
          "Describe your concern, signal or open question. You can also include links or source references.",
        ctaLabel: "Contribute",
        minimumInputHint:
          "Please add a little more detail so eDebatte can create a useful working state.",
        firstQuestion: "What is the one point from your contribution that must not get lost?",
        firstQuestionPlaceholder: "Summarize the key point in one sentence.",
        workingStateTitle: "First working state for your contribution",
        recognizedTypeLabel: "Recognized contribution type",
        openPoints: [
          "Which source best supports the key point?",
          "Which perspective is still missing?",
          "Who should be involved next?",
        ],
        nextActions: [
          "Save as signal",
          "Check dossier relation",
          "Add another source",
          "Prepare participation",
        ],
        postStartTitle: "Issue mode active",
        postStartLead:
          "Your text was captured. Review the classification and choose the next step.",
        entryIntent: "issue_signal",
        entryMode: "direct",
      },
      media: {
        id: "media",
        label: "Review",
        description: "Check texts, agendas and reports for vote readiness.",
        inputLabel: "Review target",
        helperText:
          "Keep the original text intact and add only review points, fact-check hints and context where needed.",
        placeholder:
          "Paste your text, draft or link. We check suitability, resonance potential and useful next steps.",
        ctaLabel: "Start review",
        minimumInputHint:
          "Please define the statement or text more clearly so the review can start reliably.",
        firstQuestion: "Which statement or decision needs the closest review?",
        firstQuestionPlaceholder: "Name the key statement or decision in focus.",
        workingStateTitle: "First review state",
        recognizedTypeLabel: "Recognized review target",
        openPoints: [
          "Which evidence is still missing?",
          "Which counter-position is underrepresented?",
          "Which authority owns the decision?",
        ],
        nextActions: [
          "Continue as dossier",
          "Add sources",
          "Collect counter-positions",
          "Prepare review brief",
        ],
        postStartTitle: "Review mode active",
        postStartLead: "The original text stays intact while review and editorial hints are added.",
        entryIntent: "content_companion",
        entryMode: "direct",
      },
      guided: {
        id: "guided",
        label: "Draft together",
        description: "Develop a topic together with guided flow and human loop.",
        inputLabel: "Draft objective",
        helperText: "Outline the topic and shape it step by step into a robust shared working state.",
        placeholder:
          "Sketch the topic, objective or conflict. We guide the draft forward and keep open questions explicit.",
        ctaLabel: "Co-create draft",
        minimumInputHint:
          "Please add more context on what should be drafted so a structured working state can be formed.",
        firstQuestion:
          "Who should use this draft in the end, and which decision should it prepare?",
        firstQuestionPlaceholder:
          "Describe target audience and decision context for this draft.",
        workingStateTitle: "First draft state",
        recognizedTypeLabel: "Recognized draft purpose",
        openPoints: [
          "Which building blocks are still missing?",
          "Which perspectives should be included early?",
          "Which authority decides on implementation?",
        ],
        nextActions: [
          "Create dossier structure",
          "Expand question set",
          "Prepare participation round",
          "Sketch mandate logic",
        ],
        postStartTitle: "Draft mode active",
        postStartLead:
          "This path focuses on follow-up questions and working progress instead of a one-shot snapshot.",
        entryIntent: "round_setup",
        entryMode: "guided",
      },
    },
    contextAnchors: [
      {
        id: "source",
        label: "Submit a source",
        lead: "Share a link or document and briefly explain relevance.",
        mode: "media",
        helperText:
          "Add a source, link or document and explain why it matters for the review.",
        placeholder: "Share the source and explain what should be reviewed or contextualized.",
      },
      {
        id: "question",
        label: "Open question",
        lead: "Make unclear points explicit and answerable.",
        mode: "analyze",
        helperText:
          "Formulate the open question as clearly as possible. What is unclear, who is affected, what needs clarification?",
      },
      {
        id: "perspective",
        label: "Add perspective",
        lead: "Contribute a missing perspective with context.",
        mode: "analyze",
        helperText: "Describe your perspective and context so missing viewpoints become visible.",
      },
      {
        id: "objection",
        label: "Raise objection",
        lead: "Mark points that seem inaccurate or incomplete.",
        mode: "analyze",
        helperText:
          "Describe what seems inaccurate, incomplete or in need of re-framing from your perspective.",
      },
      {
        id: "option",
        label: "Suggest option",
        lead: "Add a constructive alternative with implementation hints.",
        mode: "guided",
        helperText: "Sketch the option so goals, impact and trade-offs can be worked through together.",
      },
      {
        id: "claim",
        label: "Define core statement",
        lead: "Formulate a clear core statement for debate and voting.",
        mode: "analyze",
        helperText: "Formulate the core statement precisely. We help with context, open questions and fit.",
      },
    ] as const,
    helperLinks: [
      { href: "/runden/demo", label: "How it works" },
      { href: "/dossier/demo", label: "Dossier & fact check" },
      { href: "/pricing", label: "Pricing" },
      { href: "/unterstuetzen", label: "About the initiative" },
    ] as const,
    composer: {
      headline: {
        line1Lead: "Your",
        line1Accent: "opinion",
        line1Tail: "matters.",
        line2Lead: "Give your",
        line2Accent: "voice",
        line2Mid: "new",
        line2AccentB: "weight",
        line2Tail: "!",
      },
      modeSwitchAriaLabel: "Mode selection",
      quickActionsTitle: "Quick actions",
      inputLabel: "Contribution",
      attachLabel: "Attach",
      attachAria: "Add attachment",
      voiceStartAria: "Start voice input",
      voiceStopAria: "Stop voice input",
      voiceStartLabel: "Voice",
      voiceStopLabel: "Stop",
      contextEntryTitle: "Context (optional)",
      orientationTitle: "Help",
      attachmentsSelected: (files) =>
        `${files.length} attachment${files.length === 1 ? "" : "s"} selected: ${files
          .map((file) => file.name)
          .join(", ")}`,
      attachmentsTooMany: (maxFiles) => `Please select no more than ${maxFiles} files.`,
      attachmentsTooLarge: "Attachments are too large (max 20 MB total).",
      attachmentFileTooLarge: (name) => `File too large: ${name} (max 8 MB).`,
      voiceUnsupported: "Voice input is not supported in this browser.",
      voiceFailed: "Voice input failed. Please try again.",
    },
    texts: {
      badgeCanonical: "Canonical entry",
      sublineCanonical:
        "One field, three paths: your text can enter as contribution, be reviewed for readiness, or move into collaborative drafting.",
      followupQuestionLabel: "First follow-up question",
      followupQuestionSaveLabel: "Save answer",
      followupQuestionSavedLabel: "Follow-up answered. Next step is ready.",
      actionNotAvailableLabel: "This step is not available in the current flow yet.",
      returnToContextLabel: "Back to round",
      goToRoundsLabel: "Open rounds",
      rundenContextTitle: "Started from an active round",
      rundenContextWithLabel: (label) => `Context: ${label}.`,
      rundenContextFallback: "This contribution stays within the active round context.",
      rundenContextReturnHint: "After completion, you return to the working state.",
      intakeMissingError: "Please describe your contribution first.",
      followupContextPrefix: "Context",
      guidedTitle: "First follow-up question",
      guidedLead: "Which core conflict should be clarified first and which decision is most important?",
      guidedInputLabel: "Answer the first follow-up question",
      guidedPlaceholder:
        "For example: Which decision is pending, who is affected, and what must be clarified first?",
      guidedCta: "Start working state",
      guidedHint: "After this, guided drafting starts in the next step.",
      guidedMissingError: "Please answer the first follow-up question to start the working state.",
      guidedWorkspacePrefix: "Guided focus",
      startBusyStatus: "Classifying …",
      startBusyLead: "We are classifying your contribution …",
      startFailedError: "Your contribution could not be captured right now. Please try again.",
      followupContributeStatus: "Contribution received",
      followupContributeTitle: "Your text was captured.",
      followupContributeLead:
        "Please review the classification before it is reused.",
      followupOriginalTextLabel: "Your original text",
      followupUnderstandingLabel: "How we understood it",
      followupUnderstandingLine: (label) => `Classified as: ${label}`,
      followupNotPublishedLabel: "Not published yet.",
      followupNextStepLabel: "Next step",
      followupNextStepLead: "Choose the next step: open a round, review, or continue as draft.",
      followupGuidedStatus: "Draft mode active",
      followupGuidedTitle: "The draft now continues as a shared working state",
      followupGuidedLead:
        "You can continue drafting in context or explicitly hand over to the review area when needed.",
      followupReviewFrameTitle: "Review area active",
      followupReviewFrameLead:
        "Review preparation is running. The following area focuses on analysis, fact-checking and quality review.",
      followupActionToReview: "Hand over to review",
      followupActionToGuided: "Continue as draft",
      demoBadge: (personaLabel) => `Demo · ${personaLabel}`,
      demoSubline:
        "Share your statement, question, source or assessment in one field. The demo uses the same entry mask as `/create` while keeping persona context stable.",
      demoStatusLine: (submitted, inReview, confirmed) =>
        `Status wording stays consistent: ${submitted} → ${inReview} → ${confirmed}`,
      demoToRoundsLabel: "Go to demo rounds",
      demoStudioTitle: "Continue in demo studio",
    },
  },
};

export const CREATE_SURFACE_MODE_DEFINITIONS = CREATE_SURFACE_BUNDLES.de.modeDefinitions;
export const CREATE_CONTEXT_ANCHOR_DEFINITIONS = CREATE_SURFACE_BUNDLES.de.contextAnchors;
export const CREATE_HELPER_LINKS = CREATE_SURFACE_BUNDLES.de.helperLinks;

export function getCreateSurfaceBundle(locale: CreateSurfaceLocale): CreateSurfaceLocaleBundle {
  return CREATE_SURFACE_BUNDLES[locale];
}

export function getCreateSurfaceModeDefinitions(
  locale: CreateSurfaceLocale,
): Record<CreateProductMode, CreateSurfaceModeDefinition> {
  return CREATE_SURFACE_BUNDLES[locale].modeDefinitions;
}

export function getCreateContextAnchorDefinitions(
  locale: CreateSurfaceLocale,
): readonly CreateContextAnchorDefinition[] {
  return CREATE_SURFACE_BUNDLES[locale].contextAnchors;
}

export function getCreateHelperLinks(locale: CreateSurfaceLocale): readonly CreateHelperLinkDefinition[] {
  return CREATE_SURFACE_BUNDLES[locale].helperLinks;
}

export function getCreateComposerTexts(locale: CreateSurfaceLocale): CreateComposerTexts {
  return CREATE_SURFACE_BUNDLES[locale].composer;
}

export function getCreateSurfaceTexts(locale: CreateSurfaceLocale): CreateSurfaceTexts {
  return CREATE_SURFACE_BUNDLES[locale].texts;
}

export function resolveCreateModeDefinition(
  mode: CreateProductMode,
  locale: CreateSurfaceLocale = "de",
): CreateSurfaceModeDefinition {
  return CREATE_SURFACE_BUNDLES[locale].modeDefinitions[mode];
}

export function resolveCreateContextAnchorById(
  id: CreateIntent | null | undefined,
  locale: CreateSurfaceLocale = "de",
): CreateContextAnchorDefinition | null {
  if (!id) return null;
  return CREATE_SURFACE_BUNDLES[locale].contextAnchors.find((anchor) => anchor.id === id) ?? null;
}
