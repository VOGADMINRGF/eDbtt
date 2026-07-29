# STUDIO-OPERATOR-EVENT-DISTRIBUTION-01

Datum: 2026-07-29  
Status: Produktentscheidung umgesetzt in Draft-PR #520

## Entscheidung

Die bestehende Route `/studio` wird als gemeinsame Betreiber-, Event-, Live-, Zugangs-, Verteilungs- und Auswertungsfläche weiterentwickelt.

`/studio` ersetzt die öffentliche Produktbezeichnung `/qr-studio`. Die frühere Route bleibt nur als kompatible Weiterleitung erhalten.

Das Studio ist kein zweiter Inhaltseditor und keine neue Oberdomäne neben Anlassraum, Dossier, Runde oder Beteiligungsraum.

## Verbindliche Surface-Abgrenzung

| Surface | Verantwortung |
| --- | --- |
| `/create` | freien Input verstehen, strukturieren und einen reviewfähigen Arbeitsstand vorbereiten |
| `/anlassraum` bzw. `/runden` | dauerhaften Themen-, Kontext-, Betreiber- und Beteiligtenraum halten |
| `/dossier/[id]` | Quellen, Claims, Positionen, Gegenpositionen, Evidenzen und offene Fragen verdichten |
| Runde / Beteiligungsraum | konkrete Beteiligungsphase, Frageformen, Optionen, Moderation und Freigabestatus halten |
| `/studio` | Zugang, QR, Organisation, Event, Live, Verteilung und Auswertung auf einem bestehenden Ziel koordinieren |
| `/beteiligung/[slug]` | reduzierte direkte Teilnahme |
| `/swipes` | schneller Modus derselben freigegebenen Beteiligungsphase |
| `/qr/[code]` | direkter codebasierter öffentlicher Einstieg |

## Betreiberfälle

### Öffentlich

- Bürgerdialog
- öffentliche Kampagne
- Initiative
- offene Runde
- kommunaler Beteiligungsanlass

### Intern

- Mitarbeiterbefragung
- Team- oder Bereichsfeedback
- Unternehmens-Townhall
- Vereins- oder Verbandsbefragung
- Gremien- und Mitgliedereinordnung

### Event & live

- Workshop
- Mitgliederversammlung
- Konferenz
- Podium
- Bürgerversammlung
- Livestream
- moderierte Session mit Beamer- oder Bühnenansicht

## Organisations- und Bezahlgrenze

Kostenpflichtige Organisationsfunktionen dürfen operative Mehrwerte liefern, aber keine epistemische oder demokratische Sondermacht.

Mögliche Professional-Layer-Funktionen:

- Organisationsbranding und Veranstaltungsauftritt,
- rollenbezogene Betreiber- und Moderationsrechte,
- Einladungen und vorhandene Zugangspolitiken,
- Event- und Sessionsteuerung,
- Exporte, Berichte und organisationsbezogene Auswertung,
- Support und betreute Einrichtung,
- höhere betriebliche Limits im Rahmen des Pricing-Contracts.

Nicht käuflich oder privilegierbar:

- Wahrheit oder Faktenstatus,
- Quellenbewertung ohne Beleg,
- politisches Gewicht,
- Stimmgewicht,
- Priorisierung öffentlicher Positionen,
- Auto-Publish oder versteckte Ergebnismanipulation.

Interne Unternehmens- oder Vereinsbefragungen dürfen ihren zulässigen Teilnehmerkreis und ihre Ergebnisfreigabe steuern. Diese Betreiberentscheidung darf nicht still auf öffentliche demokratische oder VOG-Verfahren übertragen werden.

## Sieben bestehende Agentenrollen

Es wird kein achter Agent und keine parallele Agentenplattform eingeführt.

1. **Intake-/Composer-Rolle**
   - arbeitet primär an `/create`,
   - erkennt Anlass, Claims, Vorschläge, Gegenpositionen, offene Fragen und Formatbedarf.

2. **Anlassraum-/Context-Rolle**
   - ordnet Region, Scope, Beteiligte, Stakeholder und Ziel,
   - hält Parent-/Child- und Kontextbezüge reviewfähig.

3. **Dossier-/Evidence-Rolle**
   - strukturiert Quellenbedarf, Claims, Gegenpositionen, Evidenzkonflikte und Factcheck-Fragen,
   - behauptet keine Verifikation ohne belegten Lauf.

