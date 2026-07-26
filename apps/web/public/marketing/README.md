# eDebatte Marketing Assets

Dieser Ordner enthält ausschließlich freigegebene statische Marketing-Assets, die direkt ausgeliefert oder in Website, Social Media, Sales- und Presseunterlagen verwendet werden dürfen.

## Kanonische Trennung

- Arbeitsquellen, Copy, Briefings, Kampagnenpläne und Storyboards: `docs/marketing/**`
- bestehende Brand- und Voxy-Assets: `apps/web/public/brand/**`
- freigegebene Marketing-Exporte: `apps/web/public/marketing/**`

## Geplante Struktur

```text
marketing/
├── campaigns/
├── social/
│   ├── linkedin/
│   ├── instagram/
│   ├── tiktok/
│   ├── facebook/
│   └── youtube/
├── sales/
│   ├── onepager/
│   └── pitchdecks/
├── partner/
├── membership/
├── press/
├── video/
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

Bearbeitbare Arbeitsdateien und externe Tool-Projekte gehören nicht ungeprüft in `public`.

## Dateinamen

```text
<campaign-id>_<asset-type>_<channel>_<language>_<ratio>_<version>.<ext>
```

Beispiel:

```text
cam-edb-01_carousel_linkedin_de_1x1_v01.pdf
cam-content-02_short_instagram_de_9x16_v03.mp4
```

## Freigabeanforderungen

Jedes veröffentlichte Asset benötigt in seinem Kampagnenordner oder Manifest:

- Campaign-ID
- Sprache
- Zielgruppe
- Status `approved` oder `published`
- kanonische Copy-/Briefing-Quelle
- verwendete Voxy-Variante
- Quellen- oder Produktbezug
- Freigabedatum
- Version

## Verboten

- ungeprüfte generierte Bilder
- generische Fremd-CI
- Fake-Partner, Fake-Logos, Fake-Nutzerzahlen oder Fake-Live-Daten
- Assets ohne reproduzierbares Briefing
- Voxy-Varianten außerhalb des kanonischen Brand-Packs
- sensible oder personenbezogene Daten
