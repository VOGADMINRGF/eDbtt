# PUBLICATION-RISK-LADDER-02

Stand: 2026-05-17
Status: done
Issue: #153

## Ziel

Die bestehende Publication-/Visibility-Ladder aus dem regionalen Beteiligungspfad wird auch in Dossier-/Anlassraum-/Studio-/Draft-/Handoff-Pfaden sichtbar und konsistent genutzt, ohne eine zweite Ladder oder neue Produktlogik einzuführen.

## Umgesetzt

- Zentrale Ladder-Helper in `features/region/publicationRiskLadder.ts` erweitert:
  - `publicationVisibilityLabel(...)`
  - `resolveStudioWorkspaceVisibilityState(...)`
  - `resolveCreateHandoffVisibilityState(...)`
- `RegionSignalDraftRecord` nutzt jetzt denselben typed Visibility-Contract statt `targetVisibility: non_public`.
- `DossierStudioWorkspace` speichert einen abgeleiteten `visibilityState` parallel zum bestehenden Workspace-Status.
- Output-Engine-Artefakte tragen jetzt denselben Visibility-State:
  - `OutputPackage`
  - `DossierOutput`
  - `MasterPost`
  - `SocialCarouselOutput`
  - `SocialDistributionPlan`
  - `SocialDistributionDraft`
- Create-Handoffs tragen einen abgeleiteten Visibility-State und zeigen ihn sichtbar im Handoff-Panel.
- Öffentlicher Anlassraum-Input und Organisationsdashboard nutzen dieselben zentralen Sichtbarkeitslabels statt lokaler Switches.

## Sichtbar anders

- Dossier-Studio zeigt jetzt sichtbar `Sichtbarkeit: privater Entwurf` bzw. den abgeleiteten Workspace-/Output-Zustand.
- Output-Engine-Aktionen und Verteilplanung zeigen dieselbe Ladder-Sprache statt nur lokaler Review-Hinweise.
- Create-Handoff-Flächen zeigen die Sichtbarkeit des Arbeitsstands explizit.
- Organisationsbereich zeigt Drafts und Beteiligungssignale mit denselben Ladder-Labels wie der regionale Beteiligungspfad.

## Guardrails unverändert

- keine neue Parallel-Ladder
- kein Social Publishing
- keine externe Veröffentlichung
- keine automatische amtliche Antwort
- keine automatische Dossier-Finalisierung
- keine automatische Anlassraum-Finalisierung
- kein Payment
- kein GeoReferenceLayer
- keine neue AI-Kostenlogik

## Validierung

- `pnpm -C apps/web exec vitest run tests/region-signal-drafts.contract.test.ts tests/admin-region-signal-draft.route.test.ts tests/dossier-output-studio.page.contract.test.ts tests/dossier-studio-server-persistence-ui.test.tsx tests/dossier-studio-workspace.contract.test.ts tests/dossier-studio-workspace.route.test.ts tests/create-anlassraum-handoff.contract.test.tsx tests/create-dossier-handoff.contract.test.ts tests/create-factcheck-handoff.contract.test.ts tests/runden-public-input.route.test.ts tests/account-organization-dashboard.page.test.tsx tests/organization-dashboard.readmodel.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`

## Offen

- Explizite `public_official`-Freigaben bleiben weiterhin ein menschlicher, separater Folgepfad.
- Eine durchgehende End-to-end-Review-Queue über alle Dossier-/Factcheck-/Publish-Domains ist weiterhin nicht abgeschlossen.
- Echte AI-/Source-Adapter bleiben separat in `REGION-INTELLIGENCE-02`.
