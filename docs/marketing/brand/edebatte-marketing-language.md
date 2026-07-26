# eDebatte Marketing Design Language

Status: `derived_from_repo / no_new_ci`

## Grundsatz

Marketingmaterialien verwenden die bestehende eDebatte- und Voxy-Designsprache. Dieser Vertrag erfindet keine neue CI, sondern überträgt die vorhandenen Produkt-, Token- und Assetregeln auf Sales, Social, Video, Partner-, White-Label- und Presseunterlagen.

## Kanonische Quellen

- Produkt-Tokens: `apps/web/src/app/globals.css`
- Brand-Metadaten: `apps/web/src/lib/brand.ts`
- Voxy-Manifest: `apps/web/public/brand/voxy/manifest.json`
- Voxy-Asset-Map: `apps/web/src/features/voxy/voxyAssets.ts`
- Motion-Guardrails: `docs/E150/UX-VOXY-MOTION-GUIDE-01_2026-05-29.md`

## Kanonische eDebatte-Botschaft

> Aktuelle Entwicklungen, Quellen, Positionen und Beteiligungsmöglichkeiten nachvollziehbar verbinden.

Diese Botschaft darf zielgruppengerecht gekürzt oder konkretisiert, aber nicht in einen pauschalen Wahrheits-, Aktivismus- oder KI-Superlativ umgedeutet werden.

## Farb- und Flächensystem

### Light

| Token | Wert | Einsatz |
| --- | --- | --- |
| Canvas | `rgb(248 250 252)` | Seiten- und Exportgrund |
| Text | `rgb(15 23 42)` | Primärtext |
| Muted | `rgb(71 85 105)` | Sekundärtext |
| Surface | `rgb(255 255 255)` | Karten und Module |
| Border | `rgb(226 232 240)` | ruhige Trennung |
| Accent Blue | `#1a8cff` | Primärakzent |
| Accent Cyan | `#18cfc8` | Sekundärakzent |
| Gradient Start | `rgb(14 165 233)` | Headline, CTA, Fokus |
| Gradient End | `rgb(45 212 191)` | Headline, CTA, Fokus |

### Dark

| Token | Wert | Einsatz |
| --- | --- | --- |
| Canvas | `rgb(2 6 23)` | dunkler Seiten- und Videogrund |
| Text | `rgb(248 250 252)` | Primärtext |
| Muted | `rgb(188 201 221)` | Sekundärtext |
| Surface | `rgb(15 23 42)` | Karten und Module |
| Border | `rgb(51 65 85)` | ruhige Trennung |
| Accent Blue | `#1a8cff` | Primärakzent |
| Accent Cyan | `#18cfc8` | Sekundärakzent |
| Gradient Start | `rgb(14 165 233)` | Headline, CTA, Fokus |
| Gradient End | `rgb(45 212 191)` | Headline, CTA, Fokus |

### Editorial

Für Dossier-, Medien-, Wissenschafts- und längere Lesematerialien darf die bestehende ruhigere Editorial-Palette genutzt werden:

- Light Canvas: `rgb(244 243 239)`
- Light Text: `rgb(26 36 51)`
- Light Surface: `rgb(255 255 255)`
- Light Border: `rgb(224 227 230)`
- Dark Canvas: `rgb(11 19 32)`
- Dark Text: `rgb(230 237 245)`
- Dark Surface: `rgb(17 27 46)`
- Dark Border: `rgb(43 57 77)`

White-Label-Profile dürfen Akzente konfigurieren, müssen aber Kontrast, Statusfarben, Quellenkennzeichnung und ruhige Flächenlogik erhalten.

## Layout und Form

Aus dem Produkt übernommen:

- maximale ruhige Inhaltsbreite statt vollflächiger Werbeüberladung,
- Kartenradius standardmäßig `1rem`,
- dünne Border statt harter Container,
- weiche Schatten mit geringer Deckkraft,
- großzügige Abstände,
- klare Blickführung,
- Gradient nur als Akzent, nicht als permanente Effektfläche,
- echte Produktmodule und Debattenstände statt abstrakter KI-Magie.

Ein Marketingmotiv soll wie eine präzise Erweiterung des Webprodukts wirken, nicht wie eine fremde Agenturkampagne.

## Typografie

Solange kein separater freigegebener Markenfont dokumentiert ist, gilt ein robuster System-Font-Stack:

```text
ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
```

Regeln:

- große, klare Headlines,
- kurze vollständige Sätze,
- normale Umlaute und ß,
- keine künstliche Startup-Sprache,
- keine unklaren Superlative,
- zentrale Aussage zuerst, Erklärung danach,
- ein primärer CTA pro Motiv,
- Print- und Mobile-Lesbarkeit vor dekorativer Typografie.

## Voxy

Verfügbare Kernvarianten:

| Variante | Marketingeinsatz |
| --- | --- |
| `neutral` | ruhige Orientierung, sachlicher Einstieg |
| `thinking` | Prüfung, offene Fragen, Abwägung |
| `check` | bestätigter oder reviewbereiter Zustand |
| `hint` | wichtiger Hinweis, Konsequenz oder Guardrail |
| `welcome` | Onboarding und erste Begegnung |
| `presenting` | Erklärung eines Ablaufs oder nächsten Schritts |
| `open` | Beteiligung, Community und Einladung |
| `confident` | Hero, Vertrauen und institutionelle Ansprache |
| `wave` | leichter Social-Einstieg oder Begrüßung |
| `mini-avatar` | kompakte Hinweise, Avatare und mobile Module |

