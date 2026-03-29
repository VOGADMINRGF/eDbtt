# GOV-AI-04A Orchestration Impact Matrix (Ist-Stand 2026-03-27)

Ziel dieses Slices:
- die heutigen Orchestrierungs-Andockpunkte im produktnahen Hauptfluss repo-nah inventarisieren,
- stabile Contracts von echten Entscheidungsgrenzen trennen,
- `GOV-AI-04` entscheidungsreifer machen, ohne Routing-/Produktlogik zu veraendern.

Nicht-Ziel:
- keine neue Kanonisierung des 5-Orchester-Betriebsmodus,
- keine neue Routing- oder API-Logik,
- keine stillschweigende Architekturentscheidung.

## 1) Ist-Andockpunkte im Hauptfluss

| Andockpunkt | Heutige Rolle im Flow | Ist-Contract / Zustand | Evidenz |
| --- | --- | --- | --- |
| `/api/create/analyze` | Thin Wrapper fuer den kanonischen Analyze-Pfad | delegiert 1:1 auf `/api/contributions/analyze`; kein eigener Orchestrierungszweig | `apps/web/src/app/api/create/analyze/route.ts`, `apps/web/tests/create-analyze.create-route.test.ts` |
| `/api/contributions/analyze` | Server-Einstieg fuer Analyze im Create/Contribution-Flow | rate-limit + optional SSE; liefert `result` + `createAnalyze`; faellt auf heuristischen/degraded Contract zurueck, wenn Provider/Match-Read scheitern | `apps/web/src/app/api/contributions/analyze/route.ts` |
| `features/analyze/analyzeContribution.ts` | fachliche Analyze-Orchestrierung (claims/notes/questions/...) | ruft `callE150Orchestrator`; validiert/normalisiert JSON; liefert `_meta.providerMatrix` und optional `runReceipt` | `features/analyze/analyzeContribution.ts` |
| `features/ai/orchestratorE150.ts` | Provider-Orchestrator mit Probe/Scoring/Fallback-Mechanik | liefert `best`, `candidates`, `meta` inkl. `providerMatrix`; kann `OrchestratorNoProviderError` und `OrchestratorAllFailedError` werfen | `features/ai/orchestratorE150.ts` |
| `/api/contributions/analyze/save` | direkter Analyze-Providerpfad (OpenAI) ausserhalb des Haupt-Orchestrator-Contracts | eigener Direktpfad mit `openai.responses.create`; kein shared Multi-Provider-Contract | `apps/web/src/app/api/contributions/analyze/save/route.ts` |
| `/api/contributions/refine` | direkter Refine-Providerpfad (OpenAI chat/completions) | eigener fetch-basierter Providerpfad mit degraded Rueckgabe; nicht ueber `callE150Orchestrator` | `apps/web/src/app/api/contributions/refine/route.ts` |
| `/api/quality/clarify` | direkter Clarify-Providerpfad mit Heuristik + kurzer LLM-Refine-Stufe | lokaler Heuristik-First-Ansatz plus OpenAI-Call; eigener Cache-/Timeout-Contract | `apps/web/src/app/api/quality/clarify/route.ts` |
| `/_diag/gpt`, `/api/admin/ai/orchestrator-smoke` | diag/admin-nahe Provider-Sicht | Diag direkt gegen OpenAI bzw. Orchestrator-Smoke mit Probe-Meta; nicht Teil des produktiven Analyze-Hauptcontracts | `apps/web/src/app/api/_diag/gpt/route.ts`, `apps/web/src/app/api/admin/ai/orchestrator-smoke/route.ts` |

## 2) Bereits stabile Contracts (Ist)

1. Wrapper-Paritaet fuer Analyze ist stabil: `/api/create/analyze` delegiert unveraendert auf den kanonischen Analyze-Route-Contract.
2. Route-nahe Fallback-Form ist bereits explizit: `fallback`/`degraded`-Antworten bleiben valide Analyze-Envelope statt stillen Fehlern.
3. Create-nahe Anschlussvertraege sind stabilisiert:
   - `createAnalyze` wird im Analyze-Response mitgefuehrt,
   - Match-Read-Fehler degradieren kontrolliert (`sourceState: "degraded"`),
   - CTA-Ausgaben bleiben im konservativ-deterministischen Kanon (`GOV-AI-02`).
4. Orchestrator-Meta ist vorhanden (`providerMatrix`, probes, failed/disabled/skipped providers), aber die Pflicht-Tiefe fuer produktive Klassen ist noch nicht final entschieden.

## 3) Impact-Matrix fuer `GOV-AI-04` Entscheidungsoptionen (ohne Vorentscheidung)

| Option | Kurzbild | Auswirkung auf heutige Andockpunkte | Offene Entscheidungspunkte |
| --- | --- | --- | --- |
| A: strict staged | ein linearer Pflichtpfad ueber klar definierte Orchester-Stufen | direkte Providerpfade (`analyze/save`, `refine`, `clarify`) muessen klar als Ausnahme/Legacy oder in Stage-Contracts eingebunden werden | welche Stufen sind verpflichtend, welche bleiben optional/degraded |
| B: domain-branching | je Domaintyp unterschiedliche Orchester-Verzweigung | Analyse-/Match-/CTA-Andockpunkte brauchen domainbasierte Branch-Grenzen im Contract | welche Domain-Signale triggern Branching verbindlich |
| C: hybrid event-driven | staged Kern mit ereignisgetriebenen Zusatzpfaden | bestehender Hauptpfad kann bleiben; direkte Providerpfade brauchen klare Event-/Audit-Contracts statt impliziter Sonderrolle | wann duerfen event-getriebene Abzweige produktiv den Hauptpfad erweitern |

## 4) Verbleibende Decision-Boundaries fuer Parent `GOV-AI-04`

1. Verbindliche Betriebsform zwischen den Orchester-Stufen (A/B/C) bleibt offen.
2. Rolle direkter Providerpfade bleibt offen:
   - dauerhafte Nebenpfade,
   - kontrollierte Legacy-Ausnahmen,
   - oder spaetere Einbindung in den kanonischen Orchestrator-Contract.
3. Pflichtumfang der produktiven Meta-/Provider-Nachweise je High-impact-Klasse bleibt offen (Schnittstelle zu `GOV-AI-07`).
4. Verbindlicher Zustandstransfer zwischen Analyze -> Match -> CTA bleibt funktional stabil, aber die Orchester-semantische Einordnung ist noch nicht final freigegeben.

## 5) Slice-Ergebnis

- `GOV-AI-04A` liefert ein belastbares Ist-Mapping fuer die Entscheidungsrunde, ohne Produkt- oder Architekturentscheid vorwegzunehmen.
- Naechster naheliegender Entscheidungsvorbereitungs-Slice bleibt `GOV-AI-07A` (Meta-Layer Feldinventar).
