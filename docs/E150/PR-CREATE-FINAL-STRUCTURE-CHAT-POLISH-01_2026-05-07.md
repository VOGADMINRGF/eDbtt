# PR-CREATE-FINAL-STRUCTURE-CHAT-POLISH-01 (2026-05-07)

## Ziel
Issue #85 umsetzen: `/create`-Follow-up als finalen, geführten Structure-Chat ausrichten (weniger Analyse-Panel, mehr nachvollziehbarer Arbeitsfluss).

## Problem
Der Follow-up-Block war funktional, wirkte aber noch zu technisch/kachelartig:
- Themenfelder wurden in der Erstsicht hart gekürzt.
- Anschlusskarten wirkten vor Bestätigung zu dominant.
- Bei breiten kommunalen Texten fehlte eine klar priorisierte Meta-Abstimmungsfrage.
- Assistant-Copy war zu abstrakt statt menschlich geführt.

## Umsetzung
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
  - Themenfelder nicht mehr auf 5/6 begrenzt, komplette Liste sichtbar.
  - Neuer geführter Block `Vorgeschlagener Arbeitsstand` mit:
    - Dossier-Kontext
    - Themenfelder
    - Blickrichtungen
    - Mögliche Abstimmungsfragen
  - Meta-Abstimmungsfrage für kommunalen Dossierkontext priorisiert.
  - Anschlussvorschläge vor Bestätigung als optionales, eingeklapptes `details` statt dominanter Kartenwand.
  - Menschlichere Assistant-Antwort für breite kommunale Zielkonflikt-Texte.
  - Primär-CTA bleibt `Ja, Struktur übernehmen`.
- `apps/web/src/features/create/createConnectionSuggestions.ts`
  - Vote-Suggestion-Titel für kommunalen Dossierkontext auf Meta-Frage priorisiert.
- `apps/web/src/features/create/intelligentFollowup.ts`
  - Themen-Merge-Limit erweitert, damit breite Themenfelder vollständig durchreichen.

## Tests
- Aktualisiert:
  - `apps/web/tests/create-intelligent-followup.contract.test.ts`
  - `apps/web/tests/analyze-workbench-hidden-until-start.test.ts`
- Zusätzlich ausgeführt:
  - `apps/web/tests/create-intelligent-followup.route.test.ts`
  - `apps/web/tests/swipes-discovery.contract.test.ts`
  - `apps/web/tests/swipes-action-hierarchy.contract.test.ts`

## Validierung
- `pnpm -C apps/web run typecheck` ✅
- `pnpm -C apps/web run lint` ✅
- `pnpm -C apps/web exec vitest run tests/create-intelligent-followup.contract.test.ts tests/create-intelligent-followup.route.test.ts tests/analyze-workbench-hidden-until-start.test.ts tests/swipes-discovery.contract.test.ts tests/swipes-action-hierarchy.contract.test.ts` ✅

## Offene Folgepunkte
- Optional: Abschnittsbezogene Claim-zu-Frage-Abbildung pro Themenfeld weiter verfeinern.
- Optional: spätere echte Graph-Matches gegen produktive Dossier-/Anlassraum-Knoten statt Heuristik.
