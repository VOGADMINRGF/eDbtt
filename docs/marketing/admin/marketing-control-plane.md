# Marketing Control Plane

Status: `product_contract / implementation_not_started`

## Zweck

Das Marketing Control Plane übersetzt die versionierten Marketing-Quellen aus `docs/marketing/**` in eine steuerbare Admin-Arbeitsfläche. Markdown bleibt die nachvollziehbare fachliche Quelle; das Admin Board übernimmt Status, Zuständigkeiten, Freigaben, Ausspielung und Auswertung.

Es entsteht keine zweite Kampagnen-, Content-, CRM- oder Telemetrie-Wahrheit. Bestehende eDebatte-Bausteine werden verbunden:

- `/admin/themenradar` für neue Themen, Features und Content-Chancen,
- `/admin/campaigns` für Beteiligungskampagnen,
- bestehende Review-, Audit- und Share-ready-Contracts,
- aggregierte Themenradar-Telemetrie,
- Organisationen, Accounts und Rollen,
- `docs/marketing/**` als Messaging-, Vorlagen- und Kampagnenquelle.

## Empfehlung

Die Idee wird **nicht verworfen**. Sie ist die richtige operative Ergänzung zum dokumentationsstarken Ansatz, sollte aber als kontrollierte Erweiterung der vorhandenen Admin- und Themenradar-Architektur umgesetzt werden.

Empfohlen wird:

- ein gemeinsames Marketing Board,
- eine kleine aggregierte BI-Schicht,
- CRM-light für institutionelle Beziehungen,
- keine zweite allgemeine CRM-Plattform,
- keine neue Trackingwelt,
- keine automatische Veröffentlichung.

## Wichtige Begriffstrennung

`Campaign` bezeichnet im bestehenden Produkt Beteiligungskampagnen. Marketingkampagnen dürfen dieses Modell, seine Routen oder Semantik nicht überladen.

Deshalb gilt:

- Beteiligung: `Campaign` unter `/admin/campaigns`
- Kommunikation: `MarketingCampaign` unter `/admin/marketing/campaigns`
- Verbindung nur über explizite Referenzen wie `sourceCampaignId`, `featureRef` oder `themenradarItemId`

## Empfohlene Admin-Informationsarchitektur

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

### `/admin/marketing`

Executive-Übersicht mit:

- neuen Produkt- und Content-Chancen,
- Kampagnen nach Status,
- Assets in Produktion und Review,
- geplanten und erfolgten Ausspielungen,
- Blockern und offenen Entscheidungen,
- aggregierten Ergebnissen,
- nächsten vertrieblichen oder partnerschaftlichen Aktionen.

### `/admin/marketing/opportunities`

Erfasst, was vermarktet werden könnte:

- gemergte oder reviewte Produktfunktion,
- neuer Debattenstand,
- Dossier- oder Quellenentwicklung,
- Themenradar-Kandidat,
- neue Zielgruppenlösung,
- Partner- oder Membership-Anlass,
- wiederverwendbares Content-Format.

Jede Chance muss Produktstatus, Evidence und zulässige Aussagen kennen. Eine neue Funktion wird nicht automatisch vermarktet.

### `/admin/marketing/campaigns`

Steuert MarketingCampaigns von der Idee bis zur Auswertung:

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

Zusätzliche Zustände:

- `blocked`
- `paused`
- `cancelled`

Blocker werden separat geführt, zum Beispiel:

- Produktbeleg fehlt,
- Governanceentscheidung offen,
- Route oder CTA fehlt,
- Rechtstext fehlt,
- Übersetzung ungeprüft,
- Asset oder Freigabe fehlt.

### `/admin/marketing/assets`

Inventar für:

- Onepager,
- Pitchdecks,
- Landingpage-Copy,
- Carousels,
- Social-Motive,
- Video-Scripts,
- Mastervideos und Formatvarianten,
- Presse- und Partnerunterlagen.

Ein Asset kennt Version, Brandprofil, Zielgruppe, Kampagne, Sprache, Freigabestatus, Quelldatei, Exportpfad und Ablösung.

### `/admin/marketing/distribution`

Dokumentiert, was tatsächlich ausgespielt wurde:

- Kanal,
- Account oder Publisher,
- Asset-Version,
- geplanter und tatsächlicher Zeitpunkt,
- externer Post-/Publikations-Identifier,
- Ziel-URL und UTM-/Kampagnenreferenz,
- Status,
- freigebende Person,
- Ergebnis-Snapshot.

Es gibt keinen Auto-Publish-Bypass. Externe Veröffentlichung bleibt review- und rechtegebunden.

### `/admin/marketing/insights`

BI-Ansicht auf aggregierter Ebene:

- Kampagnenfortschritt,
- produzierte und genutzte Assets,
- Ausspielungen nach Kanal und Zielgruppe,
- qualifizierte Aufrufe,
- Videoabschlüsse,
- Speicherungen und Shares, soweit datenschutzkonform verfügbar,
- Produktklicks,
- Leads,
- Membership-Anfragen,
- Partnergespräche,
- Conversion zwischen definierten Funnel-Stufen,
- qualitative Learnings.

Reichweite allein gilt nicht als Erfolg. Personenbezogene Click-Profile, Tracking-Pixel und Third-Party-Profilbildung sind nicht Teil dieses Contracts.

### `/admin/marketing/relationships`

CRM-light für institutionelle Beziehungen und qualifizierte Anfragen. Kein paralleles Voll-CRM.

Mögliche Pipeline:

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

Zusätzliche Zustände:

- `waiting`
- `not_now`
- `closed_lost`
- `inactive`

Die Oberfläche referenziert nach Möglichkeit bestehende Organisationen, Accounts und sichere Kontaktobjekte. Keine E-Mail-Adressen, Telefonnummern oder Gesprächsnotizen in `public` oder frei ausgelieferten Marketingdateien.

### `/admin/marketing/brands`

Steuert eDebatte-, VoiceOpenGov-, Co-Branding- und freigegebene White-Label-Profile. Das dazugehörige Contract-Dokument liegt unter:

- `docs/marketing/white-label/brand-profile-contract.md`

## Feature-to-Marketing-Workflow

```text
Produktänderung / PR / Themenentwicklung
→ Evidence prüfen
→ MarketingOpportunity anlegen
→ Marketingfähigkeit klassifizieren
→ Zielgruppe und Botschaft auswählen
→ MarketingCampaign oder Einzelasset erzeugen
→ Review
→ Freigabe
→ DistributionRecord
→ aggregierte Auswertung
→ Learning und Wiederverwendung
```

## Marketingfähigkeit einer Funktion

Jede Produktfunktion erhält genau eine Einstufung:

- `not_marketable` – intern, unsicher oder nicht freigegeben
- `concept_only` – als Vision oder Konzept kommunizierbar
- `preview_only` – nur als eindeutig markierte Vorschau
- `proof_required` – Produktbeleg oder Smoke fehlt
- `review_ready` – Aussagen und Assets fachlich prüfbar
- `publicly_marketable` – reale Funktion, reale Route und zulässiger CTA belegt
- `retired` – nicht mehr vermarkten

Diese Einstufung ist kein automatischer Rückschluss aus einem Merge. Sie braucht Evidence und Review.

## Datenobjekte

Die maschinenlesbare Ziel-Shape liegt in:

- `docs/marketing/schemas/marketing-control-plane.schema.json`

Kernobjekte:

- `MarketingOpportunity`
- `MarketingCampaign`
- `MarketingAsset`
- `DistributionRecord`
- `MarketingMetricSnapshot`
- `MarketingRelationship`
- `BrandProfile`

## Anbindung an bestehende Themenradar-Wahrheit

Bestehende `ThemenradarItem`-Felder wie `campaignKey`, `shareContractSnapshot`, `telemetrySnapshot`, Review-Guardrails und Audit-Version bleiben kanonisch.

Das Marketing Control Plane darf:

- ein Themenradar-Item referenzieren,
- aus einem reviewfähigen Item eine MarketingOpportunity ableiten,
- `campaignKey` kontrolliert einem MarketingCampaign-Key zuordnen,
- aggregierte `clicks`, `leads` und `memberships` einlesen,
- auf den bestehenden Audit- und Share-ready-Status verweisen.

Es darf nicht:

- Themenradar-Lifecycle still überschreiben,
- `autoPostEligible=false` umgehen,
- Share-ready mit veröffentlicht verwechseln,
- die bestehende Audit-Spur duplizieren,
- personenbezogene Telemetrie hinzufügen.

