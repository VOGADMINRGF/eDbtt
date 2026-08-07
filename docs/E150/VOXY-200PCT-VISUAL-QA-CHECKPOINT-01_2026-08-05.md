# VOXY-200PCT-VISUAL-QA-CHECKPOINT-01

Stand: 2026-08-07

## Ergebnis

Der Voxy-Reviewpfad besitzt einen real ausführbaren Browser-Capture-Pfad für `16:9`, `9:16` und `1:1`. Die Evidence wird mit CSS-Browserzoom `200%` in Chromium erzeugt, enthält den vollständigen Surface-Capture plus die zehn dokumentierten Prüfausschnitte und wird an den exakten PR-Head gebunden. Ein automatisches Ergebnis ersetzt die menschliche Sichtabnahme ausdrücklich nicht.

## Reale Evidence

Workflow: `.github/workflows/voxy-visual-qa-contract.yml`

Generator:

```bash
VOXY_EVIDENCE_COMMIT_SHA=$(git rev-parse HEAD) \
  pnpm -w exec tsx apps/web/scripts/capture-voxy-200pct-evidence.ts \
  --output=artifacts/voxy-200pct-visual-qa
```

Im `pull_request`-Workflow wird ausdrücklich `github.event.pull_request.head.sha` verwendet, nicht der synthetische GitHub-Merge-SHA. Der CI-Artifact-Name lautet revisionsgebunden `voxy-200pct-visual-qa-<exact-pr-head-sha>`.

Exakte Pfade innerhalb des Artifacts:

- `artifacts/voxy-200pct-visual-qa/16x9/surface-200pct.png`
- `artifacts/voxy-200pct-visual-qa/9x16/surface-200pct.png`
- `artifacts/voxy-200pct-visual-qa/1x1/surface-200pct.png`
- je Format zusätzlich `face_eyes-200pct.png`, `left_hand-200pct.png`, `right_hand-200pct.png`, `vog_pin-200pct.png`, `edebatte_pocket_mark-200pct.png`, `logo_zone-200pct.png`, `microphone_edge-200pct.png`, `waveform-200pct.png`, `lower_third-200pct.png` und `caption_safe_zone-200pct.png`
- `artifacts/voxy-200pct-visual-qa/evidence-manifest.json`

Das Manifest enthält SHA-256 je PNG, Viewport, Browserzoom, Exact-Head-SHA, Evidence-Key und den Human-Review-Zustand. Die Pixelanalyse läuft auf einer separaten Browserseite, damit der zu prüfende Surface-Render während der zehn Captures unverändert bleibt.

## Menschliches Gate im bestehenden Reviewpfad

Der CI-Lauf erzeugt ausschließlich `humanReview.status = pending`. Er kann und darf keine menschliche Freigabe setzen.

Die Freigabe wird an den bereits vorhandenen persistenten Voxy-Reviewpfad angebunden:

- Store: `apps/web/src/features/create/voxyRenderPreviewReviewDecisionPersistenceStore.ts`
- Admin-API: `/api/admin/voxy-render-preview-review-decisions`
- erforderlicher persistenter Modus: `persistent_primary`

Für jede Evidence wird ein unverwechselbares Gate erzeugt:

`voxy-visual-qa:<exact-pr-head-sha>:r<review-revision>:<evidence-key>`

`applyPersistedVoxyVisualQaReviewDecision` akzeptiert für das visuelle Gate nur einen tatsächlich als persistent gekennzeichneten Review-Record mit `decisionRecordId`, `persistedBy` und `persistedAt`. Die Entscheidung wird wie folgt auf das QA-Gate abgebildet:

- `mark_review_ready` → `approved`
- `request_revision` → `needs_changes`
- `reject_preview` → `rejected`

Production Eligibility entsteht nur, wenn gleichzeitig:

1. der automatisierte Capture-Check grün ist,
2. der persistierte Decision-Gate-ID exakt Head, Evidence-Key und Reviewrevision entspricht,
3. Reviewer und Zeitpunkt aus dem persistenten Record vorliegen,
4. `approvedCommitSha` exakt dem geprüften PR-Head entspricht,
5. `approvedEvidenceKey` exakt dem aus den Capture-Hashes berechneten Evidence-Key entspricht.

Eine alte oder nur in-memory/metadatenbasierte Freigabe bleibt dadurch wirkungslos. Jeder neue Commit oder veränderte Capture erzeugt einen neuen Gate-ID/Evidence-Key. Dieser PR enthält keine Selbstfreigabe.

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

Halos, subtile Typografiefehler, Anatomie und die endgültige visuelle Crop-Qualität bleiben zusätzlich menschlich zu prüfen; sie werden nicht durch Metadaten als menschlich freigegeben ausgegeben.

## Grenzen

- kein Auto-Approve
- keine stillen Toleranzanhebungen
- keine Rechte-, Marken- oder Produktfreigabe durch CI
- kein externer Upload oder Publishing
- keine menschliche Freigabe durch den Agenten

## Abschlussnachweis

Der endgültige Exact-Head-SHA, Workflow-Run, Artifact-ID, Capture-Hashes und die Checkresultate werden im PR-Kommentar dokumentiert, damit die Dokumentation selbst den Evidence-Commit nicht nachträglich verändert.
