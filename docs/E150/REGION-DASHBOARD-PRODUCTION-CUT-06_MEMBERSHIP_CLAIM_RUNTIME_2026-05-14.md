# REGION-DASHBOARD-PRODUCTION-CUT-06

Stand: 2026-05-14  
Branch: `pr/region-dashboard-cut-06-membership-runtime`

## Was wurde gebaut?

- Persistente Runtime fuer `OrganizationClaim`, `OrganizationMembership`, `Organization`, `OrganizationUnit`, `VerificationReview` und `MembershipAuditEvent`.
- Mongo-/In-Memory-Repo in `features/region/server/membershipRuntime.ts` mit Collections:
  - `organization_claims`
  - `organization_memberships`
  - `edebatte_region_organizations`
  - `edebatte_region_organization_units`
  - `edebatte_region_verification_reviews`
  - `edebatte_region_membership_audit_events`
- Neue API-Routen:
  - `POST/GET /api/account/organization-claims`
  - `GET /api/admin/organization-claims`
  - `POST /api/admin/organization-claims/[id]/review`
- Minimal nutzbare Oberflaechen:
  - `/account/organization`
  - `/admin/organization-claims`
- `buildPersistedRegionAccessContext` bindet Region-Cockpit und Region-Signal-Draft-Route an gespeicherte Memberships statt an Test-Header oder rohe Rollenstrings.

## Welche Runtime-Persistenz existiert?

- Claims werden als `pending_review` gespeichert und erzeugen keine Rechte.
- Reviews erzeugen `VerificationReview`-Eintraege und Audit-Events.
- Verifizierungsentscheidungen koennen Memberships anlegen, aktualisieren oder widerrufen.
- `organization_verified`, `unit_verified` und `publication_approved` werden als persistierte Membership-Status gespeichert.
- `optionalLocation` bleibt als Standortkontext gespeichert, aber wird nicht automatisch als Pflicht-Organisationsebene behandelt.

## Wie sind OrganizationClaim und Membership getrennt?

- `OrganizationClaim` ist die Selbstauskunft bzw. der Antrag.
- `OrganizationMembership` ist die serverseitig relevante Rechtebasis.
- `noAutoAuthority: true` bleibt auf Claim und Membership hart gesetzt.
- Ein `POST /api/account/organization-claims` erzeugt nur `pending_review`.
- Erst ein Admin-Review schreibt `organization_verified`, `unit_verified` oder `publication_approved` in eine Membership.

## Wie ist `Self-declared != verified` technisch abgesichert?

- `allowedActionsForVerificationStatus("email_verified")` gibt keine Regionrechte mehr.
- `buildPersistedRegionAccessContext` laedt fuer non-admin Memberships aus der Runtime und nicht aus Role-Strings.
- `/api/admin/region/cockpit/[regionId]` und `/api/admin/region/signals/[id]/draft` verwenden diese persistierte Membership-Basis.
- Rohe `region_staff:*`-Rollen bleiben nur Region-Hints, keine Autoritaet.
- Freitextfelder wie `organizationName`, `unitName`, `roleLabel` oder `optionalLocation` erzeugen keine Rechte.

## Wie wird `optionalLocation` behandelt?

- `optionalLocation` ist ein eigener optionaler Kontext (`Rathaus Reinickendorf`, `Town Hall`, `City Office` usw.).
- Fehlende `optionalLocation` fuehrt nicht zu Validierungs- oder Review-Blockern.
- Standort wird gespeichert, aber nicht als Pflicht-Organisationsebene normalisiert.

## Wie werden Vereine, Verbaende, NGOs und internationale Organisationen unterstuetzt?

- `OrganizationType` wurde verbreitert, u. a. fuer:
  - `association`
  - `ngo`
  - `civic_initiative`
  - `foundation`
  - `research_institution`
  - `city_administration`
  - `county_administration`
- Internationale Strukturfelder bleiben ueber `countryCode`, `regionId`, `organizationName`, `unitName` und `optionalLocation` generisch.
- Organisationstyp beeinflusst Default-Hinweise, aber keine automatischen Behoerdenrechte.

## Wie nutzen RegionDashboard und Draft-Routen die Membership-Runtime?

- `GET /api/admin/region/cockpit/[regionId]`:
  - Admin bleibt `admin_fallback`
  - non-admin bekommt Zugriff nur ueber persistierte Membership
- `POST /api/admin/region/signals/[id]/draft`:
  - non-admin Draft-Rechte kommen nur aus persistierten Memberships
  - `organization_verified` bleibt read-only
  - `unit_verified` kann review-/draft-nahe Aktionen im eigenen Regionscope ausfuehren
  - `publication_approved` bleibt fuer spaetere Freigaben reserviert

## Welche Tests wurden ausgefuehrt?

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/region-access.contract.test.ts tests/regional-dashboard-readmodel.test.ts tests/admin-region-cockpit.route.test.ts tests/admin-region-signal-draft.route.test.ts tests/organization-claims.contract.test.ts tests/account-organization-claims.route.test.ts tests/admin-organization-claims.route.test.ts`

## Was bleibt bewusst offen?

- `REGION-DASHBOARD-PRODUCTION-CUT-04`: Paid Entitlement / Behoerdenfreischaltung
- vollstaendige Region-/Org-Isolation ueber weitere Admin-Routen
- UI-nahe Aktivierung der Draft-Aktionen direkt im Cockpit
- weitergehende Membership-/Review-UX wie Einladungen, Re-Review, Mehrpersonenfreigaben
- keine Veroeffentlichung, keine Social-Publishing-Logik, keine Vergabe-/Ausschreibungslogik
