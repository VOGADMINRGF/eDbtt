# UX-THEME-VOXY-POLISH-LOCK-01

Datum: 2026-05-29
Status: done

## Ziel

Der bestehende funktionsfähige UX-Stand wurde visuell abgeschlossen, ohne neue Produktlogik einzuführen.
Der Slice schließt vor allem Light/Dark-Brüche, ordnet Surface-Hierarchien klarer und macht Voxy auf den zentralen Einstiegsscreens als seriösen Guide sichtbarer.

## Angepasste Seiten

- `apps/web/src/app/start/LandingStart.tsx`
- `apps/web/src/app/runden/page.tsx`
- `apps/web/src/app/runden/new/page.tsx`
- `apps/web/src/app/runden/new/AnlassraumSetupForm.tsx`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/SharedCreateComposer.tsx`
- `apps/web/src/components/voxy/VoxyGuide.tsx`
- `apps/web/src/app/(components)/SiteHeader.tsx`
- `apps/web/src/app/globals.css`

## Zentrale Surface-/Theme-Regeln

Neue bzw. gebündelte semantische Klassen in `globals.css`:

- `vog-page-stage`
  - ruhiger tokenbasierter Seitenhintergrund mit leichter Brand-Tönung
- `vog-main-shell`
  - einheitliche Hauptbreite und Page-Padding für die betroffenen Screens
- `vog-surface-elevated`
  - primäre Card/Shell
- `vog-surface-muted`
  - nachgeordnete, ruhigere Erklärungskarten
- `vog-surface-brand`
  - gezielte Brand-Tönung für Hero-/Einstiegsflächen
- `vog-btn-brand`
  - Primär-CTA
- `vog-btn-secondary`
  - Sekundär-CTA
- `vog-voxy-panel`
  - wiederverwendbare Panel-Haut für `VoxyGuide`
- `vog-focus-stage`
  - bewusst dunkler Focus-Panel für `/create`

Verwendete Grundtokens:

- `rgb(var(--bg))`
- `rgb(var(--card))`
- `rgb(var(--fg))`
- `rgb(var(--muted))`
- `rgb(var(--border))`

## Voxy-Einsatzmatrix

- `/start`
  - `VoxyGuide appearance="hero"`
  - `variant="podcastStage"` oder ruhige Guide-Variante
  - sichtbar groß auf Desktop, reduziert auf Mobile
- `/runden`
  - `VoxyGuide appearance="panel"`
  - `variant="presenting"`
  - Copy: `Du entscheidest zuerst den Rahmen. Alles Weitere bleibt optional.`
- `/runden/new` Einstieg
  - `VoxyGuide appearance="panel"`
  - Copy: `Noch keine perfekte Formulierung nötig. Lege erst den Rahmen fest.`
- `/runden/new` Desktop je Schritt
  - rechte Sticky-Guide-Spalte als `panel`
- `/runden/new` Mobile je Schritt
  - kompakte Top-Card als `compact`
- Schritt `Rahmen`
  - `welcome`
  - `Noch keine perfekte Formulierung nötig. Lege erst den Rahmen fest.`
- Schritt `Optionen`
  - `presenting`
  - `Feste Optionen geben Kontrolle. Community-Vorschläge machen den Raum offener.`
- Schritt `Sichtbarkeit`
  - `hint`
  - `Öffentlich heißt nicht automatisch geprüft. Du bestimmst, wann sichtbar wird.`
- Schritt `Unterstützung & Start`
  - `thinking` oder `check`
  - `KI bleibt optional. Nichts wird automatisch veröffentlicht.`
- `/create` nach `/runden/new`
  - `VoxyGuide appearance="panel"`
  - `Der Rahmen steht. Ich kann jetzt Frage, Optionen oder Quellenstruktur verbessern.`

Warum Voxy Guide bleibt:

- Voxy erklärt den nächsten sinnvollen Schritt.
- Voxy ersetzt keine Pflichtinformation.
- Voxy löst keine Aktion automatisch aus.
- Voxy ist sichtbar, aber nie dominanter als Überschrift, Formular oder Primär-CTA.

## Dark/Light-Regeln

- Keine zentrale Rohfläche mit `bg-white`, `text-black` oder `bg-slate-950` für die polierten Einstiegsscreens.
- Keine Dark-only Standard-Card auf heller Seite.
- Brand-Verläufe nur gezielt für Primär-CTAs, Hero-Tönungen und kleine Akzente.
- `VoxyGuide` nutzt tokenisierte Panels und einen weicheren Bildwrapper statt harter weißer Bildbox.
- `/create` darf bewusst einen dunklen Composer-Focus-Panel behalten, aber nur innerhalb einer hellen, tokenisierten Stage.

## Vermiedene Klassen/Patterns

In den nachgeschärften Komponenten bewusst vermieden:

- `bg-slate-950` als Standard-Seiten- oder Hauptkartenfläche
- `bg-white` als zentrale Rohfläche
- `text-black` auf tokenisierten Cards
- `Developer-Hinweis` in der Default-UI
- neue Dev-/Systemsprache wie `Entitlement`, `Operator`, `Pipeline`, `Provider`, `RunReceipt`, `Anlassraum-ID`

## Testbefehle

```bash
pnpm -C apps/web exec vitest run tests/voxy-copy.contract.test.ts tests/voxy-guide.render.test.tsx tests/landing-clarity.contract.test.tsx tests/landing-information-architecture.contract.test.tsx tests/start-shared-create-composer.contract.test.tsx tests/runden-page.acceptance.test.ts tests/runden-manual-create.page.contract.test.tsx tests/create-mode.page.test.ts
pnpm -C apps/web typecheck
```

## Ergebnisnotiz

- `vitest`: 8 Dateien, 29 Tests, grün
- `typecheck`: erfolgreich
- Bestehende React-Warnung zu einem `jsx`-Attribut in Landing-SSR-Tests bleibt sichtbar und war in diesem Slice nicht neu eingeführt
