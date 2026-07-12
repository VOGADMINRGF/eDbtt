# V3 Voxy Render Media Storage Truth Noop Audit

Datum: 2026-07-11  
Task: `V3-VOXY-RENDER-MEDIA-STORAGE-TRUTH-NOOP-01`  
Status: done

## Ziel

Nach `#350` Approval Semantics gibt es jetzt einen eigenen
`Media & Storage`-Layer.

Der Slice beschreibt nur:

- was spaeter eine echte Voxy-Preview-Datei waere
- dass ein `media_candidate` noch keine Datei ist
- dass ein `storage_target` noch kein Storage-Write ist
- welche Metadaten-, Storage- und Retention-Regeln spaeter fehlen
- warum trotzdem weiterhin keine Preview-URL, keine Thumbnail-URL und kein Upload existieren

Der Slice fuehrt bewusst nicht aus:

- Render
- Re-Render
- Preview-Video
- Medien-Datei
- Thumbnail
- Subtitle-Datei
- Source-Caption-Datei
- Storage-Write
- Upload
- Providerlauf
- Queue-Job
- Worker
- Secret-Zugriff
- Kostenbuchung
- Credit-Abbuchung
- Publish
- Social Posting
- Scheduling

## Inventory aus dem Repo

Bestehende Media-/Storage-nahe Strukturen:

- `apps/web/src/models/core/MediaItem.ts`
  - generisches Core-Readmodel fuer Bild/Video/Audio mit `src`, `alt`, `type`
- `apps/web/src/models/core/Contribution.ts`
  - bestehendes `media[]`-Feld fuer Upload-/OCR-nahe Contribution-Medien mit `url`, `filename`, `size`, `mimeType`, `previewUrl`
- `apps/web/src/features/material/materialIntakeContract.ts`
  - Upload-/Dokument-/Material-Intake-Wortschatz mit `uploadId`, `mimeType`, `fileName`, `url`
- `apps/web/src/features/material/materialIntakeRepository.ts`
  - serverseitige Intake-Persistenz fuer Material-/Upload-Kontext
- `apps/web/src/lib/s3.ts`
  - vorhandener R2/S3-kompatibler Helper mit Env-Voraussetzungen, aber ohne Voxy-Preview-Anschluss

Was das Inventar ausdruecklich nicht liefert:

- keine echte Voxy-Preview-Datei
- kein Voxy-Thumbnail
- keine Voxy-Preview-URL
- keinen kanonischen Voxy-Storage-Pfad
- keine belastbare Voxy-`mimeType`-/`fileSize`-/`duration`-/`checksum`-Wahrheit
- keinen freigeschalteten Voxy-Upload-Pfad
- keinen Voxy-Storage-Write-Pfad

## Was der Slice schuetzt

Der neue Contract haertet diese Trennungen:

- `media_candidate` ist keine Medien-Datei
- `media_record` ist kein Upload
- `storage_target` ist kein Storage-Write
- `thumbnail_candidate` ist kein Thumbnail
- `preview_file_available` ist nicht `rendered`
- `media_ready` ist nicht `publish_ready`
- `uploaded` ist nicht `published`
- `approved` ist nicht `uploaded`

Die UI wiederholt diese Grenzen explizit, damit niemand aus dem Readmodel eine versteckte Runtime ableitet.

## Wie der Builder uebersetzt

Deterministische Basis:

- ohne Approval-Semantik: `blocked_by_missing_approval_semantics`
- `keep_as_script_only`: `keep_as_script_only`
- fehlende Preview-Datei: `blocked_by_missing_preview_file`
- fehlende Storage-Policy: `storage_policy_needed`
- fehlende Storage-Provider-Konfiguration: `storage_target_needed`
- fehlende Metadaten-Policy: `metadata_policy_needed`
- fehlende Runtime-Wahrheit: `blocked_by_runtime_truth`

Der Builder erfindet nie:

- `publicUrl`
- `signedUrl`
- `storagePath`
- `mimeType`
- `fileSizeBytes`
- `durationSeconds`
- `checksum`

Solange keine echte Datei existiert, bleiben diese Felder leer.

## Media Candidate

Der Slice zeigt jetzt einen typed `Media Candidate`:

- standardmaessig `preview_video`
- im aktuellen noop-Pfad mit Status `no_file`, `metadata_needed` oder `storage_needed`
- immer mit
  - `generated: false`
  - `rendered: false`
  - `uploaded: false`
  - `playable: false`
  - `downloadable: false`

