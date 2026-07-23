# V3 OpenTasks–Kalender-Alignment

Stand: 2026-07-23

## Zweck

Diese Notiz synchronisiert die seit dem operativen Kopf von `docs/E150/OpenTasks.md` entstandenen Produktentscheidungen, Merge-Ergebnisse und Kalenderblöcke.

Sie ist ein konfliktfreier Zwischenstand, solange PR `#414` dieselbe Datei `docs/E150/OpenTasks.md` verändert. Nach Abschluss von PR `#414` wird der operative Kopf von `OpenTasks.md` in einem einzigen Folge-PR auf diesen Stand aktualisiert. Bis dahin gilt:

1. `OpenTasks.md` bleibt der kanonische SSOT für bestehende IDs und Abhängigkeiten.
2. Diese Notiz ergänzt ausschließlich die seit dem Stand 2026-07-21 hinzugekommenen Wahrheiten.
3. Der Google Kalender steuert die konkrete zeitliche Ausführung.
4. Kein paralleler Schreibzugriff auf `OpenTasks.md`, solange PR `#414` offen ist.
5. Kein Auto-Publish, Auto-Merge oder ungeprüftes Cross-lingual Merge.

## Aktuelle Repository-Wahrheit

- `main`: `66c40c466eb83e0d8a8923290107b0eaddde85cf`
- PR `#410`: produktive `robots.txt`-Route gemergt.
- PR `#411`: `/create`-Debattenstand-Sidecar-Spezifikation gemergt.
- PR `#412`: neue Startseitenbotschaft, kanonische `www`-Metadaten und Startseiten-Contracts gemergt.
- PR `#413`: mehrsprachige Grundlagen, Arabisch/RTL-Härtung, sprachabhängige Textblockrichtung und I18N-Guardrail gemergt.
- PR `#414`: sicherer Production-E2E-Harness offen; verändert `docs/E150/OpenTasks.md` und blockiert deshalb parallele SSOT-Änderungen.

## Verbindliche Produktwahrheit

### eDebatte

eDebatte ist kein kopierter Nachrichtenfeed und kein bloßer Eingabeassistent. Das System verbindet aktuelle Entwicklungen, Originalquellen und Lesefassungen, Claims, Positionen und offene Fragen, Runden, Dossiers und `/live`, Beteiligung und nachvollziehbare Wirkung sowie persönliche Relevanz seit dem letzten Besuch.

Eine eDebatte-„News“ ist primär eine nachvollziehbare Veränderung eines Themas: Was ist neu, was ist belegt, was wurde widersprochen, wer ist betroffen und wo ist Beteiligung möglich?

### Sieben Agentenrollen

Die bestehende Architektur bleibt bei sieben Rollen:

1. Personal Voxy
2. Intake & Format
3. Research & Source
4. Claims & Factcheck
5. Participation & Moderation
6. Dossier & Briefing
7. Governance & Compliance

Diese Rollen werden nicht als sieben konkurrierende Bots sichtbar. Bürger erleben Voxy beziehungsweise verständliche Produktzustände. Organisationen erhalten Team-Workspaces; Behörden Zuständigkeits- und Antwort-Cockpits. Fachrollen arbeiten im Hintergrund mit nachvollziehbaren Status-, Review- und Auditgrenzen.

### Mehrsprachigkeit

Mehrsprachigkeit ist systemweit und sprachunabhängig. Arabisch ist nur ein RTL-Härtetest, Mandarin ein Test nichtlateinischer Schrift und Spanisch ein verbreiteter LTR-/Qualitätsfall.

Getrennt zu behandeln sind UI-Sprache, Lesesprache, Originalsprache, Arbeitssprache, Ausgabesprache und Quellensprache. Das Original bleibt immer erhalten. Übersetzungen werden markiert. Sprachübergreifendes Matching erzeugt Vorschläge, niemals ungeprüfte Zusammenführungen.

## Operative Ergänzungen zum OpenTasks-Kopf

