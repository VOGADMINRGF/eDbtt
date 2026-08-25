# AI-CREATE-ORCHESTRATOR-LIVE-SMOKE-01 — Google/Gemini-/NotebookLM-Korrekturaudit

Stand: 2026-08-23

PR: #627 (Draft)

Branch: `fix/ai-create-orchestrator-live-smoke-01`

Auditierter Exact Head: `bae4812dcfa0457f1f877219991bab4536276b18`

## Ergebnis

Google/Gemini ist im Repository nicht nur eine Idee: Es gibt einen realen, optionalen Gemini-Netzwerkadapter für Text, Runtime-Policy, Probe-/Smoke-Unterstützung und reale E150-Journey-Zuordnungen. Im aktuellen `/create`-Materialpfad wird Gemini trotzdem **nicht ausgeführt**.

Der reale interaktive Pfad ist derzeit:

- Freitext: `/api/create/intelligent-followup` → Planner → im Happy Path OpenAI.
- HTML/PDF/YouTube mit Transcript: deterministischer Loader beziehungsweise Transcript-Adapter → `/api/create/link-analysis` → OpenAI-Dokumentanalyse.
- YouTube ohne Transcript: sichtbarer Fetch-/Manual-Fallback; kein Modellaufruf und insbesondere kein Gemini-Videoaufruf.

Der volle E150-Orchestrator wird von der aktuellen `/create`-UI weder nach dem Planner noch nach der Linkanalyse automatisch aufgerufen. `/api/create/analyze` delegiert zwar an `/api/contributions/analyze`, aber der aktuelle `CreateClient` ruft diese Route nicht auf. Die in `aiOrchestrationProvenanceTrace.ts` enthaltene Analyze-Stufe wird ohne `runId` folgerichtig als `planned_not_active` geführt.

Der Client sendet beim Planner-Aufruf außerdem `sourceUrls` und `materialItems`, doch das Request-Schema von `/api/create/intelligent-followup` nimmt diese Felder nicht an; Zod entfernt sie. Der Planner sieht nur den Freitext. Die bewusste Folgeaktion `/api/create/link-analysis` lädt genau eine erkannte Primär-URL. Das ist ein weiterer Grund, warum der aktuelle UI-Pfad keine Multi-Source-Orchestrierung darstellt.

Damit ist der reale `/create`-Happy-Path nicht nur Single-Provider, sondern auch **noch kein durchgehend ausgeführtes Spezialistenorchester**. Der E150-Pfad ist separat real multi-provider-fähig, verarbeitet Providerantworten derzeit aber als konkurrierende vollständige Kandidaten und wählt einen Best-Kandidaten. Er komponiert keine isolierten Spezialistenresultate.

Es wurde kein Provider aktiviert, kein Secret gelesen oder verändert und keine Production-Mutation ausgeführt.

## Vertrags-Hierarchie und Drift

Es gibt aktuell kein widerspruchsfreies einzelnes Provider-Soll. Vier vorhandene Schichten beschreiben unterschiedliche Zustände:

| Vertrag | Aussage | Laufzeitwahrheit |
| --- | --- | --- |
| `Part16_AI_Orchestration_and_Safety.md`, Issues #58/#59 | deterministischer Policy-Orchestrator ist Autorität; OpenAI primär für Intake/Reasoning/Dossier, Gemini/Anthropic sekundär, offene Modelle für Vorstrukturierung | Architekturkanon/Empfehlung, nicht direkt ausführbarer Router |
| `providerRoleRouting.ts` / V2-Policy | OpenAI `strict_primary`; Anthropic editorial; Mistral Draft/Extraktion; Gemini optional für Large Context, Multimodalität, Material und Research | operative Diagnose-/Policy-Metadaten; wird nicht als `/create`-Call-Graph ausgeführt |
| `journeyProfiles.ts` | Standard: Mistral Struktur, Gemini Fragen/Challenge, Anthropic Kontext, OpenAI Fallback; Material: Mistral Struktur + Anthropic Summary, kein Gemini/OpenAI-Fallback | wird vom E150-Orchestrator ausgeführt, aber alle Provider liefern vollständige Analyse-Kandidaten statt rollenisolierter Ergebnisse |
| `createPlanner.providerPlan` | Mistral Struktur, Claude Summary | rein deklarativ; kein Consumer führt diese Felder aus |

Das Material-Zielbild hat sich außerdem nachweisbar geändert:

