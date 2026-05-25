# UX-GO-LIVE-SIMPLIFICATION-01

Stand: 2026-05-25

## Ziel

Die Go-live-Bedienung zeigt jetzt sofort die vier Kernhandlungen:

- etwas beitragen
- Themen anschauen
- Anlassraum/Event starten
- Organisation anmelden

Dieser Slice baut keine neue Produktlogik. Er reduziert Navigation, Onboarding und Quick Actions auf den bestehenden Pfaden.

## Geänderte UX-Regeln

- Das Logo bleibt der Home-Einstieg. `Start` wird nicht mehr als doppelte Schnelltaste im Mobile-Menü geführt.
- Die primäre Navigation wurde auf vier Kernziele verdichtet:
  - `Beitragen`
  - `Themen`
  - `Anlassraum / Event`
  - `Organisation`
- Anonyme Nutzer sehen nicht mehr gleichzeitig Login und separaten Registrieren-Druck im Header.
- Der professionelle Einstieg läuft über einen sichtbaren Organisationspfad statt über mehrere parallele B2B-/B2G-Einstiege.

## Quick Actions

Sichtbar auf Startseite und im Organisationsdashboard:

- `Ich will etwas beitragen`
- `Ich will Themen anschauen`
- `Ich will einen Anlassraum/Event erstellen`
- `Ich melde eine Organisation an`

## Organisations-Onboarding

Der Organisationspfad bleibt ein Einstieg:

- Verwaltung / Kommune
- Verein / Träger / Verband
- Medienpartner / Redaktion
- Beteiligungsbüro / Agentur
- Stiftung / Programmträger

Rechte entstehen weiter erst nach Betreiber-Verifikation, Scope-Auflösung und manueller Freischaltung.

## Anlassraum/Event-Einstieg

`/runden` rahmt den Start jetzt als schlanken bestehenden Einstieg:

- Titel
- Wirkraum
- Ziel
- Zeitraum optional
- review-first Hinweis

Es wurde kein neuer Anlassraum-Editor und keine neue Parallelroute eingeführt.

## Validierung

```bash
pnpm -C apps/web exec vitest run tests/header-mobile-navigation.contract.test.ts tests/e150-journey-routing.contract.test.ts tests/create-anlassraum-handoff.contract.test.tsx tests/account-organization-dashboard.page.test.tsx tests/pricing-communities-entry.contract.test.ts
pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
rm -rf apps/web/.next
pnpm --filter @vog/web build
pnpm run release:validate:production
```

## Ergebnis

Navigation, Onboarding und Quick Actions sind auf den `production_ready-v1` Go-live-Modus vereinfacht und auf Kernhandlungen verdichtet.
