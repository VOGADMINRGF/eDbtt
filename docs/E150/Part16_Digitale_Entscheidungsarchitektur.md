# Digitale Entscheidungsarchitektur
## Ein Strukturmodell für legitime Mehrheitsbildung im 21. Jahrhundert

**Autor:** Ricky Fleischer  \
**Version:** v2.0 (Kapitel vertieft)  \
**Datum:** 15. Februar 2026  \
**Status:** Arbeitsfassung / Diskussionsgrundlage (ohne institutionellen Anspruch)

---

## Zusammenfassung (Abstract)

Moderne Demokratien stehen unter strukturellem Druck: Öffentliche Debatten werden häufig in unstrukturierten Textformaten (Kommentarspalten, soziale Netzwerke, offene Foren) geführt, während Institutionen Entscheidungen unter Zeit-, Aufmerksamkeits- und Ressourcenknappheit treffen müssen. Das Resultat ist institutionelle Überlastung: Relevante Argumente, Quellen und Handlungsoptionen gehen in Informationsrauschen unter, Korrekturen verschwinden, und Verantwortlichkeiten bleiben unscharf.

Dieses Diskussionspapier schlägt ein Strukturmodell vor, das deliberative Beiträge in fünf wiederverwendbare Bausteine überführt: **Behauptungen**, **Quellen**, **Prüffragen**, **Handlungsoptionen** und **Auswirkungen** (inkl. Zuständigkeiten). Auf dieser Informationsarchitektur aufbauend wird ein Governance-Modell beschrieben, das Rollen, Prüfpfade, Transparenzregeln, Versionierung und Auditierbarkeit so kombiniert, dass legitime Mehrheitsbildung nachvollziehbar dokumentiert werden kann. Abschließend wird ein kommunaler Pilot (12 Wochen) mit Evaluationskriterien vorgestellt.

**Schlüsselwörter:** Legitimationslogik; Informationsarchitektur; Mehrheitsprinzip; Governance-Modell; Dossier; Auditierbarkeit; Zuständigkeiten; Versionierung

---

## Inhaltsverzeichnis

1. Ausgangslage und Problemraum  \
2. Begriffe und theoretischer Rahmen  \
3. Strukturmodell: fünf Bausteine  \
4. Prozessmodell: vom Beitrag zum Mandat  \
5. Governance-Modell (Rollen, Prüfpfade, Integrität)  \
6. Auditierbarkeit, Versionierung und Nachweisführung  \
7. Kosten- und Nutzenlogik  \
8. Pilotkonzept für Kommunen (12 Wochen)  \
9. Methodik und Evaluationsdesign  \
10. Risiken, Grenzen und Schutzmechanismen  \
11. Publikations- und Referenzstrategie  \
Literatur und Referenzen  \
Anhänge

---

## 1. Ausgangslage und Problemraum

Öffentliche Meinungsbildung findet zunehmend in Echtzeit statt. Dabei ist nicht nur der Inhalt strittig, sondern vor allem die Form: Unstrukturierter Text ist ein schwaches Medium für kollektive Entscheidungen, weil er schwer prüfbar ist, selten dauerhaft erinnert wird und Verantwortlichkeiten nicht abbildet. Die Folge ist **institutionelle Überlastung**: Viele Eingaben treffen auf begrenzte Kapazität, sie zu strukturieren, zu prüfen und in umsetzbare Optionen zu überführen.

Herbert A. Simon beschreibt das Grundproblem informationsreicher Umwelten als Aufmerksamkeitsknappheit: Eine Fülle an Informationen erzeugt eine Knappheit dessen, was Informationen verbrauchen – Aufmerksamkeit. \[1\]

Dieses Papier betrachtet deshalb **Informationsarchitektur** als demokratierelevante Infrastruktur: Nicht die „richtige Meinung“ steht im Zentrum, sondern die Frage, wie Aussagen, Begründungen, Gegenargumente und Handlungsoptionen so dokumentiert werden, dass Mehrheitsbildung nachvollziehbar, prüfbar und verantwortbar bleibt.

