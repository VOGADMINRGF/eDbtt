# WORKTREE-FINALIZE-START-CREATE-SCOPE-00U5

## Warum `00V` abgebrochen wurde

`WORKTREE-COMMIT-START-CREATE-DRAFT-00V` wurde nicht committed, weil der erlaubte Start/Create/Draft-Scope an mehreren Querschnittsdateien noch nicht sauber isoliert war:

- `apps/web/src/app/account/AccountClient.tsx`
- `features/account/service.ts`
- `features/account/types.ts`
- `apps/web/src/features/create/SharedCreateComposer.tsx` war technisch noetig, aber noch nicht im freigegebenen Scope
- `apps/web/src/features/start/startExperience.ts` war fachlich Start-/Landing-Copy, aber noch nicht im Scope geklaert
- `apps/web/src/app/start/page.tsx` wurde von `mobile-entry-routes.contract.test.tsx` mitgeprueft

## Entscheidung zu `SharedCreateComposer.tsx`

Datei:

- `apps/web/src/features/create/SharedCreateComposer.tsx`

Bewertung:

- die offene Aenderung ist eindeutig Start/Create/Draft-bezogen
- sie wird direkt durch `CreateClient.tsx` benoetigt
- sie enthaelt keine Factcheck-, Editorial-, Graph- oder Truth-Guard-Hunks

Konkret:

- `minimalHeading` wird von `string` auf `React.ReactNode` erweitert
- Default-Microcopy wird auf die neue Start/Create-Sprache gebracht
- `Beitrag einreichen` wird zu `Beitrag vorbereiten`

Entscheidung:

- `SharedCreateComposer.tsx` gehoert final **in den Start/Create/Draft-Commit**

## Entscheidung zu `startExperience.ts`

Datei:

- `apps/web/src/features/start/startExperience.ts`

Bewertung:

- die Aenderung ist klar Start-/Landing-/Create-Draft-Copy
- sie gehoert fachlich zu `START-CREATE-LIGHT-HERO-POLISH-02` und zum StartDraft-Kosmos
- kein Factcheck-, Graph-, Editorial- oder Truth-Guard-Drift in den offenen Hunks

Entscheidung:

- `startExperience.ts` gehoert final **in den Start/Create/Draft-Commit**

## Entscheidung zu `page.tsx`

### `apps/web/src/app/start/page.tsx`

- die Aenderung ist eindeutig Start-bezogen
- `min-h-screen` wird auf `min-h-[100svh]` umgestellt
- das wird von `mobile-entry-routes.contract.test.tsx` explizit mitgeprueft

Entscheidung:

- `apps/web/src/app/start/page.tsx` gehoert final **in den Start/Create/Draft-Commit**

### `apps/web/src/app/create/page.tsx`

- technisch noetig fuer den aktualisierten Create-Handoff
- reicht `initialNextActionParam` an `CreateClient` weiter
- faellt fuer Resume-Faelle von `getDraft(...)` auf `getCreateContributionDraftForResume(...)` zurueck

Begleitdatei:

- `apps/web/src/server/createContributionDrafts.ts`

Entscheidung:

- `apps/web/src/app/create/page.tsx` gehoert final **in den Start/Create/Draft-Commit**
- `apps/web/src/server/createContributionDrafts.ts` gehoert als technischer Begleiter **ebenfalls hinein**

### `apps/web/src/app/themen/page.tsx`

- bindet `ThemenStartDraftAssistant` sichtbar in die Themenoberflaeche ein
- ist klar Teil des StartDraft-Handoff-Scope

Entscheidung:

- `apps/web/src/app/themen/page.tsx` gehoert final **in den Start/Create/Draft-Commit**

## Bestätigung zu `globals.css`

Datei:

- `apps/web/src/app/globals.css`

Entscheidung:

- bleibt **ausgeschlossen**

Begruendung:

- weiterhin gemischter Public-/Landing-/Voxy-/Runden-Diff
- `mobile-entry-routes.contract.test.tsx` darf trotz CSS-Referenz im Start/Create/Draft-Commit bleiben
- die Datei selbst darf nicht mitgestaged werden

## Hunkbarkeit `AccountClient.tsx`

Datei:

- `apps/web/src/app/account/AccountClient.tsx`

Vorgenommene Entkopplung:

- Create-/Resume-Abschnitte laufen jetzt ueber:
  - `apps/web/src/app/account/AccountCreateDraftSections.tsx`
