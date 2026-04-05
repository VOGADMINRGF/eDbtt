# PR-0043 - Swipes Mobile Gestures + Bottom-Actions (2026-04-04)

## Scope

Kleiner UX-/Mobile-Reife-Slice fuer `/swipes`:
- mobile Bottom-Actions ruhiger und thumb-reachable machen
- Gesten robust gegen Fehleingaben haerten
- keine IA-/Routing-/Fachlogik-Aenderung

Nicht Teil dieses Slices:
- keine Ranking-/Weighting-/Exclude-Logik (`PR-0044`)
- kein `/swipes`-Großumbau

## Umgesetzt

1. Mobile Bottom-Actions nachgehärtet
- Datei: `apps/web/src/app/swipes/SwipesClient.tsx`
- Bottom-Bar auf klare Struktur umgestellt:
  - kompakte Sekundäraktionen (`Mehr Kontext`, optional `Rückgängig`)
  - darunter Primärentscheidungen (`Nein`, `Offen`, `Ja`) mit größeren Touch-Flächen
- Touch-Targets und Abstände erhöht (`min-h` + mehr Safe-Area/Padding), weiterhin mobile-only und ohne neue Actions.

2. Gestenvertrag als kleinen Shared Contract eingeführt
- Datei: `apps/web/src/features/surfaces/swipes/gestureContract.ts`
- `resolveSwipeGestureDecision(...)` entscheidet deterministisch, ob eine horizontale Geste als Vote zählt.
- Schutz gegen Fehltrigger:
  - minimale Distanz/Flick-Schwelle
  - klare horizontale Dominanz
  - vertikale Driftgrenze

3. Swipe-Karte auf Shared Gesture-Contract umgestellt
- Datei: `apps/web/src/features/surfaces/swipes/components/SwipeTopicStep.tsx`
- Pointer-Finish nutzt jetzt den shared Resolver statt inline-Schwellenlogik.

4. Gezielte Regressionstests
- Datei: `apps/web/tests/swipes-gesture-contract.test.ts`
- Abdeckung fuer:
  - tiny drags -> kein Vote
  - vertikale Dominanz -> kein Vote
  - klare horizontale Gesten -> agree/disagree
  - schneller, sauberer Flick -> Vote

## Guardrails (explizit eingehalten)

- Keine Änderungen an Ranking/Weighting/Exclude.
- Keine neue Priorisierungs-/Wahrheitslogik.
- Keine neue Routing-/Create-/Atlas-/Social-Logik.
- Fokus rein auf mobile Bedienbarkeit und robuste Interaktion.

## Ergebnis

`PR-0043` ist als UX-Slice belastbar abgeschlossen:
- mobile Bedienung in `/swipes` ist klarer und besser erreichbar
- Gesten sind kontrollierter und testseitig eingefroren
- Fachlogik bleibt unverändert
