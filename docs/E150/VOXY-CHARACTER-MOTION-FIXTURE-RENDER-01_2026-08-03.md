# VOXY-CHARACTER-MOTION-FIXTURE-RENDER-01

Stand: 2026-08-03  
Status: `review`  
Master: Issue #310  
PR: #558

## Ergebnis

Der erste reproduzierbare Voxy-Character-Motion-Pfad ist repo-seitig umgesetzt.
Er erzeugt aus dem vorhandenen kanonischen Studio-Asset eine kurze
Nachrichten-/Podcastsequenz, ohne fotorealistischen Lip-Sync, ohne HeyGen und
ohne externen Avatar-Provider.

Die Sequenz bildet das abgestimmte Zielbild ab:

- Voxy sitzt als digitale Moderatorfigur im Podcast-/Nachrichtenstudio.
- Die Stimme ist technisch getrennt und kann später als Audio zugespielt werden.
- Voxy bewegt sich über kontrollierte Zustände und nicht über simulierte Lippen.
- Quellenstand, Gegenposition und offene Frage werden als eigene Karten gezeigt.
- Die Darstellung bleibt bei Fakten, Evidenzen, Updates und Follow-ups.
- Politische Interpretation und Handlungsempfehlungen sind im Fixture-Vertrag
  ausdrücklich deaktiviert.
- Keine Veröffentlichung erfolgt ohne Review.

## Was konkret implementiert ist

### 1. Additive moderne Character-Contracts

Datei:

`apps/web/src/features/voxyVideo/modernCharacterContracts.ts`

Enthalten:

- Lifecycle von `draft` bis `published`
- erlaubte Statusübergänge
- Render- und Publish-Gates
- getrennte Original-, Arbeits- und Ausgabesprache
- Formate `16:9`, `9:16` und `1:1`
- kontrollierte Motion-Zustände:
  - `neutral_idle`
  - `listening`
  - `explaining`
  - `questioning`
  - `highlighting_source`
  - `showing_contrast`
  - `inviting_participation`
- begrenzte, nicht parteipolitische Ausdrücke
- providerneutrale Voice- und Character-Motion-Interfaces
- sichere Fehlerdarstellung ohne rohe Providerfehler

Die vorhandene kanonische Datei
`apps/web/src/features/voxyVideo/contracts.ts` bleibt unverändert. Damit werden
keine bestehenden V3-Verträge, Builder, Noop-Pfade oder Review-Surfaces ersetzt.

### 2. Deterministischer Fixture-Plan

Datei:

`apps/web/src/features/voxyVideo/characterMotionFixture.ts`

Der Fixture-Plan ist acht Sekunden lang, läuft mit 24 fps und enthält fünf
zusammenhängende Szenen:

1. Opening
2. Quellenstand
3. Gegenposition
4. Offene Frage
5. Closing

Der Validator blockiert unter anderem:

- Timeline-Lücken oder Überlappungen
- fehlende Quellen für Quellen- oder Gegenpositionskarten
- Lip-Sync-Aktivierung
- Auto-Publish
- fehlenden Quellenhinweis
- politische Interpretation oder Empfehlungen
- unzulässige Motion- oder Ausdruckszustände

### 3. Standalone Studio-Composition

Datei:

`apps/web/src/features/voxyVideo/characterMotionFixtureHtml.ts`

Die Composition ist eine eigenständige HTML-/CSS-Sequenz. Sie verwendet:

- das vorhandene `voxy-podcast-stage.png`
- eine statische Studioebene
- weich maskierte Character-Layer für kleine, kontrollierte Bewegungen
- animierte Quellen-/Recherchekarten
- On-Air-Kennung
- Audio-Wellenform als visuelle Begleitung
- Lower Third und Transparenzhinweis
- responsive Komposition für Querformat, Hochformat und Quadrat
- `prefers-reduced-motion`-Fallback

Es wird keine Mundbewegung erzeugt. Die sichtbare Bewegung entsteht durch
Blick-/Körperanmutung, kleine Transformationszustände, Kamera-Push, Karten,
Licht und Rhythmus.

### 4. Lokaler Video-Renderer

Datei:

`apps/web/scripts/render-voxy-character-motion-fixture.ts`

Der Renderer:

1. validiert den Fixture-Plan,
2. bettet das vorhandene Studio-Asset lokal ein,
3. erzeugt eine standalone HTML-Datei,
4. zeichnet die Sequenz über Playwright/Chromium als WebM auf,
5. konvertiert auf Wunsch mit FFmpeg in H.264-MP4,
6. schreibt zusätzlich ein JSON-Manifest,
7. führt weder Upload noch Publishing aus.

### Renderbefehle

16:9 als MP4:

```bash
pnpm -w exec tsx apps/web/scripts/render-voxy-character-motion-fixture.ts \
  --format=16:9 \
  --output=artifacts/voxy-character-motion-fixture-16x9.mp4
```

9:16 als MP4:

```bash
pnpm -w exec tsx apps/web/scripts/render-voxy-character-motion-fixture.ts \
  --format=9:16 \
  --output=artifacts/voxy-character-motion-fixture-9x16.mp4
```

1:1 als WebM:

```bash
pnpm -w exec tsx apps/web/scripts/render-voxy-character-motion-fixture.ts \
  --format=1:1 \
  --output=artifacts/voxy-character-motion-fixture-1x1.webm
```

Nur HTML und JSON, ohne Browseraufnahme:

```bash
pnpm -w exec tsx apps/web/scripts/render-voxy-character-motion-fixture.ts \
  --format=16:9 \
  --output=artifacts/voxy-character-motion-fixture-16x9.webm \
  --html-only
```

