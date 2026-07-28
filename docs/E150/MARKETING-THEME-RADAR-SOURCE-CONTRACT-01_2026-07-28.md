# MARKETING-THEME-RADAR-SOURCE-CONTRACT-01

Stand: 2026-07-28  
Status: decision_contract  
Issue: #498

## Zweck

Der Marketing-Themenradar soll aktuelle Themen automatisch finden, sprach- und regionsübergreifend clustern und einem Betreiber als priorisierte Arbeitsgrundlage anbieten. Er ist keine ungefilterte Nachrichtenablage und keine automatische Wahrheits- oder Publikationsmaschine.

## Zielabdeckung

Die maschinenlesbare Coverage-Matrix liegt unter:

- `docs/marketing/source-profiles/topic-radar-coverage.json`

Verbindliche Operator-Abdeckung:

- International: Top 20,
- Europäische Union: Top 20,
- Deutschland national: Top 20,
- neun Nachbarländer Deutschlands: bis zu 20 Rohkandidaten je Land,
- Nachbarländer gesamt: gemeinsame Top 20,
- 16 deutsche Bundesländer: bis zu 20 Themenkandidaten je Bundesland.

Die Rohmenge darf 400 bis 560 Kandidaten umfassen. Die Bedienoberfläche zeigt nie alle ungeclustert, sondern maximal Top 20 je gewähltem Bereich.

## Phasenentscheidung

### Phase 1: amtliche und öffentliche maschinenlesbare Quellen

Zugelassen sind zunächst ausdrücklich veröffentlichte RSS-, Atom-, JSON-Feed- oder öffentliche API-Angebote ohne Credential-Pflicht, insbesondere:

- Bundesregierung und Bundesministerien,
- Europäisches Parlament und weitere EU-Institutionen,
- Landesregierungen, Landesparlamente und Behörden,
- ausgewählte internationale Institutionen,
- weitere Quellen erst nach Source-Review.

Beispiele für geeignete offizielle Einstiegspunkte:

- Bundesregierung RSS-Angebote: `https://www.bundesregierung.de/breg-de/service/newsletter-und-abos/rss-newsfeed`
- Europäisches Parlament RSS: `https://www.europarl.europa.eu/at-your-service/en/stay-informed/rss-feeds`
- Europäische Kommission Press Corner: `https://commission.europa.eu/about/contact/press-services/press-releases-and-notifications_en`

Phase 1 speichert standardmäßig nur:

- Originaltitel,
- veröffentlichte Kurzbeschreibung, sofern erlaubt,
- Herausgeber und Quellentyp,
- Originalsprache,
- Veröffentlichungs- und Abrufzeit,
- kanonischen Link,
- Jurisdiktion und Provenienz.

Kein ungeklärtes Volltextarchiv, kein Paywall-Scraping und keine Umgehung von Nutzungsbedingungen.

### Phase 2: breitere Mediencluster

Die Architektur bleibt connector-neutral. Bevorzugter Kandidat für eine spätere breite Discovery-Ergänzung ist GDELT Cloud, weil Story-Cluster, Quellenbelege, Länder-, Regions- und `admin1`-Filter vorgesehen sind.

Aktivierung erst nach separater Entscheidung zu:

- API-Key und Secret Store,
- Tarif und monatlichem Kostenlimit,
- Query-/Rate-Limits,
- erlaubter Speicherung,
- Retention und Löschung,
- Freshness und Fehlerverhalten.

GDELT oder ein anderer Medienprovider ergänzt amtliche Originalquellen, ersetzt sie aber nicht.

## Source Registry

Jede aktive Quelle muss `marketing-topic-source.schema.json` erfüllen und mindestens enthalten:

- stabile Source-ID,
- Herausgeber,
- Quellentyp,
- Land, Region und Jurisdiktionsstufe,
- Originalsprachen,
- Transport und HTTPS-Endpunkt,
- Abrufintervall,
- Lizenz-/Nutzungshinweis,
- erlaubte Metadaten-, Summary- und Volltextspeicherung,
- Raw- und Metadaten-Retention,
- Freshness-/Stale-Grenze,
- Aktiv-, Pausiert-, Fehler- oder Reviewstatus,
- letzte erfolgreiche Erfassung.

Eine Quelle kann einzeln pausiert oder entfernt werden. Fehler einer Quelle stoppen nicht die gesamte Discovery, werden aber sichtbar und senken die Datenqualität des betroffenen Bereichs.

## Normalisiertes Themencluster

Jedes Themencluster muss `marketing-topic-cluster.schema.json` erfüllen.

Kernwahrheit:

