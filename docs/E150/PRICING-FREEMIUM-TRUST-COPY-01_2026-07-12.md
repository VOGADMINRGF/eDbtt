# PRICING-FREEMIUM-TRUST-COPY-01

Datum: 2026-07-12

## Ergebnis

Die verbleibende Cross-Surface-Harmonisierung fuer Freemium-, Membership- und Freischaltungs-Copy ist fuer die produktiven Pricing-/Order-/Organisationspfade abgeschlossen.

## Geaenderte Nutzerpfade

- `/pricing/institutionen`
- `/vormerken` beziehungsweise `/order`
- `/account/organization`
- `/pricing`-Paketkarten und Segment-CTAs als Zuleitung zum kanonischen Paketpfad

## Umgesetzter Contract

- Lesen, Swipes und Grundbeteiligung bleiben als freier Basiskern explizit sichtbar.
- Paket-, Membership- und Organisationsfreischaltungen werden als bewusste, review-first Folgepfade beschrieben.
- Self-Service-Checkout wird weiterhin nur als bewusst aktivierter Sonderfall beschrieben.
- Keine versteckten AI-Kosten: zusaetzliche Recherche-, Review- oder Aktivierungspfade werden nur bewusst aktiviert.
- Keine internen Statuskeys oder falschen Auto-Publish-/Auto-Checkout-Claims wurden neu eingefuehrt.

## Review-Klaerungen

### `/vormerken`

- `/vormerken` bleibt als oeffentlich erreichbarer Bestands-/Fallback-Pfad bestehen.
- Der kanonische direkte Paketpfad ist `/order`.
- Primäre Paket-CTAs von `/pricing` zeigen jetzt auf `/order`, nicht mehr auf `/vormerken`.
- Auf `/vormerken` wurde bewusst kein Redirect und keine neue Produktlogik eingebaut; die Surface markiert sich stattdessen als Legacy-/Fallback-Einstieg und verweist sichtbar auf `/order`.

### Zentrale Copy-Quelle

- Die gemeinsame Pricing-/Order-/Membership-/Legacy-Wahrheit liegt jetzt in `features/pricing/domain/content.de.ts`.
- Neu genutzt werden dort:
  - `PRICING_PATH_CONTRACT`
  - `PRICING_ENTRY_TRUST_COPY`
- `/pricing/institutionen`, `/order`/`/vormerken` und `/account/organization` lesen die harmonisierten Trust-/Membership-/Legacy-Saetze aus dieser Quelle, statt dieselben Aussagen separat weiterzuschreiben.

### Harmonisierung der widerspruechlichen Membership-Contracts

- Die zuvor auseinanderlaufenden Erwartungen lagen in:
  - `apps/web/tests/member-checkbox-flow.contract.test.tsx`
  - `apps/web/tests/pricing-conversion-harm.contract.test.tsx`
- Kanonisch ist jetzt fuer den privaten Paketpfad:
  - `Mitgliedschaft und Paketfreischaltung werden getrennt geführt.`
  - `Für Mitglieder gilt beim Paket „Interessiert“ der kostenfreie Einstieg. Der Mitgliedschaftsantrag verändert den Paketpreis nicht.`
- Das wurde nicht nur in Tests, sondern in der echten Oberflaeche von `/order` und `/vormerken` vereinheitlicht.
- Beide Tests lesen nun dieselbe Produktwahrheit aus der zentralen Pricing-Quelle.

## Test- und Validierungsstand

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/pricing-page.contract.test.ts tests/pricing-order-shared-entry.contract.test.tsx tests/pricing-i18n.contract.test.ts tests/pricing-handoff-click.contract.test.ts tests/pricing-trust-loop.contract.test.ts tests/pricing-institutional-trust-copy.contract.test.ts tests/order-entry-trust-copy.contract.test.tsx tests/account-organization-page.contract.test.tsx tests/vormerken-page.contract.test.tsx tests/pricing-conversion-harm.contract.test.tsx tests/member-checkbox-flow.contract.test.tsx tests/pricing-no-hidden-ai-costs.contract.test.ts tests/pricing-institutionen-i18n.contract.test.ts tests/institutional-pricing-link.contract.test.tsx`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web run typecheck`

Alle genannten Pruefungen waren in diesem Slice gruen.