### 1.1 Zielsetzung

Ziel ist ein Strukturmodell, das Beiträge in standardisierte Bausteine zerlegt und damit (a) Prüfung und Wiederverwendung ermöglicht, (b) Dossiers als zitierfähige Entscheidungsvorlagen erzeugt und (c) ein Governance-Modell bereitstellt, das Rollen, Prüfpfade und Transparenzregeln festlegt.

### 1.2 Forschungsfragen

- **F1:** Welche minimalen Inhaltsbausteine sind notwendig, um Beiträge als Entscheidungsgrundlage zu strukturieren, ohne Pluralität zu verengen?
- **F2:** Welche Governance-Regeln sichern Integrität (Missbrauchsschutz), Nachvollziehbarkeit (Audit) und Verantwortbarkeit (Zuständigkeiten)?
- **F3:** Wie lässt sich „Entscheidungsreife“ operationalisieren, sodass Dossiers vergleichbar und wiederverwendbar werden?

### 1.3 Abgrenzung

Das Dokument macht keine Aussage darüber, welche politische Option „richtig“ ist. Es beschreibt ein Verfahren, wie Optionen strukturiert, begründet, geprüft und abgestimmt werden können. Die Prozesse sind so formuliert, dass sie in kommunalen Kontexten adaptiert werden können.

---

## 2. Begriffe und theoretischer Rahmen

Die Legitimität kollektiver Entscheidungen hängt nicht nur vom Ergebnis, sondern auch von der **Legitimationslogik** des Verfahrens ab: Wer konnte sich beteiligen? Wie wurden Gründe und Gegenargumente berücksichtigt? Welche Verantwortlichkeiten sind dokumentiert? Dieses Papier verbindet demokratietheoretische Begriffe (Deliberation, Legitimität, Rechenschaft) mit Konzepten der Informationswissenschaft (Versionierung, Nachweisführung, Auditierbarkeit).

### 2.1 Öffentlichkeit als vermittelte Sphäre

Öffentlichkeit ist in modernen Gesellschaften notwendig vermittelt: Medien und Plattformen verbinden räumliche, zeitliche und thematische Vielfalt. Digitale Plattformlogiken verändern dabei Selektionsmechanismen und Interaktionsformen; dadurch steigen Reichweite und Geschwindigkeit, gleichzeitig wächst das Risiko von Fragmentierung und Überlastung. \[2\]

### 2.2 Input-, Output- und Throughput-Legitimität

Scharpf unterscheidet – vereinfacht – Legitimität über Beteiligung („input“) und Legitimität über Problemlösung („output“). \[6\] Schmidt ergänzt „throughput“ als Prozessqualität der „Black Box“ zwischen Eingang und Ergebnis: Transparenz, Verantwortlichkeiten, Zugangsregeln und die Qualität der Verfahren selbst. \[7\] Diese Trias passt zur Kernidee dieses Papiers: **Informationsarchitektur und Governance sind throughput-relevant.**

### 2.3 Deliberation und Beratungsqualität

Deliberative Demokratietheorie betont, dass Legitimität durch begründete Auseinandersetzung gestützt werden kann, nicht durch bloße Präferenzaggregation. Habermas hebt hierfür die Rolle öffentlicher Diskurse hervor. \[3\] Dryzek und Fishkin liefern unterschiedliche, aber kompatible Perspektiven auf deliberative Verfahren und ihre institutionelle Einbettung. \[4\]\[5\]

### 2.4 Rechenschaft und Auditierbarkeit

Bovens fasst Rechenschaft (Accountability) als Beziehung zwischen Akteur und Forum: Akteure müssen ihr Handeln erklären, das Forum kann Fragen stellen und Konsequenzen ableiten. \[8\] Für digitale Verfahren folgt daraus: Es braucht **Nachweisführung** (wer hat was wann warum geändert?) und einen **Beschwerde- bzw. Ombudspfad**.

