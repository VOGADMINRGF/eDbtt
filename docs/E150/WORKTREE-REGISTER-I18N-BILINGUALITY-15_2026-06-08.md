# WORKTREE-REGISTER-I18N-BILINGUALITY-15

Datum: 2026-06-13
Geprüfter Commit-Stand: `46f03d0b` (`fix(create): isolate planner fallback copy`)

## Warum Bilingualität ergänzt wurde

Der nächste technische Restdrift im Worktree liegt weiterhin im Create-/Ledger-/Place-Kontext. Parallel dazu fehlt in `OpenTasks.md` bislang ein sauber sichtbarer Produkt-/Architekturblock für Bilingualität und Internationalisierung.

Dieser Task hält deshalb DE/EN-Basisanforderungen und Guardrails explizit fest, ohne sie mit dem laufenden technischen Restdrift zu vermischen.

## Aktueller Stand

Bilingualität ist noch nicht implementiert.

Nicht vorhanden sind aktuell insbesondere:

- kein belastbarer globaler DE/EN-Produkt-Frame
- kein zentraler Language Switcher
- kein systematisches Copy-Dictionary für Kernsurfaces
- kein durchgängiges Sprachmodell für Beiträge, Dossiers, Anlassräume und Quellen
- kein Review-Gate für sensible Übersetzungen

## Was bereits indirekt vorbereitet ist

Einzelne Teile des Codes tragen bereits Locale- oder Copy-Strukturen, etwa in operator-/surface-nahen Textmodulen oder im aktuellen Create-Umfeld. Diese indirekten Vorbereitungen sind aber noch kein belastbares, produktweites I18N-System.

Wichtig:

- bestehende deutsche UX bleibt aktuell primär
- vorhandene Textmodule ersetzen noch kein vollständiges Bilingualitätskonzept
- aktuelle Restdrift-Cluster bleiben technisch getrennt

## Was offen bleibt

Als eigener späterer Produkt-Slice offen:

- DE/EN-Basisstruktur für eDebatte/VOG
- Language Switcher
- Copy-Dictionary / Translation-Layer für zentrale UX-Flächen
- Sprachkennzeichnung für Beiträge, Dossiers, Anlassräume und Quellen
- Erhalt der Originalsprache
- Hilfs-/Lesefassung für Übersetzungen
- Reviewpflicht für sensible Übersetzungen
- spätere EU-/internationale Kommunen-/Organisationen-Fähigkeit

Mögliche spätere Subtasks:

- `I18N-COPY-DICTIONARY-01`
- `I18N-LANGUAGE-SWITCHER-02`
- `I18N-CONTENT-LANGUAGE-MODEL-03`
- `I18N-TRANSLATION-REVIEW-GUARD-04`
- `I18N-DOSSIER-ANLASSRAUM-BILINGUAL-SURFACES-05`

## Guardrails

Verbindlich festgehalten:

- keine Auto-Übersetzung ohne Kennzeichnung
- kein Überschreiben der Originalsprache
- keine automatische Verifikation übersetzter Inhalte
- Übersetzungen dürfen Factcheck-/Review-Status nicht ersetzen
- Bilingualität darf Create-/Dossier-/Anlassraum-Flows nicht blockieren
- kein großer Rewrite der bestehenden deutschen UX

## Abgrenzung zu aktuellen Restdrift-Clustern

Bewusst nicht Teil des aktuellen technischen Restdrifts:

- Create-/Planner-/Followup-Rest
- Contribution-Ledger-/Handoff-Persistenz
- Multibranch-/Place-/Street-Cluster
- Factcheck-/Account-/Review-Reste

Der nächste technische Task bleibt deshalb weiterhin der Contribution-Ledger-/Handoff-Persistenz-Cluster. I18N/Bilingualität ist separat als offener Produktblock registriert und soll erst in einem eigenen Slice konkretisiert werden.