Overlays:

- `/brand/voxy/overlays/vog-pin.svg`
- `/brand/voxy/overlays/edebatte-gradient.svg`
- `/brand/voxy/overlays/voxy-wordmark.svg`

Der VOG-Pin bleibt aus Betrachterperspektive rechts. Voxy wird nicht gespiegelt, umgefärbt oder invertiert. Eingebrannte Rastertypografie wird nicht als Ersatz für vorhandene SVG-Overlays genutzt.

## Visuelle Prinzipien

### Gewollt

- ruhige, klare Kompositionen,
- echte eDebatte-Oberflächen, Karten, Dossiers, Claims, Quellen und Debattenstände,
- großzügiger Raum und klare Hierarchie,
- helle oder dunkle gemeinsame Canvas-Flächen statt fremder Bildkarten,
- enge, saubere Voxy-Crops mit dezenter Aura,
- Produktzustände statt abstrakter KI-Magie,
- sichtbare Quellen-, Gegenpositions- und Offenheitslogik,
- konsistente Radien, Linien, Abstände und Typografie aus dem Webprodukt,
- wiederverwendbare Slot-Layouts für Onepager, Pitchdeck, Social und Video.

### Nicht gewollt

- generische Sci-Fi-Welten, Weltkarten oder holografische Kommandozentralen,
- Neon-HUDs, Cyberpunk oder austauschbare Government-Tech-Visuals,
- Stockfotos mit gestellten Jubel- oder Handschlagmotiven,
- neue Maskottchen, Eulenlogos oder Ersatzfiguren,
- dekorative Voxy-Vollflächen ohne kommunikative Funktion,
- harte rechteckige Fremdhintergründe unter Voxy,
- visuelle Behauptungen über nicht vorhandene Live-Daten oder Partner,
- zufällige White-Label-Farben ohne Kontrast- und Governance-Prüfung.

## Bevorzugte Copy-Muster

- „Erst verstehen. Dann Position beziehen.“
- „Quellen, Argumente und offene Fragen an einem Ort.“
- „Aus Beiträgen wird ein nachvollziehbarer Debattenstand.“
- „Eine Debatte. Mehrere Sprachen. Der Ursprung bleibt sichtbar.“
- „Gemeinsam prüfen. Transparent entscheiden.“
- „Was ist belegt? Was ist umstritten? Was bleibt offen?“

Nicht verwenden:

- „Wir liefern die Wahrheit.“
- „Die KI entscheidet.“
- „Die Community hat immer recht.“
- „Partner bestimmen die Debatte.“
- unbewiesene Marktführerschaft oder Wirkungsversprechen.

## eDebatte und VoiceOpenGov

### eDebatte

- neutrale Content-, Informations-, Dossier- und Beteiligungsinfrastruktur,
- führt durch Inhalte und Prozesse,
- zeigt Quellen, Gegenpositionen und offene Fragen,
- verkauft keine institutionelle Meinung als neutrale Wahrheit.

### VoiceOpenGov

- Mission-, Träger-, Mitgliedschafts- und Partnerschaftsebene,
- nutzt dieselbe eDebatte-Infrastruktur und dieselbe Voxy,
- darf Partner sichtbar machen, aber keine Partner-Sonderrechte suggerieren,
- darf nur transparent und regelgebunden entstandene VOG-Positionen vertreten.

### White-Label und Co-Branding

- verändern Absender, Akzent und Export,
- verändern nicht Quellenstatus, Review, Audit, Privacy oder Governance,
- dürfen keine kundenbezogene Funktion als allgemeine eDebatte-Funktion darstellen,
- benötigen ein freigegebenes Brandprofil und reale Rechts-/Kontaktangaben.

## Motion

Die bestehende Motion-Grundlage bleibt verbindlich:

- kurze, ruhige Übergänge,
- keine Bewegung als alleinige Information,
- `prefers-reduced-motion` respektieren,
- Voxy als Guide und Einordner, nicht als Showfigur oder Wahrheitsrichter,
- Caption-, Source-Card-, Lower-Third- und CTA-Stile werden nach realen Stilprototypen eingefroren,
- dieselben Layoutslots funktionieren statisch und animiert.

## Pflichtprüfung vor Freigabe

- Stimmt die verwendete Voxy-Variante mit ihrer dokumentierten Rolle überein?
- Ist die Aussage im Produkt oder in einem kanonischen Decision-Contract belegt?
- Werden eDebatte, Community-Ergebnis und offizielle VOG-Position sauber getrennt?
- Sind Quellen, Unsicherheit und offene Fragen korrekt gekennzeichnet?
- Ist das Motiv ohne Ton und ohne Animation verständlich?
- Ist der CTA real und erreichbar?
- Entsprechen Farben, Radius, Fläche und Gradient der Produktlogik?
- Ist das Brandprofil freigegeben?
- Sind Dateiname und Metadaten anbieterneutral?
