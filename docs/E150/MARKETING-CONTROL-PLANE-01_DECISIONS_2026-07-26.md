# MARKETING-CONTROL-PLANE-01 Decisions

Datum: `2026-07-26`

Status: `decision_closed / implementation_split`

Typ: `docs_only / no_product_implementation`

## 1. Entscheidung

Das Marketing Control Plane wird als eigenständige, 2FA-geschützte Admin-Arbeitsfläche unter `/admin/marketing` umgesetzt.

Es ist kein neues Voll-CRM, keine zweite Campaign-Runtime, keine neue Analytics-Plattform und kein Social-Autopublisher. Es verbindet vorhandene eDebatte-Wahrheiten und macht Marketingfähigkeit, Kampagnen, Assets, Brandprofile, belegte Distribution und aggregierte Wirkung operativ sichtbar.

Die erste technische Ausbaustufe ist ausdrücklich **read-only**.

## 2. Kanonische Abgrenzung

- `/admin/themenradar` bleibt Quelle für Themen-, Content- und Entwicklungschancen.
- `/admin/campaigns` bleibt die Admin-Fläche für Beteiligungskampagnen des Produkts.
- `/admin/marketing` steuert externe Produkt-, Content-, Sales-, Partner- und Membership-Kommunikation.
- `Campaign` bleibt das bestehende Beteiligungsmodell.
- `MarketingCampaign` ist das getrennte Kommunikationsmodell.
- Verbindungen erfolgen nur über explizite Referenzen wie `sourceCampaignId`, `themenradarItemId`, `featureRef`, `routeRef`, `dossierRef` oder `evidenceRef`.
- Ein Merge, ein Themenradar-Status oder ein Share-ready-Status erzeugt niemals automatisch Marketingfreigabe oder Veröffentlichung.

## 3. Informationsarchitektur

Kanonischer Einstieg:

```text
/admin/marketing
```

Kanonische Zielstruktur:

```text
/admin/marketing
├── opportunities
├── campaigns
├── assets
├── distribution
├── insights
├── relationships
├── brands
└── settings
```

### Ausbaustufe 1: read-only

Freigegeben für den ersten technischen Slice:

- Übersicht
- Opportunities
- Campaigns
- Assets
- Brands
- Blocker und Evidence
- belegte Distribution als reine Anzeige, sofern Records vorhanden sind

Nicht freigegeben in Ausbaustufe 1:

- Mutationen
- Kontaktpflege
- Social-Credentials
- Scheduling oder Posting
- Asset-Upload
- Approval-Aktionen
- BI-Import
- CRM-Schreiblogik

### Spätere Ausbaustufen

- Lifecycle- und Review-Aktionen
- manuelle Distributionserfassung
- aggregierte Insights
- CRM-light
- kontrollierte Export- und White-Label-Flows
- kanalbezogene Distribution erst nach eigenem Security- und Credential-Contract

## 4. Zugriff, Rollen und 2FA

Alle Pfade unter `/admin/marketing/**` verwenden den bestehenden Admin-Gate:

- gültige Session,
- Rolle `admin` oder `superadmin`,
- eingerichtete beziehungsweise geschützte 2FA,
- fail-closed bei fehlender Session, Rolle oder 2FA.

Es werden keine neuen globalen Nutzerrollen eingeführt.

Feingranulare Fähigkeiten werden als Capability-Vertrag vorbereitet:

- `marketing_view`
- `marketing_edit`
- `marketing_review`
- `marketing_approve`
- `marketing_distribute`
- `marketing_insights_view`
- `marketing_relationships_manage`
- `marketing_brand_manage`

### Initiale Zuordnung

Für Ausbaustufe 1 gilt:

- `admin`: `marketing_view`, `marketing_insights_view`
- `superadmin`: `marketing_view`, `marketing_insights_view`

Alle Schreibfähigkeiten bleiben deaktiviert.

Für spätere Ausbaustufen gilt als Mindestgrenze:

