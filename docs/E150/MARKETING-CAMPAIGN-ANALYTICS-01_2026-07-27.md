# MARKETING-CAMPAIGN-ANALYTICS-01

Stand: 2026-07-27  
Status: `review`

## Ziel

`/admin/marketing` ist kein Materialarchiv, sondern die zentrale read-only Steuerungs- und Controllingfläche für geplante und veröffentlichte Marketingmaßnahmen nach B2C, B2B und B2G.

Die Fläche verbindet:

- Kampagnenplanung,
- konkrete Posts, Videos und Kanalvarianten,
- interne und externe Ausspielungen,
- organische und bezahlte Reichweite,
- interne eDebatte-Nutzung,
- Social-, E-Mail-, Download- und Ads-Performance,
- Datenqualität,
- Plattform- und Reichweitenempfehlungen.

## Umgesetzt

### Kampagnenprofile

Für alle 13 kanonischen `MarketingCampaign`s existiert ein typisiertes Control-Profil mit:

- Hauptsegment `b2c`, `b2b` oder `b2g`,
- optionalen weiteren Segmenten,
- verständlichen Zielgruppen,
- Regionen,
- Reichweitenraum `local`, `regional`, `national` oder `international`,
- Ziel- und Originalsprachen,
- organischer, bezahlter oder gemischter Planung,
- geplanten internen und externen Kanälen,
- Kampagnenziel,
- Primary KPI,
- bis zu vier Secondary KPIs,
- optionalem Reporting-Zeitraum.

### Performance-Contract

`MarketingMetricSnapshot` führt:

- Kampagne, Content und DistributionRecord,
- interne, Social-, E-Mail-, Download-, Ads- oder manuelle Quelle,
- Provider und Referenz,
- Kanal,
- B2C/B2B/B2G,
- Region und Reichweitenraum,
- Sprache,
- organisch/bezahlt,
- Messzeitraum und Erfassungszeit,
- Attribution und Confidence,
- Datenqualität,
- konkrete Metrikwerte.

Snapshots ohne Messwert oder mit ungültigem Zeitraum werden abgewiesen.

### Betreiberübersicht

`/admin/marketing` zeigt jetzt:

- Filter nach B2C, B2B und B2G,
- Filter nach lokal, regional, national und international,
- Kampagnenanzahl,
- konkrete Posts und Videos,
- eingeplante Inhalte,
- real veröffentlichte Inhalte,
- Kampagnen mit Performance-Daten,
- Kampagnenportfolio mit Zielgruppe, Reichweite, Kanälen, Ziel und Primary KPI,
- gestreute interne und externe Beiträge,
- Datenquellenstatus für eDebatte, Social, E-Mail, Downloads und Ads,
- eine ehrliche Empfehlung bei fehlender Evidenz.

Material- und Templatekarten wurden aus der Hauptsteuerung entfernt. Assets bleiben Unterelemente einer Kampagne.

### Performance-Ansicht

`/admin/marketing/insights` zeigt:

- Kampagnen-Scorecards,
- Datenquellenabdeckung,
- Snapshot- und Veröffentlichungsstatus,
- Primary KPI und Datenqualität,
- Plattform- und Reichweitenintelligenz erst nach realer Datenbasis.

Es werden keine Nullwerte als Misserfolg und keine fehlenden Daten als gemessene Performance dargestellt.

## Ist-Datenlage

Zum Stand dieses Slices:

- 13 Kampagnenprofile,
- 2 konkrete Content-Operations-Einträge,
- 0 eingeplante Inhalte,
- 0 belegte Veröffentlichungen,
- 0 Metric Snapshots,
- 0 verbundene Performance-Datenarten.

Diese Werte sind keine Demo-Ergebnisse, sondern der tatsächliche repo-backed Stand.

## Abhängiger Folgeslice

`MARKETING-PERFORMANCE-INGESTION-02` / Issue #471 bleibt `manual_gate`.

Dort werden Provider, Credentials, API-/CSV-Import, Datenfelder, Retention, Geografie, Freshness, Attribution und Idempotenz für:

- interne eDebatte-Metriken,
- Social-Plattformen,
- E-Mail und Newsletter,
- Downloads,
- bezahlte Werbung

entschieden und umgesetzt.

## Guardrails

- kein Auto-Publish,
- keine Provider-Credentials in diesem Slice,
- keine API- oder CSV-Imports,
- keine erfundenen Likes, Shares, Saves, Opens, Downloads, Kosten oder Conversions,
- keine personenbezogenen politischen oder Interessenprofile,
- keine Cross-Device-Personenprofile,
- keine automatische Budgetänderung,
- keine autonome Plattformempfehlung ohne Evidenz,
- keine Änderungen an `/create`, `/runden`, `/dossier`, Root-Layouts, Tokens oder Shared Components.

## Geänderte Dateien

- `apps/web/src/features/marketing/campaignControl/contracts.ts`
- `apps/web/src/features/marketing/campaignControl/data.ts`
- `apps/web/src/features/marketing/campaignControl/readModel.ts`
- `apps/web/src/app/admin/marketing/page.tsx`
- `apps/web/src/app/admin/marketing/insights/page.tsx`
- `apps/web/tests/marketing-campaign-control.contract.test.ts`
- `apps/web/tests/admin-marketing.page.test.tsx`
- `apps/web/tests/admin-marketing-insights.page.test.tsx`
- `apps/web/package.json`
- diese Evidenz

## Abnahme

Der Slice bleibt bis zu grüner CI und Produkt-Sichtprüfung auf `review`. `MARKETING-PERFORMANCE-INGESTION-02` bleibt vor Provider- und Datenschutzentscheidungen blockiert.