1. `PR-CREATE-MATERIAL-ORCHESTRATION-01` vom 10. Mai beschrieb einen „NotebookLM“-Adapter und Gemini Research als Standard der Material-Lane.
2. Der damalige Adapter war bereits nur lokaler deterministischer Mock-Code (`notebooklm_adapter_mock`), keine NotebookLM-API.
3. Commit `dbd085ce` vom 23. Mai entfernte den Adapter aus `/api/contributions/analyze` und ersetzte ihn durch den review-first Material-Manifest-Vertrag.
4. Der heutige Vertrag setzt ausdrücklich `noAutoNotebook=true` und `noAutoGemini=true`; `researchMode=auto` startet keinen Provider. `materialProvider` ist immer `none`.

Die frühere Materialbeschreibung ist daher historische Designabsicht, aber kein noch aktiver Providervertrag.

## Provider-Soll/Ist

| Provider | im Repository vorgesehene Rolle(n) | Adapter/Modell | tatsächlich im aktuellen `/create` ausgeführt? | Grenze |
| --- | --- | --- | --- | --- |
| OpenAI | Planner/Reasoning/Strict Analyze; E150-Fallback/Presentation; aktuelle externe Dokumentanalyse | realer Adapter; Planner/Linkanalyse standardmäßig `gpt-4o-mini`, E150 standardmäßig `gpt-5` | ja; einziger Modellprovider im belegten `/create`-Happy-Path | übernimmt derzeit Planner und komplette Materialanalyse, nicht nur eine Spezialistenrolle |
| Mistral | Struktur, Claim-Atomisierung, Material-Extraktion, Draft-/Planner-Fallback | realer Textadapter; `mistral-large-latest` | nicht in der auditierten Umgebung; Credential fehlt | `structureProvider=mistral` ist im Planner nur Metadatum; im E150 ist Mistral ein Vollkandidat |
| Anthropic/Claude | Kontext, Editorial/Critic-nahe Perspektive, Summary, Planner-Fallback | realer Textadapter; `claude-sonnet-4-20250514` | nicht in der auditierten Umgebung; Credential fehlt | `summaryProvider=claude` ist im Planner nur Metadatum; keine isolierte Critic-Ausführung |
| Google/Gemini | E150-Fragen/Challenge; optional Large Context, Multimodalität, Material-Summary/-Extraktion und Research | realer GenerateContent-Textadapter; `gemini-2.5-flash` | nein; Probe auf Exact Head: `CONFIG_MISSING`, kein Upstream-Call | Adapter sendet ausschließlich `parts: [{text}]`; keine Datei-/URI-/Video-/Audio-/YouTube- oder Grounding-Tools |
| ARI/You.com | Search, Premium Deep Research, Arbiter beziehungsweise optionaler vollständiger E150-Kandidat | realer ARI-LLM-/Search-Code vorhanden; standardmäßig deaktiviert und approval-/credit-gated | nein | nicht Teil von `/create`; Legacy-`You`-Registry in `features/utils/ai/askers.ts` hat keinen Import-Consumer |
| Perplexity | Research Discovery/Search | Registry/Probe vorhanden | nein | `runPerplexitySearchQuery` liefert nur leeres Scaffold-Report; kein bezahlter Search-Aufruf |
| OpenAI Deep Research | expliziter Premium-Research-Fallback | Registry/Policy-Scaffold | nein | Adapterfunktion erzeugt nur leeres Report-Scaffold; Gate/Bestätigung/Credit erforderlich |
| Tavily/Brave/Serper/Custom | austauschbare spätere Research-Provider | Typen/Registry-Vertrag | nein | keine produktiven `/create`-Adapter |
| NotebookLM | historisch als Material-Verstehensschicht bezeichnet | nur unverdrahteter lokaler `notebookMaterialAdapter.ts` mit `provider: "notebooklm"` und Mock-Markern | nein | keine offizielle API, kein SDK, kein Netzwerkaufruf, kein aktueller Consumer |

Der gezielte Gemini-Probe-Lauf war metadata-only und scheiterte vor einem Netzwerkaufruf mit `status=config_missing`, `providerErrorCode=CONFIG_MISSING`, `finalContractStatus=blocked`. Ein echter Gemini-Smoke bleibt damit Environment-/Human-Gate.

## Soll-/Ist-Matrix nach Inputklasse

