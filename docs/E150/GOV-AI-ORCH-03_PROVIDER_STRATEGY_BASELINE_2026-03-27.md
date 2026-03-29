# GOV-AI-ORCH-03 Provider-/Modellstrategie je Orchester (2026-03-27)

Ziel:
- bestehenden Betriebsstand je Orchester konkretisieren,
- Primär-/Fallback-Klassen, Failure-Modes und offene Risiken explizit machen,
- ohne neue Provider-Entscheidung oder neue Runtime-Logik.

Nicht-Ziel:
- keine neue Provider-Matrix implementieren,
- keine neue Auth-/Routing-/Produktlogik.

## 1) Betriebsmatrix je Orchester (Ist + operativer Baseline-Stand)

| Orchester | Primärklasse (Ist/Baseline) | Fallbackklasse (Ist/Baseline) | Direkte Ausnahmepfade | Zentrale Unsicherheiten |
| --- | --- | --- | --- | --- |
| Intake-Orchestrierung | reasoning-starker Generalist (aktuell orchestriert über `callE150Orchestrator`) | weiterer reasoning-starker Frontier-Provider, dann degraded contract | `analyze/save`, `refine`, `quality/clarify` (legacy direct) | DPA/Residency je Provider, Kosten bei Lastspitzen, Timeout-/Retry-Feinregeln |
| Prüf-Orchestrierung | orchestrierter Multi-Provider-Pfad über `analyzeContribution`/`orchestratorE150` | heuristischer/degraded contract bleibt erlaubt | `factcheck/enqueue` nutzt staged Analyse, direkte Ausnahmepfade nur außerhalb Hauptfluss | Audit burden für high-impact, Quellen-/Evidenzqualität, Cross-Store-Policy |
| Agenda-/Fragen-Orchestrierung | aus staged Analyze-Output (questions/knots/eventualities) | degrade auf vorhandene Heuristik-/Fallback-Daten | `quality/clarify` als direkter Hilfspfad | Qualität bei niedriger Input-Qualität, Explainability-Tiefe |
| Dossier-Orchestrierung | staged Analyse + Dossier/Finding-Upsert-Pfade | manuelle/editoriale Pfade bleiben erlaubt | direkte Providerzugriffe sind nicht kanonischer Dossier-Hauptfluss | Prisma/Neo4j-Sonderpfade, Zonenmodell-Entscheidung (`GOV-SEC-03`) |
| Beteiligungs-/Abstimmungs-Orchestrierung | staged Match-/CTA-Handoffs und Swipes-Anschluss | no-match/degraded mit konservativen CTAs (`neu_anlegen`) | direkte Providerpfade nicht als gleichwertiger Beteiligungs-Hauptfluss | Meta-Layer-Pflichtgrad (`GOV-AI-07`), Ranking-/Weighting nur per expliziter Produktentscheidung |

## 2) Failure-Mode Baseline (repo-nah)

- **Provider unavailable / all failed**:
  - staged Hauptfluss liefert kontrollierte degraded/fallback Responses (kein stiller Vollzug).
- **Match-Quelle unavailable**:
  - `matchSourceState: degraded`, CTA bleibt konservativ.
- **Direkter Legacy-Pfad schlägt fehl**:
  - bleibt Ausnahmevertrag, darf staged Hauptfluss nicht als Kanon verdrängen.

## 3) Offene Betriebs-/Governance-Risiken (nicht entschieden)

1. **DPA/Residency** pro Provider und pro Datenzone.
2. **Cost envelope** für Lastspitzen und Fallback-Kaskaden.
3. **Reliability/Fault isolation** bei partiellen Providerausfällen.
4. **Explainability/Audit burden** für high-impact Pfade.
5. **Cross-Store-Contract** in Dossier/Finding-Sonderpfaden.

## 4) Entscheidungspfad (ohne Vorentscheidung)

- `GOV-AI-07`: Pflichtumfang Meta-/Audit-Felder pro Pfadklasse.
- `GOV-SEC-03`: Zonen-/Cross-Store-/Direktprovider-Mindestcontract.
- `GOV-AI-04`: bleibt als Leitentscheidung abgeschlossen (strict staged); direkte Providerpfade sind bewusst Ausnahmevertrag.

## 5) Referenzen

- `docs/E150/Part16_AI_Orchestration_and_Safety.md`
- `docs/E150/GOV-AI-ORCH-02_ROUTE_INVENTORY_2026-03-27.md`
- `docs/E150/GOV-AI-ORCH-04_PRODUCTION_READINESS_MARK_2026-03-29.md`
- `features/ai/orchestratorE150.ts`
- `features/ai/e150/providers.ts`
- `apps/web/src/features/ai/orchestrationRouteContract.ts`
- `apps/web/src/features/ai/orchestrationProductionContract.ts`

## 6) Produktionsreife-Markierung (2026-03-29)

- Primar/Fallback/Ausnahme ist als operativer Baseline-Contract zusammengefuehrt:
  - staged Hauptpfad bleibt kanonisch (`/api/contributions/analyze`, Wrapper `/api/create/analyze`)
  - direkte Providerpfade bleiben expliziter Ausnahmevertrag
  - Boundary-/Envelope-Sync-Pflichten sind als Produktionsmindestvertrag referenziert
