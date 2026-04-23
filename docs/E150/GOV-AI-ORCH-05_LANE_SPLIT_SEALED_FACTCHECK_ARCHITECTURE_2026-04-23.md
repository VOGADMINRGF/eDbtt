# GOV-AI-ORCH-05 Verbindliche Zielarchitektur: Lane-Split, sealed Factcheck, specialist routing (2026-04-23)

Ziel:
- Die AI-Architektur wird verbindlich auf zwei Lanes festgelegt.
- Kostenkritisches Research und verifizierbares Siegel werden strikt getrennt.
- Der erste technische Umsetzungsslice ist direkt aus dieser Entscheidung ableitbar.

Nicht-Ziel:
- Kein neuer Produktgrundsatz ausserhalb der hier festgelegten Defaults.
- Keine stillen teuren Parallelstrukturen in Standard-Lanes.

## 1) Verbindliche Architekturentscheidung

### 1.1 Lane-Trennung (verbindlich)

Es gibt genau zwei Haupt-Lanes:

1. Standard-Lane
2. sealed Factcheck-Lane

### 1.2 ARI/Research (verbindlich)

- ARI ist erlaubt, aber kostenkritisch.
- In Standard-Lanes gilt als Default: `researchUsed = "none"`.
- Kein stiller ARI-Search- oder Deep-Search-Default ausserhalb sealed Factcheck.
- Ein spaeterer `lite`-Modus ausserhalb sealed Factcheck ist nur optionale Erweiterung, nicht Standard.

### 1.3 Factcheck-Siegel (verbindlich)

- Siegel ist ausschliesslich im sealed Factcheck-Lane moeglich.
- Standard-Lanes duerfen analysieren, plausibilisieren und vorpruefen, aber kein Siegel vergeben.

### 1.4 GPT/OpenAI (verbindlich)

GPT/OpenAI darf nur zwei Rollen haben:

1. `fallback`
2. `presentation_pass`

`presentation_pass` ist strikt non-mutativ:

- keine Claim-Aenderung
- keine Evidenz-Aenderung
- keine Bewertungs-/Trust-/Entscheidungs-Aenderung
- nur Stil, Lesbarkeit, Ton

## 2) Verbindlicher Ziel-Contract

Neue/verbindliche Felder:

- `verificationMode: "none" | "precheck" | "sealed"`
- `researchUsed: "none" | "lite" | "search" | "deep_search"`
- `sealEligible: boolean`
- `sealGranted: boolean`

Default-Regeln:

### 2.1 Standard-Lane

- `verificationMode = "none"` oder `"precheck"`
- `researchUsed = "none"`
- `sealEligible = false`
- `sealGranted = false`

### 2.2 sealed Factcheck-Lane

- `verificationMode = "sealed"`
- `researchUsed = "search"` oder `"deep_search"`
- `sealEligible = true`
- `sealGranted = true` nur nach vollstaendigem sealed Workflow

## 3) Journey-Defaults (verbindlich)

| Journey | Primary | Secondary / Cross-check | Fallback | Contract-Default |
| --- | --- | --- | --- | --- |
| Standard Analyse / Create / Check | structure: `mistral`; questions/challenge: `gemini`; context: `anthropic` | context/challenge disagreement | `openai` | `verificationMode=none/precheck`, `researchUsed=none`, `sealEligible=false`, `sealGranted=false` |
| Media / Dossier / Report | context/report depth: `anthropic`; structure: `mistral`; challenge/questions: `gemini` | challenge/context disagreement | `openai` | `verificationMode=none/precheck`, `researchUsed=none`, `sealEligible=false`, `sealGranted=false` |
| Guided / Institution / Verwaltung | responsibility/structure: `mistral`; formal/context: `anthropic`; risks/questions: `gemini` | risk/context disagreement | `openai` | `verificationMode=none/precheck`, `researchUsed=none`, `sealEligible=false`, `sealGranted=false` |
| sealed Factcheck Add-on | retrieval/search: `ari`; reasoning/context: `anthropic`; counter/challenge: `gemini`; claim atomization: `mistral` | verpflichtender Cross-check | `openai` | `verificationMode=sealed`, `researchUsed=search/deep_search`, `sealEligible=true`, `sealGranted` nur nach Workflow |

## 4) Orchestrierung (verbindlich)

Altmodell (abzuloesen):

- `first-valid-wins` / winner-takes-all
- struktureller OpenAI-Startvorteil als impliziter Primargewinner

Neues Zielmodell:

- journey-aware specialist routing
- role-based provider selection
- disagreement/cross-check
- definierte fallback chain
- OpenAI ohne strukturellen Startvorteil im Primary-Pfad

## 5) Produktstatus-Labels (verbindlich)

Die sichtbaren Labels werden eindeutig auf den Contract gemappt:

1. `analysiert`: `verificationMode="none"`
2. `geprueft`: `verificationMode="precheck"`
3. `verifiziert`: `verificationMode="sealed"` und `sealGranted=true`

## 6) Erster technischer Umsetzungsslice (direkt startbar)

Umsetzungsziel:

- Lane-Split und Contract-Felder in Orchestrierung/Analyze/Factcheck technisch verankern.

Scope:

1. Journey- und Rollenrouting zentral einfuehren.
2. `verificationMode`, `researchUsed`, `sealEligible`, `sealGranted` entlang Analyze- und Factcheck-Antworten transportieren.
3. Standard-Lanes auf `researchUsed=none` als Default festziehen.
4. sealed Factcheck als exklusiven Research-/Siegelpfad markieren.
5. OpenAI-Rolle auf `fallback` + optionalen `presentation_pass` begrenzen.
6. Orchestrator so umbauen, dass winner-takes-all nicht das Zielverhalten bleibt.

Betroffene Kernpfade (geplant):

- `features/ai/orchestratorE150.ts`
- `features/analyze/analyzeContribution.ts`
- `apps/web/src/app/api/contributions/analyze/route.ts`
- `apps/web/src/app/api/factcheck/enqueue/route.ts`
- neue Profile/Contracts unter `features/ai/e150/` (journey/role/factcheck/presentation)

Validierung (Pflicht):

1. Contract-Tests fuer neue Felder und Label-Mapping.
2. Routing-Tests fuer Journey-Defaults und OpenAI-Fallbackrolle.
3. Factcheck-Tests fuer sealed-only Siegelvergabe.
4. Regression: Standard-Lanes bleiben ohne stilles Research.

## 7) Risikohinweise

1. Response-Envelope-Drift in bestehenden Clients.
2. Fallback-Ketten koennen Latenz erhoehen.
3. Alte Direct-Provider-Ausnahmepfade muessen gegen neue Rollen sauber abgegrenzt bleiben.
