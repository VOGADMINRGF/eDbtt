# WORKTREE-UNTANGLE-CREATECLIENT-00U4

## Verbliebener Blocker aus 00U3

Nach `00U3` blieb `apps/web/src/app/create/CreateClient.tsx` der letzte echte technische Blocker fuer einen isolierten Start/Create/Draft-Commit:

- StartDraft-Restore und lokale Draft-Uebernahme
- StartDraft-Handoff-UI
- Factcheck-Gate
- Editorial-Handoff
- Branch-/Planner-Aufbau

liefen noch im selben Dateidiff zusammen.

`apps/web/src/app/globals.css` blieb bereits in `00U3` bewusst ausgeschlossen und wurde hier nicht angefasst.

## Hunk-Zuordnung `CreateClient.tsx`

### Start/Create/Draft-Hunks

- `initialNextActionParam` als Draft-Next-Action-Eingang
- `startDraftContext` / `pendingStartDraftImport`
- `deriveStartDraftCreateNotice(...)`
- `applyStartDraftToCreate(...)`
- Restore-Effekt ueber `getStartDraftForTarget("create")`
- Import und Render von `CreateStartDraftHandoff`
- Voxy-Copy-Wechsel auf `getStartCreateVoxyCopy(...)`

Begruendung:

Diese Hunks betreffen ausschliesslich den lokalen Entwurfsfluss zwischen `/start`, `/create`, `/themen`, `/runden/new` und `/account`, ohne automatisches Publish, Vote, Graph oder DeepSearch-Start.

### Factcheck-Hunks

- `resolveFactcheckEntitlementGate`
- `getFactcheckEntitlementGateMessage`
- `factcheckConfirmationVisible`
- `confirmFactcheckServiceStart`
- `handleStartFactcheckService`
- Pricing-/Bestaetigungs-CTA im Gate (`Pakete ansehen`, `Vertiefte Prüfung bestätigen`)

### Editorial-Hunks

- `handleRequestEditorialReview`
- CTA `Zur redaktionellen Prüfung geben`
- Gate-Href ueber `request_editorial_review`

### Truth-Guard-Hunks

- keine neuen separaten Truth-Guard-Hunks in `00U4`
- bereits bestehende Analyze-/Followup-/Surface-Hunks bleiben ausserhalb des Start/Create-Slices

### Branch-/Planner-Hunks

- `ContributionPackage`
- `ExistingMatchDecisionDraft`
- `lookupStreetCandidate`
- Branch-/Claim-/Place-Handler
- Retry-/Planner-/Persistenzpfade fuer multibranch followup

Einordnung:

Diese Hunks gehoeren funktional zum Create-/Planner-Komplex, **nicht** zum Start/Create/Draft-Basishandoff. Sie bleiben fuer den spaeteren Start/Create/Draft-Commit ausserhalb des klaren Scope oder muessen hunkgenau ausgeschnitten werden.

### Unklare / gemischte Hunks

- das `create-draft-next-action-gate` im oberen Meta-Bereich ist bewusst **nicht** Start-only:
  - es zeigt Analyse-CTA
  - aber auch Factcheck-/Pricing- und Editorial-Weitergaben

Deshalb wurde dieses Gate in `CreateClient.tsx` belassen und nicht in den neuen StartDraft-Helper verschoben.

## Vorgenommene Entkopplung

Neu angelegt:

- `apps/web/src/app/create/CreateStartDraftHandoff.tsx`

Diese Komponente kapselt jetzt ausschliesslich:

- `GlobalDraftStatusBar`
- `StartDraftWorkspaceChooser`
- lokale Uebernahme eines StartDrafts
- Verwerfen / Behalten / anderer Arbeitsweg

`CreateClient.tsx` rendert den StartDraft-Handoff jetzt nur noch ueber:

- `CreateStartDraftHandoff`

Dadurch sind die Start/Create/Draft-Hunks im Client klarer von Factcheck-, Editorial- und Planner-Hunks getrennt.

## Neue Helper / Komponenten

- `apps/web/src/app/create/CreateStartDraftHandoff.tsx`

Keine neue Produktlogik. Nur Strukturtrennung.

## Bestätigung ausgeschlossener Dateien

Nicht bearbeitet:

- `apps/web/src/app/globals.css`
- `apps/web/src/components/voxy/VoxyGuide.tsx`
- `apps/web/src/features/voxy/voxyCopy.ts`

Start/Create-Copy bleibt isoliert ueber:

- `apps/web/src/features/start/startCreateVoxyCopy.ts`

## Commitbarkeit nach 00U4

Ja, der Start/Create/Draft-Cluster ist jetzt isoliert commitbar, **wenn**:

- `globals.css` weiterhin ausgeschlossen bleibt
- `VoxyGuide.tsx` ausgeschlossen bleibt
- `voxyCopy.ts` ausgeschlossen bleibt
- in `CreateClient.tsx` nur die klaren Start/Create/Draft-Hunks und nicht die Factcheck-/Editorial-/Planner-Hunks mitgestaged werden

## Tests

Ausgefuehrt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/start-draft-context.contract.test.ts tests/start-draft-handoff-targets.contract.test.ts tests/start-create-light-entry.contract.test.tsx tests/start-shared-create-composer.contract.test.tsx tests/global-draft-status-bar.contract.test.tsx tests/branch-workspace-handoff.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/create-branch-ledger-persistence.contract.test.tsx tests/closed-cosmos-ux-audit.contract.test.ts tests/draft-to-review-analyze-gate.contract.test.ts tests/landing-clarity.contract.test.tsx tests/landing-information-architecture.contract.test.tsx tests/mobile-entry-routes.contract.test.tsx tests/themen-surface-staging.contract.test.tsx`

Ergebnis:

- `typecheck` gruen
- `lint` gruen
- `14/14` Testdateien gruen
- `57/57` Tests gruen

Bekannte Restwarnung:

- `mobile-entry-routes.contract.test.tsx` meldet weiter React-DOM-Warnungen zu `fill` und `priority`, ohne Testfehlschlag

## Verbleibende Risiken

- `CreateClient.tsx` bleibt als Datei gross und gemischt; die Commit-Sicherheit haengt an bewusstem Hunk-Splitting.
- `globals.css` bleibt vollstaendig ausserhalb des Start/Create/Draft-Commits.
- `VoxyGuide.tsx` und `voxyCopy.ts` bleiben weiter Querschnittsdrift und duerfen nicht in den Commit gezogen werden.

