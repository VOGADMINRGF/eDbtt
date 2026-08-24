# VOXY-HOMEPAGE-REFERENCE-FILMS-01 — Root-Cause Compositing V3.10.5

- Datum: 2026-08-24
- Task: `VOXY-HOMEPAGE-REFERENCE-FILMS-01`
- Branch: `pr/voxy-homepage-reference-films-01`
- Draft-PR: `#624`
- Implementierungs-, Proof- und Render-Exact-Head: `e3f8b7396a99dcf1c9680775e843994f3b44aa1f`
- Status: `review`; Human Visual/Film Final Acceptance bleibt `pending`

## Scope und Freeze

V3.10.5 ersetzt die verworfenen film- und schulterlokalen V3.10.4-Reparaturen durch eine gemeinsame strukturelle Trennung von bewegtem Kopf und kanonischem Body. Der Fix gilt in derselben Produktionspipeline für eDebatte und VoiceOpenGov.

Unverändert blieben D1 und sämtliche Audioquellen, `spokenText` und der `Weg`/`Weeg`-Pronunciation-Fix, Texte, Captions, Szenen, Dramaturgie, eDebatte-Grafiken, VoiceOpenGov-Grafiken und -Typografie, Timing, 2-s-Dwell, 250-ms-Settling sowie Branding. Es gab keine Veröffentlichung, kein Deployment, keine Homepage-Integration und keinen Merge.

## Tatsächliche Root Cause

Der gemeinsame Pfad beider Filme lautet:

1. `renderVoxyHomepageReferenceFilmFrameHtml`
2. `renderVoxyDualVoicePilotFrameHtml`
3. `renderVoxyMotionV4FrameHtml`
4. `renderVoxyHeadRelativeFaceRig`

Die bewegte Head-Source kam in `renderVoxyHeadRelativeFaceRig` aus dem vollständig abgeflachten kanonischen Stage-Asset:

- Datei: `apps/web/public/brands/voxy/references/derived/CANON-04-pocket-clean.png`
- SHA-256: `5176f19d3de18a34c32c908d93a3277a2715959d491620d21c7129f9d305f5ca`
- native Bounding Box: `1672 × 941 px`
- Alphakanal-Audit: Minimum `255`, Maximum `255`, also vollständig opak und ohne Transparenz
- registrierte Bounding Box im `500 × 400 px` Head-Rig: `x=-585`, `y=-88.64`, `w=2064`, `h=1161`

Damit enthielt die vermeintliche Head-Source nicht nur Kopf-/Speech-Bubble-Pixel, sondern auch Hintergrund, Hals, beide Schultern, beide Revers, Torso, Pin und Mikrofonpixel. Die frühere grobe Polygon-Clip-Geometrie beschnitt lediglich dieses opake Rechteck. Zusätzlich war die Source gegenüber dem kanonischen Stage-Layer um `+37.125 px` horizontal und `+4.125 px` vertikal fehlregistriert. Bei Kopfrotation und -translation konnten deshalb verschobene Fremdpixel bis an die polygonalen unteren und seitlichen Kanten gelangen. Dort entstanden die harte vertikale Kante, der dunkle Keil und die Unterbrechung von Sakko und Revers.

eDebatte und VoiceOpenGov verwendeten dieselbe fehlerhafte Funktion. Die eDebatte-spezifischen V3.10.4-Feather-/Strip-/Hard-Clip- und Body-Gap-Reparaturen maskierten nur einzelne sichtbare Folgen. Sie konnten die opaken Body-/Hintergrundpixel in der bewegten Source weder entfernen noch VoiceOpenGov strukturell absichern und waren deshalb bei anderen Bewegungsständen nicht zuverlässig.

## Vorherige und neue Layerarchitektur

Vorher:

`kanonischer Full-Stage-Body → opake Full-Stage-Source im bewegten Head-Rig → grobes Polygon/filmbezogener Schulter-Patch → Mund-/Augen-Layer`

Neu:

`kanonischer Full-Stage-Body → bewegte, stage-registrierte Head-Source × echte SVG-Alpha-Silhouette → Mund-/Augen-Layer`

Die kanonische Maske `voxy-canonical-head-alpha-v1` ist in `apps/web/src/features/voxyVideo/headAlphaSilhouette.ts` definiert und umfasst ausschließlich Speech-Bubble-Kopf, Speech-Bubble-Tail, Kopfhörer und Kopfhörerband. `renderVoxyHeadRelativeFaceRig` komponiert die kanonische Source über ein SVG-Alpha-Maskenelement mit `maskUnits="userSpaceOnUse"`. Außerhalb der Silhouette beträgt der Beitrag der Head-Ebene exakt `0`. Hals, beide Schultern, beide Revers, Torso, Pin und Mikrofon stammen dadurch ausschließlich aus dem darunterliegenden kanonischen Master.

