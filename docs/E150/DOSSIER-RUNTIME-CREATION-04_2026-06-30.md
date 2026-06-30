# DOSSIER-RUNTIME-CREATION-04

Stand: 2026-06-30

## Ausgangslage nach #262

Nach `COMMUNITY-SOURCE-REVIEW-TRUST-SOURCE-QUALITY-05` war der Pfad
`Create -> Handoff -> Review Queue -> Factcheck / Community Review / Moderation -> Admin Review`
stark abgesichert, aber Dossier-Kandidaten aus `create_handoff` konnten noch nicht als echte
Runtime-Entität angelegt werden.

Vorhandene relevante Strukturen:

- `apps/web/src/features/create/persistedHandoffReviewQueue.ts`
  Persistente `create_handoff`-Records mit Scope-, Access- und Review-Kontext.
- `features/reviewQueue.ts`
  Bestehende zentrale Review-Queue und `/admin/review`-Readmodel.
- `features/dossier/db.ts`
  Produktive Dossier-Collections für `dossiers`, Claims, offene Fragen, Revisionszählung und
  Count-Refresh.
- `features/dossier/server/studioPersistence.ts`
  Persistenter Studio-/Workspace-Store für reviewpflichtige Dossier-Arbeitsstände.
- `apps/web/src/app/api/dossier/[id]/route.ts`
  Öffentliche Dossier-Route, die bewusst nur `StoredDossier`-Viewer-Stände ausliefert und
  review-only Dossiers ehrlich mit `dossier_review_only` blockt.

## Einordnung der vorhandenen Dossier-Strukturen

- Bestehender Dossier-Contract:
  vorhanden über `features/dossier/schemas.ts` und `features/dossier/db.ts`
- Bestehendes Dossier-Readmodel:
  vorhanden über `features/dossier/updateReadModel.ts`
- Bestehende Dossier-Persistenz:
  vorhanden über `features/dossier/db.ts`
- Bestehende Dossier-Route/API:
  vorhanden, aber Public Viewer bleibt getrennt von review-only Runtime-Ständen
- Bestehende Admin-/Review-Freigabe:
  vorhanden über `/admin/review`
- Bestehende Publish-Semantik:
  vorhanden und weiterhin getrennt; Creation setzt keinen Publish-Status
- Nur Fixtures/Preview:
  nein für Handoff-, Review- und Dossier-Persistenz
- Legacy/unwired:
  der öffentliche Viewer-Pfad bleibt bewusst getrennt; Creation schreibt nicht in `dossier_store`

## Neu ergänzt

- `apps/web/src/features/create/dossierRuntime.ts`
  Kleiner Contract für:
  - `DossierRuntimeDraft`
  - `DossierRuntimeRecord`
  - `DossierRuntimeStatus`
  - `DossierRuntimeCreationBlocker`
  - `DossierRuntimeSourceStatus`
  - `DossierRuntimeVisibility`
  - Guardrail-, Summary- und Creation-Logik
- `apps/web/src/features/create/dossierRuntimeServer.ts`
  Persistente review-only Dossier-Runtime-Records plus Audit und echte Creation in die
  vorhandenen Dossier-/Studio-Stores
- `/api/admin/dossier-runtime/[sourceHandoffId]`
  Explizite Admin-Aktionen:
  - `approveDossierCreation`
  - `rejectDossierCreation`
  - `createApprovedDossier`
- `/admin/review`
  Neue kleine Sektion `Dossier erstellen prüfen` in der bestehenden Workbench

## Echte Dossier-Persistenz

Ja. Es gab bereits sichere Persistenz, daher wurde kein Fake-Repository gebaut.

Der Slice nutzt:

- `ensureDossierForStatement(...)` für den kanonischen Dossier-Datensatz
- `dossierClaimsCol()` für übernommene Claims
- `openQuestionsCol()` für übernommene offene Fragen
- `updateDossierCounts(...)` für den bestehenden Zähler-/Revisionspfad
- `createOrGetDossierStudioWorkspace(...)` für den reviewpflichtigen redaktionellen Arbeitsstand

