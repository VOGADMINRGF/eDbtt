# VOXY-ANIMATABLE-MASTER-ASSET-01 — Scope

Stand: 2026-08-14

## Aktueller Recovery-Scope

Der Motion-Stand aus Exact Head
`7f0ad050e4079b823c3bb6c7b2ef5fc991b662cb` ist menschlich visuell
abgelehnt. Das SVG-Rig und seine technische Evidence bleiben nachvollziehbar,
gelten aber nicht als akzeptiertes visuelles Masterasset.

Bis zur menschlichen Auswahl eines neuen statischen Masters gilt für PR `#589`:

- keine Animation und kein weiterer Motion-Polish;
- drei statische 1920 × 1080 Canon-Recovery-Kandidaten A/B/C aus derselben
  CANON-04-Voxy-Pixelquelle;
- Unterschiede ausschließlich in Kamera, Crop, Inhaltsraum und
  Lichtgewichtung;
- eine Vergleichstafel mit A/B/C und den vier Canon-Boards;
- lokaler, revisionsgebundener Raster-Render ohne Generierung, externen Dienst,
  Upload oder SaaS;
- Exact-Head-Artefakt mit mindestens 14 Tagen Aufbewahrung;
- `humanVisualAcceptance = pending`, `animationEligible = false` und
  `productionEligible = false`.

Die Canon-Boards 01 und 02 kontrollieren Charakter, Gesicht, Hände und
Anatomie; 03 und 04 kontrollieren Studio und Broadcast-Layout. CANON-04 ist die
identische Charakterquelle aller drei Kandidaten. Erst eine ausdrückliche
menschliche Auswahl darf die Grundlage für einen späteren, getrennten
Rig-/Animationsschritt bilden.

## Ziel

Eine tatsächlich lokal reproduzierbare, Stretchy-Studio-kompatibel gedachte
Voxy-Fixture erzeugen. Die menschlich akzeptierte Referenz
`apps/web/public/brand/voxy/voxy-podcast-stage.png` bleibt die kanonische
Identitätsquelle. Technische Evidence ersetzt keine Human Visual Acceptance.

## In Scope

- natives SVG-Layer-/Pivot-Rig aus dem eigenen Assetbestand;
- unabhängige Steuerung von Kopf, Augen, Lidern, Brauen, Armen, Händen und
  Oberkörper;
- separat im Oberkörper-Layer geführter VOG-Pin und eDebatte-Pocket-Mark;
- exakt fünf vorhandene, nicht generativ erzeugte Finger-Elemente je Hand;
- sieben deterministische Motion States;
- revisionsgebundener lokaler 8-Sekunden-Render mit 24 fps in `16:9`;
- reproduzierbare Standframes und Hand-Crops in `16:9`, `9:16` und `1:1`;
- Clip-, Asset- und Rig-SHA256 sowie Exact-Head-, Timeline- und
  Render-Provenienz;
- lokaler Hand-/Crop-Smoke als vorgelagerte Evidence für den unabhängigen
  fail-closed Checkpoint aus PR `#588`.

## Technischer Ansatz

`voxy-sitting-master.svg` bleibt ein einziges natives Vektorasset. Der Renderer
steuert dessen vorhandene Gruppen über dokumentierte Pivotpunkte. Arme und Hände
bewegen sich gekoppelt um Schulteranker; Hände werden weder ausgeschnitten noch
pro Frame neu erzeugt. Branding-Elemente erben ausschließlich die starre
Oberkörpertransformation und werden nicht separat deformiert.

Die Fixture nutzt vier ruhige Zustände:

1. `neutral_idle` (0–2 s)
2. `explaining` (2–4 s)
3. `showing_contrast` (4–6 s)
4. `inviting_participation` (6–8 s)

Alle sieben geforderten Zustände sind im Rig-Contract implementiert und getestet.

## Explizit verworfen

- Attempts 1–6;
- Raster-Crops als künstliche Körperteile;
- CSS-Affine-Reparatur einzelner Pixelregionen;
- Masken- oder nachträgliche Handsegmentierung als Animationsmethode;
- generativ neu gezeichnete Hände;
- externe Avatarprovider, Uploads, Runtime-CDNs oder SaaS-Budget;
- Lip-Sync als Voraussetzung.

## Human Gate

Der frühere Motion-Kandidat hat `humanVisualAcceptance = rejected`. Für die
statischen Recovery-Kandidaten bleibt `humanVisualAcceptance = pending`;
`animationEligible`, `productionEligible` und `autoPublish` bleiben `false`.
Der technische Slice endet maximal in `review`. Merge, Ready-for-Review,
Deployment, Publishing und Production-VOTES sind nicht Teil dieses Scopes.

## Verhältnis zu #588 und #590

`#589` erzeugt Rig und Render-Evidence. `#588` bleibt der unabhängige
200-%-Visual-QA-Checkpoint und wird nicht in diesen Branch kopiert. `#590`
bleibt der providerneutrale Audio-/Caption-/Composition-Slice; sein Scope wird
nicht verändert.
