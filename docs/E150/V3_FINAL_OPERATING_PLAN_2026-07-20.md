# V3 Final Operating Plan — 2026-07-20

## Zweck

Dieses Dokument verbindet Kalender, `docs/E150/OpenTasks.md`, Issue #310 und die aktuelle PR-Kette zu einer direkt fortsetzbaren Ausführungsreihenfolge.

Es beschreibt **nicht** bereits erreichte Produktionsreife. Ein Block gilt erst als abgeschlossen, wenn Code, Tests, Preview-/Production-Smoke und SSOT-Nachzug vollständig sind.

## Verbindliche Regeln

- Kein Auto-Publish für öffentliche, politische oder gesellschaftliche Inhalte.
- Review-first vor Rendering und Veröffentlichung.
- Keine Fake-Erfolge, Demo-Persistenz oder stillen Fallbacks im Produktionspfad.
- Externe Dienste nur als austauschbare Provider-Adapter.
- Jeder Slice hat genau einen fachlichen Schwerpunkt und einen klaren Datei-/Runtime-Scope.
- Parallelisierung nur bei getrennten Dateien, Datenmodellen und PR-Abhängigkeiten.
- `/create`, `/runden`, `/dossier` und `/live` sind getrennte Produktflächen, aber Teil derselben kanonischen Datenkette.

## Definitionen

Statuswerte: `blocked`, `codex_ready`, `in_progress`, `review`, `manual_gate`, `done`.

Ein Slice benötigt:

- ID, Status, Priorität und Abhängigkeiten
- Scope und Non-Goals
- Akzeptanzkriterien
- automatisierte Tests
- manuellen Smoke
- SSOT-/Dokumentationsnachzug

---

# Phase 0 — Produktionswahrheit

## PROD-PR-CHAIN-01

**Status:** `in_progress`  
**Priorität:** P0  
**Abhängigkeiten:** keine

**Scope**

- offene PRs #391–#398 fachlich und technisch isolieren
- Merge-Reihenfolge festlegen
- gestapelte oder veraltete Branch-Basen erkennen
- keine breite Sammel-Merge-Kette

**Akzeptanzkriterien**

- für jeden PR: behalten, neu basieren, aufteilen oder schließen
- alle Pflichtchecks grün
- keine offenen Review-Threads
- dokumentierte Merge-Reihenfolge

**Non-Goals**

- keine neue Produktfunktion
- kein Auto-Merge

## PROD-RUNTIME-02

**Status:** `blocked`  
**Priorität:** P0  
**Abhängigkeiten:** PROD-PR-CHAIN-01

**Scope**

- Vercel-Projekt, Production Branch und Domains bestätigen
- Preview/Production ENV trennen
- echte Web-Postgres-Verbindung und Provider-Konfiguration setzen
- Rollback nachweisen

**Akzeptanzkriterien**

- Production verwendet den erwarteten `main`-Stand
- ENV-Guardrails laufen grün
- fehlende Runtime zeigt ehrlichen Fehler
- Rollback ist praktisch möglich

## PROD-E2E-SMOKE-03

**Status:** `blocked`  
**Priorität:** P0  
**Abhängigkeiten:** PROD-RUNTIME-02

**Scope**

- Desktop und Mobile
- Registrierung/Login, `/create`, Dossier-Aufruf, Beteiligung, Review, Fehler/Retry
- Admin-Telemetrie ohne Secrets oder Rohprompts

**Akzeptanzkriterien**

- keine Demo-/Fake-Erfolge
- persistierte Daten nach Reload vorhanden
- reproduzierbarer Smoke-Bericht

---

# Phase 1 — Produktflächen parallelisieren

## CREATE-VISUAL-PARITY-01

**Status:** `blocked`  
**Priorität:** P0  
**Abhängigkeiten:** Merge und Smoke von PR #391

**Scope**

- `/create` gegen das verbindliche Zielbild angleichen
- Chat-Workspace, Pipeline, Structure Rail und Themenzweige
- Desktop-/Mobile-Screenshot-Akzeptanz

**Non-Goals**

- kein `/runden`- oder Dossier-Komplettumbau
- keine Provider-Aktivierung

**Tests/Smoke**

- fokussierte UI-Contracts
- Screenshotvergleich Desktop/Mobile
- 2, 7, 14 und 12+ Dokumentthemen

## CREATE-PARTICIPATION-HANDOFF-02

**Status:** `blocked`  
**Priorität:** P0  
**Abhängigkeiten:** CREATE-VISUAL-PARITY-01

**Scope**

- ausgewählte Themen idempotent als reviewpflichtigen Beteiligungsentwurf persistieren
- Nutzer bestätigt Zweige, Format und Ortsbezug
- keine automatische Veröffentlichung

**Akzeptanzkriterien**

