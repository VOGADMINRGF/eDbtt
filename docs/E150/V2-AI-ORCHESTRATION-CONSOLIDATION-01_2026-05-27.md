# V2-AI-ORCHESTRATION-CONSOLIDATION-01

## Ziel

AI-Orchestrierung für V2 konsolidieren, damit Themenradar, Feed-Automation und Material-Extraction auf denselben Provider-/Lane-/Research-/Cost-/Review-Guardrails laufen, ohne Auto-Publish, Auto-DeepSearch oder neue Produktparallelwelt.

## Ausgangslage

- `V2-THEMENRADAR-AUTONOMOUS-SUPPLY-01` liefert review-first Themencluster.
- `V2-SOURCE-FEED-AUTOMATION-01` liefert guarded Feed-/Source-Signale.
- `MATERIAL-EXTRACTION-JOBS-V2-01` liefert review-first Extraktionsjobs.
- Offene Restdrift lag vor allem in der gemeinsamen Semantik für Provider-Rollen, Lane-Policies, Smoke-Copy und V2-Flow-Handoffs.

## Umsetzung

### 1. Zentraler V2-Policy-Contract

Neu in `apps/web/src/features/ai/v2OrchestrationPolicy.ts`:

- Execution Actors:
  - `system_graph`
  - `policy_orchestrator`
  - `validator`
  - `openai`
  - `anthropic`
  - `mistral`
  - `gemini`
  - `ari`
  - `perplexity`
  - `openai_deep_research`
- Rollen:
  - `graph_context`
  - `strict_analyze`
  - `draft_analysis`
  - `editorial_perspective`
  - `summarization`
  - `material_extraction`
  - `research_discovery`
  - `fallback`
  - `presentation_pass`
- Lane-Policies:
  - `standard`
  - `material_extraction`
  - `feed_signal`
  - `themenradar_cluster`
  - `sealed_factcheck`
  - `research_addon`
  - `fallback_only`

Jede Lane trägt explizit:

- erlaubte Actor/Provider
- Latenz-/Budget-Hinweis
- `researchAllowed`
- `costApprovalRequired`
- `reviewRequired`
- `sealEligible`
- `publicOutputAllowed`
- `draftOnly`

## 2. Kosten-/Research-Guardrails

Konsolidiert und testseitig eingefroren:

- kein automatischer DeepSearch-Pfad
- `perplexity`, `ari` und `openai_deep_research` bleiben explizit approval-gated
- Feed-Signale, Themenradar und Material-Extraction dürfen ohne Freigabe keine Premium-Recherche starten
- Standard-Analyse bleibt ohne Research-Provider lauffähig

## 3. Smoke-/Admin-Diagnostik

`/admin/telemetry/ai/orchestrator` zeigt jetzt lesbarer:

- normalisierte Lane (`normalizedLane`, `normalizedLaneLabel`, Beschreibung)
- Review-/Research-/Cost-/Seal-/Public-Flags
- Provider-Rollen pro Lane
- Smoke-Status-Copy statt nur roher Statuskeys:
  - `OK`
  - `Übersprungen, nicht nötig`
  - `Übersprungen, nicht in dieser Lane`
  - `Konfiguration fehlt`
  - `Kostenpfad blockiert`
  - `Timeout`
  - `Degradiert`
  - `Fallback genutzt`
  - `Schema fehlgeschlagen`
  - `Fehlgeschlagen`

Bewusst nicht geändert:

- kein neuer Provider-Zwang
- kein neues Admin-Parallelsystem
- kein automatischer Publish-/Seal-/Factcheck-Pfad

## 4. Anschluss an V2-Flows

Die bestehende Runtime bleibt erhalten, trägt aber jetzt denselben AI-Policy-Rahmen:

- `features/themenradar/autonomousSupply.ts`
  - `aiOrchestration` für `themenradar_cluster`
  - Themenradar-Claims/Questions/Options bleiben Vorschläge in Prüfung
- `apps/web/src/features/material/materialExtractionJobs.ts`
  - `aiOrchestration` für `material_extraction`
  - Extraktion bleibt Draft-/Hinweis-/Review-first
- `features/feeds/runtimeReadModel.ts`
  - `aiOrchestration`-Zusammenfassung für `feed_signal`, `themenradar_cluster` und `material_extraction`

## Qualität / Guardrails

- keine automatische Veröffentlichung
- keine automatische Amtlichkeit
- kein automatisches Factcheck-Siegel
- kein Research-/Kostenpfad ohne bewusste Freigabe
- V2-Flows bleiben derived/readmodel- bzw. review-first

## Geänderte Dateien

- `docs/E150/OpenTasks.md`
- `docs/E150/V2-AI-ORCHESTRATION-CONSOLIDATION-01_2026-05-27.md`
- `apps/web/src/features/ai/v2OrchestrationPolicy.ts`
- `apps/web/src/features/ai/providerRoleRouting.ts`
- `apps/web/src/app/admin/telemetry/ai/orchestrator/page.tsx`
- `features/themenradar/autonomousSupply.ts`
- `features/feeds/runtimeReadModel.ts`
- `apps/web/src/features/material/materialExtractionJobs.ts`
- `apps/web/tests/ai-provider-role-routing.contract.test.ts`
- `apps/web/tests/ai-lane-policy.contract.test.ts`
- `apps/web/tests/ai-cost-research-guardrail.contract.test.ts`
- `apps/web/tests/ai-smoke-status-copy.contract.test.ts`
- `apps/web/tests/ai-v2-flow-integration.contract.test.ts`
- `apps/web/tests/ai-no-autoresearch-autopublish.contract.test.ts`
- `apps/web/tests/admin-ai-telemetry-ui.contract.test.ts`

## Validierung

Gelaufen und grün:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/ai-provider-role-routing.contract.test.ts tests/ai-lane-policy.contract.test.ts tests/ai-cost-research-guardrail.contract.test.ts tests/ai-smoke-status-copy.contract.test.ts tests/ai-v2-flow-integration.contract.test.ts tests/ai-no-autoresearch-autopublish.contract.test.ts`
- `pnpm run release:validate:production`

## Bewusst offen

- echte Provider-/Credit-Abrechnung bleibt separater V2-/V3-Scope
- keine neue Research-UI oder Checkout-Logik
- keine Factcheck-/Seal-Automation
- keine Ausweitung zu Auto-Publish oder Vollcrawler
