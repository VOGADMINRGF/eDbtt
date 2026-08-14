# VOXY-ANIMATABLE-MASTER-ASSET-01

Stand: 2026-08-14

## Ergebnis des technischen Slices

Der nach der Betreiberentscheidung vom 14. August zugelassene neue Ansatz ist
als echtes lokales Vektor-Rig implementiert. Er nimmt keinen der verworfenen
Attempts 1–6 wieder auf:

- Rig: `voxy-stretchy-compatible-svg-rig`
- Version: `voxy-local-2d-rig-v1`
- Umsetzung: `native_svg_layer_pivot_rig`
- Asset: `apps/web/public/brands/voxy/characters/voxy-sitting-master.svg`
- kanonische Referenz:
  `apps/web/public/brand/voxy/voxy-podcast-stage.png`
- Runtime: lokales SVG/HTML/Playwright plus FFmpeg; kein Modell und keine
  Modellgewichte

Das Rig hat dokumentierte Controls und Pivots für Oberkörper, Kopf, Augen,
Blinzeln, Brauen, beide Arme und beide Hände. VOG-Pin und eDebatte-Markierung
bleiben eigene SVG-Gruppen innerhalb des starr bewegten Oberkörpers. Jede Hand
enthält fünf feste Digit-Nodes; der Renderer erzeugt keine neue Anatomie.

## Motion-Polish im bestehenden Rig

Die Charakteridentität, Kleidung, Markierungen, Grundproportionen und das
kanonische SVG wurden nicht neu aufgebaut oder verändert. Der typisierte
Motion-Vertrag `voxy-motion-polish-v2` verfeinert ausschließlich die vorhandenen
Pivots:

- Hand-Basisrotation von bisher `-74°/+74°` auf `-58°/+58°` reduziert und die
  Handgelenke um 12 px in die Ärmel geführt;
- Gestenausschläge gegenüber der ersten Fixture typischerweise um etwa
  15–25 % reduziert;
- rechte Hand als dominante Erklärungsgeste, linke Hand als dominante
  Kontrast- und Einladungsgeste; die jeweils andere Hand bleibt ruhig;
- Blick-/Kopfbewegung führt die verzögert einsetzende Armbewegung, anschließend
  erfolgt eine weiche Rückkehr in neutral statt Pose-Snapping;
- `smootherstep`-Easing, 720-ms-Gestenübergang, 780-ms-Oberkörperübergang und
  sehr kleine Atem-/Idle-Amplitude;
- zwei kurze Blinkfenster und zurückhaltend eingeblendete Aussagekarten.

Die feste Timeline bleibt `0–2 s neutral_idle`, `2–4 s explaining`,
`4–6 s showing_contrast` und `6–8 s inviting_participation`.

## Reproduzierbare Evidence

Der Exact-Head-Renderer
`apps/web/scripts/render-voxy-animatable-rig-evidence.ts` erzeugt:

- ein 8,000-s-MP4 und WebM in 1280 × 720, 24 fps und 192 Frames;
- vier revisionsgebundene Standframes pro Format in `16:9`, `9:16` und `1:1`;
- gerenderte Crops beider Hände für jeden Standframe;
- fünf gerenderte SVG-Digit-Center als landmark-äquivalente Evidence je Hand;
- pixelbasierte Hand-Präsenz- und Crop-Safe-Prüfung;
- SHA256 für beide Clips, Referenz, Rig, Motion-Profil, Standframes und
  Hand-Crops;
- Exact Head, Timeline, Renderparameter und die expliziten Zustände
  `humanVisualAcceptance = pending`, `productionEligible = false` und
  `autoPublish = false`.

Der Workflow `.github/workflows/voxy-animatable-rig-evidence.yml` rendert und
lädt dieses Verzeichnis als Exact-Head-Artefakt hoch. Der lokale Smoke ist keine
Selbstfreigabe und ersetzt den unabhängigen Detector-/200-%-Checkpoint aus
`#588` nicht.

## Gegenprüfung mit #588@0756ad48

Der unveränderte, vollständig lokale Detector
`voxy_raster_silhouette_hand_landmarker@2.0.0` mit Runtime
`pure-typescript-rgba-pca-v2` und Modellprofil
`voxy-rotation-normalized-open-palm-profile-v2` aus dem finalen #588-Exact-Head
`0756ad48bfd61cf88696f91bc41da87e988020c0` wurde gegen alle 24 echten
Hand-Crops der vier Gesten in `16:9`, `9:16` und `1:1` ausgeführt.
Profil-SHA256:
`75ae283ba8eea2e5637f2d9c373d333132086f99f5a6b7194dcbdb8a82b25f4c`.

- getestet: 24;
- erkannt/akzeptiert: 24;
- blockiert: 0;
- Fingerzahl: durchgehend 5;
- Confidence: durchgehend `1.0`;
- ermittelte Originalrotationen: `-70°` bis `+60°`;
- Rotationsnormalisierung: für alle 24 Crops angewendet;
- kein Threshold wurde abgesenkt und keine QA-Ausnahme ergänzt.

Die unveränderten #588-Vertragstests wurden direkt aus diesem Exact Head
ausgeführt: 25 Tests sind grün. Rotierte 4- und 6-Finger-Evidence,
unzureichende Confidence, Cropverlust, fehlende Hand und beschädigte Provenienz
bleiben fail-closed. Das technische Detector-Gate ist damit für diese Fixture
erfüllt; die menschliche visuelle Abnahme bleibt davon ausdrücklich unberührt.

## Bekannte visuelle Grenzen

- Die native Vektorfigur ist eine kontrollierbare, stilisierte Ableitung der
  akzeptierten 3D-Referenz; eine pixelidentische 3D-Rekonstruktion ist sie nicht.
- Mundbewegung und Lip-Sync sind bewusst nicht enthalten.
- Die Handformen bleiben starr und werden über Arm-/Hand-Pivots bewegt; Finger
  werden in dieser Fixture nicht einzeln deformiert.
- Human Visual Acceptance muss insbesondere Wiedererkennbarkeit, Handanschluss,
  Gestenruhe, Gesicht und Markenabstand bewerten.
- Der Detector prüft die relevanten offenen Hände dieser Fixture, bewertet aber
  weder Charakteridentität noch Natürlichkeit, Timing oder Gesamtkomposition.

## Status und Grenzen

- technischer Zustand nach Exact-Head-Render und grünen Checks: `review`;
- Human Visual Acceptance: `pending`;
- PR bleibt Draft;
- kein Merge, kein Ready-for-Review, kein Deployment und kein Publishing.