- Reload-sichere Draft-Persistenz
- keine Duplikate bei Retry
- klarer Übergang zu `/runden` oder Dossier

## RUNDEN-PARTICIPATION-WORKSPACE-01

**Status:** `codex_ready` nach Scope-Lock  
**Priorität:** P0  
**Abhängigkeiten:** Datenvertrag aus CREATE-PARTICIPATION-HANDOFF-02; UX-Arbeit darf vorher separat vorbereitet werden

**Scope**

- eigenes `/runden`-Zielbild
- Rundenstatus, Beteiligungsformat, Teilnehmerrollen und Moderationszustände
- kleiner Assistant Dock statt zentralem Create-Chat
- nachvollziehbarer Übergang aus Create-Drafts

**Akzeptanzkriterien**

- keine Demo-Abstimmung
- Status und nächster Schritt sind verständlich
- Mobile-/Desktop-Contracts
- persistierte Runden laden nach Reload

**Non-Goals**

- kein Dossier-Redesign
- kein `/live`-Realtime

## DOSSIER-WORKSPACE-01

**Status:** `blocked`  
**Priorität:** P0  
**Abhängigkeiten:** Merge/Entscheidung PR #397

**Scope**

- eigenes Dossier-Zielbild und Informationsarchitektur
- Quellen, Claims, Positionen, offene Fragen, Beteiligungsstände und Reviewstatus
- kanonische Links statt `/dossier/demo`

**Akzeptanzkriterien**

- echte Dossier-ID und Persistenz
- keine lokale Fake-Vote-Bestätigung
- Quellen-/Claim-Lücken sichtbar
- Mobile-/Desktop-Smoke

## DOSSIER-CONTENT-VOXY-BRIDGE-02

**Status:** `blocked`  
**Priorität:** P0  
**Abhängigkeiten:** DOSSIER-WORKSPACE-01

**Scope**

- Dossier erzeugt strukturiertes Master-Content-Paket
- These, Gegenposition, Quellenstand, CTA und offene Risiken
- Übergabe an Voxy-Video-Flow

---

# Phase 2 — `/live` vollständig ergänzen

## LIVE-PRODUCT-CONTRACT-01

**Status:** `codex_ready`  
**Priorität:** P0  
**Abhängigkeiten:** keine Runtime-Abhängigkeit; Architektur-Slice

**Scope**

- Zweck und Abgrenzung von `/live`, `/stream`, `/runden` und Dossier
- Rollen: öffentlich, Teilnehmer, Moderator, Admin
- Sessionstatus und kanonischer Datenfluss

**Akzeptanzkriterien**

- dokumentierter State- und Rollenvertrag
- kein zweites paralleles Beteiligungssystem
- klare Datenschutz-/Moderationsgrenzen

## LIVE-SESSION-RUNTIME-02

**Status:** `blocked`  
**Priorität:** P0  
**Abhängigkeiten:** LIVE-PRODUCT-CONTRACT-01, PROD-RUNTIME-02

**Scope**

- persistente Live-Sessions
- Start/Stop, Join/Leave, Reconnect und Sessionende
- Realtime-Adapter hinter eigener Schnittstelle

**Akzeptanzkriterien**

- zwei Browser können denselben Zustand sehen
- Reconnect verliert keinen bestätigten Beitrag
- keine Admin-only-Skeletonseite als Produktionsclaim

## LIVE-MODERATION-SOURCES-03

**Status:** `blocked`  
**Priorität:** P0  
**Abhängigkeiten:** LIVE-SESSION-RUNTIME-02

**Scope**

- Moderation, Quellenhinweise, Claim-Markierung, Missbrauchsschutz und Audit Trail

## LIVE-VOXY-BRIEFING-04

**Status:** `blocked`  
**Priorität:** P1  
**Abhängigkeiten:** LIVE-MODERATION-SOURCES-03, DOSSIER-CONTENT-VOXY-BRIDGE-02

**Scope**

- reviewfähige Zwischen- und Abschlusszusammenfassungen
- keine automatische öffentliche Aussage ohne Freigabe

## LIVE-PUBLIC-SURFACE-05

**Status:** `blocked`  
**Priorität:** P1  
**Abhängigkeiten:** LIVE-SESSION-RUNTIME-02

**Scope**

- öffentliche Live-Ansicht, Mobile, Share/QR und Beteiligungs-CTA

## LIVE-PRODUCTION-SMOKE-06

**Status:** `blocked`  
**Priorität:** P0  
**Abhängigkeiten:** LIVE-PUBLIC-SURFACE-05, LIVE-MODERATION-SOURCES-03

**Smoke-Matrix**

- Moderator + zwei Teilnehmer
- Join/Reconnect
- Beitrag, Moderationsentscheidung, Quelle
- Sessionende und Dossier-Handoff
- Fehlerfall und Rollback

---

