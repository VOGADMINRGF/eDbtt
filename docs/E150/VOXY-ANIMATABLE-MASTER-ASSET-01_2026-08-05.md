# VOXY-ANIMATABLE-MASTER-ASSET-01

Stand: 2026-08-15

## Verbindlicher visueller Review-Stand

Der technisch grüne Motion-Stand aus Exact Head
`7f0ad050e4079b823c3bb6c7b2ef5fc991b662cb` wurde menschlich visuell
abgelehnt. Die Detector-, Render- und Format-Evidence dieses Stands bleibt als
technischer Nachweis erhalten, ist aber keine akzeptierte Voxy-Identität und
keine Grundlage für weitere Animation oder Production.

Die anschließende menschliche Entscheidung akzeptiert am statischen Exact Head
`ecba53e4167a6382d16dc2dda25c2f162dab8162` A als Primary Master und C als
Editorial-/Anlass-Variante. B ist verworfen und kein Produktionskandidat. Die
Human Visual Acceptance des statischen Masters ist damit abgeschlossen und ein
kontrollierter Animationstest darf beginnen. Das ist keine Acceptance der
neuen Motion-Ausgabe und keine Production-Freigabe.

Der Slice bindet die vier menschlich freigegebenen Canon-Boards aus
`apps/web/public/brands/voxy/references/canon/` als unveränderte visuelle SSOT:

- `CANON-01-character-development-board.png` — Charakter-, Gesichts-,
  Anatomie- und Detailkontrolle,
  SHA256 `e58f4f5a6b23d8da6ccd81d979057f1b6f8ce8ae22eeba7032a2fb417a2c8bcc`;
- `CANON-02-character-overview-board.png` — Charakter-, Hand- und
  Ganzkörperkontrolle,
  SHA256 `e881e2c0e698f70eeb71ed78a021c5ef6bab8d37d52277e00a08e2f7ed9a8fe7`;
- `CANON-03-teal-broadcast-layout.png` — Studio-, Licht- und
  Broadcast-Kompositionskontrolle,
  SHA256 `479caf603da577009318beda49b4e0dc61f79c70e6bdb9fed820d448767aaded`;
- `CANON-04-blue-broadcast-layout.png` — identische Voxy-/Studio-Pixelquelle
  für Primary A und Editorial C sowie Studio-/Layoutkontrolle,
  SHA256 `8ec3927f2871b210f46468f56a2845811c89dbb971c11bf086de7446ac0efff8`.

Der lokale Renderer
`apps/web/scripts/render-voxy-static-canon-recovery.ts` erzeugt unter
`artifacts/voxy-static-canon-final/` zwei statische 16:9-Master in 1920 × 1080,
einen optionalen Clean Master und eine 3200 × 1800 große Vergleichstafel:

- `primary-a-final.png` — ausgewählter Primary Master A;
- `primary-a-clean.png` — derselbe Primary Master ohne redaktionellen
  Beispielinhalt;
- `editorial-c-final.png` — ausgewählte Editorial-/Anlass-Variante C;
- `canon-comparison-final.png` — A final, C final und alle vier Canon-Boards;
- `manifest.json` — Exact Head, sämtliche Input-/Output-SHA256, Dimensionen,
  Produktionsmethode, Auswahl, Abweichungen und Freigabegrenzen.

A und C verwenden exakt dieselbe abgeflachte CANON-04-Voxy-/Studio-Pixelquelle,
dieselbe Kamera, Licht-, Marken-, Typografie- und Materialbehandlung. Nur die
native Inhaltszonenarchitektur unterscheidet sich. Voxy ist größer und enger in
eine ruhigere Broadcast-/Editorial-Fläche integriert; generische Dashboard-
Cards, harte Maskenkanten und die frühere doppelte Waveform entfallen. Genau
eine statische Waveform bleibt hinter Voxy. Sie ist als künftig
audio-reaktionsfähig markiert, aktuell aber nicht audio-reaktiv; Audioanalyse ist
nicht Teil dieses Slices.

Der Lauf bleibt vollständig lokal, nutzt weder Generierung noch externen Dienst,
Upload oder SaaS und lädt sein Exact-Head-Artefakt für mindestens 14 Tage hoch.
Die statische A/C-Auswahl ist menschlich akzeptiert. Jede neue Motion-Ausgabe
beginnt erneut mit `humanVisualAcceptance = pending`; `productionEligible` und
`autoPublish` bleiben `false`.

## Erster kontrollierter Explainer aus Primary A

Der neue revisionsgebundene Renderer
`apps/web/scripts/render-voxy-first-explainer-video.ts` nutzt ausschließlich die
akzeptierte CANON-04-Pixelquelle und die etablierte Primary-A-Kamera. Er baut
weder das abgelehnte SVG-Rig noch einen neuen Charakter oder ein neues Studio.
Die VOG-Anstecknadel und die eDebatte-Pocket-Markierung werden vor der
Bewegungscomposition durch die lokalen nativen SVG-Assets `vog-pin.svg` und
`edebatte-pocket-mark.svg` mit exakt den Texten `VOG` und `eDebatte` überlagert.

Der V2-Clip ist 16 Sekunden lang, 1920 × 1080 Pixel groß, hat 24 fps und 384
Frames. Seine Timeline lautet:

- 0–2 s: Voxy stellt sich mit `Ich bin Voxy.` vor und eröffnet mit der Frage,
  was nach der Wahl geschieht;
