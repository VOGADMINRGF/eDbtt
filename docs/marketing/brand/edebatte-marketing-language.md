# eDebatte Marketing Design Language

Status: `derived_from_repo / no_new_ci`

## Grundsatz

Marketingmaterialien verwenden die bestehende eDebatte- und Voxy-Designsprache. Dieser Vertrag erfindet keine neue CI, sondern überträgt die vorhandenen Produkt- und Assetregeln auf Sales, Social, Video, Partner- und Presseunterlagen.

## Kanonische Assets

Die verbindliche Voxy-Quelle ist:

- `apps/web/public/brand/voxy/manifest.json`
- `apps/web/src/features/voxy/voxyAssets.ts`

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

Der VOG-Pin bleibt aus Betrachterperspektive rechts. Voxy wird nicht gespiegelt, umgefärbt oder invertiert. Eingebrannte Rastertypografie wird nicht als Ersatz für die vorhandenen SVG-Overlays genutzt.

## Visuelle Prinzipien

### Gewollt

- ruhige, klare Kompositionen
- echte eDebatte-Oberflächen, Karten, Dossiers, Claims, Quellen und Debattenstände
- großzügiger Raum und klare Hierarchie
- helle oder dunkle gemeinsame Canvas-Flächen statt fremder Bildkarten
- enge, saubere Voxy-Crops mit dezenter Aura
- Produktzustände statt abstrakter KI-Magie
- sichtbare Quellen-, Gegenpositions- und Offenheitslogik
- konsistente Radien, Linien, Abstände und Typografie aus dem Webprodukt

### Nicht gewollt

- generische Sci-Fi-Welten, Weltkarten oder holografische Kommandozentralen
- Neon-HUDs, Cyberpunk oder austauschbare Government-Tech-Visuals
- Stockfotos mit gestellten Jubel- oder Handschlagmotiven
- neue Maskottchen, Eulenlogos oder Ersatzfiguren
- dekorative Voxy-Vollflächen ohne kommunikative Funktion
- harte rechteckige Fremdhintergründe unter Voxy
- visuelle Behauptungen über nicht vorhandene Live-Daten oder Partner

## Typografie und Copy

- kurze, vollständige deutsche Sätze
- normale Umlaute und ß
- keine künstliche Startup-Sprache
- keine unklaren Superlative
- keine Aussage wie „die Wahrheit“, wenn tatsächlich Quellenlage, Community-Ergebnis oder VOG-Position gemeint ist
- zentrale Aussage zuerst, Erklärung danach
- ein primärer CTA pro Motiv

Bevorzugte Copy-Muster:

- „Erst verstehen. Dann Position beziehen.“
- „Quellen, Argumente und offene Fragen an einem Ort.“
- „Aus Beiträgen wird ein nachvollziehbarer Debattenstand.“
- „Eine Debatte. Mehrere Sprachen. Der Ursprung bleibt sichtbar.“
- „Gemeinsam prüfen. Transparent entscheiden.“

## eDebatte und VoiceOpenGov

### eDebatte

- neutrale Content-, Informations-, Dossier- und Beteiligungsinfrastruktur
- führt durch Inhalte und Prozesse
- zeigt Quellen, Gegenpositionen und offene Fragen
- verkauft keine institutionelle Meinung als neutrale Wahrheit

### VoiceOpenGov

- Mission-, Träger-, Mitgliedschafts- und Partnerschaftsebene
- nutzt dieselbe eDebatte-Infrastruktur und dieselbe Voxy
- darf Partner sichtbar machen, aber keine Partner-Sonderrechte suggerieren
- darf nur transparent und regelgebunden entstandene VOG-Positionen vertreten

## Motion

Die bestehende Motion-Grundlage bleibt verbindlich:

- kurze, ruhige Übergänge
- keine Bewegung als alleinige Information
- `prefers-reduced-motion` respektieren
- Voxy als Guide und Einordner, nicht als Showfigur oder Wahrheitsrichter
- Caption-, Source-Card-, Lower-Third- und CTA-Stile werden erst nach realen Stilprototypen eingefroren

## Pflichtprüfung vor Freigabe

- Stimmt die verwendete Voxy-Variante mit ihrer dokumentierten Rolle überein?
- Ist die Aussage im Produkt oder in einem kanonischen Decision-Contract belegt?
- Werden eDebatte, Community-Ergebnis und offizielle VOG-Position sauber getrennt?
- Sind Quellen, Unsicherheit und offene Fragen korrekt gekennzeichnet?
- Ist das Motiv ohne Ton und ohne Animation verständlich?
- Ist der CTA real und erreichbar?
