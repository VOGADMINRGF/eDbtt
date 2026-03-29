# GOV-SEC-03A Zonenmatrix (Ist-Stand 2026-03-27)

Ziel dieses Slices:
- den aktuellen Ist-Stand fuer Route-/Store-/Log-/Provider-Pfade nachvollziehbar zoniert dokumentieren,
- gemischte/unklare Pfade explizit markieren,
- `GOV-SEC-03` von "unscharf blockiert" auf konkrete Entscheidungs-/Architektur-Blocker zuschneiden.

Nicht-Ziel:
- keine neue Security-Policy,
- keine Scope-Ausweitung,
- keine Route-Verhaltensaenderung.

## 0) Zonenanker im Code

Verbindlicher technischer Startpunkt fuer Datenzonen:
- `core/db/triMongo.ts`
  - `core`
  - `votes`
  - `pii`
  - `ai_core_reader`

Damit ist die Sollstruktur fuer Store-Trennung vorhanden. Die folgenden Tabellen dokumentieren den aktuellen Ist-Stand in aktiven Pfaden.

## 1) Route-/API-Matrix (Ist)

| Route-/Pfadgruppe | Zentrale Stores/Collections (Ist) | Logs/Audit/Telemetry (Ist) | AI-/Provider-Uebergang | Zoneneinordnung (Ist) | Status |
| --- | --- | --- | --- | --- | --- |
| `/api/auth/login`, `/api/auth/verify-2fa` | `core.users`, `pii.user_credentials`, `pii.twofactor_challenges`, `pii.user_profiles` | `auth_events` via `core/telemetry/authEvents.ts` (primaer `ai_core_reader`, fallback `core`) | keiner | Core + PII + Logs/Telemetry | klar, aber mit gemischtem Log-Sink |
| `/api/contributions/analyze` | `core.eventuality_nodes`, `core.eventuality_decision_trees`, `core.eventuality_snapshots`, `core.run_receipts` | strukturierte Fehlerlogs (maskiert), `ai_usage`/`ai_usage_daily` via Orchestrator | `callE150Orchestrator` -> OpenAI/Anthropic/Mistral/Gemini/ARI | Core + External AI + Logs/Telemetry | gemischt (Multi-Zonen + externer Graph-Sync) |
| `/api/contributions/finalize`, `/api/create/finalize` | `core.contribution_drafts`, `core.statement_proposals`, `core.dossier_audit_chain`, `core.dossier_material_links` | `dossier_audit_chain` Hash-Events | keiner | Core + Logs/Audit | klar |
| `/api/factcheck/enqueue` | `core.factcheck_jobs`, `core.vote_drafts`, `core.dossier_*`, `core.open_questions` | denied-Logs (`RBAC_PERMISSION_DENIED` + System-Identity-Felder), Dossier-Revisionskette | `callAriSearchSerp` (ARI) | Core + External AI + Logs/Audit | klar (high-impact), aber provider-seitig heterogen |
| `/api/factcheck/status`, `/api/factcheck/status/[jobId]` | `core.factcheck_jobs` | denied-Logs inkl. `internalSystemIdentityAuditFields` | keiner | Core + Logs/Audit | klar |
| `/api/finding/upsert` | Prisma-Modelle (`finding`, `factcheckClaim`, `evidence`) **und** `core.dossier_*` | `SYSTEM_IDENTITY_DENIED`, Dossier-Revisionskette | keiner | Core + (nicht-triMongo) + Logs/Audit | gemischt/riskant (Dual-Write) |
| `/api/dossier/transition` | `core.dossier_workflow`, `core.dossier_audit_chain`, `core.dossier_store`, `core.dossier_snapshots` | Audit-Chain + optional Snapshot-Event | keiner | Core + Logs/Audit | klar |
| `/api/swipes/*` + `features/swipes/service.ts` + `features/swipe/service.ts` | `core.statement_proposals`, `core.eventuality_nodes`, `core.swipe_votes`, `core.statement_swipes`, `core.swipe_events`, `core.users` | Swipe-Telemetrie in `core.swipe_events` | keiner | fachlich Votes/Usage, technisch weitgehend Core | gemischt |
| `/api/votes/summary`, `/api/votes/user` | `votes.votes` + `core.statements` | keine eigene persistente Auditspur im Pfad | keiner | Votes + Core-Referenz | klar, aber parallel zu Core-basierten Swipe-Votes |
| `/api/_diag/gpt`, `/api/admin/ai/orchestrator-smoke` | kein eigener Collection-Sink | runtime/log-Ausgaben; bei Orchestrator-Lauf auch `ai_usage` | OpenAI direkt bzw. Orchestrator-Multiprovider | External AI + Logs/Telemetry | klar |
| direkte OpenAI-Routen (`/api/contributions/analyze/save`, `/api/contributions/refine`, `/api/quality/clarify`) | kein einheitlicher shared Store-Contract im Pfad | kein einheitlicher `ai_usage`-Nachweis im Pfad | direkte OpenAI-HTTP/SDK Calls | External AI | unklar/gemischt (Contract-Drift) |

