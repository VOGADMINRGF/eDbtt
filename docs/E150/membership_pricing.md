# eDebatte & eDebatte – zentrale Pricing-Struktur

Die Preis- und Paketlogik ist bewusst in zwei Ebenen getrennt:

- **Mitgliedschaft (Bewegung / VoG)**: `apps/web/src/config/pricing.ts`
- **App-Pakete & Marketing**: `features/pricing/domain/plans.de.ts` (wird in `apps/web/src/config/pricing.ts` als `EDEBATTE_PLANS` abgeleitet)
- **Feature-Gates / AccessTiers**: `features/pricing/config.ts` (intern, z.B. fuer Credits/Limits)

Wichtige Seiten:

- `/pricing` ist die **kanonische** Landing fuer Pakete, Preise und Add-ons.
- `/mitglied-antrag` ist der **Mitgliedschafts-Antrag** (Wizard, Pflichtfelder, Bankdaten/Verwendungszweck).
- `/mitglied-werden` ist **Legacy** und redirectet auf `/pricing` (keine neuen Flows darauf aufbauen).

`apps/web/src/config/pricing.ts` ist TS-strikt typisiert und enthält:

- **`VOG_MEMBERSHIP_PLAN`** – Basisdaten der eDebatte-Mitgliedschaft (Bezeichnung, Beschreibung, orientierender Monatsbeitrag pro Person).
- **`EDEBATTE_PLANS`** – Liste der eDebatte-Pakete (`edb-start`, `edb-pro`) mit Label, Beschreibung und Listenpreis (Amount + Interval `month | year`).
- **`MEMBER_DISCOUNT`** – zentrale Rabattregel (aktuell 25 %) inklusive Anwendungsbereich (`edebatte`, `merch`).
- **`calcDiscountedPrice`** – Helper, der den rabattierten Preis aus dem Listenpreis berechnet.

## Neue Pakete oder Rabatte ergänzen

1. **Neues eDebatte-Paket**: In `EDEBATTE_PLANS` einen weiteren Eintrag mit `id`, `label`, `description` und `listPrice` anlegen. Die Seiten lesen automatisch alle Einträge der Liste aus und zeigen Listen- und Mitgliedspreis an.
2. **Weitere Rabatte**: `MEMBER_DISCOUNT` erweitern oder zusätzliche `DiscountRule`-Objekte definieren. Verwende `calcDiscountedPrice(listPrice, discountPercent)`, um neue Prozentsätze einzubinden.
3. **Mitglieds-Orientierungswert anpassen**: `VOG_MEMBERSHIP_PLAN.suggestedPerPersonPerMonth` ändern; der Wert fließt in den Mitgliedschafts-Rechner (z.B. `/unterstuetzen`).

Die Darstellung auf `/pricing` basiert primaer auf `features/pricing/domain/plans.de.ts`.  
Feature-Gates (Credits/Limits) werden separat ueber `features/pricing/config.ts` modelliert, damit UI-Texte und technische Berechtigungen nicht auseinanderlaufen.
