import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import RundenShareActions from "@/app/runden/RundenShareActions";

describe("runden qr participation language contract", () => {
  it("uses participation-first wording for link + QR actions", () => {
    const html = renderToStaticMarkup(
      <RundenShareActions
        share={{
          contextKind: "runde",
          primaryTargetKind: "round_operating_target",
          canonicalTarget: "/round/mobilitaet?anlassraumId=65f000000000000000000401",
          qrTarget: "/round/mobilitaet?anlassraumId=65f000000000000000000401",
          shareTitle: "Mobilität Innenstadt",
          sharePrompt: "Laufenden Anlass teilen",
          shareSummary: "Zusammenfassung",
          socialCandidate: false,
          needsReviewBeforeOfficialSocial: true,
        }}
      />,
    );

    expect(html).toContain("Teilnahmekontext: Runde");
    expect(html).toContain("Teilnahmelink kopieren");
    expect(html).toContain("Teilnahme per QR öffnen");
    expect(html).toContain("Teilnahme teilen");
    expect(html).toContain("Öffentliche Veröffentlichung bleibt kuratiert oder qualifiziert.");

    expect(html).not.toContain("Link kopieren");
    expect(html).not.toContain("QR bereitstellen");
    expect(html).not.toContain(">Teilen<");
  });
});
