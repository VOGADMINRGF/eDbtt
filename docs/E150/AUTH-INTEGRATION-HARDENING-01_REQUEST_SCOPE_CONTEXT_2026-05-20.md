# AUTH-INTEGRATION-HARDENING-01

Stand: 2026-05-20

## Ziel

Den bestehenden Auth-/Session-Kontext produktionsnah an Organisationsmitgliedschaft, Rollen, Region-Scope und auditierbare API-Entscheidungen anbinden, ohne neues Login-System, Auto-Publish oder stillen Admin-Fallback.

## Umsetzung

- Neuer zentraler Resolver `apps/web/src/lib/server/auth/requestScope.ts`
  - `AuthenticatedActorContext`
  - `OrganizationMembershipContext`
  - `OrganizationRoleContext`
  - `RegionAccessContext`
  - `RequestScopeContext`
- Neue zentrale Resolver-Funktionen:
  - `resolveRequestScopeContext(...)`
  - `resolveOrganizationMembershipForActor(...)`
  - `resolveRegionAccessForOrganization(...)`
  - `mapSessionToOrganizationRole(...)`
- `requireGovernanceActorOrResponse(...)` und `requireAdminOrResponse(...)` lesen jetzt denselben aufgeloesten Scope statt stiller Rollenannahmen.

## Routen-Anbindung

- Org-scoped:
  - `/api/account/organization/review/items/[itemId]`
  - `/api/account/organization/review/content-release`
- Admin-/operator-scoped:
  - `/api/admin/review/items/[itemId]`
  - `/api/admin/review/content-release`
  - `/api/admin/region/source-connections`
  - `/api/admin/region/source-connections/[id]/test`
  - `/api/admin/region/participation-signals`
  - `/api/admin/region/participation-signals/[id]/review`
- Weitere Scope-sensitive Pfade:
  - `/api/create/handoffs`
  - `/api/dossier/[id]/studio/workspace`

## Wirkung

- Org-Routen tragen keinen stillen Betreiber-Fallback mehr.
- Betreiber-/Admin-Pfade markieren Betreiber-Modus explizit.
- Pending/Unverified erhalten keine Moderationsrechte aus Session-Hints allein.
- `itemId`-Direktzugriffe bleiben an aufgeloesten Org-/Regionscope gebunden.
- `public_official` wird durch diese Härtung nirgends automatisch gesetzt.

## UI

- `/account/organization/dashboard` zeigt Rolle, Scope und fehlenden bestaetigten Scope klarer.
- Betreiber-Fallback wird als `Betreiber-Modus` benannt.

## Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/request-scope-context.test.ts tests/org-review-item-ops.route.test.ts tests/org-content-release.route.test.ts tests/admin-review-item-ops.route.test.ts tests/create-handoff.persistence.route.test.ts tests/admin-region-source-connections.route.test.ts tests/admin-participation-signal-review.route.test.ts tests/dossier-studio-workspace.route.test.ts tests/organization-dashboard.readmodel.test.ts tests/account-organization-dashboard.page.test.tsx tests/admin-review.page.test.tsx tests/review-queue.readmodel.test.ts tests/content-release-workbench.test.ts`
- `pnpm --filter @vog/web build`

## Offen

- Die vollstaendige Anbindung an einen finalen produktiven externen Auth-/Directory-/Membership-Provider bleibt als Folgeaufgabe offen.
- Der neue Resolver-/Decision-Layer ist dafuer jetzt zentral und testbar vorbereitet.
