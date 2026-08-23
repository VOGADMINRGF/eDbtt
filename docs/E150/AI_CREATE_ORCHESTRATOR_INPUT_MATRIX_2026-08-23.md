# AI-CREATE-ORCHESTRATOR-LIVE-SMOKE-01 — `/create`-Input-Matrix

Stand: 2026-08-23

PR: #627

Branch: `fix/ai-create-orchestrator-live-smoke-01`

Ausgangs-Head dieses Matrix-Slices: `6a630fb808e974c8ece37b929d11a6fc5173492f`

## Scope und Grenzen

Geprüft wurde die bestehende Kette für Freitext, HTML, Partei-/Fraktionsprogramm, PDF/Dokument, Studie/Dossier und YouTube. Es wurde kein neuer Create-Flow eingeführt. Externe Smokes waren read-only; es gab keinen Upload, kein Publish, keine Production-Mutation und keine dauerhafte Übernahme fremder Inhalte ins Repository.

Fixture-Providerantworten enthalten ausschließlich synthetische Inhalte. Providerattempts werden nur mit Attempt-Nummer, Provider, Modell, Status, Result-Code, Antwortlänge und SHA-256-Hash geprüft. Prompts, Eingabetexte, Cookies, User-IDs, Secrets und PII sind nicht Teil der Attempt-Metadaten.

## Automatisierte Matrix

| Matrixzeile | Erkannter Input-Typ | Bestehende Route | HTTP | `sourceType` | `sourceLoaded` | `analysis.state` | Themen | Claims/Statements | Quellen-/Evidence-Referenz | Degraded | Support-Handoff | Providerattempts |
| --- | --- | --- | ---: | --- | --- | --- | ---: | ---: | --- | --- | --- | --- |
| kurzer Ein-Themen-Freitext | `claim` | `/api/create/save` → `/api/create/intelligent-followup` | 200 | `text` | `true` | `result_ready` | 1 | 1 | eigener Input über Content-Hash, keine externe URL | nein | nein | 1 sicherer Mock-Attempt, `succeeded` |
| Mehrthemen-Freitext | `free_text` | `/api/create/save` → `/api/create/intelligent-followup` | 200 | `text` | `true` | `result_ready` | 3 | 1 | eigener Input über Content-Hash, keine externe URL | nein | nein | 1 sicherer Mock-Attempt, `succeeded` |
| langer politischer/programmatischer Text | `claim` | `/api/create/save` → `/api/create/intelligent-followup` | 200 | `text` | `true` | `result_ready` | 5 | 1 | eigener Input über Content-Hash, keine externe URL | nein | nein | 1 sicherer Mock-Attempt, `succeeded` |
| normale HTML-Seite mit Titel und Fließtext | `link` | `/api/create/link-analysis` | 200 | `document` | `true` | `result_ready` | 1 | 1 Summary-Statement | Original-URL in `sourceUrl` und `evidenceReferences` | nein | nein | 1 Mock-Providercall; keine öffentliche Attempt-Payload |
| unerreichbare/gesperrte URL | `link` | `/api/create/link-analysis` | 200, sicherer Ergebnis-Envelope | `link` | `false` | `fetch_failed` | 0 | 0 | Original-URL bleibt referenziert | ja, `fetch_failed` | ja, sicherer Ticketvertrag | 0 |
| Partei-/Fraktionsprogramm als HTML | `link` | `/api/create/link-analysis` | 200 | `document` | `true` | `result_ready` | 3 | 1 Summary-Statement | Original-URL; Themen aus synthetischem HTML-Fixture | nein | nein | 1 Mock-Providercall |
| Partei-/Fraktionsprogramm als direkter PDF-Link | `document_url` | `/api/create/link-analysis` | 200 | `document` | `true` | `result_ready` | 3 | 1 Summary-Statement | Original-URL; PDF-Text statt URL-Text | nein | nein | 1 Mock-Providercall |
| Studie/Dossier als extensionloser MIME-PDF | vor Fetch `link`, nach MIME `pdf`/`document` | `/api/create/link-analysis` | 200 | `document` | `true` | `result_ready` | 2 | 1 Summary-Statement | Original-URL; 2 erkannte Seiten | nein | nein | 1 Mock-Providercall |
| PDF ohne extrahierbare Textschicht | `document_url` | `/api/create/link-analysis` | 200, sicherer Ergebnis-Envelope | `document` | `false` | `fetch_failed` | 0 | 0 | Original-URL bleibt referenziert | ja, `fetch_failed` | ja, sicherer Ticketvertrag | 0 |
| YouTube mit Transcript-Fixture | `youtube_video_url` | vorhandener `features/ai/sources/youtube.ts`-Pfad → `/api/create/link-analysis` | 200 | `document` | `true` | `result_ready` | 1 | 1 Summary-Statement | Original-YouTube-URL | nein | nein | 1 Mock-Providercall |
| YouTube ohne Transcript | `youtube_video_url` | vorhandener `features/ai/sources/youtube.ts`-Pfad → `/api/create/link-analysis` | 200, sicherer Ergebnis-Envelope | `link` | `false` | `fetch_failed` | 0 | 0 | Original-YouTube-URL bleibt referenziert | ja, `fetch_failed` | ja, sicherer Ticketvertrag | 0 |

