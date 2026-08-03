# VOXY-CHARACTER-MOTION-FIXTURE-RENDER-01

Stand: 2026-08-03  
Status: `review`  
Master: Issue #310  
PR: #558  
Exact Head: `ac4b8cc03808aaae5eeef90a48f4fa3193b3621b`

## Ergebnis

Der erste reproduzierbare Voxy-Character-Motion-Pfad ist technisch umgesetzt
und als reale Videodatei verifiziert.

Er verwendet das vorhandene kanonische Studioasset, erzeugt kontrollierte
Character-Motion ohne fotorealistischen Lip-Sync und benötigt weder HeyGen noch
einen externen Avatar-, Voice-, Render- oder Social-Provider.

Die Sequenz bildet das vereinbarte Zielbild ab:

- Voxy sitzt als eindeutig digitale Moderatorfigur im Podcast-/Nachrichtenstudio.
- Quellenstand, Gegenposition und offene Frage erscheinen als getrennte Karten.
- Kamera-Push, Licht, Wellenform und Character-Layer erzeugen Bewegung.
- Die Figur spricht nicht über simulierte Lippenbewegungen.
- Der Inhalt bleibt bei Fakten, Evidenzen, Updates und Follow-ups.
- Politische Interpretation und Handlungsempfehlungen sind deaktiviert.
- Keine Veröffentlichung erfolgt ohne Review.

## Implementierte Dateien

### Additive moderne Character-Contracts

`apps/web/src/features/voxyVideo/modernCharacterContracts.ts`

Enthalten:

- Lifecycle von `draft` bis `published`
- erlaubte Statusübergänge
- getrennte Render- und Publish-Gates
- Original-, Arbeits- und Ausgabesprache
- Formate `16:9`, `9:16` und `1:1`
- Motion-Zustände:
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
`apps/web/src/features/voxyVideo/contracts.ts` bleibt unverändert. Bestehende
V3-Verträge, Builder, Noop-Pfade und Review-Surfaces werden nicht ersetzt.

### Deterministischer Fixture-Plan

`apps/web/src/features/voxyVideo/characterMotionFixture.ts`

Vertrag:

- Dauer: exakt `8.000` Sekunden
- Framerate: exakt `24 fps`
- Frames je Ausgabe: exakt `192`
- Szenen:
  1. Opening
  2. Quellenstand
  3. Gegenposition
  4. Offene Frage
  5. Closing
- `editorialMode: facts_updates_only`
- `politicalInterpretationAllowed: false`
- `recommendationsAllowed: false`
- `reviewRequired: true`
- `autoPublish: false`
- `lipSync: false`

Der Validator blockiert Timeline-Lücken, Überlappungen, fehlende Quellen,
ungültige Motion-/Ausdruckszustände, Lip-Sync, Auto-Publish und fehlende
Quellenhinweise.

### Standalone Studio-Composition

`apps/web/src/features/voxyVideo/characterMotionFixtureHtml.ts`

Die Composition verwendet:

- `voxy-podcast-stage.png`
- statische Studioebene
- weich maskierte Character-Layer
- kontrollierte Motion-Transforms je Szene
- Quellen-, Gegenpositions- und Fragekarten
- On-Air-Kennung
- animierte Wellenform
- Lower Third und Transparenzhinweis
- Safe-Area-Anpassung für Querformat, Hochformat und Quadrat
- `prefers-reduced-motion`-Fallback

Für Videoausgaben unterstützt der Renderer zusätzlich einen pausierten,
zeitgenauen Capture-Modus. Jede Einzelaufnahme wird auf einen exakten Zeitpunkt
der kanonischen Timeline gesetzt.

### Exakter lokaler Renderer

`apps/web/scripts/render-voxy-character-motion-fixture.ts`

Der Renderer:

1. validiert den Plan,
2. bettet das vorhandene Studioasset lokal ein,
3. öffnet eine Playwright-/Chromium-Composition,
4. erzeugt für jeden Zeitpunkt exakt ein PNG-Frame,
5. rendert bei 24 fps genau 192 Frames,
6. komponiert die Framefolge mit FFmpeg als H.264-MP4 oder VP9-WebM,
7. schreibt dasselbe Plan-JSON als Render-Manifest,
8. führt weder Upload noch Publishing aus.

Dadurch hängt Dauer und Framerate nicht von der Geschwindigkeit einer
Browseraufnahme oder CI-Maschine ab.

## Renderbefehle

16:9:

```bash
pnpm -w exec tsx apps/web/scripts/render-voxy-character-motion-fixture.ts \
  --format=16:9 \
  --output=artifacts/voxy-character-motion-fixture-16x9.mp4
```

9:16:

```bash
pnpm -w exec tsx apps/web/scripts/render-voxy-character-motion-fixture.ts \
  --format=9:16 \
  --output=artifacts/voxy-character-motion-fixture-9x16.mp4
```

1:1:

```bash
pnpm -w exec tsx apps/web/scripts/render-voxy-character-motion-fixture.ts \
  --format=1:1 \
  --output=artifacts/voxy-character-motion-fixture-1x1.mp4
```

