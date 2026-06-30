# PARTICIPATION-SPACE-PUBLISH-OR-ACTIVATION-WORKFLOW

Stand: 2026-06-30

## Ausgangslage nach #265

Nach `PARTICIPATION-SPACE-RUNTIME-CREATION-04` existierte bereits ein
review-approved Pfad, um aus persistierten `create_handoff`-Kandidaten echte
interne Beteiligungsraum-Runtime-Objekte zu erzeugen.

Vorhanden waren:

- `apps/web/src/features/create/participationSpaceRuntime.ts`
  review-first Runtime-Contract fuer Beteiligungsraum-Creation
- `apps/web/src/features/create/participationSpaceRuntimeServer.ts`
  persistente Runtime-Records, Audit-Trail und echte interne
  Participation-Space-Persistenz
- `apps/web/src/features/participation/spaceContainer.ts`
  typed Participation-Space-Status-/Visibility-Contract
- `/admin/review`
  bestehende Admin-Review-Workbench

Weiterhin nur fixture-/preview-basiert waren:

- `apps/web/src/app/beteiligung/page.tsx`
- `apps/web/src/app/beteiligung/[slug]/page.tsx`
- `apps/web/src/features/participation/publicParticipationSpaceIndex.tsx`
- `apps/web/src/features/participation/publicParticipationSpaceShell.tsx`
- `apps/web/src/features/participation/fixtures/publicParticipationSpace.ts`

Die Luecke war damit klar:

- echte interne Participation-Space-Runtime war vorhanden
- ein separater Activation-/Publish-Workflow fehlte
- die oeffentliche `/beteiligung`-Route war noch keine echte Runtime

## Vorhandene Participation-Space-Strukturen

Gefunden und weiterverwendet wurden:

- Participation-Space-Container-/Status-/Visibility-Contract:
  `spaceContainer.ts`
- persistente Beteiligungsraum-Runtime-Creation:
  `participationSpaceRuntime.ts`,
  `participationSpaceRuntimeServer.ts`
- bestehende Create-Handoff-/Review-Queue-/Admin-Review-Struktur:
  `persistedHandoffReviewQueue.ts`,
  `createHandoffReviewQueueRuntimeBridge.ts`,
  `features/reviewQueue.ts`,
  `/admin/review`
- oeffentliche Shell-/Index-Lesart:
  `publicParticipationSpaceShell.tsx`,
  `publicParticipationSpaceIndex.tsx`,
  `publicParticipationSpace.ts`

Wichtige Einordnung:

- echte Participation-Space-Persistenz existierte nach #265 bereits
- echte Public-Route-Runtime fuer `/beteiligung` existierte weiterhin nicht
- `/beteiligung` und `/beteiligung/[slug]` bleiben in diesem Slice bewusst
  fixture-/preview-basiert

## Neu ergänzt

Neu ergänzt wurden:

- `apps/web/src/features/create/participationSpacePublishWorkflow.ts`
  - separater Activation-/Publish-Contract
  - Status-, Visibility-, Blocker- und Guardrail-Modell
  - getrennte Funktionen fuer Activation-Approval, Activation,
    Publication-Approval und Publish
- `apps/web/src/features/create/participationSpaceRuntimeServer.ts`
  - persistente Publish-/Activation-Records
  - persistente Publish-/Activation-Audits
  - Update des echten internen Participation-Space-Objekts nur im expliziten
    Action-Pfad
- Admin-Review-Integration
  - `loadAdminParticipationSpacePublishSectionProps.ts`
  - `AdminParticipationSpacePublishSection.tsx`
  - `ParticipationSpacePublishActions.tsx`
  - `/api/admin/participation-space-publish/[sourceHandoffId]/route.ts`

## Neue Publish-/Activation-Semantik

Der neue Pfad trennt jetzt sauber:

1. Creation
2. interne Aktivierungsfreigabe
3. interne Aktivierung
4. Veröffentlichungsfreigabe
5. expliziten Publish-Schritt

Wichtig:

- Creation ist nicht Publish
- Creation ist nicht oeffentliche Aktivierung
- `created` ist nicht public
- `active_internal` ist nicht public
- `ready_for_publication_review` ist nicht public
- Public Visibility entsteht nur nach dem expliziten Publish-Schritt

## Statusmodell

Publish-/Activation-Status:

- `draft`
- `queued_for_review`
- `approved_for_activation`
- `activated`
- `approved_for_publication`
- `published`
- `rejected`
- `blocked`
- `archived`

## Visibility-Modell

Workflow-Visibility:

- `internal_review`
- `editorial_workspace`
- `active_internal`
- `ready_for_publication_review`
- `public`

Participation-Space-Objekt bleibt zusaetzlich auf dem vorhandenen
Space-Contract:

- vor Aktivierung intern `review_only`
- nach interner Aktivierung weiterhin `review_only`
- erst nach explizitem Publish `public_read_only`

## Approval-, Blocker- und Audit-Semantik

Blocker:

- `participation_space_missing`
- `participation_space_not_created`
- `creation_not_audited`
- `activation_not_approved`
- `publication_not_approved`
- `missing_title`
- `missing_question`
- `missing_description`
- `source_review_pending`
- `moderation_pending`
- `unresolved_abuse_signal`
- `unresolved_trust_quality_blocker`
- `graph_context_pending`
- `dossier_context_pending`
- `anlassraum_context_pending`
- `public_copy_missing`
- `moderation_policy_missing`
- `unsafe_auto_publish`
- `insufficient_audit_context`

