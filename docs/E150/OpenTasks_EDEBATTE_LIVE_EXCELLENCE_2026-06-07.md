# OpenTasks eDebatte Live Excellence Backlog

Stand: 2026-06-07
Status: research_only / Produkt- und Verfeinerungsvorbereitung
Repo-Bezug: Ergänzende Analyse zu docs/E150/OpenTasks.md, noch kein Ersatz der operativen SSOT-Queue.

## Zweck

Diese Datei hält produktneutrale Anregungen für die bestmögliche Live-Version von eDebatte fest. Sie ist kein Wettbewerbervergleich und keine Kopiervorlage. Sie sammelt Muster aus Live-Interaktion, Bürgerbeteiligung, Medienbetrieb, Streaming, Print, Social Media, YouTube, TV und anschließender Dossier-/Review-Logik.

Leitsatz: eDebatte Live soll nicht nur Stimmen einsammeln. eDebatte Live soll aus Momenten der Aufmerksamkeit einen nachvollziehbaren öffentlichen Beteiligungs-, Fakten- und Entscheidungsprozess machen.

## Produktziel

Die Live-Version soll überall dort funktionieren, wo Öffentlichkeit entsteht:

- vor Ort: Bürgerversammlung, Rathaus, Schule, Kita, Verband, Konferenz, Demo-Stand
- digital: Website, Artikel, Newsletter, Stream, YouTube, Social Media
- medial: Printartikel, Plakat, QR-Anzeige, TV-Einblendung, Podcast-/Video-CTA
- nachgelagert: Dossier, Anlassraum, Factcheck, Review-Queue, Report, Folgeumfrage

Der entscheidende Unterschied zu klassischen Umfrage- oder Präsentationstools: Ergebnisse bleiben nicht als Momentaufnahme stehen. Sie werden in eDebatte in Kontext, Quellen, Gegenargumente, offene Fragen, Zuständigkeiten und nächste Handlungsschritte überführt.

## Inspirationsquellen / Recherchehinweise

Diese Quellen dienen nur als Inspiration für Muster, nicht als Namens- oder Funktionskopie:

- Live-Polls, Q&A, Ranking, Moderation, Analytics, Exporte und Integrationen: https://www.slido.com/product
- Bürgerbeteiligungsplattform mit demokratischen Garantien, Transparenz, Traceability, Privacy und Participatory-Budgeting-/Initiative-/Consultation-Strukturen: https://decidim.org/
- YouTube Live Chat API: Chat-Nachrichten, Polls, Moderationsrollen und Low-Latency-Message-Streams für Live-Events: https://developers.google.com/youtube/v3/live/docs/liveChatMessages
- HbbTV / Hybrid Broadcast Broadband TV als Denkfolie für TV-nahe Interaktion, Red-Button-Logik und Broadcast-plus-Web: https://www.hbbtv.org/
- Ergänzende Muster: Pol.is für Meinungscluster, Loomio für Konsens-/Entscheidungslogik, LiquidFeedback für Delegation/Initiativen, klassische CMS-/Newsletter-/Print-QR-Workflows.

## Nicht als Adaption verstehen

Diese Datei ersetzt nicht die eDebatte-Produktlogik. Sie markiert, welche extern sichtbaren Muster für eDebatte nützlich sein können, wenn sie mit unseren Guardrails verbunden werden:

- kein Auto-Publish
- kein Auto-Dossier ohne Review
- kein Auto-Anlassraum ohne explizite Entscheidung
- kein Auto-Graph-Merge
- kein DeepSearch ohne bewusstes Gate
- keine Gleichsetzung von Mehrheit mit Wahrheit
- keine Verwechslung von Beteiligungssignal und repräsentativem Mandat

## Zielbild: eDebatte Live als Kanal- und Handoff-System

### 1. Session

Eine Live-Session ist ein zeitlich begrenzter Beteiligungsraum mit Host, Kontext, Join-Möglichkeit und Handoff.

Minimales Modell:

- id
- title
- contextText
- hostRole
- joinCode
- qrPayload
- publicLink
- channelSource
- visibility
- participationMode
- startsAt / endsAt / expiresAt
- reviewStatus
- handoffTargets