| ID | Status | Priorität | Abhängigkeiten | Scope | Kalender |
| --- | --- | --- | --- | --- | --- |
| GOVERNANCE-SSOT-SYNC-04 | in_progress | P0 | PR `#414` | `OpenTasks.md`, Kalender, Operating Plan, Issues und aktueller `main` müssen dieselben IDs, Stati und Abhängigkeiten führen | 23.07.; finaler OpenTasks-Folge-Sync direkt nach PR `#414` |
| HOME-PRODUCT-MESSAGE-01 | done | P0 | keine | Startseite erklärt Entwicklungen, Quellen, Beteiligung und Wirkung statt nur Eingabe/Voxy | PR `#412` |
| PRIVACY-SNIPPET-02 | codex_ready | P0 | HOME-PRODUCT-MESSAGE-01 | mobiler Consent-Dialog, verständliche Aktionen, `data-nosnippet`, `/settings` noindex und sichere Snippet-Grenzen | 23.07. 14:30 |
| SEO-PUBLIC-DISCOVERY-03 | codex_ready | P1 | PRIVACY-SNIPPET-02 | Sitemap/Indexierungsmatrix, OG-/Sharing-Bild, strukturierte Daten, PWA-Startadresse, Barrierefreiheit und Sprach-SEO | 30.07. 12:00 |
| I18N-FOUNDATION-01 | done | P0 | keine | RTL, SSR/Client-Richtung, URL-Locale-Handoff, arabische Basisnachrichten, per-Textblock `lang`/`dir`, kritischer Guardrail | PR `#413` |
| I18N-SURFACE-COVERAGE-02 | codex_ready | P0 | I18N-FOUNDATION-01 | alle öffentlichen, Konto-, Review-, Organisations- und Behördenflächen inventarisieren; Inline-Copy und Fallbacks erfassen | 27.07. 10:15 |
| I18N-PREFERENCE-SEPARATION-03 | blocked | P0 | I18N-SURFACE-COVERAGE-02 | `uiLocale`, `readingLocale`, Ausgabepräferenzen und Originalanzeige technisch trennen; Kernflächen auf gemeinsamen Message-/Content-Vertrag migrieren | 12.08. 13:00 |
| I18N-CROSS-LINGUAL-RUNTIME-04 | blocked | P0 | I18N-PREFERENCE-SEPARATION-03, Feed-Grundlage | generische Quellenübersetzung, Originalerhalt, Sprachstatus, Retry/Kosten/Audit und cross-lingual Match-Vorschläge | 11.08. 13:00 als Runtime-Abnahme; Reihenfolge beim OpenTasks-Sync auflösen |
| CREATE-DEBATTENSTAND-01 | codex_ready | P0 | PR `#411`, aktueller `main` | vier Slices: Workspace-State-SSOT, vollständiger Themenvertrag, Sidecar/Bottom-Sheet, Downstream-Handoffs | 25.07. und Folgeblöcke |
| RUNDEN-PARTICIPATION-WORKSPACE-01 | codex_ready | P0 | Create-Datenvertrag | verständlicher Beteiligungs-Workspace mit Persistenz, Rollen, Moderation und Status | 27.07. 13:00 |
| DOSSIER-WORKSPACE-01 | codex_ready | P0 | Dossier-Runtime-Wahrheit, Production-Smoke | echtes Dossier mit Quellen, Claims, Positionen, offenen Fragen, Beteiligungs- und Reviewstatus | 28.07. 13:00 |
| FEED-DEVELOPMENT-NEWS-01 | blocked | P0 | Production-Runtime, Review-Queue | RSS/Suche/Medien/Behördenquellen bis zur reviewfähigen Entwicklungseinheit automatisieren; kein kopierter Newsfeed und kein Auto-Publish | 03.08. 15:15; 04.08. 13:00; 18.08. 08:00 |
| RETURN-DIGEST-02 | blocked | P1 | FEED-DEVELOPMENT-NEWS-01, I18N-CROSS-LINGUAL-RUNTIME-04 | reale Karten „Seit deinem letzten Besuch“, täglicher/wöchentlicher Digest, neue Quellen, Antworten, Fristen und Beteiligungsmöglichkeiten | 30.07. UX-Abnahme; Runtime 18.08. 13:00 |
| CIVIC-EVENT-RADAR-03 | blocked | P1 | FEED-DEVELOPMENT-NEWS-01, Region-/Consent-Vertrag | lokale Veranstaltungen, Kultur, Anhörungen, Streams und Beteiligungsfristen finden, einem Thema zuordnen und zu `/live`/Runden/Dossier führen | 13.08. 13:00 |
| LIVE-PRODUCT-CONTRACT-01 | codex_ready | P0 | keine | bestehender OpenTasks-Vertrag; `/live`, `/stream`, Runden und Dossier abgrenzen | 24.07. 13:00 |
| LIVE-SESSION-RUNTIME-02 | blocked | P0 | LIVE-PRODUCT-CONTRACT-01, Production-Runtime | persistente Sessions, Reconnect, Rollen und Adapter | 17.08. 13:00 |
| AGENT-ORCHESTRATION-01 | blocked | P1 | stabile Feed-, Create-, Dossier-, Runden- und Live-Contracts | sieben Rollen als ein orchestriertes, auditierbares System verankern; keine siebte Oberfläche und keine parallele Agentenplattform | 24.08. 15:15 |
| PERSONAL-VOXY-PROFILE-01 | blocked | P1 | Consent, RETURN-DIGEST-02, CIVIC-EVENT-RADAR-03 | widerrufbares Profil für Region, Interessen, Sprache, Begleitmodus und Benachrichtigungen | Entscheidungen 02./07.09.; Runtime 08./09.09. |
| PERSONAL-CONNECTORS-DEFERRED-02 | blocked | P2 | PERSONAL-VOXY-PROFILE-01, öffentliche Beta | optionale Mail-/Kalender-Connectoren als getrennte persönliche Vollmacht; kein Standardzugriff für Bürger; Event-Erinnerung und „zum Kalender hinzufügen“ zuerst | Entscheidung nach kontrollierter Beta |
| HOME-TODAY-01 | blocked | P1 | veröffentlichte reale Dossiers/Entwicklungen | zwei bis drei echte Entwicklungskarten „Heute bei eDebatte“; keine Demo und kein kopierter Newsfeed | 07.10. 10:00 |