### 2.5 Arbeitsdefinitionen

| Begriff | Definition |
|---|---|
| Informationsarchitektur | Strukturregeln für Inhalte, Metadaten, Beziehungen und Wiederverwendung. |
| Dossier | Versionierte, zitierfähige Entscheidungsvorlage mit Behauptungen, Quellen, Prüffragen, Optionen und Auswirkungen. |
| Auditierbarkeit | Nachträgliche Prüfbarkeit von Änderungen, Quellenbezug und Entscheidungswegen. |
| Mehrheitsbildung | Abstimmungsprozess über dokumentierte Optionen, entlang eines festgelegten Quorums und Fristenregimes. |
| Nachweisführung | Dokumentation von Herkunft, Bearbeitungsschritten und Zuständigkeiten (Provenienz/Provenance). |

---

## 3. Strukturmodell: fünf Bausteine

Das Modell übersetzt unstrukturierten Diskurs in fünf Bausteine, die gemeinsam eine prüf- und wiederverwendbare Grundlage erzeugen:

1. **Behauptungen** (was wird behauptet?)
2. **Quellen** (wodurch ist es belegt?)
3. **Prüffragen** (was muss geklärt werden?)
4. **Handlungsoptionen** (welche Alternativen sind denkbar?)
5. **Auswirkungen** (Kosten, Nutzen, Risiken, Verteilung, Recht; inkl. Zuständigkeiten und Zeithorizont)

### 3.1 Normative Mindestanforderungen

- **Trennung von Aussage und Bewertung:** Behauptungen und Bewertungen werden getrennt erfasst (Interpretation ist erlaubt, aber als solche markiert).
- **Quellenpflicht für Kernaussagen:** Für entscheidungsrelevante Behauptungen gilt Quellenpflicht oder explizite Unsicherheitsmarkierung.
- **Optionspluralität:** Mindestens zwei Handlungsoptionen, sofern nicht logisch ausgeschlossen; sonst Begründung.
- **Zuständigkeitsbindung:** Auswirkungen werden mit verantwortlicher Stelle und Zeithorizont verknüpft.

### 3.2 Statuslogik für Behauptungen

Behauptungen durchlaufen definierte Zustände, um die Dossier-Reife transparent zu machen:

- *unbestätigt* (noch nicht geprüft)
- *teilbestätigt* (Teilaspekte durch Quellen gedeckt)
- *bestätigt* (Kernaussage durch geeignete Quellen gestützt)
- *widerlegt* (durch Quellenlage oder Prüfung entkräftet)

### 3.3 Minimal-Schema (Beispiel)

```json
{
  "behauptungen": [{
    "id": "C-001",
    "text": "...",
    "status": "unbestätigt",
    "begründung": "...",
    "quellen": ["S-001"]
  }],
  "quellen": [{
    "id": "S-001",
    "typ": "gesetz|studie|bericht|datensatz|artikel",
    "titel": "...",
    "url": "...",
    "datum": "YYYY-MM-DD"
  }],
  "prüffragen": [{
    "id": "F-001",
    "text": "...",
    "priorität": "hoch|mittel|niedrig"
  }],
  "handlungsoptionen": [{
    "id": "O-001",
    "titel": "...",
    "beschreibung": "...",
    "voraussetzungen": ["..."],
    "abhängigkeiten": ["..."]
  }],
  "auswirkungen": [{
    "id": "I-001",
    "option": "O-001",
    "dimension": "kosten|nutzen|risiko|verteilung|recht",
    "beschreibung": "...",
    "zuständig": "...",
    "horizont": "kurz|mittel|lang"
  }]
}
```

### 3.4 Dossier-Reifegrad (operationalisiert)

Ein Dossier gilt als **entscheidungsreif**, wenn:

