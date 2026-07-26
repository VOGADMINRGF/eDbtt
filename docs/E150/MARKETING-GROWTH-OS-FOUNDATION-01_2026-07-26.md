# MARKETING-GROWTH-OS-FOUNDATION-01

Datum: `2026-07-26`

Status: `review`

Typ: `docs_only / no_product_implementation`

## Ziel

Eine versionierte, repo-basierte und anbieterneutrale Arbeitsgrundlage für eDebatte-Marketing, Vertrieb, Social Media, Video, VoiceOpenGov-Membership, Partnerschaften, White-Label-Ausgaben und spätere Admin-Steuerung schaffen, ohne eine neue CI, zweite Voxy, neue Runtime oder ungeklärte Produkt- und Governanceentscheidungen einzuführen.

## Kanonische Grundlagen

Geprüft und referenziert:

- `AGENTS.md`
- `apps/web/public/brand/README.md`
- `apps/web/public/brand/voxy/manifest.json`
- `apps/web/src/features/voxy/voxyAssets.ts`
- `apps/web/src/app/globals.css`
- `apps/web/src/lib/brand.ts`
- `features/themenradar/contracts.ts`
- `docs/E150/UX-VOXY-MOTION-GUIDE-01_2026-05-29.md`
- `docs/E150/V3_VOXY_SELF_RENDER_AND_MARKETING_PILOT_ROADMAP_2026-07-13.md`
- `docs/E150/VOG-MISSION-LAYER-01_2026-07-26.md`
- `docs/E150/VOG-MISSION-LAYER-01_DECISIONS_2026-07-26.md`
- PR `#430`
- `docs/E150/Part12_Campaigns_Admin_Telemetry.md`
- `docs/E150/PR-THEMENRADAR-02_PERSISTENCE_AUDIT_HARDENING_2026-04-19.md`
- `docs/E150/OpenTasks.md`

## Repo-Befund

- Ein kanonisches Voxy-Asset-Pack und klare Nutzungsregeln bestehen bereits.
- Eine umfangreiche Voxy-Video- und Marketing-Pilotroadmap besteht und wird referenziert statt dupliziert.
- Produkt-Tokens für Light, Dark und Editorial bestehen in `globals.css` und bilden die reale Marketingbasis.
- `BRAND` enthält kanonischen Namen, Domain, Kontaktwege und Produktbotschaft.
- `/admin/themenradar`, Audit-Lifecycle, Share-ready-Guardrails und aggregierte Metriken `clicks`, `leads`, `memberships` bestehen bereits.
- `/admin/campaigns` bezeichnet Beteiligungskampagnen und darf nicht mit MarketingCampaigns überladen werden.
- Vor diesem Slice fehlte ein zusammenhängender Marketing-/Sales-Einstieg mit Zielgruppen-Kits, Kampagnenportfolio, White-Label-Vertrag, Admin-Control-Plane, Schemas, Vorlagen und `public`-Asset-Registry.
- Generische Sci-Fi-, Government-Tech- oder fremde KI-Bildwelten entsprechen nicht der repo-basierten eDebatte-Designsprache und werden nicht übernommen.

## Neue VoiceOpenGov-Wahrheit aus PR #430

PR `#430` hat wesentliche Mission-, Membership-, Pricing-, Partner-, Domain-, Sprach- und Datenschutzgrundsätze menschlich bestätigt.

Damit sind für Marketing kanonisch:

- eDebatte bleibt neutrale Infrastruktur; VoiceOpenGov bleibt Mission, persönliche Mitgliedschaft, Partnernetzwerk, dynamisches Programm und Positionsprozess.
- VoiceOpenGov-Mitgliedschaft steht ausschließlich natürlichen Personen offen.
- Institutionen können Kunden, Veranstalter, Partner oder Förderer sein, aber keine stimmberechtigten VOG-Mitglieder.
- Mitgliedschaft, Partnerstatus, Produktpaket, operative Rolle, Stimmrecht und Repräsentationsmandat bleiben getrennt.
- `eDebatte Interessiert` kostet für bestätigte VoiceOpenGov-Mitglieder `0 €`, regulär `3,99 €`.
- Produktentgelte an eDebatte und Spenden/Förderung an VoiceOpenGov bleiben rechtlich, buchhalterisch und öffentlich getrennt.
- Partnerkategorien sind Community, Kommunen, Medien, Wissenschaft, Technologie, Bildung und Förderung.
- Partner erhalten keine automatischen Stimm-, Review-, Ranking-, Moderations-, Publikations- oder Mandatsrechte.
- `voiceopengov.org` trägt Mission, Mitgliedschaft, Partner, Förderung, Programm, Mandate und offizielle Positionen; `edebatte.org` bleibt die neutrale Plattform.
- zentrale Inhalte erscheinen mindestens auf Deutsch und Englisch; Governance- und Positionsübersetzungen bleiben human-review-first.
- persönliche Mitglieds-, Stimm-, Kontakt- und Schutzdaten sind nicht öffentlich.