Nicht genutzt wurde bewusst:

- `dossier_store` / `StoredDossier` als Public-Viewer-Quelle

Begründung:

- Creation darf keine Veröffentlichung behaupten
- die öffentliche Dossier-Route würde sonst sofort einen lesbaren Public-Stand erzeugen
- review-only Creation muss daher in den vorhandenen internen Dossier-/Studio-Pfaden bleiben

## Statusmodell

- `draft`
- `queued_for_review`
- `approved_for_creation`
- `created`
- `rejected`
- `blocked`
- `archived`

## Blocker

- `review_not_approved`
- `missing_title`
- `missing_summary`
- `source_review_pending`
- `moderation_pending`
- `unresolved_abuse_signal`
- `unresolved_trust_quality_blocker`
- `graph_context_pending`
- `unsafe_auto_create`
- `publish_not_allowed`
- `insufficient_audit_context`

## Review- und Approval-Semantik

- `approved_for_setup` allein reicht ausdrücklich nicht
- echte Creation verlangt `approved_for_creation`
- Approval ist nur mit Audit-Kontext belastbar
- offene Source-, Moderations-, Abuse- oder Trust-/Quality-Blocker verhindern Creation
- Create schreibt erst nach expliziter Freigabe in bestehende Dossier-/Studio-Persistenz

## Audit Trail

Persistente Audit-Aktionen für den neuen Pfad:

- `draft_derived`
- `creation_approved`
- `creation_rejected`
- `creation_blocked`
- `runtime_created`

Die Audit-Historie bleibt in der bestehenden `/admin/review`-Workbench sichtbar.

## Warum Creation nicht Publish ist

- neue Runtime-Records starten `internal_review`
- erfolgreiche Creation wechselt nur auf `editorial_workspace`
- Public Viewer bleibt getrennt und liefert review-only Dossiers weiter als
  `dossier_review_only`
- es wird kein `published`-Flag gesetzt

## Warum keine automatische Wahrheit entsteht

- Community-Hinweise bleiben Review-Signale
- Trust und Source Quality priorisieren nur Review
- Graph-Bezüge bleiben Kontext, kein Beweis
- übernommene Claims bleiben offene Dossier-Claims, nicht verifizierte Fakten

## Keine Anlassraum-/Beteiligungsraum-Side-Effects

Der Slice erzeugt:

- kein Anlassraum-Runtime-Objekt
- kein Participation-Space-Runtime-Objekt
- keinen Auto-Graph
- keinen Auto-Merge

Diese Pfade bleiben separat offen.

## Guardrails

- no auto dossier from AI alone
- no auto publish
- no fact verification by default
- no source verification by default
- no community hint as truth
- no trust/source-quality as verification
- no graph edge as proof
- no majority as truth
- no anlassraum creation
- no participation-space creation
- no hidden DeepSearch/cost path

## Tests / Build

Revalidiert mit:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/dossier-runtime-creation.test.ts tests/dossier-runtime-admin-creation.test.tsx tests/create-handoff-review-queue-runtime-bridge.test.ts tests/admin-review.page.test.tsx tests/topic-graph-admin-approval-ui.test.tsx tests/community-source-review-moderation-ui.test.tsx tests/community-source-review-trust-source-quality.test.ts`
- `pnpm -C apps/web run build`

## Offene Folgepfade

- `DOSSIER-PUBLISH-WORKFLOW`
- `ANLASSRAUM-RUNTIME-CREATION-04`
- `PARTICIPATION-SPACE-RUNTIME-CREATION-04`
- `COMMUNITY-SOURCE-REVIEW-WORKBENCH-06`
- `COMMUNITY-SOURCE-REVIEW-PUBLIC-SUBMISSION-HARDENING-05`

