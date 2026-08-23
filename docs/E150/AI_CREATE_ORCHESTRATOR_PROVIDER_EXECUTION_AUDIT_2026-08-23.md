# AI-CREATE-ORCHESTRATOR-LIVE-SMOKE-01 — Provider-Ausführungsaudit

Stand: 2026-08-23

PR: #627 (Draft)

Branch: `fix/ai-create-orchestrator-live-smoke-01`

Auditierter Runtime-Head: `32a7569afa8dbdc1de1ff4d31309fb4bf3072d92`

## Kurzbefund

Der reale `/create`-Happy-Path ist in der auditierten Operator-Umgebung **Single-Provider OpenAI**:

- Freitext: ein Planner-Aufruf an OpenAI, real belegt mit `gpt-4o-mini`.
- HTML, Partei-/Programmdokument, PDF/Studie und YouTube-Transcript: je ein vollständiger Dokumentanalyse-Aufruf an OpenAI, real belegt mit `gpt-4o-mini`.
- Ein nachgelagerter Analyze/E150-Lauf: ein OpenAI-Aufruf, real belegt mit `gpt-5-2025-08-07`, weil nur OpenAI runtime-aktiv war.

`providerPlan.structureProvider = "mistral"` und `providerPlan.summaryProvider = "claude"` sind im Create-Planner **rein deklarative Metadaten**. Es gibt keinen Produktionsaufruf, der diese beiden Felder liest und anschließend Mistral beziehungsweise Anthropic ausführt. Auch die Material-Journey des E150-Orchestrators wird von `/api/create/link-analysis` nicht verwendet.

Der E150-Orchestrator selbst kann mehrere Provider real ausführen. Er komponiert deren Spezialistenresultate aber nicht: Mistral, Anthropic und Gemini erzeugen jeweils einen vollständigen Analyse-Kandidaten; anschließend wird genau ein Kandidat nach Validität, Providergewicht, Laufzeit und Health-Score ausgewählt. Die übrigen erfolgreichen Kandidaten wirken nur auf Disagreement-/Confidence-Metadaten.

Es wurden keine Provider aktiviert, keine Secrets gelesen oder verändert und keine Production-Mutation durchgeführt.

## Auditiertes Laufzeitprofil

Die lokale Policy-Ausgabe enthielt ausschließlich Boolesche Verfügbarkeit, Providerreihenfolge, Modelle und Budgets; keine Secretwerte:

| Provider | Adapter vorhanden | Im Audit-Prozess aktiv | Reale Erreichbarkeit belegt | Modell/Default |
| --- | --- | --- | --- | --- |
| OpenAI | ja | ja | ja; Planner, Materialanalyse und E150 erfolgreich | Planner/Material `gpt-4o-mini`; E150 `gpt-5`, reale Antwort `gpt-5-2025-08-07` |
| Anthropic | ja | nein | nein; ohne Credential nicht aufgerufen, nur Mock-/Contract-Evidence | `claude-sonnet-4-20250514` |
| Mistral | ja | nein | nein; ohne Credential nicht aufgerufen, nur Mock-/Contract-Evidence | `mistral-large-latest` |
| Gemini | ja | nein | nein; außerhalb des angefragten Providerfokus, aber Teil des E150-Analyze-Profils | `gemini-2.5-flash` |

Die deklarierte Reihenfolge war `openai → anthropic → mistral → gemini`; `enabledRuntimeProviders` enthielt nur `openai`. Daraus darf keine Aussage über Secretbelegung oder Erreichbarkeit in einer anderen Umgebung abgeleitet werden. Der Exact-Head-Preview bleibt hinter Vercel SSO; dieser Audit umgeht das Gate nicht.

## Stufenmatrix

`real` bedeutet einen tatsächlich erreichbaren Produktionsaufruf im Pfad. `deklarativ` bedeutet Policy-/Result-Metadaten ohne Ausführung in dieser Stufe.

