import { beforeEach, describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import DossierOutputStudioPage from "@/app/dossier/[id]/studio/page";
import {
  createInMemoryContentReleaseWorkbenchRepo,
  setContentReleaseWorkbenchRepoForTests,
} from "@features/contentReleaseWorkbench";

async function renderStudioPage(dossierId = "dossier_demo_mobility_berlin") {
  const element = await DossierOutputStudioPage({
    params: Promise.resolve({ id: dossierId }),
  });
  return renderToStaticMarkup(element);
}

describe("/dossier/[id]/studio social distribution workspace", () => {
  beforeEach(() => {
    setContentReleaseWorkbenchRepoForTests(createInMemoryContentReleaseWorkbenchRepo());
  });

  it("renders studio hero and master post section", async () => {
    const html = await renderStudioPage();

    expect(html).toContain("eDebatte Studio");
    expect(html).toContain("Vom Dossier zum fertigen Beitrag, Kanal-Versionen und Veröffentlichungsplan.");
    expect(html).toContain("Public URL, Share-Link und QR werden erst im bestehenden Review-to-Publish-Workspace");
    expect(html).toContain("Dossier bleibt Quelle");
    expect(html).toContain("Sichtbarkeit: privater Entwurf");
    expect(html).toContain("Noch nicht live veröffentlicht");
    expect(html).toContain("Fertiger Post-Entwurf");
    expect(html).toContain("Beteiligungsfrage");
    expect(html).toContain("Review-Hinweise");
  });

  it("renders channel selection and distribution planning with policy hints", async () => {
    const html = await renderStudioPage();

    expect(html).toContain("Kanäle auswählen");
    expect(html).toContain("Kanalverbindungen");
    expect(html).toContain("Veröffentlichungsmodus");
    expect(html).toContain("Verteilung planen");
    expect(html).toContain("Website / Dossier-Post");
    expect(html).toContain("Instagram");
    expect(html).toContain("LinkedIn");
    expect(html).toContain("Newsletter");
    expect(html).toContain("QR / Print");
    expect(html).toContain("Nicht verbunden");
    expect(html).toContain("Konfiguration erforderlich");
    expect(html).toContain("Nur Export");
    expect(html).toContain("Nur Export/Kopieren möglich");
    expect(html).toContain("Echtzeit-Veröffentlichung ist aktuell deaktiviert");
    expect(html).toContain("Automatisierung erst nach Admin-Freigabe");
    expect(html).toContain("Verteilplan als Entwurf speichern");
    expect(html).toContain("Verteilplan übernehmen");
    expect(html).toContain("Empfohlener Verteilplan");
    expect(html).toContain("Kanal-Versionen");
    expect(html).toContain("TikTok / Reels / YouTube Shorts");
    expect(html).toContain("Kanäle verbinden");
    expect(html).toContain("Post-Entwurf prüfen");
    expect(html).toContain("Zurück zum Dossier");
    expect(html).toContain("Text kopieren");
    expect(html).toContain("Entwurf speichern");
    expect(html).toContain("Admin: Kanal-Konfiguration &amp; Review-Routing");
    expect(html).toContain("QR-/Print-Vorschau");
  });

  it("keeps publish action non-active and preserves source/review warning", async () => {
    const html = await renderStudioPage();

    expect(html).toContain("Veröffentlichung vorbereiten");
    expect(html).toContain("Quellenlage");
    expect(html).toContain("Review erforderlich");
    expect(html).toContain("Sichtbar heißt hier nicht automatisch geprüft oder amtlich.");
    expect(html).not.toContain("extern veröffentlicht");
    expect(html).not.toContain("Jetzt veröffentlichen");
  });

  it("shows a connected topic page when the dossier already has a lightweight public topic target", async () => {
    setContentReleaseWorkbenchRepoForTests(
      createInMemoryContentReleaseWorkbenchRepo({
        records: [
          {
            id: "dossier-topic-link-1",
            sourceKind: "region_source_result",
            sourceResultId: "source-result-dossier-demo",
            sourceReviewItemId: "region_source_result:source-result-dossier-demo",
            regionId: "berlin",
            organizationId: "org-1",
            targetType: "dossier",
            targetId: "dossier_demo_mobility_berlin",
            title: "Demo-Dossier Mobilität",
            summary: "Dossier-Vertiefung.",
            previewHref: "/dossier/dossier_demo_mobility_berlin/studio",
            publicHref: "/dossier/dossier_demo_mobility_berlin",
            topicPageData: null,
            visibilityState: "public_unverified",
            createdByUserId: "admin-1",
            createdAt: "2026-05-20T09:00:00.000Z",
            updatedByUserId: "admin-1",
            updatedAt: "2026-05-20T09:05:00.000Z",
            reviewRequired: true,
            noAutoPublish: true,
            noPublicOfficial: true,
            noSocialPublishing: true,
            noAutomaticOfficialResponse: true,
            noAutoFinalization: true,
            revokable: true,
            archivable: true,
          },
          {
            id: "topic-page-dossier-demo-1",
            sourceKind: "region_source_result",
            sourceResultId: "source-result-dossier-demo",
            sourceReviewItemId: "region_source_result:source-result-dossier-demo",
            regionId: "berlin",
            organizationId: "org-1",
            targetType: "topic_page",
            targetId: "mobilitaet-und-kosten-berlin-demo123",
            title: "Mobilität und Kosten in Berlin",
            summary: "Leichte öffentliche Themenseite.",
            previewHref: "/topic/mobilitaet-und-kosten-berlin-demo123?previewTopicPage=1",
            publicHref: "/topic/mobilitaet-und-kosten-berlin-demo123",
            topicPageData: {
              title: "Mobilität und Kosten in Berlin",
              summary: "Leichte öffentliche Themenseite.",
              claimCandidates: [],
              evidenceHints: [],
              openQuestions: [],
              reviewStatus: "review_required",
            },
            visibilityState: "public_reviewed",
            createdByUserId: "admin-1",
            createdAt: "2026-05-20T09:00:00.000Z",
            updatedByUserId: "admin-1",
            updatedAt: "2026-05-20T09:05:00.000Z",
            reviewRequired: true,
            noAutoPublish: true,
            noPublicOfficial: true,
            noSocialPublishing: true,
            noAutomaticOfficialResponse: true,
            noAutoFinalization: true,
            revokable: true,
            archivable: true,
          },
        ],
      }),
    );

    const html = await renderStudioPage();

    expect(html).toContain("Verbundene Themenseite:");
    expect(html).toContain("Mobilität und Kosten in Berlin");
    expect(html).toContain("geprüft");
  });

  it("blocks silent demo fallback for region draft dossier ids without runtime studio data", async () => {
    const html = await renderStudioPage("dossier-draft-missing-001");

    expect(html).toContain("Für dieses Dossier liegen aktuell keine runtimefähigen Studio-Daten vor.");
    expect(html).toContain("kein `demoDossierForOutputEngine` als Ersatz");
    expect(html).toContain("region draft review only");
    expect(html).not.toContain("Fertiger Post-Entwurf");
    expect(html).not.toContain("Verteilplan übernehmen");
  });
});