4. **Participation-Design-Rolle**
   - empfiehlt Beteiligungsformat, Fragen, Optionen, Neutralitäts- und Bias-Prüfung,
   - aktiviert oder veröffentlicht nichts selbstständig.

5. **Studio-/Distribution-Rolle**
   - bereitet QR, Link, Print, Embed, Event- und Live-Handoffs auf einem bestehenden Ziel vor,
   - erzeugt keine neue Inhalts- oder Beteiligungswahrheit.

6. **Analytics-/Reporting-Rolle**
   - verdichtet reale, zulässige Auswertungsdaten,
   - trennt Teilnahmetrends von Wahrheit, Legitimation und Repräsentativität.

7. **Support-/Operations-Rolle**
   - begleitet Freigaben, Rollen, Störungen, Datenschutz- und Betriebsfragen,
   - respektiert Audit, Kill-Switch, Kosten- und Berechtigungsgrenzen.

Die Rollen arbeiten auf denselben kanonischen Objekten und bestehenden Review-/Auditpfaden. Sie eröffnen weder eigene Queues noch voneinander abweichende Persistenzwelten.

## Folge-Slice: PARTICIPATION-COMPOSER-AUTO-ANALYSIS-01

Der Folge-Slice gehört in den bestehenden `/create`-Pfad und nicht in `/studio`.

### Ziel

Nach Eingabe eines Textes soll eDebatte automatisch einen reviewfähigen Analyse- und Beteiligungsvorschlag vorbereiten, statt Absätze mechanisch in Fragen umzuwandeln.

### Inhalt

- kurze Eingabepause vor der Basisauswertung,
- deterministische Sofortanalyse ohne versteckten Providerlauf,
- Anlass und Kernaussage,
- Claim-Erkennung und Claim-Typen,
- Vorschläge und mögliche Handlungsoptionen,
- Gegenpositionen, Einwände und fehlende Perspektiven,
- offene Fragen,
- Quellen- und Factcheck-Bedarf,
- betroffene Gruppen, Stakeholder und Gemeinwohlspannungen,
- Entscheidungsspielraum, Zuständigkeit und Scope,
- transparente Reifecheckliste statt scheinpräzisem Gesamtscore,
- Empfehlung eines geeigneten Beteiligungsformats,
- eigene Frageart und eigene Antwortoptionen je Frage,
- Bias-, Neutralitäts-, Symmetrie-, Minderheiten- und Übersetzungsprüfung,
- sichtbare Herkunft jeder Ableitung aus Textpassage, Claim, Position oder Quellenbedarf,
- optionaler, bewusst ausgelöster Voxy-Vertiefungsschritt,
- Handoff in Anlassraum, Dossier, Runde oder Beteiligungsraum,
- QR- und Studio-Schritt erst nach Bindung an ein kanonisches Ziel.

### Guardrails

- kein Auto-Publish,
- kein Auto-Poll,
- kein Anlassraum-Autostart,
- keine erfundene Quelle,
- kein erfundenes Factcheck-Ergebnis,
- kein stiller kostenpflichtiger Providerlauf,
- keine Übersetzung als Evidenz,
- keine Mehrheits- oder Teilnehmerzahl als Wahrheit,
- keine parallele Persistenz oder Queue.

### Abhängigkeiten

Die technische Umsetzung bleibt abhängig von den bestehenden operativen Kernaufgaben und Gates, insbesondere:

- `CREATE-DEBATTENSTAND-01`,
- `DOSSIER-WORKSPACE-01`,
- `RUNDEN-PARTICIPATION-WORKSPACE-01`,
- `AI-RUNTIME-POLICY-01`,
- produktiver Draft-/Handoff-Wahrheit und authentifizierter Runtime-Abnahme.

Der Contract darf vor diesen Abhängigkeiten vorbereitet werden; echte Provider-, Write-, Publish- oder Aktivierungswahrheit darf nicht vorweggenommen werden.

## Guardrails des Studio-Slices

- keine neue Studio-Persistenz,
- keine neue Organisation-, Event- oder Live-Runtime,
- keine neue Agentenarchitektur,
- keine automatische Aktivierung oder Veröffentlichung,
- öffentliche QR-Scans führen direkt zur Beteiligung oder zum kanonischen Ziel,
- `/qr-studio` bleibt nur Redirect-Kompatibilität,
- vorhandene `/studio`-Fachbereiche bleiben erreichbar,
- Mobile-Teilnahme und Operator-Studio bleiben als unterschiedliche Nutzungskontexte erkennbar.