- 2–5 s: Vote4Gov als Denk- und Reflexionsebene / Warum;
- 5–9 s: eDebatte als Instrument / Was mit Themen, Argumenten, Quellen und
  nachvollziehbarer Beteiligung;
- 9–13 s: VoiceOpenGov als Bewegung / Wie;
- 13–16 s: Voxy verbindet Warum, Was und Wie und kehrt in neutral zurück.

Die V2-Komposition führt die Abfolge als zurückhaltenden Social Hook mit
`DU WÄHLST. / UND DANN?`, den drei Warum-/Was-/Wie-Ebenen und dem Abschluss
`NICHT GLAUBEN. NACHVOLLZIEHEN.`. Voxy bleibt dabei die Hauptfigur; die
Editorial-Zone ersetzt weder Charakter noch Studio.

Die akzeptierte Quelle ist ein abgeflachtes Raster und besitzt keine getrennten
Kopf-, Arm- oder Handebenen. Um Identität und Anatomie nicht durch einen neuen
Masken-/Crop-Versuch zu beschädigen, beschränkt sich der kontrollierte Test auf
vier sparsame lokale Blink-Overlays und weich eingeblendete Editorial-/Caption-
Übergänge. Eine unabhängige Kopfbewegung und die geforderte kontrollierte
Handgeste sind in diesem Master technisch nicht belastbar möglich. Diese
Abweichung wird im Manifest und für die erneute menschliche Prüfung offen
geführt.

Die Ausgabe enthält MP4, WebM, Preview, fünf gebundene Standframes, zehn
Hand-Crops, je fünf 9:16- und 1:1-Evidencebilder, Manifest sowie deutsche VTT-
und SRT-Captions. Die Untertitel sind zusätzlich eingebrannt. Genau eine
statische Waveform bleibt hinter Voxy.

PR #590 bleibt ein separater Draft und stellt noch kein lizenzsauberes lokales
TTS-Audioergebnis bereit. Der Clip enthält deshalb bewusst keine Audiospur; das
Manifest dokumentiert den fehlenden Voice-Baustein statt Audioerfolg zu
simulieren. Kein Provider, externer Upload oder SaaS-Pfad wird genutzt.

## #588-Cross-Check des Explainers

Der Renderer lädt den unveränderten Detector aus #588-Exact-Head
`0756ad48bfd61cf88696f91bc41da87e988020c0` direkt aus dem lokalen Git-Objekt
und bindet Detector-, License-Contract- und Profil-SHA256. Die gefalteten Hände
des akzeptierten Primary A sind keine getrennt sichtbaren Open Palms. Deshalb
kann dieser Detector die geforderte Sichtbarkeit von fünf Fingern pro Hand
nicht belastbar bestätigen. Alle zehn realen Standframe-Crops werden geprüft,
aber unabhängig von einem zufälligen Roh-Detektorergebnis als
`not_open_palm_clasped_hands` und `blocked_human_review_required` geführt.
Thresholds bleiben unverändert, es gibt keine QA-Ausnahme und niemals einen
statischen Fünf-Finger-Fallback. Die Negative-Fixtures des revisionsgebundenen
#588-Detectors bleiben unverändert fail-closed.

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

- Die statischen finalen Master verwenden eine abgeflachte Canon-04-Pixelquelle
  und sind noch kein separates, geschichtetes 3D- oder Rig-Masterasset.
- Pose und Grundlicht sind deshalb zwischen A/C gebunden; Figur und Studio
  können noch nicht unabhängig voneinander verändert werden.
- Die nativen redaktionellen Text- und Inhaltsflächen sind Review-Platzhalter;
  die in der Canon-Rasterquelle eingebrannten Beispieltexte werden vollständig
  abgedeckt, nicht als Produktcopy übernommen.
- Die native Vektorfigur ist eine kontrollierbare, stilisierte Ableitung der
  Canon-Referenz; sie wurde menschlich visuell abgelehnt und ist keine aktuell
  akzeptierte 3D-Rekonstruktion.
- Mundbewegung und Lip-Sync sind bewusst nicht enthalten.
- Die Handformen bleiben starr und werden über Arm-/Hand-Pivots bewegt; Finger
  werden in dieser Fixture nicht einzeln deformiert.
- Human Visual Acceptance muss insbesondere Wiedererkennbarkeit, Handanschluss,
  Gestenruhe, Gesicht und Markenabstand bewerten.
- Der Detector prüft die relevanten offenen Hände dieser Fixture, bewertet aber
  weder Charakteridentität noch Natürlichkeit, Timing oder Gesamtkomposition.

## Status und Grenzen

- Motion-Stand `7f0ad050e4079b823c3bb6c7b2ef5fc991b662cb`:
  `humanVisualAcceptance = rejected`;
- Primary A und Editorial C am statischen Head
  `ecba53e4167a6382d16dc2dda25c2f162dab8162`:
  `humanVisualAcceptance = accepted`;
- Variante B: `rejected`, nicht im finalen Artefakt enthalten und nicht für
  Production vorgesehen;
- technischer Taskzustand nach Exact-Head-Render und grünen Checks maximal:
  `review`;
- kontrollierter Animationstest: erlaubt; neue Motion-Ausgabe:
  `humanVisualAcceptance = pending`;
- `productionEligible = false` und `autoPublish = false`;
- PR bleibt Draft;
- kein Merge, kein Ready-for-Review, kein Deployment und kein Publishing.