1. jede Option mindestens eine konsistente Wirkungskette (Auswirkungen) besitzt,
2. Kernaussagen entweder geprüft oder als offen markiert sind (mit Prüffragen),
3. Zuständigkeiten benannt sind (wer trägt Umsetzung/Prüfung),
4. Änderungen versioniert und begründet wurden.

---

## 4. Prozessmodell: vom Beitrag zum Mandat

Das Prozessmodell beschreibt die Transformation von Rohbeiträgen in ein Mandat (Mehrheit über Optionen) und anschließend in ein umsetzbares Aufgabenpaket.

| Stufe | Ergebnis | Kernfrage |
|---|---|---|
| 1. Einreichung | Rohbeitrag | Was ist das Anliegen? |
| 2. Strukturierung | Bausteine (C/S/F/O/I) | Welche Kernaussagen und Optionen liegen vor? |
| 3. Prüfung | Quellenstatus + offene Fragen | Was ist belegt, was ist unklar? |
| 4. Dossier | Versionierte Vorlage | Welche Alternativen sind entscheidungsreif? |
| 5. Abstimmung | Mehrheitsergebnis | Welche Option erhält das Quorum? |
| 6. Umsetzung | Aufgabenpakete | Wer tut was bis wann? |
| 7. Monitoring | Fortschritt | Welche Nebenfolgen treten auf? |

### 4.1 Trennung von Diskurs- und Entscheidungsphase

Ein stabiler Governance-Mechanismus trennt die offene Diskursphase (Erkundung, Erweiterung von Optionen, Quellensuche) von der Entscheidungsphase (fixierte Optionsmenge, festgelegtes Quorum, definierte Fristen). Diese Trennung schützt die Legitimationslogik: Es ist nachvollziehbar, **wann** über **was** abgestimmt wurde.

### 4.2 Quoren und Fristen als Governance-Parameter

Quorum, Frist und Teilnahmebedingungen sind Parameter des Governance-Modells. Sie werden pro Thema festgelegt und im Dossier dokumentiert (inkl. Änderungsbegründung).

---

## 5. Governance-Modell (Rollen, Prüfpfade, Integrität)

Governance umfasst Regeln, Rollen und Kontrollpfade, die Integrität und Nachvollziehbarkeit sichern. Als Referenz kann ISO 37000 (Governance-Grundsätze für Organisationen) als Rahmen dienen. \[14\]

### 5.1 Governance-Prinzipien (Normen)

1. **Nachvollziehbarkeit:** Jede zentrale Behauptung ist auf Quellen oder explizite Unsicherheit zurückgeführt.
2. **Auditierbarkeit:** Versionen, Änderungsbegründungen und Zuständigkeiten sind prüfbar dokumentiert.
3. **Proportionalität:** Prüfintensität steigt mit Risiko/Tragweite (Pfad A/B/C).
4. **Anfechtbarkeit:** Ombudspfad für Beschwerden, Interessenkonflikte, Manipulationsverdacht.
5. **Transparenzlogik:** Sichtbarkeiten (öffentlich/teilöffentlich/intern) sind regelbasiert und begründet.
6. **Zuständigkeitsschärfe:** Auswirkungen werden immer mit Zuständigkeit + Zeithorizont gekoppelt.
7. **Wiederverwendbarkeit:** Dossiers sind zitierfähig, versioniert und als Wissensbestand pflegbar.

### 5.2 Rollenmodell

| Rolle | Aufgabe |
|---|---|
| Einreichende | Rohbeiträge, Quellenhinweise, Antworten auf Rückfragen. |
| Moderation/Redaktion | Strukturierung, Dubletten, Dossierpflege, Veröffentlichungstexte. |
| Fachprüfung | Prüfung strittiger Kernaussagen/Quellen; Einschätzung von Risiken. |
| Verwaltungskoordination | Umsetzungspakete, Zuständigkeiten, Zeitplan, Monitoring. |
| Ombudsstelle | Integritätsfälle, Interessenkonflikte, Beschwerden; Entscheidung über Sperren. |

### 5.3 Prüfpfade A/B/C

