# START-MOBILE-SCROLL-STABILITY-04

Datum: 2026-06-05
Status: done
Task-ID: `START-MOBILE-SCROLL-STABILITY-04`

## Was wurde gehärtet?

- `/start` nutzt im Seitenshell-Pfad jetzt stabile Mobile-Viewport-Höhen über `100svh` statt eines harten `min-h-screen`-Setups.
- Die Canvas-Surfaces für Start-/Landing-Flächen tragen defensives `overscroll-behavior-y: contain`, um mobile Overscroll-/Refresh-Sprünge zu reduzieren.
- `LandingCreateLightEntry` entfernt die mobilen Fokus-Sideeffects nach Beispielübernahme und `Beitrag ändern`; der Hero springt dadurch nicht mehr künstlich zum Textfeld zurück.
- Die bestehenden Contracts prüfen jetzt explizit:
  - `preventDefault()` im Create-Light-Formular
  - keine Router-/Reload-Sideeffects im Preview-/Beispielpfad
  - nicht-submitte Beispiel-/Edit-Aktionen
  - stabile Voxy-Flächenreservierung über Aspect-Ratio
  - keine harte `min-h-screen`-Abhängigkeit im `/start`-Seitenshell-Pfad

## Was wurde bewusst nicht geändert?

- Keine neue Produktlogik auf `/start`
- Kein neuer Handoff-Pfad
- Kein DeepSearch
- Kein Orchestrator
- Kein Auto-Publish
- Kein Auto-Dossier
- Kein Auto-Anlassraum
- Kein Auto-Graph-Write

## Warum dieser Slice?

Live-QA zeigte mobile Scroll-/Refresh-Anmutungen und Sprünge im Start-Hero. Die wahrscheinlichsten Auslöser im bestehenden Code waren:

- harte Viewport-Höhen
- programmgesteuerte Fokus-Rücksprünge
- fehlende Guardrails gegen ungewollte Submit-/Navigation-Sideeffects

Der Slice hält die vorhandene Create-Light-Logik unverändert und entfernt nur diese Stabilitätsrisiken.

## Verifikation

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/start-create-light-entry.contract.test.tsx tests/landing-clarity.contract.test.tsx tests/landing-information-architecture.contract.test.tsx tests/start-shared-create-composer.contract.test.tsx tests/start-privacy-gate-links.contract.test.ts tests/mobile-entry-routes.contract.test.tsx`

Erwarteter Guardrail-Stand:

- Preview bleibt auf derselben Seite
- Beispielkarten füllen nur lokalen Text
- Nur explizite Continue-CTAs verlassen `/start`
- Voxy bleibt reserviert und ersetzt die Hero-Hauptaktion nicht
