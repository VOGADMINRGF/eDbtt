import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import DossierIndex from "@/app/dossier/ui";
import { buildCreateHandoffTargetHref } from "@/features/create/createHandoff";

describe("create dossier handoff contract", () => {
  it("keeps create handoff parameters out of the canonical dossier overview", () => {
    const html = renderToStaticMarkup(
      React.createElement(DossierIndex, {
        handoffId: "dossier-handoff-1",
        createAction: "create_dossier",
        seedTopic: "Tierwohl",
      }),
    );
    const href = buildCreateHandoffTargetHref({
      baseHref: "/dossier",
      handoffId: "dossier-handoff-1",
      action: "create_dossier",
    });

    expect(href).toContain("handoffId=dossier-handoff-1");
    expect(html).toContain("Noch keine veröffentlichten Dossiers");
    expect(html).not.toContain("Aus deinem Beitrag vorbereitet");
    expect(html).not.toContain("dossier-handoff-1");
    expect(html).not.toContain("Tierwohl");
  });
});
