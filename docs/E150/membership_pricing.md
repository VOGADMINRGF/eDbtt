# eDebatte & eDebatte - zentrale Pricing-Struktur

Die Preis- und Paketlogik ist bewusst in zwei Ebenen getrennt:

- Mitgliedschaft (Bewegung / eDebatte): `apps/web/src/config/pricing.ts`
- App-Pakete und Marketing: `features/pricing/domain/plans.de.ts` (abgeleitet in `apps/web/src/config/pricing.ts` als `EDEBATTE_PLANS`)
- Feature-Gates und Limits: `apps/web/src/config/{accessTiers,featureMatrix,limits,engagement,credits}.ts`

Wichtige Seiten:

- `/pricing` ist die kanonische Landing für Pakete, Preise und Add-ons.
- `/mitglied-antrag` ist der Mitgliedschafts-Antrag (Wizard, Pflichtfelder, Zahlungsdaten).
- `/mitglied-werden` ist Legacy und redirectet auf `/pricing`.

## Mitgliedschaft und 25%-Goodie

Die Mitgliedschaft ist Unterstützung der Bewegung und kein Rabattprodukt.

Goodie-Regel (technisch):

- `membership.status === "active"`
- `membership.monthlyAmountEUR >= 5.63`
- `membership.minTermMonths >= 24`
- nur bei monatlicher Zahlung (`interval === "month"`)
- nur einmal pro Mitgliedschaft (`discountUsed === false`)

Wenn alle Bedingungen erfüllt sind:

- 25% Rabatt auf eDebatte-Abo (`erweitert` oder `premium`)
- Laufzeit des Goodies: 6 Monate
- danach gilt wieder der Listenpreis

Wichtig für Kommunikation und UX:

- Das Goodie ist ein Dankeschön für langfristige Unterstützung.
- Es ist kein Lockangebot und keine Rabattmaschine.
- Die Mitgliedschaft läuft unabhängig vom Goodie weiter.

## Konfigurationsanker

`apps/web/src/config/pricing.ts` enthält aktuell:

- `VOG_MEMBERSHIP_PLAN`
- `EDEBATTE_PLANS`

Hinweis zum Repo-Stand:

- Die Goodie-/Discount-Entscheidung ist derzeit **nicht** als eigener Export (`MEMBER_DISCOUNT`, `calcDiscountedPrice`, `canApplyVogDiscount`, `getVogDiscountDecision`) in `pricing.ts` vorhanden.
- Regeln und Kommunikation zur 25%-Logik bleiben weiterhin verbindlich, die technische Auswertung liegt aktuell im jeweiligen Membership-/Checkout-Flow.