## 2) Store-/Collection-Matrix (Ist)

| Zone | Store | Beispiel-Collections (Ist) | Einordnung |
| --- | --- | --- | --- |
| Core | `core` | `contribution_drafts`, `statement_proposals`, `dossiers`, `dossier_sources`, `dossier_claims`, `dossier_findings`, `dossier_edges`, `dossier_audit_chain`, `dossier_revisions`, `factcheck_jobs`, `eventuality_*`, `run_receipts` | klar fuer Content-/Workflow-Kern |
| Votes/Usage | `votes` + `core` | `votes.votes` (votes-store), aber auch `core.swipe_votes`, `core.statement_swipes`, `core.swipe_events` | gemischt (parallel gefuehrte Usage-Datenebenen) |
| PII | `pii` | `user_credentials`, `twofactor_challenges`, `user_profiles`, `tokens` | klar |
| Logs/Telemetry | `core` + `ai_core_reader` | `ai_usage`, `ai_usage_daily`, `dossier_audit_chain`, `dossier_revisions`, `error_logs`, `auth_events` (ai_core_reader mit core-fallback) | teilweise gemischt (auth_events sink) |
| External AI / Provider | extern | OpenAI/Anthropic/Mistral/Gemini/ARI Endpunkte | klar als externe Zone, aber nicht in allen Pfaden gleich contract-gebunden |
| Nicht-triMongo (Sonderfall) | Prisma/Neo4j | `finding`/`factcheckClaim`/`evidence` (Prisma), Graph-Sync (`core/graph/syncAnalyzeResult.ts`) | fuer `GOV-SEC-03` als Architektur-Sonderfall explizit offen |

## 3) Logs/Audit/Telemetry-Spuren (Ist)

| Mechanismus | Evidenz | Sink | Zone | Status |
| --- | --- | --- | --- | --- |
| PII-Redaction fuer Logger | `core/pii/redact.ts`, `core/observability/logger.ts`, `apps/web/src/utils/logger.ts` | strukturierte Logger | Logs/Telemetry | klar |
| RBAC denied audit | `apps/web/src/lib/server/auth/requestRole.ts` | Logger-Event `RBAC_PERMISSION_DENIED` | Logs/Telemetry | klar |
| System-Identity denied audit | `apps/web/src/lib/server/auth/systemIdentity.ts`, Factcheck/Finding-Routen | Logger + strukturierte denied-Felder | Logs/Telemetry | klar |
| Dossier Audit-Chain | `apps/web/src/app/api/contributions/finalize/route.ts`, `apps/web/src/app/api/dossier/transition/route.ts` | `core.dossier_audit_chain` | Logs/Audit | klar |
| Dossier Revisionen | `features/dossier/db.ts`, `features/dossier/revisions.ts` | `core.dossier_revisions` | Logs/Audit | klar |
| AI Usage Telemetrie | `features/ai/orchestratorE150.ts`, `core/telemetry/aiUsage.ts` | `core.ai_usage`, `core.ai_usage_daily` | Logs/Telemetry | klar im Orchestrator-Pfad |
| Auth Events | `core/telemetry/authEvents.ts` | primaer `ai_core_reader.auth_events`, fallback `core.auth_events` | Logs/Telemetry | gemischt |
| Generische Audit-API (Stub) | `apps/web/src/lib/audit.ts` | no-op | Logs/Audit | unklar/riskant |

