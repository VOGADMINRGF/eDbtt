# VOXY-HOMEPAGE-REFERENCE-FILMS-01 — V3.10.4 FINAL SURGICAL HUMAN CORRECTION

Datum: 2026-08-23  
Render-Head: `d851551a21e4677d66a8843f7f743ced87c0d671`  
Branch: `pr/voxy-homepage-reference-films-01`  
Draft-PR: `#624`  
Operativer Status: `review`

## Ergebnis und Grenze

Dieser Pass schließt ausschließlich die drei verbliebenen visuellen Human-Review-Punkte: den eDebatte-Schulter-/Ärmelartefakt, die gedrängte VoiceOpenGov-Beschluss-/Prozess-Szene und den zu engen Participation-Core `WIRKSAME MITBESTIMMUNG`. Es wurden keine Texte, Szenen, Dramaturgie, Timings, Voice-Identität oder sonstigen Kompositionen geändert.

Das akzeptierte V3.10.3-D1-Audio wurde weder neu erzeugt noch verarbeitet. `spokenText` und der bestehende spoken-only-`Weeg`-Alias bleiben unverändert. Es gab kein Publishing, Social Posting, Deployment, Homepage-Integration oder Merge. W1 bleibt geparkt. Beide Kandidaten bleiben privat, `productionEligible = false`, `autoPublish = false`; Task und PR bleiben bis zur erneuten menschlichen Sichtprüfung auf `review`.

## 1. eDebatte — Schulter/Ärmel

### Ursache

Der bestehende Head-Rig bewegt eine ausgeschnittene Rasterplatte der kanonischen Voxy-Bühne. Die `head-source-clip`-Maske enthält zur Abdeckung des statischen Kopfes notwendigerweise auch Hintergrundpixel. Im vergrößerten 9:16-Master griff deren untere linke Polygonkante bei Kopfbewegung in den bereits intakten linken Schulter-/Oberarmbereich. Dadurch entstand ein dunkler geometrischer Keil im blauen Sakkoverlauf. Der kanonische Voxy-Master und die darunterliegende Studio-Stage waren intakt; Ursache war ausschließlich die Überlagerungsgeometrie des bewegten Head-Clips.

### Korrektur

Nur für `filmId = edebatte` und `layoutProfile = vertical_9_16` wird der betroffene Schulterstreifen aus derselben kanonischen Quellplatte rekonstruiert:

- Quellbindung: `canonical-left-upper-arm-layer`
- Clip-Pfad im 1920×1080-Master: `(480,450) → (640,392) → (640,500) → (480,500)`
- Feather rechts: volle Deckung bis `x=610`, Ausblendung bis `x=640`
- identische Camera-/Saturation-/Contrast-/Brightness-Regeln und identische Studio-Gradierung wie der Master
- keine Reparaturplatte in VoiceOpenGov, 16:9, 1:1 oder 4:5

Gesicht, Kopf, Körperproportionen, Kleidung, Branding, Mikrofon, Beleuchtung und restliche eDebatte-Komposition bleiben unverändert. Sieben direkt aus dem finalen MP4 extrahierte Zeitpunkte (`1,926 s`, `5,020 s`, `8,114 s`, `23,100 s`, `38,290 s`, `59,468 s`, `67,208 s`) zeigen den durchgehenden Sakko-/Ärmelverlauf über den Film.

## 2. VoiceOpenGov — Beschluss/Prozess

Die vertikale Szene behält Struktur und Textbestand. Ausschließlich 9:16 erhält folgende responsive Korrektur:

- `living-mandate-path`: Höhe `208 px`, Gap `16 px`
- jede `mandate-step`: Höhe `208 px`, Padding `16 px`, Row-Gap `10 px`
- aktuelle Stufe `BESCHLUSS`: `34 px`, Zeilenhöhe `1.08` statt `38 px / 1.02`
- sekundäre Stufen `VERHANDLUNG` und `UMSETZUNG`: `20 px`, Zeilenhöhe `1.1` statt `22 px / 1.05`
- `democratic-loop`: Breite `640 px` statt `660 px`
- `loop-active-label`: Breite `466 px` statt `486 px`

