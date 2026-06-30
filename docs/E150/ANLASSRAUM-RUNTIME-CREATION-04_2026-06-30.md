# ANLASSRAUM-RUNTIME-CREATION-04

Stand: 2026-06-30
Task: `ANLASSRAUM-RUNTIME-CREATION-04`

## Ausgangslage nach #263

Nach `DOSSIER-RUNTIME-CREATION-04` existierte bereits ein review-first Pfad, um aus persistierten `create_handoff`-Kandidaten echte Dossier-Runtime-Objekte zu erzeugen. Für Anlassräume lagen davor nur vorbereitende Handoff- und Review-Strukturen vor:

- persistierte Create-Handoffs über `apps/web/src/features/create/persistedHandoffReviewQueue.ts`
- lokale und persistierte Review-Queue-Items über `createHandoffDrafts.ts`, `createHandoffReviewQueue.ts` und `createHandoffReviewQueueRuntimeBridge.ts`
- echte Anlassraum-Persistenz und Lifecycle-Grundlage über `features/anlassraum/{db.ts,types.ts,service.ts,governance.ts}`
- bestehende Admin-Review-Workbench über `/admin/review`

Die Lücke war damit nicht die Collection oder der Lifecycle selbst, sondern der kontrollierte review-approved Create-Pfad zwischen Handoff und realem internem Anlassraum.

## Vorhandene Strukturen

Gefunden und weiterverwendet wurden:

- Handoff-Persistenz: `apps/web/src/features/create/persistedHandoffReviewQueue.ts`
- Handoff-/Review-Kandidaten: `apps/web/src/features/create/createHandoffDrafts.ts`, `createHandoffReviewQueue.ts`
- Dossier-Runtime-Präzedenzfall: `apps/web/src/features/create/{dossierRuntime.ts,dossierRuntimeServer.ts}`
- Admin-Review-Workbench: `apps/web/src/app/admin/review/page.tsx`
- echte Anlassraum-Persistenz: `features/anlassraum/db.ts`
- echter Anlassraum-Create-Pfad ohne Auto-Publish: `features/anlassraum/service.ts` (`createManualAnlassraum`)
- echter Anlassraum-Lifecycle / Publish-Gates / Audit: `features/anlassraum/governance.ts`

Ein passender Anlassraum-Contract, ein Anlassraum-Runtime-Readmodel für review-approved Creation und eine dedizierte Admin-Action-Schicht für diesen Slice fehlten noch.

## Neu ergänzt

Neu ergänzt wurden:

- `apps/web/src/features/create/anlassraumRuntime.ts`
  - eigener review-first Contract für Draft, Record, Status, Source-Status, Visibility und Guardrails
  - Builder aus Handoff, Dossier-Kontext und Review-Item
  - Blocker-/Create-Checks
  - State-Summary und Guardrail-Checks für Auto-Publish / Beteiligungsraum-Side-Effect
- `apps/web/src/features/create/anlassraumRuntimeServer.ts`
  - persistenter Repo-Layer für Runtime-Records und Runtime-Audits
  - Build aus bestehenden persistierten `prepare_anlassraum`-Handoffs
  - Admin-Freigabe, Ablehnung und echte Erstellung
  - Materialisierung in die vorhandene Anlassraum-Collection über `createManualAnlassraum`
  - zusätzliche Struktur-Seeds in `anlassraum_structure`
- Admin-Review-Integration
  - `apps/web/src/app/admin/review/AdminAnlassraumRuntimeCreationSection.tsx`
  - `apps/web/src/app/admin/review/AnlassraumRuntimeCreationActions.tsx`
  - `apps/web/src/app/admin/review/loadAdminAnlassraumRuntimeCreationSectionProps.ts`
  - `/api/admin/anlassraum-runtime/[sourceHandoffId]/route.ts`
- fokussierte Tests
  - `apps/web/tests/anlassraum-runtime-creation.test.ts`
  - `apps/web/tests/anlassraum-runtime-admin-creation.test.tsx`
  - angrenzende Admin-Review-Regressionsanpassung in `apps/web/tests/admin-review.page.test.tsx`

## Persistenzlage

Echte Anlassraum-Persistenz war bereits vorhanden:

- Collection `anlassraum`
- Collection `anlassraum_structure`
- Audit-Events über `recordAuditEvent`
- bestehender manueller Create-Pfad mit `isPublic: false` und ohne Auto-Publish

Der Slice bleibt deshalb nicht `blocked_unwired`. Runtime Creation ist jetzt real möglich.

Die neue Runtime-Creation schreibt:

- review-first Runtime-Metadaten in `anlassraum_runtime_records`
- Runtime-Audits in `anlassraum_runtime_audits`
- den echten internen Anlassraum in die bestehende `anlassraum`-Collection
- einen minimalen internen Strukturkontext in `anlassraum_structure`

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