- **Pfad A (Basis):** Strukturierung + Mindestquellen für Kernaussagen.
- **Pfad B (Erweitert):** zusätzliche Fachprüfung (z. B. Sampling oder Vollprüfung) für strittige Kernaussagen.
- **Pfad C (Integrität):** Ombudspfad bei Manipulationsverdacht, Interessenkonflikt, Regelbruch; ggf. Sperre/Revision.

### 5.4 Verantwortungsmatrix (RACI, komprimiert)

Abkürzungen: **E**=Einreichende, **M**=Moderation, **F**=Fachprüfung, **V**=Verwaltung, **O**=Ombud.

| Aktivität | E | M | F | V | O |
|---|---:|---:|---:|---:|---:|
| Rohbeitrag einreichen | R |  |  |  |  |
| Strukturierung (C/S/F/O/I) | C | A/R | C |  |  |
| Quellenprüfung | C | R | A/R |  | C |
| Dossier freigeben |  | A/R | C | C | C |
| Abstimmung durchführen | C | A/R |  | C | C |
| Mandat in Umsetzung übersetzen |  | C |  | A/R | C |
| Beschwerde/Integritätsfall |  | C | C | C | A/R |

---

## 6. Auditierbarkeit, Versionierung und Nachweisführung

Wenn Dossiers als Referenzdokumente dienen, müssen sie eine belastbare Nachweisführung besitzen. In der Informationswissenschaft wird Provenienz (Provenance) als Information über Entitäten, Aktivitäten und beteiligte Personen verstanden, die zur Einschätzung von Qualität und Vertrauenswürdigkeit dient. \[13\]

### 6.1 Nachweisführung als Minimalstandard

Minimal dokumentiert werden sollten:

- **Wer** hat eine Änderung vorgenommen?
- **Was** wurde geändert (Diff/Änderungsnotiz)?
- **Wann** (Zeitstempel)?
- **Warum** (Änderungsbegründung)?
- **Worauf** bezieht es sich (Behauptung/Quelle/Option/Auswirkung)?

### 6.2 Versionierung als Governance-Instrument

In der Forschungspraxis gilt Versionierung als zentrale Voraussetzung für Nachvollziehbarkeit und Reproduzierbarkeit; Git wird dabei häufig als Referenztool genannt. \[15\] Für Dossiers ist nicht das Tool entscheidend, sondern das Prinzip: jede veröffentlichte Version ist zitierfähig, und Änderungen sind transparent.

### 6.3 Verknüpfung von Inhalts- und Governance-Protokollen

Neuere Arbeiten betonen, dass Audit-Trails technische Provenienz mit Governance-Records (Freigaben, Ausnahmen, Bestätigungen) verbinden müssen, damit Entscheidungen rekonstruierbar bleiben. \[18\] Übertragen auf kommunale Entscheidungsprozesse heißt das: Dossier-Versionen sollten mit Freigaben (Wer hat die Abstimmungsreife erklärt?) und Beschwerden (falls vorhanden) verknüpft werden.

---

## 7. Kosten- und Nutzenlogik

Eine quantitative Kosten-Nutzen-Rechnung ist kontextabhängig. Dennoch ist es hilfreich, Kategorien transparent zu benennen. Nutzen entsteht primär durch Reduktion von Such- und Abstimmungsaufwand, bessere Wiederverwendung von Quellenarbeit sowie klarere Verantwortungszuweisung.

| Kategorie | Beispiele | Messidee |
|---|---|---|
| Einmalig | Setup, Schulung, Rollenregeln | Stundenaufwand + externe Leistungen |
| Laufend | Moderation, Dossierpflege, Prüfungen | Aufwand pro Thema/Monat |
| Nutzen (direkt) | weniger Doppelarbeit, schnellere Vorlagen | Zeitersparnis in Fachstellen |
| Nutzen (indirekt) | Nachvollziehbarkeit, Konfliktreduktion | Beschwerden, Rückfragen, Akzeptanz |

