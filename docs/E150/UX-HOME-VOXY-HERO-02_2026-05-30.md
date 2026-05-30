# UX-HOME-VOXY-HERO-02

Stand: 2026-05-30
Status: done

## Ziel

Die öffentliche Start-/Landing-Erfahrung sollte nicht mehr wie ein Stapel einzelner Boxen und Formular-Cards wirken, sondern wie eine zusammenhängende Produktseite mit ruhigem Flow, konsistentem Light/Dark und klarer VOXY-Rolle.

## UI-Audit vor Umsetzung

### Harte Farben vor der Nachschärfung

- `apps/web/src/components/quickActions/TaskFirstQuickActionCenter.tsx`
  - nutzte harte `slate`-, `sky`- und `cyan`-Klassen für Dark/Light-Zweige
- `apps/web/src/components/landing/ExampleSnippetCard.tsx`
  - nutzte harte Topic-Tone-Klassen mit `dark:`-Varianten und direkte Shadow-Werte
- `apps/web/src/components/landing/ExamplesMarqueeRows.tsx`
  - nutzte feste Opacity-/Gradient-Kombinationen für einen aktiven Backdrop

### Card-/Box-Stacking vor der Nachschärfung

- `apps/web/src/app/start/LandingStart.tsx`
  - viele aufeinanderfolgende `vog-surface-elevated`-Sektionen
  - mehrere interne Grid-Cards pro Abschnitt
  - separater Quick-Action-Block statt eingebettetem Einstieg
- `TaskFirstQuickActionCenter`
  - primäre, sekundäre und Overflow-Actions alle als eigene Karten

### Light/Dark-Brüche vor der Nachschärfung

- `TaskFirstQuickActionCenter`
  - Dark-Zweig wirkte wie eigenständiger Slate-Block
- `LandingStart`
  - öffentliche Flow-Sektionen waren semantisch zu ähnlich zu Arbeitsflächen
  - Startseite nutzte Demo-/Seed-nahe Backdrop-Logik, die nicht zu einer ruhigen Produktseite passte

### VOXY vor der Nachschärfung

- Hero rechts vorhanden, aber die restliche Seite band VOXY noch nicht klar als Orientierungshilfe ein
- keine klare Trennung zwischen Hero-VOXY, Einstiegshilfe und Prüf-Hinweis

## Umsetzung

### Design-System / Surfaces

Ergänzt oder konsequenter genutzt:

- `vog-surface-soft`
- `vog-text-primary`
- `vog-text-secondary`
- `vog-border-subtle`
- `vog-accent-soft`
- `vog-focus-ring`
- `vog-landing-band`
- `vog-landing-band--accent`
- `vog-landing-band--calm`
- `vog-landing-composer`
- `vog-landing-top-glow`
- `vog-flow-line`

Alle betroffenen Landing-Flächen arbeiten jetzt auf Basis vorhandener Theme-Tokens statt harter Light/Dark-Zweige.

### Produktive Landing-Route bereinigt

- `apps/web/src/app/start/page.tsx`
  - entfernt produktive Demo-/Seed-Interaktion
  - entfernt `selectExamples`- und `seedKey`-Pfad aus der produktiven Start-Route
- `LandingStart`
  - nutzt keinen Demo-Link und keine lokale Persistenzlogik
  - Einstieg bleibt auf reale Produktpfade begrenzt

### Neuer Landing-Flow

- Hero als große Bühne mit bestehender Produktbotschaft
- großzügiger Einstieg `Öffne einen Dialog, statt ein Formular auszufüllen`
- drei klare Startpfade:
  - `Anliegen schildern`
  - `Anlassraum anlegen`
  - `Thema ansehen`
- Themen-/Druckpunkt-Zone als ruhiges Signalband statt Kartenwand
- Beteiligungslogik als Prozessfolge statt sechs Kästchen
- Swipe-Vorschau als leichter Preview-Block
- Anlassraum als zusammenhängender Arbeitsraum mit Tabs/Pills
- Faktencheck als ruhiger Prüfbereich mit Claim-/Quelle-/Gegenposition-/Frage-Logik

## VOXY-Einsatz nach Umsetzung

- Hero rechts als sichtbarer, seriöser Guide
- Einstieg mit gezieltem VOXY-Panel
- Faktencheck mit kleinem Prüf-VOXY
- nicht inflationär, sondern an drei relevanten Orientierungspunkten

## Testbefehle

```bash
pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
pnpm -C apps/web exec vitest run tests/landing-clarity.contract.test.tsx tests/landing-information-architecture.contract.test.tsx tests/start-shared-create-composer.contract.test.tsx tests/start-privacy-gate-links.contract.test.ts tests/voxy-guide.render.test.tsx
```

## Ergebnisse

- `typecheck`: grün
- `lint`: grün
- `vitest`: 5 Dateien, 11 Tests, grün

## Bekannte Restpunkte

- `ExampleSnippetCard` und `ExamplesMarqueeRows` sind noch vorhanden, aber nicht mehr Teil der produktiven öffentlichen Landing-Route. Ihre frühere Hard-Color-Struktur ist damit aus dem produktiven Startpfad entfernt, aber noch nicht als allgemeiner Altlasten-Cleanup gelöscht.
- Es gibt keinen Screenshot-/Playwright-Flow speziell für diese Landing-Slice; abgesichert wurde über DOM-/Contract-Tests und Source-Guards.
- Weitere unverbundene Worktree-Änderungen wurden nicht angefasst.
