# PREMIUM-DOSSIER-TO-QUESTIONS-01

## Produktziel

Premium soll den Einstieg von **einer Frage** auf **ein ganzes Dokument / Dossier** erweitern.

Beispiele:
- Parteiprogramm oder Wahlprogramm
- wissenschaftliche Veröffentlichung / Studie
- Vereinskonzept oder Satzungs-/Strategiedokument
- Unternehmensstrategie, Mitarbeiter- oder Kundenunterlage
- journalistisches Recherche-Dossier

Gewünschter Flow:

`Dokument hochladen → Inhalte strukturieren → mehrere relevante Fragen vorschlagen → passende Antwortmöglichkeiten vorschlagen → menschliche Prüfung → ausgewählte Fragen als eDebatte-Runden vorbereiten`

## Öffentliche Kommunikation

Bis der End-to-End-Flow produktionswahr verfügbar ist, darf die Landingpage **nicht** behaupten, dass ein Dossier bereits automatisch in mehrere veröffentlichbare Fragen umgewandelt wird.

Zulässige Vorankündigung:

> **Premium: Ganze Dossiers statt Frage für Frage.** Lade künftig z. B. ein Parteiprogramm, eine Studie oder Vereinsunterlagen hoch. eDebatte bereitet daraus mehrere Fragen und mögliche Antworten zur Prüfung vor. Veröffentlichung bleibt immer deine Entscheidung.

Sobald die DoD unten erfüllt ist, kann `künftig` entfallen.

## Bestehende Grundlage

- Material-/Upload-Intake existiert.
- Dossier-Studio-Entitlement existiert.
- Material Extraction / Dossier Handoff ist im Repository angelegt.
- Aktueller Upload-Endpunkt bestätigt ausdrücklich noch **keine** automatische Extraktion, KI-Recherche oder Veröffentlichung. Deshalb keine überzogene Public Claim vor End-to-End-Abnahme.

## Definition of Done

- [ ] authentifizierter Premium-/Dossier-Studio-Nutzer kann ein unterstütztes Dokument hochladen
- [ ] Extraktion läuft produktionswahr und nachvollziehbar
- [ ] System schlägt mehrere getrennte Fragen vor
- [ ] System schlägt pro Frage geeignete Antwortmöglichkeiten vor, ohne sie als Fakten auszugeben
- [ ] Quellen-/Seitenbezug bleibt nachvollziehbar
- [ ] Nutzer kann jede Frage/Antwort ändern, verwerfen oder freigeben
- [ ] keine automatische Veröffentlichung
- [ ] Review-/AI-Transparenz sichtbar
- [ ] Tests für Programm/Studie/Vereinsdokument
- [ ] Landingpage-Claim wird erst danach von `künftig` auf verfügbar umgestellt

## Priorität

P0/P1 nach Stabilisierung von #656 und offenem Beitragsmodus #657. Der Premium-Mehrwert soll auf der GTM-Landingpage sichtbar werden, aber nur produktionswahr.