### 2. Channels

`channelSource` sollte nicht nur Web bedeuten. Vorgeschlagene Werte:

- onsite_event
- website_embed
- article_embed
- newsletter
- print_qr
- poster_qr
- youtube_live
- podcast_cta
- tv_overlay
- social_post
- social_comment_import
- partner_cms
- admin_seed

### 3. Participation Modes

- anonymes Stimmungsbild
- pseudonyme Beteiligung
- eingeloggte Bürgerrolle
- verifizierte Bürgerrolle, falls später vorhanden
- verifizierte Organisation
- verifizierte Redaktion
- verifizierte Verwaltung / Kommune

Jede Ergebnisansicht muss den Modus sichtbar machen.

### 4. Question Types

MVP:

- Multiple Choice
- offene Antwort
- Quellen-/Hinweisabgabe
- Pro/Contra
- Unsicher / brauche mehr Informationen

Phase 2:

- Ranking / Priorisierung
- Skala
- 100-Punkte-Budget
- 2x2-Matrix: Wirkung/Aufwand oder Zustimmung/Sicherheit
- Q&A mit Upvotes
- Alternative vorschlagen
- Gegenargument einreichen

Phase 3:

- mehrstufige Deliberation
- Konsens-/Konfliktlinien
- Bürgerbudget-Varianten
- delegierte Einschätzung durch Vertrauenspersonen oder Fachrollen

## Candidate OpenTasks

