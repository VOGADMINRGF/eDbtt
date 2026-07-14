# V3 Civic Principles / GOV-light / Municipal Handoff Decision 2026-07-14

## Scope

- Task: `V3-CIVIC-PRINCIPLES-GOV-LIGHT-MUNICIPAL-HANDOFF-DECISION-01`
- Branch: `pr/v3-civic-principles-gov-light-municipal-handoff-decision-01`
- Primary role: `governance_compliance`
- Supporting roles: `dossier_briefing`, `participation_moderation`
- Typ: decision and contract slice / keine Runtime-Aktivierung / keine externe Benachrichtigung / keine Entitlement-Aktivierung

## Ziel

Die Produktverfassung fuer oeffentlichen Diskurs, Mehrheitsprinzip, GOV-light, Verified Publisher Preflight und Municipal Handoff repo-seitig so festziehen, dass der bisherige Controlled-Agentic-Handoff-Pfad nicht mehr an einer offenen Produktentscheidung haengt.

## Getroffene Entscheidungen

### 1. eDebatte ist keine Ja/Nein-Abstimmungsmaschine

Oeffentliche Diskursformate werden standardmaessig nicht als reine Ja/Nein-, Dafuer/Dagegen- oder Empoerungszaehlung modelliert.

Bevorzugte oeffentliche Formate:

- Abwaegungsfrage
- Priorisierungsfrage
- Optionsvergleich
- Bedingungsfrage
- Umsetzungspfad
- Stimmungsbild mit Kontext
- Debattenstand mit Argumenten
- Beteiligungsthema mit Handlungsspielraeumen

Nicht als Default:

- reine Ja/Nein-Abfrage
- reine Zustimmung/Ablehnung
- Prangerfrage
- Suggestivfrage
- Empoerungszaehlung
- Mehrheitsbildung gegen Grundsaetze

Interne Review-, Freigabe- und Operator-Gates duerfen weiterhin binaere technische Zustaende haben.

### 2. Mehrheitsprinzip nur innerhalb der eDebatte-Grundsaetze

Teilnahme an eDebatte bedeutet:

- an Optionen, Prioritaeten, Bedingungen, Abwaegungen und Umsetzungspfaden mitzuwirken
- den sichtbar werdenden demokratischen Mehrheitswillen als Orientierung ernst zu nehmen

Die Mehrheit darf nicht:

- Grundsaetze aushebeln
- diskriminieren
- manipulieren
- Faktenlage verdecken
- Minderheitenargumente unsichtbar machen
- Schutzrechte verletzen
- Amtlichkeit oder Rechtswirkung vortaeuschen
- Beteiligung als verbindliches Referendum missverstehen lassen

### 3. Verbindliche eDebatte-Grundsaetze

Als zentraler Contract gelten:

- demokratische Teilhabe
- Transparenz
- keine Manipulation
- keine Diskriminierung
- keine Hetze
- keine versteckte politische Profilierung
- keine Irrefuehrung ueber Amtlichkeit oder Rechtswirkung
- keine sensiblen personenbezogenen Daten ohne klare Grundlage
- keine Premium-Stimmengewichtung
- keine Fake-Quellen
- keine Fake-Beteiligung
- keine Suggestiv- oder Prangerfragen
- relevante Gegenargumente, Quellenlimits und Kontext werden nicht systematisch versteckt
- oeffentlicher Zustaendigkeits- oder Themenbezug bleibt plausibel
- oeffentliche Debattenstaende bleiben frei lesbar

### 4. GOV-verifizierte Behoerden duerfen Themen aus dem System weiterfuehren

Eine GOV-verifizierte Behoerde darf Themen, Debattenstaende oder Beteiligungsvorlagen aus dem System weiterfuehren, wenn sie zustaendig ist, die Weiterfuehrung praktisch moeglich ist und die eDebatte-Grundsaetze gewahrt bleiben.

Dabei gilt ausdruecklich:

- Uebernahme != automatische Umsetzung
- Mehrheitswunsch != Rechtsanspruch
- Thema aus System != amtlicher Beschluss
- Debattenstand oder Umfrage != verbindliches Referendum
- Behoerdenantwort != externe automatische Benachrichtigung

### 5. GOV-light Startpaket

GOV-light gibt einer GOV-verifizierten Behoerde drei aktive GOV-light Beteiligungsthemen oder Umfrage-Slots.

Slot-Verbrauch:

- Lesen verbraucht keinen Slot
- Teaser verbraucht keinen Slot
- Agent-Vorschlag verbraucht keinen Slot
- Debattenstand anschauen verbraucht keinen Slot
- Thema intern vormerken verbraucht keinen Slot
- ein Slot wird erst bei aktiver GOV-light Veroeffentlichung oder Aktivierung verbraucht

GOV-light enthaelt:

- oeffentliche Basisdarstellung
- GOV-verifiziertes Siegel
- einfache Teilnahme- oder Stimmungsuebersicht
- reduzierte Auswertung
- einfache Behoerdenantwort oder Einordnung
- sichtbaren Mehrwert fuer Buerger und Behoerde

