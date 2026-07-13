# V3 Intake Format Agent E2E 2026-07-13

## Scope

- Task: `V3-INTAKE-FORMAT-AGENT-E2E-01`
- Batch branch: `pr/v3-agentic-safe-trace-intake-regional-research-01`
- Primary role: `intake_format`
- Supporting: `personal_voxy`, `governance_compliance`

## Ziel

Den bestehenden `/create`-Follow-up-Pfad in einen kleinen typed Intake-/Format-Contract ueberfuehren, der Beobachtung, Einordnung, Pruefhypothese und belastbare Evidenz sauber trennt und nur review-first Formatvorschlaege erzeugt.

## Umgesetzte Artefakte

- Neu: `apps/web/src/features/agenticRuntime/intakeFormatAgentE2EContract.ts`

Der Contract:

- uebernimmt die bestehende `CreateIntelligentFollowupResult`-Wahrheit;
- leitet daraus ab:
  - Occasion-Candidate
  - Topic-Assignment
  - Geographic Scope
  - Affected-Group-Candidates
  - Format Recommendation
  - Open Questions
- trennt explizit:
  - `visible_observation`
  - `user_interpretation`
  - `possible_hypothesis`
  - `source_backed_fact`
- haengt eine user-safe Trace-Stufe an, statt eine neue Runtime oder Persistenz zu bauen.

## Testabdeckung

- `apps/web/tests/intake-format-agent-e2e.contract.test.ts`

Geprueft wird:

- Beobachtung bleibt als Nutzereingabe sichtbar;
- Einordnung und Pruefhypothese werden getrennt gehalten;
- belastbare Evidenz wird nicht erfunden;
- Formatvorschlaege bleiben bestaetigungspflichtig;
- Affected-Group-Candidates werden konservativ und review-first abgeleitet.

## Guardrails

- keine Fake-Fixtures
- keine neue Store-Architektur
- keine externe Runtime
- kein Auto-Debattenstart
- kein Auto-Publish

## Validierung

- geteilter Batch-Lauf mit:
  - `tests/intake-format-agent-e2e.contract.test.ts`
  - `tests/agent-run-artifact-safe-trace.contract.test.ts`
  - `tests/agent-registry-bootstrap.contract.test.ts`
- Batch-Ergebnis:
  - `6` Dateien, `10/10` Tests gruen
  - `lint` gruen
  - `build` gruen
  - `typecheck` nur bekannte `.next/types/**/*.ts`-Drift (`TS6053`)
