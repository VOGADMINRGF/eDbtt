import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AccountResumeWorkbenchSection, {
  buildAccountResumeWorkbenchItems,
  clearAccountLocalStartDraftArtifacts,
  resolveAccountResumeHrefFromStartDraft,
} from "@/app/account/AccountResumeWorkbenchSection";
import {
  buildAccountUserScopedRuntimeLinkage,
} from "@features/account/loadAccountUserScopedRuntimeLinkage";
import { createStartDraftContext } from "@/features/start/startDraftContext";
import {
  buildManualAnlassraumStartDraft,
  createEmptyManualAnlassraumSetup,
} from "@/features/surfaces/runden/manualAnlassraumSetup";

function installSessionStorage(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial));
  vi.stubGlobal("window", {
    sessionStorage: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    },
  });
  return store;
}

describe("account resume workbench contract", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps local start drafts to the expected resume targets", () => {
    const createDraft = createStartDraftContext({
      text: "Ich möchte einen neuen Radweg vorschlagen.",
      origin: "start_create_light",
      intent: "proposal",
      targetHint: "create",
      preview: { relevance: "public_relevant" },
    });
    const themesDraft = createStartDraftContext({
      text: "Ich suche ein passendes Thema für bezahlbare Mieten.",
      origin: "start_create_light",
      intent: "theme_suggestion",
      targetHint: "themes",
      preview: { relevance: "public_relevant" },
    });
    const roundsDraft = createStartDraftContext({
      text: "Daraus soll eine Runde werden.",
      origin: "start_create_light",
      intent: "round_suggestion",
      targetHint: "rounds",
      preview: { relevance: "public_relevant" },
    });

    expect(resolveAccountResumeHrefFromStartDraft(createDraft!)).toBe("/create?startDraft=1");
    expect(resolveAccountResumeHrefFromStartDraft(themesDraft!)).toBe("/themen?startDraft=1");
    expect(resolveAccountResumeHrefFromStartDraft(roundsDraft!)).toBe("/runden/new?startDraft=1&from=account");
  });

  it("renders a local start draft as an account work item with draft-only guardrails", () => {
    const draft = createStartDraftContext({
      text: "Freibier für alle, eigentlich geht es mir um soziale Teilhabe bei öffentlichen Veranstaltungen.",
      origin: "start_relevance_review",
      intent: "needs_reframe",
      targetHint: "register",
      preview: { relevance: "needs_reframe" },
    });

    const html = renderToStaticMarkup(
      <AccountResumeWorkbenchSection entries={[]} initialStartDraft={draft} />,
    );

    expect(html).toContain("Meine Arbeitsstände");
    expect(html).toContain("Lokaler Entwurf");
    expect(html).toContain("Redaktion");
    expect(html).toContain("Zur manuellen Prüfung vorgemerkt");
    expect(html).toContain("Noch nicht veröffentlicht");
    expect(html).toContain("Öffentliche Relevanz klären");
    expect(html).toContain("Was wurde aus deinem Beitrag?");
    expect(html).toContain("Beitrag erhalten");
    expect(html).toContain("Review oder Rückfrage");
    expect(html).toContain("Mit Voxy weiterdenken");
    expect(html).toContain("Quellen &amp; Faktencheck vorbereiten");
    expect(html).toContain("Dossier-Entscheidungslogik");
    expect(html).toContain("Beteiligungsraum vorbereiten");
    expect(html).toContain("Poll/Frage vorbereiten");
    expect(html).toContain("Ausgabe vorbereiten");
    expect(html).toContain("Voxy-Briefing vorbereiten");
    expect(html).toContain("Render-Entscheidung");
    expect(html).toContain("Review-Entscheidung dokumentieren");
    expect(html).toContain("Render-Request-Draft");
    expect(html).toContain("Render-Queue-Vertrag");
    expect(html).toContain("Kosten &amp; Credits");
    expect(html).toContain("Kein Request-Draft-Store im Surface");
    expect(html).toContain("Noch kein Renderjob");
    expect(html).toContain("Kein Queue-Preview-Store im Surface");
    expect(html).toContain("Noch keine Queue");
    expect(html).toContain("Kein Cost-/Credit-Policy-Store im Surface");
    expect(html).toContain("Noch keine Buchung");
    expect(html).toContain("Render-Asset-Pack");
    expect(html).toContain("Kein Asset-Pack-Draft-Store im Surface");
    expect(html).toContain("Noch keine Datei");
    expect(html).toContain("Provider-Auswahl");
    expect(html).toContain("Hybrid Runtime Foundation");
    expect(html).toContain("selected_path = hybrid_external_render_adapter");
    expect(html).toContain("runtimeEnabled = false");
    expect(html).toContain("Runtime Go/No-Go");
    expect(html).toContain("Runtime Enablement Backlog");
    expect(html).toContain("Runtime Observability");
    expect(html).toContain("Runtime Cutover Gate");
    expect(html).toContain("Voxy Video Briefing Flow");
    expect(html).toContain("Review-first Architektur geschlossen");
    expect(html).toContain("Runtime noch nicht aktiviert");
    expect(html).toContain("Nächster Schritt: Runtime-Pfad entscheiden");
    expect(html).toContain("Preview Review");
    expect(html).toContain("Preview-Review-Entscheidung");
    expect(html).toContain("Preview Outcome Handoff");
    expect(html).toContain("Publish Readiness");
    expect(html).toContain("Social Distribution");
    expect(html).toContain("Approval Semantik");
    expect(html).toContain("Media &amp; Storage");
    expect(html).toContain("Noch nicht veröffentlichungsbereit");
    expect(html).toContain("Noch kein Posting");
    expect(html).toContain("Approved ist nicht uploaded");
    expect(html).toContain("Kein Storage-Write");
    expect(html).toContain("Noch kein Preview-Video");
    expect(html).toContain("Keine Medien-Datei");
    expect(html).toContain("Kein Provider-Selection-Draft-Store im Surface");
    expect(html).toContain("Kein Runtime-Go/No-Go-Store im Surface");
    expect(html).toContain("Kein Runtime-Enablement-Backlog-Store im Surface");
    expect(html).toContain("Kein Runtime-Observability-Store im Surface");
    expect(html).toContain("Kein Preview-Review-Store im Surface");
    expect(html).toContain("Kein Preview-Review-Decision-Store im Surface");
    expect(html).toContain("Kein Preview-Outcome-Handoff-Store im Surface");
    expect(html).toContain("Kein Publish-Readiness-Guard-Store im Surface");
    expect(html).toContain("Noch kein Providerlauf");
    expect(html).toContain("Keine Veröffentlichung");
    expect(html).toContain("Kein Persistenz-Store im Surface");
    expect(html).toContain("Voxy-Render/Provider-Handoff vorbereiten");
    expect(html).toContain("Voxy-Render-Preflight vorbereiten");
    expect(html).toContain("Voxy Asset- &amp; Provider-Registry");
    expect(html).toContain("Render-Adapter vorbereiten");
    expect(html).toContain("Vorgeschlagenes Beteiligungsformat");
    expect(html).toContain("Frage-Typ");
    expect(html).toContain("Mögliche Ausgabeformate");
    expect(html).toContain("Script-Kandidat, noch kein Video");
    expect(html).toContain("Handoff-Paket");
    expect(html).toContain("Render-Preflight");
    expect(html).toContain("Asset- &amp; Provider-Registry");
    expect(html).toContain("Noop-Ergebnis");
    expect(html).toContain("Warum noch nicht gerendert wird");
    expect(html).toContain("Nächste Entscheidung");
    expect(html).toContain("Welche Quelle, Erfahrung oder Beobachtung stützt deine Einschätzung?");
    expect(html).toContain("KI-, Review- und Enrichment-Transparenz");
    expect(html).toContain("Nutzergebundene Downstream-Runtime im Account fehlt noch.");
    expect(html).toContain("Lokaler Browser-Entwurf");
    expect(html).toContain("Verknüpfung zum Arbeitsstand");
    expect(html).toContain("Noch kein belastbarer persisted Handoff");
    expect(html).toContain("Sinnvolle nächste Schritte");
    expect(html).toContain("Zur redaktionellen Prüfung geben");
    expect(html).toContain("Weiterarbeiten");
    expect(html).toContain("Verwerfen");
    expect((html.match(/data-testid=\"account-resume-dossier-decision-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"account-resume-participation-activation-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"account-resume-poll-question-options-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"account-resume-output-social-workbench-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"account-resume-voxy-briefing-script-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"account-resume-voxy-render-decision-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"account-resume-voxy-render-request-draft-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"account-resume-voxy-render-queue-contract-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"account-resume-voxy-render-cost-credit-policy-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"account-resume-voxy-render-asset-pack-draft-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"account-resume-voxy-render-provider-selection-draft-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"account-resume-voxy-hybrid-runtime-foundation-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"account-resume-voxy-render-runtime-go-nogo-matrix-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"account-resume-voxy-render-preview-review-flow-/g) ?? []).length).toBe(1);
    expect(
      (
        html.match(
          /data-testid=\"account-resume-voxy-render-preview-review-decision-persistence-/g,
        ) ?? []
      ).length,
    ).toBe(1);
    expect(
      (html.match(/data-testid=\"account-resume-voxy-render-preview-outcome-handoff-/g) ?? [])
        .length,
    ).toBe(1);
    expect((html.match(/data-testid=\"account-resume-voxy-render-approval-semantics-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"account-resume-voxy-render-media-storage-truth-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"account-resume-voxy-render-upload-target-policy-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"account-resume-voxy-render-scheduling-policy-/g) ?? []).length).toBe(1);
    expect(
      (html.match(/data-testid=\"account-resume-voxy-render-runtime-observability-/g) ?? [])
        .length,
    ).toBe(1);
    expect(
      (html.match(/data-testid=\"account-resume-voxy-render-runtime-cutover-gate-/g) ?? [])
        .length,
    ).toBe(1);
    expect(
      (
        html.match(
          /data-testid=\"account-resume-voxy-video-briefing-flow-master-closure-/g,
        ) ?? []
      ).length,
    ).toBe(1);
    expect((html.match(/data-testid=\"account-resume-voxy-render-provider-handoff-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"account-resume-voxy-render-preflight-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"account-resume-voxy-render-registry-/g) ?? []).length).toBe(1);
    expect((html.match(/data-testid=\"account-resume-voxy-render-adapter-/g) ?? []).length).toBe(1);
    expect(html).not.toContain("autoPublish");
    expect(html).not.toContain("recordSwipeVoteInGraph");
    expect(html).not.toContain("review_draft_prepared");
    expect(html).not.toContain("review_first_architecture_complete");
  });

  it("builds useful empty and saved workbench states without productive claims", () => {
    const emptyHtml = renderToStaticMarkup(
      <AccountResumeWorkbenchSection entries={[]} initialStartDraft={null} />,
    );

    expect(emptyHtml).toContain("Noch keine offenen Arbeitsstände.");
    expect(emptyHtml).toContain("Neuen Beitrag starten");
    expect(emptyHtml).toContain("Themen ansehen");

    const items = buildAccountResumeWorkbenchItems({
      startDraft: null,
      entries: [
        {
          ledgerId: "ledger-1",
          packageId: "package-1",
          sourceText: "Ich möchte einen Radweg und sichere Schulwege im Bezirk.",
          createdAt: "2026-06-05T10:00:00.000Z",
          updatedAt: "2026-06-05T12:00:00.000Z",
          locale: "de",
          entryPoint: "create",
          draftSaveStatus: "server_saved",
          branches: [
            {
              branchId: "branch-1",
              title: "Sicherer Schulweg",
              summary: "Ein Themenast für sichere Wege rund um die Grundschule.",
              selectedAction: "qr_poll_prepare",
              status: "qr_draft_prepared",
              visibilityIntent: "private_qr",
              claimCandidates: [],
              placeCandidates: [],
              localIssueCandidates: [],
              needsPlaceClarification: false,
              placeClarificationStatus: "answered",
              placeResolutionSource: "none",
              inferredStance: "pro",
              stanceConfirmationStatus: "inferred_only",
              sensitivityLevel: "standard",
              needsReview: false,
              handoffStatus: "prepared",
              handoffTargetType: "qr_participation",
              handoffTargetUrl: "/runden?from=create&packageId=package-1&branchId=branch-1",
            },
          ],
        },
      ],
    });

    expect(items[0]).toMatchObject({
      type: "Runde",
      status: "Entwurf",
      href: "/runden?from=create&packageId=package-1&branchId=branch-1",
    });
    expect(items[0]?.workflow.currentStatusLabel).toBe("Beteiligungsformat vorbereitet");
    expect(items[0]?.workflow.nextStepLabel).toBe("Beteiligungsformat prüfen");
    expect(items[0]?.nextActions.map((entry) => entry.label)).toContain("Runde weiter vorbereiten");
  });

  it("marks start_create_light drafts as analysis workstates instead of confirmed facts", () => {
    const draft = createStartDraftContext({
      text: "Bei uns fehlt ein sicherer Radweg zur Schule.",
      origin: "start_create_light",
      intent: "problem",
      targetHint: "create",
      preview: { relevance: "public_relevant" },
    });

    const items = buildAccountResumeWorkbenchItems({
      startDraft: draft,
      entries: [],
      canDeepResearch: true,
    });

    expect(items[0]).toMatchObject({
      type: "Beitrag",
      status: "Analyse-Entwurf",
      nextStep: "Quellenlage klären",
    });
    expect(items[0]?.guardrails).toContain("Keine Quellenprüfung gestartet");
    expect(items[0]?.guardrails).toContain("Noch nicht veröffentlicht");
  });

  it("clears local start draft artifacts on explicit discard", () => {
    const store = installSessionStorage({
      "start-draft-context.v1": '{"schemaVersion":1}',
      "landing-create-light-draft": '{"sourceText":"abc"}',
      "landing-editorial-review-draft": '{"sourceText":"def"}',
    });

    clearAccountLocalStartDraftArtifacts();

    expect(store.has("start-draft-context.v1")).toBe(false);
    expect(store.has("landing-create-light-draft")).toBe(false);
    expect(store.has("landing-editorial-review-draft")).toBe(false);
  });

  it("prefers the server-backed /runden/new draft over a duplicate local round handoff", () => {
    const setup = {
      ...createEmptyManualAnlassraumSetup(),
      title: "Sichere Schulwege",
      votingQuestion: "Welche Maßnahme soll zuerst kommen?",
      description: "Eltern und Schule melden offene Querungen.",
    };
    const localRoundDraft = buildManualAnlassraumStartDraft(setup, {
      id: "local-round-1",
      createdAt: "2026-07-07T09:00:00.000Z",
      handoffCount: 0,
    });

    const html = renderToStaticMarkup(
      <AccountResumeWorkbenchSection
        entries={[]}
        initialStartDraft={localRoundDraft}
        manualAnlassraumServerDrafts={[
          {
            draftId: "65a111111111111111111122",
            updatedAt: "2026-07-07T10:00:00.000Z",
            setup,
          },
        ]}
      />,
    );

    expect(html).toContain("Serverseitig gespeichert");
    expect(html).toContain("Serverseitiger Anlassraum-Entwurf");
    expect(html).toContain("Runde weiter vorbereiten");
    expect(html).toContain("In /create weiterarbeiten");
    expect(html).not.toContain("Lokaler Entwurf");
  });

  it("renders persisted user-scoped runtime linkage without pretending publish or approval", () => {
    const linkage = buildAccountUserScopedRuntimeLinkage({
      handoff: {
        schemaVersion: "create_handoff_review_item.v1",
        id: "create-handoff-1",
        source: "create",
        sourceText: "Wir brauchen sichere Schulwege.",
        plannerResult: {
          shortSummary: "Sichere Schulwege priorisieren.",
          topicCandidates: ["Schulwege"],
          openQuestions: ["Welche Kreuzung zuerst?"],
        },
        graphMatches: {
          matches: [],
          matchedDossiers: [],
          matchedAnlassraeume: [],
          matchedClaims: [],
          matchedTopics: [],
          matchedVotes: [],
        },
        selectedAction: "create_dossier",
        claims: [{ id: "claim-1", text: "Sichere Schulwege priorisieren.", factcheckEligible: true }],
        arguments: [],
        openQuestions: [{ id: "question-1", question: "Welche Kreuzung zuerst?", requiredBeforePublish: true }],
        sourceGrounding: [],
        topicSeed: {
          topicKey: "school-routes",
          topicLabel: "Sichere Schulwege",
          jurisdiction: "district",
          themenradarSourceType: "user_input",
        },
        resumeHref: "/create?resume=create-handoff-1",
        reviewState: "ready_for_confirmation",
        visibilityState: "internal_review",
        requiresConfirmation: true,
        reviewRequired: true,
        noAutoPublish: true,
        noPublicOfficial: true,
        noAutomaticOfficialResponse: true,
        noAutoFinalization: true,
        intakeClassification: "proposal",
        createdByUserId: "user-1",
        regionId: "region-1",
        organizationId: null,
        dossierId: "dossier-1",
        anlassraumId: null,
        requestScope: null,
        accessDecision: null,
        createdAt: "2026-07-07T10:00:00.000Z",
        updatedAt: "2026-07-07T10:05:00.000Z",
      } as any,
      linkedWorkspace: {
        workspace: {
          id: "workspace-1",
          dossierId: "dossier-1",
          regionId: "region-1",
          organizationId: null,
          source: "manual_editor",
          status: "needs_review",
          visibilityState: "internal_review",
          title: "Sichere Schulwege · Workspace",
          masterPostDraft: {
            body: "Sichere Schulwege priorisieren.",
            overallPicture: "Der Bezirk prüft sichere Schulwege.",
            topic: "Sichere Schulwege",
            openQuestions: ["Welche Kreuzung zuerst?"],
            sourceSituation: "Quellenlage noch in Prüfung.",
            hook: "Schulwege zuerst sichern.",
            sourceState: {
              traces: [],
              notes: ["source_needed"],
              status: "missing",
            },
          },
          distributionDraft: {
            selectedChannels: ["linkedin_draft"],
            reviewRequired: true,
          },
          createdBy: "user-1",
          updatedBy: "user-1",
          createdAt: "2026-07-07T11:00:00.000Z",
          updatedAt: "2026-07-07T11:10:00.000Z",
          officialApproval: null,
          provenance: {
            sourceDraftId: "create-handoff-1",
          },
          guardrails: {
            noAutoPublish: true,
            noSocialPublishing: true,
            noAutoMandate: true,
            noAutoVote: true,
            reviewRequired: true,
            localStorageIsNotProduction: true,
          },
        } as any,
        linkageMode: "workspace_source_draft",
      },
      dossierRuntimeRecord: null,
      dossierPublicationRecord: null,
      anlassraumRuntimeRecord: null,
      participationRuntimeRecord: null,
      participationPublishRecord: null,
    } as any);

    const html = renderToStaticMarkup(
      <AccountResumeWorkbenchSection
        entries={[]}
        initialStartDraft={null}
        runtimeLinkages={[linkage]}
      />,
    );

    expect(html).toContain("Verbundener Arbeitsstand");
    expect(html).toContain("Sichere Schulwege · Dossier-Aufbau");
    expect(html).toContain("Bereit für bewusste Bestätigung");
    expect(html).toContain("Dossier");
    expect(html).toContain("Output");
    expect(html).toContain("V3-Review-Kontext");
    expect(html).toContain("Downstream-KI-Transparenz");
    expect(html).toContain("Mit Voxy weiterdenken");
    expect(html).toContain("Quellen &amp; Faktencheck vorbereiten");
    expect(html).toContain("Dossier-Entscheidungslogik");
    expect(html).toContain("Beteiligungsraum vorbereiten");
    expect(html).toContain("Poll/Frage vorbereiten");
    expect(html).toContain("Ausgabe vorbereiten");
    expect(html).toContain("Render-Entscheidung im Account");
    expect(html).toContain("Review-Entscheidung dokumentieren");
    expect(html).toContain("Render-Request-Draft");
    expect(html).toContain("Render-Queue-Vertrag");
    expect(html).toContain("Kosten &amp; Credits");
    expect(html).toContain("Hybrid Runtime Foundation");
    expect(html).toContain("selected_path = hybrid_external_render_adapter");
    expect(html).toContain("runtimeEnabled = false");
    expect(html).toContain("Voxy-Render/Provider-Handoff im Account");
    expect(html).toContain("Voxy-Render-Preflight im Account");
    expect(html).toContain("Voxy Asset- &amp; Provider-Registry im Account");
    expect(html).toContain("Kein Cost-/Credit-Policy-Store im Surface");
    expect(html).toContain("Frage-Typ");
    expect(html).toContain("Mögliche Ausgabeformate");
    expect(html).toContain("Handoff-Paket");
    expect(html).toContain("Was ist vorhanden?");
    expect(html).toContain("Warum noch nicht gerendert wird");
    expect(html).toContain('data-testid="account-runtime-linkage-participation-activation-create-handoff-1"');
    expect(html).toContain('data-testid="account-runtime-linkage-poll-question-options-create-handoff-1"');
    expect(html).toContain('data-testid="account-runtime-linkage-output-social-workbench-create-handoff-1"');
    expect(html).toContain('data-testid="account-runtime-linkage-dossier-decision-create-handoff-1"');
    expect(html).toContain('data-testid="account-runtime-linkage-voxy-render-decision-create-handoff-1"');
    expect(html).toContain('data-testid="account-runtime-linkage-voxy-render-request-draft-create-handoff-1"');
    expect(html).toContain('data-testid="account-runtime-linkage-voxy-render-queue-contract-create-handoff-1"');
    expect(html).toContain('data-testid="account-runtime-linkage-voxy-render-cost-credit-policy-create-handoff-1"');
    expect(html).toContain('data-testid="account-runtime-linkage-voxy-render-asset-pack-draft-create-handoff-1"');
    expect(html).toContain('data-testid="account-runtime-linkage-voxy-render-provider-selection-draft-create-handoff-1"');
    expect(html).toContain('data-testid="account-runtime-linkage-voxy-hybrid-runtime-foundation-create-handoff-1"');
    expect(html).toContain('data-testid="account-runtime-linkage-voxy-render-runtime-go-nogo-matrix-create-handoff-1"');
    expect(html).toContain('data-testid="account-runtime-linkage-voxy-render-runtime-enablement-backlog-create-handoff-1"');
    expect(
      html,
    ).toContain(
      'data-testid="account-runtime-linkage-voxy-render-preview-review-decision-persistence-create-handoff-1"',
    );
    expect(html).toContain(
      'data-testid="account-runtime-linkage-voxy-render-preview-outcome-handoff-create-handoff-1"',
    );
    expect(html).toContain(
      'data-testid="account-runtime-linkage-voxy-render-publish-readiness-guard-create-handoff-1"',
    );
    expect(html).toContain(
      'data-testid="account-runtime-linkage-voxy-render-media-storage-truth-create-handoff-1"',
    );
    expect(html).toContain(
      'data-testid="account-runtime-linkage-voxy-render-upload-target-policy-create-handoff-1"',
    );
    expect(html).toContain('data-testid="account-runtime-linkage-voxy-render-provider-handoff-create-handoff-1"');
    expect(html).toContain('data-testid="account-runtime-linkage-voxy-render-preflight-create-handoff-1"');
    expect(html).toContain('data-testid="account-runtime-linkage-voxy-render-registry-create-handoff-1"');
    expect(html).toContain("Welche Quelle, Erfahrung oder Beobachtung stützt deine Einschätzung?");
    expect(html).not.toContain("Jetzt veröffentlichen");
    expect(html).not.toContain("Live posten");
  });
});