| ID | Status | Priority | Depends on | Scope | Goal | Acceptance Criteria | Decision open | Evidence / Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LIVE-EXCELLENCE-00 | research_only | high | none | Produktanalyse / Backlog-Staging | Kanalübergreifendes Zielbild für eDebatte Live festhalten | Datei beschreibt Zielbild, Kanäle, Tasks, Guardrails, Umsetzungsphasen und offene Entscheidungen | no | Initialer neutraler Capture. |
| EDEB-LIVE-NAMING-01 | needs_decision | high | none | Produktname / IA | Entscheiden, wie die Live-Version heißt | Name ist festgelegt und grenzt sich von Dossier, Anlassraum, Runde, Create und Account ab | yes | Optionen: eDebatte Live, Live-Beteiligung, Bürgerdialog Live, Anlassraum Live. |
| EDEB-LIVE-ENTRY-02 | needs_decision | high | PR-AI-CREATE-01G, CREATE-MULTIBRANCH-ACTION-BOARD-01 | /create, /dossier, /anlassraum, /account | Live-Beteiligung als klare Aktion einführen | CTA erzeugt Draft-Session; keine Veröffentlichung; Handoff bleibt kanonisch | yes | Muss zu bestehendem Mehrthemen-Action-Board passen. |
| EDEB-LIVE-SESSION-MODEL-03 | needs_decision | high | EDEB-LIVE-NAMING-01 | Datenmodell / Runtime | LiveSession, LiveQuestion, LiveResponse, LiveHandoff definieren | Minimalmodell dokumentiert; Statusmaschine draft/live/closed/reviewed/exported; Guardrails abgebildet | yes | Vor Implementierung Inventory der bestehenden Modelle prüfen. |
| EDEB-LIVE-QR-CODE-LINK-04 | codex_ready_after_decision | high | EDEB-LIVE-SESSION-MODEL-03 | QR, Kurzlink, Join-Code | Teilnahme ohne App-Zwang ermöglichen | QR, Kurzlink und Code führen zu derselben Session; mobile-first; Reload-resistent; klare Privacy-Hinweise | yes | Login darf nicht pauschal blockieren. |
| EDEB-LIVE-CHANNEL-SOURCES-05 | needs_decision | high | EDEB-LIVE-SESSION-MODEL-03 | Kanalmodell | Herkunft einer Beteiligung sauber erfassen | Antworten speichern channelSource, campaignId, medium, referrer und optional offlineBatchId; keine PII ohne Rechtsgrund | yes | Relevant für Print, TV, YouTube, Social, Newsletter, Embeds. |
| EDEB-LIVE-PRINT-KIT-06 | codex_ready_after_decision | medium | EDEB-LIVE-QR-CODE-LINK-04 | Print / Plakat / Flyer | Bürgerdialog-Poster und Print-QR-Kit vorbereiten | A4/A3-Vorlage mit QR, Kurzlink, Code, Titel, Teilnahmehinweis, Datenschutzmodus, Ablauf und Voxy-kompatibler Gestaltung | yes | Druckfähige Assets später als Export/Download. |
| EDEB-LIVE-TV-OVERLAY-07 | research_only | medium | EDEB-LIVE-QR-CODE-LINK-04 | TV / Broadcast / HbbTV-Denkfolie | Prüfen, wie eDebatte in TV-/Video-Formate hineinragen kann | Analyse unterscheidet einfache QR-Einblendung, Lower Third, Red-Button/HbbTV-Perspektive und Second-Screen-Teilnahme | yes | Kurzfristig QR/Second Screen; HbbTV nur strategisch, nicht MVP. |
| EDEB-LIVE-YOUTUBE-08 | research_only | high | EDEB-LIVE-CHANNEL-SOURCES-05 | YouTube Live / Video | YouTube-Live-Kommentare, Polls und CTAs als Beteiligungsquelle prüfen | Konzept trennt offizielle eDebatte-Antworten von importierten YouTube-Chats; Moderator-/Consent-/Rate-Limit-/Spam-Fragen dokumentiert | yes | Keine Chat-Inhalte automatisch als gültige Beteiligung werten. |
| EDEB-LIVE-SOCIAL-09 | research_only | high | EDEB-LIVE-CHANNEL-SOURCES-05 | Social Media | Social Posts als Reichweiten- und Hinweisquelle anbinden, ohne Plattformkommentare ungeprüft zu übernehmen | Konzept für share cards, UTM/campaign links, Kommentar-Sichtung, Signal-Import und Review-Queue | yes | API-Verfügbarkeit/ToS je Plattform prüfen; Import nur review-first. |
| EDEB-LIVE-ARTICLE-EMBED-10 | needs_decision | high | EDEB-LIVE-QR-CODE-LINK-04 | Medienartikel / Partner-CMS | eDebatte-Fragen direkt in Artikel/Projektseiten einbettbar machen | Embed zeigt Frage, Kontext, Teilnahme, Ergebnisstatus und Link ins Dossier; keine fremde Seite bekommt unkontrollierte Adminrechte | yes | Wichtiger Medien-/Publix-/Redaktionshebel. |
| EDEB-LIVE-NEWSLETTER-11 | research_only | medium | EDEB-LIVE-CHANNEL-SOURCES-05 | Newsletter / Mail | Beteiligung aus Newslettern messbar machen | Newsletter-CTA mit Kurzlink/QR, Kampagnen-ID, Follow-up-Report und datensparsamer Attribution | yes | Keine personenbezogene Trackinglogik ohne Einwilligung. |
| EDEB-LIVE-QA-MODERATION-12 | needs_decision | high | EDEB-LIVE-SESSION-MODEL-03 | Q&A, Upvotes, Moderation | Live-Fragen sichtbar machen und fair priorisieren | Fragen können eingereicht, upgevotet, markiert, beantwortet, ausgeblendet, abgewiesen und als offene Frage ins Dossier überführt werden | yes | Moderation transparent halten: ausgeblendet ist nicht gelöscht. |
| EDEB-LIVE-QUESTION-TYPES-13 | needs_decision | high | EDEB-LIVE-SESSION-MODEL-03 | Frageformate | Demokratisch sinnvolle Interaktionsformate festlegen | MVP: Multiple Choice, offene Antwort, Quellenhinweis, Pro/Contra, Unsicherheit; Phase 2: Ranking, Skala, 100-Punkte, 2x2, Alternative | yes | Wordcloud nur als Einstieg, nicht als Ergebniswahrheit. |
| EDEB-LIVE-UNCERTAINTY-14 | codex_ready_after_decision | high | EDEB-LIVE-QUESTION-TYPES-13 | Antwortlogik | Unsicherheit und Informationsbedarf sichtbar machen | Standardoption oder Folgefrage: Ich brauche mehr Informationen; Ergebnis fließt in Dossier-Lücken und Factcheck-Kandidaten | yes | Starkes Differenzierungsmerkmal gegenüber reinen Polls. |
| EDEB-LIVE-PRIORITY-CONFIDENCE-15 | codex_ready_after_decision | medium | EDEB-LIVE-QUESTION-TYPES-13 | Messlogik | Wichtigkeit und Sicherheit getrennt messen | Ergebnis zeigt Achse Priorität x Vertrauen; hohe Priorität + geringe Sicherheit erzeugt Prüf-/Dossier-Signal | yes | Ideal für Themenradar. |
| EDEB-LIVE-MINORITY-RADAR-16 | needs_decision | high | EDEB-LIVE-QA-MODERATION-12 | Minderheiten / Gegenpositionen | Nicht nur Gewinnerlogik anzeigen | Starke Minderheiten, begründete Gegenargumente und neue Alternativen werden sichtbar und können Dossier-Kapitel werden | yes | Zentrale eDebatte-Differenzierung. |
| EDEB-LIVE-AI-GROUPING-17 | needs_decision | high | AI-ORCHESTRATOR-TRUTH-GUARD-11, EDITORIAL-REVIEW-QUEUE-13 | AI-Clustering | Offene Antworten in Muster, Konfliktlinien und offene Fragen überführen | AI erzeugt Cluster mit Confidence, Beispielen, Gegenpositionen und requiresHumanReview; kein Auto-Publish, kein Auto-Merge | yes | Muss review-first und kostenkontrolliert bleiben. |
| EDEB-LIVE-HANDOFF-18 | needs_decision | high | EDEB-LIVE-AI-GROUPING-17 | Dossier / Anlassraum / Factcheck / Report | Aus Live-Ergebnissen konkrete nächste Schritte erzeugen | Host sieht: Dossier vorbereiten, Factcheck starten, Anlassraum anlegen, Report exportieren, Folgeumfrage starten, nur speichern | yes | Entscheidung: Was darf öffentlich werden, was bleibt Draft/Review? |
| EDEB-LIVE-REPORTING-19 | needs_decision | high | EDEB-LIVE-HANDOFF-18 | PDF, CSV, Beteiligungsreport | Reporting als B2B-/B2G-Werttreiber definieren | Report enthält Votes, Begründungen, Cluster, offene Fragen, Quellenhinweise, Minderheitenpositionen, Zeitverlauf, Methodik, Limitations, Reviewstatus | yes | Pricing/Paywall/Entitlements offen. |
| EDEB-LIVE-TRUST-LABEL-20 | codex_ready_after_decision | high | EDEB-LIVE-REPORTING-19 | Ergebnisdarstellung | Jede Ergebnisansicht sauber einordnen | Label zeigt Beteiligungsmodus, Teilnehmerzahl, Zeitraum, Frageform, Reviewstatus, Quellenstatus, Repräsentativitätsgrenze | yes | Verhindert falsche Mandatswirkung. |
| EDEB-LIVE-HOST-COCKPIT-21 | needs_decision | high | EDEB-LIVE-SESSION-MODEL-03 | Host UI | Prozess-Cockpit statt Präsentationsdeck | Host kann Session starten, Frage live schalten, Antworten moderieren, Cluster prüfen, nächste Frage wählen, Handoff entscheiden, Report erzeugen | yes | eDebatte bleibt prozesszentriert, nicht folienzentriert. |
| EDEB-LIVE-TEMPLATES-22 | needs_decision | high | EDEB-LIVE-ENTRY-02 | Vorlagen | Einstieg über konkrete Anwendungsfälle vereinfachen | Templates für Kommune, Medien, Bürger, Verbände, Schule/Kita, Unternehmen; jede Vorlage enthält Ziel, Fragefolge, Handoff, Reviewhinweis | yes | Template-Auswahl ist Produktentscheidung. |
| EDEB-LIVE-MEDIA-KIT-23 | research_only | high | EDEB-LIVE-TEMPLATES-22 | Medien / Öffentlichkeitsarbeit | Fertige Pakete für Redaktion, Kommune und Kampagne definieren | Kit enthält Artikel-Embed, QR-Grafik, Social Card, Newsletter-CTA, YouTube-CTA, Moderationsscript, Report-Struktur | yes | Wichtig für Go-to-Market. |
| EDEB-LIVE-ENTERPRISE-24 | needs_decision | medium | ROLE-/ORG-/ADMIN-SURFACES | Workspaces, Branding, Co-Creation | Live-Version mandantenfähig für Kommunen, Medien, Verbände machen | Workspaces, Brand Templates, Rollen/Rechte, gemeinsame Vorlagen, Ergebniszugriff, Datenaufbewahrung geprüft | yes | Mit Org-/Unit-/Role-Onboarding harmonisieren. |
| EDEB-LIVE-DATA-SOVEREIGNTY-25 | needs_decision | high | EDEB-LIVE-CHANNEL-SOURCES-05 | Datenschutz / Wiederverwendung | Datenhoheit als Produktversprechen festlegen | Keine Wiederverwendung von Fragen/Antworten für globale Templates ohne Opt-in; Projekt-/Mandantengrenzen; Export-/Lösch-/Retention-Logik | yes | Besonders wichtig für Kommunen, Medien, sensible Bürgeranliegen. |
| EDEB-LIVE-COST-GATE-26 | needs_decision | high | EDEB-LIVE-AI-GROUPING-17 | Kosten / AI / Entitlements | AI- und DeepSearch-Kosten pro Session kontrollieren | Kostenlos: einfache lokale Aggregation; bewusst starten: AI-Clustering; paid/entitled: Factcheck, Deep Search, Exportreport, Langzeitmonitoring | yes | Keine stillen Kostenpfade. |

