# eDebatte Kampagnenplan 2026

Status: `working_plan / admin_registry_source`

## Ziel

Die Kampagnen bauen Reichweite, Verständnis, Vertrauen, qualifizierte Nutzung sowie institutionelle Partnerschaften auf. Sie dürfen der Produktreife nicht vorauslaufen und werden aus realen Produktoberflächen, dokumentierten Inhalten und freigegebenen Voxy-Assets produziert.

Dieses Dokument ist die fachliche Kampagnenquelle. Die spätere operative Steuerung erfolgt über `MarketingCampaign` im Marketing Control Plane. Beteiligungskampagnen des Produkts bleiben davon getrennt.

## Priorisierungslogik

1. Produkt und Nutzen verständlich machen.
2. Wiederkehrende Content-Formate etablieren.
3. Zielgruppen mit konkreten Problemen und Arbeitsabläufen ansprechen.
4. VoiceOpenGov-Membership und Partnerschaften erst innerhalb der freigegebenen Governance- und Angebotsgrenzen vermarkten.
5. Erfolgreiche Formate in wiederverwendbare Templates und später in die Render-Runtime überführen.
6. Jede neue Funktion zuerst als MarketingOpportunity prüfen, nicht automatisch bewerben.
7. Jede reale Ausspielung separat als DistributionRecord dokumentieren.

## Statuslogik

### MarketingCampaign-Lifecycle

```text
idea
→ qualified
→ planned
→ in_production
→ review_ready
→ approved
→ scheduled
→ active
→ completed
→ retired
```

Zusätzlich möglich:

- `blocked`
- `paused`
- `cancelled`

### Readiness-Gate

Der Lifecycle beschreibt die operative Bearbeitung. Die Readiness beschreibt, was fachlich noch fehlt:

- `ready`
- `product_proof_required`
- `governance_decision_required`
- `offer_decision_required`
- `routing_decision_required`
- `legal_review_required`
- `translation_review_required`
- `runtime_proof_required`

Ein Asset kann produziert werden, obwohl die Kampagne noch nicht öffentlich ausgespielt werden darf. Es bleibt dann intern und eindeutig als Entwurf oder Preview gekennzeichnet.

## Kampagnenübersicht

| ID | Kampagne | Primärzielgruppe | Ziel | Kern-CTA | Lifecycle | Readiness |
| --- | --- | --- | --- | --- | --- | --- |
| CAM-EDB-01 | Warum eDebatte? | Bürger, Redaktionen, Initiativen | Problem und Produktversprechen erklären | eDebatte entdecken | `planned` | `product_proof_required` |
| CAM-CONTENT-02 | Debattenstand der Woche | breite Öffentlichkeit | wiederkehrenden Content-Nutzen zeigen | Debattenstand ansehen | `planned` | `ready` für manuell geprüfte Inhalte |
| CAM-VOXY-03 | Voxy erklärt | breite Öffentlichkeit | Voxy als Guide und Einordner etablieren | Thema mit Voxy verstehen | `planned` | `ready` für bestehende Voxy- und Produktwahrheit |
| CAM-SOURCE-04 | Quellen statt Schlagzeilen | Bürger, Medien, Wissenschaft | Quellenlage, Gegenpositionen und offene Fragen zeigen | Quellenlage prüfen | `idea` | `product_proof_required` |
| CAM-LANG-05 | Eine Debatte, mehrere Sprachen | internationale und mehrsprachige Nutzer | Sprachbrücke mit Originalerhalt erklären | in eigener Sprache mitlesen | `blocked` | `runtime_proof_required` |
| CAM-MEDIA-06 | Medienpartner werden | Redaktionen, Podcasts, Fachmedien | Partnerschaft und redaktionellen Nutzen erklären | Partnerschaft prüfen | `qualified` | `offer_decision_required` |
| CAM-SCIENCE-07 | Wissenschaftspartner werden | Hochschulen, Institute, Forschende | Evidenz, Expertise und Transparenz verbinden | Kooperation besprechen | `qualified` | `offer_decision_required` |
| CAM-TECH-08 | Technologiepartner werden | Infrastruktur-, Open-Source- und KI-Partner | technische Unterstützung ohne Einflussrechte anbieten | Technologiepartnerschaft prüfen | `qualified` | `offer_decision_required` |
| CAM-MUNI-09 | Beteiligung nachvollziehbar organisieren | Kommunen und Verwaltung | strukturierte Beteiligung, Dossiers und Review zeigen | Anwendungsfall besprechen | `blocked` | `product_proof_required` |
| CAM-COMMUNITY-10 | Macht euer Anliegen anschlussfähig | Initiativen, Vereine, NGOs | Anliegen strukturieren und anschlussfähig machen | Anliegen vorbereiten | `idea` | `product_proof_required` |
| CAM-VOG-11 | VoiceOpenGov Mitglied werden | mission-orientierte Einzelpersonen | Mitwirkung und Verantwortung erklären | Mitgliedschaft kennenlernen | `blocked` | `governance_decision_required` |
| CAM-VOG-PARTNER-12 | Partner für transparente Debatten | Organisationen | Partnerkategorien und Einflussgrenzen erklären | Partnergespräch anfragen | `blocked` | `governance_decision_required` |
| CAM-WHITE-LABEL-13 | Beteiligung im eigenen Auftritt | Kommunen, Verbände, Organisationen | kontrollierte Co-Branding- und White-Label-Ausgaben erklären | White-Label-Anwendungsfall prüfen | `idea` | `offer_decision_required` |

