# WORKTREE-ISOLATE-TRUTH-GUARD-00G

Date: 2026-06-07
Task: `WORKTREE-ISOLATE-TRUTH-GUARD-00G`
Repo: `edebatte-org`

## Ziel

Den Worktree-Cluster fuer:

- `AI-ORCHESTRATOR-TRUTH-GUARD-11`
- `AI-TRUTH-GUARD-FOLLOWUP-11B`
- `TRUTH-GUARD-SURFACE-PROPAGATION-12`

lesend isolieren und pruefen, ohne neue Produktlogik zu bauen und ohne Commit.

## Gepruefte Kandidaten

Source/API/UI:

- `apps/web/src/app/api/contributions/analyze/route.ts`
- `apps/web/src/features/create/analyzeContract.ts`
- `apps/web/src/features/create/analyzeEnvelope.ts`
- `apps/web/src/components/ai/VerificationStatusPanel.tsx`
- `apps/web/src/components/analyze/AnalyzeWorkspace.tsx`
- `apps/web/src/components/ai/RouteBoundCompanionPanel.tsx`
- `apps/web/src/components/share/SocialOutputPreviewPanel.tsx`
- `apps/web/src/app/api/chat/route.ts`
- `features/ai/e150/verificationContract.ts`
- `features/ai/e150/verificationPresentation.ts`
- `features/ai/e150/disagreementConfidence.ts`
- `features/ai/e150/routeBoundCompanion.ts`
- `features/ai/orchestratorE150.ts`
- `features/analyze/analyzeContribution.ts`
- `features/share/socialOutputContract.ts`

Tests:

- `apps/web/tests/e150-truth-guard.contract.test.ts`
- `apps/web/tests/e150-disagreement-confidence.contract.test.ts`
- `apps/web/tests/create-analyze-envelope.verification.test.ts`
- `apps/web/tests/create-analyze.route.test.ts`
- `apps/web/tests/create-analyze.safety-gate.test.ts`
- `apps/web/tests/e150-verification-presentation.contract.test.ts`
- `apps/web/tests/truth-guard-surface-propagation.contract.test.tsx`
- `apps/web/tests/route-bound-companion.contract.test.ts`
- `apps/web/tests/social-output-contract.test.ts`
- `apps/web/tests/chat-route.contract.test.ts`
- `apps/web/tests/create-analyze.workspace-ui.test.ts`
- `apps/web/tests/source-grounding-contract.test.ts`
- `apps/web/tests/analyze-contribution.null-hardening.test.ts`

Docs:

- `docs/E150/AI-ORCHESTRATOR-TRUTH-GUARD-11_2026-06-06.md`
- `docs/E150/AI-TRUTH-GUARD-FOLLOWUP-11B_2026-06-06.md`
- `docs/E150/TRUTH-GUARD-SURFACE-PROPAGATION-12_2026-06-06.md`

## Eindeutig dem Truth-Guard-Cluster zuordenbar

Diese Dateien tragen klar die Truth-Guard-/Surface-Propagation-Logik:

- `features/ai/e150/verificationContract.ts`
  Truth-Guard-Contract, lane-aware Guardrails, `truthStatus` / `sourceSupport` / `reviewRecommended`
- `features/ai/e150/verificationPresentation.ts`
  konservative UI-Labels, Hints, `getTruthStatusLabel` / `getSourceSupportLabel` / `getVerificationDisplayLabel` / `getTruthGuardHint`
- `features/ai/e150/disagreementConfidence.ts`
  unabhaengige Provider-Gegenprobe, `insufficientIndependentSuccess`
- `features/ai/orchestratorE150.ts`
  `independentProviderPool` fuer die Confidence-Bewertung
- `features/analyze/analyzeContribution.ts`
  Truth-Guard-Meta an `AnalyzeResultWithMeta`
- `apps/web/src/features/create/analyzeContract.ts`
  Truth-Guard-Felder im Envelope-Contract
- `apps/web/src/features/create/analyzeEnvelope.ts`
  Truth-Guard-Felder im Envelope-Parser
- `apps/web/src/components/ai/VerificationStatusPanel.tsx`
  sichtbare Darstellung von Truth-/Quellen-/Review-Status
