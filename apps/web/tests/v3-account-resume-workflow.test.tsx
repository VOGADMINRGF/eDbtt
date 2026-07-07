import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildV3AccountResumeWorkflowFromLedgerBranch,
  buildV3AccountResumeWorkflowFromStartDraft,
  default as V3AccountResumeWorkflow,
} from "@/features/create/V3AccountResumeWorkflow";
import { createStartDraftContext } from "@/features/start/startDraftContext";

describe("V3AccountResumeWorkflow", () => {
  it("renders a local account draft with review-first wording and no enum leaks", () => {
    const draft = createStartDraftContext({
      text: "Die Schulwegsicherheit muss im Bezirk besser geklärt werden.",
      origin: "start_relevance_review",
      intent: "needs_reframe",
      targetHint: "create",
      preview: {
        relevance: "needs_reframe",
        possibleTopics: ["Schulwegsicherheit"],
        openQuestions: ["Welcher Bezirk ist gemeint?"],
        suggestedNextSteps: ["Entwurf erst nach Rückfrage weiterführen"],
      },
    });

    const html = renderToStaticMarkup(
      <V3AccountResumeWorkflow model={buildV3AccountResumeWorkflowFromStartDraft(draft!)} />,
    );

    expect(html).toContain("Was wurde aus deinem Beitrag?");
    expect(html).toContain("Aktueller Status: Rückfrage oder Review erforderlich");
    expect(html).toContain("Nächster Schritt: Rückfrage beantworten");
    expect(html).toContain("Beitrag erhalten");
    expect(html).toContain("Thema / Anschluss erkannt");
    expect(html).toContain("Review oder Rückfrage");
    expect(html).toContain("Öffentliche Relevanz noch offen");
    expect(html).not.toContain("review_draft_prepared");
    expect(html).not.toContain("preview_only");
    expect(html).not.toContain("blocked_by_runtime_truth");
  });

  it("shows a persisted review path as dossier and output preparation without fake publication", () => {
    const model = buildV3AccountResumeWorkflowFromLedgerBranch({
      draftSaveStatus: "server_saved",
      handoff: {
        handoffStatus: "prepared",
        handoffTargetType: "factcheck_review",
        handoffTargetUrl: "/factcheck?from=create&packageId=package-1&branchId=branch-1",
        label: "Prüfung und Quellen öffnen",
        description: "Prüfpfad",
        nextWorkspaceLabel: "Prüfung / Quellen",
        reviewPreparationDraft: {
          openQuestions: ["Welche Standorte haben Priorität?"],
          searchTerms: ["Schulsanierung"],
          sourceNeeds: ["Belege zur Kernfrage sammeln"],
          autoStartBlocked: true,
        },
      },
      branch: {
        branchId: "branch-1",
        title: "Schulsanierung",
        summary: "Ein Themenast zur Schulsanierung im Bezirk.",
        selectedAction: "review_or_sources",
        status: "review_draft_prepared",
        visibilityIntent: "public_after_review",
        claimCandidates: [
          {
            id: "claim-1",
            text: "Welche Standorte haben Priorität?",
            kind: "question",
          },
        ],
        placeCandidates: ["Reinickendorf"],
        localIssueCandidates: ["Schulinfrastruktur"],
        needsPlaceClarification: false,
        placeClarificationStatus: "answered",
        placeResolutionSource: "none",
        inferredStance: "not_inferred",
        stanceConfirmationStatus: "inferred_only",
        sensitivityLevel: "standard",
        needsReview: true,
        handoffStatus: "prepared",
        handoffTargetType: "factcheck_review",
        handoffTargetUrl: "/factcheck?from=create&packageId=package-1&branchId=branch-1",
        reviewPreparationDraft: {
          openQuestions: ["Welche Standorte haben Priorität?"],
          searchTerms: ["Schulsanierung"],
          sourceNeeds: ["Belege zur Kernfrage sammeln"],
          autoStartBlocked: true,
        },
        targetReference: {
          id: "dossier-1",
          type: "dossier",
          title: "Dossier Schulsanierung",
        },
      } as any,
    });

    const html = renderToStaticMarkup(<V3AccountResumeWorkflow model={model} />);

    expect(html).toContain("Aktueller Status: Review erforderlich");
    expect(html).toContain("Nächster Schritt: Quellenprüfung offen");
    expect(html).toContain("Dossier-Kandidat");
    expect(html).toContain("Ein Anschluss an das Dossier Dossier Schulsanierung ist bereits sichtbar.");
    expect(html).toContain("Output-, Social- oder Briefing-Entwürfe bleiben bis nach Review nur vorbereitete Folgepfade.");
    expect(html).toContain("Noch nicht veröffentlicht");
    expect(html).not.toContain("publish_ready");
    expect(html).not.toContain("approved");
  });

  it("marks participation drafts as prepared but not active or counted", () => {
    const model = buildV3AccountResumeWorkflowFromLedgerBranch({
      draftSaveStatus: "server_saved",
      handoff: {
        handoffStatus: "prepared",
        handoffTargetType: "qr_participation",
        handoffTargetUrl: "/runden?from=create&packageId=package-1&branchId=branch-2",
        label: "QR-Beteiligung öffnen",
        description: "Beteiligungspfad",
        nextWorkspaceLabel: "QR-Beteiligung",
      },
      branch: {
        branchId: "branch-2",
        title: "Sicherer Schulweg",
        summary: "Ein Beteiligungsentwurf für sichere Schulwege.",
        selectedAction: "qr_poll_prepare",
        status: "qr_draft_prepared",
        visibilityIntent: "private_qr",
        claimCandidates: [],
        placeCandidates: [],
        localIssueCandidates: ["Schulweg"],
        needsPlaceClarification: false,
        placeClarificationStatus: "answered",
        placeResolutionSource: "none",
        inferredStance: "pro",
        stanceConfirmationStatus: "confirmed",
        sensitivityLevel: "standard",
        needsReview: false,
        handoffStatus: "prepared",
        handoffTargetType: "qr_participation",
        handoffTargetUrl: "/runden?from=create&packageId=package-1&branchId=branch-2",
        qrParticipationDraft: {
          draftId: "qr-1",
          packageId: "package-1",
          branchId: "branch-2",
          title: "Sicherer Schulweg",
          question: "Wie soll der Schulweg sicherer werden?",
          description: "Beteiligungsentwurf",
          proPrompt: "Was spricht dafür?",
          contraPrompt: "Was spricht dagegen?",
          eventualitiesPrompt: "Welche Folgen hat das?",
          visibilityIntent: "private_qr",
          status: "ready_for_review",
          shareUrl: null,
          qrCodeUrl: null,
          publishedAt: null,
          createdAt: "2026-07-07T09:00:00.000Z",
          updatedAt: "2026-07-07T09:00:00.000Z",
          guardrails: {
            noAutoPublish: true,
            noAutoVote: true,
            noAutoShare: true,
          },
        },
      } as any,
    });

    const html = renderToStaticMarkup(<V3AccountResumeWorkflow model={model} />);

    expect(html).toContain("Aktueller Status: Beteiligungsformat vorbereitet");
    expect(html).toContain("Nächster Schritt: Beteiligungsformat prüfen");
    expect(html).toContain("Anlassraum / Beteiligung");
    expect(html).toContain("Ein QR-Beteiligungsentwurf ist vorbereitet, aber noch nicht geteilt oder veröffentlicht.");
    expect(html).toContain("Noch kein QR-Link erzeugt");
    expect(html).not.toContain("published");
    expect(html).not.toContain("active");
  });
});