Wichtig: HTTP 200 bei Fetch-/Transcript-Fehlern ist der bestehende sichere `/create`-Ergebnisvertrag, kein behaupteter Analyseerfolg. Der fachliche Zustand bleibt `fetch_failed`, ohne Themen, Claims oder Zusammenfassung.

## Reale read-only Operator-Smokes

Ausgeführt mit `pnpm -C apps/web run create:input-matrix-smoke`. Der Harness verwendet denselben Source-Loader wie `/api/create/link-analysis`, startet aber bewusst keinen geheimnisabhängigen Modellaufruf. Er protokolliert keine Inhalte, sondern nur URL, Typ, Status, Länge, Seitenzahl, MIME und SHA-256-Hash.

| Quelle | Typ/Status | Extraktion | Ergebnis an der belegten Grenze |
| --- | --- | --- | --- |
| `https://www.w3.org/TR/WCAG22/` | HTML, HTTP 200 | 155.350 Zeichen; SHA-256 `64fd73cdb7725d9511488f5de6386081329d365872547b2d5000ef771ac37bd0` | `link`, `sourceLoaded=true`, `content_loaded`, nicht degraded |
| `https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf` | PDF, HTTP 200 | 14 Seiten, 83.016 Zeichen; SHA-256 `66f4ef89082454f7049234b9fe6da11f451a087a311a606c2ca61280194222c7` | `document_url`, `sourceLoaded=true`, `content_loaded`, nicht degraded |
| `https://www.youtube.com/watch?v=iWO5N3n1DXU` | YouTube, HTTP 200 am Transcript-Vertrag | 10 englische Segmente, 431 Zeichen; SHA-256 `ecef947e778abff55434ef4c31c77564d30b6cb024d9d00e3d3104fe05787398` | `youtube_video_url`, `sourceLoaded=true`, `content_loaded`, nicht degraded |

Der frühere leere YouTube-Befund war reproduzierbar auf `youtube-transcript@1.2.1` begrenzt: Caption-Tracks wurden gefunden, die aktuelle Caption-Antwort aber als leere klassische XML-Liste ausgewertet. Das Update auf `1.3.1` behält den bestehenden `features/ai/sources/youtube.ts`-Vertrag bei und liefert für dieselbe öffentliche Quelle reale Segmente. Der No-Transcript-Fixture-Vertrag bleibt unverändert fail-closed.

## Gate A — echte semantische Material-Smokes

Ausgeführt über `pnpm -C apps/web run create:semantic-material-smoke`. Der Harness verwendet den produktiven Source-Loader, den aus `/api/create/link-analysis` extrahierten Strict-JSON-Analysevertrag und den bestehenden validierten Result-Builder. Externe Volltexte werden weder geschrieben noch geloggt; die Evidence enthält nur Resultatdaten, sichere Provider-Metadaten und Content-/Result-Hashes.

