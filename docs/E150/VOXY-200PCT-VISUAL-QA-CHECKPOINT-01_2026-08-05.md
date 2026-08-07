# VOXY-200PCT-VISUAL-QA-CHECKPOINT-01

Stand: 2026-08-07

## Ergebnis

Der Voxy-Reviewpfad besitzt jetzt einen real ausführbaren Browser-Capture-Pfad für `16:9`, `9:16` und `1:1`. Die Evidence wird mit CSS-Browserzoom `200%` in Chromium erzeugt, enthält den vollständigen Surface-Capture plus die zehn dokumentierten Prüfausschnitte und wird an den exakten Git-Commit gebunden. Ein automatisches Ergebnis ersetzt die menschliche Sichtabnahme ausdrücklich nicht.

## Reale Evidence

Workflow: `.github/workflows/voxy-visual-qa-contract.yml`

Generator:

```bash
VOXY_EVIDENCE_COMMIT_SHA=$(git rev-parse HEAD) \
  pnpm -w exec tsx apps/web/scripts/capture-voxy-200pct-evidence.ts \
  --output=artifacts/voxy-200pct-visual-qa
```

Der CI-Artifact-Name lautet revisionsgebunden `voxy-200pct-visual-qa-<exact-head-sha>`.

Exakte Pfade innerhalb des Artifacts:

- `artifacts/voxy-200pct-visual-qa/16x9/surface-200pct.png`
- `artifacts/voxy-200pct-visual-qa/9x16/surface-200pct.png`
- `artifacts/voxy-200pct-visual-qa/1x1/surface-200pct.png`
- je Format zusätzlich `face_eyes-200pct.png`, `left_hand-200pct.png`, `right_hand-200pct.png`, `vog_pin-200pct.png`, `edebatte_pocket_mark-200pct.png`, `logo_zone-200pct.png`, `microphone_edge-200pct.png`, `waveform-200pct.png`, `lower_third-200pct.png` und `caption_safe_zone-200pct.png`
- `artifacts/voxy-200pct-visual-qa/evidence-manifest.json`

Das Manifest enthält SHA-256 je PNG, Viewport, Browserzoom, Exact-Head-SHA, Evidence-Key und den Human-Review-Zustand.

## Menschliches Gate

Der CI-Lauf erzeugt ausschließlich `humanReview.status = pending`. Er kann und darf keine menschliche Freigabe setzen.

Eine spätere Freigabe gilt nur, wenn gleichzeitig:

1. `reviewerId` und `reviewedAt` gesetzt sind,
2. `approvedCommitSha` exakt dem Commit aller geprüften Captures entspricht,
3. `approvedEvidenceKey` exakt dem aus den Capture-Hashes berechneten Evidence-Key entspricht.

Eine alte Freigabe wird dadurch bei jedem neuen Commit oder jedem veränderten Capture automatisch ungültig. Dieser PR enthält keine Selbstfreigabe.

## Automatische Gates

- genau ein Browser-Capture je Ausgabeformat
- exakt 200 % CSS-Browserzoom
- kanonische `/brands/voxy/`-Assetpfade
- SHA-256 für vollständige Surface-Captures und alle Prüfausschnitte
- tatsächlicher pixelbasierter Edge-Contrast-Schärfesignalwert je Ausschnitt
- keine Capture-Rechtecke außerhalb des Zielviewports
- exakt fünf Finger je sichtbarer Handpose laut kanonischem Mastervertrag
- Waveform bleibt hinter Voxy und außerhalb der Logo-Zone laut kanonischem Layoutvertrag
- identische Assetrevision erzeugt identischen Evidence-Key

Halos, subtile Typografiefehler und die endgültige visuelle Crop-Qualität bleiben zusätzlich menschlich zu prüfen; sie werden nicht durch Metadaten als menschlich freigegeben ausgegeben.

## Grenzen

- kein Auto-Approve
- keine stillen Toleranzanhebungen
- keine Rechte-, Marken- oder Produktfreigabe durch CI
- kein Upload oder Publishing
- keine menschliche Freigabe durch den Agenten

## Abschlussnachweis

Der endgültige Exact-Head-SHA, Workflow-Run, Artifact-ID und die Checkresultate werden im PR-Kommentar dokumentiert, damit die Dokumentation selbst den Evidence-Commit nicht nachträglich verändert.
