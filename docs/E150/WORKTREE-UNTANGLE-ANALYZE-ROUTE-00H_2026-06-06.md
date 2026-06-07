# WORKTREE-UNTANGLE-ANALYZE-ROUTE-00H

Date: 2026-06-07
Task: `WORKTREE-UNTANGLE-ANALYZE-ROUTE-00H`
Repo: `edebatte-org`

## Ursprünglicher Blocker

`WORKTREE-ISOLATE-TRUTH-GUARD-00G` hatte zwei Mischdateien identifiziert:

- `apps/web/src/app/api/contributions/analyze/route.ts`
- `apps/web/tests/create-analyze.route.test.ts`

Problem:

- `route.ts` mischte Truth-Guard-Hunks aus 11/11B/12 mit Entitlement-/Pricing-/Confirmation-Gates aus 14
- `create-analyze.route.test.ts` mischte die entsprechenden Tests spiegelbildlich

## Hunk-Zuordnung in `route.ts`

### Truth-Guard

Diese Hunk-Gruppe gehört fachlich zu 11/11B/12:

- `buildGraphSyncGuardMeta`
- `AnalyzeTruthRootFields`
- `AnalyzeTruthMetaFields`
- `AnalyzeTruthEnvelope`
- `resolveTruthGuardForAnalyze`
- `attachTruthGuardToResult`
- `attachTruthGuardToCreateAnalyze`
- `buildAnalyzeTruthEnvelope`
- Truth-Guard-Responsefelder in JSON-/Fallback-/Degraded-/Moderation-/SSE-Pfaden:
  - `truthStatus`
  - `sourceSupport`
  - `sourceStatus`
  - `reviewRecommended`
  - `noTruthPromotion`
  - `noAutoGraphPromotion`
  - `graphSync`
- zentrale `verificationLabel`-/Truth-Meta-Konsistenz
- `finalizeResultPayload` mit deaktiviertem `graphSync`
- konservative Fallback-/Disagreement-/Review-Semantik

### Factcheck-/Entitlement-Gate

Diese Hunks gehören fachlich zu 14:

- neue Datei `apps/web/src/app/api/contributions/analyze/researchEntitlementGate.ts`
- `resolveAnalyzeResearchGateBlock(...)` in `route.ts`
- import von `./researchEntitlementGate`

Die eigentliche Gate-Logik wurde aus `route.ts` herausgezogen:

- `getCreateEntitlementsForRequest`
- `resolveFactcheckEntitlementGate`
- `getFactcheckEntitlementGateMessage`
- `allowDeepSearch` / `researchConfirmed`
- `loginRequired` / `entitlementRequired` / `pricingRequired` / `confirmationRequired`

### Unklar

Keine zusätzlichen unklaren Mischhunks mehr in `route.ts`. Die verbleibende Kopplung ist jetzt nur noch:

- ein kleiner import-Hunk
- ein kleiner früher Guard-Call im `POST`

Diese beiden Hunks sind später separat hunkbar.

## Hunk-Zuordnung in `create-analyze.route.test.ts`

### Truth-Guard-Tests

In `apps/web/tests/create-analyze.route.test.ts` verbleiben jetzt nur Truth-Guard-nahe Analyze-Route-Tests:

- Standard-Analyze bleibt `Analyse-Entwurf`
- `truthStatus` / `sourceSupport` / `sourceStatus`
- `noTruthPromotion` / `noAutoGraphPromotion`
- `graphSync.mode = disabled`
- Fallback-/Disagreement-/Review-Semantik
- degradierte Provider-Antworten behalten zentrale Truth-Meta

### Factcheck-/Entitlement-Gate-Tests

In neue Datei getrennt:

- `apps/web/tests/create-analyze-entitlement-gate.route.test.ts`

Dorthin verschoben:

- gated deep-search nur bei bestätigtem/erlaubtem Pfad
- blockierter deep-search ohne Confirmation/Berechtigung

## Vorgenommene Entkopplung

Durchgeführt:

1. Entitlement-Gate-Logik aus `route.ts` in neuen Helper ausgelagert:
   - `apps/web/src/app/api/contributions/analyze/researchEntitlementGate.ts`
2. `route.ts` nutzt jetzt nur noch:
   - `resolveAnalyzeResearchGateBlock(req, body)`
3. Gate-spezifische Analyze-Route-Tests in neue Datei verschoben:
   - `apps/web/tests/create-analyze-entitlement-gate.route.test.ts`
