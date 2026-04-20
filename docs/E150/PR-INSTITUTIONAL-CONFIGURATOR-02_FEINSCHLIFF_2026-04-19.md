# PR-INSTITUTIONAL-CONFIGURATOR-02

Datum: 2026-04-19  
Status: done

## Ziel

Institutionelle Flaechen (`/pricing/institutionen` und institutioneller Teil von `/vormerken`) im Feinschliff beruhigen und verdichten, ohne die neue Guided-Selection-Logik zurueckzubauen:

- Segment -> Ziel -> Rahmen -> Empfehlung bleibt unveraendert
- weniger Text, klarere Gewichtung, staerkere Empfehlung
- Add-ons selektiver und in Prioritaetsbaendern
- Rueckfragen nur situativ nach Add-on-Auswahl
- oeffentliche Nutzenlogik ohne ROI-/Sales-Jargon

## Umsetzung

### 1) Empfehlung und Auswahlkopf priorisiert

Dateien:

- `apps/web/src/app/pricing/institutionen/page.tsx`
- `apps/web/src/app/vormerken/page.tsx`

Ergebnis:

- Auswahlkopf ist kompakt als zusammenhaengender Konfiguratorblock (Segment, Ziel, Rahmen) ausgefuehrt.
- `Empfohlene Konfiguration` ist visuell klar als Hauptfokus priorisiert (groesser/kontrastreicher, ruhige Dominanz).
- CTA-Staffelung bleibt klar:
  - primaer: `Empfehlung uebernehmen`, `Direkt bestellen`
  - sekundaer: `Kostenvoranschlag anfordern`
  - tertiaer: `Gespraech anfragen`

### 2) Add-ons weiter verdichtet und gestaffelt

Dateien:

- `apps/web/src/app/pricing/institutionen/page.tsx`
- `apps/web/src/app/vormerken/page.tsx`

Ergebnis:

- Add-ons sind klar in drei Banden strukturiert:
  - `Empfohlene Erweiterungen`
  - `Optional`
  - `Nur bei Bedarf`
- Karten zeigen knapp nur:
  - Name
  - Preis/Preisrahmen
  - wann sinnvoll
  - Status (`Direkt bestellbar`, `Mit Rueckfragen`, `Nur nach Klaerung`)
- Laengere Einordnung/Rueckfragen erscheinen erst nach Auswahl im Followup-Block von `/vormerken`.

### 3) Sprachlogik enttechnisiert (kein ROI als public headline)

Dateien:

- `apps/web/src/app/pricing/institutionen/page.tsx`
- `apps/web/src/app/vormerken/page.tsx`
- `apps/web/tests/institutional-roi-copy.contract.test.ts`
- `apps/web/tests/institutional-no-roi-jargon.contract.test.tsx`

Ergebnis:

- Oeffentliche Nutzenformulierung nutzt Mehrwert-/Entlastungs-/Wirkungssprache (`Welchen Unterschied es macht`) statt prominenter ROI-Sprache.
- Guided-Flow bleibt professionell, ruhig und anschlussfaehig fuer Kommunen/Verwaltungen/Organisationen.

## Tests / Contracts

Aktualisiert:

- `apps/web/tests/pricing-institutionen-page.contract.test.ts`
- `apps/web/tests/institutional-addons-progressive-disclosure.contract.test.ts`
- `apps/web/tests/institutional-roi-copy.contract.test.ts`

Neu:

- `apps/web/tests/institutional-recommendation-visual-priority.contract.test.ts`
- `apps/web/tests/institutional-addon-copy-shortened.contract.test.ts`
- `apps/web/tests/institutional-addon-priority-bands.contract.test.ts`
- `apps/web/tests/institutional-no-roi-jargon.contract.test.tsx`
- `apps/web/tests/institutional-followup-only-after-selection.contract.test.tsx`
- `apps/web/tests/institutional-cta-hierarchy.contract.test.ts`

## Verifikation

Ausgefuehrt:

```bash
pnpm -C apps/web exec vitest run tests/pricing-institutionen-page.contract.test.ts tests/vormerken-page.contract.test.tsx
pnpm -C apps/web exec vitest run $(rg --files tests | rg '^tests/institutional-.*\.test\.tsx?$')
pnpm -C apps/web exec vitest run tests/pricing-institutionen-i18n.contract.test.ts tests/vormerken-i18n.contract.test.tsx tests/institutional-pricing-link.contract.test.tsx
pnpm -C apps/web exec tsc --noEmit
```

Ergebnis:

- institutionelle Contract-Suite gruen
- relevante i18n-/Link-Contracts gruen
- Typecheck gruen

