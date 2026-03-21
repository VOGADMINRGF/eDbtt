import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AnlassraumOperationsPanel } from "@/features/anlassraumOperationsUi";

describe("anlassraum operations page", () => {
  it("renders filters, metadata and deep links", () => {
    const html = renderToStaticMarkup(
      <AnlassraumOperationsPanel
        data={{
          items: [
            {
              id: "65f000000000000000000111",
              title: "Mobilitaet Innenstadt",
              slug: "mobilitaet-innenstadt",
              status: "curated",
              scope: "regional",
              decisionScope: "regional",
              summary: "Operativer Anlassraum fuer Mobilitaet.",
              regionKey: "DE:BE",
              topicKey: "verkehr",
              clusterKey: "cluster-verkehr",
              sourceMode: "feed",
              originType: "feed",
              maturity: "structured",
              relevanceScore: 0.74,
              riskFlags: [],
              sourceCount: 4,
              outputCount: 2,
              outputTypes: ["round_seed", "dossier_seed"],
              feedContext: {
                linkedDraftCount: 6,
                queuedDraftCount: 2,
                weakSignalDraftCount: 1,
                latestDraftCreatedAt: "2026-03-21T11:00:00.000Z",
              },
              clusterContext: {
                clusterKey: "cluster-verkehr",
                peerRoomCount: 3,
                candidateStatus: "candidate",
                candidateDraftCount: 9,
                candidateUpdatedAt: "2026-03-21T09:30:00.000Z",
              },
              isPublic: false,
              dossierId: "65f000000000000000000211",
              dossierType: "exploration_dossier",
              createdAt: "2026-03-20T10:00:00.000Z",
              updatedAt: "2026-03-21T10:00:00.000Z",
              operationalHints: ["no_dossier_link"],
              links: {
                detailAdmin: "/admin/feeds/anlassraum/65f000000000000000000111",
                detailJson: "/api/admin/feeds/anlassraum/65f000000000000000000111",
                createContext: "/create?anlassraumId=65f000000000000000000111",
                attachQueue: "/admin/create/attach-drafts?reviewState=all&q=65f000000000000000000111",
                feedDrafts: "/admin/feeds/drafts?hasAnlassraum=linked",
                feedClusterRooms: "/admin/feeds/anlassraum?sourceMode=cluster",
                feedInputRooms: "/admin/feeds/anlassraum?sourceMode=feed",
                clusterControl: "/admin/feeds",
                dossierAdmin: "/admin/dossiers/65f000000000000000000211",
              },
            },
          ],
          total: 1,
          page: 1,
          limit: 24,
          hasMore: false,
          filters: {
            q: null,
            status: "all",
            scope: "all",
          },
          scan: {
            scanned: 15,
            visible: 9,
          },
        }}
        loading={false}
        error={null}
        query={{ q: "", status: "all", scope: "all", page: 1, limit: 24 }}
        onQueryChange={vi.fn()}
        onReload={vi.fn()}
      />,
    );

    expect(html).toContain("Anlassraum Operations");
    expect(html).toContain("Read-only only");
    expect(html).toContain("Suche");
    expect(html).toContain("Status");
    expect(html).toContain("Scope");
    expect(html).toContain("Mobilitaet Innenstadt");
    expect(html).toContain("Operative Hinweise");
    expect(html).toContain("Admin-Detail");
    expect(html).toContain("Create-Kontext");
    expect(html).toContain("Attach Queue");
    expect(html).toContain("Feed-/Cluster-Kontext");
    expect(html).toContain("Feed-Drafts");
    expect(html).toContain("Feed-Input Rooms");
    expect(html).toContain("Cluster-Rooms");
    expect(html).toContain("Cluster-Control");
    expect(html).toContain("Feed/History JSON");
    expect(html).toContain("Dossier-Admin");
  });
});
