# PR-VOG-BETEILIGUNGSRADAR-01 – RUWE-Transfer zu eDebatte / VoiceOpenGov

Status: `codex_ready`
Datum: 2026-04-30
Scope: Produkt-/Marktlogik, Feed-/Ausschreibungsradar, Dossier-/Runden-/Mandats-Handoff

## 1. Ausgangspunkt

Der RUWE-Bid-OS-Prototyp war als Ausschreibungs-, Vertriebs- und Pipeline-Werkzeug gedacht:

```text
Ausschreibung -> Bewertung -> Pipeline -> Angebot -> CRM-/Management-Reporting
```

Fuer eDebatte / VoiceOpenGov wird diese Logik nicht 1:1 als Vertriebssystem uebernommen, sondern in eine demokratische Beteiligungs- und Mandatslogik uebersetzt:

```text
Signal -> Anlassraum -> Dossier -> Runde -> Mandat -> Umsetzung -> Impact
```

Damit wird aus dem RUWE-Ansatz ein **Beteiligungsradar**: VoiceOpenGov erkennt oeffentliche Anlaesse, Ausschreibungen und Beteiligungsbedarfe; eDebatte macht daraus strukturierte Dossiers, Beteiligungsrunden und belastbare Mandate.

## 2. Neuer Produktbegriff

### 2.1 VoiceOpenGov Beteiligungsradar

VoiceOpenGov ist die offene Radar- und Kontextschicht. Sie beobachtet Signale aus:

- oeffentlichen Ausschreibungen fuer Buergerbeteiligung, Moderation, Beteiligungskonzepte und Prozessbegleitung,
- kommunalen Vorhaben, Ratsinformationssystemen, Nahverkehrsplaenen, Stadtentwicklungs- und Bauleitplanungen,
- Beteiligungsportalen, Pressemitteilungen, Foerderprogrammen und Projektseiten,
- Medien-/Community-Signalen, die einen oeffentlichen Klaerungsbedarf anzeigen.

Ziel ist nicht nur, auf Ausschreibungen zu reagieren, sondern frueh zu erkennen, **wo Beteiligung gebraucht wird**.

### 2.2 eDebatte Mandatsradar

eDebatte ist die operative Umsetzungsschicht. Aus einem Signal entsteht ein strukturierter Arbeitsfluss:

1. **Signal**: Ausschreibung, Planungsverfahren, Medien-/Community-Hinweis oder kommunales Vorhaben.
2. **Anlassraum**: thematischer Kontext mit Region, Auftraggeber, Frist, Relevanz und Beteiligungsbedarf.
3. **Dossier**: Quellen, Positionen, offene Fragen, Alternativen, Zustaendigkeiten und Risiken.
4. **Runde**: Beteiligungsformat mit klaren Rollen, Optionen und Abstimmungs-/Rueckmeldelogik.
5. **Mandat**: nachvollziehbare Ergebnis- und Empfehlungsstruktur fuer Verwaltung, Medien, Verbaende, Buerger:innen oder Projekttraeger.
6. **Umsetzung / Impact**: Statusverfolgung, Begruendung, Wirkung und erneute Beteiligung.

## 3. Strategische Positionierung

### 3.1 Nicht: reines Ausschreibungstool

Der Scope darf nicht auf ein klassisches Bid-Tool verengt werden. Ein reines Ausschreibungstool wuerde eDebatte in die Logik einzelner Dienstleisterangebote pressen.

### 3.2 Sondern: Beteiligungsbetriebssystem

Die bessere Positionierung lautet:

> VoiceOpenGov erkennt, wo Beteiligung gebraucht wird. eDebatte macht daraus ein belastbares oeffentliches Verfahren.

Damit grenzt sich eDebatte von klassischen Moderationsbueros ab:

| Klassische Beteiligungsdienstleister | eDebatte / VoiceOpenGov |
| --- | --- |
| Workshop, Moderation, Prozessbegleitung | digitale Beteiligungsinfrastruktur plus menschlich anschlussfaehiger Prozess |
| Projektdokumentation oft als PDF/Abschlussbericht | lebendes Dossier mit Quellen, offenen Fragen und Status |
| Beteiligung beginnt haeufig erst nach Beauftragung | Radar erkennt Signale und Anlaesse frueher |
| einzelne Verfahren | wiederverwendbare Anlassraum-/Dossier-/Rundenlogik |
| Ergebnis als Empfehlung oder Protokoll | Mandat mit Nachvollziehbarkeit, Rollen, Status und Impact |

## 4. Uebersetzung RUWE -> eDebatte

