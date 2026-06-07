# AI-ORCHESTRATOR-TRUTH-GUARD-11

Stand: 2026-06-06

## Befund: Was war bereits sicher?

- `verificationMode`, `researchUsed`, `sealEligible` und `sealGranted` waren bereits im E150-Lane-Contract vorhanden.
- `sealed_factcheck` war schon als eigener Lane vom Standard-Analyze-Pfad getrennt.
- Orchestrator-Meta transportierte bereits `fallbackUsed`, `disagreement` und `confidence`.
- `sourceGroundingContract` trennte bereits Dokument-/Web-/Inference-Signale und markierte `noSourceBluffing`.

## Befund: Wo konnte eine einzelne KI noch zu stark wirken?

- `deriveVerificationLabel()` kannte bisher keine Quellenlage, kein Fallback und keinen Disagreement-Kontext.
- `/api/contributions/analyze` gab Standard-/Precheck-Antworten dadurch zu nah an `geprueft` aus, obwohl Quellenprüfung, Fallback oder Provider-Lücken offen sein konnten.
- `finalizeResultPayload()` rief im normalen Analyze-Pfad weiterhin `syncAnalyzeResultToGraph()` auf und riskierte damit produktive Truth-/Graph-Schreibpfade aus Draft-Analyse.
- Der Envelope-Parser konnte alte `precheck`-Defaults höher gewichten als explizite Truth-/Source-Felder.

## Neue Truth-/Source-/Review-Guardrails

- Neuer Truth-Guard-Contract in `features/ai/e150/verificationContract.ts`:
  - `truthStatus`
  - `sourceSupport`
  - `sourceStatus`
  - `reviewRecommended`
  - `noTruthPromotion=true`
  - `noAutoGraphPromotion=true`
- `verificationLabel` wird im Analyze-Pfad jetzt truth-aware abgeleitet:
  - `verifiziert` nur bei `sealed` + `sealGranted=true`
  - `geprueft` nur bei Quellenbezug `sourced`, ohne Fallback, ohne Disagreement und ohne `noSourceBluffing`-Fail
  - sonst defensiv `analysiert`
- `analyzeContribution()` trägt die neuen Guardrails bereits konservativ in `_meta`.
- `/api/contributions/analyze` überschreibt die finale Außenwirkung mit der vollständigen Truth-/Source-Prüfung und spiegelt die Felder in Root, `meta` und `createAnalyze`.

## Graph-Sync-Entscheidung

- Produktiver Graph-Sync wurde für den normalen Analyze-/Draft-Pfad deaktiviert.
- `finalizeResultPayload()` setzt stattdessen nur noch Guard-Meta:
  - `noAutoGraphPromotion=true`
  - `graphSync.mode=disabled`
  - `graphSync.reason=draft_analysis_no_productive_truth_promotion`
- Damit kann Standardanalyse weder stillen Graph-Truth noch automatische Promotion auslösen.

## Provider-Gegenprobe

- `computeDisagreementConfidence()` stuft jetzt konservativer ab:
  - weniger als 2 erfolgreiche unabhängige Provider => `confidence` maximal `low`
  - `fallbackUsed` oder fehlende Specialists => `confidence` maximal `medium`
  - neue Reason `single_provider_or_low_independence`
- Im Orchestrator ist zusätzlich explizit kommentiert, dass der `best`-Kandidat nur ein Draft-Analyse-Kandidat ist und keine Wahrheit setzt.

## Quellenpflicht für Faktencheck

- `sourceInventory.total === 0` führt jetzt im Truth-Guard zu:
  - `sourceSupport=open`
  - `sourceStatus="Keine Quellenprüfung gestartet"`
  - kein `geprueft`/`verifiziert`
- `noSourceBluffing.passed === false` erzwingt `reviewRecommended=true`.
- `inferredClaims > 0` erzwingt ebenfalls `reviewRecommended=true`.
- Explizite Truth-Felder im Envelope gewinnen jetzt gegenüber alten `precheck`-Defaults.

## Tests und Ergebnis

- Neue Tests:
  - `apps/web/tests/e150-truth-guard.contract.test.ts`
  - `apps/web/tests/e150-disagreement-confidence.contract.test.ts`
- Erweiterte Tests:
  - `apps/web/tests/create-analyze-envelope.verification.test.ts`
  - `apps/web/tests/create-analyze.route.test.ts`
- Revalidiert mit:
  - `pnpm -C apps/web run typecheck`
  - `pnpm -C apps/web run lint`
  - `pnpm -C apps/web exec vitest run tests/e150-truth-guard.contract.test.ts tests/e150-disagreement-confidence.contract.test.ts tests/create-analyze-envelope.verification.test.ts tests/create-analyze.route.test.ts tests/source-grounding-contract.test.ts tests/analyze-contribution.null-hardening.test.ts`

## Offene Punkte

- `deriveVerificationLabel()` bleibt absichtlich als Basishilfe für bestehende sealed-/status-nahe Flows bestehen; die truth-aware Ableitung greift im Analyze-/Create-Pfad zusätzlich.
- Andere Factcheck-/Companion-/Share-Surfaces können dieselben Truth-Guard-Felder später noch breiter konsumieren, ohne dass dafür dieser Slice ihre bestehende Lane-Semantik brechen musste.
