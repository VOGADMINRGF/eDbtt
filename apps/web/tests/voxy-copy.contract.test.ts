import { describe, expect, it } from "vitest";
import { VOXY_COPY, getVoxyCopy } from "@/features/voxy/voxyCopy";

describe("voxy copy contract", () => {
  it("keeps the Anlassraum, KI and Optionen guidance stable", () => {
    expect(VOXY_COPY.start).toBe(
      "Schreib kurz, worum es geht. Ich helfe beim Einordnen, bevor du den nächsten Schritt bestätigst.",
    );
    expect(VOXY_COPY.create).toBe(
      "Ich helfe dir, deinen Text zu sortieren. Nichts wird automatisch veröffentlicht.",
    );
    expect(VOXY_COPY.anlassraum).toBe(
      "Du hältst Thema, Optionen und Sichtbarkeit zusammen. Prüfung und weitere Hilfe kommen erst dazu, wenn du sie auswählst.",
    );
    expect(VOXY_COPY.options).toBe(
      "Feste Optionen geben Kontrolle. Community-Vorschläge öffnen den Raum.",
    );
    expect(VOXY_COPY.ai).toBe("KI bleibt optional. Nichts wird automatisch veröffentlicht.");
    expect(VOXY_COPY.completion).toBe(
      "Du kannst speichern, vor Veröffentlichung prüfen oder in /create weiter ausarbeiten.",
    );
    expect(getVoxyCopy("rundenEntry")).toBe(
      "Du hältst zuerst Thema, Optionen und Sichtbarkeit zusammen. Alles Weitere bleibt optional.",
    );
    expect(getVoxyCopy("rundenHero")).toBe(
      "Du startest mit dem Rahmen. Alles Weitere bleibt optional.",
    );
    expect(getVoxyCopy("manualFrame")).toBe(
      "Noch keine perfekte Formulierung nötig. Lege erst den Rahmen fest.",
    );
    expect(getVoxyCopy("manualOptions")).toBe(
      "Feste Optionen geben Kontrolle. Community-Vorschläge machen den Raum offener.",
    );
    expect(getVoxyCopy("dossier")).toBe(
      "Du bist im Überblick. Quellen und Prüfung findest du im Prüfmodus.",
    );
    expect(getVoxyCopy("swipes")).toBe(
      "Deine Reaktion ist kein Endpunkt. Daraus können Fragen, Faktenchecks oder Anlassräume entstehen.",
    );
  });
});
