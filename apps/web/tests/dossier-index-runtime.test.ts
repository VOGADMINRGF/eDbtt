import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  listPublishedDossierPublicationRecords: vi.fn(),
}));

vi.mock("@/features/create/dossierPublishWorkflowServer", () => ({
  listPublishedDossierPublicationRecords: (...args: unknown[]) =>
    mocks.listPublishedDossierPublicationRecords(...args),
}));

import { listPublishedDossiers } from "@/features/dossier/publicRuntime";
import DossierIndexPage, {
  dynamic,
  runtime,
} from "@/app/dossier/page";

describe("dossier index runtime", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("derives overview fields only from published runtime records", async () => {
    mocks.listPublishedDossierPublicationRecords.mockResolvedValue([
      {
        dossierId: "dossier-school",
        title: "Sichere Schulwege",
        originQuestion: "Welche Kreuzungen sind zuerst kritisch?",
        summary: "Veröffentlichter Arbeitsstand.",
        sourceStatus: "source_review_pending",
        updatedAt: "2026-07-20T10:00:00.000Z",
      },
    ]);

    await expect(listPublishedDossiers()).resolves.toEqual([
      {
        id: "dossier-school",
        slug: "dossier-school",
        title: "Sichere Schulwege",
        coreQuestion: "Welche Kreuzungen sind zuerst kritisch?",
        summary: "Veröffentlichter Arbeitsstand.",
        statusLabel: "Veröffentlicht",
        sourceStatusLabel: "Quellenprüfung offen",
        updatedAt: "2026-07-20T10:00:00.000Z",
        source: "runtime",
      },
    ]);
  });

  it("renders the overview dynamically from the runtime list", async () => {
    mocks.listPublishedDossierPublicationRecords.mockResolvedValue([
      {
        dossierId: "dossier-school",
        title: "Sichere Schulwege",
        originQuestion: "Welche Kreuzungen sind zuerst kritisch?",
        summary: "Veröffentlichter Arbeitsstand.",
        sourceStatus: "source_review_pending",
        updatedAt: "2026-07-20T10:00:00.000Z",
      },
    ]);

    const html = renderToStaticMarkup(await DossierIndexPage());

    expect(runtime).toBe("nodejs");
    expect(dynamic).toBe("force-dynamic");
    expect(html).toContain("Sichere Schulwege");
    expect(html).toContain("/dossier/dossier-school");
  });
});