## Die letzten 20 Prozent für eine starke Live-Version

### 1. Kanalübergreifende Campaign-ID

Jede Session sollte eine campaignId haben. Alle Einstiegspunkte wie Print-QR, Website-Embed, YouTube-Link, Social-Post, Newsletter oder TV-Einblendung laufen in dieselbe Session, aber mit eigenem channelSource. So sieht der Host später nicht nur was abgestimmt wurde, sondern wo Beteiligung entstanden ist.

### 2. Second-Screen-first

Für TV, Bühne, YouTube und Panels ist der Second Screen der realistische MVP. Zuschauer sehen QR/Kurzcode, beteiligen sich am Handy und die Ergebnisse können im Host-Cockpit, Stream-Overlay oder später im Dossier erscheinen.

### 3. Broadcast-/TV-Stufenmodell

- Stufe 1: QR im Video oder TV-Bild.
- Stufe 2: Lower Third mit Kurzcode und Live-Frage.
- Stufe 3: Partnerseite/Second-Screen mit Ergebnis-Embed.
- Stufe 4: HbbTV-/Red-Button-Perspektive für Senderpartnerschaften.

HbbTV ist strategisch interessant, aber nicht MVP. Kurzfristig gewinnt eDebatte mit QR, Kurzlink und sauberem Dossier-Handoff.

