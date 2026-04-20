# PR-PRODUCT-SURFACES-HARM-01 — Finaler UX-/Copy-/Hierarchy-Schluss (2026-04-18)

## Ziel

Die Produktflächen `/create`, `/pricing`, `/vormerken` und `/runden` wurden im finalen Harmonisierungsslice auf dieselbe sichtbare Produktlogik gezogen:

1. **Beitragen / Einbringen**
2. **Prüfen**
3. **Entwerfen / gemeinsam ausarbeiten**

Ohne neue Parallelwelt, ohne neue Feature-Logik, mit Fokus auf Hierarchie, Copy-Ruhe, Paket-/Modus-Konsistenz und DE/EN-Parität.

## Umgesetzt

### 1) `/create` als klarer Arbeitsstart

- Hero/Entry kompakter und ruhiger gehalten, bei beibehaltener Gradient-Headline.
- Drei Modi klar lesbar mit Titel, Kurzsatz und mode-spezifischer CTA:
  - `Beitragen` / `Contribute`
  - `Prüfen` / `Review`
  - `Entwerfen` / `Draft together`
- Primärfläche bleibt **ein großes Textfeld**.
- Kontextchips auf mode-passende, reduzierte Auswahl begrenzt.
- Hilfelinks und Kontextchips als sekundäre `details`-Bereiche entkoppelt.
- DE/EN aus gemeinsamer i18n-Quelle konsistent geführt.

Relevante Dateien:
- `apps/web/src/features/create/createSurfaceConfig.ts`
- `apps/web/src/features/create/SharedCreateComposer.tsx`
- `apps/web/src/app/create/CreateClient.tsx`

### 2) `/pricing` als eindeutige 3er-Paketentscheidung

- Drei B2C-Kernpakete bleiben die dominante Hauptwelt.
- Paketnarrativ sichtbar auf die `/create`-Verben ausgerichtet.
- Brücke von Paketen zu den drei Create-Modi sprachlich konsistent.
- Sonderzugänge (Journalismus/Organisationen/Kommunen) klar vorbereitet, aber nachgeordnet gehalten.

Relevante Dateien:
- `apps/web/src/app/pricing/page.tsx`
- `features/pricing/domain/plans.de.ts`
- `features/pricing/domain/plans.en.ts`

### 3) `/vormerken` als sauberer Folgepfad derselben Paketwelt

- Selbe Paketlogik/Naming wie `/pricing`.
- Hero-/Folgelogik explizit paketgeführt (Paketstart direkt, Freischaltung als nächster Schritt).
- Sonderzugänge auch hier sekundär und vorbereitet statt parallel dominierend.

Relevante Dateien:
- `apps/web/src/app/vormerken/page.tsx`
- `features/pricing/domain/content.de.ts`

### 4) `/runden` als Anlassraum-Arbeitsfläche

- View-/Tab-Sprache auf Arbeitscharakter geschärft (`Arbeitsbereiche` statt administrativem Framing).
- Verwalten-/Admin-Anmutung weiter reduziert (inkl. Entfernen des `organize`-Pfads in der Oberfläche).
- Beteiligungsöffnung per Link/QR produktisch formuliert:
  - `Teilnahme öffnen`
  - `Teilnahmelink kopieren`
  - `Teilnahme per QR öffnen`
  - `Teilnahme teilen`
- Fokus auf Arbeitsstand, Beiträge, Weiterführen, Nachverfolgung.

Relevante Dateien:
- `apps/web/src/app/runden/page.tsx`
- `apps/web/src/app/runden/RundenShareActions.tsx`

## Tests / Contracts

Aktualisiert:
- `apps/web/tests/runden-page.acceptance.test.ts`

Neu ergänzt:
- `apps/web/tests/create-entry-hierarchy.contract.test.tsx`
- `apps/web/tests/create-no-chip-overload.contract.test.tsx`
- `apps/web/tests/create-i18n-no-mixed-locale.contract.test.tsx`
- `apps/web/tests/pricing-package-logic-aligned-with-create.contract.test.tsx`
- `apps/web/tests/vormerken-package-logic-aligned-with-pricing.contract.test.tsx`
- `apps/web/tests/no-legacy-user-facing-package-names.contract.test.tsx`
- `apps/web/tests/runden-working-surface-copy.contract.test.ts`
- `apps/web/tests/runden-qr-participation-language.contract.test.tsx`

Ausgeführt:
- `pnpm -C apps/web exec vitest run tests/runden-page.acceptance.test.ts tests/create-entry-hierarchy.contract.test.tsx tests/create-no-chip-overload.contract.test.tsx tests/create-i18n-no-mixed-locale.contract.test.tsx tests/pricing-package-logic-aligned-with-create.contract.test.tsx tests/vormerken-package-logic-aligned-with-pricing.contract.test.tsx tests/no-legacy-user-facing-package-names.contract.test.tsx tests/runden-working-surface-copy.contract.test.ts tests/runden-qr-participation-language.contract.test.tsx`

Ergebnis: **9/9 Testdateien grün, 21/21 Tests grün**.

## OpenTasks Sync

- Neuer Slice im operativen SSOT eingetragen:
  - `PR-PRODUCT-SURFACES-HARM-01` = `done`
- Standdatum in `docs/E150/OpenTasks.md` auf `2026-04-18` aktualisiert.

## Ergebnisbild

- `/create` wirkt als klarer Arbeitsstart statt Landing-Hero.
- `/pricing` wirkt als eindeutige 3er-Paketentscheidung.
- `/vormerken` wirkt als konsistenter Folge-/Freischaltungspfad.
- `/runden` wirkt stärker als laufende Anlassraum-Arbeitsfläche.
- Die vier Kernflächen sprechen dieselbe ruhige, markante Produktlogik ohne neue Parallelwelt.