GOV-light enthaelt nicht:

- volle Segmentierung
- Vollreport
- tiefe Auswertung
- Exportpaket
- Amtsblatt-, Website- oder Embed-Paket
- CRM-, Stakeholder- oder API-Paket
- unbegrenzte aktive Themen
- automatische externe Behoerdenbenachrichtigung
- automatische Entitlement-Aktivierung

### 6. Verified Publisher Preflight

GOV-verifizierte Behoerden, Redaktionen, Medienhaeuser und vergleichbare verified publisher duerfen nur nach bewusster Veroeffentlichungsaktion und Grundsaetze-Preflight live gehen.

Flow:

1. Publisher klickt bewusst auf `Veroeffentlichen`.
2. System prueft Grundsaetze, Zustaendigkeit, Transparenz, Datenschutz, Framing und Missbrauchsrisiken.
3. Gruen: direkt live.
4. Gelb: Hinweis, Anpassung oder Review erforderlich.
5. Rot: blockiert und manuelle Pruefung erforderlich.

Guardrail:

- kein Agent-Auto-Publish
- keine Veroeffentlichung ohne bewussten Publisher-Klick

### 7. Municipal Handoff

Handoff bedeutet:

- Uebergabe eines geprueften Signals
- Uebergabe eines Buergerinteresses
- Uebergabe eines Debattenstands
- Uebergabe eines Beteiligungsthemas oder Themenvorschlags
- Uebergabe in ein Behoerden- oder Organisationscockpit

Handoff bedeutet nicht:

- automatische externe Behoerdenbenachrichtigung
- automatische Umsetzung
- automatische Adoption
- automatische Entitlement-Aktivierung
- automatischen Behoerdenkontakt ohne menschliche Freigabe

### 8. CRM / Pipeline / Benachrichtigung

Viele Interessierte oder Follower loesen keinen automatischen Behoerdenversand aus.

Erlaubt bleiben:

- Signal-Erkennung
- zuständige Behoerde, Bezirk oder Fachbereich als Kandidat
- Pipeline-Karte
- Wiedervorlage
- Kontaktentwurf
- Visualisierung im Admin- oder Operator-Dashboard
- CRM-Funktionen fuer Follow-up, Status, Wiedervorlage und Verantwortlichkeit
- menschliche Freigabe vor externer Nachricht

Agent darf vorbereiten:

- Wiedervorlagen
- Pipeline-Status
- Visualisierungen
- Entwuerfe
- Hinweise
- Entscheidungsvorlagen

Agent darf nicht:

- externe Nachricht automatisch senden
- Behoerde automatisch kontaktieren
- Adoption automatisch ausloesen
- Entitlement automatisch aktivieren

### 9. Upgrade UX nach GOV-light

Nach Nutzung der GOV-light Slots bleibt die UX value-first:

- Reminder
- NPS-Abfrage
- Transparenz- oder Wirkungsreview
- Agent erklaert Mehrwert
- Upgrade-Hinweise fuer Vollreport, Export, Embed, Amtsblatt, CRM, tiefere Segmentierung und mehr aktive Themen

Keine harte Abschluss- oder Paywall-Dramatik.

## Repo-seitige Konsequenz

- Neues Decision-Evidence-Dokument liegt vor.
- Ein typed Contract fuer Grundsaetze, GOV-light, Publisher-Preflight und Handoff-Grenzen liegt repo-seitig vor.
- `V3-MUNICIPAL-HANDOFF-THREE-ADOPTION-TRIAL-01` bleibt nicht laenger `needs_decision`, sondern ist jetzt `codex_ready`.
- `V3-AGENTIC-CIVIC-E2E-PILOT-01` bleibt trotzdem `blocked`, weil dieser Slice nur die Produktverfassung klaert und noch keinen vollstaendigen Authority-Response-Pilot baut.

## Geaenderte Dateien

- `docs/E150/V3_CIVIC_PRINCIPLES_GOV_LIGHT_MUNICIPAL_HANDOFF_DECISION_2026-07-14.md`
- `docs/E150/V3_MUNICIPAL_HANDOFF_DECISION_BOUNDARY_2026-07-14.md`
- `docs/E150/OpenTasks.md`
- `.codex/agents/bootstrap.json`
- `apps/web/src/features/agenticRuntime/civicPrinciplesGovLightMunicipalHandoffContract.ts`
- `apps/web/tests/civic-principles-gov-light-municipal-handoff.contract.test.ts`
- `apps/web/tests/agent-registry-bootstrap.contract.test.ts`
- `apps/web/tests/admin-system-agentic-runtime-readiness.page.test.tsx`

## Validierung

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/civic-principles-gov-light-municipal-handoff.contract.test.ts tests/agent-registry-bootstrap.contract.test.ts tests/admin-system-agentic-runtime-readiness.page.test.tsx`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`

Keine Runtime wurde aktiviert. Keine externe Benachrichtigung, keine Entitlement-Aktivierung und kein Auto-Publish wurden eingefuehrt.
