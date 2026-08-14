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

## Reproduzierbare Evidence

Der Exact-Head-Renderer
`apps/web/scripts/render-voxy-animatable-rig-evidence.ts` erzeugt:

- ein 8,000-s-MP4 in 1280 × 720, 24 fps und 192 Frames;
- vier revisionsgebundene Standframes pro Format in `16:9`, `9:16` und `1:1`;
- gerenderte Crops beider Hände für jeden Standframe;
- fünf gerenderte SVG-Digit-Center als landmark-äquivalente Evidence je Hand;
- pixelbasierte Hand-Präsenz- und Crop-Safe-Prüfung;
- SHA256 für Clip, Referenz, Rig, Standframes und Hand-Crops;
- Exact Head, Timeline, Renderparameter und die expliziten Zustände
  `humanVisualAcceptance = pending`, `productionEligible = false` und
  `autoPublish = false`.

Der Workflow `.github/workflows/voxy-animatable-rig-evidence.yml` rendert und
lädt dieses Verzeichnis als Exact-Head-Artefakt hoch. Der lokale Smoke ist keine
Selbstfreigabe und ersetzt den unabhängigen Detector-/200-%-Checkpoint aus
`#588` nicht.

## Gegenprüfung mit #588@b2b50745

Der unveränderte Detector
`voxy_raster_silhouette_hand_landmarker@1.0.0` aus dem Exact Head
`b2b50745c594cbd56385b811eecfd18f878e2033` wurde lokal gegen acht echte
`16:9`-Hand-Crops der vier Gesten ausgeführt. Das Ergebnis bleibt korrekt
fail-closed:

- alle acht Crops: `fingerCount = null`, `landmarkCount = 0`;
- sechs Crops: Confidence `0.65`,
  `hand_topology_or_confidence_insufficient`;
- beide Crops der Kontrastgeste: Confidence `0.30`,
  `hand_component_touches_input_boundary`.

Der Detector ist laut eigenem Profil nur für
`upright_open_palm_flat_vector` validiert. Die Fixture bewegt dagegen die
vorhandenen Voxy-Hände seitlich rotiert an ihren Hand-/Arm-Pivots; ein enger
Element-Crop kann die helle Komponente zusätzlich am Rand abschneiden. Deshalb
wurde weder der Confidence-Threshold abgesenkt noch die Rig-Anatomie für den
Detector verbogen.

Kleinste belastbare Folge im unabhängigen `#588`-Scope: Hand-Crops mit
deterministischem Padding erfassen und die Silhouette vor der Topologieprüfung
rotationsnormalisieren, anschließend dieselben Negativ-Fixtures erneut
fail-closed prüfen. Bis dahin ist der #589-eigene Pixel-/Digit-Center-Smoke grün,
der unabhängige #588-Detector-Gate aber offen/blockierend.

## Bekannte visuelle Grenzen

- Die native Vektorfigur ist eine kontrollierbare, stilisierte Ableitung der
  akzeptierten 3D-Referenz; eine pixelidentische 3D-Rekonstruktion ist sie nicht.
- Mundbewegung und Lip-Sync sind bewusst nicht enthalten.
- Die Handformen bleiben starr und werden über Arm-/Hand-Pivots bewegt; Finger
  werden in dieser Fixture nicht einzeln deformiert.
- Human Visual Acceptance muss insbesondere Wiedererkennbarkeit, Handanschluss,
  Gestenruhe, Gesicht und Markenabstand bewerten.
- Der aktuelle #588-Detector kann die seitlich rotierten offenen Hände noch
  nicht belastbar zählen; dieses Gate bleibt fail-closed offen.

## Status und Grenzen

- technischer Zustand nach Exact-Head-Render und grünen Checks: `review`;
- Human Visual Acceptance: `pending`;
- PR bleibt Draft;
- kein Merge, kein Ready-for-Review, kein Deployment und kein Publishing.
