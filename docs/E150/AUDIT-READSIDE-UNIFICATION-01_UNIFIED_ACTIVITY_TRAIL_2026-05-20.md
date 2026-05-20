# AUDIT-READSIDE-UNIFICATION-01

Stand: 2026-05-20

## Ziel

Die bereits persistierten Audit- und Activity-Quellen fuer Review Queue Operations und Content Release werden nicht mehr nur punktuell pro Surface angezeigt, sondern als gemeinsame typed Readside fuer den bestehenden Review-to-Publish-Pfad lesbar gemacht.

Der Slice fuehrt keine neue Produktwelt, keine neue Freigabelogik und keine grosse Persistenzmigration ein. Er vereinheitlicht nur die vorhandenen Event-Quellen fuer:

- Create-Handoffs
- Review Queue Operations
- Source Results
- Content Release
- Visibility made public / revoked
- Content archived
- Official Release fuer Participation Signals und Dossier Studio Workspaces

## Umsetzung

### 1. Neue Readside

Neu ist `features/unifiedAuditReadside.ts` mit:

- `UnifiedAuditEvent`
- `UnifiedAuditEventSource`
- `UnifiedAuditEventType`
- `UnifiedAuditActor`
- `UnifiedAuditScope`
- `UnifiedAuditReadModel`
- `listUnifiedAuditEvents(...)`
- `getUnifiedAuditTrailForItem(...)`
- `getUnifiedAuditTrailForOrganization(...)`
- `getUnifiedAuditTrailForRegion(...)`

Die Readside aggregiert bestehende Repositories und Reader, statt neue Stores einzufuehren:

- `CreateHandoffRepository`
- `ReviewQueueOperationsRepository`
- `ContentReleaseRepository`
- `ParticipationSignalReviewRuntimeRepo`
- `DossierStudioWorkspaceRepo`
- `SourceConnectionRuntimeRepo`

### 2. Scope und Sichtbarkeit

Die Readside filtert weiter ueber den bestehenden Scope-Vertrag aus `features/region/scope.ts`.

- Betreiber sehen global und bleiben als Betreiber-Modus markiert.
- Organisationen sehen nur eigenen Organisations-/Regionscope.
- Pending/Unverified sehen keine fremden Auditdaten.
- `public_official` wird nirgends automatisch gesetzt.

### 3. UI-Einbindung

Die neue Readside wird auf den bestehenden Flaechen genutzt:

- `/admin/review` zeigt pro Item einen kompakten Verlauf.
- `/account/organization/dashboard` zeigt einen eigenen Audit-Verlauf fuer den eigenen Scope.
- `features/reviewQueue.ts` traegt den vereinheitlichten Verlauf direkt an die Queue-Items.

## Guardrails

Unveraendert bewusst ausgeschlossen:

- kein Auto-Publish
- kein automatisches `public_official`
- Official Release bleibt eigener menschlicher Pfad
- kein Social Publishing
- kein Payment
- keine neue Produktparallelwelt
- keine grosse neue DB-Migration

## Validierung

Gruen gelaufen:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/unified-audit-readside.test.ts tests/review-queue.readmodel.test.ts tests/organization-dashboard.readmodel.test.ts tests/admin-review.page.test.tsx tests/account-organization-dashboard.page.test.tsx`
- `pnpm --filter @vog/web build`

## Ergebnis

Der Review-to-Publish-Pfad hat jetzt eine gemeinsame, typisierte und scope-saubere Audit-Readside. Persistierte Review-Operationen, Content-Release-Schritte und Official-Release-Ereignisse erscheinen nicht mehr nur in isolierten Teilansichten, sondern als rekonstruierbarer Verlauf auf denselben bestehenden Betreiber- und Organisationsflaechen.