Approval und Execution bleiben getrennt:

1. `approveParticipationSpaceActivation`
2. `activateApprovedParticipationSpace`
3. `approveParticipationSpacePublication`
4. `publishApprovedParticipationSpace`

Audit-Trail:

- `activation_requested`
- `activation_approved`
- `activation_rejected`
- `activated_internal`
- `publication_requested`
- `publication_approved`
- `publication_rejected`
- `published_public`

Jeder Schritt verlangt:

- explizite Freigabe
- erneute Blocker-Pruefung
- Audit-Kontext

Creation-Approval wird ausdruecklich nicht als Publication-Approval
wiederverwendet.

## Oeffentliche `/beteiligung`-Runtime

Die oeffentliche Route ist weiterhin nicht an die persistierte Runtime
angeschlossen.

Ehrliche Einordnung:

- interne Publish-/Activation-Runtime: ja, jetzt vorhanden
- oeffentliche `/beteiligung`-Route aus persistierter Runtime: nein
- aktueller Zustand: fixture-/preview-basiert
- Folgepfad: `PARTICIPATION-SPACE-PUBLIC-ROUTE-RUNTIME-05`

Das bedeutet:

- `publishApprovedParticipationSpace` setzt oeffentliche Sichtbarkeit im
  internen Store explizit
- die bestehende oeffentliche Route liest diesen Store noch nicht
- es wurde bewusst keine Fake-Public-Route gebaut

## Warum Creation nicht Publish ist

Creation erzeugt nur:

- einen echten internen Beteiligungsraum
- Runtime-Records und Runtime-Audits
- keinen Public-Link
- keine Public-Route-Anbindung
- keinen `public`-Workflow-Status

## Warum Activation nicht Public ist

Interne Aktivierung bedeutet hier:

- separater Freigabeschritt
- interner Runtime-/Space-Zustandswechsel
- weiterhin `review_only` auf dem echten Participation-Space-Objekt
- weiterhin keine oeffentliche Route-Anbindung

`active_internal` bleibt bewusst nicht oeffentlich.

## Warum Public nur explizit gesetzt wird

Oeffentliche Sichtbarkeit entsteht nur im expliziten Publish-Schritt:

- nach separater Publication-Approval
- nach erneuter Blocker-Pruefung
- mit Audit-Kontext
- ohne automatische Side Effects aus Creation

Created/Activated-Staende erzeugen keinen stillen Public-Sprung.

## Warum keine automatische Wahrheit oder Verifikation entsteht

Review-Kontext bleibt Review-Kontext:

- Community-Hinweise sind keine Wahrheit
- Trust-/Quellenqualitaets-Signale sind keine Verifikation
- Graph-Bezuege sind kein Beweis
- Dossier-Kontext ist kein Beweis
- Anlassraum-Kontext ist kein Beweis
- Mehrheiten sind keine Wahrheit
- Fakten werden nicht automatisch verifiziert
- Quellen werden nicht automatisch verifiziert

## Guardrails

Explizit erzwungen:

- no auto publish
- no auto activation
- no public visibility as side effect
- no creation approval as publication approval
- no fact verification by default
- no source verification by default
- no community hint as truth
- no trust/source-quality as verification
- no graph edge as proof
- no dossier context as proof
- no anlassraum context as proof
- no majority as truth
- no hidden DeepSearch/cost path
- no auto graph
- no auto merge

## Tests und Build

Revalidiert mit:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/participation-space-publish-workflow.test.ts tests/participation-space-publish-admin.test.tsx tests/participation-space-runtime-creation.test.ts tests/participation-space-runtime-admin-creation.test.tsx tests/admin-review.page.test.tsx tests/create-handoff-review-queue-runtime-bridge.test.ts`
- `pnpm -C apps/web run build`

## Offene Folgepfade

Bewusst offen bleiben:

- `PARTICIPATION-SPACE-PUBLIC-ROUTE-RUNTIME-05`
- oeffentliche Submission-/Moderationshaertung fuer Beteiligungsraeume
- `DOSSIER-PUBLISH-WORKFLOW`
- `ANLASSRAUM-PUBLISH-OR-ACTIVATION-WORKFLOW`
- `COMMUNITY-SOURCE-REVIEW-WORKBENCH-06`
- `COMMUNITY-SOURCE-REVIEW-PUBLIC-SUBMISSION-HARDENING-05`
- automatische Topic-Deduplication
- Auto-Graph / Auto-Merge

## Ergebnis

`PARTICIPATION-SPACE-PUBLISH-OR-ACTIVATION-WORKFLOW` ist jetzt als
separater, review-first, auditierbarer Activation-/Publish-Pfad fuer intern
erzeugte Beteiligungsraeume umgesetzt.

Runtime-wired sind jetzt:

- Aktivierungsfreigabe
- interne Aktivierung
- Veröffentlichungsfreigabe
- expliziter Publish-Schritt
- persistente Workflow-Records
- persistente Workflow-Audits

Nicht runtime-wired bleibt bewusst:

- die oeffentliche `/beteiligung`-Route fuer persistierte Runtime-Raeume
