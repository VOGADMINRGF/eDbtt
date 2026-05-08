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
    expect(linkClarificationSource).not.toContain("sm:grid-cols-2");
  });
});
