# SELF-SERVICE-ORG-ONBOARDING-01

Datum: 2026-06-27
Status: erledigt

## Ziel

Ein erster kleiner, contract-first Self-Service-Slice fuer Organisationsantraege.
Der Scope ist bewusst kein produktives SaaS-Onboarding, sondern eine saubere review-first
Grundlage fuer spaetere Organisationstypen wie Kommune, Verein, Initiative,
Medien-/Partnerorganisation oder Beteiligungsbuero.

## Warum contract-first

- Der aktuelle SSOT benennt Self-Service ohne Betreiberkante weiterhin als offenen Folgepfad.
- Bestehende Produktionspfade fuer Membership, Contract, Entitlement und Dashboard bleiben
  operator-reviewt und werden durch diesen Slice nicht umgebaut.
- Ein kleiner Intake-Contract schafft belastbare Semantik fuer Antrag, Rueckfragen,
  Review-Status und Setup-Readiness, ohne schon Provisioning- oder Billing-Wahrheit
  vorzutäuschen.

## Geaenderte Dateien

- `apps/web/src/features/organization/selfServiceOrgOnboardingContract.ts`
- `apps/web/src/features/organization/selfServiceOrgOnboardingFixtures.ts`
- `apps/web/tests/self-service-org-onboarding-contract.test.ts`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`

## Statusmodell

Applicant Types:

- `municipality`
- `public_authority`
- `association`
- `citizen_initiative`
- `media_partner`
- `participation_office`
- `agency_partner`
- `educational_institution`
- `other`

Use Cases:

- `participation_space`
- `dossier_workspace`
- `voxy_cocreation`
- `live_campaign`
- `source_monitoring`
- `editorial_review`
- `partner_distribution`
- `other`

Verification:

- `not_started`
- `needs_information`
- `pending_operator_review`
- `verified`
- `rejected`

Provisioning:

- `not_requested`
- `requested`
- `approved_for_setup`
- `provisioned`
- `rejected`

Review:

- `draft`
- `submitted`
- `needs_clarification`
- `in_review`
- `approved_for_setup`
- `rejected`

Entitlement Intent:

- `public_submitter`
- `member_workspace`
- `author_plus`
- `partner_workspace`
- `operator_workspace`
- `admin_managed`

Wichtige Trennlinien:

- `approved_for_setup` ist nicht `provisioned`
- `verified` ist nicht automatisch `approved_for_setup`
- `requestedEntitlements` sind Intent, keine Runtime-Rollen
- kein Helper vergibt echte Entitlements, Operator- oder Adminrechte

## Operator-Kante

- Oeffentliche oder antragstellende Kontexte koennen Antraege vorbereiten und einreichen.
- `canOperatorApproveOrgSetup(...)` bleibt an `submitted`/`in_review`, plausible Kontaktangaben,
  Use Case, Applicant Type, Entitlement Intent und Verifikationshinweise gebunden.
- `pending_operator_review` erlaubt Operator-Pruefung, aber noch kein Provisioning.
- `canProvisionOrgWorkspace(...)` wird nur `true`, wenn `reviewStatus` und
  `provisioningStatus` beide `approved_for_setup` sind und die Verifikation `verified` ist.

## Guardrails

- keine automatische Freischaltung
- kein Payment-/Checkout-Provider
- kein produktives automatisches Provisioning
- keine Register-/Directory-API
- kein Auth-/Role-Runtime-Umbau
- kein Route-Gate- oder `routeAccess`-Umbau
- keine Admin-UI
- kein Billing
- kein Auto-Publish
- kein Auto-Dossier
- kein Auto-Anlassraum
- kein Auto-Graph

## Tests / Build

Ausgefuehrt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/self-service-org-onboarding-contract.test.ts`
- `pnpm -C apps/web run build`

## Bewusst nicht erledigt

- Payment/Checkout
- produktives Provisioning
- Register-/Directory-API
- Auth-/Role-Runtime
- Route-Gates
- Admin UI
- Billing
- automatische Freischaltung