| RUWE-Bid-OS-Begriff | eDebatte-/VoiceOpenGov-Begriff | Ziel |
| --- | --- | --- |
| Ausschreibungsradar | Beteiligungs- und Themenradar | relevante oeffentliche Anlaesse erkennen |
| Tender-Scoring | Beteiligungsrelevanz-Scoring | Prioritaet, Frist, oeffentliche Relevanz und Mandatsfaehigkeit einschaetzen |
| CRM-Pipeline | Kommunen-/Partner-/Mandats-Pipeline | Kontakt, Status und naechste Schritte steuern |
| Angebotsgenerator | Pilot-/Dossier-/Runden-Vorschlag | Beteiligungsformat statt Verkaufsangebot vorbereiten |
| Referenzdatenbank | Best-Practice-/Methoden-/Dossier-Bibliothek | Wiederverwendbarkeit und Qualitaet sichern |
| Agents | Recherche-, Quellen-, Stakeholder-, Kontroversen- und Mandatsagenten | Dossiers strukturiert vorbereiten |
| Management-KPIs | Wirkung, Beteiligungstiefe, Reichweite, Status, Mandatsfaehigkeit | oeffentlichen Nutzen messbar machen |

## 5. Signalquellen fuer das Radar

### 5.1 Offizielle Quellen

- `bund.de` / Service Bund Ausschreibungen
- Landes- und kommunale Vergabeplattformen
- Berlin.de / Landesvergabestellen
- Vergabemarktplatz / kommunale Marktplatzsysteme
- Ratsinformationssysteme
- Beteiligungsportale der Laender und Kommunen
- Amtsblaetter, Projektseiten, Pressemitteilungen

### 5.2 Semantische Suchfelder

Suchbegriffe und Klassifikatoren sollten nicht nur auf `Ausschreibung` laufen, sondern breiter:

- Buergerbeteiligung
- Beteiligungskonzept
- Moderation
- Oeffentlichkeitsbeteiligung
- Partizipation
- Planungsdialog
- Nahverkehrsplan
- Stadtentwicklung
- Quartiersentwicklung
- Klimaanpassung
- Bauleitplanung
- Verkehrskonzept
- Mobilitaetskonzept
- Stakeholderdialog
- Beteiligungsplattform

### 5.3 Typisierung

```ts
type ParticipationSignalType =
  | "public_tender"
  | "planning_process"
  | "council_information"
  | "participation_portal"
  | "press_signal"
  | "funding_program"
  | "community_signal"
  | "media_signal";
```

## 6. Beteiligungsrelevanz-Scoring

Ein Signal wird nicht wie ein Vertriebsvorgang bewertet, sondern nach demokratischer und operativer Relevanz.

```ts
type ParticipationSignalScore = {
  urgency: number;              // Fristnaehe / politischer Zeitdruck
  publicRelevance: number;      // Betroffenheit / Gemeinwohlrelevanz
  participationFit: number;     // eignet sich das Thema fuer eDebatte?
  dossierReadiness: number;     // Quellenlage / Strukturierbarkeit
  mandatePotential: number;     // kann daraus ein klares Mandat entstehen?
  partnerPotential: number;     // Kommune, Medium, Verband, Stiftung, Initiative
  riskLevel: "low" | "medium" | "high";
  recommendedNextStep:
    | "observe"
    | "create_anlassraum"
    | "draft_dossier"
    | "prepare_round"
    | "outreach_partner"
    | "no_action";
};
```

## 7. Rollenlogik

### 7.1 VoiceOpenGov

- oeffentlicher Radar
- Themen- und Anlasssicht
- Community-/Journalismus-/Stiftungsanschluss
- offenes Verzeichnis von Signalen, Dossiers, Mandaten und Mitgliedern

### 7.2 eDebatte

- Arbeits- und Umsetzungsflaeche
- Login-/Rollenmodell
- `/create` als Freistart fuer Signal, Claim, Quelle oder Beteiligungsidee
- `/runden` als oeffentliche Betriebsflaeche fuer Beteiligungsrunden
- `/dossier` als Verdichtung
- `/mandat` oder mandatsnahe Oberflaeche als Ergebnis- und Statuslogik

### 7.3 B2G/B2B/B2C-Anschluss

- Kommunen koennen aus Signalen eigene Runden beauftragen oder starten.
- Medien koennen Dossiers fuer Berichterstattung und Fakten-/Positionsraeume nutzen.
- Verbaende und Initiativen koennen Themen einreichen, Quellen ergaenzen und strukturierte Beteiligung ausloesen.
- Buerger:innen koennen Signale melden, Fragen ergaenzen, Optionen bewerten und Status nachverfolgen.

## 8. Produktflaechen

