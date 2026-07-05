import { describe, expect, it } from "vitest";
import { PUBLIC_TERMINOLOGY, publicTerminologyText } from "@/features/public/publicTerminology";

describe("public terminology contract", () => {
  it("keeps short public Voxy labels canonical", () => {
    expect(PUBLIC_TERMINOLOGY.withVoxy).toBe("Mit Voxy");
    expect(PUBLIC_TERMINOLOGY.withoutVoxy).toBe("Ohne Voxy");
  });

  it("maps internal product terms to public-facing terms", () => {
    const text = "KI | Anlassraum | Runden | Dossier | Graph";

    expect(publicTerminologyText(text)).toBe(
      "Voxy | Mitmachraum | Mitmachschritte | Themen-Zusammenfassung | Zusammenhänge",
    );
  });

  it("removes AI-Usage-Event wording from public copy", () => {
    expect(publicTerminologyText("Kein AI-Usage-Event gestartet.")).toBe(
      "Kein Voxy-Schritt gestartet.",
    );
  });
});