- offene Factcheck-Reste wurden wieder aus `AccountClient.tsx` herausgenommen

Verbleibender Create-Hunk:

- `dedupeCreateContributionLedgerEntries`
- `readAccountCreateContributionLedgerSlice`
- `AccountCreateDraftSections`
- Spread von `createContributionLedger` in `normalizeOverview(...)`

Entscheidung:

- `AccountClient.tsx` ist jetzt **Start/Create/Draft-hunkbar**

## Hunkbarkeit `service.ts`

Datei:

- `features/account/service.ts`

Vorgenommene Entkopplung:

- nur noch Create-spezifischer Zusatz:
  - `loadAccountCreateContributionLedgerForOverview(...)`
  - `createContributionLedgerPromise`
  - Rueckgabe von `createContributionLedger`
- Factcheck-/Review-Helfer aus diesem Slice wieder entfernt

Entscheidung:

- `service.ts` ist jetzt **Start/Create/Draft-hunkbar**

## Hunkbarkeit `types.ts`

Datei:

- `features/account/types.ts`

Vorgenommene Entkopplung:

- `AccountCreateDraftSlice` als separater Alias
- Review-/Graph-Slices in getrenntem Alias
- kein offener Factcheck-Slice mehr in diesem Diff

Entscheidung:

- `types.ts` ist jetzt **Start/Create/Draft-hunkbar**

## Finaler erlaubter Commit-Scope

### Voll rein

- `apps/web/src/features/start/startDraftContext.ts`
- `apps/web/src/features/start/GlobalDraftStatusBar.tsx`
- `apps/web/src/features/start/StartDraftResumeBanner.tsx`
- `apps/web/src/features/start/StartDraftWorkspaceChooser.tsx`
- `apps/web/src/features/start/LandingCreateLightEntry.tsx`
- `apps/web/src/features/start/landingCreateLight.ts`
- `apps/web/src/features/start/draftNextActionGate.ts`
- `apps/web/src/features/start/startCreateVoxyCopy.ts`
- `apps/web/src/features/start/startExperience.ts`
- `apps/web/src/app/start/LandingStart.tsx`
- `apps/web/src/app/start/page.tsx`
- `apps/web/src/app/create/CreateStartDraftHandoff.tsx`
- `apps/web/src/features/create/SharedCreateComposer.tsx`
- `apps/web/src/app/create/page.tsx`
- `apps/web/src/server/createContributionDrafts.ts`
- `apps/web/src/app/account/AccountResumeWorkbenchSection.tsx`
- `apps/web/src/app/account/CreateContributionLedgerSection.tsx`
- `apps/web/src/app/account/AccountCreateDraftSections.tsx`
- `features/account/createContributionLedgerTypes.ts`
- `features/account/loadAccountCreateContributionLedger.ts`
- `apps/web/src/app/themen/ThemenStartDraftAssistant.tsx`
- `apps/web/src/app/themen/page.tsx`
- die fokussierten Start/Create/Draft-Tests aus `00V`
- die zugehoerigen Evidence-Dateien `02`, `05`, `06`, `07`, `08`, `09`, `10`, `00T`, `00U`, `00U2`, `00U3`, `00U4`, `00U5`

### Hunkgenau rein

- `apps/web/src/app/create/CreateClient.tsx`
  - nur Start/Create/Draft-Hunks
  - keine Factcheck-/Editorial-/Planner-/Branch-/Truth-Guard-Hunks
- `apps/web/src/app/account/AccountClient.tsx`
  - nur Create-/Resume-Hunks
- `features/account/service.ts`
  - nur Create-Ledger-Hunks
- `features/account/types.ts`
  - nur Create-Slice-Hunks
- `apps/web/src/app/runden/new/AnlassraumSetupForm.tsx`
  - nur klare StartDraft-Hunks
- `apps/web/src/app/runden/new/AnlassraumStartDraftPanel.tsx`
  - nur klare StartDraft-Hunks

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

## Kann `00V` jetzt erneut ausgeführt werden?

Ja.

Voraussetzung:

- `globals.css` bleibt draussen
- `VoxyGuide.tsx` bleibt draussen
- `voxyCopy.ts` bleibt draussen
- `CreateClient.tsx`, `AccountClient.tsx`, `service.ts` und `types.ts` werden weiter hunkgenau geschnitten