## Rollen und Freigaben

Empfohlene Fähigkeiten:

- `marketing_view`
- `marketing_edit`
- `marketing_review`
- `marketing_approve`
- `marketing_distribute`
- `marketing_insights_view`
- `marketing_relationships_manage`
- `marketing_brand_manage`

Diese Fähigkeiten sind keine neuen globalen Rollen. Sie sollen in das vorhandene Rollen- und Permission-System eingebunden werden. Admin, Editor, Reviewer, Partner oder Mitglied erhalten daraus keine automatischen Rechte.

## Dashboard-Kennzahlen

### Operativ

- offene Opportunities,
- Opportunities ohne Owner,
- Kampagnen je Lifecycle,
- überfällige Reviews,
- Assets ohne Export,
- freigegebene, aber noch nicht ausgespielte Assets,
- Ausspielungen der nächsten sieben Tage,
- blockierte Kampagnen nach Grund.

### Wirkung

- qualifizierte Zielseitenaufrufe,
- Asset-Nutzung je Kanal,
- Engagement-Qualität,
- begonnene Produktaktionen,
- qualifizierte Anfragen,
- Partner- und Membership-Gespräche,
- Conversion je definierter Funnel-Stufe,
- wiederkehrende Content-Formate,
- manuell dokumentierte Learnings.

## Privacy- und Governance-Grenzen

- keine Tracking-Orgie,
- keine individuellen Verhaltensprofile,
- keine sensiblen Gesprächsinhalte in Marketingtelemetrie,
- keine Partner-Sonderrechte,
- keine gekauften Fakten-, Ranking- oder Sichtbarkeitsvorteile,
- keine automatische Veröffentlichung,
- keine Mehrheit als objektive Wahrheit,
- keine Vermischung von eDebatte-Content und offizieller VoiceOpenGov-Position.

## Umsetzungsschnitt

### Slice A – Registry und Readmodel

Status: `blocked_by_decision_contract`

- serverseitige Marketing-Registry,
- Zod-/TypeScript-Contracts aus dem Schema,
- read-only Admin-Übersicht,
- Referenzen auf Themenradar, PR-/Feature-Evidence und bestehende Kampagnen,
- keine Distribution oder CRM-Schreiblogik.

### Slice B – Campaign- und Asset-Lifecycle

Status: `needs_decision`

- Lifecycle-Aktionen,
- Review-/Approval-Rechte,
- Brandprofil-Auswahl,
- Asset-Versionierung,
- Export- und Ablösungslogik.

### Slice C – Distribution und Insights

Status: `needs_decision`

- erlaubte externe Kanäle,
- Credential- und Rechteverwaltung,
- Import externer Ergebniswerte,
- UTM-/Attributionsregeln,
- Retention und Privacy.

### Slice D – CRM-light

Status: `needs_decision`

- Kontakt- und Organisationsreferenz,
- Consent-/Rechtsgrundlage,
- Owner und nächste Aktion,
- Datenaufbewahrung,
- Export-/Löschregeln,
- Abgrenzung zu einem externen CRM.

## Acceptance Criteria für das Zielbild

- neue Features und Themen können als MarketingOpportunity sichtbar werden, ohne automatisch veröffentlicht zu werden,
- Marketingfähigkeit und Evidence sind pro Opportunity nachvollziehbar,
- jede Kampagne hat Owner, Zielgruppe, CTA, Lifecycle, Blocker und Reviewstatus,
- jedes Asset ist versioniert und einem Brandprofil zugeordnet,
- jede reale Ausspielung ist als DistributionRecord dokumentiert,
- Insights arbeiten aggregiert und ohne individuelle Click-Profile,
- Beteiligungskampagnen und MarketingCampaigns bleiben getrennte Modelle,
- Themenradar- und Share-ready-Guardrails bleiben unverändert wirksam,
- White-Labeling verändert Gestaltung und Absender, aber niemals Quellen-, Review-, Audit-, Privacy- oder Governance-Wahrheit.

## Statusentscheidung

- Dokumentations-Foundation: `review`
- Control-Plane-Implementierung: `needs_decision` / operativ `manual_gate`
- Registry-Readmodel: `blocked` bis zur Entscheidung