### 4. YouTube Live als Signalquelle, nicht als Abstimmungskern

YouTube-Kommentare können Hinweise, Fragen und Stimmungen liefern. Sie sollten aber nicht automatisch als gültige eDebatte-Beteiligung zählen. Besser: Moderator wählt relevante Chat-Fragen aus, importiert sie in die Review-Queue oder startet eine offizielle eDebatte-Frage per Link.

### 5. Social Media als Funnel, nicht als Wahrheitsraum

Social sollte Reichweite bringen, aber nicht die Ergebnislogik bestimmen. Gute Bausteine:

- Share Card mit Frage und QR
- kurzer Link pro Plattform
- Kommentar-Sichtung in Review
- Community-Hinweise importieren
- Folgepost mit Dossier-/Report-Link

### 6. Print als unterschätzter Beteiligungskanal

Print braucht eigene UX: große QR-Codes, Kurzlinks, einfache Codes, Ablaufversprechen und lokale Verankerung. Beispiel: „Scannen, abstimmen, begründen, Quellen ergänzen. Ergebnis wird als Dossier veröffentlicht.“

### 7. Host-Script und Moderationsmodus

Jede Live-Session sollte nicht nur Fragen haben, sondern ein Moderationsscript:

- Einstiegssatz
- Datenschutzsatz
- Frage 1
- Auswertungssatz
- Folgefrage
- Abschluss: Was passiert mit den Ergebnissen?

