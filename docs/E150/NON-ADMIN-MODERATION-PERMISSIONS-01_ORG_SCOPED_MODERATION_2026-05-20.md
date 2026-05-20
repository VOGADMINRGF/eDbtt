# NON-ADMIN-MODERATION-PERMISSIONS-01

Stand: 2026-05-20

## Ziel

Verifizierte Organisationen, Verwaltungen und Medienpartner sollen ihre eigenen
Review-, Quellen-, Create- und Content-Release-Arbeitsstaende im
Organisationsdashboard bearbeiten koennen, ohne globale Betreiberrechte oder
fremde Audit-/Pending-Daten zu erhalten.

## Umsetzung

- `features/region/scope.ts`
  haertet den neuen Nicht-Admin-Layer mit `NonAdminModerationPermission`,
  `OrganizationModerationRole`, `OrganizationModerationAction`,
  `canOperateOwnReviewItem`, `canPrepareOwnContentRelease`,
  `canMakeOwnContentVisible`, `canArchiveOwnContent` und
  `canViewOwnAuditTrail`.
- `features/region/organizationDashboard.ts`
  legt diese Rechte als `moderationPermission` auf jedes eigene Review-Item im
  Organisations-Readmodel.
- `/account/organization/dashboard`
  zeigt jetzt einen Bereich `Meine Review-Aufgaben` mit eigenen Review-Aktionen,
  org-scoped Content-Release-Aktionen, Audit-Hinweis und klarer Copy:
  `Diese Aktion betrifft nur den Arbeitsstand deiner Organisation.`
- Neue org-scoped Routen:
  - `/api/account/organization/review/items/[itemId]`
  - `/api/account/organization/review/content-release`
  Sie nutzen dieselben bestehenden Repositories und erlauben nur Aktionen im
  eigenen Scope.
- `/admin/review`
  bleibt unveraendert die globale Betreiber-Arbeitsliste.

## Guardrails

- kein Auto-Publish
- kein automatisches `public_official`
- `public_official` bleibt Official Release
- kein Bulk-Approve
- kein Social Publishing
- kein Payment
- keine neue Produktparallelwelt

## Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/region-scope.contract.test.ts tests/org-review-item-ops.route.test.ts tests/org-content-release.route.test.ts tests/organization-dashboard.readmodel.test.ts tests/account-organization-dashboard.page.test.tsx tests/admin-review.page.test.tsx tests/review-queue.readmodel.test.ts`
- `pnpm --filter @vog/web build`

## Ergebnis

- `organization_verified`
  sieht und kommentiert nur eigene Items und kann `request_changes` /
  `mark_in_review` im eigenen Scope ausfuehren.
- `unit_verified`
  kann eigene Arbeitsstaende zusaetzlich `mark_ready`, `archive` und `block`
  sowie Content-Release vorbereiten, wenn der Scope passt.
- `publication_approved`
  kann eigene Sichtbarkeit steuern, ohne jemals automatisch `public_official`
  zu setzen.
- Pending/Unverified sehen keine fremden Daten und keine Moderationsaktionen.
- Audit-Trail bleibt fuer eigene Items sichtbar und wird nicht global geleakt.
