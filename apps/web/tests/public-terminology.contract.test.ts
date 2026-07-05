import { describe, expect, it } from "vitest";
import { PUBLIC_TERMINOLOGY, publicTerminologyText } from "@/features/public/publicTerminology";

describe("public terminology contract", () => {
  it("keeps short public Voxy labels canonical", () => {
    expect(PUBLIC_TERMINOLOGY.withVoxy).toBe("Mit Voxy");
    expect(PUBLIC_TERMINOLOGY.withoutVoxy).toBe("Ohne Voxy");
  });

  it("keeps the public participation model distinct", () => {
    expect(PUBLIC_TERMINOLOGY.themensuche).toBe("Themensuche");
    expect(PUBLIC_TERMINOLOGY.debatteArgumente).toBe("Debatte & Argumente");
    expect(PUBLIC_TERMINOLOGY.aktivDabei).toBe("Aktiv dabei");
  });

  it("maps internal product terms to public-facing terms", () => {
    const text = "KI | Anlassraum | Runden | Dossier | Themenüberblick | Graph";

    expect(publicTerminologyText(text)).toBe(
      "Voxy | Mitmachraum | Mitmachschritte | Debatte & Argumente | Themensuche | Zusammenhänge",
    );
  });

  it("maps the previous dossier wording to the refined public wording", () => {
    expect(publicTerminologyText("Themen-Zusammenfassung")).toBe("Debatte & Argumente");
  });

  it("removes AI-Usage-Event wording from public copy", () => {
    expect(publicTerminologyText("Kein AI-Usage-Event gestartet.")).toBe(
      "Kein Voxy-Schritt gestartet.",
    );
  });
});
