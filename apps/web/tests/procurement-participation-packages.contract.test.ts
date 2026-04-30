import { describe, expect, it } from "vitest";
import {
  getPackagesForTenderLot,
  participationPackages,
  procurementFollowupTasks,
  tenderLotMappings,
} from "@features/procurement/participationPackages";

describe("procurement participation package contract", () => {
  it("keeps procurement packages mapped to tender language", () => {
    expect(participationPackages.map((pkg) => pkg.id)).toEqual([
      "check",
      "dossier",
      "runde",
      "mandat",
      "studio",
      "onlinebeteiligung",
      "akutlage",
      "zukunftsprozess",
    ]);

    for (const pkg of participationPackages) {
      expect(pkg.title).toContain("eDebatte");
      expect(pkg.tenderFit.length).toBeGreaterThan(0);
      expect(pkg.outputs.length).toBeGreaterThan(0);
      expect(pkg.modules.length).toBeGreaterThan(0);
    }
  });

  it("maps six tender lots to eDebatte offers", () => {
    expect(tenderLotMappings).toHaveLength(6);
    expect(tenderLotMappings.map((lot) => lot.id)).toEqual([
      "local",
      "regional",
      "legal",
      "future",
      "acute",
      "online",
    ]);
    expect(getPackagesForTenderLot("online").map((pkg) => pkg.id)).toEqual([
      "onlinebeteiligung",
      "runde",
      "mandat",
    ]);
  });

  it("keeps unresolved ideas as explicit follow-up tasks", () => {
    expect(procurementFollowupTasks.map((task) => task.id)).toEqual([
      "PROC-BET-02",
      "PROC-BET-03",
      "PROC-BET-04",
      "PROC-BET-05",
    ]);
  });
});
