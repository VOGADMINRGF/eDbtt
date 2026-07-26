# eDebatte Marketing Assets

Dieser Ordner enthält ausschließlich freigegebene statische Marketing-Assets, die direkt ausgeliefert oder in Website, Social Media, Sales-, Partner-, White-Label- und Presseunterlagen verwendet werden dürfen.

## Kanonische Trennung

- Arbeitsquellen, Copy, Briefings, Kampagnenpläne, Schemas und Storyboards: `docs/marketing/**`
- bestehende Brand- und Voxy-Assets: `apps/web/public/brand/**`
- freigegebene Marketing-Exporte: `apps/web/public/marketing/**`
- operative Status-, Freigabe- und Distribution-Logik: später `/admin/marketing`

## Zielstruktur

```text
marketing/
├── edebatte/
│   ├── campaigns/
│   ├── social/
│   ├── sales/
│   ├── press/
│   └── video/
├── voiceopengov/
│   ├── membership/
│   ├── partner/
│   ├── campaigns/
│   └── press/
├── co-branded/
├── white-label/
├── shared/
│   ├── captions/
│   ├── source-cards/
│   └── legal-disclosures/
└── manifest.json
```

Ordner werden erst angelegt, wenn mindestens ein freigegebenes Asset vorhanden ist. Keine leeren Kampagnenwelten und keine ungeprüften Exporte.

## Zulässige Dateien

- SVG
- PNG
- WebP
- PDF
- MP4
- WebM
- SRT / VTT
- JSON-Manifeste

Bearbeitbare Arbeitsdateien, Rohmaterial, vertrauliche Daten, Promptdateien und externe Tool-Projekte gehören nicht in `public`.

## Dateinamen

Verbindliches Schema:

```text
<brand>-<campaign>-<asset-type>-<audience>-<locale>-<format>-v<version>.<ext>
```

Beispiele:

```text
edebatte-why-edebatte-onepager-media-de-de-a4-v1.pdf
edebatte-debattenstand-carousel-public-de-de-1080x1350-v3.png
voiceopengov-media-partner-deck-media-de-de-16x9-v2.pdf
stadt-beispiel-edebatte-participation-report-public-de-de-a4-v1.pdf
```

Nicht verwenden:

- Namen von KI-, Design-, Video- oder Office-Werkzeugen,
- Chat- oder Sitzungsbezeichnungen,
- `final-final`, `neu`, `kopie` oder ähnliche nicht versionierbare Zusätze,
- Leerzeichen,
- personenbezogene Namen ohne fachlichen Grund.

## Freigabeanforderungen

Jedes exportierte Asset benötigt im Manifest:

- Asset-ID
- MarketingCampaign-ID
- BrandProfile-ID
- Sprache und Originalsprache
- Zielgruppe
- Status `approved`, `published` oder `retired`
- kanonische Copy-/Briefing-Quelle
- verwendete Voxy-Variante oder `hidden`
- Quellen-, Feature- oder Produktbezug
- Freigabedatum
- Version
- optional abgelöste Vorgängerversion
- Exportpfad und Dateiname

`approved` bedeutet nicht `published`. Eine tatsächliche Ausspielung wird später separat als DistributionRecord dokumentiert.

## White-Label und Co-Branding

- nur mit freigegebenem Brandprofil,
- keine Entfernung verpflichtender Quellen-, Review-, Privacy- oder Governance-Hinweise,
- keine ungeprüften Partnerlogos,
- keine kundenbezogene Funktion als allgemeine eDebatte-Funktion darstellen,
- Betreiber und fachlich Verantwortliche müssen erkennbar bleiben,
- Voxy nur kanonisch, kontrolliert co-gebrandet oder ausgeblendet.

## Verboten

- ungeprüfte generierte Bilder,
- generische Fremd-CI,
- Fake-Partner, Fake-Logos, Fake-Nutzerzahlen oder Fake-Live-Daten,
- Assets ohne reproduzierbares Briefing,
- Voxy-Varianten außerhalb des kanonischen Brand-Packs,
- sensible oder personenbezogene Daten,
- final wirkende Dateien ohne realen Freigabestatus,
- Anbieter- oder Toolnamen als dauerhafte Assetidentität.
