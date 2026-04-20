# PR-PRICING-ABC-03 - Finaler Privatflow-Shortening-Pass (2026-04-18)

## Ziel

`/pricing` und `/vormerken` auf eine kuerzere, klarere und smartere Produktfuehrung ziehen, ohne neue Parallelwelten:

- private 3er-Logik als sichtbarer Hauptpfad
- institutionelle Konditionen nachgeordnet als Kontakt-/Konditionswelt
- Mitgliedschaft optional im Bestellfluss integrieren
- DE/EN- und Link-Konsistenz ohne Legacy-Drift

## Umsetzung

### 1) `/pricing` auf Entscheidungsmodus verkuerzt

- Hero auf kurze Entscheidungsfuehrung reduziert.
- Zwei Kern-CTAs:
  - `Paket waehlen`
  - `B2B/B2G-Konditionen ansehen`
- Hauptfokus auf drei Privatpakete:
  - `Interessiert`: 0 EUR fuer VoiceOpenGov-Mitglieder, 3,99 EUR regulaer
  - `Aktiv`: 9,90 EUR
  - `Mitgestaltend`: 29,90 EUR
- Institutionelle/redaktionelle Zugaenge nur als kurzer nachgeordneter Hinweis.

Relevante Dateien:
- `apps/web/src/app/pricing/page.tsx`
- `apps/web/src/components/pricing/PackagesGrid.tsx`
- `features/pricing/domain/plans.de.ts`
- `features/pricing/domain/plans.en.ts`

### 2) `/pricing/institutionen` als kontaktgefuehrte Konditionsseite gehaertet

- Keine Direktbuchung auf der Seite.
- Segmentwahl, Betriebsrahmen-Vorauswahl und Add-on-Vormerkung bleiben moeglich.
- Ausleitung ueber kontaktgefuehrte Anfrage an `sales@edebatte.org`.

Relevante Dateien:
- `apps/web/src/app/pricing/institutionen/page.tsx`
- `apps/web/src/app/api/edebatte/preorder/route.ts` (institutioneller Direktbestell-Block)

### 3) `/vormerken` paketgefuehrt und schlanker

- Paketkarte + Preis + Nutzen + naechste Schritte klar priorisiert.
- Formular vereinfacht.
- Optionale Mitgliedschafts-Checkbox integriert:
  - `Ich moechte zusaetzlich die VoiceOpenGov-Mitgliedschaft beantragen.`
- Hinweis auf getrennte Fuehrung von Mitgliedschaft und Paketfreischaltung.
- Membership-Flag wird im Lead-Datensatz gespeichert.

Relevante Dateien:
- `apps/web/src/app/vormerken/page.tsx`
- `features/pricing/domain/types.ts`
- `features/pricing/usecases/createPreorderLead.ts`
- `features/pricing/server/leadsRepo.ts`

### 4) Navigation/Copy-Harmonisierung

- `Zur Bewegung` durch `Zur Initiative` ersetzt.

Relevante Datei:
- `apps/web/src/features/create/createSurfaceConfig.ts`
- `apps/web/src/app/(components)/SiteHeader.tsx`
- `apps/web/src/app/[locale]/referenzarchitektur/page.tsx`

## Contracts und Tests

Neu/aktualisiert und gruene Ergebnisse:

- `apps/web/tests/pricing-private-package-prices.contract.test.ts`
- `apps/web/tests/vormerken-private-package-prices.contract.test.tsx`
- `apps/web/tests/member-checkbox-flow.contract.test.tsx`
- `apps/web/tests/pricing-short-main-flow.contract.test.ts`
- `apps/web/tests/institutional-pricing-link.contract.test.tsx`
- `apps/web/tests/no-legacy-price-logic.contract.test.tsx`
- `apps/web/tests/navigation-initiative-label.contract.test.ts`
- `apps/web/tests/pricing-page.contract.test.ts`
- `apps/web/tests/pricing-i18n.contract.test.ts`
- `apps/web/tests/pricing-institutionen-page.contract.test.ts`
- `apps/web/tests/pricing-institutionen-i18n.contract.test.ts`

Ausgefuehrter Scope:

- `pnpm -C apps/web exec vitest run tests/pricing-institutionen-i18n.contract.test.ts tests/pricing-page.contract.test.ts tests/no-legacy-price-logic.contract.test.tsx tests/vormerken-package-logic-aligned-with-pricing.contract.test.tsx tests/pricing-preorder-segment.contract.test.ts tests/member-checkbox-flow.contract.test.tsx tests/no-legacy-user-facing-package-names.contract.test.tsx tests/pricing-short-main-flow.contract.test.ts tests/navigation-initiative-label.contract.test.ts tests/institutional-pricing-link.contract.test.tsx tests/pricing-order-role-followup.contract.test.ts tests/vormerken-page.contract.test.tsx tests/pricing-i18n.contract.test.ts tests/pricing-order-flow.contract.test.ts tests/pricing-institutionen-page.contract.test.ts tests/pricing-trust-loop.contract.test.ts tests/pricing-package-logic-aligned-with-create.contract.test.tsx tests/pricing-private-package-prices.contract.test.ts tests/pricing-vormerken-source-of-truth.contract.test.tsx tests/pricing-order-followup-i18n.contract.test.ts tests/vormerken-private-package-prices.contract.test.tsx tests/vormerken-i18n.contract.test.tsx tests/pricing-preorder-verification-gates.contract.test.ts tests/pricing-cta-targets.contract.test.ts`

Ergebnis: **24/24 Testdateien gruen (62/62 Tests)**.

## Ergebnisbild

- `/pricing` ist kuerzer und entscheidungsstaerker.
- `/vormerken` ist paketgefuehrt und uebersichtlicher.
- Mitgliedschaft laeuft optional per Checkbox im Bestellfluss mit.
- B2B/B2G wurde als nachgeordnete kontaktgefuehrte Konditionswelt ausgelagert.
- Preislogik und Labeling bleiben DE/EN konsistent ohne Legacy-Reste.
