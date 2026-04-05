# PR-AI-CREATE-01E - Create Parent Closure (2026-04-04)

## Scope

Kleiner Abschluss-Slice fuer den verbleibenden `PR-AI-CREATE-01`-Restscope:
- keine neue Produktlogik
- keine neue CTA-/Match-Logik
- keine neue `/create`-Architektur
- nur Contract-/Wrapper-Paritaet + Regression-Freeze

## Umgesetzt

1. Legacy-Wrapper passt Multi-Entry-Hints durch
- Datei: `apps/web/src/app/contributions/new/page.tsx`
- Allowlist fuer `/create`-Weiterleitung um `entryIntent`, `entryMode`, `entry_intent`, `entry_mode` erweitert.
- Damit gehen Orchestrator-Entry-Hints aus Legacy-Einstiegen nicht mehr verloren.

2. Regression-Tests fuer Wrapper-Paritaet ergaenzt
- Datei: `apps/web/tests/contributions-new.redirect.test.ts`
- Neuer Test fixiert, dass `entry_intent`/`entry_mode` ueber `/contributions/new` nach `/create` durchgereicht werden.

3. Invalid Entry-Hints degradieren stabil auf kanonischen Intake
- Datei: `apps/web/tests/create-mode.page.test.ts`
- Neuer Test fixiert: ungueltige `entry_intent`/`entry_mode` kippen nicht in Legacy-Defaults, sondern bleiben im kanonischen `/create`-Standard (`createMode=source`, Finalize-Fallback `/swipes`).

## Guardrails

- `/create` bleibt gemeinsamer Intake-Orchestrator.
- Keine implizite Rueckkehr zu `intent=claim&mode=manual`.
- Handoff-/Fallback-Verhalten bleibt defensiv und nachvollziehbar.
- Keine neue Surface- oder Routing-Welt.

## Ergebnis

`PR-AI-CREATE-01` ist als Parent belastbar abgeschlossen:
- 01A-01D + dieser Restabschluss decken den verbleibenden entscheidungsfreien Contract-Scope.
- Offene Folgethemen liegen ausserhalb des Parent-Slices (z. B. allgemeiner UX-/Workflow-Polish ohne Contract-Luecke).
