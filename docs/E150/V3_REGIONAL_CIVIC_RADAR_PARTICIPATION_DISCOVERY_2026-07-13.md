# V3 Regional Civic Radar Participation Discovery 2026-07-13

## Scope

- Task: `V3-REGIONAL-CIVIC-RADAR-AND-PARTICIPATION-DISCOVERY-01`
- Batch branch: `pr/v3-agentic-safe-trace-intake-regional-research-01`
- Primary role: `research_source`
- Supporting: `personal_voxy`, `governance_compliance`

## Ziel

Die bestehende regionale `region/intelligence`-Vorbereitung in einen kleinen typed Discovery-Contract ueberfuehren, der Themen-/Participation-Hinweise mit Quelle, Organisator, Jurisdiktion, ehrlicher Deadline-Luecke und Relevanzgruenden sicht- und testbar macht.

## Umgesetzte Artefakte

- Neu: `apps/web/src/features/agenticRuntime/regionalCivicRadarParticipationDiscoveryContract.ts`

Der Contract:

- nutzt vorhandene `RegionIntelligencePreparationResult`-Signale;
- mappt sie in review-first Discovery-Items fuer Personal-Voxy-/Radar-nahe Folgepfade;
- respektiert Modi wie `passive` vs. `topic_watch`;
- markiert fehlende Deadline-Wahrheit explizit als `missing_runtime_truth`;
- erzeugt keine Notification-, Crawl-, Procurement- oder neue Datenbasis-Logik.

## Testabdeckung

- `apps/web/tests/regional-civic-radar-participation-discovery.contract.test.ts`

Geprueft wird:

- Discovery-Items tragen Quelle, Organisator und Jurisdiktion;
- Relevanzgruende werden aus vorhandenen Signalen abgeleitet;
- proaktive Hinweise haengen am Modus, nicht an stiller Automatik;
- Auto-Notification bleibt aus;
- die Safe-Trace-Stufe bleibt review-first.

## Guardrails

- keine Fake-Quellen
- keine Notification-Automatik
- keine Parallel-Datenbasis
- keine neue Runtime
- kein Auto-Publish

## Validierung

- geteilter Batch-Lauf mit:
  - `tests/regional-civic-radar-participation-discovery.contract.test.ts`
  - `tests/agent-run-artifact-safe-trace.contract.test.ts`
  - `tests/agent-registry-bootstrap.contract.test.ts`
- Batch-Ergebnis:
  - `6` Dateien, `10/10` Tests gruen
  - `lint` gruen
  - `build` gruen
  - `typecheck` nur bekannte `.next/types/**/*.ts`-Drift (`TS6053`)
