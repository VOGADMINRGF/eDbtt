# MARKETING-GROWTH-OS-FOUNDATION-01

Datum: `2026-07-26`

Status: `review`

Typ: `docs_only / no_product_implementation`

## Ziel

Eine versionierte, repo-basierte Arbeitsgrundlage für eDebatte-Marketing, Vertrieb, Social Media, Video, VoiceOpenGov-Membership und Partnerschaften schaffen, ohne eine neue CI, zweite Voxy, neue Runtime oder ungeklärte Produkt- und Governanceentscheidungen einzuführen.

## Repo-Prüfung

Geprüfte Grundlagen:

- `AGENTS.md`
- `apps/web/public/brand/README.md`
- `apps/web/public/brand/voxy/manifest.json`
- `apps/web/src/features/voxy/voxyAssets.ts`
- `docs/E150/UX-VOXY-MOTION-GUIDE-01_2026-05-29.md`
- `docs/E150/V3_VOXY_SELF_RENDER_AND_MARKETING_PILOT_ROADMAP_2026-07-13.md`
- `docs/E150/VOG-MISSION-LAYER-01_2026-07-26.md`
- `docs/E150/OpenTasks.md`

## Befund

- Ein kanonisches Voxy-Asset-Pack und klare Nutzungsregeln bestehen bereits.
- Eine umfangreiche Voxy-Video- und Marketing-Pilotroadmap besteht bereits und darf nicht dupliziert werden.
- `VOG-MISSION-LAYER-01` ist als `manual_gate / needs_decision` in OpenTasks und Decision-Contract verankert.
- Ein zusammenhängender Marketing-/Sales-Einstieg mit Zielgruppen-Kits, Kampagnenportfolio, Vorlagen, Agentenregeln und `public`-Asset-Registry bestand noch nicht.
- Die bisher generierten generischen Sci-Fi-/Government-Tech-Bilder entsprechen nicht der repo-basierten eDebatte-Designsprache und werden nicht übernommen.

## Angelegte Struktur

```text
docs/marketing/
├── README.md
├── brand/
│   └── edebatte-marketing-language.md
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
│   └── pitchdeck-template.md
└── agent-playbooks/
    └── marketing-agent.md

apps/web/public/marketing/
├── README.md
└── manifest.json
```

## Abgrenzung

Dieser Slice:

- definiert Arbeits- und Freigaberegeln
- bündelt vorhandene Repo-Wahrheiten
- erstellt konkrete Zielgruppenbotschaften und Formatvorlagen
- plant Kampagnen mit Status- und Entscheidungsgrenzen
- legt noch keine finalen PDF-, PPTX-, Video- oder Social-Exporte ab

Dieser Slice verändert nicht:

- Produktrouten
- Rollen und Rechte
- Membership oder Pricing
- Partneraufnahme oder Vertragslogik
- Voxy-Assets oder Motion-Runtime
- Website oder Publishing
- OpenTasks-Status bestehender Produktinitiativen

## Offene Entscheidungen

### VoiceOpenGov

- Membership-Arten, Beiträge, Rechte und Pflichten
- Partnerleistungen, Gegenleistungen, Aufnahme und Laufzeit
- Default-Seiten, Navigation und Routing
- Funding- und Transparenzdarstellung
- konkrete CTA- und Kontaktwege

### eDebatte Sales

- Pilot- und Angebotsmodell je Zielgruppe
- Pricing und Vertragsgrundlage
- reale Produktreife je Use Case
- freigegebene Referenzen, Screens und Kennzahlen

### Produktion

- finaler Caption-, Source-Card-, Lower-Third- und CTA-Stil
- verbindliche Voice-Richtung
- Tool-/Adapterwahl für Pilotproduktion
- Review- und Asset-Freigabeverantwortliche

## Risiken

- Marketing läuft der Produktreife voraus.
- Partner- oder Membership-Copy erzeugt unbeabsichtigt Rechteversprechen.
- generische KI-Visuals verwässern die eDebatte-CI.
- Arbeitsdateien gelangen ungeprüft in `public`.
- Kampagnen behaupten Reichweite, Partner oder Live-Daten ohne Evidenz.

## Acceptance Criteria

- [x] `docs/marketing` besitzt einen kanonischen Einstieg und klare SSOT-Grenzen.
- [x] bestehende Brand-/Voxy-Assets und Motion-Guardrails werden referenziert statt ersetzt.
- [x] Zielgruppen-Kits für Medien, Wissenschaft, Technologie, Kommunen, Initiativen, Parteien, Bildung, Unternehmen, Mitglieder und Partner sind angelegt.
- [x] Kampagnen besitzen Ziel, Zielgruppe, CTA, Status und Decision-Grenze.
- [x] Onepager-, Pitchdeck- und Kampagnenbrief-Vorlagen sind vorhanden.
- [x] Social- und Videosystem nutzt wiederholbare Content-Serien.
- [x] VoiceOpenGov-Marketing trennt Partner, Mitgliedschaft, Plattformrolle, Stimmrecht und Repräsentationsmandat.
- [x] `apps/web/public/marketing` enthält nur Asset-Regeln und ein leeres Freigabemanifest, keine ungeprüften Bilder.
- [x] keine Produkt-, Routing-, Rollen- oder Runtime-Implementierung wurde vorgenommen.

## Vorgeschlagener OpenTasks-Eintrag

Der operative Kopf sollte vor Merge oder in einem unmittelbar folgenden SSOT-Sync um folgende Zeile ergänzt werden:

```text
| MARKETING-GROWTH-OS-FOUNDATION-01 | review | P1 | VOG-MISSION-LAYER-01, bestehendes Brand-/Voxy-Pack, Voxy-Marketing-Pilotroadmap | Repo-basiertes Marketing-, Sales-, Social-, Video- und Partner-Operating-System mit Zielgruppen-Kits, Kampagnenplan, Vorlagen, Agentenregeln und freigegebener public-Assetstruktur anlegen, ohne Produkt- oder Governanceentscheidungen vorwegzunehmen | docs/marketing ist als SSOT-Einstieg vorhanden; vorhandene CI wird referenziert; Zielgruppen- und Kampagnenvorlagen sind reviewbar; public enthält nur freigegebene Assets; keine offene VOG-, Pricing-, Routing- oder Rollenentscheidung wird als umgesetzt dargestellt |
```

## Validierung

Da ausschließlich Markdown- und JSON-Dokumentation angelegt wird:

- JSON-Manifest syntaktisch prüfen
- interne Pfade und kanonische Referenzen prüfen
- Diff auf Produkt-, Runtime- und Assetänderungen prüfen
- keine App-Tests erforderlich
