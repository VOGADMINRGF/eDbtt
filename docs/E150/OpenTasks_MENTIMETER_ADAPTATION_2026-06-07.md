# OpenTasks Mentimeter Adaptation Backlog

Stand: 2026-06-07
Status: research_only / Produkt- und Adaptionsvorbereitung
Repo-Bezug: Ergänzende Analyse zu docs/E150/OpenTasks.md, noch kein Ersatz der operativen SSOT-Queue.

## Zweck

Diese Datei hält die Mentimeter-Analyse als strukturierte Adaptionsliste für eDebatte fest. Sie wird bewusst zunächst als begleitende E150-Doku abgelegt, weil mehrere Punkte echte Produktentscheidungen berühren: Namensgebung, Live-/Anlassraum-Semantik, Anonymität, Reporting, Pricing, Rollenmodell und mögliche Integrationen.

Leitsatz: Mentimeter macht aus Präsentationen Beteiligung. eDebatte soll aus Beteiligung belastbare öffentliche Meinungs-, Fakten- und Entscheidungsräume machen.

## Quellenbasis

- https://www.mentimeter.com/features
- https://help.mentimeter.com/en/articles/410537-how-to-participate-in-a-mentimeter-presentation
- https://www.mentimeter.com/features/live-questions-and-answers
- https://www.mentimeter.com/ai-presentations
- https://www.mentimeter.com/integrations
- https://www.mentimeter.com/enterprise
- https://help.mentimeter.com/en/articles/1258367-what-is-included-in-the-free-account

## Adaptionsprinzipien

1. Keine reine Kopie eines Präsentationstools.
2. Jede Live-Beteiligung braucht einen Handoff: Speichern, Dossier, Anlassraum, Review, Factcheck oder Report.
3. Ergebnisse sind Beteiligungssignale, keine Wahrheit und keine repräsentative Legitimation.
4. KI darf clustern, zusammenfassen und vorbereiten, aber nicht automatisch veröffentlichen oder Graph-Merges durchführen.
5. Teilnahme muss niedrigschwellig sein: QR, Kurzlink, Code, ohne App-Zwang.
6. eDebatte braucht stärkere Modi als Mentimeter: anonym, pseudonym, eingeloggter Bürger, verifizierte Organisation, verifizierte Verwaltung/Redaktion.
7. Datenhoheit ist Differenzierung: keine Wiederverwendung öffentlicher oder institutioneller Fragen zur Template-Inspiration ohne explizite Freigabe.

## Candidate OpenTasks

