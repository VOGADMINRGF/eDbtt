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

function renderVisualFollowup() {
  return renderToStaticMarkup(
    <CreateVisualFollowup
      result={FOLLOWUP_RESULT}
      ctaHref="/dossier?topic=schulwege"
      factcheckMessage="Optional. Startet erst nach bewusster Bestätigung. Keine automatische Kostenbuchung."
      onConfirm={() => {}}
      onEdit={() => {}}
      onOpenNewAnlassraum={() => {}}
      onSaveForLater={() => {}}
      onStartOptionalService={() => {}}
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
      ctaHref="/dossier?topic=kommunale-prioritaeten"
      isConfirmed={isConfirmed}
      factcheckMessage="Optional. Startet erst nach bewusster Bestätigung. Keine automatische Kostenbuchung."
      onConfirm={() => {}}
      onEdit={() => {}}
      onOpenNewAnlassraum={() => {}}
      onSaveForLater={() => {}}
      onStartOptionalService={() => {}}
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

  it("makes buttons and free writing visible in parallel", () => {
    const html = renderVisualFollowup();

    expect(html).toContain("Schreib einfach weiter");
    expect(html).toContain("Ja, Struktur übernehmen");
    expect(html).toContain("Arbeitsstand speichern");
    expect(html).toContain("Faktencheck / Deep Search starten");
  });

  it("renders a compact structure overview and only one active branch detail at a time", () => {
    const html = renderMultiBranchVisualFollowup();

    expect(html).toContain("Du");
    expect(html).toContain("Dein Beitrag wurde aufgenommen.");
    expect(html).toContain("Deine Struktur auf einen Blick");
    expect(html).toContain("Prioritäten");
    expect(html).toContain("Themencluster");
    expect(html).toContain("Fragen &amp; Abstimmung");
    expect(html).toContain("Nächste Schritte");
    expect(html).toContain("Focus Card");
    expect(html).toContain("Knapper Bedarf");
    expect(html).toContain("Wichtigste Frage");
    expect(html).toContain("data-mobile-inline-create-actions");
    expect(html).toContain("role=\"tablist\"");
    expect(html).toContain("role=\"tab\"");
    expect(html).toContain("role=\"tabpanel\"");
    expect(html).toContain("aria-controls=\"create-overview-panel-clusters\"");
    expect((html.match(/data-focus-card-branch-selector/g) ?? [])).toHaveLength(3);
    expect((html.match(/data-focus-card-detail/g) ?? [])).toHaveLength(1);
  });

  it("switches the sticky mobile action flow after confirmation", () => {
    const html = renderMultiBranchVisualFollowup(true);

    expect(html).toContain("Nächster Schritt");
    expect(html).toContain("Die wichtigste Aktion bleibt direkt unter dem aktiven Arbeitsstand erreichbar.");
    expect(html).toContain("Thema öffnen");
    expect(html).toContain("Prüfen");
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

  it("keeps the mobile follow-up layout single-column instead of mini-card grids", () => {
    const followupSource = readFileSync(
      resolve(process.cwd(), "src/features/create/CreateVisualFollowup.tsx"),
      "utf8",
    );
    const linkClarificationSource = readFileSync(
      resolve(process.cwd(), "src/features/create/CreateLinkIntakeClarification.tsx"),
      "utf8",
    );

    expect(followupSource).not.toContain("lg:grid-cols-2");
    expect(followupSource).not.toContain("min-w-[248px]");
    expect(followupSource).toContain("Mobile-first als Tabs mit aktiver Karte");
    expect(followupSource).toContain("data-mobile-inline-create-actions");
    expect(followupSource).toContain("resolveNextIndexFromKey");
    expect(followupSource).toContain("aria-selected={isActive}");
    expect(followupSource).not.toContain("aria-pressed={isActive}");
    expect(followupSource).not.toContain("data-mobile-sticky-create-actions");
    expect(followupSource).not.toContain("fixed inset-x-3");
    expect(linkClarificationSource).not.toContain("sm:grid-cols-2");
  });
});
