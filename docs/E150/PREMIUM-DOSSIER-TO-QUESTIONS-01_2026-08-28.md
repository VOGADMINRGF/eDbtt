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
- Der Upload-Endpunkt extrahiert Textdateien sowie textbasierte PDF- und DOCX-Dateien lokal aus den echten Upload-Bytes und speichert den Volltext privat und reviewpflichtig.
- Bildbasierte Scan-PDFs starten kein OCR und degradieren mit einem expliziten Leertext-Status. Legacy-`.doc` benötigt weiterhin eine externe Konvertierung.
- Lokale Textextraktion startet weder KI-Recherche noch Veröffentlichung. Deshalb bleibt der öffentliche Premium-End-to-End-Claim bis zur vollständigen Review- und Persistenzabnahme als Vorankündigung markiert.

## Implementierungsstand `PREMIUM-DOC-01`

Der P0-Parserpfad verwendet serverseitig `pdf-parse` für PDF und `mammoth` für DOCX. Er begrenzt Dateigröße, PDF-Seiten und Volltextlänge, plausibilisiert MIME-Typ, Endung und Binärsignatur und liefert stabile Fehlergründe ohne Rohmaterial in Responses oder öffentliche Stores zu schreiben. Der bestehende Material-Intake führt lokale Dokumentextraktion als eigenen Zustand; Herkunft und Format bleiben am privaten Volltext nachvollziehbar.

P1 verwendet die bestehende `material_grounding`-Providerreihenfolge und akzeptiert ausschließlich strikt validiertes JSON. Fragen benötigen echte Dokumentanker; als Dokumentinhalt deklarierte Optionen müssen wörtlich im privaten Volltext vorkommen. Zusätzliche Optionen sind sichtbar als KI-Vorschlag markiert. Bei fehlendem oder ungültigem Provider-Output bleibt der Flow kontrolliert degradiert und erzeugt keine Fake-Drafts.

Eine eigene Review-Ansicht zeigt reale Graph-Matches, Gap-Analyse und Empfehlung, bezeichnet diese aber ausdrücklich nicht als Entscheidung. Alle Fragen, Optionen, Weiterführungsarten und Auswahlen sind vor der Bestätigung editierbar. Nichts ist vorausgewählt. Erst eine explizite Bestätigung persistiert die ausgewählten Vorschläge über den bestehenden Create-Saved-Workstate-Store als private beziehungsweise organisationsinterne `question_candidate`-Arbeitsstände. Dabei entstehen keine Runde, keine Veröffentlichung, kein Graph-Write und kein Merge.

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