Im finalen MP4 sind `VERHANDLUNG / BESCHLUSS / UMSETZUNG`, `DER WEG GEHT WEITER`, Wirkungspfad und Caption vollständig, ohne Überlauf und als getrennte Informationsgruppen sichtbar. Der direkt extrahierte Abnahmeframe liegt bei `10,338 s`.

## 3. VoiceOpenGov — `WIRKSAME MITBESTIMMUNG`

Die akzeptierte Core-Geometrie und Positionierung bleiben erhalten:

- Participation Core weiterhin exakt `220×168 px`
- dominante Aussage: `22 px`, Zeilenhöhe `1.08`, horizontales Padding `18 px`
- Supporting Copy: maximale Breite `174 px`, Top-Margin `9 px`, `13 px`, Zeilenhöhe `1.3`
- Extremkarten weiterhin `102 px` breit und mit `opacity:.28` klar sekundär

Der direkt aus dem finalen MP4 extrahierte Frame bei `37,480 s` zeigt die Aussage vollständig und ruhig im Core. Presenter-/Face-Safe-Zonen und der Abstand zum Tischmikrofon sind eingehalten; es gibt keine optische Verbindung oder Berührung.

## D1-Audio — byteidentisch und unverändert

Voice-ID beider Filme: `voxy-d1-conversational-dynamic-pr621`.

Der Renderer lief in einem fail-closed Modus `byte_identical_accepted_master`. Er prüfte Quell-Hash, Film-/Layout-/Voice-Manifest und jede Segment-ID/-Dauer, kopierte dann ausschließlich die akzeptierte V3.10.3-Master-WAV und prüfte den Ziel-Hash erneut. `synthesisInvoked = false`, `processingInvoked = false`.

### eDebatte

- V3.10.3- und V3.10.4-Master-WAV: `cmp` byteidentisch
- SHA-256: `7f63aa0598d54052024782a1364cff91500088e24eeca5c48d5c561d1e59dd0e`
- decodierter Audio-Stream des alten und neuen MP4: `e391f261b513520ba66d6ba16d54d2f388474af1af1b592969eaa7444c037b45`

### VoiceOpenGov

- V3.10.3- und V3.10.4-Master-WAV: `cmp` byteidentisch
- SHA-256: `26aed1a4409483ee249e9349c3779f5447b8b2069176ba8f8c14a2fe343e7be3`
- decodierter Audio-Stream des alten und neuen MP4: `685a593193cc904980f61b3cfd6c344258c8e760b0a9a45fd634d6431804b283`

Damit bleibt auch die bereits menschlich akzeptierte D1-Aussprache `Weg` unverändert. Sichtbarer Text und Captions führen weiterhin korrekt `Weg`; der bestehende Voice-/Pronunciation-Layer führt weiterhin ausschließlich spoken-only `Weeg`.

## Private 9:16-Full-MP4s

Privater Root:

`/Users/RF/Arbeitsmappe/private-assets/voxy/pilots/voxy-homepage-reference-films-v3-10-4-final-human-review-d851551a-node20`

### eDebatte

- Datei: `edebatte/vertical_9_16/voxy-edebatte-homepage-reference-v1.mp4`
- absoluter Pfad: `/Users/RF/Arbeitsmappe/private-assets/voxy/pilots/voxy-homepage-reference-films-v3-10-4-final-human-review-d851551a-node20/edebatte/vertical_9_16/voxy-edebatte-homepage-reference-v1.mp4`
- `1080×1920`, H.264, `24 fps`, AAC 48 kHz mono
- Dauer: `69,310 s`
- SHA-256: `0116e1241c07083328a2f141bfb34413b92287ef2098940e9809619a4a38ab9f`
- Renderstatus: `TECHNICAL_PASS`

### VoiceOpenGov

