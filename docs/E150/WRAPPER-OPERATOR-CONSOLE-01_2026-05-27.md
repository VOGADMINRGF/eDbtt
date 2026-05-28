# WRAPPER-OPERATOR-CONSOLE-01

Stand: 2026-05-28
Status: done

## Ziel

`/admin` als ruhige Operator-Konsole ueber bestehende Admin-Flaechen legen, ohne neues Backend, ohne zweite Admin-Welt und ohne neue Produktparallelwelt.

## Scope

- `apps/web/src/app/admin/page.tsx`
- `apps/web/src/features/admin/operatorConsoleReadModel.ts`
- bestehende Readmodels aus Review Queue, Themenradar, Feed Runtime, Source Automation, Material Jobs, Dossier Updates, Social Queue, Entitlements und Pricing Orders

## Umsetzung

- `/admin` wurde von einer clientseitigen KPI-Statistikseite auf eine serverseitige Operator-Landingpage umgestellt.
- Die neue Konsole liest nur bestehende Wahrheiten oder bestehende Readmodels:
  - `buildReviewQueueReadModel`
  - `buildAutonomousThemenradarReadModel`
  - `buildFeedRadarRuntimeReadModel`
  - `buildMaterialExtractionJobReadModel`
  - `loadSocialDistributionQueueReadModel`
  - `PaidDashboardEntitlement`-Adminliste
  - `PricingOrder`-Adminliste
  - Dossier-Suggestion-Collection fuer globale Dossier-Update-Zusammenfassung
- Die Oberflaeche zeigt nur verdichtete Statuslagen:
  - offene Operator-Aufgaben
  - fehlerhafte Quellen
  - wartende Material-Jobs
  - Dossier-Hinweise in Pruefung
  - offene Social-Review-Entwuerfe
- Arbeitsbereiche bleiben verlinkte Zusammenfassungen und keine Rohdatenwaende:
  - Review Queue
  - Themenradar
  - Feed Health
  - Source Automation
  - Material Jobs
  - Dossier Updates
  - Social Queue
  - Payment & Entitlements

## Guardrails

- keine neue API
- keine neue Persistenz
- keine neuen Mutationen ausser bestehender Routenverlinkung
- keine Fake-Buttons
- keine Auto-Publish-, Live-Posting- oder OAuth-Behauptung
- keine geheimen Provider- oder Kostenpfade

## Route-Set

Die Konsole verlinkt nur auf bestehende Routen:

- `/admin/review`
- `/admin/themenradar`
- `/admin/feeds`
- `/admin/feeds#source-automation`
- `/admin/feeds#material-extraction-jobs`
- `/atlas/social-review`
- `/admin/entitlements`
- `/admin/pricing/orders`
- `/account/organization/dashboard`
- `/admin/graph/repairs`

## Tests

- `tests/operator-console-readmodel.contract.test.ts`
- `tests/operator-console-page.contract.test.tsx`
- `tests/operator-console-no-fake-actions.contract.test.ts`

## Ergebnis

Der Betreiber-Einstieg ist jetzt task-first und review-first lesbar, ohne die darunterliegenden Admin-, Review-, Feed-, Dossier-, Social- oder Pricing-Pfade neu zu erfinden. `/admin` bleibt Wrapper ueber bestehender Produktrealitaet, nicht deren Ersatz.
