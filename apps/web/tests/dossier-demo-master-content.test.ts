import { describe, expect, it } from "vitest";
import demoDossier from "@features/dossier/data/demoDossier";

function getContextNote(id: string) {
  return demoDossier.analyze.notes.find((note) => note.id === id && note.kind === "context");
}

describe("demo master dossier: Innenstadt evidenzkritisch", () => {
  it("enthält sichtbare Quellenmatrix mit Deep-Research-Quellen", () => {
    expect(demoDossier.meta.title).toContain("Wem gehört die Innenstadt von morgen?");
    expect(demoDossier.sourceSet.length).toBeGreaterThanOrEqual(18);
    expect(demoDossier.analyze.report.facts.international.join(" ")).toContain("Quellenmatrix");

    const matrixNote = getContextNote("note-source-matrix");
    expect(matrixNote?.text).toBeTruthy();
    const parsed = JSON.parse(matrixNote!.text) as {
      section: string;
      entries: Array<{ title: string }>;
    };

    expect(parsed.section).toBe("Quellenmatrix");
    const titles = parsed.entries.map((entry) => entry.title).join(" | ");
    expect(titles).toContain("UVAR");
    expect(titles).toContain("Air Quality");
    expect(titles).toContain("Mobilität in Deutschland (MiD) 2023");
    expect(titles).toContain("ULEZ");
    expect(titles).toContain("Paris ZTL");
    expect(titles).toContain("Gent");
    expect(titles).toContain("Milan Area C");
    expect(titles).toContain("Milan Area B");
    expect(titles).toContain("Brussels City 30");
    expect(titles).toContain("Barcelona Superblocks");
    expect(titles).toContain("New York Congestion Pricing");
    expect(titles).toContain("Singapore ERP");
    expect(titles).toContain("DLR Cargo-Bike");
    expect(titles).toContain("OECD Distributional Effects");
    expect(titles).toContain("IEEP");
    expect(titles).toContain("DfT LTN Review");
  });

  it("enthält striktes Zahlen-Audit mit Pflichtfeldern pro Kennzahl", () => {
    const zahlenAuditNote = getContextNote("note-zahlen-audit");
    expect(zahlenAuditNote?.text).toBeTruthy();

    const parsed = JSON.parse(zahlenAuditNote!.text) as {
      section: string;
      entries: Array<Record<string, string>>;
    };
    expect(parsed.section).toBe("Zahlen-Audit");
    expect(parsed.entries.length).toBeGreaterThanOrEqual(5);

    for (const entry of parsed.entries) {
      expect(entry.source).toBeTruthy();
      expect(entry.measured).toBeTruthy();
      expect(entry.denominator).toBeTruthy();
      expect(entry.period).toBeTruthy();
      expect(entry.geography).toBeTruthy();
      expect(entry.method).toBeTruthy();
      expect(entry.transferabilityCaveat).toBeTruthy();
      expect(entry.evidenceStatus).toBeTruthy();
    }
  });

  it("enthält striktes Beteiligungs-Audit und neutralen Master-Teaser", () => {
    const beteiligungAuditNote = getContextNote("note-beteiligungs-audit");
    expect(beteiligungAuditNote?.text).toBeTruthy();

    const parsed = JSON.parse(beteiligungAuditNote!.text) as {
      section: string;
      score: { level: string };
      auditQuestions: string[];
      mandateRule: string;
    };
    expect(parsed.section).toBe("Beteiligungs-Audit");
    expect(parsed.score.level).toMatch(/low|medium|high/);
    expect(parsed.auditQuestions.length).toBeGreaterThanOrEqual(6);
    expect(parsed.mandateRule).toContain("kein belastbares Mandat");

    const teaser = demoDossier.analyze.report.takeaways.join(" ");
    expect(teaser).toContain("eDebatte prüft Zahlen öffentlich");
    expect(teaser).toContain("Prüfen Sie Quellen");
    expect(teaser).toContain("ergänzen Sie lokale Evidenz");
    expect(teaser).toContain("klären Sie Betroffenheit");
  });
});
