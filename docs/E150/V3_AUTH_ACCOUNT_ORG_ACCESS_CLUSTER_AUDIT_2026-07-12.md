# V3 Auth / Account / Organization / Access Cluster Audit

Date: 2026-07-12
Branch: `pr/v3-auth-account-org-access-cluster-01`

Completed tasks:

- `V3-AUTH-ACCOUNT-ORG-DIRECT-START-PATH-01`
- `V3-ROLES-PERMISSIONS-ENTITLEMENTS-SURFACE-AUDIT-01`

## What changed

- Added `apps/web/src/features/access/productionEntryContract.ts` as a small canonical source for:
  - direct-start path truth (`/login`, `/register`, `/account`, `/account/organization`, `/account/organization/dashboard`, `/order`, legacy `/vormerken`)
  - direct-start trust copy
  - register bridge handling for `/order`, `/vormerken` and `/pricing`
  - shared blocked/pending/limited access semantics for organization-facing surfaces
- Updated active direct-start surfaces:
  - `/login`
  - `/register`
  - `/account`
  - `/account/organization`
  - `/account/organization/dashboard`
- Updated active admin/access surfaces:
  - `/admin/access`
  - `/admin/entitlements`
- Kept `/order` as canonical package path and `/vormerken` as reachable legacy/fallback surface. No redirect, remove or new product logic was added to `/vormerken`.

## Harmonized product truth

- Direct-start is now consistently framed as:
  - anmelden
  - registrieren
  - Organisation anlegen oder beitreten
  - Status/Freischaltung prüfen
  - direkt im Arbeitsbereich oder Paketpfad weitergehen
- `/vormerken` stays legacy/fallback/info only and is no longer framed as primary funnel.
- Membership, contract, entitlement and billing gates stay visibly separate.
- Roles alone do not imply hidden activation, publication or admin authority.

## Validation

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/production-entry-contract.test.ts tests/auth-registration-flow.contract.test.ts tests/account-organization-page.contract.test.tsx tests/admin-access-entitlements-surface.contract.test.tsx`
- `pnpm -C apps/web exec vitest run tests/account-organization-dashboard.page.test.tsx tests/start-shared-create-composer.contract.test.tsx tests/dashboard-role-contracts.test.ts tests/order-entry-trust-copy.contract.test.tsx tests/vormerken-page.contract.test.tsx`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web run typecheck`
