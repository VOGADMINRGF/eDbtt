# GOV-MANDATE-REGISTER / Surface Capture

Stand: 2026-04-30

## Anlass

Im Produktchat wurden mehrere Ideen zu Mandat, VoiceOpenGov-Register, Rollen, B2B/Verbandsansprache und Broschueren-/QR-Bridge konkretisiert. Diese Datei fasst die Entscheidungen so zusammen, dass sie in `OpenTasks.md` und in nachfolgende Codex-PRs ueberfuehrt werden koennen.

## Entscheidungen

### 1. Mandat ist oeffentlich sichtbar, aber rollenbasiert bearbeitbar

- Alle duerfen ein oeffentliches Mandat lesen.
- Eingeloggte Nutzer duerfen kontrolliert Quellen, Einwaende, Folgefragen oder Umsetzungsbeobachtungen einreichen.
- Journalisten/Fachakteure duerfen Quellen-/Factcheck-Hinweise beitragen.
- Verbaende, Verwaltungen, Repräsentanten und Projektverantwortliche duerfen eigene Mandate annehmen/pflegen.
- Admins duerfen Verifizierung, Sichtbarkeit und Konflikthinweise verwalten.

Leitsatz:

> Das Mandat gehoert der Oeffentlichkeit. Die Bearbeitung gehoert legitimierten Rollen.

### 2. `/mandat` ist kein neuer Debattenraum

`/mandat/[id]` soll nicht wie eine Kommentarspalte oder zweite Runde wirken. Die Ansicht ist ein Nachweis- und Umsetzungsraum:

- Was wurde aus Beteiligung/Runde/Dossier?
- Was ist der Auftrag oder Ergebnistext?
- Wer ist verantwortlich?
- Welche Quellen/Protokolle stuetzen es?
- Welche Einwaende bleiben offen?
- Was ist der Status und der naechste Schritt?

Beteiligung auf Mandat ist moeglich, aber als Quelle, Einwand, Folgefrage oder Umsetzungsbeobachtung, nicht als freies `Dein Beitrag zaehlt`-Eingabefeld.

### 3. eDebatte und VoiceOpenGov teilen Identity/Mitgliedschaft und Mandat

- VoiceOpenGov fuehrt Mitgliedschaft, Rollen, Verifizierung und Mandatsregister.
- eDebatte erzeugt Dossiers, Runden, Beteiligungsergebnisse und Mandate.
- Ein Mandat wird nur mit Zustimmung und definierter Sichtbarkeit in das VoiceOpenGov Mandatsregister uebernommen.
- VoiceOpenGov kann autark Mitgliedschaften aufnehmen; eDebatte kann in diesen Prozess ueberleiten.

### 4. Wording-Guardrail

Zu vermeiden:

- Parteienbuch
- dynamisches Parteienbuch
- Lagerdatenbank
- Fraktionszuordnung durch Abstimmungsverhalten
- automatische politische Klassifizierung

Zulaessig / bevorzugt:

- Mandatsregister
- VoiceOpenGov Mandatsregister
- Beteiligungs- und Mandatsregister
- Verantwortungsregister
- Mandat als Verantwortung, Herkunft und Status

### 5. Surface-Familie statt Einheitsansicht

Die Broschueren-/Mockup-UI kann als Designrichtung dienen, aber nicht 1:1 fuer alle Funktionen:

- Dossier-Workbench: Thema, Quellen, offene Fragen, Beitraege.
- Runden-Workbench: Beteiligung, Optionen, Abstimmung, Beteiligungsstand.
- Mandats-Workbench: Beschluss, Verantwortung, Herkunft, Status, Umsetzung.

### 6. B2B/Print/QR Bridge

Die Idee `Brief bleibt analog, Beteiligung nicht` ist stark fuer Verbaende, Medien, kommunale Akteure und Kammern. Der QR-Code sollte auf zielgruppenspezifische Landingpages oder Demo-Kontexte fuehren, nicht pauschal auf die Startseite. Beispielansichten muessen als beispielhaft markiert werden, solange sie nicht live exakt so existieren.

## Direkt daraus abgeleitete Tasks

Siehe `docs/E150/OpenTasks_MANDATE_REGISTER_SURFACES_2026-04-30.md` fuer den uebernahmefertigen OpenTasks-Block und Codex-PR-Prompt.
