# V3 Membership Entitlement Package Activation Hardening 2026-07-13

## Scope

- `V3-MEMBERSHIP-ENTITLEMENT-PACKAGE-ACTIVATION-HARDENING-01`
- Cluster: Membership / Package / Entitlement / Activation Truth

## Umsetzung

- Eine gemeinsame sichtbare Aktivierungswahrheit wurde unter `features/pricing/domain/membershipActivationTruth.ts` eingeführt und in `features/pricing/index.ts` exportiert.
- Die neue Quelle trennt bewusst:
  - Initiativen-Mitgliedschaft
  - eDebatte-Paketstart
  - Vertrags-/Billing-Wahrheit
  - Entitlement-/Freischaltungswahrheit
  - manuelle Admin-Support-Aktionen
- `/account/payment`, `/account/organization/dashboard`, `/admin/pricing/orders`, `/admin/entitlements`, `/admin/memberships`, `/dashboard/admin/memberships`, `/dashboard/memberships` und die zentrale Account-Mitgliedschafts-/Paketdarstellung nutzen jetzt dieselbe Aktivierungssemantik statt lokaler Einzeltexte.
- Die aktiven Membership-Support-Surfaces sprechen jetzt explizit darüber, dass `mark-paid` und `cancel` manuelle Support-Schritte für Initiativen-Beiträge bleiben und weder eDebatte-Pakete noch Entitlements automatisch aktivieren.

## Geprüfte aktive Surfaces

- `/order`
  Bleibt der kanonische direkte Paket-/Startpfad; bestehende Pricing-/Order-Contracts bleiben grün und weiterhin frei von versteckter Aktivierungs- oder Zahlungssprache.
- `/pricing` und `/pricing/institutionen`
  Behalten die bestehende Trennung zwischen Mitgliedschaft, Paketkauf und Freischaltung bei; die neue Aktivierungsquelle widerspricht diesen Public-Surfaces nicht.
- `/account`
  Das Paket-Banner und die Mitgliedschaftskarte rahmen Paketstart, Mitgliedschaft und Freischaltung jetzt klarer als getrennte Schritte.
- `/account/payment`
  Das Zahlungsprofil ist sichtbar als Beitrags-, Verifikations- und Supportpfad, nicht als automatische Paket- oder Freischaltungsruntime.
- `/account/organization/dashboard`
  Vertrag/Billing und Freischaltung zeigen jetzt dieselbe Guardrail-Wahrheit: sichtbar ist nicht automatisch aktiv, bezahlt oder öffentlich freigegeben.
- `/admin/pricing/orders`
  Bestellungen und Freigaben bleiben manuelle Review-/Vertrags-/Billing-Entscheidungen; `approved` ist nicht `active`, `active` ist nicht `public_official`.
- `/admin/entitlements`
  Entitlements bleiben bewusste Scope-Grants ohne Checkout-, Abbuchungs- oder Auto-Publish-Semantik.
- `/admin/memberships`
  Die Route bleibt als interne Support-Übersicht erreichbar und verkauft Mitgliedschaften nicht mehr als deaktiviertes Nichts oder als Paketpfad.
- `/dashboard/admin/memberships` und `/dashboard/memberships`
  Beide bestehenden Membership-Support-Pfade bleiben intern erreichbar, werden aber explizit als manuelle Support-/Bestandsflächen markiert statt als Paket- oder Entitlement-Wahrheit.

## Doppelstrukturen reduziert

- Aktivierungs- und Membership-Guardrails lagen bisher verteilt in:
  - Pricing-/Trust-Copy
  - Account-Paket- und Mitgliedschaftsbausteinen
  - Contract-/Billing-/Freischaltungstexten im Org-Dashboard
  - separaten Membership-Support-Surfaces
- Diese Oberflächen ziehen ihre zentrale Trennlogik jetzt aus `membershipActivationTruth.ts`, statt vier leicht abweichende Wahrheiten zu pflegen.

## Produktwahrheit

- `/order` bleibt kanonischer direkter Paket-/Startpfad.
- `/vormerken` bleibt Legacy-/Fallback-/Info-Pfad.
- Mitgliedschaft ist nicht automatisch bezahlter Zugang.
- Paketstart oder Paketwahl sind nicht automatisch aktive Nutzung.
- Billing-Copy ist keine Zahlungsausführung.
- Sichtbare Entitlements sind nicht automatisch gewährt oder aktiv.
- `mark-paid` und `cancel` bleiben manuelle Support-Aktionen.
- `approved` ist nicht `active`.
- `active` ist nicht `public_official`.
- Es gibt weiterhin keine neue Zahlung, keine automatische Billing-Aktivierung, keine automatische Paketfreischaltung und keine neue Rechtewelt.

## Legacy- und Fallback-Pfade

- `/dashboard/admin/memberships` und `/dashboard/memberships` bleiben als interne Support-/Bestandswege bestehen.
- `/admin/memberships` wurde als manuelle Support-Übersicht harmonisiert, ohne Routen zu entfernen oder Redirects einzuführen.
- Öffentliche Membership-/Pricing-Pfade wie `/vormerken` und `/mitglied-werden` wurden in diesem Slice nicht neu bewertet, sondern an die bestehende Produktwahrheit angebunden.

## Validierung

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/membership-activation-support-surfaces.contract.test.tsx tests/account-payment.page.contract.test.tsx tests/account-organization-dashboard.page.test.tsx`
  Ergebnis: `3` Testdateien grün, `13/13` Tests grün.
- `pnpm -C apps/web exec vitest run tests/pricing-page.contract.test.ts tests/vormerken-page.contract.test.tsx tests/order-entry.contract.test.ts tests/order-entry-trust-copy.contract.test.tsx tests/pricing-conversion-harm.contract.test.tsx tests/account-organization-page.contract.test.tsx tests/account-organization-dashboard.page.test.tsx tests/admin-pricing-orders.route.test.ts tests/admin-region-entitlement-ui.test.tsx tests/admin-entitlements.route.test.ts tests/membership-activation-support-surfaces.contract.test.tsx tests/account-payment.page.contract.test.tsx`
  Ergebnis: `12` Testdateien grün, `47/47` Tests grün.
- `pnpm -C apps/web exec vitest run tests/pricing-membership-block-clarity.contract.test.ts tests/vormerken-membership-application-visibility.contract.test.tsx tests/payment-checkout-session.contract.test.ts tests/payment-entitlement-after-checkout.contract.test.ts`
  Ergebnis: `4` Testdateien grün, `5/5` Tests grün.
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec tsc --noEmit -p tsconfig.json --pretty false`
- `pnpm -C apps/web run build`

## Offene Punkte

- `V3-LANGUAGE-BRIDGE-MULTILINGUAL-SURFACE-HARDENING-01` bleibt der nächste unabhängige Cluster nach Merge, weil er auf derselben Produktionsqueue basiert, aber fachlich nicht mehr auf Membership-/Entitlement-Oberflächen weiterarbeitet.
- Die vorhandenen Membership-Admin-Routen bleiben bewusst intern und manuell. Wenn sie später durch einen einzigen kanonischen Supportpfad ersetzt werden sollen, braucht das eine eigene Route-/Legacy-Entscheidung mit belastbarer SSOT- und Testbasis.
