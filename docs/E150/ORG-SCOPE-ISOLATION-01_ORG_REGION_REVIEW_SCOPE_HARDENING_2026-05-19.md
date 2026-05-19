# ORG-SCOPE-ISOLATION-01

Stand: 2026-05-19

## Ziel

Bestehende Organisations-, Region-, Review-, Source- und Content-Release-Surfaces so härten,
dass nicht-admin Organisationen nur ihren eigenen Arbeitsbereich sehen und bearbeiten.
Admin bleibt globaler Betreiber-Modus.

## Umgesetzt

- Neuer typed Scope-Layer:
  - `OrganizationScopeContext`
  - `RegionScopeContext`
  - `ReviewQueueScopeContext`
  - `canViewOrganizationResource`
  - `canEditOrganizationResource`
  - `canViewRegionResource`
  - `canOperateReviewItem`
- Review Queue filtert und vorbereitet Workbench-Aktionen jetzt über denselben Scope-Vertrag.
- `OrganizationDashboardReadModel` nutzt denselben Scope-Vertrag für sichtbare Drafts und Queue-Zusammenfassung.
- Source Connections / Snapshot Templates tragen Organisationsscope optional mit und filtern globale Listen für non-admin auf den eigenen Bereich.
- Create-Handoffs blocken fremde Dossier-/Organisationskontexte serverseitig und erlauben Resume nur im eigenen Scope oder im Betreiber-Modus.
- Content Release Workbench prüft Source-/Handoff-Zugriff über Region-/Org-Scope statt nur über Region-Hinweise.
- Dossier-Studio-Workspace, Region-Cockpit und Participation-Signal-Routen nutzen denselben Guard-Vertrag statt lokaler Ad-hoc-Checks.

## Guardrails bestätigt

- kein Auto-Publish
- kein automatisches `public_official`
- keine automatische amtliche Antwort
- keine neue Parallelwelt
- keine neue Persistenzarchitektur
- keine neue AI-/Source-Adapter-Logik

## Validierung

- `pnpm -C apps/web exec vitest run tests/region-scope.contract.test.ts tests/region-access.contract.test.ts tests/admin-region-source-connections.route.test.ts tests/create-handoff.persistence.route.test.ts tests/review-queue.readmodel.test.ts tests/organization-dashboard.readmodel.test.ts tests/dossier-studio-workspace.route.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm --filter @vog/web build`