Weiterhin `manual_gate` bleiben:

- endgültige VOG-Quorumformel,
- Transparenzschwellen und Offenlegungstiefen,
- Repräsentanten-Auswahlmechanismus,
- gemeinsames Konto-, Shell- und Routingmodell,
- konkrete Register-, Seiten- und Surface-Ausprägungen,
- rechtliche und buchhalterische Operationalisierung der Zahlungsströme,
- konkrete Membership- und Partnerprozesse, Verträge, Leistungen und Gegenleistungen.

## Angelegte Struktur

```text
docs/marketing/
├── README.md
├── brand/
│   └── edebatte-marketing-language.md
├── white-label/
│   ├── brand-profile-contract.md
│   └── profiles/
│       ├── edebatte-light.brand-profile.json
│       └── edebatte-dark.brand-profile.json
├── admin/
│   └── marketing-control-plane.md
├── schemas/
│   └── marketing-control-plane.schema.json
├── campaigns/
│   └── campaign-plan-2026.md
├── sales/
│   └── target-group-kits.md
├── social/
│   └── content-and-video-system.md
├── voiceopengov/
│   └── membership-partner-marketing.md
├── templates/
│   ├── campaign-brief-template.md
│   ├── onepager-template.md
│   ├── pitchdeck-template.md
│   ├── feature-marketing-intake-template.md
│   ├── distribution-and-learning-template.md
│   └── relationship-pipeline-template.md
└── agent-playbooks/
    └── marketing-agent.md

apps/web/public/marketing/
├── README.md
└── manifest.json
```

## Admin-, BI- und CRM-light-Zielbild

Markdown bleibt fachliche Quelle und Evidence. Eine spätere Admin-Fläche unter `/admin/marketing` soll operativ steuern:

- MarketingOpportunities aus neuen Funktionen, Themen, Dossiers und Produktbelegen,
- getrennte MarketingCampaigns,
- Asset- und Versionsstatus,
- Brandprofile und White-Label-Ausgaben,
- Review und Freigabe,
- reale DistributionRecords,
- aggregierte Insights,
- CRM-light für qualifizierte institutionelle Beziehungen.

Verbindliche Grenzen:

- Beteiligungskampagnen bleiben unter `/admin/campaigns` und im bestehenden `Campaign`-Modell.
- Marketingkommunikation nutzt `MarketingCampaign` und den Zielpfad `/admin/marketing/campaigns`.
- Themenradar-Lifecycle, Audit und `autoPostEligible=false` bleiben unangetastet.
- Ein Merge erzeugt keine automatische Marketingfreigabe.
- `approved` ist nicht `published`; reale Streuung benötigt ein `DistributionRecord`.
- BI bleibt aggregiert und erzeugt keine individuellen Click-Profile.
- CRM-light ersetzt kein externes Voll-CRM und speichert keine Kontakte ohne geklärte Rechtsgrundlage, Rollen, Retention und Löschung.

## White-Label-Zielbild

White-Label ist als konfigurierbares Brandprofil modelliert, nicht als Kopie einzelner Dateien.

Nach Freigabe veränderbar:

- Absendername,
- Logos,
- Akzentfarben innerhalb definierter Kontrastgrenzen,
- geprüfte Kontakt- und Rechtsziele,
- CTA-Ziele,
- Cover-, Endframe- und Exportvarianten,
- Co-Branding und Sprache.

Nicht veränderbar:

- Quellenstatus,
- Original- und Übersetzungskennzeichnung,
- Gegenpositionen und offene Fragen,
- Review, Audit und Privacy,
- kein Auto-Publish,
- keine Fake-Partner oder Fake-Zahlen,
- Trennung von eDebatte, Stakeholderposition, Community-Ergebnis und offizieller VoiceOpenGov-Position.

Dateinamen und Datenmodelle sind anbieterneutral. Namen von KI-, Design-, Video-, Präsentations- oder Office-Werkzeugen werden nicht als dauerhafte Assetidentität verwendet.

Die angelegten Light- und Dark-Brandprofile sind `review_ready`, nicht `approved`. Sie basieren auf realen Produkt-Tokens, benötigen aber vor Produktions- oder White-Label-Export eine explizite Brandfreigabe und reale Rechts-/Kontaktziele.

