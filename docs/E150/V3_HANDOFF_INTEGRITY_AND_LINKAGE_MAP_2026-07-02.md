# V3 Handoff Integrity And Linkage Map

## Was gebaut wurde

- `/admin` zeigt jetzt einen sichtbaren Abschnitt `Handoff Integrity & Linkage Map`.
- Das neue Readmodel `apps/web/src/features/admin/v3HandoffLinkageMap.ts`
  liefert die kanonischen Links `A` bis `R` mit ehrlichen Statusstufen
  `wired`, `partially_wired`, `planned`, `blocked` und `docs_only`.
- Jede Link-Karte zeigt `from -> to`, konkrete Repo-Belege, konkrete Tests,
  Guardrails, Gap und den naechsten Slice.
- `apps/web/src/features/admin/v3ControlCenterReadModel.ts` stuft
  `Handoff Integrity / Linkage Map` nach diesem Slice auf
  `operational_basic`, ohne einzelne Zielpfade als `endstate_ready`
  auszugeben.

## Welche Links A-R sichtbar sind

- `A` Create / Analyze / Claims -> Editorial Review Queue
- `B` Editorial Review Queue -> Dossier Runtime Creation
- `C` Editorial Review Queue -> Anlassraum Runtime Creation
- `D` Editorial Review Queue -> Beteiligungsraum Runtime Creation
- `E` Dossier Runtime -> Dossier Publish Workflow
- `F` Anlassraum Runtime -> Activation / Publish Workflow
- `G` Beteiligungsraum Runtime -> Publish / Public Route
- `H` Published Dossier -> Public Dossier Route / Share Output
- `I` Published Anlassraum -> Public Round / Runden Route
- `J` Published Beteiligungsraum -> `/beteiligung` Public Route
- `K` Public Submission -> Community Source Review
- `L` Community Source Review -> Admin Review Workbench
- `M` Dossier / Anlassraum / Beteiligungsraum -> QR / Sharing
- `N` Dossier / Topic / Round -> Social / Output Drafts
- `O` Claims / Dossier Signals -> Programm Candidate Pipeline
- `P` Live Session / Stream -> Claim / Source / Dossier Follow-up
- `Q` Meeting Link -> Live/Anlassraum Context
- `R` Handoff/Publish/Runtime -> V3 Control Center Visibility

## Statusverteilung

- `wired`: 12
- `partially_wired`: 4
- `planned`: 2
- `docs_only`: 0
- `blocked`: 0
- `endstate_ready`: 0

`wired` bedeutet in diesem Slice nur: reale Runtime/API/Admin/Public-Belege
und Tests existieren. `wired` ist ausdruecklich nicht gleich `endstate_ready`.

## Welche Routen und Tests als Evidence genutzt wurden

Reale Admin- oder Public-Links in der Map:

- `/admin`
- `/admin/review`
- `/admin/create/attach-drafts/history-maintenance`
- `/admin/campaigns`
- `/atlas/social-review`
- `/create`
- `/dossier`
- `/runden`
- `/beteiligung`
- `/stream`
- `/qr-studio`

Wichtige Runtime-/Route-Belege:

- `apps/web/src/app/api/create/handoffs/route.ts`
- `apps/web/src/app/api/admin/dossier-runtime/[sourceHandoffId]/route.ts`
- `apps/web/src/app/api/admin/anlassraum-runtime/[sourceHandoffId]/route.ts`
- `apps/web/src/app/api/admin/participation-space-runtime/[sourceHandoffId]/route.ts`
- `apps/web/src/app/api/community/source-review/submissions/route.ts`
- `apps/web/src/app/api/admin/feeds/anlassraum/[id]/outputs/route.ts`
- `apps/web/src/app/api/qr/sets/route.ts`

Wichtige Tests:

- `apps/web/tests/create-handoff.persistence.route.test.ts`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/dossier-runtime-creation.test.ts`
- `apps/web/tests/dossier-runtime-admin-creation.test.tsx`
- `apps/web/tests/anlassraum-runtime-creation.test.ts`
- `apps/web/tests/anlassraum-runtime-admin-creation.test.tsx`
- `apps/web/tests/participation-space-runtime-creation.test.ts`
- `apps/web/tests/participation-space-runtime-admin-creation.test.tsx`
- `apps/web/tests/dossier-publish-workflow.test.ts`
- `apps/web/tests/anlassraum-activation-workflow.test.ts`
- `apps/web/tests/participation-space-publish-workflow.test.ts`
- `apps/web/tests/dossier-public-route-runtime.test.tsx`
- `apps/web/tests/participation-space-public-detail-runtime.test.tsx`
- `apps/web/tests/runden-entry.service.test.ts`
- `apps/web/tests/community-source-review-public-submission-hardening.test.ts`
- `apps/web/tests/community-source-review-public-submission-api.test.ts`
- `apps/web/tests/output-engine-social-distribution.test.ts`
- `apps/web/tests/themenradar-share-distribution.contract.test.ts`
- `apps/web/tests/event-qr-entry.contract.test.tsx`
- `apps/web/tests/live-qr-entry.contract.test.tsx`
- `apps/web/tests/stream-dossier-recap-handoff.contract.test.ts`
- `apps/web/tests/event-dossier-recap.contract.test.ts`
- `apps/web/tests/v3-handoff-linkage-map.contract.test.ts`
- `apps/web/tests/v3-handoff-linkage-admin.page.test.tsx`
- `apps/web/tests/v3-control-center-admin.page.test.tsx`

## Was ausdruecklich nicht gebaut wurde

- keine neue Runtime-Migration
- keine neue DB-Migration
- keine neue Produktparallelwelt
- keine Auto-Publish-Funktion
- keine Auto-Activation
- keine Auto-Factcheck- oder Auto-Verification-Logik
- keine Auto-Graph-Writes
- keine Auto-Merge-Logik
- keine hidden DeepSearch
- keine hidden Cost Paths
- keine echten Social-Posts
- keine Programm-Auto-Freigabe
- keine QR-Neugenerierung als Pflicht
- keine Meeting-Connectoren
- keine Fake-Metriken
- keine Fake-Actions

## Welche Folgepfade offen bleiben

- `V3-CLAIM-TO-DOSSIER-PIPELINE-01`
- `V3-DOSSIER-SOCIAL-OUTPUT-DRAFTS-01`
- `V3-PROGRAMM-GROWTH-APPROVAL-PIPELINE-01`
- `V3-QR-SHARING-PUBLIC-ENTRY-01`
- `V3-LIVE-FORMAT-HOST-COCKPIT-01`
- `V3-LIVE-PARTICIPATION-FORMATS-01`
- `V3-MEETING-LINK-INTEGRATION-LIGHT-01`
- `V3-TEST-RESULTS-REGRESSION-MATRIX-01`

Die Map macht diese Folgepfade sichtbar, schliesst sie aber bewusst nicht.

## Validierung

- `git diff --check`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/v3-handoff-linkage-map.contract.test.ts tests/v3-handoff-linkage-admin.page.test.tsx tests/v3-control-center-admin.page.test.tsx`
- `pnpm -C apps/web run build`