### 8.1 Admin / Operator

Neue oder erweiterte Flaeche:

```text
/admin/radar/beteiligung
```

Funktionen:

- Signale aus Feeds/Quellen anzeigen
- Fristen, Region, Auftraggeber, Signaltyp und Relevanz filtern
- Score und Begruendung anzeigen
- Signal in Anlassraum, Dossier oder Runde ueberfuehren
- Partner-/Outreach-Status dokumentieren
- Dubletten und bereits bearbeitete Signale ausblenden

### 8.2 Public / VoiceOpenGov

Moegliche Flaeche:

```text
/radar
```

oder innerhalb VoiceOpenGov:

```text
/themenradar
/beteiligungsradar
```

Funktionen:

- erkannte oeffentliche Beteiligungsanlaesse sichtbar machen
- Status: beobachtet, Dossier in Arbeit, Runde geplant, Mandat vorhanden
- Quellen transparent anzeigen
- Community kann weitere Quellen, Fragen oder Sichtweisen einreichen

### 8.3 Create-Handoff

`/create` muss Signale aufnehmen koennen:

```text
/create?entryIntent=issue_signal&source=participation_radar
```

Die Analyse darf daraus nicht automatisch eine Wahrheit oder Priorisierung machen. Sie erzeugt nur Vorschlaege:

- passender Anlassraum vorhanden?
- neues Dossier sinnvoll?
- Beteiligungsrunde denkbar?
- nur beobachten?

## 9. Guardrails

- Kein Auto-Publish aus Feed-Signalen.
- Kein automatischer politischer Wahrheitsanspruch.
- Ausschreibungen werden nicht als Verkaufsdruck, sondern als Beteiligungsanlass behandelt.
- Bei formellen Verfahren klare Trennung: eDebatte ersetzt keine gesetzlichen Beteiligungspflichten, sondern kann sie ergaenzen, vorbereiten, dokumentieren oder niedrigschwelliger machen.
- Bei informellen Verfahren kann eDebatte frueher ansetzen und Alternativen, Fragen und Zustaendigkeiten sichtbar machen.
- Personenbezogene Daten aus Ausschreibungen, Ratsinfos oder Kontaktquellen werden nicht ungeprueft in oeffentliche Dossiers uebernommen.

## 10. MVP-Scope

### Muss

- Beteiligungsradar-Datenmodell / Contract
- Seed-/Demo-Daten fuer 5–10 Signaltypen
- Admin-Liste mit Filtern und Score-Begruendung
- Handoff: Signal -> `/create` / Anlassraum / Dossier-Vorschlag
- Doku-/OpenTasks-Anbindung
- Tests fuer Klassifikation, Scoring und Handoff-Guardrails

### Sollte

- Feed-Adapter fuer mindestens eine offizielle Quelle als Demo/Mock
- deduplizierte Quellen-/URL-Logik
- Status-Pipeline: `observed`, `qualified`, `dossier_candidate`, `round_candidate`, `outreach`, `archived`
- Partner-/Outreach-Notizfeld

### Spaeter

- echte Vergabeportal-Adapter
- Ratsinfo-/Beteiligungsportal-Crawler
- Kommunen-Dashboard
- Medien-/Stiftungs-Partneransicht
- automatisierte Pilotpaket-/Anschreiben-Generierung

## 11. Acceptance Criteria fuer Umsetzung

- `ParticipationSignal` und `ParticipationSignalScore` sind als typed Contract vorhanden.
- Mindestens ein Demo-/Seed-Satz zeigt Ausschreibung, Nahverkehrsplan, Stadtentwicklung, Beteiligungsportal und Medien-/Community-Signal.
- Admin-/Operator-Surface zeigt Liste, Filter, Score, Frist, Region und naechsten Schritt.
- Es gibt keinen direkten Auto-Publish-Pfad.
- Handoff zu `/create` nutzt bestehende Intake-Logik und bleibt intern/role-aware.
- Tests decken Klassifikation, Score-Erklaerung, Dedupe-Basis und Handoff ab.
- OpenTasks referenziert den Slice als `PR-VOG-BETEILIGUNGSRADAR-01`.

## 12. Kurzform fuer Pitch / UI

> VoiceOpenGov erkennt, wo Beteiligung gebraucht wird. eDebatte macht daraus ein belastbares oeffentliches Verfahren.

Alternativ:

> Vom Ausschreibungsradar zum Beteiligungsbetriebssystem.

Oder:

> Beteiligung beginnt nicht erst mit dem Workshop. Sie beginnt mit dem Anlass, den Quellen, den offenen Fragen und der Frage, wer ueberhaupt gehoert wird.
