# PR-0044A - Swipes Varianten-Contract-Prep (2026-04-04)

## Scope

Kleiner, entscheidungsfreier Contract-Slice fuer `/swipes`:
- Variantenauswahl-Payload vor Persistenz normalisieren
- widerspruechliche Variantenfelder verhindern
- keine neue Ranking-/Weighting-/Prioritaetslogik einfuehren

Nicht Teil dieses Slices:
- keine fachliche Freigabe fuer Weighting-/Ranking-Wirkung in Aggregaten
- keine neue `/swipes`-Surface- oder UX-Logik

## Umgesetzt

1. Typed Varianten-Contract eingefuehrt
- Datei: `apps/web/src/features/swipes/variantSelectionContract.ts`
- `normalizeSwipeVariantSelection(...)` haertet die Rohdaten:
  - normalisiert `eventualityId`
  - normalisiert `variantWeight` (1/3/5; default 3 bei gueltiger Eventuality)
  - trimmt/begrenzt `variantReason`
  - dedupliziert `variantRankedIds` und `excludedEventualityIds`
  - entfernt Widerspruch `selected eventuality` vs `excluded`
  - entfernt ausgeschlossene IDs aus `variantRankedIds`
- `normalizeSwipeVotePayload(...)` bindet das als Vote-Payload-Normalisierung.

2. Vote-Persistenz auf Contract gebunden
- Datei: `apps/web/src/features/swipes/service.ts`
- `recordSwipeVote(...)` nutzt den neuen Normalizer vor DB-Write und Graph-Write.
- Ergebnis: Persistenz folgt konsistent einem kleinen Varianten-Contract statt unvalidierten Raw-Feldern.

3. Gezielte Contract-Tests
- Datei: `apps/web/tests/swipes-variant-selection-contract.test.ts`
- Abgedeckt:
  - Variantenfelder ohne `eventualityId` werden verworfen
  - dedupe + Exclude-vs-Ranked-Konsistenz
  - Weight-Fallback auf 3 bei invalider Eingabe
  - String-Gewicht aus Request (`"5"`) wird akzeptiert
  - Reason wird getrimmt und laengenbegrenzt

## Guardrails (explizit eingehalten)

- Keine neue Toplist-/Ranking-Mechanik.
- Keine Wahrheits-/Prioritaets-/Reichweitenaufwertung.
- Keine Produktentscheidung zu semantischer Wirkung von `variantWeight` vorweggenommen.
- Slice bleibt rein kontraktnah (Input-Hardening + Persistenzkonsistenz).

## Offener Entscheidungsrest im Parent `PR-0044`

Weiterhin offen und `needs_decision`:
- Ob `variantWeight`/`variantRankedIds` spaeter nur lokale Dokumentation bleiben
  oder in uebergreifenden Aggregaten/Sortierungen wirksam werden duerfen.

Diese Policy-Frage wurde bewusst nicht still entschieden.
