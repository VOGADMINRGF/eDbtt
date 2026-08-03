import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type {
  ContentReleaseAiClassification,
  ContentReleaseWorkbenchTarget,
} from "@features/contentReleaseWorkbench";
import ContentReleaseWorkbenchActions from "@/app/admin/review/ContentReleaseWorkbenchActions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

function buildTarget(
  classification: ContentReleaseAiClassification | null,
): ContentReleaseWorkbenchTarget {
  return {
    targetType: "topic_page",
    targetLabel: "Öffentliche Themenseite",
    suggestedTitle: "Transparenter Inhalt",
    targetId: "topic-1",
    prepared: true,
    previewHref: "/topic/topic-1?previewTopicPage=1",
    publicHref: null,
    shareHref: null,
    qrHref: null,
    publicLink: null,
    publishStatus: "internal_review",
    publishStatusLabel: "Arbeitsstand",
    visibilityState: "internal_review",
    visibilityLabel: "Interner Review",
    statusLabel: "Arbeitsstand",
    statusHint: "Bewusst vorbereiteter Arbeitsstand.",
    canPrepare: false,
    canMakeVisible: true,
    canPreparePublication: true,
    canRevokeVisibility: false,
    canArchive: true,
    canCreateQrLink: false,
    auditEvents: [],
    aiTransparencyReadiness: {
      classification,
      visibleLabelKey:
        classification === "ai_assisted"
          ? "ai_assisted_editorially_reviewed"
          : classification === "ai_generated_reviewed"
            ? "ai_generated_editorially_reviewed"
            : null,
      humanReview: {
        completed: true,
        completedAt: "2026-08-03T10:30:00.000Z",
        auditRef: "review-queue-audit-1",
      },
      editorialApproval: {
        approved: false,
        approvedAt: null,
        auditRef: null,
        responsibleRole: null,
      },
      blockers: ["editorial_approval_pending"],
    },
  };
}

function render(classification: ContentReleaseAiClassification | null) {
  return renderToStaticMarkup(
    <ContentReleaseWorkbenchActions
      itemId="create_handoff:persisted:handoff-1"
      sourceKind="create_handoff"
      sourceId="handoff-1"
      contentReleasePersistence={{
        mode: "persistent_primary",
        label: "Persistenter Content-Release-Store",
        summary: "Auditierbar gespeichert.",
        repositoryInterface: "ContentReleaseRepository",
        storeKind: "mongo_collection",
        productionTruth: true,
        restartReconstructable: true,
        deploymentReconstructable: true,
      }}
      contentReleaseWorkbench={{
        intro: "Review-first",
        sourceKind: "create_handoff",
        sourceId: "handoff-1",
        targets: [buildTarget(classification)],
      }}
    />,
  );
}

describe("content release AI transparency UI handoff", () => {
  it("shows classification, required label, review, approval, and real blockers", () => {
    const html = render("ai_assisted");
    expect(html).toContain("KI-Klassifizierung");
    expect(html).toContain("Rein menschlicher Inhalt");
    expect(html).toContain("Mit KI unterstützt");
    expect(html).toContain("Wesentlich KI-generiert");
    expect(html).toContain("Mit KI unterstützt · redaktionell geprüft");
    expect(html).toContain("Menschliche Prüfung");
    expect(html).toContain("Serverseitig belegt");
    expect(html).toContain("Redaktionelle Freigabe");
    expect(html).toContain("Noch nicht protokolliert");
    expect(html).toContain("Veröffentlichung ist noch blockiert");
    expect(html).toContain(
      "Redaktionelle Freigabe wird erst mit der autorisierten öffentlichen Aktion protokolliert",
    );
  });

  it("shows no AI label for a persisted human-only classification", () => {
    const html = render("human_only");
    expect(html).toContain("Kein KI-Label");
    expect(html).not.toContain('data-ai-transparency-label="ai_generated');
  });

  it("sends only classification and never client-asserted audit truth", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/admin/review/ContentReleaseWorkbenchActions.tsx"),
      "utf8",
    );
    const requestBody = source.slice(
      source.indexOf("body: JSON.stringify({"),
      source.indexOf("const body = await res.json"),
    );
    expect(requestBody).toContain("aiClassification: input.aiClassification");
    expect(requestBody).not.toContain("endpoint:");
    expect(requestBody).not.toContain("aiTransparency");
    expect(source).toContain(
      "Actor,\n                    Review, Freigabe, Audit-Referenzen, Provenienz und Bindung entstehen",
    );
  });
});
