# VOXY-HOMEPAGE-REFERENCE-FILMS-01 — Root-Cause Compositing V3.10.5

- Datum: 2026-08-24
- Task: `VOXY-HOMEPAGE-REFERENCE-FILMS-01`
- Branch: `pr/voxy-homepage-reference-films-01`
- Draft-PR: `#624`
- Implementierungs-, Proof- und Render-Exact-Head: `0a751a83a918b80bd1e74a4450ca25c2de87e57c`
- Status: `review`; Human Visual/Film Final Acceptance bleibt `pending`

## Scope und Freeze

V3.10.5 ersetzt die verworfenen film- und schulterlokalen V3.10.4-Reparaturen durch eine gemeinsame strukturelle Trennung von bewegtem Kopf und kanonischem Body. Derselbe Fix gilt in der Produktionspipeline für eDebatte und VoiceOpenGov.

Unverändert blieben D1 und sämtliche Audioquellen, `spokenText` und der `Weg`/`Weeg`-Pronunciation-Fix, Texte, Captions, Szenen, Dramaturgie, eDebatte-Grafiken, VoiceOpenGov-Grafiken und -Typografie, Timing, 2-s-Dwell, 250-ms-Settling sowie Branding. Es gab keine Veröffentlichung, kein Deployment, keine Homepage-Integration und keinen Merge.

## Tatsächliche Root Cause

Der gemeinsame Aufrufpfad beider Filme lautet:

1. `renderVoxyHomepageReferenceFilmFrameHtml`
2. `renderVoxyDualVoicePilotFrameHtml`
3. `renderVoxyMotionV4FrameHtml`
4. `renderVoxyHeadRelativeFaceRig`

Die bewegte Head-Source kam aus dem vollständig abgeflachten kanonischen Stage-Asset:

- Datei: `apps/web/public/brands/voxy/references/derived/CANON-04-pocket-clean.png`
- SHA-256: `5176f19d3de18a34c32c908d93a3277a2715959d491620d21c7129f9d305f5ca`
- native Bounding Box: `1672 × 941 px`
- Alphakanal-Audit: Minimum `255`, Maximum `255`; vollständig opak und ohne Transparenz
- akzeptierte Source-Bounding-Box im `500 × 400 px` Head-Rig: `x=-547.875`, `y=-84.515`, `w=2064`, `h=1161`

Das Asset enthält Hintergrund, Kopf, Hals, beide Schultern, beide Revers, Torso, Pin und Mikrofon. Die alte Architektur verwendete dieses Full-Stage-Raster mehrfach: als statische Grundplatte, als bewegte Head-Platte unter einer groben Clip-Geometrie und als additive `neck-plate`. Ein Clip begrenzte zwar die sichtbare Fläche, entfernte aber keine Fremdpixel aus der opaken Source. Bei Kopfrotation und -translation konnten so Body-/Hintergrundpixel bis an die Clipkante gelangen. Gleichzeitig blieben statische Kopf-/Tail-Pixel in der Grundplatte und wurden über die ebenfalls aus der Full-Stage-Source gespeiste `neck-plate` erneut eingebracht. Die Überlagerung erzeugte abhängig vom Bewegungsstand die harte vertikale Kante, den dunklen rechteckigen/keilförmigen Bereich und die Unterbrechung von Sakko/Revers.

eDebatte und VoiceOpenGov verwenden dieselbe Funktion `renderVoxyMotionV4FrameHtmlBase` in `apps/web/src/features/voxyVideo/motionV4Html.ts`. Die V3.10.4-Feather-, Strip-, Rectangle-, Hard-Clip- und Body-Gap-Reparaturen behandelten nur einzelne sichtbare Stellen oberhalb dieser gemeinsamen Architektur. Sie konnten weder die opaken Fremdpixel aus dem Source-Asset entfernen noch alle Auslenkungen und beide Marken absichern.

## Vorherige und neue Layerarchitektur

Vorher:

`opake Full-Stage-Grundplatte mit statischem Head/Body → opake Full-Stage-Head-Platte unter grobem Clip → additive opake neck-plate → Face-/Mouth-Layer`

Neu:

`kanonischer Clean-Studio-Untergrund → kanonischer Body-Master mit invers ausgesparter statischer Head-Silhouette → bewegte Head-Source × echte Alpha-Silhouette → unveränderte Face-/Mouth-Layer`

Die gemeinsame Implementierung liegt in:

- `apps/web/src/features/voxyVideo/headAlphaSilhouette.ts`
- `apps/web/src/features/voxyVideo/headRelativeFaceRigHtml.ts`
- `apps/web/src/features/voxyVideo/motionV4Html.ts`

`renderVoxyCanonicalBodyMasterLayer` registriert den kanonischen Body mit `x=-90`, `y=-33.64`, `w=2064`, `h=1161`, entfernt daraus die statische Kopf-/Speech-Bubble-Silhouette und lässt Schulter, Sakko, beide Revers, Hals-/Torsoanschluss, Pin und Mikrofon unverändert aus dem Body-Master bestehen. Unter dem ausgesparten Kopf liegen nur der kanonische Clean-Studio-Hintergrund und die durchgehende dunkle Rollkragenfortsetzung. Der frühere additive `neck-plate`-Renderpfad wurde vollständig entfernt.

`renderVoxyHeadRelativeFaceRig` komponiert die unverändert registrierte akzeptierte Head-Source (`x=-547.875`, `y=-84.515`) über `voxy-canonical-head-alpha-v1`. Die Maske umfasst ausschließlich Speech-Bubble-Kopf, Speech-Bubble-Tail, Kopfhörer und Kopfhörerband. Außerhalb dieser Silhouette beträgt der Beitrag der bewegten Head-Ebene exakt `0`. Face-/Mouth-Offset bleibt `0/0`; Kopf-, Gesichts- und Mundregistrierung wurden gegenüber dem akzeptierten Motion-v4-Stand nicht verschoben.

Es gibt keine CSS-Schulterrechtecke, keine Feather-Strips, keine film-/frame-spezifischen Übermalungen, keine Body-Gap-Patches und keine `neck-plate` mehr.

## Isolierter Movement- und Alpha-Proof vor Full Render

Privater Exact-Head-Proof-Root:

`/Users/RF/Arbeitsmappe/private-assets/voxy/proofs/voxy-homepage-root-cause-compositing-v3-10-5-0a751a83-node20`

Manifest:

`/Users/RF/Arbeitsmappe/private-assets/voxy/proofs/voxy-homepage-root-cause-compositing-v3-10-5-0a751a83-node20/head-alpha-proof-manifest.json`

Manifest SHA-256: `f3260b179b492b0e02dbb07f818bd3be50d6e32ea6da3190b5e9c20507ab13a6`

Der Proof rendert je Film acht Zustände aus derselben Produktionspipeline: früh, Mundöffnung, maximale Auslenkung rechts, Mund offen, Übergangsmitte, maximale Auslenkung links, spät und Zyklusende. Geprüft wurden beide Schultern, beide Revers, Hals-/Torsoanschluss, VOG-Pin und Mikrofonseite.

### eDebatte

- Movement Contact Sheet: `/Users/RF/Arbeitsmappe/private-assets/voxy/proofs/voxy-homepage-root-cause-compositing-v3-10-5-0a751a83-node20/edebatte/movement-contact-sheet.png`
- SHA-256: `9e58807a6395f9473abc776d116b292df403b91229c8c21f04cdef7bb2473129`
- Alpha-/Layer-Contact-Sheet: `/Users/RF/Arbeitsmappe/private-assets/voxy/proofs/voxy-homepage-root-cause-compositing-v3-10-5-0a751a83-node20/edebatte/alpha-layer-contact-sheet.png`
- SHA-256: `e79741af7564ae6592d60254f779b9c80490ac303368a46a9081fbbfc829cb8f`
- Alpha-only PNG: `/Users/RF/Arbeitsmappe/private-assets/voxy/proofs/voxy-homepage-root-cause-compositing-v3-10-5-0a751a83-node20/edebatte/head-source-alpha-only.png`