| Input | Stage | Provider | Modell | Rolle | real/deklarativ | Fallback |
| --- | --- | --- | --- | --- | --- | --- |
| Freitext | `detectCreateLinkIntake` → `resolveMaterialRouting` → Draft-Save | keiner | – | Link-/Materialklassifikation und nicht-publizierter Arbeitsstand | real, nicht-KI | kein Providerfallback |
| Freitext | `/api/create/intelligent-followup` → `buildCreateIntelligentFollowup` → `buildCreatePlanner` | OpenAI | erster Kandidat `gpt-4o-mini`, zweiter Kandidat `gpt-5` | vollständiges `planner_only`: Themen, Cluster, Scope, Rückfragen, Kurzsummary | real; Exact-Head-Smoke: 1 erfolgreicher Aufruf mit `gpt-4o-mini` | zweites OpenAI-Modell nur bei `MODEL_NOT_FOUND`; sonst höchstens ein vollständiger Anthropic- oder Mistral-Planner als alternativer Provider; danach lokaler degraded Planner |
| Freitext | `providerPlan.structureProvider` | Mistral | `mistral-large-latest` | behauptete Strukturrolle | **deklarativ**; kein Runtime-Consumer | keiner |
| Freitext | `providerPlan.summaryProvider` | „claude“/Anthropic | `claude-sonnet-4-20250514` | behauptete Summaryrolle | **deklarativ**; kein Runtime-Consumer | keiner |
| Freitext in Analyze-Produktmodus, nach Planner | `/api/contributions/analyze` → `analyzeContribution` → E150 | bei vollständiger Konfiguration Mistral + Anthropic + Gemini; OpenAI als Fallback | Policy-Modelle | vollständige konkurrierende Analyse-Kandidaten mit Rollenhinweisen | real multi-provider-fähig, aber nicht kompositorisch; im Audit real nur OpenAI `gpt-5-2025-08-07` | OpenAI erst, wenn kein Primary-/Secondary-Kandidat validiert; bei fehlenden geplanten Primaries greift generische Runtime-Rescue |
| längeres Partei-/Fraktionsprogramm als HTML | Linkklassifikation → Safe Fetch → HTML-Sanitizing/Text-Extraktion | keiner | – | URL-Prüfung, SSRF-Grenze, Fetch und Quelltextgewinnung | real, nicht-KI | fail-closed vor Modell bei nicht belastbarem Inhalt |
| längeres Partei-/Fraktionsprogramm als HTML | `/api/create/link-analysis` → `runCreateExternalSourceAnalysis` | OpenAI | `gpt-4o-mini` im realen SPD-Smoke | vollständige Themen-, Summary- und Zähleranalyse des extrahierten Dokuments | real; 1 erfolgreicher Aufruf | nur zweites OpenAI-Modell bei `MODEL_NOT_FOUND`; kein Anthropic-/Mistral-Fallback |
| wissenschaftliche Studie/PDF | Linkklassifikation → Safe Fetch → MIME/`%PDF-`-Prüfung → `pdf-parse` mit Seiten-/Zeit-/Zeichenlimit | keiner | – | Dokumenttyp erkennen und PDF-Inhalt extrahieren | real, nicht-KI | fail-closed bei Spoofing, Limit oder fehlender Textschicht |
| wissenschaftliche Studie/PDF | `/api/create/link-analysis` → `runCreateExternalSourceAnalysis` | OpenAI | `gpt-4o-mini` im realen Mozilla/PDF.js-Smoke | vollständige Dokumentanalyse aus bounded Anfang-/Mitte-/Ende-Auszug | real; 1 erfolgreicher Aufruf | nur zweites OpenAI-Modell bei `MODEL_NOT_FOUND`; kein Anthropic-/Mistral-Fallback |
| normale HTML-Quelle | Linkklassifikation → Safe Fetch → HTML-Sanitizing/Text-Extraktion | keiner | – | Seitentitel und Fließtext laden | real, nicht-KI | fail-closed vor Modell |
| normale HTML-Quelle | `/api/create/link-analysis` → `runCreateExternalSourceAnalysis` | OpenAI | `gpt-4o-mini` im realen W3C-Smoke | vollständige Dokumentanalyse | real; 1 erfolgreicher Aufruf, 3 validierte Themen | nur zweites OpenAI-Modell bei `MODEL_NOT_FOUND` |
| YouTube mit Transcript | YouTube-Klassifikation → `features/ai/sources/youtube.ts` → Transcript-Adapter | keiner | – | Video-ID und reale Caption-Segmente laden | real, nicht-KI | sichtbarer `fetch_failed`-/Manual-Fallback ohne Modell, wenn kein Transcript verfügbar ist |
| YouTube mit Transcript | `/api/create/link-analysis` → `runCreateExternalSourceAnalysis` | OpenAI | `gpt-4o-mini` im realen W3C-WAI-Smoke | vollständige Analyse des Transcripts | real; 1 erfolgreicher Aufruf | nur zweites OpenAI-Modell bei `MODEL_NOT_FOUND`; kein Anthropic-/Mistral-Fallback |
| Material in späterem Analyze-Handoff | `/api/contributions/analyze` mit `materialItems` → E150 `material_grounding` | deklariert Mistral + Anthropic | Policy-Modelle | `structure` und `readable_summary` | real ausführbar, falls beide Provider aktiv sind; Resultate bleiben konkurrierende Vollanalysen | Profil deklariert keinen OpenAI-Fallback; generische Runtime-Rescue führte bei nur aktivem OpenAI trotzdem OpenAI aus |
| E150 Presentation Pass | `runNonMutativePresentationPass` | Metadatum `openai` | keines | Stil-/Lesbarkeitsnormalisierung | **lokal und deklarativ hinsichtlich Provider**; kein Modell-/Netzaufruf | lokaler Guard verwirft mutative Änderungen |

