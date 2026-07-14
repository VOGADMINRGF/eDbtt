# V3 Daily Civic Impulses Observation Intake 2026-07-13

## Scope

- Task: `V3-DAILY-CIVIC-IMPULSES-OBSERVATION-INTAKE-01`
- Batch branch: `pr/v3-agentic-consent-claims-dossier-participation-01`
- Primary role: `personal_voxy`
- Supporting: `intake_format`, `governance_compliance`

## Ziel

Optionale Daily Civic Impulses als typed Observation-Contract vorbereiten: maximal drei pro Tag, ohne Negativitaetsmaschine und ohne Profilpersistenz ohne Consent.

## Umgesetzte Artefakte

- Neu: `apps/web/src/features/agenticRuntime/dailyCivicImpulsesObservationIntakeContract.ts`

Der Contract haelt explizit:

- maximal drei optionale Impulse
- Text-, Voice- und Screenshot-Input
- observation != interpretation != hypothesis != fact
- reward clarification / connection / evidence / participation / visible impact
- keine complaint-volume-Gamification
- storage nur als `consented_profile_memory` oder `review_only_no_profile_write`

## Guardrails

- keine Profilpersistenz ohne Consent
- keine Meckerbox-Optimierung
- keine Fake-Fakten aus Screenshots
- keine Runtime-Aktivierung

## Validierung

- Batch-validiert mit fokussierten Contract-Tests
- `pnpm -C apps/web exec vitest run tests/daily-civic-impulses-observation-intake.contract.test.ts ...`
- `lint`, `build` und `typecheck` im finalen Batch-Lauf