- Bearbeitung und Review dürfen getrennt vergeben werden.
- Approval darf nicht automatisch aus Edit-Rechten folgen.
- Distribution verlangt `marketing_distribute` plus frische geschützte 2FA-Session.
- BrandProfile-Freigaben und Rechts-/Betreiberwechsel verlangen `marketing_brand_manage` und Superadmin-Bestätigung.
- Keine Person darf eine eigene nicht reviewte Änderung allein von Entwurf bis Veröffentlichung durchschleusen.

## 5. Daten- und Ownership-Modell

Kanonische Objekte:

- `MarketingOpportunity`
- `MarketingCampaign`
- `MarketingAsset`
- `DistributionRecord`
- `MarketingMetricSnapshot`
- `MarketingRelationship`
- `BrandProfile`

### Ausbaustufe 1

Die erste Registry ist serverseitig, repo-backed und read-only.

Sie darf ausschließlich aus versionierten oder bereits kanonischen Quellen lesen:

- `docs/marketing/**`
- `docs/E150/**`-Evidence
- freigegebene BrandProfile
- bestehende Themenradar-Readmodels
- bestehende Campaign-Readmodels
- explizite Feature-, Route-, Dossier- und PR-Evidence
- vorhandene DistributionRecords

Es gibt in Ausbaustufe 1 keine neue Datenbank-Collection und keinen Admin-Schreibpfad.

### Spätere Persistenz

Eine writable Registry darf erst nach einem eigenen Persistenz- und Migration-Slice entstehen. Dann gilt:

- Core-Objekte bleiben im Core-Store.
- Personenbezogene Kontaktdaten bleiben im PII-Store.
- Core-Datensätze speichern nur sichere `contactRef`- oder `organizationRef`-Referenzen.
- Keine E-Mail-Adresse, Telefonnummer oder freie Gesprächsnotiz wird in öffentlichen Assets, `public`, Telemetrie oder Core-Marketingexporten gespeichert.
- Audit und Datenherkunft sind verpflichtend.

## 6. Marketingfähigkeit

Jede Opportunity besitzt genau einen Status:

- `not_marketable`
- `concept_only`
- `preview_only`
- `proof_required`
- `review_ready`
- `publicly_marketable`
- `retired`

`publicly_marketable` verlangt mindestens:

- reale Funktion oder klar abgegrenzten realen Inhalt,
- reale Route oder realen Zielpfad,
- zulässige und belegte Aussage,
- freigegebenes BrandProfile,
- geklärten CTA,
- geklärten Quellen-, Governance-, Sprach-, Privacy- und Rechtsstatus,
- Review-Evidence.

## 7. Campaign- und Asset-Lifecycle

Kanonischer MarketingCampaign-Lifecycle:

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

Zusatzstatus:

- `blocked`
- `paused`
- `cancelled`

Kanonischer Asset-Lifecycle:

```text
draft
→ review_ready
→ approved
→ distributed
→ superseded
→ retired
```

Regeln:

- `approved` bedeutet freigegeben, nicht veröffentlicht.
- `scheduled` bedeutet vorgemerkt, nicht veröffentlicht.
- `active` oder `distributed` verlangt mindestens einen `DistributionRecord`.
- Veröffentlichte Records werden nicht rückwirkend überschrieben; Korrekturen erzeugen neue Versionen oder Korrektur-Records.
- Jedes Asset ist an eine unveränderliche BrandProfile-Version gebunden.
- Ablösung, Rückzug und Archivierung bleiben nachvollziehbar.

## 8. Distribution

### Freigabe jetzt

Zulässig ist zunächst ausschließlich:

- manuelle Veröffentlichung außerhalb von eDebatte,
- anschließende manuelle oder repo-basierte Erfassung eines `DistributionRecord`,
- Anzeige der belegten Ausspielung im Admin Board.

### Nicht freigegeben

- Auto-Publish
- automatische Cross-Posting-Ketten
- Credential-Speicherung im Marketing-Registry-Slice
- Hintergrundposting
- Veröffentlichung allein aufgrund von `approved`
- Review-Bypass

