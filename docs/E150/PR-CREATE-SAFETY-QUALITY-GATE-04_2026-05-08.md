# PR-CREATE-SAFETY-QUALITY-GATE-04

Datum: 2026-05-08

## Scope

Claim-Level Safety-/Input-Qualitaets-Hardening fuer `/create` aus Issue #106.

Nicht Teil dieses Slices:

- kein Redesign von `/create`
- keine neuen Admin-Queues
- keine externen Moderations- oder Factcheck-Provider
- keine automatische Graph-Merge- oder Publish-Logik
- keine automatische Abstimmung

## Claim-Safety-Contract

Neue Datei:

- `apps/web/src/features/create/safety/createClaimSafety.ts`

Der Contract klassifiziert einzelne Aussagen parallel zu den bestehenden Claim-Payloads. Es werden keine bestehenden Claim-Objekte mutiert.

Gespeicherte Felder:

- `claimId`
- `text`
- `safeText`
- `kind`
- `truthStatus`
- `publicationStatus`
- `safetyDecision`
- `findingKinds`
- `factCheckCandidateIds`
- `graphReviewRequired`
- `noAutoPublish`
- `noSilentMerge`

`text` und `safeText` werden redigiert/sanitized gespeichert, damit keine raw PII in persistierter Claim-Safety landet.

## Claim Kinds

Abgedeckte `kind`-Werte:

- `observation`
- `opinion`
- `question`
- `policy_request`
- `factual_claim`
- `allegation`
- `not_checkable`
- `unsafe`

Leitregeln:

- Fragen mit Prüf- oder Quellenbezug bleiben `question`
- Perspektiven/Wertungen bleiben `opinion` oder `not_checkable`
- Forderungen bleiben `policy_request`
- unbelegte schwere Vorwürfe werden `allegation`
- unverified number claims bleiben `factual_claim`
- Moderation-/Block-Fälle werden `unsafe`

## Truth Statuses

Abgedeckte `truthStatus`-Werte:

- `not_checked`
- `open`
- `supported`
- `contested`
- `refuted`
- `not_checkable`

In diesem Slice werden Claims deterministisch auf folgende operative Werte gemappt:

- `open` für Fragen, Factcheck-Fälle und Graph-Review-Fälle
- `not_checked` für publishable Beobachtungen/Forderungen/Factual Claims ohne harte Findings
- `not_checkable` für Meinungen und nicht prüfbare Wertungen

Die restlichen Werte bleiben Teil des Contracts für nachgelagerte Review-/Factcheck-Flows, werden hier aber nicht automatisch vergeben.

## Publication Statuses

Abgedeckte `publicationStatus`-Werte:

- `publishable`
- `publishable_as_question`
- `publishable_as_opinion`
- `needs_rewrite`
- `factcheck_required`
- `graph_review_required`
- `moderation_required`
- `blocked`

Regeln:

- sichere Beobachtung oder Policy-Forderung ohne harte Findings => `publishable`
- sichere Prüf-Frage => `publishable_as_question`
- Meinung / politisches Framing ohne harte Tatsachenbehauptung => `publishable_as_opinion`
- Low-Readability-only => `needs_rewrite`
- unbelegte schwere Behauptung oder unverified number => `factcheck_required`
- cross-lingual Claim-Risiko => `graph_review_required`
- Drittpersonen-PII plus Vorwurf => `moderation_required`
- konkrete Drohung / Doxxing-CTA => `blocked`

## Analyze / Save / Finalize

### Analyze

Claim-Safety wird parallel angebunden unter:

- `createAnalyze.claimSafety`
- `meta.claimSafety`

Bestehende Claim-Strukturen bleiben unverändert.

### Save

Persistenz unter:

- `analysis.safety.claimSafety`

Persistenz-Regeln:

- keine raw PII in `claimSafety.text`
- keine raw PII in `claimSafety.safeText`
- nur Claim-Safety für bereits vorhandene Analysis-Claims

### Finalize

`selectedClaimIds` dürfen nur dann zu `statement_proposals` werden, wenn `publicationStatus` einer dieser Werte ist:

- `publishable`
- `publishable_as_question`
- `publishable_as_opinion`
- `needs_rewrite`

Blockierende Finalize-Status:

- `factcheck_required`
- `graph_review_required`
- `moderation_required`
- `blocked`

Finalize-Regeln:

- `factcheck_required` wird mit `422 factcheck_required` gestoppt
- `graph_review_required` wird mit `422 graph_review_required` gestoppt
- `moderation_required` und `blocked` werden mit `422 create_input_blocked` gestoppt
- `needs_rewrite` darf nur mit `safeText` als Proposal-Text weiterlaufen
- publishable-as-question / publishable-as-opinion werden über `safeText` finalisiert, ohne die Aussage still zur Fakt-Behauptung hochzustufen

## No Auto Publish / Silent Merge

Der Slice hält unverändert:

- `noAutoPublish=true`
- `noSilentMerge=true`

Das gilt im Claim-Contract selbst sowie in den Analyze-/Save-/Finalize-Pfaden.

## UI Scope

Nur das bestehende `CreateInputSafetyPanel` wurde erweitert:

- Anzahl Claim-Safety-Warnungen
- Hinweis auf ausgewählte Aussagen, die nur als Frage/Meinung weiterführbar sind
- Hinweis auf `needs_rewrite` für ausgewählte Claims

Keine allgemeine `/create`-UX wurde umgebaut.

## Test Matrix

Neue Tests:

- `apps/web/tests/create-claim-safety.contract.test.ts`
- `apps/web/tests/create-finalize.claim-safety-gate.test.ts`

Erweiterte Tests:

- `apps/web/tests/create-analyze.safety-gate.test.ts`
- `apps/web/tests/create-save.safety-gate.test.ts`

Abgedeckte Fälle:

1. simple observation => `publishable`
2. opinion only => `publishable_as_opinion`
3. safe question about allegation => `publishable_as_question`
4. unsupported factual allegation => `factcheck_required`
5. unverified number claim => `factcheck_required`
6. political framing only => nicht blockiert
7. low readability only => `needs_rewrite`, nicht blockiert
8. concrete danger signal => `blocked`
9. third-party PII plus accusation => `moderation_required`
10. cross-lingual claim => `graph_review_required`
11. finalize blocks factcheck-required claim
12. finalize allows safe question version
13. finalize blocks moderation-required claim
14. finalize uses `safeText` for `needs_rewrite`
15. save persists claimSafety without raw PII leakage

## Validation

Validiert mit dem exakten Issue-Command-Set:

```bash
pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
pnpm -C apps/web exec vitest run \
  tests/create-claim-safety.contract.test.ts \
  tests/create-finalize.claim-safety-gate.test.ts \
  tests/create-input-safety.contract.test.ts \
  tests/create-input-safety-lexicon.contract.test.ts \
  tests/create-input-safety-telemetry.contract.test.ts \
  tests/create-safety-review-contract.test.ts \
  tests/create-safety-corpus.de.contract.test.ts \
  tests/create-safety-corpus.en.contract.test.ts \
  tests/create-safety-corpus.multilingual.contract.test.ts \
  tests/create-analyze.safety-gate.test.ts \
  tests/create-save.safety-gate.test.ts \
  tests/create-finalize.safety-gate.test.ts
```
