# PR-0044B - Swipes transparente Variantenaggregation (2026-04-05)

## Entscheidungsrahmen aus `PR-0044`

Festgelegt:
- `variantWeight` und `variantRankedIds` duerfen in transparenten, reviewbaren Variantenaggregaten auf Statement-/Eventuality-Ebene beruecksichtigt werden.
- Diese Aggregation ist lokal und erklaerbar.

Nicht daraus abgeleitet:
- keine Wahrheitslogik
- keine Prioritaets-/Reichweitenlogik
- keine automatische Feed-/Atlas-/Publish-/Governance-Wirkung

## Technischer Slice

1. Readmodel fuer lokale Variantenaggregation
- Datei: `apps/web/src/features/swipes/variantAggregationReadModel.ts`
- Liefert pro Statement/Eventuality erklaerbare Kennzahlen:
  - `selectedCount`
  - `weightedScore`
  - `averageWeight`
  - `rankedMentions`
  - `averageRank`
- Defensiv gegen invalide Aggregatzeilen.

2. Admin-Summary-Anbindung (read-only)
- Datei: `apps/web/src/app/api/admin/swipes/summary/route.ts`
- Additive Ausgabe `variantAggregation` mit:
  - `windowDays: 30`
  - lokalem Scope-Hinweis
  - Guardrail-Flags (`noTruthBoost`, `noPriorityBoost`, `noFeedOrAtlasSortingImpact`, `noPublishAutomationImpact`)
  - `statements`-Liste aus dem Readmodel

3. Sichtbarkeit auf bestehender Admin-Surface
- Datei: `apps/web/src/app/admin/swipes/page.tsx`
- Neue read-only Section "Variantenaggregation" auf derselben Admin-Seite.
- Klarer Hinweistext, dass keine automatische Priorisierung fuer Feed/Atlas/Publish/Governance entsteht.

## Tests

- Datei: `apps/web/tests/swipes-variant-aggregation-readmodel.test.ts`
- Abdeckung:
  - Merge von Selection- + Ranked-Aggregaten
  - Ranked-only-Fall ohne Fake-Selection
  - defensive Behandlung invalider Daten

## Ergebnis

`PR-0044B` schliesst den entscheidungsfreien Umsetzungsteil mit lokal-transparenter Aggregation.
Die Wirkung bleibt bewusst auf den dokumentierten Admin-/Readmodel-Kontext begrenzt.