### Später zulässige Kanäle

Nach kanalbezogenem Security-Contract grundsätzlich möglich:

- eigene Website und Landingpages
- LinkedIn
- Instagram
- TikTok
- YouTube
- Facebook
- Newsletter/E-Mail
- Presse- und Partnerdistribution

Jeder Adapter benötigt separat:

- Credential-Ownership,
- Berechtigungsumfang,
- Rotation und Widerruf,
- Audit,
- Fehler- und Retry-Verhalten,
- manuellen Final-Review,
- externen Post-Identifier und Ziel-URL.

## 9. BI und Attribution

BI bleibt aggregiert und datensparsam.

Erlaubt:

- Kampagne, Asset, Kanal, Zielgruppe, Locale und Zeitraum,
- qualifizierte Seitenaufrufe,
- Videoabschlüsse,
- Shares und Speicherungen, soweit aggregiert verfügbar,
- Produktklicks,
- begonnene und abgeschlossene Produktaktionen,
- qualifizierte Kontakt-, Membership- oder Partneranfragen,
- manuell dokumentierte Learnings,
- UTM-Felder `source`, `medium`, `campaign`, `content` ohne Personenkennung.

Nicht erlaubt:

- individuelle Click-Profile,
- Fingerprinting,
- personenbezogene UTM-Werte,
- Tracking-Pixel ohne gesonderte rechtliche und Consent-Freigabe,
- Third-Party-Profilbildung,
- Import kompletter Nutzer- oder Followerlisten,
- Verbindung von Marketingmetriken mit Abstimmungs-, Mitglieds- oder sensiblen Beteiligungsprofilen.

Retention:

- rohe externe Importpayloads: maximal 30 Tage,
- normalisierte Tages-/Kampagnenaggregate: maximal 24 Monate,
- danach nur Jahres- oder Lifetime-Aggregate ohne Rückschluss auf Personen,
- Distribution- und Asset-Evidence bleibt solange erhalten, wie sie für Nachvollziehbarkeit, Recht, Audit oder aktive Kommunikation benötigt wird.

## 10. CRM-light

CRM-light dient ausschließlich qualifizierten institutionellen Beziehungen und realen Anfragen.

Erlaubte Beziehungstypen:

- Kommune
- Medium
- Wissenschaft
- Technologie
- Bildung
- Community/NGO
- Förderung
- Unternehmen/Verband
- öffentlicher Auftraggeber

Kanonische Pipeline:

```text
discovered
→ qualified
→ contact_ready
→ contacted
→ conversation
→ proposal
→ decision
→ active_relationship
```

Zusatzstatus:

- `waiting`
- `not_now`
- `closed_lost`
- `inactive`

Pflichtfelder vor Kontaktaufnahme:

- Organisation oder institutioneller Kontext,
- Owner,
- dokumentierter Zweck,
- Rechtsgrundlagenstatus,
- zulässiger Kontaktweg,
- nächste Aktion,
- Retention-Datum.

Zulässige Rechtsgrundlagenstatus:

- `consent`
- `existing_relationship`
- `documented_legitimate_interest`
- `legal_review_required`

`legal_review_required` blockiert Kontaktaufnahme.

Verboten:

- private Massenkontaktlisten,
- Kauf oder Import ungeprüfter Adressbestände,
- sensible politische, gesundheitliche oder persönliche Profilnotizen,
- Speicherung kompletter E-Mail-Verläufe im Marketing-Core-Store,
- automatisiertes Outreach ohne gesonderten Contract,
- Vermischung mit Nutzer-, Abstimmungs- oder Membership-Profilen.

Operative Retention-Defaults, vorbehaltlich Rechtsprüfung:

- nur entdeckt, kein zulässiger Kontakt: 90 Tage,
- kontaktiert ohne Reaktion: 180 Tage,
- `closed_lost` oder `not_now`: 180 Tage, danach löschen oder erneut rechtlich qualifizieren,
- aktive Beziehung: nach Vertrags-, Förder- oder Kooperationspflichten und gesondertem Retention-Contract,
- Widerspruch oder Widerruf: sofortige Verarbeitungssperre; nur minimaler Sperrnachweis, soweit rechtlich erforderlich.

CRM-light bleibt bis zu einem eigenen Privacy-/Retention-Slice ohne Schreibpfad.

## 11. White-Label und Co-Branding

White-Label wird ausschließlich über versionierte `BrandProfile` gesteuert.

Veränderbar nach Freigabe:

- Absendername,
- Logos,
- kontrollierte Akzentfarben,
- Kontakt- und Rechtsziele,
- CTA-Ziele,
- Cover-, Endframe- und Exportvarianten,
- Locale und Co-Branding.

Unveränderlich:

- Quellenstatus,
- Original- und Übersetzungskennzeichnung,
- Gegenpositionen und offene Fragen,
- Review und Audit,
- Privacy- und Governance-Grenzen,
- Betreiber- und Verantwortlichkeitstransparenz,
- kein Auto-Publish,
- keine erfundenen Partner, Ergebnisse oder Kennzahlen.

Ein BrandProfile darf erst `approved` werden, wenn Logos, Kontrast, Domain, Kontakt, Impressum/Datenschutz, Betreiberrolle und verantwortliche Person beziehungsweise Organisation geprüft sind.

## 12. Folge-Slices

### A. `MARKETING-REGISTRY-READMODEL-01`

Status nach Merge dieses Decision-Contracts: `codex_ready`

Scope:

- serverseitige repo-backed Registry,
- TypeScript-/Zod-Contracts,
- read-only `/admin/marketing`,
- Übersicht, Opportunities, Campaigns, Assets, Brands und Blocker,
- Admin-/2FA-Gate,
- keine Mutationen, keine DB-Migration, kein CRM, kein Publishing.

### B. `MARKETING-LIFECYCLE-02`

Status: `blocked`

Abhängigkeit: Registry-Readmodel und Capability-Implementation.

### C. `MARKETING-DISTRIBUTION-INSIGHTS-03`

Status: `blocked`

Abhängigkeit: kanalbezogener Security-, Credential-, Attribution- und Privacy-Contract.

### D. `MARKETING-CRM-LIGHT-04`

Status: `blocked`

Abhängigkeit: Rechtsgrundlage, PII-Modell, Retention, Export und Löschung.

### E. `MARKETING-WHITELABEL-EXPORT-05`

Status: `blocked`

Abhängigkeit: BrandProfile-Approval, Betreiber-/Rechtsangaben und Export-Contract.

## 13. Freigabeentscheidung

Mit diesem Contract ist ausschließlich `MARKETING-REGISTRY-READMODEL-01` technisch freigegeben.

Nicht freigegeben sind:

- Schreibfunktionen,
- CRM-light,
- Social-Credentials,
- Distribution,
- Posting,
- personenbezogene Telemetrie,
- Datenbankmigrationen,
- Membership-, Partner-, Pricing- oder Governanceänderungen.

## 14. Acceptance Criteria

- [x] Route und Informationsarchitektur entschieden.
- [x] Abgrenzung zu Themenradar und Beteiligungskampagnen entschieden.
- [x] Admin-/2FA-Gate entschieden.
- [x] Capability-Modell und initiale Zuordnung entschieden.
- [x] read-only Startumfang entschieden.
- [x] Datenobjekte, Ownership und PII-Grenze entschieden.
- [x] Opportunity-, Campaign- und Asset-Lifecycle entschieden.
- [x] BI-, Attribution- und Retention-Grenzen entschieden.
- [x] CRM-light-Scope und Blocker entschieden.
- [x] Distribution- und Credential-Grenzen entschieden.
- [x] White-Label-Verantwortung entschieden.
- [x] Folge-Slices kollisionsfrei zerlegt.
- [x] genau ein technischer Slice auf `codex_ready` freigegeben.
