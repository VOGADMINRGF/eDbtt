import { beforeEach, describe, expect, it } from "vitest";
import {
  createInMemoryRegionDataRepo,
  getRegionalAdminCockpitReadModel,
  setRegionDataRepoForTests,
} from "@features/region";

describe("regional dashboard readmodel", () => {
  beforeEach(() => {
    setRegionDataRepoForTests(createInMemoryRegionDataRepo());
  });

  it("gives Reinickendorf its own feed, topic and dossier suggestions", async () => {
    const model = await getRegionalAdminCockpitReadModel("berlin-reinickendorf");

    expect(model.region.id).toBe("bezirk-berlin-reinickendorf");
    expect(model.feedSignals.some((signal) => signal.title.includes("Schulsanierung"))).toBe(true);
    expect(model.suggestedAnlassraeume.some((item) => item.title === "Bildung & Schulinfrastruktur Reinickendorf")).toBe(true);
    expect(model.suggestedDossiers.some((item) => item.title === "Sanierung von Schulen im Bezirk")).toBe(true);
    expect(model.topicClusters.length).toBeGreaterThan(0);
  });

  it("does not leak Reinickendorf internal pilot signals into Spandau or Pankow", async () => {
    const spandau = await getRegionalAdminCockpitReadModel("berlin-spandau");
    const pankow = await getRegionalAdminCockpitReadModel("berlin-pankow");

    expect(spandau.feedSignals.some((signal) => signal.title.includes("Schulsanierung"))).toBe(false);
    expect(pankow.feedSignals.some((signal) => signal.title.includes("Schulsanierung"))).toBe(false);
    expect(spandau.feedSignals.some((signal) => signal.regionId === "bezirk-berlin-reinickendorf")).toBe(false);
    expect(pankow.feedSignals.some((signal) => signal.regionId === "bezirk-berlin-reinickendorf")).toBe(false);
  });

  it("keeps Magdeburg operational as a separate kommune scope", async () => {
    const magdeburg = await getRegionalAdminCockpitReadModel("magdeburg");

    expect(magdeburg.region.id).toBe("kommune-magdeburg");
    expect(magdeburg.feedSignals.some((signal) => signal.detectedPlaces.includes("Magdeburg"))).toBe(true);
    expect(magdeburg.feedSignals.some((signal) => signal.regionId === "bezirk-berlin-reinickendorf")).toBe(false);
  });

  it("keeps create_dossier suggestions review-gated and never auto-publishes", async () => {
    const model = await getRegionalAdminCockpitReadModel("berlin-reinickendorf");
    const createDossierSignal = model.feedSignals.find((signal) => signal.suggestedAction === "create_dossier");

    expect(createDossierSignal).toBeTruthy();
    expect(
      createDossierSignal?.reviewStatus === "draft" ||
        createDossierSignal?.reviewStatus === "needs_review" ||
        createDossierSignal?.reviewStatus === "accepted",
    ).toBe(true);
    expect(createDossierSignal?.noAutoPublish).toBe(true);
    expect(createDossierSignal?.noAutoCreateDossier).toBe(true);
    expect(createDossierSignal?.noAutoCreateAnlassraum).toBe(true);
    expect(createDossierSignal?.noTenderMonitoring).toBe(true);
    expect(createDossierSignal?.noProcurementMonitoring).toBe(true);
    expect(createDossierSignal?.provenance.fixtureMarker).toBe("pilot_fixture_only");
  });

  it("marks the default server-side cockpit context as explicit admin fallback", async () => {
    const model = await getRegionalAdminCockpitReadModel("berlin-reinickendorf");

    expect(model.accessSummary.adminFallback).toBe(true);
    expect(model.accessSummary.authoritySource).toBe("admin_fallback");
    expect(model.guardrails.noTenderMonitoring).toBe(true);
    expect(model.guardrails.noProcurementMonitoring).toBe(true);
  });
});
