import { describe, expect, it } from "vitest";
import {
  resolveDossierUpdateStatus,
  resolveDossierUpdateStatusMeta,
} from "@features/dossier/updateStatusContract";

describe("dossier update status contract", () => {
  it("keeps source hints review-first in simple German copy", () => {
    const status = resolveDossierUpdateStatus({
      moderationStatus: "pending",
      section: "sources",
    });
    const meta = resolveDossierUpdateStatusMeta(status);

    expect(status).toBe("source_hint_added");
    expect(meta.label).toBe("Quelle in Prüfung");
  });

  it("elevates accepted public suggestions to published dossier status", () => {
    const status = resolveDossierUpdateStatus({
      moderationStatus: "accepted",
      section: "claim",
      publicVisible: true,
      attachedToDossier: true,
    });

    expect(status).toBe("published_in_dossier");
    expect(resolveDossierUpdateStatusMeta(status).label).toBe("Veröffentlicht im Dossier");
  });

  it("keeps explicit rejections stable across sections", () => {
    const status = resolveDossierUpdateStatus({
      moderationStatus: "rejected",
      section: "update",
    });

    expect(status).toBe("rejected");
    expect(resolveDossierUpdateStatusMeta(status).tone).toBe("danger");
  });
});