# Phase 3 — Voxy, Rendering und Publishing

Issue #310 bleibt der fachliche Master. Die operative Umsetzung wird in folgende PR-fähige Slices zerlegt.

## VOXY-BRIEFING-RUNTIME-01

**Status:** `blocked`  
**Priorität:** P0  
**Abhängigkeiten:** DOSSIER-CONTENT-VOXY-BRIDGE-02

- deaktivierte Contracts in echte persistente, idempotente Briefing-Jobs überführen
- Provider neutral; keine Veröffentlichung

## VOXY-SCRIPT-REVIEW-02

**Status:** `blocked`

- Scriptvarianten, Sprachen, Quellen- und Rechtsprüfung
- Audit Trail und explizite Freigabe

## VOXY-RENDER-JOB-03

**Status:** `blocked`

- persistente Render-Queue
- 9:16, 1:1, 16:9
- Untertitel, Quellenleiste, CTA, Thumbnail
- Retry ohne doppelte Kosten oder Jobs

## VOXY-PUBLISH-QUEUE-04

**Status:** `blocked`

- Website- und Plattform-Drafts
- Upload/Scheduling/Post nur nach Freigabe
- Kill Switch, Retry und Statusrückmeldung

## SOCIAL-CONNECTOR-05A/05B/05C

**Status:** `blocked`

- je Plattform ein eigener Adapter-Slice
- keine Zugangsdaten im Repo
- Plattformzugriff und Freigabestatus als manueller Gate

---

# Phase 4 — konkrete Marketingkampagnen

Jede Kampagne ist ein persistentes Paket und kein loses Kalenderereignis.

## CAMPAIGN-REFERENCE-01 — Erstes Referenzthema

**Ziel:** vollständigen eDebatte-Produktfluss öffentlich beweisen.

**Pflichtfelder**

- Kampagnen-ID, Dossier-ID und Zielgruppe
- Hauptthese, faire Gegenposition und Quellenpaket
- Master Content
- 3 Hooks
- Video 30–60 Sekunden
- Website-Beitrag
- TikTok-, Instagram- und LinkedIn-Ableitungen
- CTA zurück zu Dossier/Beteiligung
- KPI: Reichweite, Watchtime, Klicks, Beteiligungsstarts, qualifizierte Beiträge

## CAMPAIGN-SERIES-02 — Wiederholbare Themenserie

- mindestens drei Themenpakete
- einheitliche Brandvorlage
- unterschiedliche Hook-/Längenvarianten
- wöchentliche Review- und Lernschleife

## CAMPAIGN-FEEDBACK-03

- Kommentare und Plattformmetriken zurück in das Dossier
- keine automatische Übernahme als verifizierte Aussage
- neue Fragen/Claims als Review-Kandidaten

---

# Phase 5 — Pricing und kommerzieller Betrieb

## PRICING-COST-MODEL-01

**Status:** `blocked`  
**Priorität:** P1  
**Abhängigkeiten:** erste reale Render-/Publishing-Daten

**Scope**

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

# Parallele Codex-Spuren

Nach Abschluss von PROD-PR-CHAIN-01 dürfen maximal folgende getrennte Spuren parallel laufen:

1. **Create:** CREATE-VISUAL-PARITY-01
2. **Runden UX/Contract:** RUNDEN-PARTICIPATION-WORKSPACE-01 ohne Persistenzänderung bis Create-Handoff-Vertrag steht
3. **Dossier:** DOSSIER-WORKSPACE-01 nach #397
4. **Live Architektur:** LIVE-PRODUCT-CONTRACT-01
5. **Voxy Architektur:** nur dokumentarische/contract-basierte Vorbereitung; keine Runtime-Claims
6. **Marketing:** Kampagneninhalte und Quellenpakete, ohne Veröffentlichung

Keine parallelen Änderungen an denselben Kernverträgen, Migrationsdateien oder SSOT-Abschnitten.

---

# Endgültige Definition of Done

Der Plan gilt erst als vollständig umgesetzt, wenn:

- Production und Rollback praktisch geprüft sind
- `/create`, `/runden`, `/dossier` und `/live` mit echten persistenten Daten laufen
- Create → Beteiligung → Dossier → Master Content → Voxy → Review → Render → Publishing → Analytics/Feedback durchgängig funktioniert
- mindestens ein Website- und ein direkt veröffentlichter Social-Beitrag aus derselben kanonischen Kette stammen
- kein Pflichtschritt Canva, CapCut, HeyGen oder ein anderes manuelles Inseltool voraussetzt
- externe Provider austauschbar bleiben
- Scheduling, Retry, Monitoring, Rollback und Kill Switch getestet sind
- Pricing auf realen Kosten-/Nutzungsdaten beruht
- OpenTasks, Issue #310, Kalender und PR-Status denselben Wahrheitsstand zeigen