„Vorgesehen“ unterscheidet Architektur-/Policy-Absicht von produktiver Ausführung. Die Empfehlung in der letzten Spalte ist noch keine Implementierungsfreigabe.

| Inputklasse | vorgesehene Spezialistenrolle | vorhandener Provider/Adapter | tatsächlich ausgeführt? | fehlende Verbindung |
| --- | --- | --- | --- | --- |
| kurzer Freitext | Intake-Verstehen, Rückfrage und schlanke Strukturierung; Part16 sieht OpenAI primär, günstigere Vorstrukturierung optional | OpenAI-Planner; Anthropic/Mistral als sequenzieller Fehlerfallback | ja: im Happy Path genau ein OpenAI-Aufruf | kein Gap für den Fast Path; deklarierte Mistral-/Claude-Felder sollten nicht als ausgeführte Rollen erscheinen |
| komplexer Mehrthemen-Freitext | robuste Cluster/Struktur, Reasoning und optional Gegenprüfung | Planner kann OpenAI oder genau einen Fehlerfallback nutzen; E150 hat Mistral/Gemini/Anthropic-Profile | im `/create`-Planner nur ein Vollprovider; E150 nicht automatisch nachgelagert | typed `StructureResult`/`CriticResult`, Trigger und deterministischer Composer fehlen |
| normale Webseite | sicherer Fetch/HTML-Text, danach grounded Summary/Themen | `safeExternalFetch` + HTML-Extraktion + OpenAI-Dokumentanalyse | ja: deterministisch + ein OpenAI-Aufruf | keine Gemini-/Claude-Gegenprüfung; für normale, begrenzte Seiten nicht zwingend nötig |
| Partei-/Fraktionsprogramm | Long-Document-Coverage, Themenclustering, grounded Claims/Summary | Loader + 24.000-Zeichen-Anfang/Mitte/Ende-Auszug + OpenAI; Gemini Large Context nur Policyrolle | ja, aber ausschließlich OpenAI auf begrenztem Auszug | kein Volltext-/Coverage-Contract, kein Gemini-Long-Context-Router, keine rollenbasierte Komposition |
| wissenschaftliches PDF/Dossier | PDF-Extraktion, Quellabdeckung, Claims/Unsicherheit, unabhängiger Critic | `pdf-parse` + Limits + OpenAI; Mistral/Anthropic Material-E150; Gemini optional nur deklarativ | im `/create`-Pfad `pdf-parse` + OpenAI; E150 nicht automatisch | Gemini-Datei-/Long-Context-Adapter, per-Claim Evidence-Map und Critic-Contract fehlen |
| YouTube mit Transcript | Transcriptbeschaffung, Quellen-/Zeitbezug, Themen/Claims; Gemini als mögliche Long-/Media-Spezialistin | `youtube-transcript` + OpenAI; Gemini-Adapter ist text-only | ja: exakt `YouTube → Transcript → OpenAI` | kein Gemini-Transcript-/YouTube-Router, keine Timestamp-Evidence aus dem aktuellen Linkanalyse-Ergebnis |
| YouTube/Video ohne verwertbares Transcript | ehrliches Degraded/Manual; optional echtes multimodales Videoverständnis nur mit geprüftem Providervertrag | Transcript-Adapter; Gemini besitzt keinen Media-Input-Adapter | kein Modell; sichtbarer `fetch_failed` und Support-Handoff | offizieller, rechtlich/kostenmäßig gegateter Gemini-Media-Adapter und Multimodal-Evidence-Contract fehlen |
| sehr langes Multi-Source-Dossier | per-source Coverage, Widersprüche, Synthese, unabhängige Gegenprüfung | Material-Intake bis 18 Items; Grounding-Prompt nutzt höchstens 4 Dokumente mit je ca. 3 × 360 Zeichen plus 4 Webhinweise; E150 Vollkandidaten | nicht als echter Long-Context-/Multi-Source-Pfad | Map/Reduce- oder Source-Set-Contract, Gemini-Large-Context-Stufe, Quellenabdeckungsmetriken und Composer fehlen |

## Google/Gemini im Detail

### YouTube-/Video-Verständnis

Nicht implementiert. Der Gemini-Adapter kann nur Text übergeben. Es gibt weder `fileData`/`inlineData` noch File-Upload, Video-URI, YouTube-URI, Audio- oder Bildparts. Der vorhandene YouTube-Pfad lädt nur Captions über `youtube-transcript`.

