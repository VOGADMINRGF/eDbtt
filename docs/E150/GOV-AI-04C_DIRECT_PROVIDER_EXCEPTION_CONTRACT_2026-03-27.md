# GOV-AI-04C Direkte Providerpfade als Ausnahme-Contract (2026-03-27)

## Ziel

Direkte Providerpfade klar als Ausnahme-/Legacy-Nebenpfade markieren und vom strict-staged Hauptfluss abgrenzen.

## Technischer Contract

Shared Route-Contract liegt in `apps/web/src/features/ai/orchestrationRouteContract.ts`.

### Strict-staged Hauptfluss

- `/api/contributions/analyze` -> `strict_staged_mainflow`
- `/api/create/analyze` -> `strict_staged_wrapper`

### Legacy-/Ausnahmepfade (direkter Providerzugriff)

- `/api/contributions/analyze/save`
- `/api/contributions/refine`
- `/api/quality/clarify`
- `/api/_diag/gpt`
- `/api/admin/ai/orchestrator-smoke`
- `/api/news/survey-topics`
- `/api/quality/polish`

Alle obigen Pfade sind als `legacy_direct_provider_exception` markiert und damit nicht Teil des kanonischen Hauptflusses.

## Test-Evidenz

- `apps/web/tests/orchestration-route-contract.test.ts`
  - staged vs. legacy Trennung
  - deterministische Contract-Resolution
  - keine Duplikate / disjunkte Klassifikation

## Nicht Teil dieses Slices

- keine neue Provider-Matrix
- keine Routing-Aenderung
- keine Runtime-Umschaltung von Pfaden