Voraussetzungen für echte Videoausgabe:

- Node 20
- installierte Workspace-Abhängigkeiten
- Playwright Chromium
- FFmpeg nur für MP4; WebM benötigt keine separate Systemkonvertierung

## Automatisierter GitHub-Artifact-Pfad

Die Workflow-Datei
`.github/workflows/voxy-character-motion-fixture.yml` erzeugt die drei Formate
und lädt sie ausschließlich als GitHub-Actions-Artefakt hoch.

Der Workflow:

- veröffentlicht nichts,
- ruft keinen Avatar-, Voice- oder Social-Provider auf,
- benötigt keine Secrets,
- erzeugt keine Produktionswahrheit,
- dient nur der visuellen Review.

## Tests

Neue fokussierte Tests:

- `apps/web/tests/voxy-video-modern-character.contract.test.ts`
- `apps/web/tests/voxy-character-motion-fixture.contract.test.ts`

Abgedeckt werden:

- Lifecycle und ungültige Übergänge
- Render- und Publish-Gates
- drei Ausgabeformate
- zusammenhängende Timeline
- Quellen-/Gegenpositionspflicht
- sichtbare Providerfehler
- kein Lip-Sync
- kein HeyGen im Kernpfad
- keine politische Interpretation oder Empfehlung
- kein Auto-Publish
- Reduced-Motion-Fallback

Auszuführen:

```bash
pnpm -C apps/web exec vitest run \
  tests/voxy-video-modern-character.contract.test.ts \
  tests/voxy-character-motion-fixture.contract.test.ts

pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
```

## Reale Reife und Grenzen

### Jetzt vorhanden

- reproduzierbarer kurzer Voxy-Clip
- vorhandene Figur und vorhandenes Studio
- ohne HeyGen
- ohne Lip-Sync
- ohne Webcam oder OBS
- ohne Providerkosten
- drei Social-/Videoformate
- klare Quellen-, Gegenpositions- und Unsicherheitsdramaturgie
- review-first und providerneutral

### Noch kein vollwertiger Figuren-Rig

Das aktuelle Ausgangsasset ist ein fertiges Rasterbild. Dadurch sind Kopf,
Augen, Arme, Hände, Mikrofon und Körper nicht als getrennte Ebenen verfügbar.
Der Fixture-Pfad kann die Figur glaubwürdig beleben, aber keine echte
Gelenk-, Blick- oder Handanimation erzeugen.

Für die nächste Qualitätsstufe wird ein kanonisches, animierbares Master-Asset
benötigt, zum Beispiel als sauber getrennte SVG-/PSD-/Puppet-Ebenen:

- Hintergrund/Studio
- Tisch
- Mikrofon
- Körper
- linker/rechter Arm
- Hände
- Kopf
- Augen offen/geschlossen
- Brauen/Ausdruck
- optional Mund geschlossen in zwei bis drei neutralen Formen, aber kein
  phonetischer Lip-Sync
- Licht-/Screen-Layer

Diese Asset-Arbeit ist keine Voraussetzung für den jetzt vorhandenen Fixture,
sondern für die spätere sichtbar feinere Figur.

## Abnahmekriterien

Der Slice kann nach erfolgreicher CI und menschlicher Sichtprüfung auf `done`
gesetzt werden, wenn:

1. beide fokussierten Tests grün sind,
2. Typecheck und Lint keinen Slice-Fehler zeigen,
3. mindestens das 16:9-Artefakt erfolgreich erzeugt wird,
4. Voxy nicht wie eine reale Person dargestellt wird,
5. keine Lippen-Synchronität behauptet oder simuliert wird,
6. Quellenstand, Gegenposition und offene Frage sichtbar sind,
7. kein automatisches Publishing ausgelöst wird,
8. Desktop-/Mobile-Crops nicht Kopf, Mikrofon oder Karten unbrauchbar
   abschneiden.

## Folgeaufgaben

### Nach Merge direkt `codex_ready`

`VOXY-VOICE-AND-CAPTION-FIXTURE-01`

- vorhandenes oder hochgeladenes Sprecher-Audio anbinden
- Audio-Lautheit normalisieren
- Segmenttimings mit Untertiteln verbinden
- Aussprachewörterbuch vorbereiten
- weiterhin kein Lip-Sync und kein Auto-Publish

`VOXY-LOCAL-COMPOSITION-RUNTIME-01`

- Fixture-Plan und Renderer in persistente Review-/Renderjobs überführen
- idempotente Ausgabe für 16:9, 9:16 und 1:1
- Output-Asset erst nach erfolgreichem Render markieren
- keine Social-Veröffentlichung

### Assetabhängig, nicht blind `codex_ready`

`VOXY-ANIMATABLE-MASTER-ASSET-01`

- benötigt eine menschliche Entscheidung zum finalen Voxy-Look
- benötigt getrennte, rechtlich nutzbare Ebenen
- darf das aktuelle kanonische Aussehen nicht still ersetzen

## Abschlussbewertung

`VOXY-CHARACTER-MOTION-FIXTURE-RENDER-01` ist technisch implementiert und
reviewfähig. Der erste kurze Voxy-Videopfad ist damit nicht mehr nur Roadmap
oder Contract: Er kann lokal und über GitHub Actions als reale Videodatei
erzeugt werden.

Die vollständige automatisierte News-/Dossier-/Voice-/Publishing-Pipeline bleibt
ein eigener Folgepfad. Dieser Slice aktiviert sie ausdrücklich nicht.
