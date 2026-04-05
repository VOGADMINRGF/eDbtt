# GOV-AI-05A - Prompt/Output Envelope Hardening (2026-04-05)

## Scope

Kleiner, entscheidungsfreier Folge-Slice aus `GOV-AI-05`:
- nur kritische Prompt-/Output-Grenzen
- kein Orchestrator-Umbau
- keine globale KI-Migration
- keine neue Produktlogik

Betroffene Routen:
- `apps/web/src/app/api/contributions/refine/route.ts`
- `apps/web/src/app/api/contributions/trace/route.ts`
- `apps/web/src/app/api/contributions/analyze/save/route.ts`

## Umsetzung

### 1) Shared Envelope-Helfer

Neu:
- `apps/web/src/features/ai/promptOutputEnvelope.ts`

Enthaelt:
- `PROMPT_OUTPUT_CONTRACT_VERSION = "prompt_output.v1"`
- defensives JSON-Parsing (`parsePromptOutputJson`) inkl. bounded/fenced Fallback
- Envelope-Extraktion mit Legacy-Fallback (`extractPromptOutputPayload`)
- parser mode Klassifikation: `envelope | legacy | invalid`

### 2) Refine-Route gehärtet

- Prompt jetzt mit versioniertem Envelope-Ziel (`contractVersion`, `promptVersion`, `outputVersion`, `data`)
- Parser nimmt Envelope und Legacy-Objekt an
- Response transportiert `promptOutput`-Meta explizit
- Bestehendes Nutzverhalten bleibt erhalten (`primaryIndex`, `claims`, `draftIndexes`, `degraded`)

### 3) Trace-Route gehärtet

- Prompt jetzt mit versioniertem Envelope-Ziel
- Parser nimmt Envelope und Legacy-Objekt an
- parse-Fail liefert weiterhin 502, jetzt mit `promptOutput`-Meta
- Erfolgsantwort bleibt kompatibel (`ok`, `guidanceOnly`, payload-Felder), plus `promptOutput`

### 4) Analyze-Save-Route gehärtet

- OpenAI JSON-Schema auf versionierten Envelope erweitert (`contractVersion`, `promptVersion`, `outputVersion`, `data`)
- Extraktion der Nutzdaten aus `data` defensiv ueber shared Helper
- Erfolgsantwort ergaenzt um `promptOutput`-Meta
- keine Routing- oder Produktlogik-Aenderung

## Tests

Neu:
- `apps/web/tests/prompt-output-envelope.test.ts`

Abgedeckt:
- Envelope-Parsing (`envelope`)
- Legacy-Fallback (`legacy`)
- Invalid-Payload (`invalid`)
- fenced/bounded JSON-Fallback

## Ergebnis

`GOV-AI-05A` ist als kleiner technischer Hardening-Slice geschlossen:
- versionierte Prompt-/Output-Metadaten werden in den kritischen Routen explizit transportiert
- Parser sind defensiv und legacy-kompatibel
- kein Scope-Drift in Orchestrierung, Produktlogik oder App-/Wrapper-/Store-Themen