### VoiceOpenGov

- Movement Contact Sheet: `/Users/RF/Arbeitsmappe/private-assets/voxy/proofs/voxy-homepage-root-cause-compositing-v3-10-5-0a751a83-node20/voiceopengov/movement-contact-sheet.png`
- SHA-256: `6d4fbd44d7bb6eeccb61ba0497b0930e6528933721b4846a0ad025eb4e9bec38`
- Alpha-/Layer-Contact-Sheet: `/Users/RF/Arbeitsmappe/private-assets/voxy/proofs/voxy-homepage-root-cause-compositing-v3-10-5-0a751a83-node20/voiceopengov/alpha-layer-contact-sheet.png`
- SHA-256: `208370b4bde3d6eef26b713c56bf24d36341a8159b08da9d69ca351a31232c06`
- Alpha-only PNG: `/Users/RF/Arbeitsmappe/private-assets/voxy/proofs/voxy-homepage-root-cause-compositing-v3-10-5-0a751a83-node20/voiceopengov/head-source-alpha-only.png`

Die Alpha-only-PNGs beider Marken sind byteidentisch (`4f64ff8e7c55677b32338bcfae93f7a9b9ff84be7104c8ed7e9549edc04a9164`). Der maschinelle Alpha-Audit ergab jeweils:

- gesamte Head-Ebene: Alpha-Minimum `0`, Maximum `255`, `125710` beitragende Pixel
- verbotener unterer Body-Strip: Maximum `0`, `0` beitragende Pixel
- linke Schulter: Maximum `0`, `0` beitragende Pixel
- rechte Schulter: Maximum `0`, `0` beitragende Pixel
- linker Rand: Maximum `0`, `0` beitragende Pixel

Die diagnostischen Magenta-Layer-Sheets zeigen ausschließlich die bewegte Kopf-/Speech-Bubble-/Kopfhörer-Silhouette. Schulter, Revers, Hals-/Torsoanschluss, Pin und Mikrofonseite erhalten keinen Pixelbeitrag aus der bewegten Head-Ebene.

## Formatregression

16:9, 1:1 und 4:5 wurden an maximaler Links-/Rechtsbewegung über denselben Contract geprüft, ohne unnötige Full-Render:

- eDebatte: `/Users/RF/Arbeitsmappe/private-assets/voxy/proofs/voxy-homepage-root-cause-compositing-v3-10-5-0a751a83-node20/edebatte/format-regression-contact-sheet.png` (`63906ca0b74dd7831776ef5f52c35c04d135526ff929833c71b9cecec7edad64`)
- VoiceOpenGov: `/Users/RF/Arbeitsmappe/private-assets/voxy/proofs/voxy-homepage-root-cause-compositing-v3-10-5-0a751a83-node20/voiceopengov/format-regression-contact-sheet.png` (`698a473b234238ddec15942c236b103214199995ded7d627d06ced6dfffdc72f`)

Beide Kontaktbögen sind frei von Schulter-, Revers-, Hals-/Torso-, Pin- und Mikrofonregressionen.

## 9:16 Full-MP4s

Die Full-Render wurden erst nach bestandenem gemeinsamen Movement-/Alpha-Proof erzeugt.

### eDebatte

