# PR-PRICING-VORMERKEN-SMARTER-01

Datum: 2026-04-19  
Status: done

## Ziel

Die Produktfuehrung auf `/pricing`, `/vormerken` und `/pricing/institutionen` weiter verkuerzen und klarer staffeln:

- Privatpfad als einfache Paketentscheidung
- Mitgliedschaft/Initiative sichtbarer und konsistenter
- institutioneller Pfad mit gefuehrter Auswahl, optionalem Angebot und Download-Quote mit Pflichtangaben
- keine Parallelwelt, keine Textwand, keine Adminsprache im Hauptfluss

## Umsetzung

### 1) Privatlogik auf `/pricing` + `/vormerken` geschaerft

Dateien:

- `apps/web/src/app/pricing/page.tsx`
- `apps/web/src/components/pricing/PackagesGrid.tsx`
- `apps/web/src/app/vormerken/page.tsx`

Ergebnis:

- Drei Privatpakete bleiben klarer Hauptpfad:
  - `Interessiert`: `0 EUR` fuer Mitglieder / `3,99 EUR` regulaer
  - `Aktiv`: `9,90 EUR`
  - `Mitgestaltend`: `29,90 EUR`
- Mitgliedschaft ist als sichtbarer Block im Privatfluss integriert (nicht als Randcheckbox).
- Hinweislogik ist konkret:
  - kostenfreier Einstieg fuer `Interessiert` als Mitglied
  - Beitragshoehe bleibt frei/unabhaengig
  - empfohlener Mitgliedsbeitrag `5,63 EUR`
  - finale Mitgliedsbestaetigung separat per E-Mail-Link
  - organisatorisch/technisch getrennte Systeme moeglich
- Privatsegment zeigt keinen Kostenvoranschlagsfokus mehr.

### 2) Institutioneller Pfad inkl. Quote-Download gehaertet

Dateien:

- `apps/web/src/app/pricing/institutionen/page.tsx`
- `apps/web/src/app/vormerken/page.tsx`
- `apps/web/src/app/api/edebatte/preorder/route.ts`

Ergebnis:

- Gefuehrte Struktur bleibt aktiv (`Segment -> Ziel -> Rahmen -> Empfehlung`).
- Kontakt-/Abschlusswege sind sauber gruppiert:
  - Direkt bestellen
  - Kostenvoranschlag anfordern
  - Kostenvoranschlag downloaden
  - Kontakt zum Team / MS Teams / E-Mail / Telefon
- Download-Kostenvoranschlag wird nur mit Pflichtangaben aktiv:
  - Organisation/Firma
  - Ansprechpartner
  - Telefon
  - E-Mail
  - Datenschutz- und Kontaktzustimmung
- API-Pruefung erzwingt Consent-Felder (`acceptedPrivacy`, `acceptedTerms`, `acceptedContact`).

### 3) Benennung und Hierarchie konsolidiert

Dateien:

- `apps/web/src/app/vormerken/page.tsx`
- `apps/web/tests/{vormerken-page.contract.test.tsx,vormerken-i18n.contract.test.tsx}`

Ergebnis:

- `Zur Bewegung` ist auf Kernpfaden als `Zur Initiative` konsistent.
- `Gefuehrte Vorauswahl` ist als `Triff deine Vorauswahl` gefuehrt.
- Kein `Next steps`-Restblock im Privatfluss.
- Ein Runtime-Regression-Bug in `/vormerken` wurde behoben (`selectedGoalId`/`selectedFrameId` vor Initialisierung).

## Tests / Contracts

Neu/ergaenzt (Slice-relevant):

- `apps/web/tests/pricing-private-member-price.contract.test.ts`
- `apps/web/tests/pricing-initiative-link.contract.test.ts`
- `apps/web/tests/vormerken-private-no-quote.contract.test.tsx`
- `apps/web/tests/vormerken-membership-application-visibility.contract.test.tsx`
- `apps/web/tests/private-package-capability-clarity.contract.test.ts`
- `apps/web/tests/institutional-quote-download-requires-contact-fields.contract.test.tsx`
- `apps/web/tests/institutional-contact-paths.contract.test.tsx`
- `apps/web/tests/initiative-nav-label.contract.test.ts`
- `apps/web/tests/no-next-steps-noise.contract.test.tsx`

Zusatz-Updates:

- `apps/web/tests/member-checkbox-flow.contract.test.tsx`
- `apps/web/tests/vormerken-page.contract.test.tsx`
- `apps/web/tests/vormerken-i18n.contract.test.tsx`
- `apps/web/tests/pricing-page.contract.test.ts`
- `apps/web/tests/no-legacy-price-logic.contract.test.tsx`
- `apps/web/tests/edebatte-preorder.route.test.ts`

## Verifikation

Ausgefuehrt:

```bash
pnpm -C apps/web exec vitest run tests/vormerken-page.contract.test.tsx tests/vormerken-i18n.contract.test.tsx tests/vormerken-private-no-quote.contract.test.tsx tests/vormerken-membership-application-visibility.contract.test.tsx tests/no-next-steps-noise.contract.test.tsx tests/member-checkbox-flow.contract.test.tsx tests/pricing-page.contract.test.ts tests/pricing-private-member-price.contract.test.ts tests/pricing-initiative-link.contract.test.ts tests/private-package-capability-clarity.contract.test.ts tests/institutional-quote-download-requires-contact-fields.contract.test.tsx tests/institutional-contact-paths.contract.test.tsx tests/initiative-nav-label.contract.test.ts tests/edebatte-preorder.route.test.ts tests/no-legacy-price-logic.contract.test.tsx
pnpm -C apps/web exec vitest run tests/pricing-short-main-flow.contract.test.ts tests/institutional-pricing-link.contract.test.tsx tests/navigation-initiative-label.contract.test.ts tests/pricing-private-package-prices.contract.test.ts tests/vormerken-private-package-prices.contract.test.tsx
```

Ergebnis:

- alle ausgefuehrten Slice-Contracts gruen
- Runtime-Regression in `/vormerken` behoben
