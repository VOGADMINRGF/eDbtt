# V3 Voxy Render Upload Target Policy Noop Audit

Datum: 2026-07-12  
Task: `V3-VOXY-RENDER-UPLOAD-TARGET-POLICY-NOOP-01`  
Status: done

## Ziel

Nach `#351` Media Storage Truth gibt es jetzt einen eigenen
`Upload Target Policy`-Layer.

Der Slice beschreibt nur:

- welche spaeteren Upload-Ziele fuer Voxy-Mediendateien denkbar waeren
- welche Access-, Signed-Access-, Retention- und Lösch-Policies noch fehlen
- warum `upload_target` nicht `uploaded` ist
- warum `signed_access_candidate` keine Signed URL ist
- warum `retention_policy` kein Delete-Job ist

Der Slice fuehrt bewusst nicht aus:

- Upload
- Storage-Write
- Signed URL
- Public URL
- Delete-Job
- Publish
- Social Posting
- Scheduling
- Render
- Re-Render
- Preview-Video
- Medien-Datei
- Queue-Job
- Worker
- Providerlauf
- Secret-Zugriff
- Kostenbuchung
- Credit-Abbuchung

## Inventory aus dem Repo

Vorhandene Upload-/Storage-nahe Strukturen:

- `apps/web/src/features/create/voxyRenderMediaStorageTruthContract.ts`
  - getypte Media-/Storage-Wahrheit fuer `media_candidate`, `storage_target` und harte `false`-Semantik
- `apps/web/src/features/material/materialIntakeContract.ts`
  - vorhandener Upload-/Material-Wortschatz mit `uploadId`, `fileName`, `mimeType`, `url`
- `apps/web/src/features/material/materialIntakeRepository.ts`
  - serverseitige Intake-Persistenz fuer Material-/Upload-Kontext
- `apps/web/src/app/api/uploads/route.ts`
  - review-first Material-Upload-Metadatenpfad, aber kein Voxy-Medienpfad
- `apps/web/src/lib/s3.ts`
  - generischer R2/S3-kompatibler Helper ohne Voxy-Upload-Runtime
- `apps/web/src/models/core/Contribution.ts`
  - bestehendes `media[]`-Feld fuer Beitrag-/Upload-Kontexte, nicht fuer Voxy-Preview-Dateien

Was das Inventar ausdruecklich nicht liefert:

- keinen kanonischen Voxy-Upload-Pfad
- kein kanonisches Voxy-Bucket-/Container-/Blob-Ziel
- keine belastbare Signed-URL-Wahrheit fuer Voxy
- keine belastbare Public-URL-Wahrheit fuer Voxy
- keine Voxy-Retention- oder Delete-Job-Runtime
- keine echte Voxy-Mediendatei
- keine freigeschaltete Upload-Runtime fuer Voxy

## Was der Slice schuetzt

Der neue Contract haertet diese Trennungen:

- `upload_target` ist nicht `uploaded`
- `storage_policy` ist nicht `storage_write`
- `signed_access_candidate` ist nicht `signed_url`
- `retention_policy` ist kein `deletion_job`
- `upload_ready` ist nicht `uploaded`
- `media_record` ist kein `public_asset`
- `uploaded` ist nicht `published`
- `approved` ist nicht `uploaded`

Die UI wiederholt diese Grenzen explizit, damit niemand aus dem Readmodel eine versteckte Runtime ableitet.

## Wie der Builder uebersetzt

Deterministische Basis:

- ohne Media-/Storage-Wahrheit: `blocked_by_missing_media_storage_truth`
- `keep_as_script_only`: `keep_as_script_only`
- fehlende Medien-Datei: `blocked_by_missing_media_file`
- fehlender Upload-Target-Entwurf: `no_upload_target`
- fehlende Storage-Provider-Konfiguration: `storage_provider_needed`
- fehlende Access-Policy: `access_policy_needed`
- fehlende Signed-Access-Policy: `signed_access_policy_needed`
- fehlende Retention-Policy: `retention_policy_needed`
- fehlende Deletion-Policy: `deletion_policy_needed`
- fehlende Runtime-Wahrheit: `blocked_by_runtime_truth`

Der Builder erfindet nie:

- `bucketOrContainer`
- `basePath`
- `publicBaseUrl`
- Signed URL
- Public URL
- Retention-Dauer
- Delete-Job

Solange keine echte Quelle existiert, bleiben diese Felder leer.

## Upload Target, Access, Retention und Deletion

Der Slice zeigt jetzt vier getrennte Kandidaten-Lesarten:

- `Upload Target`
  - `no_target`, `provider_needed`, `access_policy_needed` oder `candidate_only`
  - `writeAllowed`, `uploadAllowed`, `publicAccessAllowed`, `signedAccessAllowed` bleiben `false`
- `Access Policy`
  - Sichtbarkeit bleibt `unknown`, `private`, `internal_review_only` oder `public_candidate`
  - `signedUrlCreated`, `publicUrlCreated`, `downloadAllowed`, `shareAllowed` bleiben `false`
- `Retention Policy`
  - bleibt `policy_needed`, `candidate_only`, `blocked` oder `not_applicable`
  - `retentionDays` bleibt leer
  - `deletionJobCreated` bleibt `false`
- `Deletion Policy`
  - bleibt `policy_needed`, `candidate_only`, `blocked` oder `not_applicable`
  - `deletionJobCreated` und `deletionAllowed` bleiben `false`

Damit bleibt sichtbar:

- es gibt spaetere Upload-/Access-/Retention-Fragen
- heute gibt es trotzdem keinen Upload, keine URL und keinen Delete-Job

## Execution-Flags

Alle Execution-Flags bleiben explizit `false`:

- `uploadAllowed`
- `storageWriteAllowed`
- `signedUrlCreationAllowed`
- `publicUrlCreationAllowed`
- `deletionJobAllowed`
- `publishAllowed`
- `schedulingAllowed`
- `socialPostAllowed`
- `autoPublishAllowed`
- `createsMediaFile`
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

## Warum dieser Slice nichts hochlaedt oder loescht

Store und Route sind audit-only:

- `POST /api/admin/voxy-render-upload-target-policies`
  - speichert nur typed Upload-Target-Policy und Audit
- `GET /api/admin/voxy-render-upload-target-policies`
  - liest nur typed Records und Audit

Persistenz bleibt getrennt von:

- Upload
- Storage-Write
- Signed/Public URL
- Delete-Job
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
`/admin/review` und `/dossier/[id]/studio` koennen die letzte persistierte Upload-Target-Policy read-only anzeigen.

## Was fuer echte Upload-/Storage-Runtime weiterhin fehlt

Ein spaeterer echter Folgeslice braeuchte weiterhin mindestens:

1. echte Voxy-Mediendatei-Wahrheit
2. echte Upload-Ziel-Wahrheit fuer Bucket/Container/Pfad
3. echte Storage-Provider-Konfiguration
4. echte Access-Policy mit belastbarer Sichtbarkeitsentscheidung
5. echte Signed-Access-Runtime
6. echte Retention- und Delete-Job-Runtime
7. klare operative Trennung zwischen Upload, Storage, Access und Publish

Solange diese Punkte fehlen, bleibt `Upload Target Policy` nur ein review-first Wahrheitslayer.

## Umgesetzte Artefakte

- `apps/web/src/features/create/voxyRenderUploadTargetPolicyContract.ts`
- `apps/web/src/features/create/voxyRenderUploadTargetPolicyStore.ts`
- `apps/web/src/features/create/VoxyRenderUploadTargetPolicyPanel.tsx`
- `apps/web/src/app/api/admin/voxy-render-upload-target-policies/route.ts`

Integrationen additiv in:

- `apps/web/src/features/create/CreateCandidatePreviewPanel.tsx`
- `apps/web/src/app/account/AccountResumeWorkbenchSection.tsx`
- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/src/app/dossier/[id]/studio/page.tsx`

## Tests

- `apps/web/tests/voxy-render-upload-target-policy.contract.test.tsx`
- `apps/web/tests/voxy-render-upload-target-policy.route.test.ts`
- erweiterte Surface-Tests in
  - `apps/web/tests/create-candidate-preview.contract.test.ts`
  - `apps/web/tests/account-resume-workbench.contract.test.tsx`
  - `apps/web/tests/admin-review.page.test.tsx`
  - `apps/web/tests/dossier-studio-server-persistence-ui.test.tsx`
