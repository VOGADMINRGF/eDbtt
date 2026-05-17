# CREATE-SIMPLE-CONFIRMATION-01

Datum: 2026-05-17

## Ziel

`/create` sollte die erste sichtbare Folgeentscheidung als statement-first Confirmation-Stage zeigen:

- Rueckfrage: `Haben wir dich richtig verstanden?`
- primaere CTAs: `Ja, so einreichen` und `Ich moechte tiefer ins Thema`
- keine neue Route
- keine neue API
- keine neue AI-Kostenlogik
- kein Publishing-Code

## Umsetzung

- Die bestehende `CreateVisualFollowup`-Strecke wurde kopfseitig auf die sichtbare Rueckfrage `Haben wir dich richtig verstanden?` umgestellt.
- Die erste CTA-Verzweigung nutzt weiter die vorhandenen Handlers und Handoff-Pfade:
  - `Ja, so einreichen` nutzt den bestehenden Submission-Handoff.
  - `Ich moechte tiefer ins Thema` bestaetigt den Arbeitsstand und oeffnet die vorhandenen tieferen Folgeoptionen.
- Die bestehende Analyze-/Planner-/Follow-up-/Handoff-Logik bleibt unveraendert; es wurden nur UX-/Copy-/IA-Entscheidungen auf der bestehenden Runtime verdrahtet.
- Hinweise gegen stille Veroeffentlichung bleiben sichtbar (`Nichts wird automatisch veroeffentlicht.` / `Keine automatische Veroeffentlichung.`).

## Geaenderte Dateien

- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/features/create/createSurfaceConfig.ts`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/tests/create-followup-i18n.contract.test.ts`
- `apps/web/tests/create-chat-first-mobile-dialog-experience.contract.test.tsx`
- `apps/web/tests/create-curated-dialog-workspace.contract.test.tsx`
- `apps/web/tests/analyze-workbench-hidden-until-start.test.ts`
- `apps/web/tests/create-degraded-followup-actions.contract.test.tsx`
- `apps/web/tests/create-planner-degraded-ui.contract.test.tsx`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`

## Validierung

Ausgefuehrt:

- `pnpm -C apps/web exec vitest run tests/create-followup-i18n.contract.test.ts tests/create-chat-first-mobile-dialog-experience.contract.test.tsx tests/create-curated-dialog-workspace.contract.test.tsx tests/analyze-workbench-hidden-until-start.test.ts tests/create-degraded-followup-actions.contract.test.tsx tests/create-planner-degraded-ui.contract.test.tsx`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`

## Ergebnis

`/create` beginnt im relevanten Follow-up jetzt sichtbar mit `Haben wir dich richtig verstanden?`.
Die ersten beiden Primaerpfade sind klar getrennt in direktes Einreichen vs. tieferen Themenpfad.
Es wurden weder neue Produktpfade noch neue AI-/Publishing-Mechaniken eingefuehrt.
