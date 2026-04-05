# UX-HARM-01 - Swipes Arrival Contract Closure (2026-04-05)

## Scope

Kleiner Abschluss-Slice fuer den verbleibenden Arrival-Contract von `UX-HARM-01`:

- kein neuer `/swipes`-Produktscope
- keine neue Ranking-/Bewertungslogik
- kein App-/Wrapper-/Store-Scope
- nur Arrival-Hardening fuer `fromDraft` inkl. Error-Pfad

## Restmatrix (Ist -> Abschluss)

| Surface / Helper / Route | `fromDraft`-Trefferfall | no-match-Fallback | Fokus-/Arrival-Modus | Drift |
| --- | --- | --- | --- | --- |
| `apps/web/src/app/swipes/page.tsx` | Query wird normalisiert (`fromDraft`) | n/a | Parameter wird stabil uebergeben | nein |
| `apps/web/src/app/swipes/SwipesClient.tsx` | Arrival-Hinweis + Fokus-Umschalter vorhanden | no-match-Hinweis vorhanden | Fokusmodus nachvollziehbar | nein |
| `apps/web/src/features/surfaces/swipes/arrival.ts` | Arrival-Texte/Toggle-Resolver vorhanden | no-match-Texte vorhanden | shared helper | nein |
| `apps/web/src/features/swipes/service.ts` | Treffer werden korrekt auf `sourceDraftId` gefiltert | no-match bei leerem Treffer bereits vorhanden | Service-Pfad robust | **ja (Error-Fallback)** |

Einzige reale Restdrift: Im DB-Error-Pfad fiel `fromDraft` zuvor auf Seed-Deck zurueck und konnte wie Fake-Zuordnung wirken.

## Umsetzung

- `apps/web/src/features/swipes/service.ts`
  - Error-Catch in `getSwipeFeed(...)` gehaertet:
    - bei aktivem `fromDraftId`: explizit `{ items: [], nextCursor: null }`
    - bei non-arrival Requests: Seed-Fallback unveraendert
  - Damit bleibt der Arrival-Contract auch bei Feed-Unverfuegbarkeit semantisch konsistent.

## Tests

- Erweitert: `apps/web/tests/swipes-feed.arrival.test.ts`
  - neuer Test: `fromDraft` + Proposal-Collection unavailable -> `items=[]`
  - neuer Test: non-arrival + Proposal-Collection unavailable -> Seed-Fallback bleibt aktiv
- Bereits bestehende Arrival-Tests weiterhin gruen:
  - `apps/web/tests/swipes-arrival.helpers.test.ts`
  - `apps/web/tests/swipes-page.params.test.ts`

## Ergebnis

`UX-HARM-01` ist als Arrival-Contract abgeschlossen.
Weitere `swipes`-UX-Iteration bleibt optionaler Folgepolish ausserhalb dieses Contracts.