- `apps/web/src/components/ai/RouteBoundCompanionPanel.tsx`
  konservative Companion-Propagation
- `features/ai/e150/routeBoundCompanion.ts`
  Companion-Truth-Status
- `apps/web/src/components/share/SocialOutputPreviewPanel.tsx`
  Share-Surface zeigt Truth-/Quellenlage
- `features/share/socialOutputContract.ts`
  Share-Contract propagiert Truth-Guard-Meta
- `apps/web/src/app/api/chat/route.ts`
  Chat/Companion gibt Truth-Guard-Felder explizit zurueck
- `apps/web/src/components/analyze/AnalyzeWorkspace.tsx`
  Analyse-Workspace zeigt Review-/Quellen-Hinweise und CTAs
- `apps/web/tests/e150-truth-guard.contract.test.ts`
- `apps/web/tests/e150-disagreement-confidence.contract.test.ts`
- `apps/web/tests/create-analyze-envelope.verification.test.ts`
- `apps/web/tests/e150-verification-presentation.contract.test.ts`
- `apps/web/tests/truth-guard-surface-propagation.contract.test.tsx`
- `apps/web/tests/route-bound-companion.contract.test.ts`
- `apps/web/tests/social-output-contract.test.ts`
- `apps/web/tests/chat-route.contract.test.ts`
- `apps/web/tests/create-analyze.workspace-ui.test.ts`
- `docs/E150/AI-ORCHESTRATOR-TRUTH-GUARD-11_2026-06-06.md`
- `docs/E150/AI-TRUTH-GUARD-FOLLOWUP-11B_2026-06-06.md`
- `docs/E150/TRUTH-GUARD-SURFACE-PROPAGATION-12_2026-06-06.md`

## Ausgeschlossen oder gemischt

Nicht in einen isolierten Truth-Guard-Commit uebernehmen:

- `apps/web/src/app/api/contributions/analyze/route.ts`
  Gemischt. Neben zentralen Truth-Guard-Hunks enthaelt die Datei neue Entitlement-/Pricing-/Confirmation-Gates ueber:
  - `@/lib/server/entitlements/createEntitlements`
  - `@features/factcheck/entitlementGate`
  Diese Hunks gehoeren sachlich zu `FACTCHECK-ENTITLEMENT-GATE-14`, nicht nur zu 11/11B/12.
- `apps/web/tests/create-analyze.route.test.ts`
  Gemischt. Neben Truth-Guard-Asserts enthaelt die Datei neue Entitlement-Gate-Tests fuer `deep_research` / `source_check`.
- `apps/web/tests/create-analyze.safety-gate.test.ts`
  inhaltlich nah am Truth-Guard, aber testet denselben gemischten Analyze-Response-Kontext wie die Route
- `apps/web/tests/source-grounding-contract.test.ts`
  nicht modifiziert; nur als Regression gelaufen
- `apps/web/tests/analyze-contribution.null-hardening.test.ts`
  nicht modifiziert; nur als Regression gelaufen
- `docs/E150/OpenTasks.md`
  bewusst nicht angefasst
- `apps/web/src/app/globals.css`
  nicht erforderlich fuer den Truth-Guard-Cluster
- alle Factcheck-/Graph-/ReviewQueue-/StartDraft-/Runden-Dateien

## Commitbarkeit

Status: **nicht sauber commitbar**

Begruendung:

1. `apps/web/src/app/api/contributions/analyze/route.ts` ist der zentrale Serverpfad fuer Truth-Guard-Propagation, aber die offenen Hunks sind mit Task-14-Logik vermischt.
2. `apps/web/tests/create-analyze.route.test.ts` ist entsprechend ebenfalls gemischt.
3. Ohne diese Route waere der Cluster funktional unvollstaendig; mit dieser Route wuerde ein isolierter Truth-Guard-Commit unerlaubt Entitlement-Gate-Arbeit mitziehen.

Damit ist der Cluster aktuell **nicht** hunk- oder dateisauber commitbar, solange `analyze/route.ts` nicht weiter entmischt wird.

## Waere bei weiterer Entmischung voraussichtlich staged-tauglich

