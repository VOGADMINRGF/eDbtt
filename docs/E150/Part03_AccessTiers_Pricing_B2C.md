# E150 Master Spec - Part 3: Access Tiers & Pricing (B2C)

> Status-Hinweis (2026-02-12): Dieses Part ist eine Spezifikation/Zusammenfassung. Der verbindliche Aufgabenstand liegt in `docs/E150/OpenTasks.md`.

## 1. Zweck

Dieser Part beschreibt das B2C-Modell für eDebatte mit drei Bürger:innen-Tiers und klaren Goodie-/Limit-Regeln.

- transparente Bepreisung
- keine Pay-to-Win-Mechanik
- XP/Engagement und Access bleiben getrennte Achsen
- Credits bleiben nutzungsbasiert, nicht kaufbar

## 2. Kanonische B2C-Tiers

- `basis` (0 EUR)
- `erweitert` (monatlicher Pro-Preis)
- `premium` (oberste B2C-Stufe)

Weitere technische Tiers:

- `public` (Gast)
- `institutionBasic`, `institutionPremium`
- `staff`

Quelle der technischen Defaults:

- `apps/web/src/config/accessTiers.ts`
- `apps/web/src/config/featureMatrix.ts`
- `apps/web/src/config/limits.ts`

## 3. Preis- und Zugriffskern

| Tier | Preis | Kernnutzen |
| --- | --- | --- |
| `public` | 0 EUR | Lesen + max. 3 Swipes/Tag |
| `basis` | 0 EUR | volle Teilnahme mit Basis-Limits |
| `erweitert` | paid | mehr Kontingente, Streams/Kampagnen im Rahmen |
| `premium` | paid+ | höchste B2C-Limits, tiefere Reports |

## 4. Credits und Engagement

Credits sind nicht käuflich.

- 100 Swipes = 1 Contribution-Credit
- Maximal 50 gespeicherte Credits (Default)
- XP-Events und Level-Schwellen liegen in `config/engagement.ts`
- Credit-Logik liegt in `config/credits.ts`

## 5. Mitgliedschafts-Goodie (25%)

Die Mitgliedschaft ist Unterstützung der Bewegung und kein Rabattprodukt.

Rabatt ist nur aktiv, wenn alle Bedingungen erfüllt sind:

- `membership.status === "active"`
- `monthlyAmountEUR >= 5.63`
- `minTermMonths >= 24`
- nur monatliche Zahlung (`interval === "month"`)
- `discountUsed === false`

Dann gilt:

- 25% Rabatt auf `erweitert` oder `premium`
- für die ersten 6 Monate
- danach wieder Listenpreis

## 6. Leitplanken

- Geld kauft keine Stimmen, keine Priorität, kein inhaltliches Gewicht.
- Unterstuetzung/Crowdfunding beeinflusst nie Votes, XP oder Credits.
- Feature-Gates laufen immer über zentrale Configs, nicht über UI-Hardcoding.