---

## 8. Pilotkonzept für Kommunen (12 Wochen)

Der Pilot ist als lernorientierte Einführung gedacht, nicht als Vollbetrieb. Er arbeitet mit **5–10 Themen**, die klar umrissen sind und eine realistische Umsetzungsreichweite besitzen.

| Woche | Ziel | Artefakte |
|---:|---|---|
| 1–2 | Kick-off, Rollen, Themenauswahl | Pilot-Charter, Rollenplan, Transparenzregeln |
| 3–5 | Einreichung und Strukturierung | Bausteine, Dublettenliste |
| 6–7 | Prüfung und Quellenarbeit | Quellenstatus, beantwortete Prüffragen |
| 8–9 | Dossier-Finalisierung | Dossier v1 je Thema, Änderungsprotokolle |
| 10 | Abstimmung | Abstimmungsprotokoll, Ergebnisobjekte |
| 11–12 | Auswertung | Evaluationsbericht, Verbesserungs-Backlog |

### 8.1 Evaluationskriterien (Beispiele)

- **Verarbeitbarkeit:** durchschnittliche Zeit bis „entscheidungsreif“
- **Nachvollziehbarkeit:** Anteil der Kernaussagen mit Quellenstatus
- **Integrität:** Anzahl/Art von Ombudfällen, Regelverstöße
- **Akzeptanz:** Zufriedenheit von Beteiligten (Kurzfragebogen)

---

## 9. Methodik und Evaluationsdesign

Für eine wissenschaftsnahe Ausarbeitung empfiehlt sich ein Gestaltungsforschungsansatz: Artefaktentwicklung (Strukturmodell + Governance) kombiniert mit Evaluation im Feld (Pilot). Hevner et al. formulieren hierfür Leitlinien (u. a. Artefakt, Relevanz, Rigorosität, Evaluation). \[11\] March und Smith unterscheiden „Bauen“ und „Evaluieren“ als zentrale Tätigkeiten von Gestaltungsforschung. \[12\]

### 9.1 Forschungsartefakte

- **A1:** Strukturmodell (Bausteine, Statuslogik, Dossier-Reifegrad)
- **A2:** Governance-Regelwerk (Rollen, Prüfpfade, Transparenz- und Ombudlogik)
- **A3:** Evaluationsinstrument (Indikatoren, Fragebogen, Auswertungsmatrix)

### 9.2 Qualitätssicherung (wissenschaftsnah)

Als organisatorischer Referenzrahmen für gute Praxis kann der DFG-Kodex genutzt werden (u. a. Transparenz, Dokumentation, Korrekturen, Verantwortlichkeiten). \[10\]

---

## 10. Risiken, Grenzen und Schutzmechanismen

Jede Beteiligungs- und Dokumentationsarchitektur trägt Risiken. Für ein robustes Governance-Modell sollten Risiken explizit benannt und durch Regeln und Mechanismen adressiert werden.

### 10.1 Typische Risiken

- **Überlastung durch Menge:** zu viele Beiträge ohne Strukturierungskapazität (Gegenmaßnahme: Sampling, Priorisierung, klare Themenzuschnitte).
- **Qualitätsgefälle bei Quellen:** ungeeignete oder interessengeleitete Quellen (Gegenmaßnahme: Quellenklassifikation, Fachprüfung Pfad B).
- **Manipulationsversuche:** koordinierte Einflussnahme, Mehrfachkonten (Gegenmaßnahme: Integritätspfad C, Anomalie-Checks, Sperrlogik).
- **Scheinsicherheit:** zu hoher Formalismus ohne echte Prüfung (Gegenmaßnahme: Statuslogik + offene Prüffragen sichtbar halten).

### 10.2 Schutzmechanismen (Governance)

- Ombudsstelle mit klaren Eingriffsbefugnissen
- Interessenkonflikt-Transparenz bei Fachprüfungen
- Öffentliche Änderungsprotokolle bei Dossier-Versionen

---

