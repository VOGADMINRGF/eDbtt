# PARTICIPATION-SPACE-PUBLIC-ROUTE-RUNTIME-05

## Ausgangslage nach #267

Nach `PARTICIPATION-SPACE-RUNTIME-CREATION-04`, `PARTICIPATION-SPACE-PUBLISH-OR-ACTIVATION-WORKFLOW` und `CI-PRODUCTION-VALIDATION-WORKFLOW-FIX-01` gab es bereits:

- eine echte persistierte interne Beteiligungsraum-Runtime
- einen separaten Aktivierungs- und Veröffentlichungsworkflow
- eine öffentliche `/beteiligung`- und `/beteiligung/[slug]`-Surface, die weiterhin nur Fixture-/Preview-Daten las

Die Runtime modellierte öffentliche Sichtbarkeit intern bereits korrekt, die Public Route nutzte diese Wahrheit aber noch nicht.

## Bisherige Fixture-/Preview-Surface

- Index und Detailroute lasen nur `features/participation/fixtures/publicParticipationSpace.ts`
- die Surface war read-only und guardrail-sicher, aber keine echte Runtime-Projektion
- veröffentlichte Runtime-Beteiligungsräume erschienen öffentlich noch nicht

## Neue Runtime-Readmodel-Anbindung

Neu ist `apps/web/src/features/participation/publicParticipationSpaceRuntime.ts`.

Das Modul:

- liest Publish-Records aus der persistierten Participation-Space-Runtime
- behandelt nur explizit `published` + `public` freigegebene Räume als öffentlich sichtbar
- mappt diese Records in ein kleines read-only Public-Readmodel für Index und Detail
- filtert interne Felder bewusst weg
- nutzt Fixtures nur noch als klar gekennzeichneten Fallback, wenn noch keine veröffentlichte Runtime vorliegt

Angebundene Routen:

- `/beteiligung`
- `/beteiligung/[slug]`

## Öffentlich sichtbare Status

Öffentlich sichtbar sind nur Räume, die im Publish-Workflow wirklich veröffentlicht wurden:

- Publish-Status `published`
- Public-Visibility `public`
- Space-Visibility `public_read_only`

## Nicht öffentlich sichtbare Status

Bewusst nicht sichtbar bleiben:

- `created`
- `active_internal`
- `ready_for_publication_review`
- `approved_for_publication`, solange kein erfolgreicher Publish erfolgt ist
- `blocked`
- `rejected`
- `archived`

Creation ist nicht Publish. Activation ist nicht Public. Publication Approval ist nicht Public, bis Publish erfolgreich ausgeführt wurde.

## Public-safe Mapping

Öffentlich ausgegeben werden nur:

- Titel, Slug, öffentliche Kurzbeschreibung
- öffentliche Headline / Summary
- grobe Status-/Sichtbarkeitslabels
- öffentliche Zählwerte
- letzte öffentliche Aktualisierung

Bewusst nicht öffentlich ausgegeben werden:

- Audit-Trails
- Review-Queue-IDs
- Abuse-/Trust-/Moderations-Interna
- Community-Signal-Interna
- personenbezogene Reviewer-/Admin-Daten
- Graph-Referenzen
- Dossier-/Anlassraum-Kontext als Beweis
- Trust-/Source-Quality als Verifikation

## Fixture-Fallback

Der bisherige Fixture-Pfad wurde nicht hart entfernt, sondern auf einen klar gekennzeichneten Fallback reduziert:

- wenn veröffentlichte Runtime-Räume vorhanden sind, liest die Route nur Runtime
- wenn noch keine veröffentlichte Runtime vorliegt, bleibt die frühere Preview-Lesart sichtbar, aber klar als Fixture-/Preview-Fallback markiert

Dadurch bleibt die bestehende Preview-Surface ehrlich nutzbar, ohne sie als echte Runtime auszugeben.

## Detailroute

Die bestehende Detailroute `/beteiligung/[slug]` wurde mit derselben Runtime-Readmodel-Logik verdrahtet.

- veröffentlichte öffentliche Räume laden read-only
- nicht öffentliche Slugs geben `notFound`
- Fixture-Fallback greift nur, solange noch keine veröffentlichte Runtime vorliegt

Ein separater Folgepfad `PARTICIPATION-SPACE-PUBLIC-DETAIL-ROUTE-RUNTIME-06` war deshalb nicht nötig.

## Warum die Public Route read-only bleibt

Die Public Route:

- liest nur
- mutiert keine Runtime-Daten
- führt keine Aktivierung aus
- führt keinen Publish aus
- schreibt keinen Graph
- merged nichts

Öffentliche Sichtbarkeit entsteht ausschließlich im separaten Publish-Workflow und nie als Seiteneffekt der Public Route.

## Guardrails

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
- no internal review/audit/abuse/trust leak

## Tests / Build

Gelaufen:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/participation-space-public-route-runtime.test.tsx tests/participation-space-public-detail-runtime.test.tsx tests/participation-space-publish-workflow.test.ts tests/participation-space-runtime-creation.test.ts tests/admin-review.page.test.tsx`
- `pnpm -C apps/web run build`

## Offene Folgepfade

Bewusst offen bleiben:

- `DOSSIER-PUBLISH-WORKFLOW`
- `ANLASSRAUM-PUBLISH-OR-ACTIVATION-WORKFLOW`
- `COMMUNITY-SOURCE-REVIEW-WORKBENCH-06`
- `COMMUNITY-SOURCE-REVIEW-PUBLIC-SUBMISSION-HARDENING-05`
- weitere Public-Moderation-/Submission-Härtung
- `PRODUCTION-DEPLOYMENT-VALIDATION-CONTRACT-02`
- Auto-Graph / Auto-Merge bleiben weiterhin nicht gewollt
