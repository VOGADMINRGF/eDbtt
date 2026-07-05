import { describe, expect, it } from "vitest";
import { PUBLIC_TERMINOLOGY, publicTerminologyText } from "@/features/public/publicTerminology";

describe("public terminology contract", () => {
  it("keeps short public Voxy labels canonical", () => {
    expect(PUBLIC_TERMINOLOGY.withVoxy).toBe("Mit Voxy");
    expect(PUBLIC_TERMINOLOGY.withoutVoxy).toBe("Ohne Voxy");
  });

  it("maps internal product terms to public-facing terms", () => {
    const text = "KI bereitet einen Anlassraum, eine Runde, ein Dossier und den Graph vor.";

    expect(publicTerminologyText(text)).toBe(
      "Voxy bereitet einen Mitmachraum, eine Mitmachschritt, ein Themen-Zusammenfassung und den Zusammenhänge vor.",
    );
  });

  it("removes AI-Usage-Event wording from public copy", () => {
    expect(publicTerminologyText("Kein AI-Usage-Event gestartet.")).toBe(
      "Kein Voxy-Schritt gestartet.",
    );
  });
});
