# GOV-FUNDING-02 Resource Support Contract (2026-03-29)

## Zweck

Dieses Dokument operationalisiert `GOV-FUNDING-02` ohne Funding-Engine oder Checkout.
Es erweitert den manifestierten Funding-Kanon aus `GOV-FUNDING-01` auf
Ressourcen-/Sachleistungs-/Begleit-Faelle und friert den Ist-Contract testbar ein.

## 1) Kanonischer Rahmen (aus GOV-FUNDING-01 uebernommen)

- Funding ersetzt nie Relevanz, Signal, Legitimation oder Wahrheitsanspruch.
- Dossier bleibt Oberraum; Funding dockt primaer am konkreten Anlassraum an.
- Nicht-monetare Unterstuetzung ist zulaessig, wenn Transparenz-/Capture-Regeln greifen.
- Matching bleibt projektbezogen (`Ermoeglichungsfonds` / `Matching Fund`), nicht personenbezogen.
- Keine Reward-/Points-/Token-/Earn-to-participate-Hauptlogik.

## 2) Typologie (Contract-Startkanon)

`supportType`:

1. `money`
2. `in_kind`
3. `know_how`
4. `volunteer_support`
5. `planning_service`
6. `moderation_contribution`

`supportScope`:

- `anlassraum` (Standard, primaer)
- `dossier_adjacent` (nur mit explizitem Dossier-Bezug)

`matchingFrame`:

- `none`
- `enabling_fund`
- `community_contributions`

## 3) Pflichtregeln (operativ)

1. Anlassraum-first:
   - `supportScope=anlassraum` braucht `anlassraumId`.
2. Dossier-adjacent:
   - `supportScope=dossier_adjacent` braucht `dossierId`.
3. Monetar vs. nicht-monetar:
   - `money` braucht `amountCents` + `currency`.
   - nicht-monetare Typen brauchen `resourceDescription`.
4. Matching-Guardrail:
   - `matchingFrame != none` ist nur im Anlassraum-Scope zulaessig.
5. Transparenz-/Capture-Flags:
   - Kontext/offene Fragen/Tragfaehigkeit muessen sichtbar bleiben.
   - Trennung von Signal/Faktenstatus/Voting/Legitimation ist Pflicht.

## 4) Implementierungsanker (02-Contract, keine Runtime-Engine)

- Contract:
  - `apps/web/src/lib/server/funding/fundingSupportContract.ts`
- Tests:
  - `apps/web/tests/funding-support-contract.test.ts`

## 5) Testabdeckung (Mindestfaelle)

- gueltiger Geldbeitrag fuer konkreten Anlassraum
- gueltiger nicht-monetarer Beitrag (Know-how) inkl. Matching-Frame
- dossier-adjacent ohne `dossierId` wird abgelehnt
- Matching ausserhalb Anlassraum-Scope wird abgelehnt
- unbekannte reward-aehnliche Felder werden via strict parsing abgelehnt

## 6) Nicht Teil von GOV-FUNDING-02

- keine Zahlungs-/Checkout-/Fundraising-Engine
- keine Runtime-Priorisierung nach Funding
- keine personenbezogene Belohnungslogik
- keine Vermischung mit Pricing-Engine
