# GOV-ANLASS-03 - Scope/Relevance Closure (2026-04-05)

## Scope

Kleiner Abschluss-Slice fuer Regionen/Skalen + Relevanz-Framing:
- keine neue Produktlogik
- keine neue Priorisierungs-/Ranking-Logik
- keine neue Governance-Machtlogik
- nur Scope-/DecisionScope-Display-Paritaet + Regressionshärtung

## Restmatrix (Ist-Check)

| Surface / Route / Readmodel | Scope | DecisionScope | Relevanz-Anzeige | Drift | Klein schliessbar |
| --- | --- | --- | --- | --- | --- |
| `apps/web/src/features/anlassraumOperationsRead.ts` (`normalizeAnlassraumOperationsDoc`) | normalisiert | bisher bei invalid/missing separat `null` | via Operations-UI | ja (Display-Drift bei invalid decisionScope) | ja |
| `apps/web/src/features/anlassraumOperationsUi.tsx` | aus Readmodel | aus Readmodel | `formatRelevanceScopeLabel(scope) / ...` | gering | ja |
| `apps/web/src/app/admin/feeds/anlassraum/page.tsx` | aus API | aus API | `formatRelevanceScopeLabel(scope) / ...` | ja (pair-Aufbereitung nicht shared) | ja |
| `apps/web/src/app/admin/feeds/anlassraum/[id]/page.tsx` | aus API | aus API | `formatRelevanceScopeLabel(scope) / ...` | ja (pair-Aufbereitung nicht shared) | ja |

## Umgesetzte Mini-Härtung

1. Shared Scope-Pair-Resolver eingefuehrt:
- `apps/web/src/features/relevanceFraming.ts`
- `resolveRelevanceScopePairForDisplay(scope, decisionScope)`:
  - alias-/canonical-normalisiert (`kommunal` -> `local`, etc.)
  - setzt `decisionScope` defensiv auf `scope`, wenn DecisionScope fehlt/ungueltig
- `formatRelevanceScopePairLabel(...)` fuer einheitliche Anzeige als Scope-Paar.

2. Readmodel-Paritaet nachgezogen:
- `apps/web/src/features/anlassraumOperationsRead.ts`
- `normalizeAnlassraumOperationsDoc` nutzt den shared Scope-Pair-Resolver.

3. Surface-Anzeigen auf shared Pair-Format umgestellt:
- `apps/web/src/features/anlassraumOperationsUi.tsx`
- `apps/web/src/app/admin/feeds/anlassraum/page.tsx`
- `apps/web/src/app/admin/feeds/anlassraum/[id]/page.tsx`

## Tests

- `pnpm -C apps/web exec vitest run tests/relevance-framing.test.ts tests/anlassraum-operations-read.service.test.ts tests/anlassraum-operations.page.test.tsx tests/admin-anlassraum-detail.locale.test.tsx tests/operator-surfaces.locale-render.test.tsx`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`

## Ergebnis

`GOV-ANLASS-03` ist im aktuellen Scope belastbar abgeschlossen:
- Scope-/DecisionScope-Relevanzframing ist in den relevanten Anlassraum-Operations-/Admin-Feeds-Surfaces konsistent.
- Keine neue Prioritäts-/Wahrheitslogik eingeführt.
- Nur kontrakt-/display-nahe Härtung, regressionssicher eingefroren.