## MarketingOpportunity aus neuen Funktionen

Bei jedem relevanten Merge, Product-Smoke oder freigegebenen Feature-Contract wird geprüft:

1. Welches konkrete Problem löst die Funktion?
2. Für welche Zielgruppe ist sie relevant?
3. Was ist bereits real belegt?
4. Welche Aussagen sind nur Konzept oder Preview?
5. Gibt es eine reale Route und einen realen CTA?
6. Welche Screens, Demos oder Ergebnisse dürfen gezeigt werden?
7. Welche Kampagnen und Assets könnten aktualisiert werden?
8. Welche Sprache, Governance, Privacy oder Rechtsprüfung fehlt?

Ergebnis ist eine MarketingOpportunity mit Einstufung:

- `not_marketable`
- `concept_only`
- `preview_only`
- `proof_required`
- `review_ready`
- `publicly_marketable`
- `retired`

## Kampagne CAM-EDB-01 — Warum eDebatte?

### Problem

Zwischen Schlagzeilen, Kommentarspalten und Einzelmeinungen geht häufig verloren:

- was tatsächlich passiert ist,
- welche Quellen vorliegen,
- welche Argumente einander gegenüberstehen,
- was noch offen ist,
- und wie Menschen sinnvoll beitragen können.

### Kernbotschaft

> eDebatte macht aus verstreuten Beiträgen, Quellen und Perspektiven einen nachvollziehbaren Debattenstand.

### Ausspielungen

- Executive-Onepager
- 7–10 Folien Pitchdeck
- Website-Hero und Produktsektion
- LinkedIn-Carousel
- Instagram-Carousel
- 15–20 Sekunden Short
- 30–45 Sekunden Erklärclip
- Presse-Boilerplate

### Brandprofile

- `brand-edebatte-light`
- `brand-edebatte-dark`

### Pflichtbelege

- reale UI-Screens oder klar als Konzept markierte Layouts,
- reale Route als CTA,
- keine erfundenen Nutzer-, Partner- oder Erfolgszahlen,
- reale Distribution separat dokumentieren.

## Kampagne CAM-CONTENT-02 — Debattenstand der Woche

### Wiederkehrende Struktur

1. Was ist passiert?
2. Welche Positionen stehen sich gegenüber?
3. Welche Quellen sind neu?
4. Was ist noch ungeklärt?
5. Welche Abstimmung oder Beteiligung ist bereits legitim freigegeben?

### Serienformate

- `30 Sekunden Debattenstand`
- `Eine Quelle, zwei Lesarten`
- `Was noch offen ist`
- `Community ergänzt`
- `Voxy ordnet ein`

### Nicht-Ziel

Keine tägliche Aktivierungsaufforderung zu beliebigen lokalen Themen. Relevanz entsteht aus Content, Quellen, Community-Prozess und freigegebenen Beteiligungswegen.