Wichtig:

- `approved_for_creation` ist nicht veröffentlicht
- `created` ist nicht veröffentlicht
- `active_internal` ist nicht öffentlich
- `published` wird in diesem Slice nie automatisch gesetzt

## Blocker und Approval-Semantik

Creation bleibt blockiert bei:

- fehlender expliziter Freigabe (`review_not_approved`)
- fehlendem Titel, Anlass oder Beschreibung
- offener Quellenprüfung
- offener Moderation
- offenem Abuse-/Spam-Signal
- offenem Trust-/Quellenqualitäts-Blocker
- fehlendem erforderlichen Graph-Kontext
- fehlendem erforderlichen Dossier-Kontext
- unvollständigem Audit-Kontext
- verletzten Guardrails gegen Auto-Create / Auto-Publish / Beteiligungsraum-Side-Effects

Approval und Create sind getrennt:

1. Admin markiert `approved_for_creation`
2. Runtime prüft erneut alle Blocker
3. Erst danach schreibt `createApprovedAnlassraum` in die echte Anlassraum-Persistenz

## Audit Trail

Der Slice erzeugt zwei Audit-Ebenen:

- dedizierten Runtime-Audit-Trail (`draft_derived`, `creation_approved`, `creation_rejected`, `creation_blocked`, `runtime_created`)
- bestehenden Anlassraum-Audit-Event über `createManualAnlassraum`

Damit bleibt nachvollziehbar:

- welcher Handoff zugrunde lag
- wer freigegeben oder blockiert hat
- warum Erstellung erlaubt oder verhindert wurde
- welcher echte Anlassraum daraus entstanden ist

## Warum Creation nicht Publish ist

Der neue Pfad erzeugt nur einen internen Anlassraum-Arbeitsstand:

- `isPublic` bleibt `false`
- es gibt keinen Visibility- oder Publish-Sprung
- `reviewedBy` / `approvedBy` für spätere Public-Gates werden nicht still gesetzt
- `/runden`- oder `/anlassraum`-Public-Semantik wird nicht automatisch aktiviert

Publish / Activation bleiben separate Folgepfade.

## Warum Anlassraum nicht Beteiligungsraum ist

Der neue Runtime-Pfad erstellt ausschließlich einen internen Anlassraum.

Es gibt:

- keine automatische Beteiligungsraum-Erstellung
- keine automatische Partizipationsfläche
- keine automatische Community-Open-State-Aktivierung
- keine neue Beteiligungsraum-Route oder Nebenpersistenz

## Warum keine automatische Wahrheit

Review-Kontext bleibt bewusst Review-Kontext:

- Dossier-Bezug ist kein Beweis
- Graph-Bezug ist kein Beweis
- Community-Hinweise sind keine Wahrheit
- Trust-/Quellenqualitäts-Signale sind keine Verifikation
- Mehrheiten sind keine Wahrheit
- Quellen werden nicht automatisch verifiziert
- Fakten werden nicht automatisch verifiziert

## Guardrails

Explizit erzwungen:

- no auto anlassraum from AI alone
- no auto publish
- no participation-space side effect
- no fact verification by default
- no source verification by default
- no community hint as truth
- no trust/source-quality as verification
- no graph edge as proof
- no dossier context as proof
- no majority as truth
- no hidden DeepSearch/cost path
- no auto graph write
- no auto merge

## Tests und Build

Revalidiert wurden:

- `pnpm -C apps/web exec vitest run tests/anlassraum-runtime-creation.test.ts tests/anlassraum-runtime-admin-creation.test.tsx tests/dossier-runtime-creation.test.ts tests/dossier-runtime-admin-creation.test.tsx tests/admin-review.page.test.tsx`

Während dieses Slices grün:

- fokussierte Anlassraum-/Dossier-/Admin-Review-Regressionen

Zusätzlich angestoßen:

- `pnpm -C apps/web run typecheck`

## Offene Folgepfade

Bewusst offen bleiben:

- Anlassraum Publish / Activation Workflow
- automatische Anlassraum-Erstellung
- Beteiligungsraum Runtime Creation
- automatische Beteiligungsraum-Erstellung
- automatische Graph-/Merge-Aktion
- automatische Wahrheits- oder Quellenverifikation
- Community-Workbench-Ausbau über den bestehenden Review-Kontext hinaus

## Ergebnis

`ANLASSRAUM-RUNTIME-CREATION-04` ist jetzt als review-approved, auditierbare, echte interne Anlassraum-Runtime-Creation auf bestehenden Handoff-, Admin-Review- und Anlassraum-Persistenzpfaden umgesetzt.

Der Slice behauptet weiterhin ausdrücklich nicht:

- Auto-Anlassraum
- Auto-Publish
- Auto-Graph
- Auto-Merge
- Beteiligungsraum als Side Effect
- automatische Wahrheit