- MP4: `/Users/RF/Arbeitsmappe/private-assets/voxy/pilots/voxy-homepage-reference-films-v3-10-5-final-human-review-0a751a83-node20/edebatte/vertical_9_16/voxy-edebatte-homepage-reference-v1.mp4`
- SHA-256: `a5f8875a49249210474f7c1bc5ea31d97fe15816abfb0509cb28f6496eb0120c`
- `1080 × 1920`, 24 fps, H.264, Dauer `69.310 s`, 1.664 Frames
- MP4-dekodiertes Movement-Sheet: `/Users/RF/Arbeitsmappe/private-assets/voxy/pilots/voxy-homepage-reference-films-v3-10-5-final-human-review-0a751a83-node20/full-mp4-movement-evidence/edebatte/full-mp4-movement-contact-sheet.png`
- Movement-Sheet SHA-256: `bd1bdf866e433f2c91687e76b97684c80e0701c102d5ac958dd00c2b8fd24af3`

### VoiceOpenGov

- MP4: `/Users/RF/Arbeitsmappe/private-assets/voxy/pilots/voxy-homepage-reference-films-v3-10-5-final-human-review-0a751a83-node20/voiceopengov/vertical_9_16/voxy-voiceopengov-homepage-reference-v1.mp4`
- SHA-256: `ccffe3b04b8369fe7e05398934533d0d2bbf5f88b4bb801ffac0e222c188cbf8`
- `1080 × 1920`, 24 fps, H.264, Dauer `66.900 s`, 1.606 Frames
- MP4-dekodiertes Movement-Sheet: `/Users/RF/Arbeitsmappe/private-assets/voxy/pilots/voxy-homepage-reference-films-v3-10-5-final-human-review-0a751a83-node20/full-mp4-movement-evidence/voiceopengov/full-mp4-movement-contact-sheet.png`
- Movement-Sheet SHA-256: `ba123a8de8906de2d5cedd5ddd5c9899cc95a239959478b8bf8d82df48682b24`

Die direkt aus den fertigen MP4s dekodierten frühen, maximalen und späteren Bewegungsframes zeigen bei beiden Marken keine harte Kante, keinen dunklen Keil, keine Naht, keinen Patch und keinen Lichtwechsel im Sakko-/Reversverlauf.

## D1-Audio-Preservation

- Voice-ID: `voxy-d1-conversational-dynamic-pr621`
- W1: `parked_not_audible`

Es wurde weder synthetisiert noch prozessiert. Die akzeptierten V3.10.3-Master-WAVs wurden byteidentisch übernommen:

- eDebatte WAV SHA-256 alt/neu: `7f63aa0598d54052024782a1364cff91500088e24eeca5c48d5c561d1e59dd0e`
- VoiceOpenGov WAV SHA-256 alt/neu: `26aed1a4409483ee249e9349c3779f5447b8b2069176ba8f8c14a2fe343e7be3`
- eDebatte dekodierter MP4-Audiostream SHA-256 alt/neu: `d3dbff5fcf04feef9412f0833220ecf746637182698aa756e396883f3027ef14`
- VoiceOpenGov dekodierter MP4-Audiostream SHA-256 alt/neu: `d9c402e5ee842fdc5a78ae642296ad192d3b1a330234a6389e4a7c6eebfb8693`

Damit blieben D1, die akzeptierte `Weg`-Aussprache und die gesamte Caption-/Audio-Timeline unverändert.

## Technische Gates

- 19 fokussierte Contract-Suites / 154 Tests: PASS
- produktionsnahe Mouth-Canon- und Mouth-v4.1-Gates am Exact Head: PASS
- `pnpm -C apps/web typecheck`: PASS
- `pnpm -C apps/web lint`: PASS
- `git diff --check`: PASS
- Full-Render-Gates je Film: `audioPreservationGate`, `visualCanonGate`, `motionIntegrityGate`, `evidenceIntegrityGate`, `sourceIntegrityGate`, `contextIsolationGate`: PASS
- Privacy: private Artefakte außerhalb von Git; kein Upload
- `productionEligible = false`
- `autoPublish = false`
- `humanHomepageFilmAcceptance = pending`
- `humanNews5VisualAcceptance = pending`

Der technische Kandidat ist bereit für die erneute menschliche Sichtprüfung. Der Task und PR `#624` bleiben bis zur expliziten Human Final Acceptance auf `review`.
