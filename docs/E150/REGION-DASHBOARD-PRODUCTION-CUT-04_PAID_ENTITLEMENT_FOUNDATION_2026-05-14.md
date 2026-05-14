# REGION-DASHBOARD-PRODUCTION-CUT-04

Datum: 2026-05-14  
Status: done  
Branch: `pr/region-dashboard-cut-04-paid-entitlement`

## Was wurde gebaut?

- Persistente Runtime fuer `PaidDashboardEntitlement` inkl. Status, Scope, Limits, Usage und AuditEvents.
- Serverseitige Repository-Schicht fuer `paid_dashboard_entitlements` und `edebatte_region_entitlement_audit_events`.
- Entitlement-Pruefung fuer RegionDashboard und Region-Signal-Drafts:
  - non-admin braucht jetzt **verifizierte Membership**
  - und zusaetzlich **aktive/testweise Freischaltung**
- Neue Admin-APIs:
  - `GET /api/admin/entitlements`
  - `POST /api/admin/entitlements`
  - `PATCH /api/admin/entitlements/[id]`
- Minimale Admin-Surface `/admin/entitlements` fuer manuelle Pilot-/Admin-Grants.
- `/admin/region` zeigt jetzt Membership- und Entitlement-Status getrennt:
  - authority source
  - verification status
  - entitlement status
  - entitlement reason
  - plan/source
  - grobe limits/usage

## Warum Paid Entitlement nicht Payment/Billing ist

- Dieser Schnitt fuehrt **keinen** Checkout ein.
- Dieser Schnitt fuehrt **keine** automatische Abbuchung ein.
- Dieser Schnitt fuehrt **keine** Rechnungslogik ein.
- Entitlements koennen derzeit aus folgenden Quellen kommen:
  - `admin_grant`
  - `pilot_grant`
  - `order_request`
  - `manual_contract`
  - `migration`
  - `fixture`
- Guardrails bleiben hart:
  - `noAutoBilling: true`
  - `noAutoCharge: true`

## Wie Membership und Entitlement zusammenwirken

- Self-declared oder rohe Rollenstrings erzeugen keine Freischaltung.
- Verifizierte Membership ohne Entitlement reicht nicht fuer den paid Dashboard-Pfad.
- Entitlement ohne verifizierte Membership reicht ebenfalls nicht.
- Admin bleibt `adminFallback`.
- `organization_verified` plus aktives Entitlement:
  - read-only Zugriff auf die eigene Region
- `unit_verified` plus aktives Entitlement:
  - Review-/Draft-Pfad fuer die eigene Region, wenn `allowedActions` passen
- `publication_approved` bleibt getrennt und erzeugt keine automatische Veroeffentlichung.

## Welche Status erlauben oder blockieren

Erlaubt:

- `active`
- `trial`
- `adminFallback`

Blockiert:

- `missing_entitlement`
- `expired`
- `suspended`
- `past_due`
- `revoked`
- `wrong_region`
- `wrong_organization`
- `membership_not_verified`
- `unsupported_organization_type`
- `over_limit`

## Welche Organisationstypen werden unterstuetzt?

Generisch unterstuetzt bleiben u. a.:

- `public_administration`
- `municipality`
- `district_office`
- `city_administration`
- `county_administration`
- `ministry`
- `public_body`
- `school`
- `association`
- `ngo`
- `civic_initiative`
- `foundation`
- `media`
- `company`
- `research_institution`
- `custom`

Wichtig:

- Vereine, Verbaende oder NGOs koennen Entitlements haben.
- Sie erhalten dadurch **nicht automatisch** Behoerdenrechte.
- Behoerdennahe Aktionen bleiben an Membership, VerificationStatus und `allowedActions` gebunden.

## Welche bestehenden Bausteine wurden genutzt?

- `features/region/access.ts`
- `features/region/server/membershipRuntime.ts`
- `features/region/organizationOnboarding.ts`
- bestehende `/admin/region`-Surface
- bestehende Region-Signal-Draft-Route
- Pricing-Domain fuer Plan-Labels als Referenz, ohne Checkout-Einbau

## Welche APIs und UI sind bewusst minimal?

- `/admin/entitlements` ist nur eine kleine Admin-Surface.
- Keine neue grosse Admin-Welt.
- Keine Conversion- oder Payment-Logik.
- `/admin/region` bleibt das bestehende Cockpit und zeigt nur ehrliche Freischaltungs-Readouts.

## Welche Tests wurden ausgefuehrt?

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/region-access.contract.test.ts tests/admin-region-cockpit.route.test.ts tests/admin-region-signal-draft.route.test.ts tests/organization-claims.contract.test.ts tests/admin-organization-claims.route.test.ts tests/paid-entitlements.contract.test.ts tests/admin-entitlements.route.test.ts tests/admin-region-entitlement-ui.test.tsx`

## Was bleibt bewusst offen?

- echtes Payment/Billing
- Checkout / Stripe / Rechnung
- automatische Provisionierung aus einem Kaufabschluss
- Kontingent-Reset-/Abrechnungslogik
- vollstaendige Region-/Org-Isolation ueber weitere Admin-Routen
- Public Participation Signals (`CUT-07`)
- serverseitige Studio-Persistenz (`CUT-08`)