## Reale Exact-Head-Evidence

Die Smokes gaben nur Provider, Modell, Status, Dauer, Counts und Hashes aus; keine Prompts, Volltexte, PII oder Secrets.

| Lauf | Resultat |
| --- | --- |
| Freitext-Planner | OpenAI `gpt-4o-mini`; Attempt 1 `succeeded`; 2 validierte Themen; `structureProvider=mistral` und `summaryProvider=claude` blieben Metadaten |
| SPD-Programm, HTML | OpenAI `gpt-4o-mini`; 1 Attempt; 9 validierte Themen; Original-URL einzige Evidence-Referenz |
| Mozilla/PDF.js-Studie | OpenAI `gpt-4o-mini`; 1 Attempt; 3 validierte Themen; Original-PDF-URL einzige Evidence-Referenz |
| W3C-WAI-YouTube | OpenAI `gpt-4o-mini`; 1 Attempt; Transcript geladen; Original-Video-URL einzige Evidence-Referenz |
| normale W3C-HTML-Seite | HTTP 200, 12.620 extrahierte Zeichen; OpenAI `gpt-4o-mini`; 1 Attempt; 3 validierte Themen; Original-URL erhalten |
| E150 `analyze` | ein erster Lauf endete transient mit `ANALYZE_PROVIDER_FAILED`; der abgegrenzte Wiederholungslauf war mit OpenAI `gpt-5-2025-08-07`, Attempt 1 und 3 Claims erfolgreich. Kein reproduzierbarer deterministischer Defekt belegt |
| E150 `material_grounding` bei ausschließlich aktivem OpenAI | OpenAI `gpt-5-2025-08-07`, Attempt 1, 5 Claims; `fallbackUsed=false`, obwohl das Rollenmapping OpenAI weder als Primary noch Fallback nennt |

Der letzte Lauf belegt eine Observability-/Policy-Abweichung: Das ausgegebene Rollenmapping beschreibt den Journey-Plan, nicht zwingend die tatsächliche Execution. Ursache ist die generische E150-Regel, bei null aktiven geplanten Primaries alle runtime-erlaubten Nicht-Fallback-Provider als Primary auszuführen.

## Aufrufbudgets

Es sind zwei Zählebenen zu unterscheiden:

- **Orchestrator-Attempt**: sichtbarer Provider-/Modellversuch in Planner-, Material- oder E150-Metadaten.
- **physischer Upstream-Request**: tatsächlicher HTTP-Request an eine Modell-API. Der OpenAI-Adapter darf bei inkompatiblem Strict-JSON-Schema einmal intern auf `json_object` wechseln; der Anthropic-Adapter darf bei 404 einmal auf ein explizit abweichendes Fallback-Modell wechseln. Diese internen Requests sind nicht als separate Orchestrator-Attempts sichtbar.

