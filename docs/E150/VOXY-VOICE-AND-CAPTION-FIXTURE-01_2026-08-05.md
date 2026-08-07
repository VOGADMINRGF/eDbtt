# VOXY-VOICE-AND-CAPTION-FIXTURE-01

Stand: 2026-08-07

## Ergebnis

Der Voice-/Caption-Slice verarbeitet jetzt eine tatsächliche Audiodatei statt nur vorberechneter Metadaten. Der Exact-Head-Workflow erzeugt lokal eine konkrete deutsche Sprachfixture aus dem committed Transcript, inspiziert die WAV-Datei mit `ffprobe` und EBU-R128, normalisiert sie real mit FFmpeg und erzeugt VTT, SRT und Caption-Timeline auf Basis der tatsächlich gemessenen Audiodauer.

Die Quelle ist bewusst providerneutral und lokal: `espeak-ng` erzeugt die Teststimme innerhalb des GitHub-Runners. Es findet kein Upload an einen Sprachdienst statt und es wird keine reale Person imitiert.

## Reale Quelldatei

Committed Input:

- `apps/web/public/brands/voxy/fixtures/voice-caption-source-de.txt`
- `apps/web/public/brands/voxy/fixtures/voice-caption-segments-de.json`

Workflow-Ausgabe:

- `artifacts/voxy-voice-caption/source-voice-de.wav`

Die Quelldatei wird vor jeder weiteren Verarbeitung mit `ffprobe` und `ffmpeg ebur128=peak=true` untersucht. Dauer, Codec, Sample Rate, Kanäle, integrierte Lautheit, True Peak und SHA-256 werden im Manifest gespeichert.

## Tatsächliche Normalisierung

Ausführung:

```bash
ffmpeg -i source-voice-de.wav \
  -af loudnorm=I=-16:TP=-1.5:LRA=7 \
  -ar 48000 -ac 1 normalized-voice-de.wav
```

Danach wird die normalisierte Datei erneut unabhängig gemessen. Der Workflow schlägt fehl, wenn:

- integrierte Lautheit nicht zwischen `-17` und `-15 LUFS` liegt,
- True Peak über `-1 dBFS` liegt,
- die Normalisierung die Dauer um mehr als 120 ms verändert.

## Reale Caption-Artefakte

Die gemessene Dauer der normalisierten WAV-Datei wird auf die committed Segmenttexte verteilt; der letzte Cue endet exakt auf der gemessenen Audiodauer. WebVTT und SRT verwenden dieselben IDs und Zeiten.

CI-Artifact: `voxy-voice-caption-<exact-head-sha>`

Exakte Pfade:

- `artifacts/voxy-voice-caption/source-voice-de.wav`
- `artifacts/voxy-voice-caption/normalized-voice-de.wav`
- `artifacts/voxy-voice-caption/voice-caption-de.vtt`
- `artifacts/voxy-voice-caption/voice-caption-de.srt`
- `artifacts/voxy-voice-caption/caption-timeline.json`
- `artifacts/voxy-voice-caption/evidence-manifest.json`

Das Manifest bindet Source-Inspection, Normalized-WAV, VTT, SRT und Timeline über Exact-Head-SHA und SHA-256 an dieselbe Revision.

## Reproduktion

```bash
mkdir -p artifacts/voxy-voice-caption
espeak-ng -v de -s 148 -p 48 -a 165 \
  -f apps/web/public/brands/voxy/fixtures/voice-caption-source-de.txt \
  -w artifacts/voxy-voice-caption/source-voice-de.wav
VOXY_EVIDENCE_COMMIT_SHA=$(git rev-parse HEAD) \
  pnpm -w exec tsx apps/web/scripts/generate-voxy-voice-caption-evidence.ts \
  --source=artifacts/voxy-voice-caption/source-voice-de.wav \
  --segments=apps/web/public/brands/voxy/fixtures/voice-caption-segments-de.json \
  --output=artifacts/voxy-voice-caption
```

## Human Review

Die Evidence endet mit `humanReview.status = pending`. Ricky kann die Source- und Normalized-WAV anhören und VTT/SRT gegen die Audioausgabe prüfen. Der Agent setzt keine menschliche Freigabe.

## Grenzen

- kein Lip-Sync
- keine Viseme-Generierung
- keine Stimmimitation einer realen Person
- kein externer Voice-Provider
- kein Upload, Scheduling oder Publishing
- keine Selbstfreigabe

## Abschlussnachweis

Exact-Head-SHA, Workflow-Run, Artifact-ID, Messwerte, Hashes und Checkresultate werden nach dem finalen CI-Lauf als PR-Kommentar dokumentiert, ohne den geprüften Head erneut zu verändern.