## 4) AI-/Provider-Uebergaenge (Ist)

| Einstieg | Provider-Adapter | Externer Endpoint (Code) | Telemetrie-/Auditspur |
| --- | --- | --- | --- |
| `features/analyze/analyzeContribution.ts` (via `/api/contributions/analyze`) | `callE150Orchestrator` | OpenAI, Anthropic, Mistral, Gemini, ARI (je Adapter) | `ai_usage` + in-memory AI telemetry |
| `/api/factcheck/enqueue` | `callAriSearchSerp` | `${ARI_BASE_URL}/v1/search` | kein einheitlicher `ai_usage`-Eintrag im Pfad |
| `/api/_diag/gpt` | `callOpenAI` | `${OPENAI_BASE_URL}/responses` | runtime/log-Ausgabe |
| `/api/admin/ai/orchestrator-smoke` | `callE150Orchestrator`, fallback `callOpenAIJson` | Multiprovider + OpenAI-Fallback | Orchestrator-Telemetrie vorhanden |
| direkte OpenAI-Routen (`analyze/save`, `refine`, `quality/clarify`) | direkte SDK/HTTP Calls | OpenAI Responses/Chat Completions | kein einheitlicher shared Telemetrie-/Audit-Contract |

## 5) Gemischte/unklare Pfade (fuer `GOV-SEC-03` relevant)

1. Votes/Usage liegen parallel in `votes.votes` und in Core-Collections (`swipe_votes`, `statement_swipes`, `swipe_events`).
2. `finding/upsert` arbeitet dual (Prisma + Mongo-Dossier), ohne zentralen Zonen-Contract fuer den Cross-Store-Pfad.
3. `auth_events` nutzt `ai_core_reader` mit core-fallback; damit ist die Log-Zone technisch nicht strikt.
4. Mehrere direkte OpenAI-Routen laufen ausserhalb des Orchestrator-Contracts und ohne einheitlichen `ai_usage`-Nachweis.
5. `apps/web/src/lib/audit.ts` ist aktuell no-op und bildet keinen belastbaren Audit-Sink.

## 6) Verbleibende Blocker fuer `GOV-SEC-03`

Nach `GOV-SEC-03A` bleiben fuer den Parent nur noch echte Architektur-/Entscheidungspunkte offen:

1. **Votes/Usage-Zonierung finalisieren:** Soll der produktive Vote-/Swipe-Write-Pfad kanonisch im votes-store, im core-store oder bewusst hybrid bleiben?
2. **Cross-Store-Contract fuer Sonderpfade:** Wie werden Prisma-/Neo4j-Pfade (`finding/upsert`, Graph-Sync) verbindlich in das Zonenmodell eingebunden?
3. **Einheitlicher AI-Telemetrie-Mindestcontract:** Welche Felder sind fuer direkte Provider-Pfade verpflichtend, falls sie ausserhalb des Orchestrators bleiben?
4. **High-impact-Klassenbindung:** Welche Klassen (z. B. Publish-nahe Transitionen, Finding/Factcheck, Trust/Score) bekommen verpflichtende Audit-/Review-Tiefe?

## 7) Ableitbarer, entscheidungsfreier Folgeslice

`GOV-SEC-03B` (codex_ready) kann ohne neue Policy umgesetzt werden:
- machine-readable Ist-Allow/Deny-Zoneninventar fuer den hier dokumentierten High-impact-Subset,
- schlanke Drift-Tests gegen diese Ist-Matrix,
- ohne Scope-/Policy-Aenderung.