- Datei: `voiceopengov/vertical_9_16/voxy-voiceopengov-homepage-reference-v1.mp4`
- absoluter Pfad: `/Users/RF/Arbeitsmappe/private-assets/voxy/pilots/voxy-homepage-reference-films-v3-10-4-final-human-review-d851551a-node20/voiceopengov/vertical_9_16/voxy-voiceopengov-homepage-reference-v1.mp4`
- `1080×1920`, H.264, `24 fps`, AAC 48 kHz mono
- Dauer: `66,900 s`
- SHA-256: `34849eead2679a34d37b7620a3f9bd861687f034a91bd5a3adff8b501ea13a68`
- Renderstatus: `TECHNICAL_PASS`

Beide Manifeste binden Exact Head `d851551a21e4677d66a8843f7f743ced87c0d671`, D1 `voxy-d1-conversational-dynamic-pr621`, `audioPreservationGate = passed`, `sourceIntegrityGate = passed`, `evidenceIntegrityGate = passed`, `contextIsolationGate = passed`, `motionIntegrityGate = passed`, `visualCanonGate = passed`, `productionEligible = false` und `autoPublish = false`.

## Frame-Evidence und Formatregression

Vorher/Nachher-Evidence der drei Human-Review-Zonen:

`/Users/RF/Arbeitsmappe/private-assets/voxy/pilots/voxy-homepage-reference-films-v3-10-4-final-human-review-d851551a-node20/frame-evidence`

Finale MP4-Extrakte:

- Schulter-Zeitreihe: `frame-evidence/mp4-final/01-edebatte-shoulder-seven-point-contact-sheet.png`, SHA-256 `e4cae5e5e5df431887c9e884e0ca1a923e65f5c91c13a5388cacd8f67f1c95e6`
- VOG-Prozess: `frame-evidence/mp4-final/02-vog-process-at-10.338s.png`, SHA-256 `7c014830d94be3bebb2f3cab29037c864de4eb0fab7448e920a9de63f42f6eda`
- VOG-Participation: `frame-evidence/mp4-final/03-vog-participation-at-37.480s.png`, SHA-256 `085d65b5ff3e07a76077a78a3d434e1aeb5c7dfb730b23c98f43a6aca89a262e`

Format-Proofs:

- 18 fokussierte Preview-Frames und acht Kontaktbögen
- Preview-Manifest SHA-256: `a77524df802151712075654a520b50b2191a2ef5a465aad81ed268c42a75d4df`
- drei eDebatte-Opening-Frames sowie Prozess und Participation in 16:9, 1:1 und 4:5 geprüft
- alle neun nicht vertikalen Kontrollframes pixelidentisch zu V3.10.3
- keine obere Social-Leiste; keine abgeschnittenen Texte
- bestehende 9:16-Safe-Area `top 120 / right 140 / bottom 230 / left 80`
- Mindest-Dwell `2,0 s`, deterministisches Settling `250 ms`, CTA-Dwell und Zwei-Frame-Holds unverändert
- keine Quarter-Second-Flashes und keine Regression von Voxy-Character, VOG-Pins, eDebatte-Marks oder NEWS-5.0-Grammatik

## Contracts, lokale Checks und CI

Auf Render-Head `d851551a21e4677d66a8843f7f743ced87c0d671`:

```text
23 relevante Homepage-/D1-/Voice-/Mouth-/Local-TTS-Vertragsdateien
189 Tests: PASS
pnpm --dir apps/web typecheck: PASS
pnpm --dir apps/web lint: PASS
git diff --check: PASS
private 9:16 Full Render: TECHNICAL_PASS für beide Filme
WAV cmp + SHA-256: BYTE_IDENTICAL für beide Filme
MP4 decoded-audio SHA-256: IDENTICAL zu V3.10.3 für beide Filme
16:9 / 1:1 / 4:5: neun Kontrollframes PIXEL_IDENTICAL
```

Der CI-Stand des bestehenden Draft-PRs wird nach Push dieses Evidence-Commits ergänzt. Es wird kein Merge ausgelöst.

## Offenes menschliches Gate

Der V3.10.4-Kandidat ist technisch für die erneute Human Final Acceptance vorbereitet. Er ist nicht bereits menschlich akzeptiert. Task und PR bleiben `review`; Merge, Homepage-Integration, Batch-Nutzung, Upload, Deployment und Publishing bleiben bis zur ausdrücklichen menschlichen Schlussfreigabe gesperrt.

