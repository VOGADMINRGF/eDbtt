# ANLASSRAUM-PUBLISH-OR-ACTIVATION-WORKFLOW

Stand: 2026-07-01
Repo: `edebatte-org`
Branch: `pr/anlassraum-publish-activation-workflow`

## Ziel

Review-approved erzeugte Anlassräume dürfen nicht implizit als intern aktiviert oder öffentlich veröffentlicht gelten.
Creation, Aktivierung und Veröffentlichung werden deshalb in getrennte, auditierbare Schritte aufgeteilt.

## Umgesetzt

- Neuer Contract `apps/web/src/features/create/anlassraumActivationWorkflow.ts`
  - getrennte Status: `draft`, `approved_for_activation`, `activated`, `approved_for_publication`, `published`, `rejected`, `blocked`, `archived`
  - getrennte Visibility/Public-Mode-Lesart
  - explizite Guardrails:
    - kein Auto-Publish
    - keine Auto-Aktivierung
    - kein Auto-Graph
    - kein Auto-Merge
    - kein Auto-Factcheck
    - kein DeepSearch
    - keine automatische Dossier- oder Beteiligungsraum-Erzeugung

- Neuer Serverpfad `apps/web/src/features/create/anlassraumActivationWorkflowServer.ts`
  - persistente Records: `anlassraum_activation_records`
  - persistente Audits: `anlassraum_activation_audits`
  - Admin-Aktionen:
    - `approveAnlassraumActivation`
    - `rejectAnlassraumActivation`
    - `activateApprovedAnlassraum`
    - `approveAnlassraumPublication`
    - `rejectAnlassraumPublication`
    - `publishApprovedAnlassraum`

- Runtime-Sync
  - Anlassraum-Creation endet jetzt in `ready_for_activation_review`, nicht mehr implizit in `active_internal`
  - interne Aktivierung setzt die Runtime explizit auf `active_internal`
  - Veröffentlichung setzt die Runtime explizit auf `published`
  - der echte Anlassraum wird erst im Aktivierungs-/Publish-Pfad auf `active` bzw. `isPublic=true` synchronisiert

- Admin-Review
  - neue Sektion `/admin/review`: `Anlassraum aktivieren/veröffentlichen prüfen`
  - neue API-Route: `/api/admin/anlassraum-activation/[sourceHandoffId]`

- Öffentliche Lesart
  - neues public-safe Readmodel: `features/anlassraum/publicRuntime.ts`
  - `/runden` liest explizit veröffentlichte Runtime-Anlassräume zusätzlich über `features/topicRound/entrySource.ts`
  - veröffentlichte Runtime-Anlassräume werden nur als `public_read_only` öffentlich gespiegelt
  - beim finalen Publish wird bewusst ein `round_seed` upsertet; kein Seed bei bloßer Creation oder interner Aktivierung

## Guardrails

- Creation Approval ist nicht Activation Approval.
- Activation Approval ist nicht Publication Approval.
- `active_internal` ist nicht öffentlich.
- Public Route zeigt nur explizit veröffentlichte Runtime-Anlassräume.
- Community-, Trust-, Moderations-, Audit- und Graph-Interna leaken nicht in die öffentliche Lesart.

## Revalidierung

- `pnpm -C apps/web exec vitest run tests/anlassraum-runtime-creation.test.ts tests/anlassraum-activation-workflow.test.ts tests/anlassraum-activation-admin.test.tsx tests/anlassraum-public-route-runtime.test.ts tests/admin-review.page.test.tsx tests/runden-entry.service.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
