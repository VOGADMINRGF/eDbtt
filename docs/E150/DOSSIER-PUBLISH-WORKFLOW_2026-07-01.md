# DOSSIER-PUBLISH-WORKFLOW

Stand: 2026-07-01
Status: done
Task: `DOSSIER-PUBLISH-WORKFLOW`

## Ausgangslage nach #271

- `#263` hat review-approved Dossier Runtime Creation bereits ergänzt.
- `#264` bis `#268` haben Anlassraum- und Beteiligungsraum-Runtime plus separaten Publish-/Public-Route-Pfad ergänzt.
- `#269` bis `#271` haben den kleinen öffentlichen Community-Source-Review-Intake und die Admin-Workbench dafür gehärtet.
- Für Dossiers fehlte danach noch die saubere Trennung zwischen Runtime Creation, Publication Review, expliziter Publish Approval und öffentlicher Sichtbarkeit.

## Gefundene Dossier Runtime / Persistence

- Dossier-Runtime-Daten liegen in den bestehenden Dossier-Collections aus `features/dossier/db.ts`, insbesondere `dossiers`, `dossier_sources`, `dossier_claims`, `dossier_findings` und `open_questions`.
- Review-approved Runtime Creation aus `create_handoff` läuft bereits über `apps/web/src/features/create/dossierRuntime.ts` und `apps/web/src/features/create/dossierRuntimeServer.ts`.
- Runtime-Creation-Audits und Record-Metadaten liegen in `dossier_runtime_records` und `dossier_runtime_audits`.
- Für den neuen Publish-Pfad kommen ergänzend `dossier_publication_records` und `dossier_publication_audits` hinzu.
- Die öffentliche Dossier-Route `apps/web/src/app/api/dossier/[id]/route.ts` hatte bereits eine read-only Public-Lesart, war für neue Runtime-Dossiers aber noch nicht an einen echten Publish-Status gebunden.

## Neues Publication-Statusmodell

- `DossierPublicationStatus`
  - `draft_internal`
  - `review_only`
  - `ready_for_publication_review`
  - `approved_for_publication`
  - `published`
  - `unpublished`
  - `rejected_for_publication`
  - `blocked`
  - `archived`
- `DossierVisibility`
  - `internal`
  - `public`
- `DossierPublicAccessMode`
  - `none`
  - `public_read_only`

Der Workflow trennt bewusst:

- Creation Approval
- Publication Review
- Publication Approval
- explizites Publish
- öffentliches Read-only Rendering

`approved_for_publication` ist absichtlich noch nicht öffentlich. Öffentliche Sichtbarkeit entsteht erst mit `publishDossier(...)`.

## Admin Workflow

- `/admin/review` enthält jetzt eine eigene Sektion `Dossier-Veröffentlichung prüfen`.
- Die Sektion zeigt Status, Visibility, Public-Access-Mode, Blocker, Guardrail-Copy und Audit-Kontext.
- Verfügbare Aktionen:
  - `Veröffentlichung prüfen anfordern`
  - `Veröffentlichung freigeben`
  - `Veröffentlichen`
  - `Veröffentlichung zurückziehen`
  - `Veröffentlichung ablehnen`
  - `Blockieren`
  - `Archivieren`
- Jede Aktion prüft den Statusübergang, schreibt Audit und verändert keine Factcheck-, Wahrheits-, Graph-, Merge- oder Nebenentitäts-States.

Guardrail-Copy in der Admin-Surface:

- `Freigabe bedeutet Veröffentlichung, nicht Wahrheitszertifikat.`
- `Quellen bleiben prüfbare Belege und Kontext, keine automatische Verifikation.`
- `Dossier-Veröffentlichung erzeugt keinen Graph Merge und keinen Anlassraum.`

## Public Readmodel / Route-Entscheidung

- Es existiert bereits eine öffentliche Dossier-Route, daher wurde kein separater Route-Folgepfad angelegt.
- Neu ist ein public-safe Runtime-Readmodel in `apps/web/src/features/dossier/publicRuntime.ts`.
- Öffentliche Listung und Detailauflösung laufen über:
  - `listPublishedDossiers(...)`
  - `getPublishedDossierBySlugOrId(...)`
  - `mapDossierToPublicDossier(...)`
  - `stripDossierInternalFieldsForPublic(...)`
- Öffentlich sichtbar werden nur Dossiers mit:
  - `status === published`
  - `visibility === public`
  - `publicAccessMode === public_read_only`
- Nicht veröffentlichte Runtime-Dossiers liefern auf der Public-Route weiter eine ehrliche `review_only`-/Holding-State-Lesart statt stiller Veröffentlichung.

## Audit

- Publish-/Unpublish-/Reject-/Block-/Archive-Entscheidungen werden in `dossier_publication_audits` append-only dokumentiert.
- Persistente Publication-Records in `dossier_publication_records` halten den aktuellen Workflow-State pro Dossier fest.
- Die bestehende Runtime-Visibility in `dossier_runtime_records` wird nur im expliziten Action-Pfad synchronisiert.
- Öffentliche Responses strippen Audit-, Review-, Admin-, Moderations-, Trust- und Source-Review-Interna.

## Statusübergänge

- `review_only -> ready_for_publication_review`
- `ready_for_publication_review -> approved_for_publication`
- `approved_for_publication -> published`
- `published -> unpublished`
- `ready_for_publication_review|approved_for_publication -> rejected_for_publication`
- `review_only|ready_for_publication_review|approved_for_publication|published|unpublished -> blocked`
- `review_only|ready_for_publication_review|approved_for_publication|published|unpublished|blocked|rejected_for_publication -> archived`

Wichtig:

- Creation Approval ist nicht Publication Approval.
- Publication Approval ist nicht Fact Verification.
- `published` ist kein Wahrheits- oder Quellenverifikationssignal.

## Guardrails

- no auto publish
- no auto activation
- creation approval is not publication approval
- publication is not fact verification
- source references are not automatic verification
- trust/source-quality/community signals are review context only
- no graph write
- no merge
- no Anlassraum/Beteiligungsraum creation
- no hidden DeepSearch/cost path
- no internal audit/review/admin leak to public

## Tests / Build

Revalidiert mit:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/dossier-publish-workflow.test.ts tests/dossier-publish-admin.test.tsx tests/dossier-public-route-runtime.test.tsx tests/admin-review.page.test.tsx tests/dossier-route.runtime-guard.test.ts`
- `pnpm -C apps/web run build`
- `git diff --check`

## Offene Folgepfade

- Anlassraum-Publish-/Activation-Workflow bleibt separater Scope und wurde hier nicht erweitert.
- Beteiligungsraum-Publish bleibt beim bereits separaten Runtime-/Public-Route-Pfad.
- `PUBLIC-MODERATION-OPERATIONS-07` bleibt offen.
- Produktionsnahe Deployment-/Release-Validierung bleibt separater Folgepfad.
- Es gibt weiterhin keinen Auto-Graph, keinen Auto-Merge, keinen Auto-Factcheck, kein DeepSearch und keine externe Recherche aus dem Dossier-Publish-Pfad.
