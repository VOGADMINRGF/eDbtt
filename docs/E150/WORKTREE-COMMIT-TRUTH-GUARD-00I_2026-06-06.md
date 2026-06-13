# WORKTREE-COMMIT-TRUTH-GUARD-00I

Date: 2026-06-07
Task: `WORKTREE-COMMIT-TRUTH-GUARD-00I`
Repo: `edebatte-org`

## Commit

- Commit SHA: `21b7a51f`
- Commit message: `fix(ai): enforce truth guard across analyze surfaces`

## Staged / committed files

- `apps/web/src/app/api/chat/route.ts`
- `apps/web/src/app/api/contributions/analyze/route.ts`
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
- `docs/E150/WORKTREE-ISOLATE-TRUTH-GUARD-00G_2026-06-06.md`
- `docs/E150/WORKTREE-UNTANGLE-ANALYZE-ROUTE-00H_2026-06-06.md`

## Ausgeschlossene Dateien

Bewusst nicht im Commit:

- `apps/web/src/app/api/contributions/analyze/researchEntitlementGate.ts`
- `apps/web/tests/create-analyze-entitlement-gate.route.test.ts`
- `apps/web/tests/factcheck-entitlement-gate.contract.test.ts`
- `docs/E150/OpenTasks.md`
- `apps/web/src/app/globals.css`
- alle Runden-Dateien
- alle Factcheck-DB-/Runner-/Status-/Enqueue-Dateien
- alle GraphMergeCandidate-Dateien
- alle EditorialReviewQueue-Dateien
- alle Account-Factcheck-/Graph-/Review-Sektionen
- alle StartDraft-/GlobalDraftStatusBar-/WorkspaceChooser-Dateien
- alle übrigen Start/Create/Draft-Dateien außerhalb des expliziten Truth-Guard-Scopes

## Behandlung von `route.ts`

`apps/web/src/app/api/contributions/analyze/route.ts` wurde hunkgenau behandelt.

In den Commit aufgenommen wurden nur die Truth-Guard-Hunks:

- Truth-Meta-Helper
- `truthStatus` / `sourceSupport` / `sourceStatus`
- `reviewRecommended`
- `noTruthPromotion`
- `noAutoGraphPromotion`
- `graphSync.mode = disabled`
- zentrale `verificationLabel`-Konsistenz
- `sourceGroundingAudit`
- konservative Fallback-/Disagreement-/Review-Handhabung
- keine automatische Graph-Sync

Nicht aufgenommen wurden:

- `researchEntitlementGate`-Import
- früher `resolveAnalyzeResearchGateBlock(...)`-Guard
- jede Entitlement-/Pricing-/Confirmation-Logik

## Tests

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/e150-truth-guard.contract.test.ts tests/e150-disagreement-confidence.contract.test.ts tests/create-analyze-envelope.verification.test.ts tests/create-analyze.route.test.ts tests/create-analyze.safety-gate.test.ts tests/e150-verification-presentation.contract.test.ts tests/truth-guard-surface-propagation.contract.test.tsx tests/route-bound-companion.contract.test.ts tests/social-output-contract.test.ts tests/chat-route.contract.test.ts tests/create-analyze.workspace-ui.test.ts tests/source-grounding-contract.test.ts tests/analyze-contribution.null-hardening.test.ts`

Ergebnis:

- `typecheck`: grün
- `lint`: grün
- `vitest`: `13/13` Testdateien grün, `87/87` Tests grün

Hinweis:

- `create-analyze.route.test.ts` loggt erwartete Fehlerpfade (`ANALYZE_TIMEOUT`, `ANALYZE_PROVIDER_FAILED`) auf `stderr`, läuft aber erfolgreich durch.

## Verbleibender Worktree-Drift

Nach dem Commit bleibt der Worktree breit dirty, u. a. in:

- Start/Create/Draft
- Factcheck / Entitlement
- ReviewQueue / Editorial Review
- Graph / Merge
- Account
- weitere Docs / Evidence

Außerdem bleibt `apps/web/src/app/api/contributions/analyze/route.ts` im Worktree weiter modifiziert, weil der Entitlement-Gate-Hunk bewusst nicht mit committed wurde.

## Nächster empfohlener Cluster

Als nächstes sollte der Factcheck-/Entitlement-Gate-Cluster isoliert werden, weil:

- `researchEntitlementGate.ts`
- `create-analyze-entitlement-gate.route.test.ts`
- `factcheck-entitlement-gate.contract.test.ts`

jetzt bereits klar von Truth-Guard getrennt sind.

## Hinweis

`END-TO-END-CLOSED-PROCESS-QA-19` darf weiterhin nicht gestartet werden. Erst müssen die restlichen Cluster sauber isoliert oder bereinigt werden.
