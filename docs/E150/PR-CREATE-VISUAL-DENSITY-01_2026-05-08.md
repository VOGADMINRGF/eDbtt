# PR-CREATE-VISUAL-DENSITY-01

## Ziel
`/create` auf Desktop ruhiger, breiter und lesbarer machen, ohne den vorhandenen Chat-/Arbeitsraum oder die Follow-up-Logik neu zu bauen.

## Problem
Nach den vorigen `/create`-Slices war der Funktionsstand da, aber die visuelle Dichte blieb zu hoch:
- Workspace wirkte auf großem Desktop zu schmal.
- Strukturäste standen als enge Mini-Dashboards nebeneinander.
- Zu viele Mikroelemente konkurrierten im Erstblick.
- `Nächster Schritt` war vorhanden, aber nicht stark genug als natürlicher Abschluss.
- Sekundäre Details zogen zu früh zu viel Aufmerksamkeit.

## Scope
- nur Layout-, Hierarchie- und Disclosure-Polish
- keine neue Analyze-/Graph-/AI-Logik
- keine neue Link-/Save-/Factcheck-Backendlogik
- keine Änderung an Guardrails oder Auto-Aktionen

## Umsetzung
- `CreateClient` und `SharedCreateComposer` nutzen im eingebetteten `/create`-Workspace einen breiteren, aber begrenzten `max-w-6xl`-Rahmen.
- `CreateVisualFollowup` rendert den Chat-Workspace ebenfalls breiter und hält Details darunter kompakter.
- Strukturäste wechseln auf eine ruhige Desktop-2-Spalten-Hierarchie statt enger 3er-Karten.
- Im Erstblick zeigt jeder Ast jetzt primär:
  - Titel
  - Part06-Chips
  - Bedarfspunkt
  - 1-2 wichtige Abstimmungsfragen
- Themenkatalog, Themenfelder, Claims, offene Prüfpunkte und Overflow-Themen sind sekundär in `Weitere Details zum Ast`.
- Änderungsoptionen pro Ast sind hinter `Ast bearbeiten` gebündelt statt dauerhaft als Mikro-Button-Leiste sichtbar.
- `Nächster Schritt` hebt `Ja, Struktur übernehmen` als volle Primäraktion hervor; Save und Faktencheck bleiben ruhiger, aber sichtbar.

## Geänderte Dateien
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/SharedCreateComposer.tsx`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/tests/create-curated-dialog-workspace.contract.test.tsx`
- `docs/E150/OpenTasks.md`

## Tests
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-intelligent-followup.contract.test.ts tests/analyze-workbench-hidden-until-start.test.ts tests/create-curated-dialog-workspace.contract.test.tsx`

## Ergebnis
- Desktop-Workspace wirkt breiter und weniger gequetscht.
- Strukturäste lesen sich als Arbeitsstand statt Dashboard-Raster.
- First-view bleibt fokussiert auf Dossier-Kontext, Äste und nächsten Schritt.
- Guardrails, Link-Intake, Save und optionaler Faktencheck bleiben unverändert sichtbar.
