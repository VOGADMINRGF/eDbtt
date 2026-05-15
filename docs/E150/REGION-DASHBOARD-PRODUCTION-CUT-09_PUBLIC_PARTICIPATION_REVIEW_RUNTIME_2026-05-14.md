# REGION-DASHBOARD-PRODUCTION-CUT-09

## Ziel

Public Participation Signals nicht nur als Dashboard-Readout, sondern als persistente, serverseitig prüfbare Review-Laufzeit führen.

Der Slice erweitert den bestehenden RegionDashboard-Pfad um:

- persistierte Public-Participation-Records
- Review-Entscheidungen mit Audit
- bestätigte Regionzuordnung vor Acceptance
- datensparsame Dashboard-Serialisierung
- sicheren Handoff in den bestehenden Signal-to-Draft-Pfad

## Was wurde gebaut?

- Neue Runtime in `features/region/server/participationSignalReviewRuntime.ts`
- Persistente Record-, Review- und Audit-Typen:
  - `RegionParticipationSignalRecord`
  - `RegionParticipationSignalReview`
  - `RegionParticipationSignalAuditEvent`
  - `RegionParticipationSignalReviewResult`
- Review-Status:
  - `draft`
  - `needs_review`
  - `needs_region_review`
  - `accepted`
  - `rejected`
  - `archived`
  - `revoked`
- Review-Entscheidungen:
  - `accept`
  - `reject`
  - `archive`
  - `request_region_review`
  - `confirm_region`
  - `revoke`
  - `restore_to_review`
- Neue Admin-Routen:
  - `GET /api/admin/region/participation-signals`
  - `POST /api/admin/region/participation-signals/[id]/review`

## Wie Public Participation Signal Records persistiert werden

Die Runtime nutzt eigene serverseitige Collections für:

- `edebatte_region_participation_signals`
- `edebatte_region_participation_signal_reviews`
- `edebatte_region_participation_signal_audit_events`

Die Runtime synchronisiert die bestehenden Public-Participation-Signale zunächst in persistierte Records und führt danach alle Review-Entscheidungen gegen diese Records aus.

Wichtige Felder pro Record:

- `regionId`
- `proposedRegionId`
- `needsRegionReview`
- `sourceClass = participation`
- `sourceType`
- `aggregationMode`
- `privacyMode`
- `reviewStatus`
- `confidence`
- `provenance`
- Guardrails:
  - `noAutoPublish`
  - `noAutoCreateDossier`
  - `noAutoCreateAnlassraum`
  - `noPersonalProfiling`
  - `noPoliticalScoring`
  - `noRepresentativeClaim`
  - `noTenderMonitoring`
  - `noProcurementMonitoring`

## Wie Review-Entscheidungen funktionieren

- `accept` ist nur erlaubt, wenn:
  - eine bestätigte `regionId` vorliegt
  - `needsRegionReview = false`
  - bei `privacyMode = review_restricted` eine public-safe Titel-/Summary-Fassung vorliegt
- `confirm_region` setzt eine bestätigte `regionId` und nimmt den Fall aus `needsRegionReview`
- `reject`, `archive`, `revoke` und `restore_to_review` werden als eigener Review- und Audit-Schritt protokolliert
- `rejected`, `archived` und `revoked` erscheinen nicht mehr als aktive Themenlage im RegionDashboard

## Wie Regionbestätigung funktioniert

Unsichere Regionzuordnung bleibt konservativ:

- keine automatische Zuschreibung an Reinickendorf oder andere Regionen
- `needsRegionReview = true`
- optional `proposedRegionId` und `matchedRegionIds` für den Review-Kontext

Erst `confirm_region` macht den Fall regionalseitig belastbar.

## Privacy, Anonymisierung und Datensparsamkeit

Hart abgesichert:

- keine `userId` im RegionDashboardReadModel
- keine E-Mail-Adressen
- keine Personenlisten zu Swipes/Reaktionen
- keine person-level Claim-/Contribution-Autor:innen im Dashboard
- keine politischen Profile
- keine Repräsentativitätsbehauptung

`serializeParticipationSignalForDashboard(...)` reduziert `review_restricted`-Signale zusätzlich auf public-safe Titel-/Summary-Fassungen oder generische Platzhalter.

Swipes bleiben:

- anonymisiert
- aggregiert
- nicht repräsentativ
- nicht amtlich

## Wie accepted Public Signals in den Draft-Pfad dürfen

Der bestehende Signal-to-Draft-Pfad aus CUT-03/CUT-07 nutzt jetzt die persistierte Review-Runtime.

Ein Public Signal darf nur dann gedraftet werden, wenn:

- der Record existiert
- `reviewStatus = accepted`
- `regionId` bestätigt ist
- `needsRegionReview = false`
- `privacyMode` keine unsicheren Personendaten in den Draft trägt
- Membership und Entitlement den Draft erlauben

Neue Block-Reasons im Draft-Pfad:

- `public_signal_not_found`
- `public_signal_not_accepted`
- `public_signal_region_unconfirmed`
- `public_signal_privacy_restricted`

## Wie Membership und Entitlement weiter respektiert werden

CUT-09 öffnet keine Sonderrechte:

- Admin bleibt `adminFallback`
- Non-admin braucht weiter persistierte Membership
- Review für Public Signals nutzt dieselben serverseitigen Access-/Entitlement-Gates wie das bestehende Region-Cockpit
- Draft-Handoff bleibt an Membership + Entitlement gebunden

## Wiederverwendete Bausteine

- `features/region/regionParticipationSignals.ts`
- `features/region/store.ts`
- `features/region/regionSignalDrafts.ts`
- `features/region/access.ts`
- `features/region/server/membershipRuntime.ts`
- `features/region/server/paidEntitlements.ts`
- bestehende `/admin/region`-Surface
- bestehender Cockpit-Readmodel-Pfad
- bestehender Signal-to-Draft-Pfad

## Tests

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/region-participation-signals.contract.test.ts tests/admin-region-participation-signals.test.tsx tests/regional-dashboard-readmodel.test.ts tests/admin-region-cockpit.route.test.ts tests/region-signal-drafts.contract.test.ts tests/admin-region-signal-draft.route.test.ts tests/participation-signal-review-runtime.test.ts tests/admin-participation-signal-review.route.test.ts`

## Bewusst offen

- eigene größere Moderationsoberfläche jenseits des Cockpit-Readouts
- vollständige Region-/Org-Isolation über weitere Admin-Routen
- GeoReferenceLayer
- OSM/PostGIS
- Payment/Billing/Checkout
- Veröffentlichung
- Social Publishing
- personenbezogene Participation-Ansichten

Folgepunkte bleiben:

- `REGION-DASHBOARD-PRODUCTION-CUT-08` serverseitige Studio-Persistenz
- breitere Region-/Org-Isolation über weitere Admin-Pfade