- ein Ereignis oder Sachverhalt bildet einen Cluster,
- mehrere Meldungen und Sprachvarianten werden als Quellen desselben Clusters geführt,
- Originaltitel, Originalsprache und kanonische Links bleiben erhalten,
- die neutrale Kurzbeschreibung ist vom Originalinhalt unterscheidbar,
- B2C-/B2B-/B2G-Relevanz und Beteiligungseignung bleiben Vorschläge,
- Unsicherheiten und fehlende Stimmen bleiben sichtbar.

## Deduplizierung

Reihenfolge:

1. identische URL und Canonical-URL entfernen,
2. identische Publisher-Meldungen und Syndizierungen erkennen,
3. Titel- und Semantikähnlichkeit prüfen,
4. Ereignis-/Story-Cluster bilden,
5. Sprachvarianten demselben kanonischen Cluster zuordnen,
6. unsichere Zusammenführungen als Reviewbedarf markieren.

Hohe Medienmenge ist kein Wahrheitsbeweis. Publisher-Vielfalt wird separat von der Zahl einzelner Artikel gezählt.

## Ranking

Die Operator-Reihenfolge entsteht aus nachvollziehbaren Teilwerten:

- Aktualität,
- Vielfalt unabhängiger Herausgeber,
- regionaler beziehungsweise jurisdiktionaler Bezug,
- Signifikanz,
- bisherige eDebatte-Abdeckungslücke.

Der Gesamtwert priorisiert Arbeit, entscheidet aber nicht über Wahrheit, Beteiligung oder Veröffentlichung.

## Sprachlogik

Getrennt bleiben:

- Originalsprache jeder Quelle,
- Lesesprache des Betreibers,
- Bedienungssprache,
- Ausgabesprachen für spätere Inhalte.

Übersetzte Titel oder Zusammenfassungen ersetzen nie die Originalfassung. Gleiche Ereignisse in verschiedenen Sprachen bleiben in einem Cluster mit mehreren Sprachvarianten verbunden.

## Bedienziel

Eine reale Themenradar-Fläche wird erst sichtbar, wenn mindestens eine validierte Quelle echte aktuelle Cluster liefert.

Zielroute:

- `/admin/marketing/topics`

Operator-Aktionen nach einem realen Readmodel:

- beobachten,
- Dossier vorbereiten,
- Kampagne oder Beitrag entwerfen,
- ausblenden,
- als nicht relevant markieren.

Keine dieser Aktionen veröffentlicht automatisch.

## Datenschutz, Lizenz und Retention

- keine personenbezogenen politischen Profile,
- keine Cross-Site-Identifikation,
- Rohpayloads höchstens 30 Tage und nur, wenn technisch beziehungsweise lizenzrechtlich erlaubt,
- normalisierte Metadaten nach Source Policy bis maximal fünf Jahre,
- Volltext nur bei ausdrücklicher Erlaubnis,
- Quelle und Link bleiben sichtbar,
- Lösch- und Pausenweg je Quelle,
- keine Weitergabe von Beteiligungs- oder Accountdaten an Feed- oder Medienprovider.

## Fehler- und Freshness-Regeln

- jeder Abruf ist idempotent,
- Fehler, Rate Limits und letzte erfolgreiche Erfassung werden getrennt angezeigt,
- veraltete Quellen werden als `stale` behandelt und nicht still als aktuell gerankt,
- fehlende Regionen werden als Coverage Gap ausgewiesen,
- ein Provider-Ausfall erzeugt keine erfundenen Themen oder Null-Performance.

## Architekturgrenzen

Dieser Slice enthält:

- Decision Contract,
- Source-Schema,
- Topic-Cluster-Schema,
- Coverage-Matrix.

Dieser Slice enthält nicht:

- Live-Abruf,
- Scheduler oder Webhook,
- Provider-Credentials,
- Themenradar-Route,
- Demo-Themen,
- Dossier-, Kampagnen- oder Postingmutation,
- Auto-Publish.

Live-Ingestion bleibt `MARKETING-REGIONAL-SOURCE-DISCOVERY-02` und startet erst nach einem konkreten Source-Allowlist-Paket sowie Kosten-/Secret-/Retention-Freigabe für credentialpflichtige Provider.

## Acceptance Evidence

- International, EU und Deutschland national vorhanden,
- neun Nachbarländer plus gemeinsame Nachbarländeransicht vorhanden,
- alle 16 Bundesländer vorhanden,
- maximal Top 20 je Operatorbereich,
- Source- und Cluster-Schema connector-neutral,
- amtliche Quellen zuerst,
- breiter Medienprovider nur als spätere Ergänzung,
- keine leere UI und keine Fake-News-Fälle in diesem Slice.