| Quelle | Klassifikation / Fetch | Semantisches Resultat | Grounding / Handoff | sichere Provider-Metadaten |
| --- | --- | --- | --- | --- |
| offizielles SPD-Wahlprogramm 2025 in Leichter Sprache, HTML | `link`; HTTP 200; `sourceLoaded=true`; 9.804 Zeichen; Content-Hash `a088a1a042ac2371d7a1608b1fba233f04b846210fb36a04c2868e5d55252702` | `result_ready`; 9 validierte Themen; 1 Summary-Statement; nicht degraded | Original-URL einzige Evidence-Referenz; 0 ungrounded Topic-Labels; kein Support-Handoff | `gpt-4o-mini`, 1 Attempt, `succeeded`, Dauer only |
| Mozilla/PDF.js „Trace-based Just-in-Time Type Specialization for Dynamic Languages“, wissenschaftliches PDF | `document_url`; HTTP 200; `sourceLoaded=true`; 14 Seiten; 83.016 Extraktionszeichen; Content-Hash `66f4ef89082454f7049234b9fe6da11f451a087a311a606c2ca61280194222c7` | `result_ready`; 3 validierte fachliche Themen; 1 Summary-Statement; Key-Statement- und verifizierbare Claim-Zähler; nicht degraded | Original-PDF-URL einzige Evidence-Referenz; 0 ungrounded Topic-Labels; kein Support-Handoff | `gpt-4o-mini`, 1 Attempt, `succeeded`, Dauer only |
| W3C-WAI „Web Accessibility Perspectives: Video Captions“, YouTube | `youtube_video_url`; Transcript erfolgreich; `sourceLoaded=true`; 431 Zeichen; Content-Hash `ecef947e778abff55434ef4c31c77564d30b6cb024d9d00e3d3104fe05787398` | `result_ready`; 1 validiertes Thema; 1 Summary-Statement; nicht degraded | Original-YouTube-URL einzige Evidence-Referenz; 0 ungrounded Topic-Labels; kein Support-Handoff | `gpt-4o-mini`, 1 Attempt, `succeeded`, Dauer only |

Ein erster realer UBA-Lauf lieferte trotz erfolgreicher 146-Seiten-Extraktion keine Themen, weil der Provider nur die ersten 24.000 Zeichen mit Frontmatter und Tabellen erhielt. Der minimale Fix nutzt innerhalb desselben 24.000-Zeichen-Budgets Anfang, Mitte und Ende des extrahierten Bereichs; danach wurden dort fünf getrennte Themen validiert. Wiederholungsläufe scheiterten später ehrlich vor der Extraktion am instabilen UBA-Origin (12,26 Sekunden und anschließend mehr als 20 Sekunden). Deshalb verwendet das reproduzierbare Acceptance-Gate das stabil erreichbare 14-seitige Mozilla-Forschungspapier über denselben PDF-Pfad. Beim YouTube-Lauf wird für den englischen Transcript-Smoke Englisch als Ausgabesprache verwendet, damit die deterministische lexikalische Grounding-Prüfung keine korrekte Übersetzung als Halluzination fehlklassifiziert.

## Gate B — External-Source-Security

Im Repository existierte keine zentrale SSRF-/Safe-Fetch-Utility. Der neue einzige Netz-Grenzbaustein `apps/web/src/lib/net/safeExternalFetch.ts` wird vom Create-Loader verwendet und pinnt nach vollständiger DNS-Prüfung eine öffentliche Adresse pro Request. Redirects werden manuell und je Hop neu validiert.

| Angriff / Ressourcenfall | Ergebnis |
| --- | --- |
| `localhost`, `127.0.0.0/8`, `::1`, IPv4-mapped Loopback | vor Fetch blockiert |
| RFC1918, Carrier-Grade NAT und weitere nicht öffentliche/reservierte Netze | vor Fetch beziehungsweise nach DNS blockiert; jede zurückgelieferte Adresse muss öffentlich sein |
| `169.254.0.0/16`, IPv6 link-local, bekannte Metadata-Hostnamen | blockiert |
| Redirect von öffentlichem Host auf interne IP oder intern auflösenden Host | vor dem zweiten Request blockiert |
| übergroßes HTML | `Content-Length` und tatsächlich gestreamte Bytes bei 2 MiB begrenzt |
| übergroßes PDF | `Content-Length` und tatsächlich gestreamte Bytes bei 10 MiB begrenzt |
| PDF-Parser | höchstens 80 Seiten Text, 120.000 Zeichen, 8 Sekunden, begrenzte Bildgröße, `isEvalSupported=false`, Parser wird zerstört |
| langsame externe Quelle | Fetch bleibt pro validiertem Hop auf 20 Sekunden begrenzt; nach belegtem UBA-Timeout bei 12,26 Sekunden von 12 Sekunden angehoben, ohne Byte-, Redirect-, Adress- oder Parserlimits zu lockern |
| PDF-Spoof per MIME oder `.pdf`-Suffix | ohne `%PDF-`-Signatur blockiert |
| echtes PDF mit falschem Text-/Generic-MIME | über Signatur als PDF erkannt; sonstige unbekannte Binärdaten blockiert |

