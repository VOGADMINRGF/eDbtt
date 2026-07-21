# V3 Final Operating Plan — aktualisiert 2026-07-21

## Zweck

Dieses Dokument verbindet den aktuellen `main`-Stand, `docs/E150/OpenTasks.md`, Issue #310, Google Kalender und die verbleibenden manuellen Gates zu einer direkt fortsetzbaren Ausführungsreihenfolge.

Es beschreibt keine bereits erreichte Produktionsreife. Ein Block gilt erst als abgeschlossen, wenn Code, Tests, Preview-/Production-Smoke und SSOT-Nachzug vollständig sind.

## Aktueller Wahrheitsstand

- `main`: `cb0d0f87`
- PR #400: Create, Dossier-Runtime-Wahrheit und Production-Guardrails integriert
- PR #404: Factcheck-Route-Hardening gemergt
- PR #405: Account-/Kontakt-/Journey-Guardrails gemergt
- PR #406: Review-first Save-Contracts gemergt
- PR #397 und #398: durch #400 ersetzt und geschlossen
- historische Stashes und `backup/stash-*`-Branches: vollständig bereinigt
- kein Auto-Publish aktiviert
- Production-ENV, Domain-Zuordnung und praktischer Production-Smoke: noch manuell zu bestätigen

## Verbindliche Regeln

- Kein Auto-Publish für öffentliche, politische oder gesellschaftliche Inhalte.
- Review-first vor Rendering und Veröffentlichung.
- Keine Fake-Erfolge, Demo-Persistenz oder stillen Fallbacks im Produktionspfad.
- Externe Dienste nur als austauschbare Provider-Adapter.
- Jeder Slice hat genau einen fachlichen Schwerpunkt und einen klaren Datei-/Runtime-Scope.
- Parallelisierung nur bei getrennten Dateien, Datenmodellen und PR-Abhängigkeiten.
- `/create`, `/runden`, `/dossier` und `/live` bleiben getrennte Produktflächen innerhalb derselben kanonischen Datenkette.
- Keine Secrets in GitHub, Codex-Prompts, Kalenderbeschreibungen oder Logs.

## Statuswerte

`blocked`, `codex_ready`, `in_progress`, `review`, `manual_gate`, `done`

---

# Phase 0 — Produktionswahrheit

## PROD-PR-CHAIN-01

**Status:** `done`  
**Priorität:** P0  
**Abhängigkeiten:** keine

**Ergebnis**

- PR #400 hat Create, Dossier-Runtime-Wahrheit und Production-Guardrails integriert.
- PR #404–#406 haben die noch sinnvollen Stash-Reste auf aktuelle Contracts übertragen.
- PR #397 und #398 wurden als vollständig ersetzt geschlossen.
- Der Worktree ist sauber; Stashes und Backup-Branches sind entfernt.

**Evidenz**