Nur HTML und JSON:

```bash
pnpm -w exec tsx apps/web/scripts/render-voxy-character-motion-fixture.ts \
  --format=16:9 \
  --output=artifacts/voxy-character-motion-fixture-16x9.webm \
  --html-only
```

## Automatisierter GitHub-Artifact-Pfad

Workflow:

`.github/workflows/voxy-character-motion-fixture.yml`

Der Workflow erzeugt alle drei MP4-Formate und lädt sie ausschließlich als
Review-Artefakt hoch. Er benötigt keine Secrets und ruft keinen externen
Content- oder Publishing-Provider auf.

## Ausgeführte Evidence

### Fokussierter Fixture-Workflow

GitHub Actions Run: `30856811786`  
Ergebnis: `success`

Erfolgreiche Schritte:

- Workspace-Installation
- Chromium und FFmpeg
- beide fokussierten Contract-Suiten
- Render `16:9`
- Render `9:16`
- Render `1:1`
- Upload des Review-Artefakts

Artifact:

- ID: `8872911201`
- Name: `voxy-character-motion-fixture`
- Digest: `sha256:7df5d279484afe95356ebaf97e6f2799d0e6f0aff27b46994d66078f0bcb7d9a`
- Aufbewahrung bis 2026-08-17

### Reale Mediendaten

Alle drei erzeugten MP4-Dateien wurden mit `ffprobe` geprüft:

| Format | Auflösung | Framerate | Dauer | Frames |
| --- | ---: | ---: | ---: | ---: |
| 16:9 | 1280 × 720 | 24 fps | 8,000 s | 192 |
| 9:16 | 720 × 1280 | 24 fps | 8,000 s | 192 |
| 1:1 | 1080 × 1080 | 24 fps | 8,000 s | 192 |

### Sichtprüfung

Geprüft wurden Opening, Quellenstand, Gegenposition, offene Frage und Closing in
16:9 sowie repräsentative Frames in 9:16 und 1:1.

Ergebnis:

- Voxy bleibt klar als digitale Figur erkennbar.
- Kopf, Mikrofon, Karten und Lower Third sind in allen drei Formaten nutzbar.
- Quellenstand, Gegenposition und offene Frage sind lesbar getrennt.
- Es entsteht keine behauptete oder simulierte Lippen-Synchronität.
- Der vertikale Crop ist deutlich näher, aber funktional und social-tauglich.
- Es gibt keinen Upload-, Publish- oder Social-Side-Effect.

### Web CI

GitHub Actions Run: `30856811879`  
Ergebnis: `success`

- Web security: grün
- Web contracts: grün
- Web quality einschließlich Lint, Typecheck und Production Build: grün

Vercel ist für diesen technischen Artifact-Slice kein Abnahmekriterium. Es wurde
keine neue öffentliche App-Route und kein Production-Deployment aktiviert.

## Tests

Neue fokussierte Tests:

- `apps/web/tests/voxy-video-modern-character.contract.test.ts`
- `apps/web/tests/voxy-character-motion-fixture.contract.test.ts`

Abgedeckt werden:

- Lifecycle und ungültige Übergänge
- Render- und Publish-Gates
- drei Ausgabeformate
- exakte 192-Frame-Basis
- zeitgenauer pausierter Capture-Modus
- zusammenhängende Timeline
- Quellen-/Gegenpositionspflicht
- sichtbare Providerfehler
- kein Lip-Sync
- kein HeyGen im Feature-Kern
- keine politische Interpretation oder Empfehlung
- kein Auto-Publish
- Reduced-Motion-Fallback

## Reale Grenze

Das aktuelle Ausgangsasset ist ein fertiges Rasterbild. Der Fixture kann Voxy
bereits glaubwürdig beleben, aber keine vollständig unabhängige Kopf-, Augen-,
Arm- oder Handanimation erzeugen.

Für diese spätere Qualitätsstufe wird ein freigegebenes Master-Asset mit
getrennten SVG-/PSD-/Puppet-Ebenen benötigt. Das blockiert den jetzt
funktionierenden Kurzclip nicht.

## Folgeaufgaben

- Issue #567: `VOXY-VOICE-AND-CAPTION-FIXTURE-01`
  - Status: `codex_ready_after_merge:#558`
- Issue #568: `VOXY-LOCAL-COMPOSITION-RUNTIME-01`
  - Status: `codex_ready_after_merge:#558`
- Issue #569: `VOXY-ANIMATABLE-MASTER-ASSET-01`
  - Status: `needs_asset_decision`

## Abschlussbewertung

`VOXY-CHARACTER-MOTION-FIXTURE-RENDER-01` ist technisch vollständig umgesetzt,
CI-grün und durch reale Videoartefakte belegt. Der PR bleibt bewusst Draft und
im Status `review`, bis die menschliche Produktentscheidung über den sichtbaren
Look und den Merge getroffen ist.

Die vollständige automatisierte News-/Dossier-/Voice-/Publishing-Pipeline bleibt
ein eigener Folgepfad. Dieser Slice aktiviert sie ausdrücklich nicht.