### Transcript-/Source-Grounding

Teilweise als allgemeiner E150-Textpfad möglich, aber nicht als Gemini-Spezialistenvertrag. Ein Transcript kann technisch Teil des E150-Prompts werden; Gemini erzeugt dann trotzdem eine vollständige AnalyzeResult-Kandidatur mit Fragen-Schwerpunkt. Es gibt keine isolierte Coverage-/Zitat-/Timestamp-Ausgabe.

### Lange Dokumente und große Kontextfenster

Nur als Rollenmetadatum `optional_large_context` und V2-Policy-Notiz vorhanden. `/create/link-analysis` reduziert Quellen auf maximal 24.000 Zeichen. Der Material-Grounding-Prompt reduziert bis zu vier Dokumente auf Start-/Mitte-/Ende-Ausschnitte. Es gibt keinen längenabhängigen Gemini-Router und keinen Nachweis, dass der volle Dokumentkontext gesendet wurde.

### Multi-Source-Synthese

Nicht implementiert. Der E150-Orchestrator führt aktive Provider parallel aus, validiert vollständige Kandidaten und wählt einen Best-Kandidaten. Erfolgreiche Nebenkandidaten verändern lediglich Disagreement-/Confidence-Metadaten. Ein Claim-/Evidence-Merge ist in Part05 ausdrücklich erst als spätere Erweiterung genannt.

### Multimodale Quellen

Nicht implementiert. `optional_multimodal` ist ausschließlich eine Policyrolle. Weder `/create` noch der Gemini-Adapter besitzen einen produktiven multimodalen Requestvertrag.

### Gegenprüfung am Originalmaterial

Nicht als Gemini-Rolle implementiert. Quelleninventar, Textauszüge und nachgelagerte lokale Overlap-Prüfung existieren; Gemini erhält aber keine eigenständige Coverage-/Entailment-Aufgabe gegen das Original. Bei sehr langen Quellen ist die Gegenprüfung wegen der Ausschnittbildung ohnehin unvollständig.

## Ist `YouTube → Transcript → OpenAI` eine unnötige Reduktion?

Der aktuelle Pfad ist genau so reduziert. Es wurde aber **kein ehemals funktionierender Gemini-YouTube-Pfad abgeklemmt**:

- Die historische Gemini-Materialrolle war Research-/Routing-Metadatum, kein Aufruf.
- Der historische „NotebookLM“-Adapter war lokaler Mock und analysierte kein Video.
- Der aktuelle Gemini-Adapter war und ist text-only.
- Die spätere Production-Härtung verbietet automatische Notebook-/Gemini-Aufrufe bewusst.

Ein Wechsel zu Gemini kann daher nicht als Wiederanschließen eines bestehenden Pfads behandelt werden. Er wäre neue, kosten-, datenschutz-, Rechte-, Grounding- und Eval-pflichtige Produktlogik und gehört nicht ungeprüft in PR #627.

## NotebookLM separat

NotebookLM und Gemini sind im Repository nicht dasselbe:

- Es gibt keine NotebookLM- oder NotebookLM-Enterprise-API-Anbindung.
- Es gibt kein NotebookLM-SDK und keinen Netzwerkendpoint.
- `runNotebookMaterialAdapter` ist ein lokaler Formatter, der Labels und vorhandene Item-Texte in Claims/SourceRefs umformt.
- Der Adapter trägt ausdrücklich Mock-Marker und hat heute keinen Produktionsconsumer.
- Source-Grounding-Tests verwenden den String `notebooklm_adapter_mock` lediglich als vorhandenen `extractedBy`-Wert.

NotebookLM ist damit bisher Produkt-/Architekturidee plus irreführend benannter Mock, keine Integration. Es wird keine Browserautomation oder inoffizielle API empfohlen.

## Fachliches Zielbild

Das repo-konforme Zielbild bleibt graph-/policy-guided und deterministisch. Provider sind Werkzeuge; kein Provider ist Orchestrierungsautorität. Nicht jeder Provider läuft immer.

### Typed Spezialistenresultate

