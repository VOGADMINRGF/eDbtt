import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AccountResumeWorkbenchSection, {
  buildAccountResumeWorkbenchItems,
  clearAccountLocalStartDraftArtifacts,
  resolveAccountResumeHrefFromStartDraft,
} from "@/app/account/AccountResumeWorkbenchSection";
import { createStartDraftContext } from "@/features/start/startDraftContext";

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
    expect(html).toContain("Sinnvolle nächste Schritte");
    expect(html).toContain("Zur redaktionellen Prüfung geben");
    expect(html).toContain("Weiterarbeiten");
    expect(html).toContain("Verwerfen");
    expect(html).not.toContain("autoPublish");
    expect(html).not.toContain("recordSwipeVoteInGraph");
    expect(html).not.toContain("review_draft_prepared");
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
});
