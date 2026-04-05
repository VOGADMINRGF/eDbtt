# GOV-AI-05 - Prompt/Output Contract Inventory (2026-04-05)

## Scope

Research-only Abschluss fuer `GOV-AI-05`:
- kein KI-Grossumbau
- keine neue Orchestrierungsarchitektur
- kein globaler Prompt-Rewrite
- nur Inventar + Gap-Liste + versionierbare Contract-Richtung

## Kurzfazit

`GOV-AI-05` kann als Parent auf `done` gehen:
- Das geforderte Ist-Inventar fuer produktkritische Prompt-/Output-Grenzen liegt vor.
- Die relevante Gap-Liste ist konkret und implementierbar.
- Ein klar begrenzter technischer Folge-Slice (`GOV-AI-05A`) ist benannt.

## Inventar-Matrix (produktkritische Prompt-/Output-Grenzen)

| Pfad / Route / Service | Zweck | Prompt/Input-Contract explizit | Output typed/normalized | Audit-/Governance-kritisch | Gap / Risiko | Folge-Slice noetig |
| --- | --- | --- | --- | --- | --- | --- |
| `features/analyze/analyzeContribution.ts` + `features/analyze/schemas.ts` | Kern-Analyse fuer `/create`, Factcheck- und Folgepfade | teilw. (Prompt-Builder + `validateRaw`, aber kein explizites promptVersion-Tag im Aufruf) | ja (Sanitizer + `AnalyzeResultSchema.safeParse`) | ja | `RunReceipt` hat `promptVersion`, wird hier aber nicht explizit gesetzt; Prompt-Versionierung dadurch uneinheitlich | ja |
| `apps/web/src/app/api/contributions/analyze/parseAnalyzeRequest.ts` | Intake-Parser fuer Analyze-Route | ja (Zod-Schema + Transform) | ja (normalisierte Parsed-Form) | ja | kein explizites Request-Schema-Tag (`schemaVersion`) fuer langfristige Audit-Paritaet | optional |
| `apps/web/src/features/create/analyzeContract.ts` + `apps/web/src/features/create/analyzeBoundaryContract.ts` + `apps/web/src/features/create/analyzeEnvelope.ts` | Create Analyze/Match/CTA Contract-Basis | ja (`create_analyze.v1`, Boundary-/Envelope-Parser) | ja | ja | Kern stabil; Rest-Gap nur bei engerer Typisierung von freien Feldern (`unknown[]`) | nein |
| `apps/web/src/app/api/contributions/analyze/route.ts` | Analyze-API mit Match/CTA-Anbindung | teilw. (typed request parsing vorhanden) | teilw. (`createAnalyze` typed, `result` heterogen je Degrade/Fallback) | ja | kein einheitlicher top-level Response-Envelope mit eigener `schemaVersion`; Risiko fuer driftige Client-Parser | ja |
| `apps/web/src/app/api/contributions/refine/route.ts` | Claim-Refinement vor Weiterverarbeitung | nein (nur Prompt-String) | teilw. (coerceOutput), aber ohne Zod/Version | ja | freies `JSON.parse` + ad-hoc Coercion, kein `promptVersion`/`contractVersion` | ja |
| `apps/web/src/app/api/contributions/trace/route.ts` | Attribution/Guidance-Output fuer Statements | nein (nur Prompt-String) | nein (nur `JSON.parse`, kein typed Parse) | ja | kritischer Freitext-Output ohne versionierten Envelope; Parser-Drift-Risiko | ja |
| `apps/web/src/app/api/contributions/analyze/save/route.ts` | Legacy-nahe Analyze-Save-Pfad | teilw. (inline JSON-Schema in Request an OpenAI) | teilw. (lokale Nachbearbeitung), kein shared Contract | mittel | isolierter Prompt-/Schema-Pfad ohne shared versionierten Contract; Drift-Risiko gegen Haupt-Analyze-Pfad | ja |
| `apps/web/src/app/api/factcheck/enqueue/route.ts` + `features/factcheck/db.ts` | Factcheck-Queue/Folgeverdichtung auf Analyze-Basis | ja (Zod Input + typed Analyze-Result Nutzung) | ja (Status-/Claim-Normalisierung) | ja | prompt/output Herkunft wird genutzt, aber Prompt-/Contract-Version wird nicht als eigener Job-Meta-Standard mitgefuehrt | optional |
| `apps/web/src/app/api/finding/upsert/route.ts` + Dossier-Upsert-Routen | Finding-/Dossier-Write-Kontrakte | ja (Zod Body-Schemas) | ja | ja | kein Prompt-Contract-Risiko im Route-Code selbst; eher Upstream-Provenance-Thema | nein |

## Gaps (priorisiert)

1. **Unversionierte Prompt-/Output-Grenzen in Refine/Trace**
   - freies `JSON.parse` ohne shared typed parser/envelope
   - hohes Drift-Risiko fuer reproduzierbare Governance-/Audit-Nachvollziehbarkeit

2. **Uneinheitliche Version-Metadaten im Analyze-Hauptpfad**
   - `create_analyze.v1` ist stabil, aber top-level Analyze-Response ist nicht als eigener versionierter Envelope normiert
   - `RunReceipt.promptVersion` ist vorhanden, wird im Kernpfad nicht konsistent befuellt

3. **Legacy-near Analyze-Save Sonderpfad**
   - separates Prompt-/Schema-Handling statt shared Contract-Helfer
   - mittleres Drift-Risiko gegen den kanonischen Analyze-Pfad

## Versionierbare Richtung (entscheidungsfrei, vorbereitbar)

Fuer den Folge-Slice `GOV-AI-05A`:

- Shared minimaler Prompt-/Output-Envelope fuer die kritischen Routen:
  - `contractVersion`
  - `promptVersion`
  - `outputVersion`
  - `degraded` + `degradeReason`
- Typed Parser (Zod/Schema-Guard) statt freiem `JSON.parse` in:
  - `contributions/refine`
  - `contributions/trace`
  - `contributions/analyze/save`
- Kein neuer Orchestrator, keine neue Produktlogik, kein globaler Rewrite.

## Bewusst nicht Teil dieses Slices

- keine Migration aller KI-Routen auf ein neues globales Framework
- kein Umbau von Atlas/Social/Create/Runden-Produktlogik
- keine neue Governance-Policy
- kein Wrapper-/Store-/App-Scope