| ID | Status | Priority | Depends on | Scope | Goal | Acceptance Criteria | Decision open | Evidence / Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| MENTI-ADAPT-00 | research_only | high | none | Produktanalyse / Backlog-Staging | Mentimeter-Pattern in eDebatte-kompatible Adaptionsfelder übersetzen | Datei beschreibt Nutzen, Grenzen, Tasks, Entscheidungsgates und Umsetzungsreihenfolge | no | Initialer Capture. |
| EDEB-LIVE-ENTRY-01 | needs_decision | high | PR-AI-CREATE-01G, CREATE-MULTIBRANCH-ACTION-BOARD-01 | /create, /dossier, später /anlassraum | Einen Live-Modus als Einstieg schaffen: Live-Beteiligung starten | CTA-Konzept mit QR/Kurzlink/Code; Session erzeugt keine automatische Veröffentlichung; Save/Handoff bleibt kanonisch | yes | Name klären: eDebatte Live, Live-Beteiligung, Anlassraum Live, Bürgerdialog Live. |
| EDEB-LIVE-SESSION-02 | needs_decision | high | EDEB-LIVE-ENTRY-01 | Session-Modell, Join-Code, QR, Link | Teilnahme ohne App-Zwang ermöglichen | Session hat id, joinCode, qrPayload, visibility, expiresAt, hostRole, participationMode | yes | Mit Rollen-/Privacy-Modell harmonisieren. |
| EDEB-LIVE-QUESTION-TYPES-03 | needs_decision | high | EDEB-LIVE-SESSION-02 | Poll-/Fragetypen | Mentimeter-ähnliche Frageformate demokratisch sinnvoll adaptieren | Unterstützt Multiple Choice, Ranking, Skala, offene Frage, Pro/Contra, Quellen-/Hinweisabgabe; 100-Punkte-Budget und 2x2-Matrix prüfen | yes | Wordcloud nur als Einstieg/Stimmungsbild, nicht als Ergebniswahrheit. |
| EDEB-LIVE-QA-MODERATION-04 | needs_decision | high | EDEB-LIVE-SESSION-02 | Live-Q&A, Upvotes, Moderation | Leise/unsichere Stimmen sichtbar machen, ohne Off-Topic/Spam ungefiltert zu veröffentlichen | Fragen können eingereicht, upgevotet, markiert, beantwortet, ausgeblendet, abgewiesen und als offene Frage ins Dossier überführt werden | yes | Moderation transparent halten: ausgeblendet ist nicht gelöscht. |
| EDEB-AI-GROUPING-05 | needs_decision | high | AI-ORCHESTRATOR-TRUTH-GUARD-11, EDITORIAL-REVIEW-QUEUE-13 | AI-Clustering offener Antworten | Aus offenen Antworten Themen, Muster, Minderheiten, offene Fragen und Dossier-Kapitel vorschlagen | AI erzeugt Cluster mit Confidence, Beispielen, Gegenpositionen und requiresHumanReview; keine Auto-Publish-/Auto-Graph-Merge-Pfade | yes | Mentimeter gruppiert für Insights; eDebatte muss zusätzlich Quellen-/Review-/Gegenpositionslogik führen. |
| EDEB-LIVE-HANDOFF-06 | needs_decision | high | EDEB-LIVE-QUESTION-TYPES-03, EDEB-AI-GROUPING-05 | Handoff nach Live-Session | Aus Live-Ergebnissen konkrete Folgeschritte erzeugen | Host sieht: Dossier vorbereiten, Factcheck starten, Anlassraum anlegen, Report exportieren, weitere QR-Umfrage starten, nur speichern | yes | Klären, was öffentlich wird und was Draft/Review bleibt. |
| EDEB-TEMPLATES-07 | codex_ready_after_decision | high | EDEB-LIVE-ENTRY-01 | Template-Katalog | Einstieg über Vorlagen statt abstrakter Produktbegriffe vereinfachen | Template-Kategorien für Kommune, Medien, Bürger, Verbände, Schule/Kita, Unternehmen; jede Vorlage enthält Ziel, Frageformate, Handoff, Reviewhinweis | yes | Inhaltliche Template-Auswahl ist Produktentscheidung. |
| EDEB-REPORTING-08 | needs_decision | high | EDEB-LIVE-HANDOFF-06 | Export, PDF, CSV, Beteiligungsreport | Reporting als B2B-/B2G-Werttreiber definieren | Report enthält Votes, Begründungen, Cluster, offene Fragen, Quellenhinweise, Minderheitenpositionen, Zeitverlauf, Methodik/Limitations, Reviewstatus | yes | Pricing/Paywall/Entitlements offen. |
| EDEB-ENTERPRISE-WORKSPACE-09 | needs_decision | medium | ROLE-/ORG-/ADMIN-SURFACES | Workspaces, Branding, Co-Creation | Mentimeter-Enterprise-Pattern auf Kommunen/Medien/Verbände übertragen | Mandantenfähige Workspaces, Brand Templates, Rollen/Rechte, gemeinsame Vorlagen, Ergebniszugriff, Datenaufbewahrung geprüft | yes | Mit vorhandenem Org-/Unit-/Role-Onboarding harmonisieren. |
| EDEB-INTEGRATIONS-10 | research_only | medium | EDEB-LIVE-SESSION-02 | Integrationen / Embeds | Prüfen, wo eDebatte in bestehende Umgebungen eingebettet werden sollte | Integrationsmap für Website-Embed, Rathaus-/CMS-Seiten, Medienartikel, Teams/Zoom, Präsentationen, Newsletter, QR-Poster | yes | Nicht sofort bauen; zuerst Anwendungsfälle und Datenschutz prüfen. |
| EDEB-ONE-OFF-EVENT-11 | needs_decision | medium | EDEB-REPORTING-08 | Event-/Konferenz-Paket | Einmalige Beteiligungspakete für Bürgerversammlung, Verbandstag, Redaktionsevent, Konferenz prüfen | Paketlogik mit Teilnehmerkontingent, Branding, Report, Nachbereitungsdossier, optionaler Moderation | yes | Kurzfristig monetarisierbar, aber Pricing offen. |
| EDEB-PARTICIPATION-MODES-12 | needs_decision | high | EDEB-LIVE-SESSION-02 | Anonymität, Pseudonymität, Verifizierung | Beteiligung je Kontext korrekt rahmen | Modi: anonymes Stimmungsbild, pseudonyme Beteiligung, eingeloggte Bürgerrolle, verifizierte Org/Behörde/Redaktion; Ergebnisanzeige markiert Repräsentativitätsgrenze | yes | Politisch sensibel, vor Implementierung festlegen. |
| EDEB-FACILITATOR-GUIDE-13 | research_only | medium | EDEB-TEMPLATES-07 | Host-/Moderationshilfe | eDebatte nicht nur als Tool, sondern als geführte Beteiligungsmethode erklären | Jede Vorlage hat Moderationshinweise, empfohlene Dauer, Fragefolge, Umgang mit Konflikt/Unsicherheit, Nachbereitung | no | Mentimeter verkauft Facilitation-Expertise; eDebatte sollte Demokratie-/Dossier-Facilitation liefern. |
| EDEB-ACCESSIBILITY-LOWFRICTION-14 | codex_ready_after_decision | medium | EDEB-LIVE-SESSION-02 | Mobile, Barrierearmut, Low-Bandwidth | Teilnahme in Rathaus, Schule, Veranstaltung, Handy, schwachem Netz absichern | QR/Code/Link funktionieren ohne Login, mit klarer Sprache, großen Buttons, Dark/Light, Screenreader-Basics, Wiederaufnahme nach Reload | yes | Login-Gate darf Niedrigschwelligkeit nicht zerstören. |
| EDEB-DATA-SOVEREIGNTY-15 | needs_decision | high | EDEB-PARTICIPATION-MODES-12 | Datenschutz / Wiederverwendung | eDebatte-Datenhoheit als Differenzierung festlegen | Keine Wiederverwendung von Fragen/Antworten für globale Templates ohne Opt-in; Projekt-/Mandantengrenzen dokumentiert; Export-/Lösch-/Retention-Logik definiert | yes | Wichtig für Kommunen, Medien und sensible Bürgeranliegen. |

