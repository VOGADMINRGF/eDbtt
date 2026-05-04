# HOME-LANDING-01

## Ziel
Öffentliche Startseite als hochwertige Debattenradar-/Dossier-Landing schärfen, mit klarem Produktversprechen für eDebatte und sauberer Trennung zu VoiceOpenGov als Initiative.

## Geänderte Dateien
- `apps/web/src/app/start/LandingStart.tsx`
- `apps/web/tests/landing-clarity.contract.test.tsx`
- `apps/web/tests/landing-information-architecture.contract.test.tsx`
- `apps/web/tests/start-shared-create-composer.contract.test.tsx`
- `docs/E150/OpenTasks.md`
- `docs/E150/HOME-LANDING-01.md`

## Akzeptanzkriterien
- Home erklärt eDebatte in unter 10 Sekunden.
- Haupt-CTA ist `Thema prüfen` (nicht `Jetzt swipen`).
- Prozesskette `Signal -> Dossier -> Runde -> Mandat -> Umsetzung -> Wirkung` ist sichtbar.
- Dossier-Vorschau ist als Kernprodukt sichtbar.
- Zielgruppenblöcke für Bürger, Fachöffentlichkeit, Verwaltung/Gremien/Organisationen sind sichtbar.
- VoiceOpenGov ist als Initiative getrennt dargestellt.
- Keine irreführenden Echtzeit-/Live-Zahlen als echte Daten.
- Dark-first, responsive, barrierearme Fokus-/Kontrastzustände.

## Ausgeführte Tests
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/landing-clarity.contract.test.tsx tests/landing-information-architecture.contract.test.tsx tests/start-shared-create-composer.contract.test.tsx tests/public-journey-wording-guardrails.contract.test.ts tests/ux-actor-trust.contract.test.tsx`
- `pnpm -C apps/web run build`

## Offene Folgepunkte
- Finales Legal-/Security-Wording für vertrauliche Hinweise bleibt außerhalb dieses Slices.
- Rechtssichere/verbindliche Abstimmungslogik bleibt außerhalb dieses Slices.
