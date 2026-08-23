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
| `https://www.youtube.com/watch?v=iWO5N3n1DXU` | YouTube | Adapter meldet Englisch verfügbar, liefert aber 0 Transcript-Segmente | `youtube_video_url`, `sourceLoaded=false`, `fetch_failed`, `youtube_transcript_unavailable`; kein Modellaufruf, keine semantische Ausgabe |

Der YouTube-Smoke belegt den geforderten ehrlichen Degraded-/Manual-Fallback. Er belegt keinen erfolgreichen Transcript-Inhalt. Direkte Adapterdiagnostik ergab für `de` „nicht verfügbar“ und für `en` eine leere Segmentliste. Diese Grenze wird nicht als Quellenanalyse grün dargestellt.

## Root Causes und kleinste Fixes

1. URL-basierte `materialItems` wurden vor dem Fix pauschal als `material_reference` klassifiziert. `inputClassification.ts` erhält jetzt `youtube_video_url`, `document_url` und `link` anhand des bereits normalisierten Materialkinds.
2. `/api/create/link-analysis` lud YouTube zuvor als HTML und konnte dadurch Seitentext statt Transcript analysieren. Der bestehende `fetchYoutubeTranscript`-Pfad wird jetzt vor jedem Web-Fetch verwendet; eine leere Transcript-Antwort stoppt vor dem Modell.
3. Die PDF-Extraktion suchte nur unkomprimierte Literal-Strings. Übliche komprimierte PDFs lieferten deshalb keine belastbare Textgrundlage. Der Node-Runtime-Pfad verwendet jetzt `pdf-parse`; MIME und `.pdf`-Suffix werden beide berücksichtigt, Seitenzahl und Text stammen aus dem Dokument.
4. Ein veralteter Test erwartete ohne Provider weiterhin lokale semantische Themen für einen langen politischen Text. Der Vertrag wurde auf die bestehende fail-closed Produktwahrheit korrigiert: ohne validierten Provider keine Themen, Claims oder Zusammenfassung.

## Validierung

- fokussierte Matrix-/Create-/Grounding-Suite: 14 Testdateien, 96 Tests grün; darin `create-link-analysis.auth-contract.test.ts` mit 15 Tests
- `pnpm -C apps/web run typecheck`: grün
- `pnpm -C apps/web run lint`: grün
- `pnpm install --frozen-lockfile --ignore-scripts --offline`: grün
- `git diff --check`: grün
- `pnpm -C apps/web run build`: Page-Contract, Webpack-Kompilierung und TypeScript grün; Page-Data-Collect stoppt erwartbar an fehlenden Pflicht-ENV (`JWT_SECRET`, DB-/Graph-Konfiguration). Keine ENV-Datei wurde gelesen oder verändert.

## Verbleibende Gates

- Authentifizierter Exact-Head-Preview-Smoke bleibt offen; der bereits dokumentierte Preview-Login-Gate wurde in diesem Slice nicht umgangen.
- Das reale YouTube-Beispiel bleibt bewusst degraded, weil der vorhandene Adapter kein Transcript-Segment liefert. Die funktionale Kernanforderung „keine erfundene Analyse, sichtbarer Fallback“ ist erfüllt; erfolgreicher Transcript-Content ist nicht belegt.
- PR #627 bleibt Draft. GitHub CI und Vercel werden erst nach Push des neuen Exact Head bewertet.
- `docs/E150/OpenTasks.md` bleibt wegen des bestehenden Single-Writer-Governance-Slices unverändert; diese Evidence-Datei und die PR-Beschreibung tragen den #627-Nachweis.