## Zusätzliche Features aus zweitem/drittem Blickwinkel

### AI-Session-Builder aus Anlass, Artikel oder Agenda

Aus Artikel, Verwaltungstext, Ratsvorlage, Bürgerhinweis oder Dossier-Abschnitt wird eine Beteiligungssequenz vorgeschlagen. Die AI markiert, ob eine Frage Meinungsbild, Faktencheck, Priorisierung oder Quellenabfrage ist. Host entscheidet, was live gestellt wird. Kein Auto-Publish.

### Unsicherheitsoption als Standard

Politische Beteiligung braucht mehr als Ja/Nein. Standardoptionen sollten Unsicherheit und Informationsbedarf sichtbar machen: Zustimmung, eher Zustimmung, unsicher/brauche mehr Informationen, eher Ablehnung, Ablehnung, andere Option.

### Priorität und Vertrauen getrennt messen

Neben Zustimmung sollte eDebatte fragen: Wie wichtig ist das Thema? Wie sicher bist du dir? Wie gut ist die Quellenlage? Welche Information fehlt? Hohe Wichtigkeit plus geringe Sicherheit ist ein guter Kandidat für Factcheck/Dossier.

### Minderheitenradar statt Gewinnerlogik

Nicht nur Top-Antworten anzeigen. Kleine, aber begründete Gegenpositionen, neue Alternativen und starke Minderheiten müssen als Dossier-Signale sichtbar werden.