## Gate C — vollständige PR-Scope-Zuordnung

Der finale Arbeitsstand umfasst nach dem Google/Gemini-/NotebookLM-Korrekturaudit 38 Dateien gegen `main`. Alle sind einem belegten Segment derselben Kette zugeordnet; versehentlich durch einen Installlauf erzeugte Prisma-/Generated- und Fremd-Lockfile-Drift wurde vollständig entfernt. Die zusätzliche Datei dokumentiert ausschließlich die Provider-/Orchestrierungswahrheit und verändert keine Runtime.

| Vertrag | Zugeordnete Dateien |
| --- | --- |
| `/create` Runtime-, Modell- und Safe-Failure-Grenze | `apps/web/.env.example`; `apps/web/src/app/api/create/intelligent-followup/route.ts`; `apps/web/src/features/create/createPlanner.ts`; `features/ai/aiRuntimePolicy.ts` |
| Material-Klassifikation, sicherer Fetch/Transcript/PDF und semantisches Resultat | `apps/web/src/app/api/create/link-analysis/route.ts`; `apps/web/src/features/create/inputClassification.ts`; `apps/web/src/features/create/externalSourceIntake.ts`; `apps/web/src/features/create/externalSourceAnalysis.ts`; `apps/web/src/lib/net/safeExternalFetch.ts` |
| E150/OpenAI-Resultatgrenze | `features/ai/orchestratorE150.ts`; `features/ai/providers/openai.ts`; `features/analyze/analyzeContribution.ts` |
| vom echten `/create`-Read-Pfad erreichte Web-Datasource-Grenze | `packages/db-web/src/client.ts`; `apps/web/tests/db-web-client.contract.test.ts` |
| operator-owned Smokes | `apps/web/scripts/create-input-matrix-smoke.ts`; `apps/web/scripts/create-semantic-material-smoke.ts` |
| Material-/Security-/Matrix-Regressions | `apps/web/tests/create-freetext-input-matrix.contract.test.ts`; `apps/web/tests/create-input-classification-matrix.contract.test.ts`; `apps/web/tests/create-link-analysis.auth-contract.test.ts`; `apps/web/tests/create-external-source-analysis.contract.test.ts`; `apps/web/tests/create-external-source-intake.security.test.ts`; `apps/web/tests/create-external-source-pdf-timeout.contract.test.ts`; `apps/web/tests/safe-external-fetch.security.test.ts` |
| Planner-/Route-/E150-Regressions | `apps/web/tests/admin-ai-create-planner-smoke.route.test.ts`; `apps/web/tests/ai-runtime-env-sync.contract.test.ts`; `apps/web/tests/ai-runtime-policy.contract.test.ts`; `apps/web/tests/analyze-contribution.null-hardening.test.ts`; `apps/web/tests/create-intelligent-followup.route.test.ts`; `apps/web/tests/create-planner-complex-civic-input.contract.test.ts`; `apps/web/tests/create-planner-debug-diagnostics.contract.test.ts`; `apps/web/tests/create-planner-openai-happy-path.contract.test.ts`; `apps/web/tests/create-planner-provider-fallback.contract.test.ts` |
| Abhängigkeiten und reproduzierbare Runner | `apps/web/package.json`; `package.json`; `pnpm-lock.yaml` |
| Evidence | `docs/E150/AI_CREATE_ORCHESTRATOR_INPUT_MATRIX_2026-08-23.md`; `docs/E150/AI_CREATE_ORCHESTRATOR_PROVIDER_EXECUTION_AUDIT_2026-08-23.md` |

