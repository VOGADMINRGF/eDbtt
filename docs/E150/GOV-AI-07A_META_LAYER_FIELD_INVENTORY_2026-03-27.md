# GOV-AI-07A Meta-Layer Field Inventory (Ist-Stand 2026-03-27)

Ziel dieses Slices:
- den aktuellen Meta-Layer-Feldbestand fuer High-impact-Analyze-Pfade repo-nah inventarisieren,
- Feldfluss (Erzeugung -> Transport -> UI/Contract) transparent machen,
- stabile Felder klar von optionalen/lueckenhaften Feldern trennen.

Nicht-Ziel:
- keine neue Governance- oder Produktentscheidung,
- keine neue Pflichtfeld-Policy,
- keine API-/Route-/Runtime-Logikaenderung.

## 1) High-impact Pfade (Scope)

- `/api/contributions/analyze`
- `/api/create/analyze` (Wrapper auf contributions/analyze)
- `features/analyze/analyzeContribution.ts`
- `features/ai/orchestratorE150.ts`
- route-nahe Create-Analyze-Contracts (`features/create/analyzeContract.ts`)
- fallback/degraded envelopes im Analyze-Route-Contract

## 2) Feldmatrix (Ist)

| Feld | Erzeugt in | Transportiert in | Kommt im UI/Route-Contract an | Status (Ist) | Evidenz |
| --- | --- | --- | --- | --- | --- |
| `runId` | `/api/contributions/analyze` (pro Request) | Response `meta.runId`, `createAnalyze.runId` | ja (`AnalyzeWorkspace` + handoff state) | stabil | `apps/web/src/app/api/contributions/analyze/route.ts`, `apps/web/src/components/analyze/AnalyzeWorkspace.tsx` |
| `result.runReceipt` | `features/analyze/analyzeContribution.ts` (via `computeRunReceipt`) | `result.runReceipt` + persist attempt via `upsertRunReceipt` | ja (RunReceipt-Panel/Transparency) | stabil (success), optional (degraded/fallback) | `features/analyze/analyzeContribution.ts`, `apps/web/src/app/api/contributions/analyze/route.ts`, `apps/web/src/lib/db/runReceiptsRepo.ts`, `apps/web/src/components/analyze/AnalyzeWorkspace.tsx` |
| `result._meta.providerMatrix` | `features/ai/orchestratorE150.ts` -> `analyzeContribution` | `result._meta.providerMatrix` | indirekt (route mapped to `meta.providerMatrix`) | stabil | `features/ai/orchestratorE150.ts`, `features/analyze/analyzeContribution.ts`, `apps/web/src/app/api/contributions/analyze/route.ts` |
| `meta.providerMatrix` (route response) | `/api/contributions/analyze` (`buildProviderMatrixResponse`) | `meta.providerMatrix` in success/degraded | ja (`AnalyzeProgress`/provider matrix) | stabil in success + degraded, lueckenhaft in heuristic `fallback` envelope | `apps/web/src/app/api/contributions/analyze/route.ts`, `apps/web/src/components/analyze/AnalyzeWorkspace.tsx` |
| `createAnalyze.phases.*` | `buildCreateAnalyzeResponse` | `createAnalyze.phases` | ja (phases summary in AnalyzeWorkspace) | stabil | `apps/web/src/features/create/analyzeContract.ts`, `apps/web/src/components/analyze/AnalyzeWorkspace.tsx` |
| `createAnalyze.confidence` | `buildCreateAnalyzeResponse` | `createAnalyze.confidence` | ja (UI display + parser guard) | stabil | `apps/web/src/features/create/analyzeContract.ts`, `apps/web/src/components/analyze/AnalyzeWorkspace.tsx` |
| `createAnalyze.uncertaintyFlags` | `buildCreateAnalyzeResponse` | `createAnalyze.uncertaintyFlags` | aktuell nur indirekt (via contract parse/diagnostic block), keine eigene priorisierte UX-Fuehrung | optional | `apps/web/src/features/create/analyzeContract.ts`, `apps/web/src/components/analyze/AnalyzeWorkspace.tsx` |
| `createAnalyze.matchSourceState`, `createAnalyze.matchSourceErrors` | `resolveCreateGraphMatches` + fallback in route/contract builder | `createAnalyze.matchSourceState/errors` | ja (degraded-hint block im UI) | stabil | `apps/web/src/features/create/matchService.ts`, `apps/web/src/features/create/analyzeContract.ts`, `apps/web/src/app/api/contributions/analyze/route.ts`, `apps/web/src/components/analyze/AnalyzeWorkspace.tsx` |
| `degraded`, `fallback`, `errorCode`, `warning` (route envelope) | `/api/contributions/analyze` | top-level response flags | ja (status/error handling in AnalyzeWorkspace) | stabil, aber semantisch zweigeteilt (`fallback` vs `degraded`) | `apps/web/src/app/api/contributions/analyze/route.ts`, `apps/web/src/components/analyze/AnalyzeWorkspace.tsx` |
| `meta.failedProviders`, `meta.disabledProviders`, `meta.skippedProviders`, `meta.probes` | `/api/contributions/analyze` bei provider failure/degraded | `meta.*` im degraded envelope | derzeit vor allem diagnostic/ops-seitig; keine vollstaendige UI-Auswertung fuer Endnutzer | optional | `apps/web/src/app/api/contributions/analyze/route.ts`, `apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts` |
| direkte Providerpfade ohne shared Meta-Layer (`/api/contributions/analyze/save`, `/api/contributions/refine`, `/api/quality/clarify`) | jeweilige Route | route-eigene envelopes | kein gemeinsamer Meta-Layer-Contract wie im Hauptpfad | lueckenhaft fuer `GOV-AI-07` Pflichtumfang | `apps/web/src/app/api/contributions/analyze/save/route.ts`, `apps/web/src/app/api/contributions/refine/route.ts`, `apps/web/src/app/api/quality/clarify/route.ts` |

## 3) Kurzbefund fuer Parent `GOV-AI-07`

Bereits stabil im High-impact-Hauptpfad:
1. `runId` + `createAnalyze` Kerncontract inkl. `phases`, `confidence`, `matchSourceState/errors`.
2. `runReceipt`-Erzeugung und Persistenzversuch im Analyze-Flow.
3. providerbezogene Meta-Basis (`providerMatrix`) inkl. degraded envelope.

Heute optional/lueckenhaft:
1. einheitliche Pflichtsichtbarkeit von `providerMatrix` im heuristischen fallback envelope,
2. konsistente Pflichtfeldtiefe fuer `meta.failed/disabled/skipped/probes` im Endnutzer-Contract,
3. gemeinsamer Meta-Layer-Mindestcontract fuer direkte Providerpfade ausserhalb des Haupt-Orchestrators.

## 4) Verbleibende Decision-Boundary (nicht vorentschieden)

`GOV-AI-07` bleibt offen fuer die Produkt-/Governance-Entscheidung:
- nur High-impact strict,
- graduated all-path,
- oder async enrichment als Pflichtumfang des Meta-Layers.

`GOV-AI-07A` liefert nur die Ist-Basis und trennt stabile von lueckenhaften Feldgruppen.
