import { describe, expect, it } from "vitest";
import { VOXY_COPY, getVoxyCopy } from "@/features/voxy/voxyCopy";

describe("voxy copy contract", () => {
  it("keeps the Anlassraum, KI and Optionen guidance stable", () => {
    expect(VOXY_COPY.start).toBe(
      "Ich zeige dir die nächsten sinnvollen Schritte, ohne dein Anliegen zu überlagern.",
    );
    expect(VOXY_COPY.create).toBe(
      "Ich helfe dir, dein Anliegen zu sortieren. Nichts wird automatisch veröffentlicht.",
    );
    expect(VOXY_COPY.anlassraum).toBe(
      "Du entscheidest zuerst den Rahmen. KI und Prüfung kommen nur dazu, wenn du sie auswählst.",
    );
    expect(VOXY_COPY.options).toBe(
      "Feste Optionen geben Kontrolle. Community-Vorschläge öffnen den Raum.",
    );
    expect(VOXY_COPY.ai).toBe("KI bleibt optional. Nichts wird automatisch veröffentlicht.");
    expect(VOXY_COPY.completion).toBe(
      "Du kannst speichern, prüfen oder in /create weiter ausarbeiten.",
    );
    expect(getVoxyCopy("rundenEntry")).toBe(
      "Du entscheidest zuerst den Rahmen. Alles Weitere bleibt optional.",
    );
    expect(getVoxyCopy("rundenHero")).toBe(
      "Du startest mit dem Rahmen. Thema, Optionen und Sichtbarkeit zuerst. Alles Weitere bleibt optional.",
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
