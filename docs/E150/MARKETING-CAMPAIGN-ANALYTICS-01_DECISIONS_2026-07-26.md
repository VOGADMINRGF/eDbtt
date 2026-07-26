# MARKETING-CAMPAIGN-ANALYTICS-01

Datum: `2026-07-26`

Status: `decision_contract / implementation_not_started`

## Ziel

Eine belastbare, datenschutzkonforme Marketingauswertung für eDebatte und VoiceOpenGov definieren, mit der Kampagnen, Kanäle, Assets, Zielgruppen und Funnel-Stufen vergleichbar bewertet werden können.

Die Auswertung ist ein eigener Bestandteil des Marketing Control Plane und **nicht** Teil von CRM-light. CRM-light verwaltet später institutionelle Beziehungen und nächste Aktionen; Campaign Analytics bewertet aggregiert, welche Kommunikation welche nachweisbare Wirkung erzielt hat.

## Verbindliche Trennung

### Marketing Analytics

Beantwortet aggregiert:

- Welche Kampagne wurde wo und wann ausgespielt?
- Welches Asset und welche Variante wurden verwendet?
- Welche Zielgruppe und welcher CTA waren adressiert?
- Welche Reichweite, Nutzung und Conversion sind belegt?
- Welche Produktions- und Mediakosten sind zugeordnet?
- Welche Learnings und Folgeentscheidungen ergeben sich?

### CRM-light

Beantwortet später institutionell:

- Mit welcher Organisation besteht eine Beziehung?
- Wer ist intern Owner?
- Welche nächste Aktion ist vereinbart?
- Welcher Gesprächs- oder Angebotsstatus besteht?

Personenbezogene Kontakt-, Gesprächs- oder Beziehungsdaten dürfen nicht in MarketingMetricSnapshots, DistributionRecords oder Kampagnenauswertungen kopiert werden.

## Kanonische Admin-Fläche

```text
/admin/marketing/insights
```

Verknüpfte Read-only-Flächen:

```text
/admin/marketing/campaigns/[campaignId]/insights
/admin/marketing/assets/[assetId]/insights
/admin/marketing/distribution
```

Die erste Analytics-Ausbaustufe erfolgt nach `MARKETING-REGISTRY-READMODEL-01` und bleibt zunächst read-only.

## Auswertungsprinzip

Jede MarketingCampaign definiert vor der Aktivierung:

- genau ein Primärziel,
- genau einen Primary KPI,
- bis zu vier Secondary KPIs,
- mindestens einen Guardrail,
- Messzeitraum,
- Baseline, soweit verfügbar,
- Zielwert oder Entscheidungsschwelle,
- erlaubte Datenquellen,
- Attributionsmodus,
- Reviewtermin.

Eine Kampagne ohne definiertes Ziel und Messkonzept darf nicht als auswertbar oder erfolgreich dargestellt werden.

## Kampagnenziele

Zulässige Zieltypen:

- `awareness` – Bekanntheit und qualifizierte Sichtbarkeit,
- `education` – Verständnis eines Themas oder Produkts,
- `engagement` – bewusste Interaktion mit Content,
- `product_activation` – Einstieg in eine reale Produktaktion,
- `participation` – begonnene oder abgeschlossene legitime Beteiligung,
- `lead_generation` – qualifizierte institutionelle Anfrage,
- `membership` – qualifizierte Membership-Anfrage oder Abschluss,
- `partnership` – qualifiziertes Partnergespräch oder aktive Partnerschaft,
- `event` – Anmeldung, Teilnahme oder definierte Folgeaktion,
- `retention` – wiederkehrende Nutzung eines Content- oder Produktformats.

Kampagnen unterschiedlicher Zieltypen werden nicht über eine pauschale Gesamtpunktzahl gegeneinander ausgespielt.

## Standard-Funnel

Der Marketing-Funnel wird kampagnenspezifisch verkürzt oder erweitert, aber nicht personenbezogen verfolgt:

```text
published
→ qualified_view
→ engaged_view
→ cta_click
→ product_start
→ meaningful_action
→ qualified_inquiry
→ conversion
```

Beispiele für `meaningful_action`:

- Analyse oder Dossier tatsächlich geöffnet,
- Beitrag begonnen,
- Beitrag abgeschlossen,
- Debattenstand gespeichert oder geteilt,
- Membership-Information aufgerufen,
- Partneranfrage begonnen,
- Eventanmeldung abgeschlossen.

`conversion` wird je Kampagne eindeutig definiert. Ein Videoaufruf ist keine Conversion, wenn das Kampagnenziel eine qualifizierte Anfrage ist.

## Kernkennzahlen

### Distribution und Reichweite