Wenn `apps/web/src/app/api/contributions/analyze/route.ts` und `apps/web/tests/create-analyze.route.test.ts` in Truth-Guard- vs. Entitlement-Gate-Hunks getrennt werden koennen, waere folgender Truth-Guard-Scope plausibel:

- `apps/web/src/app/api/chat/route.ts`
- `apps/web/src/components/ai/RouteBoundCompanionPanel.tsx`
- `apps/web/src/components/ai/VerificationStatusPanel.tsx`
- `apps/web/src/components/analyze/AnalyzeWorkspace.tsx`
- `apps/web/src/components/share/SocialOutputPreviewPanel.tsx`
- `apps/web/src/features/create/analyzeContract.ts`
- `apps/web/src/features/create/analyzeEnvelope.ts`
- `features/ai/e150/disagreementConfidence.ts`
- `features/ai/e150/routeBoundCompanion.ts`
- `features/ai/e150/verificationContract.ts`
- `features/ai/e150/verificationPresentation.ts`
- `features/ai/orchestratorE150.ts`
- `features/analyze/analyzeContribution.ts`
- `features/share/socialOutputContract.ts`
- `apps/web/tests/e150-truth-guard.contract.test.ts`
- `apps/web/tests/e150-disagreement-confidence.contract.test.ts`
- `apps/web/tests/create-analyze-envelope.verification.test.ts`
- `apps/web/tests/e150-verification-presentation.contract.test.ts`
- `apps/web/tests/truth-guard-surface-propagation.contract.test.tsx`
- `apps/web/tests/route-bound-companion.contract.test.ts`
- `apps/web/tests/social-output-contract.test.ts`
- `apps/web/tests/chat-route.contract.test.ts`
- `apps/web/tests/create-analyze.workspace-ui.test.ts`
- die drei Truth-Guard-Evidence-Dateien

Commit-Vorschlag nach erfolgreicher Entmischung:

- `fix(ai): enforce truth guard across analyze surfaces`

## Tests

Ausgefuehrt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/e150-truth-guard.contract.test.ts tests/e150-disagreement-confidence.contract.test.ts tests/create-analyze-envelope.verification.test.ts tests/create-analyze.route.test.ts tests/create-analyze.safety-gate.test.ts tests/e150-verification-presentation.contract.test.ts tests/truth-guard-surface-propagation.contract.test.tsx tests/route-bound-companion.contract.test.ts tests/social-output-contract.test.ts tests/chat-route.contract.test.ts tests/create-analyze.workspace-ui.test.ts tests/source-grounding-contract.test.ts tests/analyze-contribution.null-hardening.test.ts`

Ergebnis:

- `typecheck`: gruen
- `lint`: gruen
- `vitest`: `13/13` Testdateien gruen, `89/89` Tests gruen

Hinweis:

- `tests/create-analyze.route.test.ts` loggt erwartete Fehlerpfade (`ANALYZE_TIMEOUT`, `ANALYZE_PROVIDER_FAILED`) auf `stderr`, laeuft aber erfolgreich durch.

## Verbleibender Drift

Der Truth-Guard-Kandidat sitzt weiterhin in einem breiten dirty Worktree. Offene Drift-Cluster ausserhalb dieses Slices bleiben:

- Start/Create/Draft
- Editorial Review / ReviewQueue
- Factcheck / Entitlement
- Graph / Merge
- Account
- weitere Docs / Evidence

## Naechster empfohlener Schritt

Nicht committen. Zuerst einen kleinen Folge-Recovery-Slice fahren:

- `apps/web/src/app/api/contributions/analyze/route.ts` in Truth-Guard-Hunks vs. Entitlement-Gate-Hunks entmischen
- `apps/web/tests/create-analyze.route.test.ts` entsprechend trennen

Erst danach laesst sich entscheiden, ob der Truth-Guard-Cluster separat commitbar ist oder ob Task 14 bewusst mitgezogen werden muss.

## Hinweis zu END-TO-END-CLOSED-PROCESS-QA-19

`END-TO-END-CLOSED-PROCESS-QA-19` darf weiterhin nicht gestartet werden. Erst muessen die verbleibenden Cluster sauber isoliert oder bereinigt werden.
