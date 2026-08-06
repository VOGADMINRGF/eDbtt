# Alpha–Foxtrott Launch Run-Pack

Stand: 2026-08-04, 21:45 Europe/Berlin

Dieses Dokument ergänzt `docs/E150/OpenTasks.md`; es ersetzt oder überschreibt die kanonische Queue nicht. `AGENTS.md`, die Foundation-Canons und OpenTasks bleiben maßgeblich.

## Auftrag

Sechs serielle Einheiten bringen eDebatte, VoiceOpenGov, Vote4Gov und Voxy bis zu dem Punkt voran, an dem offene Arbeit überwiegend nur noch an Betreiber-Merge, visueller/fachlicher Freigabe, realen IDs, Credentials oder Production-Go hängt.

| Einheit | Verantwortung | Aktueller Ausgang |
|---|---|---|
| Alpha | Governance, SSOT, Preflight, Exact-Head-/CI-Wahrheit | PR-/Issue-/Kalender-Konvergenz |
| Bravo | öffentlicher Einstieg, Beteiligung, reale IDs | #557, #527, #520 |
| Charlie | Voxy Character, Voice, Captions, Rendering | #558, #567, #568, #569 |
| Delta | Review, Admin Studio, Publishing Draft, Shadow Evidence | #570, #573, #575 |
| Echo | I18N, RTL, Mobile, Accessibility | Message-SSOT und öffentliche Kernpfade |
| Foxtrott | End-to-End, Monitoring, Kill Switch, Rollback, Release | #574 und Betriebsnachweise |

## Unverhandelbare Grenzen

- eDebatte bleibt einzige Beteiligungs- und Themenwahrheit.
- Keine erfundenen Topic-, Frage-, Options-, Quellen- oder Beteiligungs-IDs.
- Keine ungeprüfte Übersetzung als endgültige Wahrheit.
- Voxy bleibt review-first; kein Auto-Publish, Auto-Approve oder externe Veröffentlichung.
- Keine politische Viewpoint-Bewertung.
- Kein Merge, Deployment oder Credential-/Providerzugang ohne ausdrückliches Betreiber-Go.
- Abhängige Slices werden seriell, nicht in konkurrierenden Daten- oder Reviewpfaden umgesetzt.

## Kritischer Pfad bis kontrolliertem Start

### Gate A — Governance und SSOT

1. Kanonische OpenTasks unverändert als SSOT verwenden.
2. Pro Implementierung genau einen Task, Branch und Draft-PR.
3. Vor Start taskbezogenen `codex-task-preflight` auf aktuellem `main` nachweisen.
4. Jeder Abschluss erhält Exact Head, Diff-Scope, CI, offene Risiken und genau einen Folgezustand:
   - `ready_for_operator_merge`
   - `manual_gate`
   - `dependency_wait`
   - `blocked`

### Gate B — Voxy Master und Verarbeitung

#### #558 — Master Asset System

Status: Draft, mergefähig, ungemergt.

Verbindliche Produktentscheidung vom 04.08.2026:

- Master-Look freigegeben.
- Ein kanonischer Charakter, keine zweite Figur.
- eDebatte-Variante: tiefes Navy/Blau mit Electric-Blue-Akzenten.
- VoiceOpenGov-Mitgliedervariante: Türkis beziehungsweise Türkis→Electric-Blue.
- VOG-Pin und eDebatte-Pocket-Mark bleiben getrennte, scharfe Overlays.
- Jede freigegebene Handpose besitzt exakt fünf Finger.
- Referenzboards sind visuelle Zielbilder, keine Layer- oder Typografie-Source-of-Truth.

Noch vor Merge:

- Herkunft/Nutzungsrechte dokumentieren.
- 200-%-Sichtabnahme für Hände, Kopf, Ränder, Pin und Pocket-Mark.
- 16:9, 9:16 und 1:1 ohne Clipping abnehmen.
- Exact-Head-CI und Render-Evidence erneut bestätigen.

#### #569 — Animatable Master Asset

Neue Einordnung: Designentscheidung gelöst; Umsetzung `codex_ready_after_merge:#558`, Rechte-/Herkunftsnachweis bleibt manuelles Gate.

Muss liefern:

- getrennte Head-/Eye-/Lid-/Brow-/Arm-/Hand-/Shadow-/Light-Layer,
- stabile IDs und Pivotpunkte,
- transparente Exporte,
- keine generative Handimprovisation im Renderer,
- reale 8-Sekunden-Fixture mit echten Ebenen,
- kein Lip-Sync-Zwang.

#### Serielle Folge

1. #567 Voice & Caption Fixture
2. #568 Local Composition Runtime
3. #570 Admin Video Studio
4. #575 Shadow Runtime erst nach realen Review-Kandidaten

### Gate C — Auto-Publish Readiness

#### #573

Status: Ready for Review, mergefähig, ungemergt.

Exact Head: `9eea6d3532271f985bbcaa31f0fd4a5f177f5d6d`

Nachweise:

- 15/15 fokussierte Tests,
- Typecheck, Lint, Build, Security und bestehende Contracts grün,
- zentraler Policy-Snapshot,
- Revision-Hashes und Deduplizierung,
- lokale 30 Kalendertage,
- Generator-/Reviewer-Trennung,
- `humanReviewRequired = true`,
- keine Aktivierung oder externe Veröffentlichung.

Folgezustand: `ready_for_operator_merge`.

#### #575

Status: `dependency_wait` bis #573 gemergt und reale Kandidaten aus Rendering/Admin Review vorhanden sind.

Maximales Ergebnis nach 30 Tagen: `eligible_for_human_allowlist_decision` — niemals automatische globale Aktivierung.

### Gate D — Öffentlicher Kern

#### #557 Public Ballot

Vor Freigabe erforderlich:

- aktueller `main`-Sync und vollständige CI,
- bestätigte reale Frage-/Options-IDs,
- Quellen und Gegenposition,
- Admin-/2FA-Release,
- DE/EN mindestens, weitere Zielsprachen gemäß I18N-Gate,
- RTL, Mobile, Tastatur, Screenreader, 200-%-Zoom,
- keine Repräsentativitätsbehauptung.

#### #527 `/start` und #520 `/studio`/QR

- Exact-Head-Visual-Evidence,
- reale Geräte-/Kamera-Smokes,
- Consent/Safe Area/No-JS,
- ehrliche Produktwahrheit,
- keine Stub- oder Fake-Erfolge.

### Gate E — I18N und Accessibility

Serielle Reihenfolge:

1. UI-/Lese-/Ausgabe-/Originalpräferenzen praktisch abnehmen.
2. Kanonischen Message-Loader und Capability Registry schließen.
3. öffentlichen Kern migrieren.
4. Auth/Account/Admin und Review migrieren.
5. Legal-/Longform nur mit fachlicher Freigabe.
6. RTL/Mobile/Tastatur/Screenreader/200-%-Zoom systemweit härten.

Keine stille automatische Übersetzung als Evidenz oder Rechtsfassung.

### Gate F — Betrieb

Vor öffentlichem Go:

- echter Kill-Switch-Smoke,
- Rollback-Drill mit Wiederherstellungszeit,
- Monitoring ohne Fake-Erfolg,
- Support-/Incident-Handoff,
- Rate Limits und Idempotenz,
- Impressum, Datenschutz, KI-Kennzeichnung und Betreiberrolle,
- klarer Go/No-Go-Owner.

## Kalender-Konvergenz

Kalenderblöcke werden nicht künstlich als erledigt markiert. Ein Termin gilt technisch vorbereitet, wenn mindestens einer der folgenden Zustände dokumentiert ist:

- vollständiger PR mit grüner Evidence und nur Betreiber-Merge offen,
- `codex_ready` mit erfüllten Abhängigkeiten und positivem Preflight,
- `dependency_wait` mit eindeutigem vorgelagertem Task,
- `needs_decision` mit klarer Betreiberentscheidung und ohne versteckte Implementierungsarbeit.

Geplante Shadow-Termine:

- Start: 21.08.2026 nach realem Go/No-Go.
- Review: tatsächlicher `shadowStartedAt` + 30 lokale Kalendertage.
- Verschiebt sich der Start, werden beide Kalendertermine gemeinsam verschoben.

## Entscheidungsbedarfe, die nicht autonom gelöst werden dürfen

1. Merge und Production-Deployment.
2. Reale Public-Ballot-IDs und Veröffentlichungsfreigabe.
3. Herkunft/Nutzungsrechte finaler Voxy-Master.
4. Erster Social-Kanal und OAuth/API-Credentials.
5. Produktive Voice-/AI-Provider, Budgets, Datenschutz und Retention.
6. Juristische Freigaben und übersetzte Rechtstexte.

## Nächste ausführbare Reihenfolge

1. Alpha: dieses additive Run-Pack prüfen; keine OpenTasks-Ersetzung.
2. Charlie: #558 Rechte-/Sichtabnahme und CI schließen.
3. Charlie: #567, danach #568.
4. Delta: #570; parallel nur unabhängige Dokumentation, keine zweite Review-Queue.
5. Alpha/Delta: #573 Betreiber-Merge; #575 erst mit realen Kandidaten.
6. Bravo/Echo: Public Core und I18N entlang bestätigter IDs und Message-SSOT.
7. Foxtrott: E2E, Kill Switch, Rollback, Incident und Release-Gate.

## Definition of Done dieses Run-Packs

- Keine konkurrierende operative SSOT erzeugt.
- Alle kritischen Voxy-, Public-Core-, I18N- und Betriebsabhängigkeiten sind seriell abgebildet.
- Produktentscheidungen und technische Entscheidungen sind getrennt.
- Komplexe Folgeslices sind Codex-ready oder ausdrücklich als Decision/Dependency markiert.
- Auto-Publish bleibt deaktiviert und fail-closed.