Das macht eDebatte für Kommunen und Medien nutzbarer.

### 8. Ergebnisdramaturgie

Die Ergebnisansicht braucht drei Ebenen:

- Sofort: Live-Stimmungsbild
- Nach 5 Minuten: Cluster, offene Fragen, Quellenhinweise
- Nach Review: Dossier, Report, Anlassraum oder Factcheck

### 9. Trust-by-design

Jeder Live-Raum muss erklären:

- Wer fragt?
- Warum wird gefragt?
- Wer kann teilnehmen?
- Wie lange läuft es?
- Was passiert danach?
- Ist das repräsentativ?
- Was wurde geprüft?

### 10. Voxy als Live-Guide

Voxy kann den Unterschied machen: nicht als Deko, sondern als Prozessbegleiter.

- erklärt Teilnahme
- weist auf Unsicherheit/Quellen hin
- moderiert Übergänge
- zeigt „Was passiert als Nächstes?“
- eignet sich für Video, Social Cards, Print-QR und Host-Cockpit

## Empfohlene Umsetzung in Phasen

### Phase 0: Entscheidungsvorbereitung

1. Name und Scope der Live-Version festlegen.
2. Beteiligungsmodi festlegen.
3. Ergebnis-Semantik festlegen: Signal, nicht Wahrheit und nicht repräsentativ.
4. Kanalmodell und Campaign-ID entscheiden.
5. Datenschutzgrundsatz festlegen: keine Wiederverwendung ohne Opt-in.

### Phase 1: Minimaler, aber starker Live-Modus

1. Draft-only LiveSession.
2. QR/Code/Kurzlink.
3. Multiple Choice + offene Antwort + Quellenhinweis + Unsicherheitsoption.
4. Host-Cockpit mit Live-Ergebnissen.
5. Handoff: speichern, Dossier vorbereiten, Review-Queue.
6. Print-/Poster-Kit als Export oder statische Vorlage.

### Phase 2: Medien- und Kanalreife

1. Website-/Artikel-Embed.
2. Social Share Cards.
3. Newsletter-/Kampagnenlinks.
4. YouTube-CTA und optionaler Chat-Signal-Import.
5. Stream-/Video-Overlay-Vorlage.
6. Beteiligungsreport.

### Phase 3: Öffentliche/Institutionelle Reife

1. Mandanten-/Workspace-Templates.
2. Branding für Kommunen/Medien/Verbände.
3. Moderationsscript je Vorlage.
4. Minderheitenradar.
5. AI-Clustering mit Review-Gate.
6. Exportreport/PDF/CSV.
7. Langzeitmonitoring und Themenradar.

## Codex-Vorbereitungsprompt

Arbeite im Repo VOGADMINRGF/edebatte-org dokumentations- und task-first.
Lies AGENTS.md, docs/E150/OpenTasks.md und docs/E150/OpenTasks_EDEBATTE_LIVE_EXCELLENCE_2026-06-07.md.
Ziel ist keine Implementierung, sondern ein Evidence-/Inventory-Report für die technische Vorbereitung der Live-Version.

Prüfe:
1. Welche bestehenden Surfaces, Komponenten, Routen und Services für QR, Live-Session, Survey, Dossier, Anlassraum, Review, Account und Handoff genutzt werden können.
2. Wo bereits Beitragspaket, Mehrthemen-Aktionen, Review-Queue, Factcheck-Gates, Account-Workbench, Export oder Reporting existieren.
3. Welche minimalen Modelle nötig wären: LiveSession, LiveQuestion, LiveResponse, LiveHandoff, CampaignSource.
4. Welche Entscheidungspunkte offen bleiben und nicht implementiert werden dürfen.
5. Welche 1-3 späteren codex_ready Slices möglich wären, ohne Governance-, Routing-, Pricing- oder Privacy-Entscheidungen still zu treffen.

Guardrails: Kein Auto-Publish, kein Auto-Dossier, kein Auto-Anlassraum, kein Auto-Graph-Merge, kein DeepSearch ohne explizites Gate.