## 11. Publikations- und Referenzstrategie

Damit dieses Papier als Referenzdokument funktioniert, braucht es saubere Publikationslogik:

1. **Versionierung:** v2.0, v2.1 usw. mit Änderungslog (was/warum).
2. **Zitierfähigkeit:** klare Metadaten + stabiler Identifikator (z. B. DOI).
3. **Lizenz:** z. B. CC BY 4.0 (wenn gewünscht).
4. **Publishing Pack (ohne Volltext-Doppel):**
   - Öffentliche Landingpage `/de/referenzarchitektur` mit Auszügen,
   - Download der Vollfassung als DOCX,
   - **kein** paralleler Volltext im Web, nur Zusammenfassung + Verweis.

### 11.1 Zitiervorschlag

> Fleischer, Ricky (2026): Digitale Entscheidungsarchitektur – Ein Strukturmodell für legitime Mehrheitsbildung im 21. Jahrhundert. Diskussionspapier, Version v2.0.

---

## Literatur und Referenzen

1. Simon, Herbert A. (1971): *Designing Organizations for an Information-Rich World.* In: Martin Greenberger (Hrsg.): *Computers, Communications, and the Public Interest.* Johns Hopkins Press, S. 37–72.
2. Schrape, Jan-Felix (2016): *Social Media, Mass Media and the Public Sphere.* University of Stuttgart (SOI).
3. Habermas, Jürgen (1996): *Between Facts and Norms: Contributions to a Discourse Theory of Law and Democracy.* MIT Press.
4. Dryzek, John S. (2000/2002): *Deliberative Democracy and Beyond: Liberals, Critics, Contestations.* Oxford University Press.
5. Fishkin, James S. (2009): *When the People Speak: Deliberative Democracy and Public Consultation.* Oxford University Press.
6. Scharpf, Fritz W. (1999): *Governing in Europe: Effective and Democratic?* Oxford University Press.
7. Schmidt, Vivien A. (2013): Democracy and Legitimacy in the European Union Revisited: Input, Output and “Throughput”. *Political Studies* 61(1), 2–22.
8. Bovens, Mark (2007): Analysing and Assessing Accountability: A Conceptual Framework. *European Law Journal* 13(4), 447–468.
9. OECD (2017): *Recommendation of the Council on Open Government.* OECD Legal Instruments (OECD-LEGAL-0438).
10. DFG (2019): Kodex „Leitlinien zur Sicherung guter wissenschaftlicher Praxis“ (Inkrafttreten 01.08.2019).
11. Hevner, Alan R.; March, Salvatore T.; Park, Jinsoo; Ram, Sudha (2004): Design Science in Information Systems Research. *MIS Quarterly* 28(1), 75–105.
12. March, Salvatore T.; Smith, Gerald F. (1995): Design and Natural Science Research on Information Technology. *Decision Support Systems* 15, 251–266.
13. W3C (2013): *PROV-DM: The PROV Data Model.* W3C Recommendation (30 Apr 2013).
14. ISO (2021): *ISO 37000:2021 – Governance of organizations – Guidance.* International Organization for Standardization.
15. Ram, Karthik (2013): Git can facilitate greater reproducibility and increased transparency in science. *Source Code for Biology and Medicine* 8(7).
16. De Nies, Tom et al. (2014): *Git2PROV: Exposing version control system content as W3C PROV.* Konzeptpapier.
17. Pang, Hao et al. (2022): Differential Dimensions of Social Media Overload and Outcomes. Übersichtsartikel.
18. Bhandari, Varun et al. (2026): *Audit Trails for Accountability in Large Language Models.* arXiv.

---

## Anhänge

**Anhang A (optional):** Mapping C/S/F/O/I → Graph-Objekte (E150 Part07)  \
**Anhang B (optional):** Nachweisführung / Provenienz-Events (W3C PROV, Audit-Trails)  \
**Anhang C (optional):** Pilot-Charter Template + Evaluationsbogen
