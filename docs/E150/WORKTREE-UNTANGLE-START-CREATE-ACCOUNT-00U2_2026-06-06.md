# WORKTREE-UNTANGLE-START-CREATE-ACCOUNT-00U2

Date: 2026-06-06
Status: source changed, not staged, not committed

## Verbliebene Blocker aus 00U

Aus 00U offen:

- `apps/web/src/app/account/AccountClient.tsx`
- `features/account/service.ts`
- `features/account/types.ts`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/src/components/voxy/VoxyGuide.tsx`
- `apps/web/src/features/voxy/voxyCopy.ts`

## Vorgenommene Entkopplung

Geändert / neu:

- `apps/web/src/app/account/CreateContributionLedgerSection.tsx` neu
- `apps/web/src/app/account/AccountClient.tsx`
- `features/account/service.ts`
- `features/account/types.ts`
- `apps/web/src/features/start/startCreateVoxyCopy.ts` neu
- `apps/web/src/app/start/LandingStart.tsx`
- `apps/web/src/app/create/CreateClient.tsx`

### Account-Entkopplung

- der große Create-Ledger-/Arbeitsstände-Block wurde aus `AccountClient.tsx` nach `CreateContributionLedgerSection.tsx` ausgelagert
- `AccountClient.tsx` trägt jetzt für Start/Create/Draft nur noch:
  - Import von `CreateContributionLedgerSection`
  - `resumeSection`-Einbindung über `AccountReviewSupplementSections`
  - `createContributionLedger`-Normalisierung in `normalizeOverview`
- Editorial-, Factcheck- und Graph-Sektionen bleiben sichtbar getrennt

### Service-Entkopplung

- `loadAccountCreateContributionLedger` wurde in `service.ts` über `loadAccountCreateContributionLedgerForOverview(...)` separat gekapselt
- das Create-Ledger wird jetzt außerhalb des `Promise.all` separat awaited
- dadurch liegt der Start/Create/Draft-Hunk nicht mehr im selben Sammelblock wie Factcheck

### Types-Entkopplung

- `types.ts` referenziert den Start/Create-Draft-Slice jetzt inline über
  `import("./createContributionLedgerTypes").AccountCreateContributionLedgerSlice`
- dadurch entfällt ein zusätzlicher gemischter Importblock für den Start-Slice

### Voxy-Copy-Entkopplung

- Start-/Create-spezifische Voxy-Texte wurden nach `startCreateVoxyCopy.ts` ausgelagert
- `LandingStart.tsx` und `CreateClient.tsx` hängen damit nicht mehr an `voxyCopy.ts`
- `voxyCopy.ts` bleibt für diesen Slice draußen

## Hunk-Zuordnung

### `apps/web/src/app/account/AccountClient.tsx`

Start/Create/Draft:

- `dedupeCreateContributionLedgerEntries`
- `AccountReviewSupplementSections` mit `resumeSection`
- `CreateContributionLedgerSection`
- `readAccountCreateContributionLedgerSlice`
- Start/Create-Draft-Slice im `AccountOverview`

Factcheck:

- `readAccountFactcheckJobSlice`
- `AccountReviewSupplementSections` mit `factcheckSection`
- Factcheck-Slice im `AccountOverview`

Editorial:

- `AccountEditorialReviewSupplement`
- `readAccountEditorialReviewSlice`

Graph:

- `AccountGraphMergeCandidateSection`
- `readAccountGraphMergeCandidateSlice`

Bewertung:

- **jetzt deutlich besser hunkbar**
- Start/Create/Draft ist auf kleine Einbindungs- und Normalisierungs-Hunks reduziert

### `features/account/service.ts`

Start/Create/Draft:

- `preferredLocale`
- `loadAccountCreateContributionLedgerForOverview(...)`
- `createContributionLedgerPromise`
- separater `await createContributionLedgerPromise`
- `createContributionLedger` im Return

Editorial:

- `loadAccountEditorialReviewRequests`
- `editorialReviewRequestsPromise`

Factcheck:

- `loadAccountFactcheckJobs`
- `factcheckJobsPromise`
- `factcheckJobs` im Return

Graph:

- `graphMergeCandidatesPromise`

Bewertung:

- **jetzt hunkbar**
- Start/Create/Draft steht nicht mehr im selben Promise-Sammelhunk wie Factcheck

### `features/account/types.ts`

Start/Create/Draft:

- `import("./createContributionLedgerTypes").AccountCreateContributionLedgerSlice`

Editorial:

- `AccountEditorialReviewSlice`

Factcheck:

- `AccountFactcheckJobSlice`

Graph:

- `AccountGraphMergeCandidateSlice`

Bewertung:

- **jetzt hunkbar**
- der Start-Slice ist als einzelne zusätzliche Typ-Komposition isolierbar

### `apps/web/src/app/create/CreateClient.tsx`

Start/Create/Draft:

- StartDraft-Import/-Restore
- `GlobalDraftStatusBar`
- `StartDraftWorkspaceChooser`
- `startDraftContext`
- `pendingStartDraftImport`
- `deriveStartDraftCreateNotice`
- StartDraft-Handoff nach `/themen`, `/runden/new`, `/account`
- neue Start/Create-Voxy-Copy aus `startCreateVoxyCopy.ts`

Factcheck:

- `resolveFactcheckEntitlementGate`
- `getFactcheckEntitlementGateMessage`
- `factcheckConfirmationVisible`
- `confirmFactcheckServiceStart`
- `handleStartFactcheckService`
- Gate-UI `Vertiefte Prüfung benötigt Bestätigung`

Editorial:

- `handleRequestEditorialReview`
- CTA `Zur redaktionellen Prüfung geben`

Weitere Create-/Planner-/Branch-Hunks:

- `lookupStreetCandidate`
- `ContributionPackage`
- Branch-/Place-/Planner-Handler
- Persistenz für Contribution-Package

Bewertung:

- **noch nicht hunkbar genug**
- Start/Create/Draft ist hier weiter mit Factcheck-Gate, Editorial-Handoff und Branch-/Planner-Weiterbau verschränkt

### `apps/web/src/app/globals.css`

Start/Create/Draft:

- `landing-*`
- `public-start-*`
- Teile von `public-start-shell`, `public-start-preview-*`, `public-start-example-*`

Runden / Anlassraum:

- `runden-*`
- `anlassraum-*`

Allgemeine Public-/Voxy-Systemhunks:

- `public-shell`
- `public-reader-grid`
- `public-hero-*`
- `public-color-rail`
- `public-action-row`
- `public-voxy-*`

Bewertung:

- **nicht sauber hunkbar**
- zu viel gemischter Public-/Voxy-/Landing-Systemdrift

### `apps/web/src/components/voxy/VoxyGuide.tsx`

- rein generische Avatar-/Stage-/Marker-Darstellung
- keine sauber Start-exklusive Hunk-Grenze

Bewertung:

- **ausgeschlossen**

### `apps/web/src/features/voxy/voxyCopy.ts`

Start/Create:

- war vorher gemischt enthalten

Runden:

- `anlassraum`
- `rundenEntry`
- `rundenHero`
- `manualFrame`
- `manualSupport`

Bewertung:

- **für Start/Create/Draft jetzt nicht mehr nötig**
- Start-/Create-Copy wurde nach `startCreateVoxyCopy.ts` ausgelagert

## Tests

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/start-draft-context.contract.test.ts tests/start-draft-handoff-targets.contract.test.ts tests/start-create-light-entry.contract.test.tsx tests/start-shared-create-composer.contract.test.tsx tests/global-draft-status-bar.contract.test.tsx tests/branch-workspace-handoff.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/create-branch-ledger-persistence.contract.test.tsx tests/closed-cosmos-ux-audit.contract.test.ts tests/draft-to-review-analyze-gate.contract.test.ts tests/landing-clarity.contract.test.tsx tests/landing-information-architecture.contract.test.tsx tests/mobile-entry-routes.contract.test.tsx tests/themen-surface-staging.contract.test.tsx`