- Ausspielungen,
- veröffentlichte Assets,
- Impressionen,
- qualifizierte Reichweite,
- Videoaufrufe,
- erreichte Zielgruppen-/Kanal-Segmente,
- Publikationsabdeckung.

### Nutzung und Qualität

- qualifizierte Views,
- durchschnittliche Wiedergabedauer,
- Video-Completion-Rate,
- Speicherungen,
- Shares,
- Kommentare mit verwertbarem Signal,
- Link-Klicks,
- Landingpage-Interaktionen,
- wiederkehrende Nutzung eines Formats.

### Produktwirkung

- CTA-Klicks auf reale Produktrouten,
- gestartete Produktaktionen,
- abgeschlossene Produktaktionen,
- begonnene oder abgeschlossene Beiträge,
- Dossier-/Debattenstand-Nutzung,
- qualifizierte Membership-Anfragen,
- qualifizierte Partner- oder Demoanfragen.

### Produktion und Effizienz

- Zeit von Opportunity bis Review-ready,
- Zeit von Review-ready bis Veröffentlichung,
- Anzahl Review-Schleifen,
- produzierte Assets je Kampagne,
- wiederverwendete Assets,
- Varianten je Masterasset,
- abgelöste oder nicht verwendete Assets,
- interne Produktionszeit,
- externe Produktionskosten,
- Media Spend,
- Kosten je definiertem Ergebnis.

Geldwerte werden in der Originalwährung gespeichert. Für eDebatte-interne Standardauswertungen ist `EUR` der Default.

## Kampagnen-Scorecard

Jede Kampagne erhält eine Scorecard mit:

- Zieltyp,
- Lifecycle und Readiness,
- Messzeitraum,
- Primary KPI,
- Secondary KPIs,
- Guardrails,
- Baseline,
- Zielwert,
- Ist-Wert,
- Datenqualität,
- Kosten,
- Ergebnisstatus,
- Learnings,
- Entscheidung,
- nächste Aktion.

Ergebnisstatus:

- `insufficient_data`
- `below_threshold`
- `mixed_result`
- `target_met`
- `target_exceeded`
- `invalid_measurement`
- `stopped_for_guardrail`

Entscheidung:

- `keep`
- `improve`
- `scale`
- `pause`
- `stop`
- `reuse_assets`
- `repeat_with_new_audience`
- `needs_more_evidence`

Automatische Erfolgsentscheidungen sind nicht zulässig. Das System kann Schwellen markieren; die finale Entscheidung bleibt reviewpflichtig.

## Kanalbewertung

Kanäle werden anhand ihres Kampagnenziels bewertet, nicht nur anhand der Reichweite.

### Website / eDebatte

- qualifizierte Seitenaufrufe,
- CTA-Klicks,
- gestartete Produktaktionen,
- abgeschlossene Produktaktionen,
- Conversion nach Kampagnenziel.

### LinkedIn

- Impressionen und Reichweite,
- Klicks,
- Saves und Shares,
- qualifizierte Kommentare,
- Anfragen oder Gespräche, soweit aggregiert zuordenbar.

### Instagram / Facebook / TikTok

- Reichweite,
- Wiedergabedauer,
- Completion,
- Saves und Shares,
- Profil- und Linkaktionen,
- qualifizierter Traffic zu eDebatte.

### YouTube

- Views,
- Wiedergabezeit,
- Completion,
- Klicks,
- Abonnentenwirkung nur als Nebenkennzahl,
- Produkt- oder Kampagnenaktionen.

### Newsletter

- gesendet,
- zugestellt,
- Bounces,
- aggregierte Klicks,
- Abmeldungen,
- Zielaktionen.

Open-Tracking ist keine Pflichtkennzahl und darf wegen technischer Ungenauigkeit und Datenschutzrisiken nicht als primärer Erfolgsbeleg verwendet werden.

### Presse, Events und Partnerkanäle

- belegte Veröffentlichungen,
- geschätzte Reichweite nur klar als Schätzung,
- qualifizierte Folgeanfragen,
- Eventanmeldungen,
- Gespräche und Kooperationen in aggregierter Form.

## Attribution

Zulässige Attributionsarten:

- `direct` – Zielaktion trägt einen verifizierten Campaign-/Distribution-Key,
- `assisted` – Zusammenhang ist aggregiert oder manuell plausibilisiert,
- `platform_reported` – Wert stammt aus einem Plattformreport,
- `manual_verified` – Wert wurde mit Evidence manuell bestätigt,
- `unattributed` – Wirkung ist vorhanden, aber nicht seriös zuordenbar.

Nicht zulässig:

- personenbezogene Cross-Channel-Profile,
- Fingerprinting,
- Device Graphs,
- versteckte Tracking-Pixel außerhalb einer separat geprüften Rechtsgrundlage,
- dauerhafte IDs für individuelle politische oder gesellschaftliche Interessen,
- behauptete Kausalität aus bloßer zeitlicher Korrelation.

Campaign- und UTM-Keys dürfen nur Kampagne, Asset, Kanal, Format und freigegebene Zielgruppe abbilden. Sie dürfen keine E-Mail-Adresse, Nutzer-ID, Kontakt-ID oder sensitive Segmentinformation enthalten.

## Datenquellen

Zulässige Quellen:

- bestehende aggregierte eDebatte-Telemetrie,
- Themenradar-Aggregate,
- DistributionRecords,
- verifizierte Plattform-Exports,
- geprüfte Plattform-APIs,
- Newsletter-Aggregate,
- Event-Aggregate,
- manuell verifizierte Evidenz,
- später aggregierte CRM-light-Outcomes ohne Kontaktinhalte.

Jede Quelle benötigt:

- `sourceType`,
- `sourceRef`,
- Zeitraum,
- Erfassungszeitpunkt,
- Datenqualitätsstatus,
- Import- oder Erfassungsmethode,
- Verantwortlichkeit.

Datenqualitätsstatus:

- `verified`
- `partial`
- `estimated`
- `stale`
- `missing`
- `rejected`

Geschätzte Werte müssen sichtbar als `estimated` gekennzeichnet sein und dürfen nicht mit gemessenen Werten addiert werden, sofern keine methodisch belastbare Normalisierung vorliegt.

## Datenschutz und Aggregation

- Analytics speichert keine Rohprofile einzelner Nutzer.
- Keine Anzeige einzelner Nutzerpfade im Marketing Board.
- Keine politischen, weltanschaulichen oder sonst sensiblen Interessenprofile.
- Keine Kontakt- oder Gesprächsnotizen in MetricSnapshots.
- Auswertungen nach Zielgruppe erfolgen nur auf freigegebenen, nicht sensitiven Kampagnensegmenten.
- Kleine Fallzahlen werden nicht unnötig granular dargestellt.
- Für sensible oder potenziell re-identifizierbare Breakdown-Ansichten gilt eine Mindestgruppengröße von `10` Ereignissen oder Kontakten.
- Werte unterhalb der Schwelle werden als `<10`, `suppressed` oder aggregiert angezeigt.

## Speicherung und Retention

### Bestehende Telemetrie

Bestehende kanonische Telemetrie bleibt an ihrem Ursprungsort. Marketing Analytics liest Aggregate und erzeugt keine zweite Raw-Event-Wahrheit.

### Importdateien

- Plattform-CSV oder ähnliche Rohimporte werden nur temporär verarbeitet.
- Nach erfolgreicher Normalisierung und Prüfung werden sie spätestens nach `30 Tagen` gelöscht, sofern keine rechtliche oder auditbezogene Pflicht entgegensteht.
- Fehlerhafte oder abgelehnte Importe werden spätestens nach `14 Tagen` gelöscht.

### Normalisierte Aggregat-Snapshots

- Aufbewahrung grundsätzlich `24 Monate`.
- Danach jährliche oder kampagnenbezogene Verdichtung oder Löschung.
- Langfristige Lessons Learned dürfen ohne personenbezogene Inhalte dauerhaft in der Kampagnendokumentation verbleiben.

### Finanzwerte

Kosten- und Budgetwerte dürfen langfristig im Kampagnenabschluss erhalten bleiben, sofern keine personenbezogenen Abrechnungsdaten enthalten sind.

## Kosten- und Wirtschaftlichkeitslogik

Optional je Kampagne:

- Budget,
- Media Spend,
- externe Produktionskosten,
- interne Zeitkosten als klar gekennzeichnete Kalkulation,
- Gesamtaufwand,
- Cost per Qualified View,
- Cost per CTA Click,
- Cost per Meaningful Action,
- Cost per Qualified Inquiry,
- Cost per Conversion.

ROI oder Revenue Attribution darf nur angezeigt werden, wenn Erlös, Kosten und Attributionsmethode nachvollziehbar belegt sind. Ansonsten lautet die Kennzeichnung `not_available` oder `directional_only`.

## Vergleichslogik

Vergleiche sind nur sinnvoll zwischen:

- gleichen oder eng verwandten Zieltypen,
- ähnlichen Zeiträumen,
- vergleichbaren Zielgruppen,
- vergleichbaren Formaten,
- gleicher oder dokumentiert unterschiedlicher Paid-/Organic-Basis.

Das Dashboard verhindert keine Vergleiche technisch, kennzeichnet aber nicht vergleichbare Kampagnen sichtbar.

## BI-Ansichten

