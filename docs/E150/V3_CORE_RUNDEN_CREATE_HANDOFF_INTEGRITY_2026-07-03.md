# V3 Core Runden Create Handoff Integrity

Stand: 2026-07-03
Task: `V3-CORE-RUNDEN-CREATE-HANDOFF-INTEGRITY-01`
Status: done

## Ziel

Den echten Produktpfad `/runden/new` -> `/create` so absichern, dass ein
draft-first Manual-Anlassraum-Entwurf als serverseitige Wahrheit uebergeben,
bei Reload wieder geladen und in `/create` ehrlich als belastbarer oder
fehlender Handoff sichtbar wird.

Nicht Teil dieses Slices:

- keine neue KI-Orchestrierung
- kein Auto-Publish
- keine DeepSearch-Automation
- kein neuer Anlassraum-, Dossier- oder Participation-Space-Record
- keine neue Billing- oder AI-Usage-Logik
- keine Downstream-Transparenz fuer Claims, Feeds, Social oder Voxy

## Analyse

### 1. Bisheriger Wechsel von `/runden/new` nach `/create`

Der sichtbare CTA `Mit KI in /create weiter` baute bisher nur einen
query-basierten Prefill-Href. Vor dem Redirect wurde kein serverseitiger
Manual-Anlassraum-Draft garantiert gespeichert.

### 2. Welche Daten bisher uebergeben wurden

Vor dem Slice existierten:

- lokaler `StartDraftContext`
- lokaler Browser-Draft
- Query-Praefill fuer `/create`

Es fehlte aber die belastbare Kopplung an den serverseitigen `drafts`-Record
aus `/api/drafts/save`.

### 3. Warum `/create` den Draft nicht wirklich uebernahm

`/create` las bisher nur:

- den aelteren `draftStore`-Pfad (`getDraft`)
- den `createContributionDrafts`-Pfad (`getCreateContributionDraftForResume`)

Der seit `#292` genutzte Manual-Anlassraum-Draft aus `/api/drafts/save` lag
jedoch in einem anderen bestehenden Store-/Schema-Pfad (`drafts`,
`source = runden_manual_anlassraum`) und wurde deshalb nicht geladen.

### 4. Auswirkungen auf Analyze und Planner

Ohne echten Server-Load arbeiteten Analyze und Intelligent Follow-up nur mit
lokalem oder query-basiertem Zustand. Reload, Direktaufruf oder abgelaufener
lokaler Context konnten den Produktpfad in eine Zwischenwelt ohne belastbare
Draft-Wahrheit bringen.

### 5. Kleinste saubere Luecke

Die kleinste belastbare Luecke war nicht neue Runtime, sondern:

1. vor dem Wechsel nach `/create` denselben serverseitigen Draft sichern
2. diesen Draft in `/create` ueber `draftId` wieder laden
3. fehlende oder ungueltige Handoffs sichtbar statt still lokal behandeln

## Umsetzung

### Handoff von `/runden/new`

`Mit KI in /create weiter` persistiert jetzt vor dem Redirect denselben
serverseitigen Manual-Anlassraum-Draft ueber `/api/drafts/save`.
Erst bei erfolgreichem Save wird nach `/create?draftId=...` navigiert.

Der lokale `StartDraftContext` bleibt erhalten, aber:

- No-AI-Speichern bleibt auf `targetHint = rounds`
- der echte Continue-to-Create-Pfad setzt `targetHint = create`

### Server-Draft-Load in `/create`

`/create` versucht bei `draftId` jetzt zuerst den bestehenden
Manual-Anlassraum-Server-Draft fuer den aktuellen Nutzer zu laden.

Bei erfolgreichem Load:

- wird der serverseitige Entwurfstext als `initialText` verwendet
- wird der Intake-Kontext auf `source = runden` / Draft-Herkunft angereichert
- bekommen Analyze und Intelligent Follow-up denselben Entwurfstext als Start

Bei fehlendem oder ungueltigem Handoff:

- keine Fake-Draft-Wahrheit
- sichtbarer Integrity-Status auf `/create`
- Transparenz bleibt `review_required`

### Sichtbare Handoff-Status

Neuer kanonischer Status fuer den `/runden/new` -> `/create`-Handoff:

- `loaded`
- `missing`
- `invalid`
- `not_requested`

Diese Status werden sowohl in einem kleinen `/create`-Hinweis als auch im
bestehenden Frontend-KI-Transparenzmodell gespiegelt.

## Runtime-Wahrheit nach dem Slice

- Erster persistenter Record bleibt der serverseitige `drafts`-Record.
- Es entsteht weiterhin kein direkter Anlassraum-, Dossier- oder
  Participation-Space-Record.
- Der No-AI-Pfad startet weiterhin keine KI, kein AI-Usage-Event und kein
  DeepSearch.
- Analyze und Intelligent Follow-up nutzen nur bestehende `/create`-
  Strukturen; es wurde keine neue KI-Runtime erfunden.

## Tests und Validierung

Gruen gelaufen:

- `git diff --check`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/runden-create-handoff-integrity.contract.test.ts tests/manual-anlassraum-setup.contract.test.ts tests/manual-anlassraum-server-draft.test.ts tests/runden-manual-create.page.contract.test.tsx tests/runden-entry-canon.contract.test.ts tests/start-draft-context.contract.test.ts tests/start-draft-handoff-targets.contract.test.ts tests/create-mode.page.test.ts tests/frontend-ai-transparency.contract.test.ts tests/create-analyze.contract.test.ts tests/create-intelligent-followup.route.test.ts tests/create-entry-hierarchy.contract.test.tsx`
- `pnpm -C apps/web run build`

## Bewusst offen

- `V3-DOWNSTREAM-KI-TRANSPARENZ-HANDOFF-04`
  - downstream Transparenz fuer Dossier-, Anlassraum- und Beteiligungsraum-
    Folgeflaechen bleibt separat
- `DRAFTS-LEGACY-SSOT-ALIGN-01`
  - alter `draftStore`-/`/api/drafts`-Pfad und neuer `/api/drafts/save`-Pfad
    bleiben als SSOT-Hygiene getrennt offen

## Geaenderte Dateien in diesem Slice

- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/app/create/page.tsx`
- `apps/web/src/app/runden/new/AnlassraumPrePublishCheck.tsx`
- `apps/web/src/app/runden/new/AnlassraumSetupForm.tsx`
- `apps/web/src/features/create/frontendAiTransparency.ts`
- `apps/web/src/features/create/rundenCreateHandoffIntegrity.ts`
- `apps/web/src/features/surfaces/runden/manualAnlassraumSetup.ts`
- `apps/web/tests/create-mode.page.test.ts`
- `apps/web/tests/manual-anlassraum-setup.contract.test.ts`
- `apps/web/tests/runden-create-handoff-integrity.contract.test.ts`
- `apps/web/tests/runden-manual-create.page.contract.test.tsx`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`
- `docs/E150/V3_TEST_RESULTS_REGRESSION_MATRIX_2026-07-02.md`
