# VOXY-ANIMATABLE-MASTER-ASSET-01

Stand: 2026-08-07

## Ergebnis

Der Voxy-Master besteht in diesem PR nicht mehr nur aus einem Layervertrag. Unter `apps/web/public/brands/voxy/rig/layers/` liegen tatsächliche eigenständige SVG-Ebenen, die vom Renderer `apps/web/scripts/render-voxy-animatable-master.ts` einzeln geladen, nach dem kanonischen Pivot-/Motion-Vertrag transformiert und zu einem realen 8-Sekunden-Video zusammengesetzt werden.

## Reale unabhängige Ebenen

Die kanonischen Layer-IDs aus `VOXY_MASTER_LAYER_IDS` besitzen jeweils eine eigene SVG-Datei unter:

`apps/web/public/brands/voxy/rig/layers/<layer-id>.svg`

Beide Hände besitzen fünf explizite `data-digit`-Elemente. VOG-Pin und eDebatte-Pocket-Mark bleiben getrennte Branding-Layer. Waveform und Logo-Zone bleiben getrennte Dateien und Z-Ebenen. Die Branding-Layer enthalten keine SVG-`<text>`-Elemente oder eingebrannte Schrift; die Markenformen liegen als Vektorpfade vor. Außer dem Studiohintergrund belegt kein Layer die komplette 1600×1600-Fläche mit einem deckenden Full-Canvas-Rechteck. Keine Viseme- oder Lip-Sync-Ebene wird erzeugt.

## Reale Renderer-Evidence

Workflow: `.github/workflows/voxy-animatable-master-contract.yml`

Reproduktionskommando:

```bash
VOXY_EVIDENCE_COMMIT_SHA=$(git rev-parse HEAD) \
  pnpm -w exec tsx apps/web/scripts/render-voxy-animatable-master.ts \
  --output=artifacts/voxy-animatable-master
```

Im PR-Workflow wird `github.event.pull_request.head.sha` als Evidence-Revision verwendet. Der Workflow installiert Chromium und FFmpeg, rendert 192 Browserframes bei 24 fps und codiert daraus eine echte MP4-Datei mit acht Sekunden Laufzeit.

CI-Artifact: `voxy-animatable-master-<exact-pr-head-sha>`

Exakte Pfade darin:

- `artifacts/voxy-animatable-master/voxy-layered-master-8s-16x9.mp4`
- `artifacts/voxy-animatable-master/crop-safe-16x9.png`
- `artifacts/voxy-animatable-master/crop-safe-9x16.png`
- `artifacts/voxy-animatable-master/crop-safe-1x1.png`
- `artifacts/voxy-animatable-master/theme-edebatte-frame-4s.png`
- `artifacts/voxy-animatable-master/theme-vog-member-frame-4s.png`
- `artifacts/voxy-animatable-master/evidence-manifest.json`

Das Manifest enthält den Exact-Head-SHA, SHA-256 aller 23 Layerdateien, einen Digest des vollständigen Layer-Sets, SHA-256 des Videos, der Theme-Previews und der Crop-Captures sowie per `ffprobe` gemessene Dauer/Dimensionen/FPS.

## Beide Themes sind real renderbar

Der Renderer lädt dieselben 23 Dateien und dieselben Pivotpunkte für `edebatte` und `vog_member`. Die im Vertrag gespeicherten Theme-Werte werden vor dem Browserrender in konkrete SVG-Farben aufgelöst. Für `vog_member` wird der CSS-Vertragswert `linear-gradient(...)` nicht als SVG-Fill weitergereicht: die zwei Hex-Farben werden als konkrete Jacket-Stops extrahiert und auf Body-/Arm-Layer angewendet. Der Workflow erzeugt je Theme einen realen Chromium-Capture bei 4,0 Sekunden und prüft dessen SHA-256.

## Crop- und Safe-Area-Nachweis

Die drei Crop-PNGs stammen aus demselben Layer-Renderer bei 4,0 Sekunden. Der Rig wird innerhalb des 1280×720-Stages zentral und crop-sicher gehalten; `9:16` und `1:1` werden als reale Center-Crops desselben 16:9-Frames erzeugt. Die türkise gestrichelte Linie markiert die jeweilige Safe Area. Kopf, beide Hände, VOG-Pin, eDebatte-Pocket-Mark und Mikrofon bleiben dadurch im tatsächlichen 9:16-Frame sichtbar; der frühere abgeschnittene Portrait-Crop wurde korrigiert.

## Provenienz-, Ähnlichkeits- und Markenabstand

Das Evidence-Manifest bindet die Prüfung an die tatsächlichen Dateien: alle 23 Pfade und SHA-256 werden zu `layerSetSha256` zusammengeführt. Die Quelle wird als `repo_authored_standalone_svg_layers` dokumentiert; in diesem Slice werden keine Drittanbieter-Assets importiert. Ähnlichkeits- und Markenabstandsprüfung bleiben als menschliche Sichtprüfung `pending_human_review` und können nicht durch den Renderer selbst freigegeben werden.

## Human Gate

Die Render-Evidence endet absichtlich mit `humanReview.status = pending`. Dieser PR wird nicht durch den Agenten visuell freigegeben. Die finale Sichtabnahme erfolgt durch Ricky anhand des exakten Workflow-Artifacts; jede Änderung am PR-Head erzeugt eine neue revisionsgebundene Evidence.

## Grenzen

- kein Lip-Sync und keine Viseme-Abhängigkeit
- kein Deployment
- kein externer Upload
- kein Publishing
- keine Selbstfreigabe

## Abschlussnachweis

Exact-Head-SHA, Workflow-Run, Artifact-ID, Layer-/Render-/Crop-Hashes und Checkresultate werden nach dem finalen CI-Lauf als PR-Kommentar ergänzt, ohne den geprüften Head erneut zu verändern.
