# GOV-AI-ORCH-02 KI-/Route-Inventar (Ist-Stand 2026-03-27)

Ziel:
- aktive KI-/Analyse-/Match-/CTA-/Factcheck-/Dossier-/Feed-/Provider-nahe Pfade repo-nah inventarisieren,
- Andockpunkte gegen das 5-Orchester-Zielbild mappen,
- Gaps priorisiert auf Folge-Tasks legen, ohne neue Produktlogik.

Nicht-Ziel:
- keine neue Route,
- keine neue Orchestrierungslogik,
- keine neue Provider-Policy.

## 1) Inventar-Matrix (High-impact + produktnah)

| Route / Service / Surface | Primäres Orchester | Contract-Status | direct vs staged | Risiko / Drift | Empfohlener Folgetask |
| --- | --- | --- | --- | --- | --- |
| `/api/contributions/analyze` | Intake + Prüf + Agenda + CTA-Handoff | stabil | staged | gering; kanonischer Hauptpfad | `GOV-AI-04` Folgearbeit nur bei neuer Leitentscheidung |
| `/api/create/analyze` | Intake-Wrapper | stabil | staged (Wrapper) | gering; Delegationsparität | `ROUTING-HARM-01` Restmonitoring |
| `features/analyze/analyzeContribution.ts` | Analyse-Kern (mehrere Orchester-Stufen) | stabil | staged | mittel; hoher Contract-Impact bei Änderungen | `GOV-AI-07` (Meta-Pflichtumfang) |
| `features/ai/orchestratorE150.ts` | Provider-Orchestrator für staged Hauptfluss | stabil | staged | mittel; Entscheidung zu Pflichtfeldern offen | `GOV-AI-07` |
| `features/create/matchService.ts` + `features/create/ctaResolver.ts` | Graph-Matching + Beteiligungs-/CTA-Orchestrierung | stabil | staged | gering; konservativer CTA-Kanon bereits fixiert | `PR-AI-CREATE-01` Rest-Hardening |
| `components/analyze/AnalyzeWorkspace.tsx` | UI-Boundary Analyze -> Match -> CTA | stabil | staged | gering; Boundary-Parser aktiv | `ROUTING-HARM-01` Restmonitoring |
| `/api/factcheck/enqueue` | Prüf-Orchestrierung + Dossier-Andockung | stabil | staged (System-Identity-gated) | mittel; Cross-Store-/Zonenentscheidung offen | `GOV-SEC-03` |
| `/api/factcheck/status`, `/api/factcheck/status/[jobId]` | Prüf-Orchestrierung Read-/Audit-Pfad | stabil | staged (System-Identity-gated) | mittel; Zonen-/Auditpflicht offen | `GOV-SEC-03` |
| `/api/finding/upsert` | Dossier-Orchestrierung (Finding-Verdichtung) | gemischt | staged + Cross-Store | hoch; Prisma/Neo4j-Sonderpfade offen | `GOV-SEC-03` |
| `/api/dossiers/[dossierId]/findings/upsert` | Dossier-Orchestrierung | stabil | staged/manual | mittel; Policy-/Contract-Konsistenz weiter beobachten | `GOV-SEC-03` |
| `/api/eventualities/analyze` | Beteiligungs-/Abstimmungs-Orchestrierung Vorstufe | stabil | staged | mittel; Meta-Layer-Pflichtgrad offen | `GOV-AI-07` |
| `/api/contributions/[id]/orchestrate` | Analyze-Assist/Detailpfad | gemischt | staged | mittel; Legacy-Nähe/Contract-Parität beobachten | `GOV-AI-04` Folgearbeit nur bei neuer Leitentscheidung |
| `/api/statements/route.ts` (Analyze-Aufruf + Factcheck enqueue) | Intake/Prüf-Orchestrierung Anschluss | gemischt | staged | mittel; queue-/audit-Kopplung sensibel | `GOV-SEC-03` |
| `/api/contributions/analyze/save` | Legacy Analyze Direktpfad | stabil als Ausnahme | direct | mittel; nicht-kanonischer Hauptfluss | `GOV-AI-04` (Ausnahmevertrag bleibt explizit) |
| `/api/contributions/refine` | Legacy Refine Direktpfad | stabil als Ausnahme | direct | mittel; nicht-kanonischer Hauptfluss | `GOV-AI-04` (Ausnahmevertrag bleibt explizit) |
| `/api/quality/clarify` | Legacy Clarify Direktpfad | stabil als Ausnahme | direct | mittel; nicht-kanonischer Hauptfluss | `GOV-AI-04` (Ausnahmevertrag bleibt explizit) |
| `/api/news/survey-topics` | Feed-/Themencluster KI-Hilfspfad | gemischt | direct | mittel; eigener direkter OpenAI-Pfad | `GOV-AI-ORCH-03` (Provider-/Betriebsstrategie) |
| `/api/quality/polish` | Quality-Hilfspfad | gemischt | direct | niedrig bis mittel; außerhalb Hauptfluss | `GOV-AI-ORCH-03` |
| `/api/_diag/gpt`, `/api/admin/ai/orchestrator-smoke` | Ops/Diagnostik | stabil als Ausnahme | direct (diag/admin) | niedrig; bewusst nicht produktiver Hauptfluss | `GOV-AI-04` (Ausnahmevertrag bleibt explizit) |

## 2) Priorisierte Gap-Liste

1. **Zonen-/Audit-Entscheidung offen** (`GOV-SEC-03`):
   - votes/core split,
   - Prisma/Neo4j-Sonderpfade,
   - direkter Provider-Mindestcontract.
2. **Meta-Layer-Pflichtumfang offen** (`GOV-AI-07`):
   - welche Felder in welchen Pfaden Pflicht sind.
3. **Provider-/Betriebsstrategie je Orchester verfeinern** (`GOV-AI-ORCH-03`):
   - insbesondere direkte Ausnahme-Pfade außerhalb des staged Hauptflusses.

## 3) Referenzen (Code)

- `apps/web/src/app/api/contributions/analyze/route.ts`
- `apps/web/src/app/api/create/analyze/route.ts`
- `features/analyze/analyzeContribution.ts`
- `features/ai/orchestratorE150.ts`
- `apps/web/src/features/create/matchService.ts`
- `apps/web/src/features/create/ctaResolver.ts`
- `apps/web/src/components/analyze/AnalyzeWorkspace.tsx`
- `apps/web/src/app/api/factcheck/enqueue/route.ts`
- `apps/web/src/app/api/finding/upsert/route.ts`
- `apps/web/src/app/api/contributions/analyze/save/route.ts`
- `apps/web/src/app/api/contributions/refine/route.ts`
- `apps/web/src/app/api/quality/clarify/route.ts`
- `apps/web/src/app/api/news/survey-topics/route.ts`
- `apps/web/src/features/ai/orchestrationRouteContract.ts`

## 4) Produktionsreife-Markierung (2026-03-29)

- Auf Basis dieses Inventars ist der staged Hauptpfad als Production-Baseline
  zusammengefuehrt dokumentiert:
  - `docs/E150/GOV-AI-ORCH-04_PRODUCTION_READINESS_MARK_2026-03-29.md`
- Machine-readable Contract-Anker:
  - `apps/web/src/features/ai/orchestrationProductionContract.ts`
