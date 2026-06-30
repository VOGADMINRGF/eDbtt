# PARTICIPATION-SPACE-RUNTIME-CREATION-04

Stand: 2026-06-30

## Ausgangslage nach #264

Nach `ANLASSRAUM-RUNTIME-CREATION-04` existierte bereits ein review-first Pfad fuer:

- persistierte `create_handoff`-Kandidaten
- zentrale Review-Queue-/Admin-Review-Lesart
- review-approved Dossier-Runtime-Creation
- review-approved Anlassraum-Runtime-Creation

Fuer Beteiligungsraeume gab es davor jedoch noch keine echte Runtime-Creation.
Vorhanden waren nur vorbereitende oder oeffentliche Read-/Fixture-Strukturen:

- `apps/web/src/features/participation/spaceContainer.ts`
  typed Participation-Space-Container mit Status-/Visibility-Contract und
  `createEmptyParticipationSpace(...)`
- `apps/web/src/features/participation/publicParticipationSpaceShell.tsx`
  oeffentliche Shell fuer bereits gelesene Beteiligungsraum-Staende
- `apps/web/src/features/participation/publicParticipationSpaceIndex.tsx`
  oeffentliche Index-/Liste fuer die bestehende Beteiligungs-Surface
- `apps/web/src/features/participation/fixtures/publicParticipationSpace.ts`
  Fixtures fuer die oeffentliche Surface
- `apps/web/src/features/create/persistedHandoffReviewQueue.ts`
  persistente `create_handoff`-Records mit Review-/Scope-/Access-Kontext
- `apps/web/src/features/create/createHandoffReviewQueueRuntimeBridge.ts`
  Runtime-Bridge zwischen Create-Handoffs und Review-Queue
- `apps/web/src/app/admin/review/page.tsx`
  bestehende Admin-Review-Workbench

Die Ausgangslage war damit klar:

- ein Participation-Space-Contract war vorhanden
- oeffentliche Fixture-/Shell-Lesarten waren vorhanden
- eine echte Beteiligungsraum-Persistenz fuer review-approved Runtime-Creation existierte noch nicht

## Vorhandene Strukturen

Gefunden und wiederverwendet wurden:

- Handoff-Persistenz:
  `apps/web/src/features/create/persistedHandoffReviewQueue.ts`
- Handoff-/Review-Bridge:
  `apps/web/src/features/create/createHandoffReviewQueueRuntimeBridge.ts`
- bestehende Dossier-/Anlassraum-Runtime-Patterns:
  `apps/web/src/features/create/{dossierRuntime.ts,dossierRuntimeServer.ts,anlassraumRuntime.ts,anlassraumRuntimeServer.ts}`
- Participation-Space-Contract:
  `apps/web/src/features/participation/spaceContainer.ts`
- bestehende Admin-Review-Workbench:
  `/admin/review`

Nicht vorhanden war vor diesem Slice:

- keine produktive Participation-Space-Collection fuer review-approved Creation
- kein eigener Runtime-Record-/Audit-Layer
- keine Admin-Action-Schicht fuer Beteiligungsraum-Creation
- kein persistenter Create-Handoff-Aktionstyp fuer `prepare_participation_space`

## Neu ergänzt

Neu ergänzt wurden:

- `apps/web/src/features/create/participationSpaceRuntime.ts`
  - review-first Contract fuer Draft, Record, Status, Visibility, Source-Status und Blocker
  - Builder aus Anlassraum, Dossier, Handoff und Review-Item
  - Guardrails gegen unsichere Creation, Auto-Publish, Auto-Activation und Public-Side-Effects
- `apps/web/src/features/create/participationSpaceRuntimeServer.ts`
  - persistente Runtime-Records
  - persistente Runtime-Audits
  - echte interne Participation-Space-Creation in eine neue Mongo-Runtime
  - Approve-, Reject- und Create-Pfad
- Admin-Review-Integration
  - `apps/web/src/app/admin/review/loadAdminParticipationSpaceRuntimeCreationSectionProps.ts`
  - `apps/web/src/app/admin/review/AdminParticipationSpaceRuntimeCreationSection.tsx`
  - `apps/web/src/app/admin/review/ParticipationSpaceRuntimeCreationActions.tsx`
  - `/api/admin/participation-space-runtime/[sourceHandoffId]/route.ts`
- Handoff-/Queue-Wiring
  - `apps/web/src/features/create/createHandoff.ts`
  - `apps/web/src/features/create/createHandoffReviewQueueRuntimeBridge.ts`
  - `apps/web/src/features/create/createProductionAccess.ts`
  - `apps/web/src/app/api/create/handoffs/route.ts`
  - `apps/web/src/features/create/persistedHandoffReviewQueue.ts`
  - `features/reviewQueue.ts`
- fokussierte Tests
  - `apps/web/tests/participation-space-runtime-creation.test.ts`
  - `apps/web/tests/participation-space-runtime-admin-creation.test.tsx`
  - Update angrenzender Review-/Bridge-Tests

## Persistenzlage

Vor diesem Slice existierte keine echte review-approved Participation-Space-Persistenz.
Es gab nur:

- typed Contract-/Container-Strukturen
- oeffentliche Fixture-/Shell-/Index-Lesarten
- Handoff- und Review-Vorbereitung

Der Slice bleibt deshalb nicht `blocked_unwired`.

Statt eines Fake-Repositories wurde echte Mongo-Persistenz ergänzt:

- Runtime-Records in `participation_space_runtime_records`
- Runtime-Audits in `participation_space_runtime_audits`
- echte interne Participation-Space-Objekte in `participation_spaces`

Die eigentliche Participation-Space-Erstellung nutzt dabei den vorhandenen
Contract aus `spaceContainer.ts` und materialisiert ueber
`createEmptyParticipationSpace(...)` einen echten internen Raum.