### Executive Overview

- aktive Kampagnen,
- Primärzielstatus,
- größte positive und negative Abweichungen,
- Kosten und Ergebnisse,
- Datenqualitätswarnungen,
- Entscheidungen und nächste Aktionen.

### Campaign Scorecards

- Ziel, KPI, Funnel, Kosten, Ergebnis, Learnings,
- Verlauf über Kampagnenzeitraum,
- Kanal- und Assetbeiträge,
- Guardrail-Verletzungen.

### Channel Performance

- Kampagnen und Ergebnisse je Kanal,
- organisch versus bezahlt,
- Qualitäts- und Conversion-Kennzahlen,
- keine pauschale Rangliste nur nach Reichweite.

### Asset Performance

- Masterasset und Varianten,
- Version, Locale und BrandProfile,
- Verwendung je Kanal,
- Completion, Klicks und Zielaktionen,
- Wiederverwendung und Produktionsaufwand.

### Content Series

- Entwicklung wiederkehrender Serien,
- Stabilität der Ergebnisse,
- Ermüdung oder Verbesserung,
- Empfehlungen für Fortführung und Anpassung.

### Data Quality

- fehlende Quellen,
- veraltete Snapshots,
- geschätzte Werte,
- unterdrückte Kleingruppen,
- nicht belegte Distribution.

## Schema-Folgeänderung

Das bestehende `MarketingMetricSnapshot`-Modell bleibt Grundlage. Ein technischer Folge-Slice darf das Schema versioniert erweitern um:

- `objectiveType`,
- `metricDefinitions`,
- `primaryKpi`,
- `secondaryKpis`,
- `guardrails`,
- `baseline`,
- `target`,
- `currency`,
- `costs`,
- `attributionType`,
- `dataQuality`,
- `resultStatus`,
- `decision`,
- `learningRefs`.

Eine Schemaänderung erfolgt mit Versionsanhebung, Migration/Kompatibilitätsprüfung und fokussierten Contract-Tests.

## Umsetzungsslices

### Slice 1 – Analytics Readmodel und Scorecards

Status nach `MARKETING-REGISTRY-READMODEL-01`: `codex_ready`

- Kampagnenziele und KPI-Definitionen typisieren,
- Scorecard-Readmodel,
- bestehende aggregierte Werte und DistributionRecords lesen,
- `/admin/marketing/insights` read-only,
- Datenqualitätskennzeichnung,
- keine Import- oder Schreiblogik.

### Slice 2 – Manual Aggregate Import

Status: `blocked`

- kontrollierter Upload verifizierter Plattform-Aggregate,
- Parser und Preview,
- Review vor Commit,
- Audit,
- temporäre Rohdatei-Retention,
- keine personenbezogenen Daten.

### Slice 3 – Provider Adapter

Status: `blocked`

- APIs für freigegebene Kanäle,
- Credential-Governance,
- Pull-only Aggregate,
- kein Publishing,
- Rate-Limit-, Fehler- und Auditlogik.

### Slice 4 – Cost and Outcome Integration

Status: `blocked`

- Budget und Kosten,
- aggregierte qualifizierte Anfragen und Outcomes,
- CRM-light nur über aggregierte Referenzen,
- keine Kontaktinhalte im Analytics-Modell.

## Acceptance Criteria

- Kampagnen können anhand eines definierten Ziels und Primary KPI bewertet werden.
- Reichweite ist nie alleiniger Erfolgsscore.
- Campaign-, Asset-, Channel- und Distribution-Auswertung sind getrennt möglich.
- Funnel-Stufen sind kampagnenspezifisch und aggregiert.
- Kosten und Ergebnisse werden nur mit belegter Quelle angezeigt.
- Datenqualität und Messlücken sind sichtbar.
- CRM-light und Analytics bleiben getrennte Datenbereiche.
- Keine personenbezogenen Click- oder Interessenprofile entstehen.
- Keine automatische Erfolgs-, Budget- oder Publishingentscheidung.
- Lessons Learned und nächste Aktionen werden pro Kampagne dokumentiert.

## Entscheidung

Marketingkampagnen benötigen eine eigene BI-/Analytics-Schicht im Marketing Control Plane. Sie wird unabhängig vom CRM-light umgesetzt und nutzt `DistributionRecord` plus aggregierte `MarketingMetricSnapshot`-Werte als kanonische Grundlage.

Der erste technische Analytics-Slice wird erst nach dem read-only Registry-Board gestartet. Er bleibt ebenfalls read-only und verwendet ausschließlich bereits vorhandene oder manuell verifizierte Aggregate. Plattformimporte, Credentials, CRM-Outcomes und Kostenintegration folgen in getrennten, auditierbaren Slices.