## Abgrenzung

Dieser Slice:

- definiert Arbeits- und Freigaberegeln,
- bündelt vorhandene Repo-Wahrheiten,
- erstellt konkrete Zielgruppenbotschaften und Formatvorlagen,
- plant Kampagnen mit Lifecycle und separater Readiness,
- definiert White-Label- und Co-Branding-Grenzen,
- definiert ein Admin-/BI-/CRM-light-Zielbild,
- legt maschinenlesbare Ziel-Shapes an,
- richtet VoiceOpenGov-Marketing an PR `#430` aus,
- legt noch keine finalen PDF-, PPTX-, Video- oder Social-Exporte ab.

Dieser Slice verändert nicht:

- Produktrouten,
- Rollen und Rechte,
- Membership- oder Pricing-Runtime,
- Partneraufnahme oder Vertragslogik,
- Voxy-Assets oder Motion-Runtime,
- Website oder Publishing,
- Themenradar-, Campaign- oder Telemetrie-Runtime,
- OpenTasks-Status bestehender Produktinitiativen.

## Verbleibende Entscheidungen

### VoiceOpenGov Surfaces und Operations

- finale Seiten, Navigation, Register und Routing,
- Konto- und Shell-Modell zwischen den Domains,
- Transparenzschwellen und Offenlegungstiefen,
- konkrete Membership- und Partnerprozesse,
- Partnerleistungen, Gegenleistungen, Aufnahme und Laufzeit,
- rechtliche und buchhalterische Zahlungsabwicklung,
- finale CTA- und Kontaktwege.

### eDebatte Sales und White-Label

- Pilot- und Angebotsmodell je Zielgruppe,
- Pricing und Vertragsgrundlage,
- reale Produktreife je Use Case,
- Betreiber-, Domain- und Tenantmodell,
- Umfang zulässiger Markenanpassung,
- Support, SLA und Rechtsverantwortung,
- freigegebene Referenzen, Screens und Kennzahlen.

### Marketing Control Plane

- endgültige Route und Navigation,
- Permission-Matrix,
- Registry-Persistenz und Ownership,
- automatische oder manuelle Feature-Evidence-Übernahme,
- erlaubte Distribution-Kanäle und Credentials,
- Attributions- und Retention-Regeln,
- CRM-light-Datenscope und Abgrenzung zu externem CRM,
- Export-, Lösch- und Auditregeln.

### Produktion

- finaler Caption-, Source-Card-, Lower-Third- und CTA-Stil,
- verbindliche Voice-Richtung,
- Tool-/Adapterwahl für Pilotproduktion,
- Review- und Asset-Freigabeverantwortliche.

## Risiken

- Marketing läuft der Produktreife voraus.
- Partner- oder Membership-Copy erzeugt unbeabsichtigt Rechteversprechen.
- Pricing-Grundsätze werden als bereits technisch und rechtlich produktiv dargestellt.
- generische KI-Visuals verwässern die eDebatte-CI.
- White-Labeling entfernt notwendige Transparenz.
- Arbeitsdateien gelangen ungeprüft in `public`.
- Kampagnen behaupten Reichweite, Partner oder Live-Daten ohne Evidenz.
- MarketingCampaign dupliziert oder überlädt das bestehende Campaign-Modell.
- CRM-light entwickelt sich ohne klare Grenze zu einem unsicheren Parallel-CRM.
- `approved` wird fälschlich als tatsächlich ausgespielt dargestellt.

## Acceptance Criteria

- [x] `docs/marketing` besitzt einen kanonischen Einstieg und klare SSOT-Grenzen.
- [x] bestehende Brand-/Voxy-Assets, Produkt-Tokens und Motion-Guardrails werden referenziert statt ersetzt.
- [x] Zielgruppen-Kits für Medien, Wissenschaft, Technologie, Kommunen, Initiativen, Parteien, Bildung, Unternehmen, Mitglieder und Partner sind angelegt.
- [x] Kampagnen besitzen Ziel, Zielgruppe, CTA, Lifecycle und separate Readiness-Grenze.
- [x] Onepager-, Pitchdeck-, Kampagnen-, Feature-Intake-, Distribution- und Relationship-Vorlagen sind vorhanden.
- [x] Social- und Videosystem nutzt wiederholbare Content-Serien.
- [x] VoiceOpenGov-Marketing ist an PR `#430` ausgerichtet.
- [x] VoiceOpenGov-Marketing trennt Partner, Mitgliedschaft, Plattformrolle, Stimmrecht und Repräsentationsmandat.
- [x] White-Label- und Co-Branding-Regeln trennen veränderbare Gestaltung von unveränderlicher Produktwahrheit.
- [x] Light- und Dark-Brandprofile basieren auf realen Produkt-Tokens und bleiben bis zur Freigabe `review_ready`.
- [x] Dateinamen und Datenverträge sind anbieterneutral.
- [x] Marketing Control Plane trennt MarketingCampaign von bestehender Campaign-Semantik.
- [x] Admin-, BI- und CRM-light-Zielbild nutzt vorhandene Themenradar-, Audit- und Telemetriegrundlagen.
- [x] `apps/web/public/marketing` enthält nur Asset-Regeln und ein leeres Freigabemanifest, keine ungeprüften Bilder.
- [x] keine Produkt-, Routing-, Rollen- oder Runtime-Implementierung wurde vorgenommen.