## Statusmodell

Runtime-Status:

- `draft`
- `queued_for_review`
- `approved_for_creation`
- `created`
- `rejected`
- `blocked`
- `archived`

Runtime-Visibility:

- `internal_review`
- `editorial_workspace`
- `ready_for_activation_review`
- `active_internal`
- `published`

Participation-Space-Objekt:

- `status: "review_active"`
- `visibility: "review_only"`

Wichtig:

- `approved_for_creation` ist nicht veroeffentlicht
- `created` ist nicht veroeffentlicht
- `active_internal` ist nicht oeffentlich
- `review_only` ist kein Public-Go-Live

## Blocker und Approval-Semantik

Creation bleibt blockiert bei:

- fehlender expliziter Freigabe (`review_not_approved`)
- fehlendem Titel, fehlender Leitfrage oder Beschreibung
- offener Quellenpruefung
- offener Moderation
- offenem Abuse-/Spam-Signal
- offenem Trust-/Quellenqualitaets-Blocker
- fehlendem Anlassraum-Kontext, falls erforderlich
- fehlendem Dossier-Kontext, falls erforderlich
- fehlendem Graph-Kontext, falls erforderlich
- unvollstaendigem Audit-Kontext
- Guardrail-Verletzung gegen unsichere oder oeffentliche Creation

Approval und Create sind bewusst getrennt:

1. `approveParticipationSpaceCreation(...)` markiert nur
   `approved_for_creation`
2. `createApprovedParticipationSpace(...)` prueft erneut alle Blocker
3. erst danach wird in die echte interne Participation-Space-Runtime geschrieben

## Audit Trail

Persistente Runtime-Audit-Aktionen:

- `draft_derived`
- `creation_approved`
- `creation_rejected`
- `creation_blocked`
- `runtime_created`

Damit bleibt nachvollziehbar:

- welcher Handoff zugrunde lag
- wer Creation freigegeben oder abgelehnt hat
- warum Erstellung erlaubt oder verhindert wurde
- welcher echte interne Beteiligungsraum daraus entstanden ist

## Warum Creation nicht Publish ist

Der neue Pfad erzeugt nur einen internen Arbeitsstand:

- Runtime-Visibility endet bei `active_internal`
- Participation-Space-Visibility bleibt `review_only`
- es wird kein Public-Link erzeugt
- es wird kein `published`-Status gesetzt
- es gibt keinen Visibility-Sprung in einen oeffentlichen Surface-State

Creation ist damit strikt von Publish getrennt.

## Warum Creation nicht öffentliche Aktivierung ist

Der Slice erzeugt bewusst keinen oeffentlichen Beteiligungsbetrieb:

- keine oeffentliche Aktivierung
- keine Freigabe fuer oeffentliche Teilnahme
- keine automatische Community-Oeffnung
- keine automatische Moderations- oder Submission-Freischaltung
- keine neue oeffentliche Betriebsbehauptung fuer `/beteiligung`

Public Runtime, Publish und Activation bleiben eigene Folgepfade.

## Warum keine automatische Wahrheit oder Verifikation entsteht

Review-Kontext bleibt Review-Kontext:

- Community-Hinweise sind keine Wahrheit
- Trust- und Quellenqualitaets-Signale sind keine Verifikation
- Dossier-Kontext ist kein Beweis
- Anlassraum-Kontext ist kein Beweis
- Graph-Kontext ist kein Beweis
- Mehrheiten sind keine Wahrheit
- Quellen werden nicht automatisch verifiziert
- Fakten werden nicht automatisch verifiziert

## Guardrails

Explizit erzwungen:

- no auto participation space from AI alone
- no auto publish
- no auto activation
- no public visibility side effect
- no fact verification by default
- no source verification by default
- no community hint as truth
- no trust/source-quality as verification
- no graph context as proof
- no dossier context as proof
- no anlassraum context as proof
- no majority as truth
- no auto graph write
- no auto merge
- no hidden DeepSearch/cost path

## Tests und Build

Revalidiert mit:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/participation-space-runtime-creation.test.ts tests/participation-space-runtime-admin-creation.test.tsx tests/anlassraum-runtime-creation.test.ts tests/anlassraum-runtime-admin-creation.test.tsx tests/dossier-runtime-creation.test.ts tests/dossier-runtime-admin-creation.test.tsx tests/create-handoff-review-queue-runtime-bridge.test.ts tests/admin-review.page.test.tsx`
- `pnpm -C apps/web run build`

## Offene Folgepfade

Bewusst offen bleiben:

- `PARTICIPATION-SPACE-PUBLISH-OR-ACTIVATION-WORKFLOW`
- Public Participation Runtime fuer `/beteiligung`
- oeffentliche Submission-/Moderationshaertung
- breitere interne Participation-Workbench ausserhalb des review-approved Create-Pfads
- automatische Beteiligungsraum-Erstellung
- automatische Wahrheits- oder Quellenverifikation
- automatischer Graph-Write oder Merge

## Ergebnis

`PARTICIPATION-SPACE-RUNTIME-CREATION-04` ist jetzt als review-approved,
auditierbare, echte interne Beteiligungsraum-Runtime-Creation umgesetzt.

Vorher existierte keine echte Participation-Space-Persistenz fuer diesen Pfad.
Jetzt ist Runtime-Creation moeglich und nicht mehr `blocked_unwired`.

Der Slice behauptet weiterhin ausdruecklich nicht:

- Auto-Beteiligungsraum
- Auto-Publish
- oeffentliche Aktivierung
- Auto-Graph
- Auto-Merge
- automatische Wahrheit
- automatische Quellenverifikation
