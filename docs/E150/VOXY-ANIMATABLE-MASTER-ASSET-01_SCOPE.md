# VOXY-ANIMATABLE-MASTER-ASSET-01 — Scope

Stand: 2026-08-14

## Verbindlicher Jacket-Canon-Gate vom 15.08.2026

Die grundsätzliche menschliche Akzeptanz des statischen A-/C-Masters ist keine
Akzeptanz der anschließend sichtbaren Motion-v2-Sakkoüberlagerungen. Der letzte
Motion-v2-Stand ist für VOG-Pin, eDebatte-Pocket-Mark und deren Integration in
Revers, Tasche und Stoff ausdrücklich abgelehnt.

Sakko-Schnitt, Revers, Stofftextur, Nähte, Taschenform, blaue Paspel, VOG-Pin
und eDebatte-Pocket-Mark bilden daher gemeinsam eine unveränderliche
Character-Identity-Region. Vor einem Layer-Master oder Motion v3 muss der lokale
Exact-Head-Renderer `render-voxy-jacket-canon-gate.ts` fünf direkt prüfbare
PNG-Evidenzen und ein Manifest gegen CANON-04 erzeugen. Der aktuelle
Motion-v2-Kandidat verwendet frei gesetzte SVG-Marken über einer bereits
gebrandeten abgeflachten Pixelquelle; genau eine integrierte Wortmarke sowie
Textur- und Geometrieerhalt sind damit nicht belastbar nachgewiesen.

Der Gate-Stand ist deshalb `failed`; `layerMasterEligible`, `motionV3Eligible`
und `animationEligible` bleiben `false`. Es wird weder durch OCR-Annahmen noch
durch ein rekonstruierendes Raster-Patching ein PASS behauptet. Erst ein später
menschlich sauberer, provenance-gebundener Canon-Abgleich darf diese Sperre in
einem getrennt überprüften Stand aufheben.

## Aktueller Recovery-Scope

Der Motion-Stand aus Exact Head
`7f0ad050e4079b823c3bb6c7b2ef5fc991b662cb` ist menschlich visuell
abgelehnt. Das SVG-Rig und seine technische Evidence bleiben nachvollziehbar,
gelten aber nicht als akzeptiertes visuelles Masterasset.

Die menschliche Prüfung hat am statischen Exact Head
`ecba53e4167a6382d16dc2dda25c2f162dab8162` A als Primary Master und C als
Editorial-/Anlass-Variante akzeptiert. B ist verworfen. Ein kontrollierter
Animationstest aus dem akzeptierten Primary A ist erlaubt; jede neue
Motion-Ausgabe beginnt erneut mit `humanVisualAcceptance = pending`. Für den
aktuellen Explainer in PR `#589` gilt:

- kein Reaktivieren des menschlich abgelehnten SVG-Rigs und kein neuer
  Charakter-/Studio-Look;
- dieselbe abgeflachte CANON-04-Voxy-/Studio-Pixelquelle wie Primary A;
- identische Kamera, Licht-, Marken-, Typografie- und Materialbehandlung;
- lokale Blink- und minimale Blicklicht-Overlays sowie Editorial-Easing;
- keine unabhängige Kopf-, Oberkörper-, Arm- oder Handbewegung, solange kein
  akzeptierter geschichteter Master existiert;
- genau eine statische Waveform hinter Voxy; künftig audio-reaktionsfähig,
  aktuell nicht audio-reaktiv und ohne Audioanalyse;
- VOG-Pin, eDebatte-Wortmarke ohne Badge und dauerhaftes
  VoiceOpenGov-/eDebatte-Studio-Lockup gemäß Human Branding Decision;
- lokaler, revisionsgebundener Raster-Render ohne Generierung, externen Dienst,
  Upload oder SaaS;
- Exact-Head-Artefakt mit mindestens 14 Tagen Aufbewahrung;
- `humanVisualAcceptance = pending`, `productionEligible = false` und
  `autoPublish = false`.

Die unveränderten Canon-Boards 01 und 02 kontrollieren Charakter, Gesicht,
Hände und Anatomie; 03 und 04 kontrollieren Studio und Broadcast-Layout.
CANON-04 ist die identische Charakter-/Studioquelle beider finalen Varianten.
Ein späterer, getrennt autorisierter Rig-/Animationsschritt bleibt trotz der
A/C-Auswahl an die finale Human Visual Acceptance gebunden.

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

Der frühere Motion-Kandidat und die statische Variante B haben
`humanVisualAcceptance = rejected`. Für Primary A und Editorial C bleibt
`humanVisualAcceptance = pending`;
`animationEligible`, `productionEligible` und `autoPublish` bleiben `false`.
Der technische Slice endet maximal in `review`. Merge, Ready-for-Review,
Deployment, Publishing und Production-VOTES sind nicht Teil dieses Scopes.

## Verhältnis zu #588 und #590

`#589` erzeugt Rig und Render-Evidence. `#588` bleibt der unabhängige
200-%-Visual-QA-Checkpoint und wird nicht in diesen Branch kopiert. `#590`
bleibt der providerneutrale Audio-/Caption-/Composition-Slice; sein Scope wird
nicht verändert.
