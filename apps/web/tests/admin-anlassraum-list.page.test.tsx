import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LocaleProvider } from "@/context/LocaleContext";
import { AdminAnlassraumPageInner } from "@/app/admin/feeds/anlassraum/AdminAnlassraumPageClient";

function renderWithLocale(node: ReactNode) {
  return renderToStaticMarkup(<LocaleProvider initialLocale="de">{node}</LocaleProvider>);
}

describe("admin anlassraum list page", () => {
  it("renders an honest empty state without fake detail promises", () => {
    const html = renderWithLocale(
      <AdminAnlassraumPageInner initialItemsForTest={[]} initialLoadingForTest={false} />,
    );

    expect(html).toContain("0 Einträge");
    expect(html).toContain("Ohne vorhandene Datensätze gibt es hier keinen künstlich vorgetäuschten Detailpfad.");
    expect(html).toContain("Aktuell gibt es deshalb keinen Detailklick");
  });

  it("renders real detail links for existing items", () => {
    const html = renderWithLocale(
      <AdminAnlassraumPageInner
        initialItemsForTest={[
          {
            id: "anlassraum-1",
            title: "Mobilität Innenstadt",
            type: "policy",
            kind: "anlassraum",
            sourceMode: "feed",
            originType: "feed",
            ownerType: "municipality",
            status: "reviewed",
            scope: "regional",
            decisionScope: "regional",
            maturity: "structured",
            topicKey: "verkehr",
            clusterKey: "mobilitaet",
            regionKey: "DE:BE",
            regionCode: "DE:BE",
            dossierId: null,
            dossierType: null,
            isPublic: false,
            reviewedBy: "editor-1",
            approvedBy: null,
            relevanceScore: 82,
            reviewMode: "standard",
            riskFlags: [],
            sourceCount: 2,
            outputs: [],
            createdAt: "2026-05-22T10:00:00.000Z",
            updatedAt: "2026-05-22T11:00:00.000Z",
          },
        ]}
        initialLoadingForTest={false}
      />,
    );

    expect(html).toContain('href="/admin/feeds/anlassraum/anlassraum-1"');
    expect(html).toContain("1 Einträge");
    expect(html).toContain("Detailpfade sind nur für vorhandene Datensätze verlinkt.");
  });
});
