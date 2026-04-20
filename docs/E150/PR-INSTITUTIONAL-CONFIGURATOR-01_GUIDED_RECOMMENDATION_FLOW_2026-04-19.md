# PR-INSTITUTIONAL-CONFIGURATOR-01

Datum: 2026-04-19  
Status: done

## Ziel

Institutionelle Preis-/Bestellflaechen von einer katalogartigen Darstellung auf einen gefuehrten Vorauswahl- und Empfehlungsflow umstellen:

- `/pricing/institutionen`: Segment -> Ziel -> Rahmen -> Empfehlung
- institutioneller Teil `/vormerken`: Empfehlung uebernehmen, Add-ons situativ anpassen, Rueckfragen nur bei relevanten Add-ons, drei Abschlusswege

## Umsetzung

### 1) Shared Empfehlung-/Followup-SSOT

Datei: `features/pricing/domain/institutionalPricing.de.ts`

- Neue Guided-Selection-Domain:
  - `InstitutionalSelectionGoalId`
  - `InstitutionalSelectionFrameId`
  - `InstitutionalCompletionPathId`
- Neue helper:
  - `getInstitutionalSelectionGoals`
  - `getInstitutionalSelectionFrames`
  - `getInstitutionalCompletionPaths`
  - `normalizeInstitutionalSelectionGoalId`
  - `normalizeInstitutionalSelectionFrameId`
  - `normalizeInstitutionalCompletionPathId`
  - `recommendInstitutionalConfiguration`
  - `getInstitutionalAddonFollowupQuestions`
  - `getInstitutionalAddonNotNeededHint`
- Empfehlung liefert zentral:
  - empfohlenes Basispaket + Alternativstufe
  - ROI-/Nutzenkontext
  - empfohlene Add-ons (Top 2-3) + optionale Restliste

### 2) `/pricing/institutionen` als gefuehrter Vorauswahlflow

Datei: `apps/web/src/app/pricing/institutionen/page.tsx`

- Hero stark gekuerzt.
- Segmentauswahl als erste Stufe.
- Ziel-/Einsatzkontext und Rahmen als zweite/dritte Stufe.
- Zentrales Modul `Empfohlene Konfiguration` mit:
  - Begruendung
  - Abdeckung/Gap-Hinweis
  - ROI-Hinweisen
  - alternativer naechster Stufe
- CTA-Staffel:
  - `Empfehlung uebernehmen`
  - `Direkt bestellen`
  - `Kostenvoranschlag anfordern`
  - `Gespraech anfragen`
  - nachgeordnet Kontakt / Ruecksprung
- Add-ons progressiv:
  - zuerst empfohlene Erweiterungen
  - weitere Optionen nachgeordnet in `details`

### 3) Institutioneller `/vormerken`-Konfigurator

Datei: `apps/web/src/app/vormerken/page.tsx`

- Uebernahme von `goal/frame/completion` aus Query.
- Institutionelle Guided-Vorauswahl innerhalb der Seite (Ziel + Rahmen).
- Paketvorwahl folgt Empfehlung (wenn kein explizites Paket vorgegeben).
- Add-ons:
  - empfohlene Erweiterungen zuerst
  - weitere Optionen nachgeordnet
- Situative Rueckfragen:
  - nur fuer ausgewaehlte Add-ons sichtbar
  - Antworten werden als `selectedOptions` mitgesendet
- Drei Abschlusswege im Formular:
  - `Direkt bestellen` (Default)
  - `Kostenvoranschlag anfordern` (optional)
  - `Gespraech anfragen`

## Contracts / Tests

Neu:

- `apps/web/tests/institutional-guided-selection-flow.contract.test.ts`
- `apps/web/tests/institutional-package-recommendation.contract.test.ts`
- `apps/web/tests/institutional-addons-progressive-disclosure.contract.test.ts`
- `apps/web/tests/institutional-addon-followup-questions.contract.test.tsx`
- `apps/web/tests/institutional-quote-optional-not-primary.contract.test.tsx`
- `apps/web/tests/institutional-roi-copy.contract.test.ts`
- `apps/web/tests/institutional-visual-overload-regression.contract.test.ts`

Aktualisiert:

- `apps/web/tests/pricing-institutionen-page.contract.test.ts`
- `apps/web/tests/pricing-institutionen-i18n.contract.test.ts`
- `apps/web/tests/institutional-pricing-link.contract.test.tsx`

## Verifikation

Ausgefuehrt:

```bash
pnpm -C apps/web exec tsc --noEmit
pnpm -C apps/web exec vitest run tests/pricing-institutionen-page.contract.test.ts tests/pricing-institutionen-i18n.contract.test.ts tests/institutional-pricing-link.contract.test.tsx tests/vormerken-page.contract.test.tsx tests/vormerken-i18n.contract.test.tsx tests/institutional-guided-selection-flow.contract.test.ts tests/institutional-package-recommendation.contract.test.ts tests/institutional-addons-progressive-disclosure.contract.test.ts tests/institutional-addon-followup-questions.contract.test.tsx tests/institutional-quote-optional-not-primary.contract.test.tsx tests/institutional-roi-copy.contract.test.ts tests/institutional-visual-overload-regression.contract.test.ts
```

Ergebnis:

- Typecheck gruen
- 12 Testdateien / 23 Tests gruen