## Bereinigte Abhängigkeitsreihenfolge

### Sofortige Produktions- und Vertrauensbasis

`PROD-RUNTIME-02` → `PROD-E2E-SMOKE-03`/PR `#414` → `GOVERNANCE-SSOT-SYNC-04` → Recht/Privacy → öffentliche QA

### Kernprodukt

`CREATE-DEBATTENSTAND-01` → `RUNDEN-PARTICIPATION-WORKSPACE-01` und `DOSSIER-WORKSPACE-01` → Live-Vertrag und Live-Runtime

### Sprach- und Quellenbrücke

`I18N-FOUNDATION-01` → `I18N-SURFACE-COVERAGE-02` → `I18N-PREFERENCE-SEPARATION-03` → `I18N-CROSS-LINGUAL-RUNTIME-04`

Die Kalenderreihenfolge 11./12.08. muss beim finalen OpenTasks-Sync korrigiert werden: technische Präferenztrennung vor vollständiger Runtime-Abnahme oder als klar getrennte parallele Contracts ohne Überschneidung.

### Aktuelle Entwicklungen und Rückkehr

`FEED-DEVELOPMENT-NEWS-01` → `RETURN-DIGEST-02` und `CIVIC-EVENT-RADAR-03` → `PERSONAL-VOXY-PROFILE-01`

### Agentensystem

Stabile Fachverträge → `AGENT-ORCHESTRATION-01` → Autonomie-/Qualitätsaudit → keine Freigabe höherer Autonomie ohne Audit, Kill Switch und Reviewgrenzen.

### Spätere Excellence

Reale veröffentlichte Inhalte → `HOME-TODAY-01` → kontrollierter Pilot → öffentliche Beta → kommerzieller/institutioneller Betrieb.

## Kalenderregeln

- Jeder Entwicklungsblock enthält OpenTasks-ID, Status, Abhängigkeiten, Scope und Abnahme.
- Termine dürfen Abhängigkeiten nicht als erledigt voraussetzen, wenn sie noch blockiert sind.
- Konzept-/Contract-Arbeit darf vor einer Runtime-Abhängigkeit erfolgen, muss aber als solche bezeichnet sein.
- Keine Secrets, personenbezogenen Profildaten oder internen Zugangsdaten in Kalenderbeschreibungen.
- Externe Provider bleiben Adapter und werden erst nach manueller Freigabe aktiviert.
- Oktober bleibt für echte Produktbeweise, Pilot und „Heute bei eDebatte“ reserviert; keine vorgezogene Demo.

## Nächster SSOT-Schritt

Nach Merge oder Schließung von PR `#414`:

1. aktuellen `main` und PR-Status lesen,
2. operativen Kopf von `OpenTasks.md` aktualisieren,
3. `GOVERNANCE-SSOT-SYNC-04` und neue IDs übernehmen,
4. veraltete `main`-/PR-Angaben ersetzen,
5. diese Alignment-Datei im OpenTasks-Kopf als Evidenz verlinken,
6. Kalenderabgleich erneut ausführen,
7. keine historischen Evidenzabschnitte löschen.
