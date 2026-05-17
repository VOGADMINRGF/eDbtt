# PUBLICATION-RISK-LADDER-01

Datum: 2026-05-17

## Ziel

Eine echte Visibility-/Risk-Ladder sollte produktisch andockbar werden, ohne:

- Social Publishing
- Posting auf externe Kanaele
- automatische amtliche Antworten
- automatische Dossier-Finalisierung
- automatische Anlassraum-Finalisierung
- Payment
- GeoReferenceLayer
- Live-Crawler
- neue AI-Kostenlogik
- politische Richtungsauswertung

## Eingefuehrte Sichtbarkeitsstufen

- `private_draft`
- `internal_review`
- `public_unverified`
- `public_reviewed`
- `public_official`
- `archived`
- `blocked`

## Umgesetzter Runtime-Schnitt

Die Ladder ist in diesem Slice im regionalen Beteiligungssignalpfad eingefuehrt:

- neues typed Contract-Modul `features/region/publicationRiskLadder.ts`
- `RegionParticipationSignal`, `RegionParticipationAggregate` und `RegionParticipationReviewItem` tragen jetzt `visibilityState`
- persistierte Participation-Signal-Records tragen `visibilityState` ebenfalls
- Dashboard-/Cockpit-Pfade unterscheiden jetzt zwischen:
  - oeffentlich sichtbaren Signalen (`public_unverified`, `public_reviewed`, spaeter `public_official`)
  - internen Review-Pfaden (`private_draft`, `internal_review`)
  - Abschluss-/Sperrzustaenden (`archived`, `blocked`)

## Geltende Regeln in diesem Slice

- Low-risk Fragen und Hinweise koennen als `public_unverified` sichtbar werden.
- Anonymisierte Swipe-/Interesse-Signale koennen ebenfalls kontrolliert `public_unverified` erscheinen.
- Riskantere oeffentliche Claims/Beitraege bleiben bis zur Review `internal_review`.
- Privacy-restricted Quellenhinweise bleiben `internal_review`, bis oeffentlich sichere Kurzfassung vorliegt.
- Dossier-/Anlassraum-Vorschlaege bleiben trotz Acceptance weiter intern und werden nicht automatisch oeffentlich.
- `public_official` wird in diesem Slice bewusst noch nicht automatisch vergeben.

## Sichtbare Produktwirkung

- `/admin/region` zeigt neben Reviewstatus jetzt auch den Sichtbarkeitsstatus.
- Das regionale Cockpit listet bei `participationSignals` nur noch oeffentlich sichtbare Signale.
- Interne oder blockierte Signale bleiben in Review-Items bzw. Open-Review-Listen und tauchen nicht still als sichtbar auf.

## Geaenderte Dateien

- `features/region/publicationRiskLadder.ts`
- `features/region/regionParticipationSignals.ts`
- `features/region/server/participationSignalReviewRuntime.ts`
- `features/region/store.ts`
- `features/region/index.ts`
- `apps/web/src/app/api/admin/region/participation-signals/route.ts`
- `apps/web/src/app/admin/region/page.tsx`
- `apps/web/tests/region-participation-signals.contract.test.ts`
- `apps/web/tests/participation-signal-review-runtime.test.ts`
- `apps/web/tests/admin-participation-signal-review.route.test.ts`
- `apps/web/tests/regional-dashboard-readmodel.test.ts`
- `apps/web/tests/admin-region-cockpit.route.test.ts`
- `apps/web/tests/admin-region-page.render.test.tsx`
- `apps/web/tests/admin-region-entitlement-ui.test.tsx`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`

## Validierung

Ausgefuehrt:

- `pnpm -C apps/web exec vitest run tests/region-participation-signals.contract.test.ts tests/participation-signal-review-runtime.test.ts tests/admin-participation-signal-review.route.test.ts tests/regional-dashboard-readmodel.test.ts tests/admin-region-cockpit.route.test.ts tests/admin-region-page.render.test.tsx tests/admin-region-entitlement-ui.test.tsx`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`

## Ergebnis

Die Visibility-/Risk-Ladder ist jetzt nicht mehr nur Docs-Narrativ, sondern typed Runtime-Contract im regionalen Beteiligungssignalpfad. Sichtbarkeit und Reviewstatus sind getrennt. Oeffentliche Niedrigrisiko-Signale koennen kontrolliert sichtbar sein, waehrend riskantere Inhalte, Faktenstatus und amtliche Pfade reviewpflichtig bleiben.