| Resultat | möglicher Spezialist nach bestehendem Vertrag | Inhalt |
| --- | --- | --- |
| `StructureResult` | Mistral | Segmente, Themencluster, atomare Claim-Kandidaten; noch keine kanonische Wahrheit |
| `GroundingCoverageResult` | Gemini, erst nach offiziellem Source-/Media-Adapter und Evals | pro Quelle Abdeckung, Evidence-Refs, unanalysierte Bereiche, multimodale/Long-Context-Hinweise |
| `CanonicalAnalysisResult` | OpenAI | E150-konforme Claims, Unsicherheiten, Verantwortlichkeiten und Rückfragen auf Basis der freigegebenen Source-/Strukturinputs |
| `CriticResult` | Anthropic/Claude | Widersprüche, fehlende Perspektiven, Überdehnung und Summary-Kritik; keine stille Umschreibung |
| `ComposedAnalyzeResult` | deterministischer Code + Validator | nur schema-valide und quellenreferenzierte Übernahme; Konflikte bleiben sichtbar |

Diese Zuordnung entspricht der Richtung vorhandener Rollen, aber nicht vollständig dem aktuellen `journeyProfiles`-Vertrag. Vor Umsetzung muss ein kanonischer Rollenvertrag die Drift zwischen Part16, V2-Policy, Journey-Profilen und Planner-Metadaten auflösen.

### Abhängigkeiten und Parallelität

1. Klassifikation, SSRF-sicherer Fetch, PDF-Parser beziehungsweise Transcript laufen immer zuerst und ohne LLM.
2. Bei komplexem Material können Strukturierung und Source-Coverage parallel laufen, da beide vom extrahierten Original abhängen.
3. Die kanonische E150-Analyse hängt von Originalmaterial und validierten Spezialistenoutputs ab.
4. Der Critic hängt vom kanonischen Draft und den Evidence-Refs ab; er ist kein paralleler Erstentwurf.
5. Ein deterministischer Composer übernimmt nur typisierte, validierte Felder. Nicht belegte oder widersprüchliche Inhalte bleiben `open`/`degraded` beziehungsweise reviewpflichtig.

### Fast Path und verpflichtender Multi-Provider-Pfad

- Ein einzelner Provider genügt für kurzen, klaren Freitext und normale begrenzte HTML-/Transcript-Quellen, sofern Schema, Grounding und Qualitätsgate grün sind.
- Multi-Provider sollte nur durch belegte Komplexitäts-/Risikomerkmale ausgelöst werden: sehr lange oder mehrere Quellen, multimodales Material, wesentliche Widersprüche, High-impact-/sealed-Prüfung oder unzureichende Source-Coverage.
- „Verpflichtend“ darf Multi-Provider erst werden, wenn die jeweiligen typed Outputs, Evals, Credentials, Kosten- und Degraded-Regeln produktiv vorhanden sind. Bis dahin muss der Pfad ehrlich manuell/degraded bleiben.

### Ausfall-, Kosten- und Latenzregel

- Jede Rolle braucht `planned | executed | skipped | failed`, `required | optional`, Provider, Modell, sichere Fehlerklasse und Source-Coverage.
- Fehlt eine optionale Rolle, darf ein validierter Fast Path fortfahren, aber die fehlende Gegenprüfung wird sichtbar.
- Fehlt eine verpflichtende Grounding-/Critic-Rolle, darf OpenAI sie nicht stillschweigend übernehmen. Entweder ein explizit erlaubter `runtime_rescue` wird protokolliert oder das Ergebnis bleibt degraded/reviewpflichtig.
- Fan-out nur nach Länge, Quellenzahl, Modalität, Risiko und Qualitätsgate; Extraktion cachen, parallele unabhängige Stufen begrenzen, pro Rolle ein enges Retry-/Fallbackbudget verwenden.
- Prompts, Quellvolltexte, PII und Secrets gehören nicht in Providerattempt-Metadaten.

Die heutigen technischen Grenzen sind enger und bleiben erhalten: Der Planner reserviert höchstens zwei sichtbare Provider-/Modellattempts bei 10 Sekunden Planner-Timeout und 1.200 Output-Tokens. Die Linkanalyse nutzt einen OpenAI-Happy-Path und höchstens einen zweiten OpenAI-Modellkandidaten bei `MODEL_NOT_FOUND` mit 2.000 Output-Tokens. E150 hat ein Gesamtbudget von 50 Sekunden, providerbezogene Timeouts (Gemini standardmäßig 18 Sekunden) und höchstens einen Retry je ausgeführtem Provider. Ein späterer Spezialistenpfad darf diese Grenzen nur durch eine explizite, getestete Lane-/Budgetentscheidung verändern.