- `2623f043` — Integrate Create, dossier runtime truth and production guardrails (#400)
- `72835a52` — Factcheck route classification hardening (#404)
- `032aea47` — Account/contact journey guardrails (#405)
- `cb0d0f87` — Review-first save contracts (#406)

## PROD-RUNTIME-02

**Status:** `manual_gate`  
**Priorität:** P0  
**Abhängigkeiten:** PROD-PR-CHAIN-01

**Scope**

- richtiges Vercel-Projekt für `edebatte.org` bestätigen
- `main` als Production Branch bestätigen
- Produktivdomain und Redirect-/Alias-Domains bestätigen
- Preview-, Development- und Production-ENV trennen
- `JWT_SECRET`, `OPENAI_API_KEY`, `WEB_DATABASE_URL` und alle tatsächlich verwendeten Provider-/Mail-/DB-Variablen setzen
- Rollback auf das vorherige Deployment praktisch prüfen

**Akzeptanzkriterien**

- Production deployt den erwarteten `main`-Commit
- ENV-Guardrails laufen grün
- fehlende Runtime zeigt ehrliche Fehler statt Demo-Erfolg
- Secrets erscheinen nicht in Logs oder Browserantworten
- Rollback ist praktisch möglich

## PROD-E2E-SMOKE-03

**Status:** `blocked`  
**Priorität:** P0  
**Abhängigkeiten:** PROD-RUNTIME-02

**Scope**

- Desktop und Mobile
- Registrierung/Login
- `/create` mit Text, Link und Dokument
- Themenanzahl 2, 7, 14 und 12+
- Dossier-Aufruf, Review, Beteiligung, Fehler und Retry
- Admin-Telemetrie ohne Secrets oder Rohprompts

**Akzeptanzkriterien**

- keine Demo-/Fake-Erfolge
- persistierte Daten bleiben nach Reload erhalten
- keine stillen Auto-Handoffs oder Veröffentlichungen
- reproduzierbarer Smoke-Bericht mit Commit und Domain

---

# Phase 1 — Produktflächen

## CREATE-VISUAL-PARITY-01

**Status:** `review`  
**Priorität:** P0  
**Abhängigkeiten:** aktueller `main`, PROD-RUNTIME-02 für echten Production-Smoke

**Stand**

- Create-Chat-Workspace, Themeninventar, Planner-Härtung und Dossier-Links wurden über #400 integriert.
- Offen bleibt der visuelle und fachliche Nachweis gegen die verbindlichen Desktop-/Mobile-Zielbilder.

**Scope**

- `/create` gegen das Zielbild prüfen
- Pipeline, Structure Rail, Chat-Thread und Themenzweige bewerten
- keine semantischen Ergebnisse vor validiertem AI-Lauf
- alle tatsächlich herleitbaren Themen zeigen, nicht künstlich auf 3 begrenzen

**Akzeptanzkriterien**

- Screenshotvergleich Desktop/Mobile
- Text-, Link- und Dokumentlauf
- 2, 7, 14 und 12+ Themen
- nachvollziehbare Orts- und Quellenlogik
- kein dominanter Retry-CTA bei erfolgreichem Ergebnis

## CREATE-PARTICIPATION-HANDOFF-02

**Status:** `blocked`  
**Priorität:** P0  
**Abhängigkeiten:** CREATE-VISUAL-PARITY-01, PROD-E2E-SMOKE-03

**Scope**

- ausgewählte Themen idempotent als reviewpflichtigen Beteiligungsentwurf persistieren
- Nutzer bestätigt Zweige, Format und Ortsbezug
- klarer Übergang zu `/runden` oder Dossier

**Akzeptanzkriterien**

- Reload-sichere Draft-Persistenz
- keine Duplikate bei Retry
- kein Auto-Dossier, Auto-Anlassraum oder Auto-Publish

## RUNDEN-PARTICIPATION-WORKSPACE-01

**Status:** `codex_ready` nach Scope-Lock  
**Priorität:** P0  
**Abhängigkeiten:** Datenvertrag aus CREATE-PARTICIPATION-HANDOFF-02; UX-/Contract-Arbeit darf getrennt vorbereitet werden

**Scope**

- eigenes `/runden`-Zielbild
- Rundenstatus, Beteiligungsformat, Teilnehmerrollen und Moderationszustände
- kleiner Assistant Dock statt zentralem Create-Chat
- nachvollziehbarer Übergang aus Create-Drafts

**Akzeptanzkriterien**

- keine Demo-Abstimmung
- Status und nächster Schritt verständlich
- Mobile-/Desktop-Contracts
- persistierte Runden laden nach Reload

## DOSSIER-RUNTIME-TRUTH-00

**Status:** `done`  
**Priorität:** P0  
**Evidenz:** PR #400; ersetzter PR #397

- Demo-Vote-Route und reale Dossier-Pfade sind getrennt.
- reale Dossiers zeigen bei fehlender Vote-Runtime einen ehrlichen Fehler.
- kanonische Dossier-Links ersetzen betroffene `/dossier/demo`-Fallbacks.

## DOSSIER-WORKSPACE-01

**Status:** `codex_ready` nach Production-Smoke  
**Priorität:** P0  
**Abhängigkeiten:** DOSSIER-RUNTIME-TRUTH-00, PROD-E2E-SMOKE-03

**Scope**

- eigenes Dossier-Zielbild und Informationsarchitektur
- Quellen, Claims, Positionen, offene Fragen, Beteiligungsstände und Reviewstatus
- echte persistente Dossier- und Vote-Runtime statt Demo-Simulation

**Akzeptanzkriterien**

- echte Dossier-ID und Persistenz
- keine lokale Fake-Vote-Bestätigung
- Quellen-/Claim-Lücken sichtbar
- Mobile-/Desktop-Smoke

## DOSSIER-CONTENT-VOXY-BRIDGE-02

**Status:** `blocked`  
**Priorität:** P0  
**Abhängigkeiten:** DOSSIER-WORKSPACE-01

- Dossier erzeugt ein strukturiertes Master-Content-Paket.
- Paket enthält These, faire Gegenposition, Quellenstand, CTA und offene Risiken.
- Übergabe an den Voxy-Video-Flow bleibt reviewpflichtig.

---

# Phase 2 — `/live`

## LIVE-PRODUCT-CONTRACT-01

**Status:** `codex_ready`  
**Priorität:** P0  
**Abhängigkeiten:** keine Runtime-Abhängigkeit; Architektur-Slice

- Zweck und Abgrenzung von `/live`, `/stream`, `/runden` und Dossier
- Rollen: öffentlich, Teilnehmer, Moderator, Admin
- Sessionstatus und kanonischer Datenfluss
- kein zweites paralleles Beteiligungssystem

## LIVE-SESSION-RUNTIME-02

**Status:** `blocked`  
**Priorität:** P0  
**Abhängigkeiten:** LIVE-PRODUCT-CONTRACT-01, PROD-RUNTIME-02

- persistente Live-Sessions
- Start/Stop, Join/Leave, Reconnect und Sessionende
- Realtime-Adapter hinter eigener Schnittstelle

## LIVE-MODERATION-SOURCES-03

**Status:** `blocked`  
**Priorität:** P0  
**Abhängigkeiten:** LIVE-SESSION-RUNTIME-02

- Moderation, Quellenhinweise, Claim-Markierung, Missbrauchsschutz und Audit Trail

## LIVE-VOXY-BRIEFING-04

**Status:** `blocked`  
**Priorität:** P1  
**Abhängigkeiten:** LIVE-MODERATION-SOURCES-03, DOSSIER-CONTENT-VOXY-BRIDGE-02

- reviewfähige Zwischen- und Abschlusszusammenfassungen
- keine automatische öffentliche Aussage ohne Freigabe

## LIVE-PUBLIC-SURFACE-05

**Status:** `blocked`  
**Priorität:** P1  
**Abhängigkeiten:** LIVE-SESSION-RUNTIME-02

- öffentliche Live-Ansicht, Mobile, Share/QR und Beteiligungs-CTA

## LIVE-PRODUCTION-SMOKE-06

**Status:** `blocked`  
**Priorität:** P0  
**Abhängigkeiten:** LIVE-PUBLIC-SURFACE-05, LIVE-MODERATION-SOURCES-03

- Moderator plus zwei Teilnehmer
- Join/Reconnect
- Beitrag, Moderationsentscheidung und Quelle
- Sessionende und Dossier-Handoff
- Fehlerfall und Rollback

---

# Phase 3 — Voxy, Rendering und Publishing

Issue #310 bleibt der fachliche Master. Die operative Umsetzung wird auf folgende PR-fähige Slices gemappt.

## VOXY-BRIEFING-RUNTIME-01

**Status:** `blocked`  
**Priorität:** P0  
**Abhängigkeiten:** DOSSIER-CONTENT-VOXY-BRIDGE-02

- vorhandene Contracts in echte persistente, idempotente Briefing-Jobs überführen
- Provider neutral
- keine Veröffentlichung

## VOXY-SCRIPT-REVIEW-02

**Status:** `blocked`

- Scriptvarianten, Sprachen, Quellen- und Rechtsprüfung
- Audit Trail und explizite Freigabe

## VOXY-RENDER-JOB-03

**Status:** `blocked`

- persistente Render-Queue
- 9:16, 1:1 und 16:9
- Untertitel, Quellenleiste, CTA und Thumbnail
- Retry ohne doppelte Kosten oder Jobs

## VOXY-PUBLISH-QUEUE-04

**Status:** `blocked`

- Website- und Plattform-Drafts
- Upload, Scheduling und Post nur nach Freigabe
- Kill Switch, Retry und Statusrückmeldung

## SOCIAL-CONNECTOR-05A — Facebook

**Status:** `manual_gate`

- Facebook-Seite, Rollen und Zugriff manuell bestätigen
- zunächst Profil, Titelbild und Publishing-Drafts
- keine Einladungen, Boosts oder automatischen Posts vor Production-Smoke

## SOCIAL-CONNECTOR-05B — Instagram

**Status:** `blocked`

- eigener Adapter und plattformspezifische Formate

## SOCIAL-CONNECTOR-05C — TikTok

**Status:** `blocked`

- eigener Adapter und plattformspezifische Formate

## SOCIAL-CONNECTOR-05D — LinkedIn

**Status:** `blocked`

- eigener Adapter für Organisations- und Executive-Kommunikation

## SOCIAL-CONNECTOR-05E — YouTube

**Status:** `blocked`

- eigener Adapter für Shorts und längere Briefings

Für alle Connectoren gilt: keine Zugangsdaten im Repo, kein Auto-Publish, Plattformzugriff und Freigabestatus als manueller Gate.

---

# Phase 4 — konkrete Marketingkampagnen

## CAMPAIGN-REFERENCE-01 — erstes Referenzthema

**Status:** `blocked`  
**Abhängigkeiten:** PROD-E2E-SMOKE-03, DOSSIER-CONTENT-VOXY-BRIDGE-02

**Pflichtfelder**

- Kampagnen-ID, Dossier-ID und Zielgruppe
- Hauptthese, faire Gegenposition und Quellenpaket
- Master Content und drei Hooks
- Video 30–60 Sekunden
- Website-Beitrag
- Facebook-, Instagram-, TikTok-, LinkedIn- und YouTube-Ableitungen
- CTA zurück zu Dossier oder Beteiligung
- KPI: Reichweite, Watchtime, Klicks, Beteiligungsstarts und qualifizierte Beiträge

## CAMPAIGN-SERIES-02

**Status:** `blocked`

- mindestens drei Themenpakete
- einheitliche Brandvorlage
- unterschiedliche Hook-/Längenvarianten
- wöchentliche Review- und Lernschleife

## CAMPAIGN-FEEDBACK-03

**Status:** `blocked`

- Kommentare und Plattformmetriken zurück in das Dossier
- keine automatische Übernahme als verifizierte Aussage
- neue Fragen und Claims nur als Review-Kandidaten

---

# Phase 5 — Pricing und kommerzieller Betrieb

## PRICING-COST-MODEL-01

**Status:** `blocked`  
**Priorität:** P1  
**Abhängigkeiten:** erste reale Analyse-, Render- und Publishing-Daten

- Kosten je Analyse, Dossier, Render, Speicher, Veröffentlichung und Monitoring
- B2C, B2B und B2G getrennt
- Limits, Add-ons und Fair-Use

## PRICING-PACKAGES-02

**Status:** `blocked`

- konkrete Pakete und Leistungsgrenzen
- kein Preis ohne Kosten- und Wertannahme
- Rechts-/Vertragsprüfung

## PRICING-RUNTIME-03

**Status:** `blocked`

- `/pricing`, `/order`, Entitlements und Abrechnungssignale synchronisieren
- keine Fake-Buchung oder still aktivierte kostenpflichtige Provider

---

# Sichere Parallelisierung

Nach PROD-PR-CHAIN-01 dürfen getrennt vorbereitet werden:

1. **Production manuell:** PROD-RUNTIME-02
2. **Create Review:** CREATE-VISUAL-PARITY-01 ohne neue Runtime
3. **Runden UX/Contract:** RUNDEN-PARTICIPATION-WORKSPACE-01 ohne Persistenzänderung
4. **Live Architektur:** LIVE-PRODUCT-CONTRACT-01
5. **Voxy Architektur:** contract- und dokumentationsbasiert, keine Runtime-Claims
6. **Marketing:** Quellen- und Kampagnenpakete ohne Veröffentlichung
7. **Facebook:** Profil-/Seiteneinrichtung ohne Einladungen, Boosts oder Posts

Nicht parallel verändern:

- dieselben Kernverträge
- Migrationsdateien
- `OpenTasks.md`-Kopf
- Production-ENV
- Publishing- und Review-Statusmodelle

---

# Nächste verbindliche Reihenfolge

1. `PROD-RUNTIME-02` manuell abschließen.
2. `PROD-E2E-SMOKE-03` auf Desktop und Mobile durchführen.
3. `CREATE-VISUAL-PARITY-01` anhand echter Smoke-Ergebnisse schließen oder fokussiert nacharbeiten.
4. `DOSSIER-WORKSPACE-01` und `RUNDEN-PARTICIPATION-WORKSPACE-01` auf getrennten Branches starten.
5. `LIVE-PRODUCT-CONTRACT-01` parallel als Architektur-Slice ausarbeiten.
6. Erstes Quellen- und Kampagnenpaket vorbereiten.
7. Facebook-Seite und übrige Profile veröffentlichungsbereit machen, aber noch nicht posten.
8. Voxy-Briefing-Runtime erst nach Dossier-Master-Content-Vertrag aktivieren.

# Endgültige Definition of Done

Der Plan gilt erst als vollständig umgesetzt, wenn:

- Production und Rollback praktisch geprüft sind
- `/create`, `/runden`, `/dossier` und `/live` mit echten persistenten Daten laufen
- Create → Beteiligung → Dossier → Master Content → Voxy → Review → Render → Publishing → Analytics/Feedback durchgängig funktioniert
- mindestens ein Website- und ein freigegebener Social-Beitrag aus derselben kanonischen Kette stammen
- kein Pflichtschritt Canva, CapCut, HeyGen oder ein anderes manuelles Inseltool voraussetzt
- externe Provider austauschbar bleiben
- Scheduling, Retry, Monitoring, Rollback und Kill Switch getestet sind
- Pricing auf realen Kosten- und Nutzungsdaten beruht
- OpenTasks, Issue #310, Kalender und PR-Status denselben Wahrheitsstand zeigen
