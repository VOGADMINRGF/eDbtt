# ENTITLEMENT-PROVISIONING-PRODUCTION-01

Stand: 2026-05-23  
Issue: #209  
Production anchor: `prod-green-self-provisioning-20260523-0704`  
Startpunkt: Commit `e3c8eab` (Vercel Ready)

## Ziel

Nach bestätigtem Organisations-/Wirkraum-Antrag sollen Arbeitszugänge nicht still oder pauschal entstehen, sondern bewusst, scope-genau und auditierbar aus der bestehenden Entitlement-Runtime abgeleitet werden.

Nicht-Ziele dieses Slices:

- kein Payment/Checkout
- kein Auto-Publish
- kein automatisches `public_official`
- keine automatische `publication_approved`-Rolle
- keine neue Register- oder Directory-Parallelwelt

## Umsetzung

Auf der bestehenden `PaidDashboardEntitlement`-Runtime wurde eine zusätzliche, auditierbare Org-Grant-Lesart aufgebaut:

- `OrganizationEntitlementGrant`
- `OrganizationEntitlementStatus`
- `OrganizationEntitlementScope`
- `OrganizationEntitlementDecision`
- `OrganizationEntitlementSource`
- `OrganizationEntitlementAuditEvent`

Die neue Lesart bleibt bewusst eine Schicht auf derselben Runtime, nicht eine zweite Produktwelt.

### Status

- `none`
- `pending_operator_decision`
- `granted`
- `limited`
- `suspended`
- `revoked`
- `expired`

### Scopes

- `organization_dashboard`
- `region_cockpit`
- `review_queue`
- `content_release`
- `public_share`
- `dossier_studio`
- `source_connection`
- `billing_pending`

## Produktverhalten

### Organisationsdashboard

`/account/organization/dashboard` zeigt jetzt ehrlich:

- Zugang beantragt / in Entscheidung
- Zugriff freigeschaltet
- Zugriff eingeschränkt
- Zugriff pausiert oder gesperrt
- Zahlung/Vertrag offen

Zusätzlich werden die einzelnen Scope-Grants sichtbar gemacht. Dabei gilt weiterhin:

- kein automatisches `publication_approved`
- kein automatisches `public_official`
- kein Auto-Publish

### Betreiberflächen

`/admin/entitlements` zeigt jetzt zusätzlich:

- welche freigeschalteten Organisationen noch eine Entitlement-Entscheidung brauchen
- dass Arbeitszugänge bewusst gesetzt werden müssen
- dass Billing nur Marker sein kann, aber kein bezahlter Zustand behauptet wird

### Org-scoped Schreibgates

Org-scoped Routen verlangen jetzt nicht mehr nur verifizierte Membership, sondern auch den passenden Entitlement-Scope:

- Review-Operationen brauchen `review_queue`
- Content-Release-Schreibzugriffe brauchen `content_release`
- Sichtbarkeits-/Share-Aktionen brauchen `public_share`

`suspended`, `revoked` und `expired` blockieren diese Pfade sichtbar. `limited` bleibt bewusst eingeschränkt und wird nicht als bezahlter Vollzugang dargestellt.

## Guardrails

Dieser Slice setzt ausdrücklich nicht:

- Betreiberrechte aus Self-Provisioning oder Entitlement
- `publication_approved` durch Entitlement
- `public_official` durch Entitlement
- bezahlten Status aus `billing_pending`

Organisation A bleibt vom Scope von Organisation B getrennt.

## Reifestufe

Erreicht: `production_candidate`

Begründung:

- persistente Entitlement-Runtime ist vorhanden
- Audit-Events pro Organisation sind vorhanden
- Dashboard, Admin-Surface und org-scoped Schreibgates nutzen dieselbe Scope-Lesart
- automatische Provisionierung, Checkout und Billing-Linkage fehlen weiterhin

Nicht erreicht: `production_ready`

Offene Gründe:

- keine vollautomatische Provisionierung ohne Betreiberkante
- keine Billing-/Checkout-Verknüpfung
- kein autoritativer externer Register-/Directory-Bezug
- keine kommerzielle End-to-End-Automation

## Validierung

Grün:

- `pnpm -C apps/web exec vitest run tests/account-organization-dashboard.page.test.tsx tests/organization-dashboard.readmodel.test.ts tests/request-scope-context.test.ts`
- zusätzlich zielnah: `tests/org-review-item-ops.route.test.ts`, `tests/org-content-release.route.test.ts`, `tests/admin-entitlements.route.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `rm -rf apps/web/.next`
- `pnpm --filter @vog/web build`

## Folgepunkte

- Billing-/Checkout-Linkage fuer Entitlement-Provisionierung
- automatische Provisionierung ohne manuelle Betreiberkante
- klarer Admin-Pfad fuer Entitlement-Entscheidung direkt aus freigeschalteten Organisationsanträgen
- externe Directory-/Register-Wahrheit statt lokal persistenter Runtime als letzter `production_ready`-Blocker