## Gap-Liste und empfohlene Serialisierung

### Für #627

- Audit/Evidence korrigieren und PR Draft lassen.
- Keine Providerrolle aktivieren.
- Kein NotebookLM-/Gemini-/Composer-Umbau.
- Die vorhandenen Material-Smokes gelten als Beleg für Loader/Transcript/OpenAI, nicht als Beleg eines Gemini-/Multi-Provider-Orchesters.

### Unmittelbarer P0-Folgeslice nach Entscheidung

1. Einen kanonischen, ausführbaren Rollen-/Stage-Vertrag festlegen und die widersprüchlichen Diagnose-, Journey- und Planner-Metadaten darauf abbilden.
2. `planned` und `executed` strikt trennen; die generische E150-OpenAI-Runtime-Rescue als expliziten Fallback ausweisen oder lane-spezifisch verbieten.
3. Typed Spezialistenoutputs und deterministischen Composer mit Source-/Evidence-Validierung definieren, bevor zusätzlicher Fan-out aktiviert wird.
4. Danach separat einen offiziellen Gemini-Source-/Long-Context-/Multimodal-Adapter mit Contracttests, Kosten-/Consent-Gate und echten Provider-Evals prüfen.
5. Den toten NotebookLM-Mock entfernen oder neutral als lokalen Material-Manifest-Formatter benennen; keine NotebookLM-Integration behaupten.
6. Produktentscheidung treffen, ob und wann der volle E150-Lauf aus `/create` nach Planner/Materialanalyse tatsächlich gestartet wird.

Diese Punkte wurden nicht als neue OpenTasks-Zeilen serialisiert, weil die konkrete Rollen-/Routingentscheidung noch offen ist und der Auftrag ausdrücklich zunächst Audit plus Zielbild verlangt.

## Code- und Dokumentevidence

- `/create`-Call-Graph: `apps/web/src/app/create/CreateClient.tsx`, `apps/web/src/app/api/create/intelligent-followup/route.ts`, `apps/web/src/app/api/create/link-analysis/route.ts`
- Planner/Metadaten: `apps/web/src/features/create/createPlanner.ts`
- Source-Loader/Analyse: `apps/web/src/features/create/externalSourceIntake.ts`, `apps/web/src/features/create/externalSourceAnalysis.ts`
- YouTube: `features/ai/sources/youtube.ts`
- Gemini: `features/ai/providers/gemini.ts`, `features/ai/aiRuntimePolicy.ts`
- E150-Ausführung: `features/ai/orchestratorE150.ts`, `features/ai/e150/journeyProfiles.ts`
- Provider-/Lane-Policy: `apps/web/src/features/ai/providerRoleRouting.ts`, `apps/web/src/features/ai/v2OrchestrationPolicy.ts`
- Material-/Grounding-Vertrag: `apps/web/src/features/material/materialIntakeContract.ts`, `features/analyze/sourceGroundingContract.ts`
- NotebookLM-Mock: `apps/web/src/features/material/notebookMaterialAdapter.ts`
- historische/kanonische Docs: `Part05_Orchestrator_E150_Core.md`, `Part16_AI_Orchestration_and_Safety.md`, `PR-CREATE-MATERIAL-ORCHESTRATION-01_2026-05-10.md`, `MATERIAL-INTAKE-PRODUCTION-01_REVIEW_FIRST_UPLOADS_PDF_YOUTUBE_2026-05-23.md`, `V2-AI-ORCHESTRATION-CONSOLIDATION-01_2026-05-27.md`, `V2-MATERIAL-EXTRACTION-JOBS-01_2026-05-27.md`
- Issues: #48, #49, #56, #58, #59, #211 und #617

## Validierungsstatus

- Gemini Dry-run: Modell/Policy `gemini-2.5-flash`, keine Kostenbehauptung, kein Providercall.
- Gemini Probe: `CONFIG_MISSING`, `finalContractStatus=blocked`, kein Upstream-Request; echter Provider-Smoke bleibt Human-/Environment-Gate.
- Contract-/Adaptertests: 9 Dateien / 88 Tests grün (`ai-provider-smoke-cli`, Runtime-Policy, Providerrollen, E150-Journey/Runtime, Material-Routing/-Intake, Source-Grounding und Create-Linkanalyse).
- PR #627 bleibt Draft.
