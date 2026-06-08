# WORKTREE-UNTANGLE-START-CREATE-DRAFT-00U

Date: 2026-06-06
Status: source changed, not staged, not committed

## Ausgangslage aus 00T

Bekannte Blocker:

- `apps/web/src/app/account/AccountClient.tsx`
- `features/account/service.ts`
- `features/account/types.ts`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/src/components/voxy/VoxyGuide.tsx`
- `apps/web/src/features/voxy/voxyCopy.ts`

Bekannter Teststatus vor 00U:

- `typecheck`: grün
- `lint`: grün
- fokussierte Start/Create/Draft-Suite: rot
- rote Dateien:
  - `tests/start-draft-context.contract.test.ts`
  - `tests/start-draft-handoff-targets.contract.test.ts`
  - `tests/closed-cosmos-ux-audit.contract.test.ts`
  - `tests/branch-workspace-handoff.contract.test.ts`

## Rote Tests und Ursache

### `tests/start-draft-context.contract.test.ts`

Ursache:

- Statuslabel-Drift zwischen altem generischem `Entwurf` und kanonischem `Analyse-Entwurf` für `start_create_light`

Korrektur:

- kanonische Sprache in `startDraftContext.ts` beibehalten
- Test auf den kanonischen Status `Analyse-Entwurf` ausgerichtet

### `tests/start-draft-handoff-targets.contract.test.ts`

Ursache:

- der StartDraft-Handoff nach `/runden/new` war durch die frühere Entkopplung zu stark reduziert
- `AnlassraumSetupForm.tsx` enthielt keinen sichtbaren `StartDraftWorkspaceChooser`-Hunk mehr
- erwartete StartDraft-Copy war nur noch als Kommentar oder gar nicht mehr im produktiven Handoff vorhanden

Korrektur:

- in `AnlassraumSetupForm.tsx` wieder einen klaren StartDraft-Handoff für `rounds` eingebaut
- `getStartDraftForTarget("rounds")`, `StartDraftWorkspaceChooser` und Draft-Verwerfen wieder produktiv verdrahtet

### `tests/closed-cosmos-ux-audit.contract.test.ts`

Ursache:

- dieselbe Runden-Handoff-Lücke wie oben
- Themen-Handoff-Copy war auf eine nicht mehr zum Contract passende Satzform abgewichen

Korrektur:

- Runden-Handoff wieder produktiv eingebunden
- Themen-Copy auf die kanonische, explizit nicht-automatische Form gebracht

### `tests/branch-workspace-handoff.contract.test.ts`

Ursache:

- im Runden-Entwurf fehlte der gemeinsame Workspace-Wechsler
- erwartete Copy `Optionen weiterbearbeiten` war nicht mehr produktiv sichtbar

Korrektur:

- `StartDraftWorkspaceChooser` in `/runden/new`
- Runden-Handoff-Copy auf `Optionen ergänzen` plus `Optionen weiterbearbeiten` zurückgeführt

## Vorgenommene Korrekturen

Geändert:

- `apps/web/src/features/start/startDraftContext.ts`
- `apps/web/src/app/themen/ThemenStartDraftAssistant.tsx`
- `apps/web/src/app/runden/new/AnlassraumStartDraftPanel.tsx`
- `apps/web/src/app/runden/new/AnlassraumSetupForm.tsx`
- `apps/web/src/app/account/AccountResumeWorkbenchSection.tsx`
- `apps/web/tests/start-draft-context.contract.test.ts`
- `apps/web/tests/themen-surface-staging.contract.test.tsx`

### Statussprache

Kanonisiert bzw. bestätigt:

- `Analyse-Entwurf`
- `Noch nicht veröffentlicht`
- `Noch nicht gezählt`
- `Noch nicht zusammengeführt`
- `Noch keine Stimmen`
- `Keine automatische Prüfung`
- `Zur manuellen Prüfung vorgemerkt`
- `Quellenlage klären`

Nicht verwendet:

- keine irreführende Veröffentlichungs-, Prüf- oder Graph-Sprache

### Handoff- / Draft-Kontext

Bestätigt:

- StartDraft bleibt Draft-Kontext
- `/start -> /create`, `/start -> /themen`, `/start -> /runden/new`, `/start -> review/editorial` bleiben als bewusste Handoffs modelliert
- kein Publish, kein Vote, kein Graph-Write, kein Factcheck-Autostart

### Account-Resume

Stabilisiert:

- `AccountResumeWorkbenchSection.tsx` markiert `start_create_light` weiter explizit als `Analyse-Entwurf`
- damit bleibt die Resume-Oberfläche konsistent mit dem Draft-Gate- und Guardrail-Modell

## Hunk-Zuordnung

### `apps/web/src/app/account/AccountClient.tsx`

- Start/Create/Draft:
  - `AccountReviewSupplementSections` mit `resumeSection`
  - `CreateContributionLedgerSection`
  - `readAccountCreateContributionLedgerSlice`
  - create-ledger-Normalisierung
- Editorial:
  - `AccountEditorialReviewSupplement`
  - `readAccountEditorialReviewSlice`
- Factcheck:
  - `factcheckSection`
  - `readAccountFactcheckJobSlice`
- Graph:
  - `AccountGraphMergeCandidateSection`
  - `readAccountGraphMergeCandidateSlice`

Bewertung:

- weiterhin gemischt
- noch nicht sauber Start-only commitbar

### `features/account/service.ts`

- Start/Create/Draft:
  - `preferredLocale`
  - `loadAccountCreateContributionLedger`
  - `createContributionLedgerPromise`
  - `createContributionLedger` im Return
- Editorial:
  - `loadAccountEditorialReviewRequests`
  - `editorialReviewRequestsPromise`
- Factcheck:
  - `loadAccountFactcheckJobs`
  - `factcheckJobsPromise`
  - `factcheckJobs` im Return
- Graph:
  - `graphMergeCandidatesPromise`

Bewertung:

- weiterhin gemischt
- Start und Factcheck liegen noch im selben Aggregationsblock

### `features/account/types.ts`

- Start/Create/Draft:
  - `AccountCreateContributionLedgerSlice`
- Editorial:
  - `AccountEditorialReviewSlice`
- Factcheck:
  - `AccountFactcheckJobSlice`
- Graph:
  - `AccountGraphMergeCandidateSlice`

Bewertung:

- weiterhin gemischter Kompositionsblock
- nicht Start-only sauber getrennt

### `apps/web/src/app/create/CreateClient.tsx`

- Start/Create/Draft:
  - StartDraft-Import/-Restore
  - `GlobalDraftStatusBar`
  - `StartDraftWorkspaceChooser`
  - `draftNextActionGate`
  - StartDraft-Handoff nach `/themen`, `/runden/new`, `/account`
- Factcheck:
  - `resolveFactcheckEntitlementGate`
  - `getFactcheckEntitlementGateMessage`
  - Factcheck-Bestätigungs- und Pricing-Hunks
- Editorial:
  - Review-Handoff und Review-CTA-Hunks
- Graph / Folgepfade:
  - weitere branch/followup-orientierte Handoffs und Planner-Fortsetzungen

Bewertung:

- weiterhin klar gemischt
- noch nicht Start/Create/Draft-only commitbar

### `apps/web/src/app/globals.css`

- Start/Create/Draft:
  - `landing-*`
  - `public-start-*`
- Runden:
  - `runden-*`
  - `anlassraum-*`
- Public / Voxy allgemein:
  - `public-*`
  - `public-voxy-*`
  - Shell-/Hero-/Layout-Hunks

Bewertung:

- nicht sauber Start-only

### `apps/web/src/components/voxy/VoxyGuide.tsx`

- allgemeine Voxy-/Public-Darstellung
- kein sauber isolierter Start/Create/Draft-Hunk

Bewertung:

- weiter generalistisch
- nicht in einen Start-only Commit aufnehmen

### `apps/web/src/features/voxy/voxyCopy.ts`

- Start/Create/Draft:
  - `start`
  - `create`
- Runden:
  - `anlassraum`
  - `rundenEntry`
  - `rundenHero`
  - `manualFrame`
  - `manualSupport`

Bewertung:

- weiter gemischt mit dem bereits committeden Runden-Cluster

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

- `tests/mobile-entry-routes.contract.test.tsx` erzeugt weiterhin React-Attributwarnungen zu `fill` und `priority`, schlägt aber nicht fehl

## Commitability

Verdict nach 00U: **noch nicht isoliert commitbar**

Warum:

- `AccountClient.tsx`, `features/account/service.ts` und `features/account/types.ts` bleiben mit Factcheck/Editorial/Graph im selben offenen Änderungsraum
- `CreateClient.tsx` mischt Start/Create/Draft weiter mit Factcheck-/Review-/Folgepfad-Hunks
- `globals.css`, `VoxyGuide.tsx` und `voxyCopy.ts` sind nicht Start-only

## Verbleibende Risiken

- Account-Querschnitt bleibt der zentrale Commit-Blocker
- `CreateClient.tsx` ist weiter der größte Querschnitt zwischen Start, Review und Factcheck-Gating
- Start-spezifische Public-/Voxy-Optik ist noch nicht sauber aus den allgemeinen Public-Hunks getrennt

## Nächster sicherer Schritt

1. `features/account/service.ts` und `features/account/types.ts` in Start- gegenüber Factcheck-/Graph-Hunks weiter auftrennen
2. `apps/web/src/app/account/AccountClient.tsx` in Resume/Create-Ledger gegenüber Factcheck/Editorial/Graph weiter separieren
3. `apps/web/src/app/create/CreateClient.tsx` so splitten, dass StartDraft-Handoff und Factcheck-/Review-Gate nicht im selben Commit-Hunk hängen
4. danach Commitability des Clusters erneut prüfen

## Nicht verändert

- kein Staging
- kein Commit
- `docs/E150/OpenTasks.md` wurde nicht verändert