Ergebnis:

- `typecheck`: grün
- `lint`: grün
- `vitest`: grün
  - `14/14` Testdateien
  - `57/57` Tests

Hinweis:

- `mobile-entry-routes.contract.test.tsx` erzeugt weiter React-DOM-Warnungen zu `fill` und `priority`, schlägt aber nicht fehl

## Commitability

Verdict nach 00U2: **noch nicht vollständig isoliert commitbar**

Was jetzt commitbar bzw. sauber hunkbar ist:

- `AccountClient.tsx`
- `features/account/service.ts`
- `features/account/types.ts`
- `CreateContributionLedgerSection.tsx`
- `startCreateVoxyCopy.ts`
- `LandingStart.tsx`

Verbleibende Commit-Blocker:

- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/src/components/voxy/VoxyGuide.tsx`

## Verbleibende Risiken

- `CreateClient.tsx` mischt StartDraft-Handoff weiter mit Factcheck-Gate und tieferem Branch-/Planner-Aufbau
- `globals.css` enthält weiterhin zu viel allgemeinen Public-/Voxy-/Landing-Systemdrift
- `VoxyGuide.tsx` ist nur generisch und für Start nicht sauber isolierbar

## Nächster sicherer Schritt

1. `CreateClient.tsx` in einen StartDraft-Handoff-Teil und einen Factcheck-/Planner-/Branch-Teil weiter auftrennen
2. `globals.css` nur dann in den Slice ziehen, wenn die Start-/Create-Light-Hunks in einen getrennten, eindeutig benannten Bereich ausgelagert werden
3. `VoxyGuide.tsx` draußen lassen, sofern die Start-Oberflächen ohne dessen Präsentationshunk akzeptabel commitbar bleiben

## Nicht verändert

- kein Staging
- kein Commit
- `docs/E150/OpenTasks.md` wurde nicht verändert
