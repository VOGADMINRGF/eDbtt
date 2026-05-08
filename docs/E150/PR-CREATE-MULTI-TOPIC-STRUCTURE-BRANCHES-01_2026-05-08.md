# PR-CREATE-MULTI-TOPIC-STRUCTURE-BRANCHES-01

## Ziel
Breite `/create` Eingaben mit mehreren Themenfeldern als Strukturäste unter einem Dossier-/Oberkontext darstellen.

## Scope
- Slice B aus Issue #98.
- Keine neue Graph-Backend-Architektur.
- Keine endgültige Kategorien-Taxonomie.
- Keine automatische Veröffentlichung, Stimme oder Kostenbuchung.

## Produktentscheidung
- Ein Dossier-/Oberkontext bleibt oberhalb der Struktur.
- Themenfelder werden darunter als 2-3 primäre Äste geführt.
- Claims und mögliche Abstimmungsfragen sind Nachkommen der Äste.
- Weitere Themen werden kompakt als `+ weitere Themen` geführt.

## Umsetzung
- `buildCreateStructureBranches` in `apps/web/src/features/create/intelligentFollowupContract.ts` leitet Äste aus vorhandenen Follow-up-Daten ab.
- `CreateVisualFollowup` rendert `StructureBranchList` und `StructureBranchCard` innerhalb der eDebatte-Antwort.
- Jeder Ast zeigt:
  - Titel
  - Themenfelder
  - Bedarfspunkt
  - mögliche Claims
  - mögliche Abstimmungsfragen
  - offene Prüfpunkte
  - reviewbare Änderungsoptionen

## QA-Fall
Breite kommunale Texte erzeugen u. a.:
- `Wohnen und Genehmigungen`
- `Verkehr, Klima und Alltagstauglichkeit`
- `Bildung, Integration und Sicherheit`

## Guardrails
- Kein `Dossier ansehen` pro Thema.
- Swipes bleiben an konkrete Claims/Abstimmungsfragen gebunden.
- Keine automatische Stimme.
- Keine automatische Veröffentlichung.
- Keine automatische Kostenbuchung.

## Geänderte Dateien
- `apps/web/src/features/create/intelligentFollowupContract.ts`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/tests/create-intelligent-followup.contract.test.ts`
- `apps/web/tests/create-curated-dialog-workspace.contract.test.tsx`
- `docs/E150/OpenTasks.md`

## Validierung
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/create-intelligent-followup.contract.test.ts tests/analyze-workbench-hidden-until-start.test.ts tests/create-curated-dialog-workspace.contract.test.tsx`
