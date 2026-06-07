import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import VerificationStatusPanel from "@/components/ai/VerificationStatusPanel";
import SocialOutputPreviewPanel from "@/components/share/SocialOutputPreviewPanel";
import { buildShareOutputAsset } from "@features/share/socialOutputContract";

describe("truth-guard surface propagation", () => {
  it("renders create-style analysis drafts without checked or verified wording", () => {
    const html = renderToStaticMarkup(
      <VerificationStatusPanel
        lane="standard"
        verificationMode="none"
        researchUsed="none"
        sealEligible={false}
        sealGranted={false}
        verificationLabel="analysiert"
        truthStatus="draft_analysis"
        sourceSupport="none"
        sourceStatus="Keine Quellenprüfung gestartet"
        reviewRecommended={false}
      />,
    );

    expect(html).toContain("Analyse-Entwurf");
    expect(html).toContain("Keine Quellenprüfung gestartet");
    expect(html).not.toContain(">geprüft<");
    expect(html).not.toContain(">verifiziert<");
  });

  it("renders share previews as draft-like communication, not as a factcheck certificate", () => {
    const asset = buildShareOutputAsset({
      baseUrl: "https://edebatte.org",
      canonicalPathOrUrl: "/dossier/radweg",
      objectType: "dossier",
      title: "Dossier Radweg",
      subtitle: "Kontext und offene Fragen",
    });

    const html = renderToStaticMarkup(<SocialOutputPreviewPanel asset={asset} />);

    expect(html).toContain("Analyse-Entwurf");
    expect(html).toContain("Keine Quellenprüfung gestartet");
    expect(html).toContain("Noch nicht veröffentlicht");
    expect(html).toContain("Keine automatische Graph-Promotion");
    expect(html).not.toContain("Verifiziert");
  });
});