Die alte Fehlregistrierung wird einmalig an der gemeinsamen Source-/Face-Rig-Registrierung korrigiert (`x=-37.125`, `y=-4.125`). Es gibt keine CSS-Schulterrechtecke, Feather-Strips, film-/frame-spezifischen Übermalungen oder Body-Gap-Patches mehr. Der Full-Renderer besitzt zusätzlich ein fail-closed Alpha-Compositing-Gate.

## Isolierter Movement- und Alpha-Proof

Privater Proof-Root:

`/Users/RF/Arbeitsmappe/private-assets/voxy/proofs/voxy-homepage-root-cause-compositing-v3-10-5-e3f8b739-node20`

Manifest:

`/Users/RF/Arbeitsmappe/private-assets/voxy/proofs/voxy-homepage-root-cause-compositing-v3-10-5-e3f8b739-node20/head-alpha-proof-manifest.json`

Der Proof rendert je Film acht Zustände aus derselben Produktionspipeline: früh, Mundöffnung, maximale Auslenkung rechts, Mund offen, Übergangsmitte, maximale Auslenkung links, spät und Zyklusende. Geprüft wurden beide Schultern, beide Revers, Hals-/Torsoanschluss, Pin und Mikrofonseite.

### eDebatte

- Movement Contact Sheet: `/Users/RF/Arbeitsmappe/private-assets/voxy/proofs/voxy-homepage-root-cause-compositing-v3-10-5-e3f8b739-node20/edebatte/movement-contact-sheet.png`
- SHA-256: `361a5b718f0ad7e5274a1690c8418fd6df81c1961c8df1cc3248db362da72873`
- Alpha-/Layer-Contact-Sheet: `/Users/RF/Arbeitsmappe/private-assets/voxy/proofs/voxy-homepage-root-cause-compositing-v3-10-5-e3f8b739-node20/edebatte/alpha-layer-contact-sheet.png`
- SHA-256: `bc3166fb6008e7a69da61ff7e02fd4813fe318d82dd933b095c7aed805a2f926`
- Alpha-only PNG: `/Users/RF/Arbeitsmappe/private-assets/voxy/proofs/voxy-homepage-root-cause-compositing-v3-10-5-e3f8b739-node20/edebatte/head-source-alpha-only.png`

### VoiceOpenGov

- Movement Contact Sheet: `/Users/RF/Arbeitsmappe/private-assets/voxy/proofs/voxy-homepage-root-cause-compositing-v3-10-5-e3f8b739-node20/voiceopengov/movement-contact-sheet.png`
- SHA-256: `821310863211b4959e4a2e2e0a7b06f9d77b737080239ecec5430f18ad4b3fc9`
- Alpha-/Layer-Contact-Sheet: `/Users/RF/Arbeitsmappe/private-assets/voxy/proofs/voxy-homepage-root-cause-compositing-v3-10-5-e3f8b739-node20/voiceopengov/alpha-layer-contact-sheet.png`
- SHA-256: `f229090eb9f8267560b0a7a55b41745fd63623a83d16928f1fa58a0a511f6bbf`
- Alpha-only PNG: `/Users/RF/Arbeitsmappe/private-assets/voxy/proofs/voxy-homepage-root-cause-compositing-v3-10-5-e3f8b739-node20/voiceopengov/head-source-alpha-only.png`

Die Alpha-only-PNGs sind für beide Marken byteidentisch (`826779d9f919c0f94f791071a9401517745d9baa55eccb5a11a872964a7df461`). Der maschinelle Alpha-Audit ergab:

- gesamte Head-Ebene: Alpha-Minimum `0`, Maximum `255`, `125926` beitragende Pixel
- verbotener unterer Body-Strip: Maximum `0`, `0` beitragende Pixel
- linker Rand: Maximum `0`, `0` beitragende Pixel
- rechter Rand: Maximum `0`, `0` beitragende Pixel

Die diagnostischen Magenta-Layer-Sheets zeigen ausschließlich die bewegte Kopf-/Speech-Bubble-/Kopfhörer-Silhouette. Schulter, Revers, Hals-/Torsoanschluss, Pin und Mikrofonseite erhalten keinen Pixelbeitrag aus der Head-Ebene.

## Formatregression

16:9, 1:1 und 4:5 wurden an maximaler Links-/Rechtsbewegung über denselben Contract geprüft, ohne unnötige Full-Render:

