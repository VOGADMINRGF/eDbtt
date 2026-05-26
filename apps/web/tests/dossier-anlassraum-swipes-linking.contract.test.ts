import { describe, expect, it } from "vitest";
import { ObjectId } from "@core/db/triMongo";
import { buildDossierPublicUpdateContext } from "@features/dossier/updateReadModel";

describe("dossier anlassraum swipes linking contract", () => {
  it("keeps dossier, anlassraum and swipes bidirectionally linkable on real routes", () => {
    const context = buildDossierPublicUpdateContext({
      dossierId: "dossier-klima",
      items: [],
      publicVisible: true,
      archived: false,
      relatedAnlassraum: {
        _id: new ObjectId("65f000000000000000000010"),
        title: "Klimaraum Innenstadt",
      },
      statementId: "statement-klima",
    });

    expect(context.relatedContext.dossierHref).toBe("/dossier/dossier-klima");
    expect(context.relatedContext.anlassraumHref).toBe(
      "/runden?anlassraumId=65f000000000000000000010",
    );
    expect(context.relatedContext.anlassraumLabel).toContain("Klimaraum Innenstadt");
    expect(context.relatedContext.swipesHref).toBe("/swipes/statement-klima");
    expect(context.relatedContext.swipesLabel).toBe("Zur passenden Swipe-Karte");
  });
});
