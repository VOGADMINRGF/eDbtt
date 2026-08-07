# VOXY-ANIMATABLE-MASTER-ASSET-01

Stand: 2026-08-07

## Ergebnis

Der Voxy-Master besteht in diesem PR nicht mehr nur aus einem Layervertrag. Unter `apps/web/public/brands/voxy/rig/layers/` liegen tatsächliche eigenständige SVG-Ebenen, die vom Renderer `apps/web/scripts/render-voxy-animatable-master.ts` einzeln geladen, nach dem kanonischen Pivot-/Motion-Vertrag transformiert und zu einem realen 8-Sekunden-Video zusammengesetzt werden.

## Reale unabhängige Ebenen

Die kanonischen Layer-IDs aus `VOXY_MASTER_LAYER_IDS` besitzen jeweils eine eigene SVG-Datei unter:

`apps/web/public/brands/voxy/rig/layers/<layer-id>.svg`

Beide Hände besitzen fünf explizite `data-digit`-Elemente. VOG-Pin und eDebatte-Pocket-Mark bleiben getrennte Branding-Layer. Waveform und Logo-Zone bleiben getrennte Dateien und Z-Ebenen. Keine Viseme- oder Lip-Sync-Ebene wird erzeugt.

## Reale Renderer-Evidence

Workflow: `.github/workflows/voxy-animatable-master-contract.yml`

Reproduktionskommando:

```bash
VOXY_EVIDENCE_COMMIT_SHA=$(git rev-parse HEAD) \
  pnpm -w exec tsx apps/web/scripts/render-voxy-animatable-master.ts \
  --output=artifacts/voxy-animatable-master
```

Der Workflow installiert Chromium und FFmpeg, rendert 192 Browserframes bei 24 fps und codiert daraus eine echte MP4-Datei mit acht Sekunden Laufzeit.

CI-Artifact: `voxy-animatable-master-<exact-head-sha>`

Exakte Pfade darin:

- `artifacts/voxy-animatable-master/voxy-layered-master-8s-16x9.mp4`
- `artifacts/voxy-animatable-master/crop-safe-16x9.png`
- `artifacts/voxy-animatable-master/crop-safe-9x16.png`
- `artifacts/voxy-animatable-master/crop-safe-1x1.png`
- `artifacts/voxy-animatable-master/evidence-manifest.json`

Das Manifest enthält den Exact-Head-SHA, SHA-256 aller 23 Layerdateien, SHA-256 des Videos und der Crop-Captures, per `ffprobe` gemessene Dauer/Dimensionen/FPS sowie den ausstehenden Human-Review-Status.

## Crop- und Safe-Area-Nachweis

Die drei PNGs stammen aus demselben Layer-Renderer bei 4,0 Sekunden. `9:16` und `1:1` werden als reale Ausschnitte des 16:9-Frames erzeugt; die türkise gestrichelte Linie markiert die jeweils dokumentierte Safe Area. Damit ist sichtbar prüfbar, ob Kopf, Hände, Branding und zentrale Silhouette im Zielformat erhalten bleiben.

## Human Gate

Die Render-Evidence endet absichtlich mit `humanReview.status = pending`. Dieser PR wird nicht durch den Agenten visuell freigegeben. Die finale Sichtabnahme erfolgt durch Ricky anhand des exakten Workflow-Artifacts; jede Änderung am PR-Head erzeugt eine neue revisionsgebundene Evidence.

## Grenzen

- kein Lip-Sync und keine Viseme-Abhängigkeit
- kein Deployment
- kein externer Upload
- kein Publishing
- keine Selbstfreigabe

## Abschlussnachweis

Exact-Head-SHA, Workflow-Run, Artifact-ID, Hashes und Checkresultate werden nach dem finalen CI-Lauf als PR-Kommentar ergänzt, ohne den geprüften Head erneut zu verändern.
