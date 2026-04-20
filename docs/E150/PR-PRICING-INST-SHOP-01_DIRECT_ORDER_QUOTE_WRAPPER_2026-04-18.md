# PR-PRICING-INST-SHOP-01 – Institutioneller Direktbestellpfad + Kostenvoranschlag

Datum: 2026-04-18
Status: Done

## Ziel

`/pricing/institutionen` und `/vormerken` so harmonisieren, dass institutionelle Pakete direkt bestellbar sind,
inklusive kostenvoranschlagsfaehigem Self-Service auf Knopfdruck und wrapper-tauglichem Kernpfad.

## Umsetzung

### 1. `/pricing/institutionen` von kontaktgefuehrt zu shopfaehig

- Hero/CTA-Logik auf Direktfluss umgestellt:
  - `Direkt bestellen`
  - `Kostenvoranschlag erstellen`
  - optional `Kontakt an sales@edebatte.org`
- Paketkarten fuehren jetzt direkt nach `/vormerken` mit Segment-/Paket-Parametern.
- Add-on-Karten fuehren nach `/vormerken` mit vorgewaehltem Add-on und Angebotsmodus.
- Kontaktpfad bleibt als nachgeordnete Option fuer Sonderkonditionen bestehen.

Geaenderte Datei:
- `apps/web/src/app/pricing/institutionen/page.tsx`

### 2. `/vormerken` segmentgefuehrt + Angebotsgenerator

- Segmentauswahl eingefuehrt: `privat`, `journalismus`, `organisationen`, `kommunen`.
- Paketauswahl folgt dem aktiven Segment (inkl. Query-Praeselektion via `segment`/`paket`).
- Institutionelle Add-ons sind im Formular waehlbar und werden in der Bestellung uebernommen.
- Knopfdruck-Kostenvoranschlag mit:
  - monatlichen Positionen,
  - variablen Positionen,
  - Leistungsuebersicht aus Paket + Add-ons.
- Institutionelle Formularfelder (`Organisation / Kommune`, Rolle) sind im Segmentkontext aktiv.
- Membership-Checkbox bleibt privat-spezifisch und unvermischt.

Geaenderte Datei:
- `apps/web/src/app/vormerken/page.tsx`

### 3. API-Gate fuer institutionelle Direktbestellung geoeffnet

- Der harte Block `segment !== privat -> institutional_contact_required` wurde entfernt.
- Institutionelle Pakete laufen nun durch den normalen Orderflow (inkl. vorhandener Verifikations-/Review-Gates).

Geaenderte Datei:
- `apps/web/src/app/api/edebatte/preorder/route.ts`

### 4. Contracts aktualisiert

- Institutionen-Seite/EN-Variante auf Shop-/Quote-Sprache gehaertet.
- `/vormerken`-Contracts auf segmentgefuehrten Flow + Angebotsdarstellung erweitert.
- API-Route-Test fuer institutionelle Direktbestellung ergaenzt.
- Wrapper-MVP-Contracts erneut mitgeprueft (Pfadkompatibilitaet bleibt intakt).

Geaenderte Tests:
- `apps/web/tests/pricing-institutionen-page.contract.test.ts`
- `apps/web/tests/pricing-institutionen-i18n.contract.test.ts`
- `apps/web/tests/institutional-pricing-link.contract.test.tsx`
- `apps/web/tests/vormerken-page.contract.test.tsx`
- `apps/web/tests/vormerken-i18n.contract.test.tsx`
- `apps/web/tests/edebatte-preorder.route.test.ts`

## Wrapper-Kompatibilitaet

- Der neue Flow bleibt auf bestehenden MVP-Pfaden (`/pricing/**`, `/vormerken`) und ist daher im Android-Wrapper kompatibel.
- Keine nativen Sonder-APIs notwendig; Ablauf bleibt webview-tauglich.
- iOS-Wrapperschicht bleibt als separates natives Delivery-Thema, der Web-Flow selbst ist plattformneutral.

## Verifikation

Ausgefuehrte Checks:

- `pnpm -C apps/web exec vitest run tests/vormerken-page.contract.test.tsx tests/vormerken-i18n.contract.test.tsx tests/vormerken-private-package-prices.contract.test.tsx tests/member-checkbox-flow.contract.test.tsx tests/pricing-institutionen-page.contract.test.ts tests/pricing-institutionen-i18n.contract.test.ts tests/institutional-pricing-link.contract.test.tsx tests/edebatte-preorder.route.test.ts tests/pricing-preorder-verification-gates.contract.test.ts tests/pricing-order-flow.contract.test.ts tests/wrapper-mvp-surface-contract.test.ts tests/wrapper-android-mvp-policy.test.ts tests/mobile-app-shell-contract.test.ts`
- `pnpm -C apps/web exec tsc --noEmit`

Ergebnis:
- Alle ausgewaehlten Contracts gruen.
- Typecheck gruen.

## Docs-Sync

Folgedoku angepasst:
- `docs/E150/OpenTasks.md`
- `docs/E150/Part19_Pricing_Packaging.md`
- `docs/E150/membership_pricing.md`
- `docs/E150/Part03_AccessTiers_Pricing_B2C.md`