## Kampagnen CAM-MEDIA-06 bis CAM-TECH-08 — Partnerprogramm

Gemeinsame Partnerbotschaft:

> Diese Partner unterstützen einen offenen, transparenten und nachvollziehbaren Debattenprozess.

Verbindliche Ausschlüsse:

- keine inhaltlichen Sonderrechte,
- kein Faktenstatus durch Partnerschaft,
- keine algorithmische Bevorzugung,
- kein automatisches Stimm- oder Repräsentationsrecht,
- keine ungekennzeichnete Einflussnahme.

Benötigte Entscheidungen vor Veröffentlichung:

- konkretes Leistungs- und Gegenleistungsmodell,
- Bewerbungs- oder Aufnahmeprozess,
- Prüfung und Laufzeit,
- öffentliche Darstellung,
- Pricing, Förderung oder Sachleistung,
- Vertrags-, Datenschutz- und Transparenztexte.

## Kampagne CAM-VOG-11 — Mitgliedschaft

Zulässige Richtung:

> Nicht nur zuschauen. Einen transparenten Prozess mittragen und nach seinen Regeln mitgestalten.

Noch nicht zulässig ohne Entscheidung:

- konkrete Stimmrechte,
- konkrete Preise oder Pakete,
- garantierter Einfluss auf Positionen,
- automatische Partner- oder Plattformrollen,
- Zugriff auf nicht freigegebene Daten oder Prozesse.

## Kampagne CAM-WHITE-LABEL-13 — Beteiligung im eigenen Auftritt

### Nutzenrichtung

Organisationen können später freigegebene Kommunikations-, Kampagnen- und Reportformate in einem kontrollierten eigenen oder gemeinsamen Markenauftritt nutzen.

### Verbindliche Grenzen

- White-Label verändert Gestaltung und Absender, nicht Quellen-, Review-, Privacy- oder Governance-Wahrheit.
- Keine kundenbezogene Funktion wird als allgemeine eDebatte-Funktion ausgegeben.
- Betreiber, fachlich Verantwortliche und Datenverarbeitung bleiben transparent.
- Ein freigegebenes Brandprofil ist Pflicht.
- Voxy bleibt kanonisch, wird ausgeblendet oder kontrolliert co-gebrandet; sie wird nicht zum Kundenmaskottchen umgebaut.

### Offene Entscheidungen

- Angebots- und Preismodell,
- Umfang der Markenanpassung,
- Betreiber- und Domainmodell,
- Tenant-/Mandantenlogik,
- Rechts- und Datenschutzverantwortung,
- Support und SLA,
- zulässige Exporte und Integrationen.

## Produktionsrhythmus

### Wöchentlich

- 1 Debattenstand-Video,
- 1 Quellen-/Gegenpositions-Carousel,
- 1 Voxy-Erklärformat,
- 1 produkt- oder communitybezogener Beitrag,
- Review der neuen MarketingOpportunities aus Produktänderungen.

### Monatlich

- 1 Zielgruppen-Schwerpunkt,
- 1 längerer Product-/Use-Case-Beitrag,
- 1 Partner- oder Membership-Erklärstück, sofern freigegeben,
- KPI- und Lernreview,
- Asset- und Brandprofil-Hygiene,
- Prüfung freigegebener, aber noch nicht ausgespielter Assets.

## Kern-KPIs

Je Kampagne werden nur passende KPIs gewählt:

- qualifizierte Profil- oder Landingpage-Aufrufe,
- abgeschlossene Videoansichten,
- Speicherungen und geteilte Inhalte,
- Klicks auf reale Produktflächen,
- begonnene und abgeschlossene Beiträge,
- qualifizierte Kontaktanfragen,
- Demo- oder Partnergespräche,
- Membership-Anfragen,
- wiederkehrende Nutzer,
- redaktionell verwertbare Rückmeldungen,
- Wiederverwendung freigegebener Assets,
- Zeit von Opportunity bis reviewfähigem Asset.

Reichweite allein ist kein Erfolgsbeleg. Alle BI-Werte bleiben aggregiert und werden mit Quelle, Zeitraum und Erfassungsstatus dokumentiert.
