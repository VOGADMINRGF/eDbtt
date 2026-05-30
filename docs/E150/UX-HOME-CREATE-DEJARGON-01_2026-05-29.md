# UX-HOME-CREATE-DEJARGON-01

Stand: 2026-05-29

## Ziel

Startseite und `/create` wurden auf einen einfacheren Erstkontakt reduziert.
Der First Screen soll ohne technische Überladung verständlich sein.
Voxy bleibt ein ruhiger Guide und kein dominantes Maskottchen.

## Umsetzung

### Startseite

- Hero-Claim auf `Stell dein Anliegen ein. Lass das stärkste Argument gewinnen.` umgestellt.
- Subline auf einen einfachen Arbeitsraum-Fokus reduziert:
  `eDebatte macht aus Themen, Fragen und Vorschlägen einen nachvollziehbaren Arbeitsraum: mit Optionen, Quellen, offenen Fragen und Beteiligung.`
- Primäre Einstiege klar gesetzt:
  - `Anliegen einreichen` -> `/create?intent=contribute`
  - `Anlassraum anlegen` -> `/runden/new`
  - `Themen ansehen` -> `/themen`
- Trust-Pills vereinheitlicht:
  - `kostenlos mitmachen`
  - `keine Datenverkäufe`
  - `keine versteckten KI-Kosten`
  - `review-first`
- Voxy als ruhiges Key-Visual in der Hero-Nebenspalte eingebunden.
  - Variante: `podcastStage` oder `neutral` je Kontext
  - nicht fullscreen
  - auf Mobile begrenzt, damit Text und CTAs Vorrang behalten

### `/create`

- First Screen auf eine einfache Primäreingabe reduziert:
  - Überschrift `Was möchtest du einbringen?`
  - großes Eingabefeld
  - Primär-CTA `Beitrag einreichen`
- Drei optionale Folgewege direkt sichtbar gemacht:
  - `KI strukturiert meinen Text`
  - `Quelle/Datei prüfen`
  - `Zu bestehendem Anlass hinzufügen`
- Übergang aus `/runden/new` zeigt einen knappen Voxy-Hinweis:
  - `Der Rahmen steht. Ich kann jetzt Frage, Optionen oder Quellenstruktur verbessern.`
- Kein Auto-Analyze, kein Auto-Publish, kein Auto-Dossier im manuellen Weiterweg.

## De-Jargon Guardrails

- Default-UI auf Start und `/create` vermeidet nun sichtbare Developer-/Operator-Sprache.
- Entfernt oder aus dem Default-Pfad herausgenommen:
  - `Developer-Hinweis`
  - rohe Anlassraum-ID-Anzeige
  - alte Starttexte mit unnötig technischer oder interner Rahmung
- Default-Contracts prüfen explizit auf das Fehlen von Wörtern wie:
  - `Operator`
  - `Provider`
  - `Pipeline`
  - `Developer-Hinweis`

## Geänderte Kernflächen

- `apps/web/src/app/start/LandingStart.tsx`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/SharedCreateComposer.tsx`
- `apps/web/src/features/create/createSurfaceConfig.ts`
- `apps/web/src/features/quickActions/taskFirstQuickActions.ts`
- `apps/web/src/features/voxy/voxyCopy.ts`

## Testbefehle

```bash
pnpm -C apps/web typecheck
pnpm -C apps/web exec vitest run tests/start-shared-create-composer.contract.test.tsx tests/landing-clarity.contract.test.tsx tests/landing-information-architecture.contract.test.tsx tests/create-mode.page.test.ts tests/create-entry-hierarchy.contract.test.tsx tests/create-no-chip-overload.contract.test.tsx tests/create-mode-selector.contract.test.ts tests/account-organization-dashboard.page.test.tsx
```

## Ergebnisnotiz

- Typecheck: grün
- Vitest-Slice: 8 Dateien, 25 Tests, grün
- Bekannte Restwarnung: SSR-Render meldet in den Landing-Tests weiterhin die bestehende React-Warnung zu einem `jsx`-Attribut aus bereits vorhandener Markup-Ausgabe; sie blockiert den Slice nicht und wurde hier nicht erweitert.