### Event-Nachbereitung als Produktmoment

Nach einer Live-Session entsteht ein Abschluss-Screen: Tendenz, offene Fragen, Quellen, Gegenargumente, nächste Prüfung, Veröffentlichungs-/Reviewstatus.

### Bürgerdialog-Poster / QR-Kit

Druckbares A4/A3-Kit mit QR, Kurzlink, Code, Kurzerklärung, Datenschutz-/Anonymitätsmodus und Ablauf: Heute Meinung, danach Dossier/Antwort/Report.

### Redaktions- und Kommunal-Templates als Go-to-Market

Medien: Leserfragen, Faktencheck-Aufruf, Pro/Contra zum Artikel, Recherchepriorisierung. Kommunen: Schulwege, Bürgeramt, Grünflächen, Haushalt, Kiezthemen. Verbände: Mitgliederbefragung, Positionspapier, Forderungsranking. Kita/Schule: Elternfeedback, Projektpriorisierung, Konfliktklärung.

### Vertrauenslabel pro Ergebnis

Jede Ergebnisansicht sollte Beteiligungsmodus, Teilnehmerzahl, Zeitraum, Frageform, Reviewstatus, Quellenstatus und Repräsentativitätsgrenze zeigen.

### Gastgeber-Cockpit statt Präsentationsdeck

eDebatte sollte nicht folienzentriert sein, sondern prozesszentriert: Session starten, Frage live schalten, Antworten moderieren, Cluster prüfen, nächste Frage wählen, Handoff entscheiden, Report erzeugen.

### Kosten-/AI-Gate je Session

Kostenlos: einfache lokale Zusammenfassung/Cluster. Bewusst starten: AI-Clustering. Paid/entitled: Factcheck, Deep Search, Exportreport, Langzeitmonitoring.

## Empfohlene Reihenfolge

### Phase 0: Entscheidungsvorbereitung

1. Namen und Scope festlegen.
2. Beteiligungsmodi festlegen.
3. Ergebnis-Semantik festlegen: Signal, nicht Wahrheit und nicht repräsentativ.
4. Pricing-/Reporting-Grenzen grob definieren.
5. Datenschutzgrundsatz festlegen: keine Template-Wiederverwendung ohne Opt-in.

### Phase 1: Minimaler Live-Modus

1. Live-Session-Model als Draft-only.
2. QR/Code/Link Join.
3. Multiple Choice + offene Frage + Quellenhinweis.
4. Host-Cockpit mit Live-Ergebnissen.
5. Handoff: speichern, Dossier vorbereiten, Review-Queue.

### Phase 2: Demokratisch bessere Formate

1. Ranking/Priorisierung.
2. Skala + Unsicherheitsoption.
3. Pro/Contra + Alternative vorschlagen.
4. Q&A mit Upvotes und Moderation.
5. AI-Clustering mit Review-Gate.

### Phase 3: B2B/B2G-Monetarisierung

1. Report/PDF/CSV.
2. Mandanten-/Workspace-Templates.
3. Branding.
4. Event-Pakete.
5. Integrationen/Embeds.

## Nicht übernehmen

- Keine reine Wordcloud-Ergebnislogik.
- Keine Gleichsetzung von Live-Mehrheit und Wahrheit.
- Keine automatische Veröffentlichung.
- Keine automatische Dossier-/Anlassraum-Erstellung ohne Review.
- Keine Wiederverwendung von Bürger-/Kundenfragen für globale Inspiration ohne explizites Opt-in.
- Keine Deck-/Folienzentrierung als Produktkern.