| Pfad/Stufe | Happy Path | maximales sichtbares Attempt-Budget | maximales physisches Request-Budget |
| --- | ---: | ---: | ---: |
| Freitext-Planner | 1 | 2 gesamt über OpenAI-Modellwechsel **oder** alternativen Provider | 4 einschließlich möglicher Adapter-Kompatibilitäts-/Modellfallbacks |
| HTML/PDF/YouTube-Dokumentanalyse | 1 | 2, beide OpenAI; Wechsel nur bei `MODEL_NOT_FOUND` | 4 einschließlich möglicher OpenAI-Formatfallbacks |
| E150 `analyze`, aktuelle Umgebung nur OpenAI | 1 | 2 | 2; E150 fordert direkt `json_object` an |
| E150 `analyze`, OpenAI + Mistral + Anthropic + Gemini aktiv | 3 parallele Primary-Attempts; OpenAI wird nicht benötigt | 8: je 2 für 3 Primaries plus 2 OpenAI-Fallback-Attempts, falls kein Kandidat validiert | 10, falls zusätzlich beide Anthropic-Attempts jeweils einen abweichenden Modellfallback benötigen |
| E150 `material_grounding`, Mistral + Anthropic aktiv | 2 parallele Primary-Attempts | 4; kein deklarierter OpenAI-Fallback | 6 einschließlich möglicher Anthropic-Modellfallbacks |
| gesamter Freitext-Analyze-Happy-Path, aktuelle Umgebung | 2: Planner + E150 | 4 sichtbare Attempts | höchstens 6 physische Requests |
| initiales externes Materialresultat | 1 | 2 | höchstens 4 physische Requests; E150 läuft hier nicht automatisch |

Provider-Probes (`/models`) sind zusätzliche externe HTTP-Requests, aber keine Analyse-/Completion-Aufrufe. Sie laufen nur für aktive E150-Provider und werden standardmäßig 60 Sekunden gecacht. `PROVIDER_PROBE_MODE=deep` kann für OpenAI statt des leichten Model-Probes einen minimalen Responses-Request ausführen; das war im Audit nicht aktiv.

Alle E150-Maxima sind zusätzlich durch das 50-Sekunden-Orchestratorbudget begrenzt. Ein Budgetabbruch kann die praktisch erreichte Zahl reduzieren.

## Fallback-Wahrheit

### Create-Planner

1. OpenAI läuft zuerst.
2. Nur `MODEL_NOT_FOUND` erlaubt innerhalb von OpenAI den nächsten Modellkandidaten.
3. Nach einem anderen OpenAI-Fehler kann genau ein aktiver alternativer Provider nach Runtime-Reihenfolge übernehmen: Anthropic oder Mistral.
4. Der alternative Provider erfüllt erneut die **gesamte** `planner_only`-Rolle. Er ist weder isolierter Struktur- noch Summary-Spezialist.
5. Nach zwei reservierten Attempts folgt nur der lokale degraded Planner.

### Externe Materialanalyse

1. Nach erfolgreicher nicht-KI-Extraktion läuft ausschließlich OpenAI.
2. Ein zweiter Modellkandidat wird nur bei `MODEL_NOT_FOUND` versucht.
3. Anthropic und Mistral sind in diesem Pfad nicht verdrahtet.
4. Bei Fetch-/Transcript-/Parserfehlern läuft gar kein Modell; der Pfad degradiert ehrlich.

### E150

1. Aktive Journey-Primaries laufen parallel und erzeugen vollständige Kandidaten.
2. Secondary-Provider, die bereits Primary sind, werden dedupliziert und nicht noch einmal als Cross-Check ausgeführt.
3. Fallback-Provider laufen nur, wenn kein Primary-/Secondary-Kandidat validiert.
4. Bei null aktiven geplanten Primaries greift eine generische Runtime-Rescue. Dadurch kann ein im Journey-Rollenmapping nicht genannter Provider real als Primary laufen.
5. Pro ausgeführtem Provider gibt es höchstens einen Retry für `TIMEOUT`, `RATE_LIMIT`, `INTERNAL` oder `BAD_JSON` auf Adapterebene.

## Bewertung der Spezialistenrollen

### Beibehalten

- Nicht-KI-Klassifikation, SSRF-sicherer Fetch, PDF-Parser und Transcript-Adapter bringen klaren Mehrwert: Sie schaffen belastbares Source-Grounding vor jedem Modellaufruf.
- Providerfallback im Create-Planner und im Standard-E150 bringt reale Ausfall- und Vendor-Resilienz, ohne zusätzliche Happy-Path-Aufrufe zu erzwingen.
- Ein optionales Disagreement-Signal aus mehreren unabhängigen Kandidaten kann für risikoreiche Prüfpfade sinnvoll sein, sofern Qualität, Kosten und Latenz gemessen werden.