4. `apps/web/tests/create-analyze.route.test.ts` von Gate-Mocks und Gate-Tests bereinigt

Nicht geändert:

- keine neue Produktlogik
- kein neues Response-Schema
- keine Änderungen an `OpenTasks.md`
- nichts gestaged
- nichts committed

## Commitbarkeit danach

### Truth-Guard-Cluster

Status: **ja, jetzt isolierbar und hunkbar**

Ein späterer Truth-Guard-Commit kann jetzt enthalten:

- `apps/web/src/app/api/contributions/analyze/route.ts`
  - nur die Truth-Guard-Hunks, ohne den kleinen Entitlement-Gate-import/call
- `apps/web/src/app/api/chat/route.ts`
- `apps/web/src/components/ai/VerificationStatusPanel.tsx`
- `apps/web/src/components/ai/RouteBoundCompanionPanel.tsx`
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
- `apps/web/tests/create-analyze.route.test.ts`
- `apps/web/tests/create-analyze.safety-gate.test.ts`
- `apps/web/tests/e150-verification-presentation.contract.test.ts`
- `apps/web/tests/truth-guard-surface-propagation.contract.test.tsx`
- `apps/web/tests/route-bound-companion.contract.test.ts`
- `apps/web/tests/social-output-contract.test.ts`
- `apps/web/tests/chat-route.contract.test.ts`
- `apps/web/tests/create-analyze.workspace-ui.test.ts`
- `docs/E150/AI-ORCHESTRATOR-TRUTH-GUARD-11_2026-06-06.md`
- `docs/E150/AI-TRUTH-GUARD-FOLLOWUP-11B_2026-06-06.md`
- `docs/E150/TRUTH-GUARD-SURFACE-PROPAGATION-12_2026-06-06.md`

Commit-Vorschlag:

- `fix(ai): enforce truth guard across analyze surfaces`

### Factcheck-/Entitlement-Gate-Cluster

Status: **ja, jetzt separat isolierbar**

Ein späterer Factcheck-/Entitlement-Gate-Commit kann jetzt enthalten:

- `apps/web/src/app/api/contributions/analyze/researchEntitlementGate.ts`
- `apps/web/src/app/api/contributions/analyze/route.ts`
  - nur den import- und early-return-Gate-Hunk
- `apps/web/tests/create-analyze-entitlement-gate.route.test.ts`
- `apps/web/tests/factcheck-entitlement-gate.contract.test.ts`

## Tests

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/e150-truth-guard.contract.test.ts tests/e150-disagreement-confidence.contract.test.ts tests/create-analyze-envelope.verification.test.ts tests/create-analyze.route.test.ts tests/create-analyze-entitlement-gate.route.test.ts tests/create-analyze.safety-gate.test.ts tests/e150-verification-presentation.contract.test.ts tests/truth-guard-surface-propagation.contract.test.tsx tests/source-grounding-contract.test.ts tests/analyze-contribution.null-hardening.test.ts tests/factcheck-entitlement-gate.contract.test.ts`

Ergebnis:

- `typecheck`: grün
- `lint`: grün
- `vitest`: `11/11` Testdateien grün, `57/57` Tests grün

Hinweis:

- `tests/create-analyze.route.test.ts` loggt erwartete Fehlerpfade (`ANALYZE_TIMEOUT`, `ANALYZE_PROVIDER_FAILED`) auf `stderr`, läuft aber erfolgreich durch.

## Verbleibende Risiken

- `apps/web/src/app/api/contributions/analyze/route.ts` bleibt eine große Datei; die Trennung ist jetzt technisch hunkbar, aber spätere Staging-Schritte müssen exakt den import-/Guard-Hunk von den Truth-Guard-Hunks trennen.
- Der Gesamt-Worktree bleibt breit dirty; diese Entkopplung löst nur den Analyze-Route-Blocker.
- `OpenTasks.md` bleibt absichtlich unangetastet und weiterhin separat dirty.

## Verbleibender Drift

Außerhalb dieses Slices offen:

- Start/Create/Draft
- ReviewQueue / Editorial Review
- Factcheck weitere Pfade
- Graph / Merge
- Account
- diverse weitere Evidence-Dateien

## END-TO-END-CLOSED-PROCESS-QA-19

`END-TO-END-CLOSED-PROCESS-QA-19` darf weiterhin nicht gestartet werden. Erst müssen die verbleibenden Cluster vollständig isoliert oder bereinigt werden.