- eDebatte: `/Users/RF/Arbeitsmappe/private-assets/voxy/proofs/voxy-homepage-root-cause-compositing-v3-10-5-e3f8b739-node20/edebatte/format-regression-contact-sheet.png`
- VoiceOpenGov: `/Users/RF/Arbeitsmappe/private-assets/voxy/proofs/voxy-homepage-root-cause-compositing-v3-10-5-e3f8b739-node20/voiceopengov/format-regression-contact-sheet.png`

Beide Kontaktbögen sind frei von Schulter-, Revers-, Hals-/Torso-, Pin- und Mikrofonregressionen.

## 9:16 Full-MP4s

Die Full-Render wurden erst nach bestandenem gemeinsamen Movement-/Alpha-Proof erzeugt.

### eDebatte

- MP4: `/Users/RF/Arbeitsmappe/private-assets/voxy/pilots/voxy-homepage-reference-films-v3-10-5-final-human-review-e3f8b739-node20/edebatte/vertical_9_16/voxy-edebatte-homepage-reference-v1.mp4`
- SHA-256: `e0097a8c931ca6890139aaff9ef85130754b64a77b709ccf63d7fbb21cbbd24d`
- `1080 × 1920`, 24 fps, H.264, Dauer `69.310 s`
- MP4-dekodiertes Movement-Sheet: `/Users/RF/Arbeitsmappe/private-assets/voxy/pilots/voxy-homepage-reference-films-v3-10-5-final-human-review-e3f8b739-node20/frame-evidence/mp4-head-cycle/edebatte/contact-sheet.png`

### VoiceOpenGov

- MP4: `/Users/RF/Arbeitsmappe/private-assets/voxy/pilots/voxy-homepage-reference-films-v3-10-5-final-human-review-e3f8b739-node20/voiceopengov/vertical_9_16/voxy-voiceopengov-homepage-reference-v1.mp4`
- SHA-256: `d6c65cf93776b87c324c52f55aed644089637240a3345d710bbf51aa089850d3`
- `1080 × 1920`, 24 fps, H.264, Dauer `66.900 s`
- MP4-dekodiertes Movement-Sheet: `/Users/RF/Arbeitsmappe/private-assets/voxy/pilots/voxy-homepage-reference-films-v3-10-5-final-human-review-e3f8b739-node20/frame-evidence/mp4-head-cycle/voiceopengov/contact-sheet.png`

Die aus den fertigen MP4s dekodierten Frames zeigen über die Bewegungszyklen keine harte Kante, keinen dunklen Keil, keine Naht, keinen Patch und keinen Lichtwechsel im Sakko-/Reversverlauf.

## D1-Audio-Preservation

- Voice-ID: `voxy-d1-conversational-dynamic-pr621`
- W1: `parked_not_audible`

Es wurde weder synthetisiert noch prozessiert. Die akzeptierten V3.10.3-Master-WAVs wurden byteidentisch übernommen:

- eDebatte WAV SHA-256 alt/neu: `7f63aa0598d54052024782a1364cff91500088e24eeca5c48d5c561d1e59dd0e`
- VoiceOpenGov WAV SHA-256 alt/neu: `26aed1a4409483ee249e9349c3779f5447b8b2069176ba8f8c14a2fe343e7be3`
- eDebatte dekodierter MP4-Audiostream SHA-256 alt/neu: `e391f261b513520ba66d6ba16d54d2f388474af1af1b592969eaa7444c037b45`
- VoiceOpenGov dekodierter MP4-Audiostream SHA-256 alt/neu: `685a593193cc904980f61b3cfd6c344258c8e760b0a9a45fd634d6431804b283`

Damit blieben D1, die akzeptierte `Weg`-Aussprache und die gesamte Caption-/Audio-Timeline unverändert.

## Technische Gates

- 15 Homepage-Contract-Suites / 129 Tests: PASS
- `pnpm --dir apps/web typecheck`: PASS
- `pnpm --dir apps/web lint`: PASS
- `git diff --check`: PASS
- Full-Render-Gates je Film: `audioPreservationGate`, `visualCanonGate`, `motionIntegrityGate`, `evidenceIntegrityGate`, `sourceIntegrityGate`, `contextIsolationGate`: PASS
- Privacy: private Artefakte außerhalb von Git; kein Upload
- `productionEligible = false`
- `autoPublish = false`
- `humanHomepageFilmAcceptance = pending`
- `humanNews5VisualAcceptance = pending`

Der technische Kandidat ist bereit für die erneute menschliche Sichtprüfung. Der Task und PR `#624` bleiben bis zur expliziten Human Final Acceptance auf `review`.
