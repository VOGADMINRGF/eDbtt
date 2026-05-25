# UX-QUICK-ACTION-CENTER-01

Stand: 2026-05-25

## Ziel

Der globale Schnellstart folgt Aufgaben statt internen Modulen.
Nutzer müssen nicht wissen, welche Route oder welches Modul richtig ist.

Der Einstieg bleibt auf bestehenden production_ready-v1 Pfaden:

- Beitrag geben
- Themen anschauen
- Anlassraum/Event erstellen
- Organisation anmelden oder Arbeitsbereich öffnen

## Umsetzung

Es wurde keine neue Produktwelt gebaut.
Stattdessen nutzen `/start` und `/account/organization/dashboard` jetzt dieselbe wiederverwendbare Quick-Action-Struktur.

Primäre zentrale Quick Actions:

- `Ich will etwas beitragen` -> `/create?intent=contribute`
- `Ich will Themen anschauen` -> `/themen`
- `Ich will einen Anlassraum/Event erstellen` -> `/runden?intent=create`
- `Ich melde eine Organisation an` -> `/account/organization`
- kontextabhängig im Organisationsbereich: `Ich prüfe meine Organisation` oder `Ich öffne meinen Arbeitsbereich`

Optionale sekundäre Einstiege nur bei passendem Kontext:

- `Quelle/Material einreichen` -> `/create?intent=contribute&mode=source`
- `Freigaben prüfen` -> `/account/organization/dashboard#aufgaben`

## Kontextlogik

### Anonym

- klare Kernwege ohne Login-Overload
- keine neue Auth- oder Schnellregistrierungslogik
- Organisation bleibt ein eigener Einstiegspfad

### Pending / limited

- keine falschen produktiven Vollzugriffe
- Anlassraum/Event führt auf Status/Freischaltung statt auf einen vorgetäuschten aktiven Organisationspfad
- Organisation zeigt sichere nächste Schritte

### Verifiziert

- produktive Kernaktionen bleiben direkt sichtbar
- Quelle/Material und Freigaben erscheinen nur bei passendem Scope

### Betreiberkontext

- Betreiberkontext bleibt explizit markiert
- Organisationsblick nutzt denselben task-first Einstieg, ohne neue Parallelwelt

## Guardrails

- kein neues Produktmodul
- kein neues Auth-System
- keine neue Produktparallelwelt
- keine Route-Erfindung außerhalb bestehender production_ready-v1 Pfade
- review-first bleibt sichtbar als Sicherheit, nicht als Automationsversprechen

## Validierung

- `pnpm -C apps/web exec vitest run tests/start-shared-create-composer.contract.test.tsx tests/account-organization-dashboard.page.test.tsx tests/header-mobile-navigation.contract.test.ts tests/e150-journey-routing.contract.test.ts tests/create-anlassraum-handoff.contract.test.tsx`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `rm -rf apps/web/.next`
- `pnpm --filter @vog/web build`
- `pnpm run release:validate:production`
