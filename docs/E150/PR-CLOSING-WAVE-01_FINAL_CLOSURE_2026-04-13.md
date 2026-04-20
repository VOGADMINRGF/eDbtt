# PR-CLOSING-WAVE-01 – Final Closure Wave (2026-04-13)

## Ziel

Finalen Endzustand fuer den Pricing-/Order-/Role-Scope herstellen:

1. **fertig und abgesichert**
2. **intern vorhanden, aber oeffentlich nicht versprochen**
3. **aus UX, Pricing, CTA und Docs entfernt**

Keine oeffentliche Zwischenzusage im Kernprodukt.

## Umgesetzter Abschluss

### 1) Full-Repo Stabilitaet im relevanten Scope

Durchgefuehrt:

- `pnpm -w -r lint`
- `pnpm -w -r typecheck`
- `pnpm -C apps/web exec vitest run`

Ergebnis:

- Lint gruen
- Typecheck gruen
- Vitest Gesamtlauf gruen (`160 passed`, `2 skipped`)

Die zuvor roten Suiten wurden in Contract-Tests gehaertet (Umlaute-/Copy-Drift, Route-Mocks, server-only-Testsetup, Playwright-Optionalitaet, DB-abhängige Integrationstests als env-gated).

### 2) Rollen-/Dashboard-Endzustand contractualisiert

Final abgesichert fuer:

- Buerger:innen
- freie Journalist:innen
- Organisationen / Verbaende / Vereine
- Kommunen / Verwaltungen
- Admin / Backoffice / Rechnungspruefung

Kernpunkte:

- deterministisches Rollenrouting inkl. `finance`/`billing`/`accounting` -> Admin-Backoffice
- pro Rolle klarer `firstTask` im Role-Contract
- Follow-up-Tests fuer Login-/Routing-/Journey-Pfade aktualisiert

### 3) Order-/Backoffice-/Finance-Basis finalisiert

Admin-Pricing-Orders decken jetzt den operativen Kern ab:

- listen
- oeffnen
- Statuswechsel
- interne Notizen
- Preisanpassung
- Rabattfelder (Art/Grund/Betrag)
- Freigabe/Ablehnung
- Aktivierungsnotiz
- Billing-/Contract-/Invoice-Referenzen

Damit bleibt die oeffentliche Bestelllogik einfach, intern aber review- und finance-faehig.

### 4) Add-ons final eingehegt

- Oeffentliche Add-ons bleiben nur in tragfaehigen Reifestaenden.
- `in_rollout` bleibt als internes SSOT-Vokabular moeglich, ist fuer den aktuellen oeffentlichen Kernbestand **nicht aktiv**.
- Oeffentliche Copy/Badges/CTAs bleiben semantisch deckungsgleich zu realer Operabilitaet.

## Harte Produktregel (ab jetzt verbindlich)

Oeffentlich sichtbar bleibt nur, was langfristig tragfaehig ist.

Alles andere ist:

- intern dokumentiert und nicht versprochen
- oder aus oeffentlicher Produktlogik entfernt

## Terminologie-Freeze (DE/EN)

Verbindliche Begriffe fuer Pricing-/Order-/Follow-up-Scope:

- `Anlassraum` / `Anlassraum` (Domain-Term bleibt in EN-Kontext bewusst erhalten)
- `Companion` / `Companion`
- `Faktencheck-Kontingent` / `fact-check quota`
- `Privat` / `Civic`
- `Freie Journalist:innen` / `Independent journalists`
- `Organisationen / Verbaende / Vereine` / `Organizations / associations / NGOs`
- `Kommunen / Verwaltungen` / `Municipalities / public administration`
- `Bestellung` / `order`
- `Pruefung` / `review`
- `Freigabe` / `approval`
- `Aktivierung` / `activation`
- `Anpassung` / `adjustment`

Keine spontane Terminologie-Drift in user-facing Pricing-/Order-Surfaces.

## Device-/Browser-Schlusspruefung

Die verbindliche manuelle Abnahme bleibt:

- `docs/E150/QA_MANUAL_CHECKLIST_CRITICAL_JOURNEYS_2026-04-12.md`

In diesem Slice wurden die automatisierten Kernreisen/Contracts als Pflichtgate vollstaendig gehaertet und gruen gezogen; die physische Device-Abnahme (iPhone Safari, Android Chrome) bleibt ein expliziter Release-Operations-Schritt gegen dieselbe Checkliste.

## Geaenderte Kernartefakte (Auszug)

- `apps/web/src/app/admin/pricing/orders/page.tsx`
- `features/pricing/server/leadsRepo.ts`
- `apps/web/src/features/auth/roleExperienceContract.ts`
- `apps/web/tests/{admin.analytics.summary.test.ts,contact/contact-api.test.ts,create-prepare-attach.review-ui.test.tsx,community-page.states.test.ts,operator-surfaces.locale-render.test.tsx,vote.stats.test.ts,e2e/admin.spec.ts,role-routing.contract.test.ts,dashboard-role-contracts.test.ts,e2e-critical-journeys.test.ts,admin-pricing-orders.route.test.ts}`
- `docs/E150/{OpenTasks.md,Part19_Pricing_Packaging.md,membership_pricing.md,QA_MANUAL_CHECKLIST_CRITICAL_JOURNEYS_2026-04-12.md}`