### Nicht automatisch reaktivieren

- `structureProvider=mistral` und `summaryProvider=claude` erzeugen heute keinen fachlichen Effekt. Eine Aktivierung nur zur Erfüllung der Metadaten würde Kosten und Latenz erhöhen, ohne einen belegten Merge-/Kompositionsvertrag.
- Das E150-`material_grounding`-Profil verspricht spezialisierte Rollen, wählt praktisch aber nur einen vollständigen Kandidaten. Solange Struktur und Summary nicht nachvollziehbar komponiert werden, ist der zusätzliche Fan-out überwiegend Komplexität.
- Der OpenAI-„Presentation Pass“ sollte nicht als Providerleistung verstanden werden, solange er rein lokal bleibt.

### Empfohlene spätere Vertragsentscheidung

Ohne Änderung in PR #627 sollte entschieden werden zwischen:

1. **Vereinfachen:** tote `structureProvider`-/`summaryProvider`-Felder nach einer Contract-Migration entfernen und nur tatsächlich ausgeführte Provider/Attempts ausgeben.
2. **Explizit deklarativ halten:** Felder als `plannedRoleAssignments` mit `executionState: not_executed` kennzeichnen.
3. **Später evidenzbasiert reaktivieren:** nur wenn ein echter, getesteter Kompositionsvertrag festlegt, welches Spezialistenresultat übernommen wird und wie Grounding, Konflikte, Kosten und Latenz geprüft werden.

Zusätzlich sollte die generische E150-Runtime-Rescue entweder als bewusster `runtime_rescue`-Fallback in `roleProviderMapping`/`fallbackUsed` sichtbar werden oder für Journeys ohne Fallback explizit verboten werden. Das ist eine Policy-/Produktentscheidung; dieser Audit ändert das Laufzeitverhalten nicht.

## Code-Evidence

- Create-Client-Staging: `apps/web/src/app/create/CreateClient.tsx`
- Planner und deklarativer `providerPlan`: `apps/web/src/features/create/createPlanner.ts`
- External-Source-Analyse: `apps/web/src/features/create/externalSourceAnalysis.ts`
- Linkroute und Failure-Handoff: `apps/web/src/app/api/create/link-analysis/route.ts`
- Source-Loader: `apps/web/src/features/create/externalSourceIntake.ts`
- YouTube-Transcript: `features/ai/sources/youtube.ts`
- E150-Journey-Plan: `features/ai/e150/journeyProfiles.ts`
- E150-Execution/Scoring/Fallback: `features/ai/orchestratorE150.ts`
- kanonische Analyze-Auswertung: `features/analyze/analyzeContribution.ts`
- lokaler Presentation Pass: `features/ai/e150/presentationPass.ts`
- Provideradapter: `features/ai/providers/openai.ts`, `features/ai/providers/anthropic.ts`, `features/ai/providers/mistral.ts`
- Runtime-Policy: `features/ai/aiRuntimePolicy.ts`

## Scope-Entscheidung

Es wurde kein funktionaler Code geändert. Der einmalige E150-Fehler war im abgegrenzten Wiederholungslauf nicht reproduzierbar. Die irreführenden Rollen-/Fallback-Metadaten sind echte Architektur- und Observability-Befunde, deren Korrektur eine Vertragsentscheidung und gegebenenfalls Migration erfordert; sie wurden gemäß Auftrag dokumentiert statt in neue Produktlogik umgewandelt.

## Validierung

- 7 fokussierte Planner-/Provider-/External-Source-/E150-Testdateien: 50 Tests grün.
- 2 fokussierte E150-Presentation-/Verification-Testdateien: 12 Tests grün.
- reale read-only Smokes: Planner, normale HTML-Quelle, E150 `analyze` und E150 `material_grounding`; zusätzlich Wiederverwendung der bereits auf demselben Runtime-Head belegten SPD-HTML-, Studien-PDF- und YouTube-Transcript-Resultate.
- `git diff --check`: grün.

PR #627 bleibt Draft. `docs/E150/OpenTasks.md` bleibt wegen des dokumentierten Single-Writer-Governance-Slices unverändert.