## Vorgeschlagene OpenTasks-Einträge

### Foundation-Slice

```text
| MARKETING-GROWTH-OS-FOUNDATION-01 | review | P1 | VOG-MISSION-LAYER-01, PR #430, bestehendes Brand-/Voxy-Pack, Voxy-Marketing-Pilotroadmap, Part12, Themenradar | Repo-basiertes, anbieterneutrales Marketing-, Sales-, Social-, Video-, White-Label- und Partner-Operating-System mit Zielgruppen-Kits, Kampagnenplan, Brandprofilen, Vorlagen, Admin-Zielbild, Schemas und freigegebener public-Assetstruktur anlegen, ohne Produkt- oder Governanceentscheidungen vorwegzunehmen | `docs/marketing` ist als SSOT-Einstieg vorhanden; bestätigte VOG-Entscheidungen aus PR #430 sind übernommen; vorhandene CI und Tokens werden referenziert; White-Label trennt Gestaltung und unveränderliche Wahrheit; MarketingCampaign bleibt von Campaign getrennt; public enthält nur freigegebene Assets |
```

### Admin-/BI-/CRM-Decision-Epic

```text
| MARKETING-CONTROL-PLANE-01 | manual_gate | P1 | MARKETING-GROWTH-OS-FOUNDATION-01, Part12, Themenradar, Organisations-/Rollenmodell, Privacy, VOG-MISSION-LAYER-01 | `/admin/marketing` als gemeinsame Steuerfläche für MarketingOpportunities, MarketingCampaigns, Assets, Brandprofile, Distribution, aggregierte Insights und CRM-light entscheiden; bestehende Campaign-, Themenradar-, Audit- und Telemetrie-Wahrheit wiederverwenden | Route und IA, Permission-Matrix, Datenownership, Marketingfähigkeit, Lifecycle, Distribution-/Credential-Grenzen, BI-Attribution, CRM-light-Scope, Retention, Löschung und White-Label-Verantwortung liegen als verbindlicher Decision-Contract vor; keine zweite Campaign-, CRM- oder Trackingwelt entsteht |
```

### Erster technischer Folge-Slice

```text
| MARKETING-REGISTRY-READMODEL-01 | blocked | P1 | MARKETING-CONTROL-PLANE-01 | Nach Entscheidung eine serverseitige Marketing-Registry und eine read-only `/admin/marketing`-Übersicht aufbauen, die Feature-/PR-/Themenradar-Evidence, Opportunities, Kampagnen, Assets, Blocker und Freigabestatus zeigt, ohne Distribution- oder CRM-Schreiblogik | Zod-/TypeScript-Contracts sind aus dem kanonischen Schema abgeleitet; bestehende Campaign- und Themenradar-Modelle werden nur referenziert; Admin-/2FA-Gates gelten; keine personenbezogene Telemetrie, kein Auto-Publish und kein paralleles CRM entstehen |
```

## Empfehlung

- Foundation: `review`
- Marketing Control Plane: fachlich `needs_decision`, operativ `manual_gate`
- technischer Registry-Slice: `blocked` bis zum Decision-Contract

## Validierung

Da ausschließlich Markdown- und JSON-Dokumentation angelegt oder geändert wird:

- JSON-Dateien syntaktisch prüfen,
- Brandprofile gegen die dokumentierten Produkt-Tokens prüfen,
- interne Pfade und kanonische Referenzen prüfen,
- VoiceOpenGov-Aussagen gegen PR `#430` prüfen,
- Dateinamen auf Anbieterneutralität prüfen,
- Diff auf Produkt-, Runtime-, Route-, Rollen- und Assetänderungen prüfen,
- keine App-Tests erforderlich.