## Root Causes und kleinste Fixes

1. URL-basierte `materialItems` wurden vor dem Fix pauschal als `material_reference` klassifiziert. `inputClassification.ts` erhält jetzt `youtube_video_url`, `document_url` und `link` anhand des bereits normalisierten Materialkinds.
2. `/api/create/link-analysis` lud YouTube zuvor als HTML und konnte dadurch Seitentext statt Transcript analysieren. Der bestehende `fetchYoutubeTranscript`-Pfad wird jetzt vor jedem Web-Fetch verwendet; eine leere Transcript-Antwort stoppt vor dem Modell.
3. Die PDF-Extraktion suchte nur unkomprimierte Literal-Strings. Übliche komprimierte PDFs lieferten deshalb keine belastbare Textgrundlage. Der Node-Runtime-Pfad verwendet jetzt `pdf-parse`; MIME und `.pdf`-Suffix werden beide berücksichtigt, Seitenzahl und Text stammen aus dem Dokument.
4. Ein veralteter Test erwartete ohne Provider weiterhin lokale semantische Themen für einen langen politischen Text. Der Vertrag wurde auf die bestehende fail-closed Produktwahrheit korrigiert: ohne validierten Provider keine Themen, Claims oder Zusammenfassung.
5. Der External-Source-Loader folgte Redirects ungeprüft und lud Bodies unbegrenzt. Die zentrale Safe-Fetch-Grenze blockiert interne Ziele, validiert jeden Hop, pinnt die geprüfte Adresse und begrenzt gestreamte Bytes.
6. Lange Dokumente wurden semantisch nur am Dokumentanfang gesichtet. Ein bounded Start-/Mitte-/Ende-Auszug erhält denselben Provider-Budgetrahmen, deckt aber mehrere fachliche Abschnitte ab.
7. `youtube-transcript@1.2.1` lieferte bei aktuellen Caption-Antworten leere Resultate. `1.3.1` behebt diese belegte Adaptergrenze ohne zweiten YouTube-Pfad.

## Validierung

- ursprüngliche fokussierte Matrix-/Create-/Grounding-Suite: 14 Testdateien, 96 Tests grün; darin `create-link-analysis.auth-contract.test.ts` mit 15 Tests
- zusätzliche External-Source-/SSRF-/PDF-Ressourcentests: localhost, Loopback, RFC1918, Metadata/link-local, Redirect-Revalidierung, DNS-Mischauflösung, Byte-Limits, Content-Type/Spoofing, Seitenlimit und Parser-Timeout
- zusammengeführte fokussierte Suite nach Hardening einschließlich Material-Routing und Source-Grounding: 19 Testdateien, 127 Tests grün; der `@db/web`-Paketvertrag lief nach dem vorgesehenen Paket-Build
- `pnpm -C apps/web run typecheck`: grün
- `pnpm -C apps/web run lint`: grün
- `pnpm install --frozen-lockfile --ignore-scripts --offline`: grün
- `git diff --check`: grün
- `pnpm -C apps/web run build`: Page-Contract, Webpack-Kompilierung und TypeScript grün; Page-Data-Collect stoppt erwartbar an fehlenden Pflicht-ENV (`JWT_SECRET`, DB-/Graph-Konfiguration). Keine ENV-Datei wurde gelesen oder verändert.

## Verbleibende Gates

- Authentifizierter Exact-Head-Preview-Smoke bleibt offen; der bereits dokumentierte Preview-Login-Gate wurde in diesem Slice nicht umgangen.
- Die drei echten semantischen Material-Smokes sind auf dem Implementierungsstand grün; nach Commit wird derselbe Lauf auf dem neuen Exact Head wiederholt und in der PR-Evidence verankert.
- PR #627 bleibt Draft. GitHub CI und Vercel werden erst nach Push des neuen Exact Head bewertet.
- `docs/E150/OpenTasks.md` bleibt wegen des bestehenden Single-Writer-Governance-Slices unverändert; diese Evidence-Datei und die PR-Beschreibung tragen den #627-Nachweis.