Damit bleibt sichtbar:

- ein spaeteres Preview waere denkbar
- heute gibt es trotzdem keine Datei

## Storage Target

Der Slice zeigt jetzt ein typed `Storage Target`:

- `provider` bleibt `unknown` oder `requirement_only`
- `status` bleibt `policy_needed`, `not_configured` oder `requirement_only`
- `writeAllowed`, `readAllowed`, `publicAccessAllowed`, `signedAccessAllowed` bleiben `false`
- `retentionPolicyNeeded` bleibt `true`

Damit bleibt sichtbar:

- es gibt spaetere Storage-Fragen
- heute gibt es trotzdem keinen Write und keine URL

## Execution-Flags

Alle Execution-Flags bleiben explizit `false`:

- `createsMediaFile`
- `createsThumbnail`
- `createsSubtitleFile`
- `createsSourceCaptionFile`
- `storageWriteAllowed`
- `uploadAllowed`
- `publishAllowed`
- `schedulingAllowed`
- `socialPostAllowed`
- `autoPublishAllowed`
- `previewRendered`
- `renderAllowed`
- `rerenderAllowed`
- `queueAllowed`
- `workerAllowed`
- `providerExecutionAllowed`
- `secretsAccessed`
- `costDebitAllowed`
- `creditDebitAllowed`
- `runtimeClaimAllowed`

## Warum dieser Slice nichts speichert oder hochlaedt

Der Store und die Route sind audit-only:

- `POST /api/admin/voxy-render-media-storage-truth`
  - speichert nur typed Media-/Storage-Truth und Audit
- `GET /api/admin/voxy-render-media-storage-truth`
  - liest nur typed Records und Audit

Persistenz bleibt getrennt von:

- Storage-Write
- Upload
- Provider
- Queue
- Datei-Erzeugung
- Publish

## Surface-Integration

Der Panel-Layer ist additiv sichtbar in:

- `/create`
- `/account`
- `/admin/review`
- `/dossier/[id]/studio`

`/create` und `/account` bleiben readmodel-only.  
`/admin/review` und `/dossier/[id]/studio` koennen die letzte persistierte Media-/Storage-Wahrheit read-only anzeigen.

## Was fuer echte Media-/Storage-Runtime weiterhin fehlt

Ein spaeterer echter Folgeslice braeuchte weiterhin mindestens:

1. echte Preview-Datei-Wahrheit
2. echte Storage-Policy
3. echte Provider-/Bucket-/Blob-Konfiguration
4. echte Metadaten-Policy fuer MIME-Typ, Groesse, Dauer und Checksumme
5. echte Retention-Policy
6. echte Upload-Runtime
7. klare Trennung zwischen Preview-Datei, Upload und Publish im operativen Runtime-Pfad

Solange diese Punkte fehlen, bleibt `Media & Storage` nur ein review-first Wahrheitslayer.

## Umgesetzte Artefakte

- `apps/web/src/features/create/voxyRenderMediaStorageTruthContract.ts`
- `apps/web/src/features/create/voxyRenderMediaStorageTruthStore.ts`
- `apps/web/src/features/create/VoxyRenderMediaStorageTruthPanel.tsx`
- `apps/web/src/app/api/admin/voxy-render-media-storage-truth/route.ts`

Integrationen additiv in:

- `apps/web/src/features/create/CreateCandidatePreviewPanel.tsx`
- `apps/web/src/app/account/AccountResumeWorkbenchSection.tsx`
- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/dossier/[id]/studio/page.tsx`

## Tests

Neu:

- `apps/web/tests/voxy-render-media-storage-truth.contract.test.tsx`
- `apps/web/tests/voxy-render-media-storage-truth.route.test.ts`

Erweitert:

- `apps/web/tests/create-candidate-preview.contract.test.ts`
- `apps/web/tests/account-resume-workbench.contract.test.tsx`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/dossier-studio-server-persistence-ui.test.tsx`

## Naechster sinnvoller Slice

Sinnvolle Folgearbeit bleibt getrennt:

- echte Preview-Datei-/Export-Wahrheit
- echte Storage-/Retention-/Access-Policy
- echter Upload-/Blob-/Bucket-Anschluss
- spaetere Runtime- und Provider-Wahrheit

Bis dahin bleibt `Media & Storage` bewusst `noop_media_storage`.
