# AI-TRUTH-GUARD-FOLLOWUP-11B

Stand: 2026-06-06

## Warum der Follow-up nötig war

`AI-ORCHESTRATOR-TRUTH-GUARD-11` hatte den Truth-/Source-/Graph-Schutz bereits eingeführt, aber drei Restpunkte blieben semantisch driftanfällig:

- `lane` wurde im Truth-Guard-Contract transportiert, aber nicht hart genug durchgesetzt.
- die Provider-Gegenprobe konnte Fallback-Erfolg als scheinbar unabhängigen Zweiterfolg mitzählen.
- die Analyze-Route baute Truth-Guard-Felder in mehreren Ästen leicht dupliziert zusammen.

Der Follow-up blieb bewusst klein:

- keine neue Produktlogik
- keine neue Orchestrierung
- kein Graph-Write
- keine Publish-/Vote-/Dossier-/Anlassraum-Folgen

## Lane Enforcement

Datei: `features/ai/e150/verificationContract.ts`

- neuer `TruthGuardLane`-Begriff eingeführt
- `resolveLaneAwareVerification()` erzwingt jetzt die Lane-Semantik
- `sealed` auf `standard` oder `material_grounding` wird intern konservativ auf `precheck` zurückgeführt
- `sealGranted` wirkt nur noch auf `lane === sealed_factcheck`
- dadurch kann `standard` nie `sealed_verified`/`verifiziert` erzeugen
- `factcheck_passed` entsteht ebenfalls nicht mehr auf der `standard`-Lane

Zusätzlich markiert ein Lane-Mismatch jetzt Review-Bedarf, statt still als valider Sealed-Status weiterzulaufen.

## Independent Provider Success Semantics

Dateien:

- `features/ai/e150/disagreementConfidence.ts`
- `features/ai/orchestratorE150.ts`

Änderungen:

- `computeDisagreementConfidence()` kennt jetzt explizit `independentProviderPool`
- `insufficientIndependentSuccess` wird aus erfolgreichen Nicht-Fallback-Providern dieses Pools abgeleitet
- Fallback-Provider, insbesondere OpenAI als Fallback, verbessern die Gegenprobe nicht mehr
- `disagreement` trägt jetzt `insufficientIndependentSuccess`
- die Reason lautet jetzt explizit `insufficient_independent_success`

Im Orchestrator wird dafür ein unabhängiger Provider-Pool aus `primary + secondary - fallback` übergeben.

Ergebnis:

- `mistral + openai(fallback)` zählt nicht mehr als zwei unabhängige Erfolge
- `mistral + gemini` zählt als zwei unabhängige Specialist-Erfolge
- `only openai fallback` bleibt `low confidence`

## Zentraler Truth-Meta-Helper

Datei: `apps/web/src/app/api/contributions/analyze/route.ts`

Neuer zentraler Helper:

- `buildAnalyzeTruthEnvelope()`

Er vereinheitlicht jetzt für Success-, Moderation-, Heuristic-Fallback-, Degraded- und SSE-Pfade:

- `verificationMode`
- `researchUsed`
- `sealEligible`
- `sealGranted`
- `verificationLabel`
- `truthStatus`
- `sourceSupport`
- `sourceStatus`
- `reviewRecommended`
- `noTruthPromotion`
- `noAutoGraphPromotion`
- `graphSync.mode=disabled`

Zusätzlich:

- Root- und `meta`-Felder werden aus derselben Quelle gebaut
- der frühere Drift zwischen Response-Ästen ist damit reduziert
- der explizite `degraded provider`-Pfad wurde wieder erreichbar gemacht, indem `BAD_JSON` und `ANALYZE_PROVIDER_FAILED` nicht mehr durch den heuristischen Fallback vorweg abgefangen werden

## Geänderte Dateien

- `features/ai/e150/verificationContract.ts`
- `features/ai/e150/disagreementConfidence.ts`
- `features/ai/orchestratorE150.ts`
- `features/analyze/analyzeContribution.ts`
- `apps/web/src/app/api/contributions/analyze/route.ts`
- `apps/web/tests/e150-truth-guard.contract.test.ts`
- `apps/web/tests/e150-disagreement-confidence.contract.test.ts`
- `apps/web/tests/create-analyze.route.test.ts`
- `apps/web/tests/create-analyze.safety-gate.test.ts`
- `docs/E150/OpenTasks.md`

## Tests und Ergebnis

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/e150-truth-guard.contract.test.ts tests/e150-disagreement-confidence.contract.test.ts tests/create-analyze-envelope.verification.test.ts tests/create-analyze.route.test.ts tests/create-analyze.safety-gate.test.ts tests/source-grounding-contract.test.ts tests/analyze-contribution.null-hardening.test.ts`

Ergebnis:

- Typecheck grün
- Lint grün
- alle relevanten Tests grün

## Offene Punkte

- Der Truth-Guard bleibt weiterhin ein Analyze-/Create-zentrierter Contract; weitere Surfaces wie Companion/Share/Factcheck-Detail können die Felder später noch breiter konsumieren.
- `deriveVerificationLabel()` bleibt als Basis-Helfer bestehen; die harte semantische Sicherung läuft bewusst im Truth-Guard darüber.
