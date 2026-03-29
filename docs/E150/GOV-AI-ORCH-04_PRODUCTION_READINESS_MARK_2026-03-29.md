# GOV-AI-ORCH-04 Production Readiness Mark (2026-03-29)

Ziel:
- den bereits entschiedenen strict-staged Hauptkanon technisch und dokumentarisch
  als produktionsnahen Betriebsstand markieren,
- ohne neue Leitentscheidung, ohne Re-Architektur.

## 1) Kanonischer staged Hauptpfad (verbindlicher Betriebsstand)

Mainflow bleibt:
1. Intake
2. Analyze/Quality
3. Graph Match
4. CTA Handoff

Transparente Anschlussstufen (conditional follow-up, kein eigener Hauptpfad):
- Factcheck/Review-Anschluss
- Dossier/Finding/offene-Fragen-Anschluss

Machine-readable Contract:
- `apps/web/src/features/ai/orchestrationProductionContract.ts`
  - `ORCHESTRATION_MAINFLOW_STEP_CONTRACTS`

## 2) Boundary-/Envelope-/Meta-Pflichten (produktiver Mindestvertrag)

Boundary-Mindestfelder:
- `schemaVersion`
- `orchestrator`
- `runId`
- `inputRef`
- `createdAt`
- `phases`
- `matchSourceState`
- `noAutoPublish`
- `noSilentMerge`
- `provenanceRefs`

Envelope-Sync-Regeln:
- `meta.runId` muss `createAnalyze.runId` entsprechen
- `providerMatrix` wird nur bei runId-Paritaet uebernommen
- degraded bleibt in Envelope und CreateAnalyze sichtbar

Referenzen:
- `apps/web/src/features/create/analyzeBoundaryContract.ts`
- `apps/web/src/features/create/analyzeEnvelope.ts`
- `apps/web/src/features/ai/orchestrationProductionContract.ts`

## 3) Provider-/Fallback-Betriebsstand (ohne neue Policy)

Baseline:
- staged Hauptpfad: orchestrated reasoning generalist
- fallback: degraded contract response
- Provider-Allowlist wird ueber `E150_PROVIDER_ALLOWLIST` gesteuert

Direkte Providerpfade bleiben expliziter Ausnahmevertrag und sind nicht
gleichwertiger Hauptfluss:
- `/api/contributions/analyze/save`
- `/api/contributions/refine`
- `/api/quality/clarify`
- `/api/_diag/gpt`
- `/api/admin/ai/orchestrator-smoke`
- `/api/news/survey-topics`
- `/api/quality/polish`

Referenzen:
- `apps/web/src/features/ai/orchestrationRouteContract.ts`
- `apps/web/src/features/ai/orchestrationProductionContract.ts`
- `docs/E150/GOV-AI-04C_DIRECT_PROVIDER_EXCEPTION_CONTRACT_2026-03-27.md`

## 4) Test-Evidenz (Drift-Schutz)

- `apps/web/tests/orchestration-route-contract.test.ts`
- `apps/web/tests/orchestration-production-contract.test.ts`
- `apps/web/tests/create-analyze.boundary-contract.test.ts`
- `apps/web/tests/create-analyze.envelope.test.ts`

Abgedeckt:
- staged vs exception Trennung
- Mainflow-Step-Contract
- Boundary-Pflichtfelder
- Envelope-runId-Paritaet
- Stage-key-Sync zwischen Boundary und Production Contract

## 5) Bewusst offen als Betriebs-/Governance-Notiz

Keine neue Leitentscheidung in diesem Slice:
- DPA/Residency-Feinregeln je Provider und Datenzone
- Cost envelope fuer Lastspitzen/Fallback-Kaskaden
- Reliability-Fault-Isolation jenseits des aktuellen Baselineschutzes

Diese Punkte bleiben als Betriebs-/Governance-Notizen in:
- `docs/E150/GOV-AI-ORCH-03_PROVIDER_STRATEGY_BASELINE_2026-03-27.md`

## 6) Smoke-/Sanity-Pass (2026-03-29)

Gezielter Realitaetscheck ueber den markierten Produktionsstand (ohne neue Architektur):
- staged vs. exception-Praedikate sind fuer alle Routen im Contract strikt disjunkt
- envelope-sync-Regeln bleiben explizit gepinnt (`meta.runId` Paritaet)
- staged Hauptpfad (`/api/contributions/analyze` + Wrapper `/api/create/analyze`) bleibt von direct-exception-Route-Set getrennt

Testanker:
- `apps/web/tests/orchestration-production-contract.test.ts`
