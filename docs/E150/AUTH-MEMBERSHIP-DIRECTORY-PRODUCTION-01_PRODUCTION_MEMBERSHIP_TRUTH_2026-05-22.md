# AUTH-MEMBERSHIP-DIRECTORY-PRODUCTION-01

Stand: 2026-05-22
Typ: Runtime + Docs Hardening
Status: umgesetzt, aber bewusst **kein** pauschaler `production_ready`-Claim fuer die Kategorie

## Ziel

Auth / Membership / Directory auf dem generischen Organisations-/Regionen-Pfad so haerten,
dass Membership-Wahrheit, Org-Rollen, Regionscope und org-scoped Schreibrechte nicht mehr
implizit, fixture-nah oder sprachlich uneindeutig aufgeloest werden.

## Ergebnis

Umgesetzt ist jetzt eine produktionsnaehere Membership-Wahrheit fuer den bestehenden Pfad:

- stabiler `MembershipDirectoryRepository`-/Adapter-Vertrag in `apps/web/src/lib/server/auth/membershipDirectoryRepository.ts`
- sichtbare Source-of-truth-Unterscheidung in `RequestScopeContext`:
  - `session`
  - `persistent_membership_store`
  - `external_directory_pending`
  - `fixture_demo`
- normalisierte Membership-Status fuer org-scoped Entscheidungen:
  - `none`
  - `pending`
  - `verified`
  - `suspended`
  - `revoked`
- normalisierte Organisationsrollen:
  - `owner`
  - `admin`
  - `editor`
  - `reviewer`
  - `viewer`
  - `publication_approved`
  - `operator`
- org-scoped Schreibrechte sind jetzt explizit an verifizierte, schreibberechtigte Memberships gebunden
- `publication_approved` darf eigene Sichtbarkeit steuern, `public_official` bleibt getrennt
- `fixture_demo` wird sichtbar als nicht produktive Wahrheit markiert
- `external_directory_pending` bleibt explizit blockerhaft sichtbar
- Organisationsdashboard zeigt ehrliche Membership-/Directory-States und Empty States fuer:
  - Organisation noch nicht verifiziert
  - Rolle reicht nicht aus
  - Regionzugriff fehlt
  - Directory-Anbindung fehlt

## Was sich fachlich geaendert hat

### 1. Scope- und Membership-Entscheidungen

- `requestScope.ts` leitet Membership-Status und Org-Rollen nicht mehr aus den alten
  Verifikationsbegriffen direkt in die Routenlogik durch.
- Verified, pending, suspended und revoked werden fuer Schreibrouten explizit unterschieden.
- Regionzugriff wird nur noch aus verifizierten Organisationszuordnungen weitergereicht.
- Betreiberkontext bleibt explizit und sichtbar statt stiller Fallback.

### 2. Org-scoped Schreibrouten

- `/api/account/organization/review/items/[itemId]` blockiert jetzt frueh, wenn kein
  verifizierter schreibberechtigter Membership-Kontext vorliegt.
- `/api/account/organization/review/content-release` trennt zwischen:
  - allgemeinem org-scoped Schreibzugriff
  - Sichtbarkeitssteuerung nur mit `publication_approved` oder Betreiberkontext

### 3. Organisationsdashboard

- Dashboard zeigt die Membership-Wahrheit jetzt ehrlich statt nur implizit ueber Freischaltung
  und Readmodel-Ableitungen.
- Demo-/Fixture-Wahrheit wird nicht mehr als produktive Membership-Wahrheit lesbar.
- External-Directory-pending bleibt sichtbar statt unter `session` zu verschwinden.

## Readiness-Einordnung

### Ehrliche Einstufung nach diesem Slice

Auth / Membership / Directory ist nach diesem Slice **produktionsnaher** und aus SSOT-Sicht
kein reiner `pilot_ready`-Rest mehr.

Die Kategorie ist damit sinnvoll als `production_candidate` lesbar, **nicht** als
`production_ready`.

### Warum noch nicht `production_ready`

Die folgenden Restluecken bleiben hart:

- `persistent_membership_store` ist weiterhin lokale/persistente Produktwahrheit, aber noch
  keine autoritative externe Directory-/Register-Wahrheit
- `external_directory_pending` ist weiterhin ein realer expliziter Uebergangszustand
- es gibt noch keinen festgelegten externen Provider-/Register-Sync inkl. Konfliktmodell,
  Replay-Regeln und Betriebsverantwortung
- Self-Provisioning und breitere Directory-/Membership-Aufloesung fehlen weiterhin

Solange diese Punkte offen sind, darf Auth / Membership / Directory nicht pauschal als
`production_ready` vermarktet oder dokumentiert werden.

## Nicht-Ziele eingehalten

- kein neues Login-Produkt
- kein Payment
- kein Auto-Publish
- kein automatisches `public_official`
- kein Social Publishing
- keine neue AI-Logik
- keine Produktparallelwelt

## Validation

Ausgefuehrt:

```bash
pnpm -C apps/web exec vitest run tests/request-scope-context.test.ts tests/org-review-item-ops.route.test.ts tests/org-content-release.route.test.ts tests/account-organization-dashboard.page.test.tsx tests/organization-dashboard.readmodel.test.ts
pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
pnpm --filter @vog/web build
```

Ergebnis:

- alle angeforderten Vitest-Suites gruen
- `typecheck` gruen
- `lint` gruen
- `build` gruen

## Offene Folgearbeit

- externer Directory-/Register-Provider fuer echte produktive Membership-Wahrheit festlegen
- Konflikt-/Sync-/Replay-Modell dokumentieren und umsetzen
- Suspend-/Revoke-Herkunft aus externer Wahrheit statt nur lokaler Runtime ableiten
- Self-Provisioning- und Onboarding-Pfad an dieselbe Wahrheit anbinden

## Geaenderte Hauptdateien

- `apps/web/src/lib/server/auth/membershipDirectoryRepository.ts`
- `apps/web/src/lib/server/auth/runtimeAdapters.ts`
- `apps/web/src/lib/server/auth/requestScope.ts`
- `apps/web/src/app/api/account/organization/review/items/[itemId]/route.ts`
- `apps/web/src/app/api/account/organization/review/content-release/route.ts`
- `apps/web/src/app/account/organization/dashboard/page.tsx`
- `apps/web/tests/request-scope-context.test.ts`
- `apps/web/tests/org-review-item-ops.route.test.ts`
- `apps/web/tests/org-content-release.route.test.ts`
- `apps/web/tests/account-organization-dashboard.page.test.tsx`
- `apps/web/tests/organization-dashboard.readmodel.test.ts`
