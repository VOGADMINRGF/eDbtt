# AUTH-MEMBERSHIP-DIRECTORY-MANUAL-VERIFICATION-PRODUCTION-01

Stand: 2026-05-23
Issue: #212
Status: umgesetzt

## Entscheidung

Fuer v1 gilt persistente, auditierbare Betreiber-Verifikation als autoritative Produktionswahrheit fuer Auth / Membership / Directory.

Das wird als `operator_verified_directory` modelliert.
Es ist bewusst keine behauptete externe Register- oder API-Integration.

## Umgesetzt

- `MembershipDirectoryRepository`, `RequestScopeContext` und `runtimeAdapters` unterscheiden jetzt sichtbar:
  - `session`
  - `persistent_membership_store`
  - `operator_verified_directory`
  - `external_directory_integrated`
  - `external_directory_pending`
  - `fixture_demo`
- Produktionswahrheit fuer v1 ist `operator_verified_directory`.
- `persistent_membership_store` zaehlt nur dann als Produktionswahrheit, wenn der Eintrag audit-backed operator-verifiziert ist.
- `external_directory_pending` bleibt explizit nicht produktionsfaehig.
- `fixture_demo` ist nie Produktionswahrheit.

## Verifikations- und Rechtekanon

- Normalisierte Verifikationsstatus:
  - `none`
  - `pending`
  - `evidence_required`
  - `operator_review_required`
  - `verified`
  - `limited`
  - `suspended`
  - `revoked`
- Rollen und Region-/Wirkraumzugriff entstehen nur aus verifizierter, auditierbarer Wahrheit.
- `publication_approved` entsteht nie automatisch aus `verified`.
- `public_official` bleibt ein separater Official-Release-Pfad.
- `pending`, `evidence_required` und `operator_review_required` erhalten keine Moderations- oder Publish-Rechte.
- `suspended` und `revoked` blockieren alle Schreibrechte.
- Organisation A sieht nicht Organisation B.

## Audit und UI

- Betreiberentscheidungen werden persistent und auditierbar geschrieben.
- Audit-Events decken `verify`, `limit`, `suspend`, `revoke`, `role_grant` und `region_grant` ab.
- Region-/Wirkraum-Freigaben tragen auditierbare Herkunft (`grantedBy`, `grantedAt`, `source`, optional `reason`/`evidenceReference`).
- Das Organisationsdashboard zeigt eine ehrliche Verifikationskarte mit `sourceOfTruth`, `confidence`, Status und naechstem Schritt.
- Betreiber-/Admin-Flaechen zeigen Review-Bedarf und Audit-Hinweis sichtbar auf bestehenden Claim-/Review-Pfaden.

## Produktionslesart

Auth / Membership / Directory ist damit fuer v1 `production_ready`, sofern die Wahrheit aus `operator_verified_directory` kommt.

Nicht enthalten in diesem Claim:

- keine externe Registerintegration
- kein Auto-Publish
- kein automatisches `public_official`
- keine automatische `publication_approved`-Rolle
- kein Checkout oder Payment
- kein breiter Self-Service ohne Betreiberkante

## Validierung

Ausgefuehrt:

```bash
pnpm -C apps/web exec vitest run tests/request-scope-context.test.ts tests/org-review-item-ops.route.test.ts tests/org-content-release.route.test.ts tests/account-organization-dashboard.page.test.tsx tests/organization-dashboard.readmodel.test.ts tests/account-organization-claims.route.test.ts tests/admin-organization-claims.route.test.ts
pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
rm -rf apps/web/.next
pnpm --filter @vog/web build
```

Alle genannten Validierungsschritte sind gruen durchgelaufen.

## Optional spaeter

Optional spaetere Folgearbeit bleibt:

- echte externe Directory-/Register-Anbindung
- Konflikt-/Sync-Regeln zwischen Betreiber-Verifikation und externer Quelle
- Ausfall- und Replay-Regeln fuer `external_directory_integrated`
- breiterer Self-Service ohne Betreiberkante
