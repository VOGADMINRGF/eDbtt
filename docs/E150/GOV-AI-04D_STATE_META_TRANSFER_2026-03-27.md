# GOV-AI-04D State-/Meta-Transfer Analyze -> Match -> CTA (2026-03-27)

## Ziel

State-/Meta-Transfer entlang des strict-staged Hauptflusses regressionssicher machen, ohne neue CTA- oder Routinglogik.

## Umgesetzter Ist-Stand

- Shared Analyze-Envelope-Parser eingefuehrt: `apps/web/src/features/create/analyzeEnvelope.ts`
  - `createAnalyze` wird ueber den strikten Boundary-Parser gelesen
  - `providerMatrix` wird nur uebernommen, wenn `meta.runId` exakt zu `createAnalyze.runId` passt
  - `degraded`/`fallback` Flags werden deterministisch auf Envelope-Ebene normalisiert
- `AnalyzeWorkspace` nutzt den shared Envelope-Parser fuer `createAnalyze` + `providerMatrix` + degraded-Status.
- CTA-Handoff traegt relevante Source-Meta weiter (`sourceRunId`, `sourceConfidence`, `sourceMatchSourceState`, `sourcePhases`).
- Prepare-Attach-Review nutzt bevorzugt `handoff.sourceRunId`, damit der Transfer von Analyze ueber CTA stabil bleibt.

## Test-Evidenz

- `apps/web/tests/create-analyze.envelope.test.ts`
  - providerMatrix nur bei runId-Paritaet
  - runId-mismatch blockiert Matrix-Uebernahme
  - degraded/fallback Normalisierung bleibt stabil
- `apps/web/tests/create-cta-handoff.test.ts`
  - CTA-Handoff uebernimmt Source-Meta aus Analyze-Kontext
- `apps/web/tests/create-analyze.workspace-ui.test.ts`
  - Review-State nutzt `handoff.sourceRunId` deterministisch

## Nicht Teil dieses Slices

- keine neue CTA-Priorisierung
- kein neues Ranking
- keine Routing-Aenderung
