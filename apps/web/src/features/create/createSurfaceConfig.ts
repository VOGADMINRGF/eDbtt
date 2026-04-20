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
  helperText: string;
  placeholder: string;
  ctaLabel: string;
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
        description: "Anliegen, Hinweise und Fragen einbringen.",
        helperText:
          "Bringe dein Anliegen, deinen Hinweis oder deine Frage ein. Wir ordnen den Text thematisch ein und zeigen die nächsten Schritte.",
        placeholder:
          "Beschreibe dein Anliegen, deinen Hinweis oder eine offene Frage. Du kannst auch Links oder Quellenhinweise ergänzen.",
        ctaLabel: "Beitrag einbringen",
        postStartTitle: "Beitragsmodus aktiv",
        postStartLead: "Der Beitrag wird strukturiert ausgewertet und mit passenden Anknüpfungen ergänzt.",
        entryIntent: "issue_signal",
        entryMode: "direct",
      },
      media: {
        id: "media",
        label: "Prüfen",
        description: "Texte, Agenden und Berichte auf Abstimmungsfähigkeit prüfen.",
        helperText:
          "Originaltext beibehalten und gezielt um Prüfstellen, Faktencheck-Hinweise und thematische Einordnung ergänzen.",
        placeholder:
          "Füge hier deinen Text, Entwurf oder Link ein. Wir prüfen Eignung, Resonanzpotenzial und nächste sinnvolle Schritte.",
        ctaLabel: "Prüfung starten",
        postStartTitle: "Prüfmodus aktiv",
        postStartLead: "Der Originaltext bleibt erhalten. Das System ergänzt Prüfstellen und redaktionelle Hinweise.",
        entryIntent: "content_companion",
        entryMode: "direct",
      },
      guided: {
        id: "guided",
        label: "Entwerfen",
        description: "Thema gemeinsam mit Guided Flow und Human Loop ausarbeiten.",
        helperText: "Skizziere das Thema und entwickle es Schritt für Schritt zu einem belastbaren gemeinsamen Arbeitsstand.",
        placeholder:
          "Skizziere Thema, Ziel oder Streitpunkt. Wir führen den Entwurf gemeinsam weiter und halten offene Punkte sichtbar.",
        ctaLabel: "Gemeinsam ausarbeiten",
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
      { href: "/pricing", label: "Preise & Pakete" },
      { href: "/unterstuetzen", label: "Zur Initiative" },
    ] as const,
    composer: {
      headline: {
        line1Lead: "Deine",
        line1Accent: "Meinung",
        line1Tail: "zählt.",
        line2Lead: "Gib deiner",
        line2Accent: "Stimme",
        line2Mid: "ein neues",
        line2AccentB: "Gewicht",
        line2Tail: "!",
      },
      modeSwitchAriaLabel: "Modusauswahl",
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
      badgeCanonical: "Kanonischer Einstieg",
      sublineCanonical:
        "Ein Feld, drei Wege: Dein Text wird je nach Modus als Beitrag eingeordnet, als Text geprüft oder als gemeinsamer Entwurf weitergeführt.",
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
        helperText:
          "Share your concern, signal or question. We classify the text and make next steps visible.",
        placeholder:
          "Describe your concern, signal or open question. You can also include links or source references.",
        ctaLabel: "Contribute",
        postStartTitle: "Issue mode active",
        postStartLead: "Your input is structured and enriched with relevant follow-up paths.",
        entryIntent: "issue_signal",
        entryMode: "direct",
      },
      media: {
        id: "media",
        label: "Review",
        description: "Check texts, agendas and reports for vote readiness.",
        helperText:
          "Keep the original text intact and add only review points, fact-check hints and context where needed.",
        placeholder:
          "Paste your text, draft or link. We check suitability, resonance potential and useful next steps.",
        ctaLabel: "Start review",
        postStartTitle: "Review mode active",
        postStartLead: "The original text stays intact while review and editorial hints are added.",
        entryIntent: "content_companion",
        entryMode: "direct",
      },
      guided: {
        id: "guided",
        label: "Draft together",
        description: "Develop a topic together with guided flow and human loop.",
        helperText: "Outline the topic and shape it step by step into a robust shared working state.",
        placeholder:
          "Sketch the topic, objective or conflict. We guide the draft forward and keep open questions explicit.",
        ctaLabel: "Co-create draft",
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
      { href: "/pricing", label: "Pricing & packages" },
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
