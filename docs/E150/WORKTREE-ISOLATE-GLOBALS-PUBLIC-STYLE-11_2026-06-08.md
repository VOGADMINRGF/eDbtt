# WORKTREE-ISOLATE-GLOBALS-PUBLIC-STYLE-11

Datum: 2026-06-13
Geprüfter Commit-Stand: `3e9abab15ac874510e6ad642032ab2caa3ac5762` (`fix(voxy): isolate public guide copy`)

## Geprüfte Datei

- `apps/web/src/app/globals.css`

## Hunkgenaue Bewertung

### A) Voxy-nahe Public-Style-Hunks

Klar Voxy-nah und grundsätzlich hunkbar:

- `.landing-header .public-voxy-stage`
- `.landing-header .public-voxy-aura`
- `.landing-header .public-voxy-image`
- `.public-voxy-stage`
- `.public-voxy-marker`
- zugehöriger Desktop-Hunk:
  - `@media (min-width: 1024px) { .landing-header .public-voxy-stage { ... } }`

Bewertung:

- Diese Hunks sind lokal genug und passen zum bereits committen Voxy-Slice.
- Sie ändern Größe, Abstand, Aura und Marker-Typografie, aber keine Produktlogik.
- Sie wirken auf bestehende öffentliche Voxy-Platzierungen.

### B) Landing-/Start-/Public-Hunks

Fachlich zum Public-/Landing-/Start-Styling gehörend, aber teils breit:

- `landing-canvas` Ergänzungen:
  - `min-height: 100svh`
  - `overscroll-behavior-y: contain`
  - Canvas-Mask-/Opacity-Anpassung
- `landing-shell`, `landing-header`, `landing-hero-grid`, `landing-section`
- `.landing-hero-title`
- `.landing-gradient-title`
- `.landing-canvas p, li`
- `.landing-eyebrow`
- `.landing-hero-copy`
- `.landing-hero-actions`
- `.landing-hero-action-row`
- `.public-start-intake-card`
- `.public-start-intake-field`
- `.public-start-trust-line`
- `.public-start-preview-card`
- `.public-start-preview-grid`
- `.public-start-example-grid`
- `.public-start-example-card`
- `.public-start-shell`
- `.public-start-hero-grid`
- `.public-start-main`, `.public-start-guide-rail`
- `.public-start-guide-surface`
- `.public-start-guide-card-grid`
- `.public-start-guide-card`
- `.public-start-support-links`
- responsive `public-start-*`-Grid-Hunks bei `768px` und `1024px`

Bewertung:

- Diese Hunks gehören klar zur öffentlichen Start-/Landing-/Live-Style-Welt.
- Ein Teil davon ist lokal genug:
  - `public-start-intake-*`
  - `public-start-preview-*`
  - `public-start-example-*`
  - `public-start-guide-*`
  - `landing-hero-action-row`
- Ein anderer Teil greift schon breiter in globale Start-/Landing-Rhythmik ein:
  - `landing-canvas`
  - `landing-shell`
  - `landing-hero-grid`
  - `landing-section`
  - `landing-hero-title`
  - `landing-hero-copy`
  - `landing-hero-actions`

### C) Live-bezogene Hunks

Nicht als explizite Live-Klassen geschrieben, aber von Live-Flächen mitgenutzt:

- `.public-start-shell`
- `.public-start-preview-grid`

Verwendung:

- `LiveCampaignEntryClient.tsx`
- `LiveHostCockpitClient.tsx`
- `LiveReportHandoffClient.tsx`
- `LiveMediaKitClient.tsx`

Bewertung:

- Diese Hunks sind live-adjacent, aber nicht live-exklusiv.
- Die ausgeführten Live-Contracts bleiben grün.
- Sie sind eher sichere Kandidaten als die breiten `public-shell`-/Hero-/Canvas-Hunks.

### D) Riskante globale Hunks

Breit und im aktuellen Zustand nicht sicher für einen kleinen Commit:

- `.public-canvas`
- `.public-shell`
- `.public-reader-grid`
- `.public-section`-Padding
- `.public-hero-title`
- `.public-section-title`
- `.public-gradient-text`
- `.public-hero-lead`
- `.public-hero-trust`
- `.public-canvas p, li`
- `.public-action-row`
- `.public-color-rail`
- mobile und desktop Overrides für:
  - `.public-shell`
  - `.public-reader-grid`
  - `.public-hero-title`
  - `.public-color-rail`

Risiko:

- Diese Klassen werden auch in `/create`, `/runden`, `/dossier` und weiteren öffentlichen Flächen genutzt.
- Sie verändern Breite, Rhythmus, Hero-Typografie und allgemeine öffentliche Layout-Logik.
- Ein kleiner Restdrift-Commit würde hier zu viel globale Stilentscheidung gleichzeitig tragen.

### E) Fremde/Misch-Hunks

Keine klar fachfremden Domänen-Hunks im Sinne von Telemetry, Factcheck oder Create-Featurelogik im Diff.

Die eigentliche Mischlage ist hier stilistisch, nicht fachlich:

- Start-/Landing-/Live-Hunks und breit globale Public-Hunks liegen dicht beieinander.
- Dadurch ist die Datei als Ganzes nicht sauber commitbar.

## Ist `globals.css` als Ganzes commitbar?

Nein.

Begründung:

- Der Diff ist zwar stilistisch überwiegend Public-/Landing-/Start-bezogen, aber nicht klein genug isoliert.
- Mehrere zentrale Hunkgruppen greifen in gemeinsame Public-Bausteine, die auch `/create`, `/runden` und `/dossier` mitverwenden.

## Sind einzelne Hunks sicher hunkbar?

Ja, technisch grundsätzlich.

Am ehesten sicher:

- `.landing-header .public-voxy-stage`
- `.landing-header .public-voxy-aura`
- `.landing-header .public-voxy-image`
- `.public-voxy-stage`
- `.public-voxy-marker`
- `.public-start-preview-grid`
- `.public-start-example-grid`
- `.public-start-guide-card-grid`
- `.public-start-guide-card`
- `.public-start-guide-surface`
- `.public-start-support-links`

## Welche Hunks sollten committed werden?

Falls ein Folgeslice gebaut wird, dann zuerst nur ein kleiner Teil:

- Voxy-nahe Landing-Header-Hunks
- `public-start-preview-*`-Grid-Hunks
- `public-start-guide-*`-Kartenhunks
- `public-voxy-stage`
- `public-voxy-marker`

## Welche Hunks sollten draußen bleiben?

- `landing-canvas`
- `landing-shell`
- `landing-header` global
- `landing-hero-grid`
- `landing-section`
- `.public-canvas`
- `.public-shell`
- `.public-reader-grid`
- `.public-hero-title`
- `.public-section-title`
- `.public-action-row`
- `.public-color-rail`
- mobile/desktop globale Rhythmus-Hunks zu `public-shell`, `public-reader-grid`, `public-hero-title`

## Commit-Empfehlung

Kein direkter Commit des aktuellen `globals.css`-Diffs als Ganzes.

Empfehlung:

- zuerst `WORKTREE-UNTANGLE-GLOBALS-PUBLIC-STYLE-11B`
- dort nur die wenigen lokalen Voxy-/Preview-/Guide-Hunks hunkgenau extrahieren

## Blockierende Hunks

Blockierend für einen direkten `COMMIT-11`-Slice sind vor allem:

- die breiten `landing-*` Container-/Rhythmus-Hunks
- die breiten `public-shell`-/`public-reader-grid`-Hunks
- die Hero-/Typography-Hunks (`public-hero-title`, `public-section-title`)
- die allgemeinen `public-action-row`-/`public-color-rail`-Hunks

## Tests

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/landing-clarity.contract.test.tsx tests/landing-information-architecture.contract.test.tsx tests/mobile-entry-routes.contract.test.tsx tests/voxy-guide.render.test.tsx tests/live-campaign-entry.contract.test.tsx tests/live-media-kit.contract.test.tsx`

Ergebnis:

- Typecheck: grün
- Lint: grün
- Vitest: `6` Testdateien, `19/19` Tests grün
- Hinweis: `mobile-entry-routes.contract.test.tsx` erzeugt beim `next/image`-Mock weiterhin bekannte `fill`-/`priority`-Warnings, der Testlauf ist grün.

## Nächster empfohlener Schritt

- `WORKTREE-UNTANGLE-GLOBALS-PUBLIC-STYLE-11B`

Ziel:

- einen kleinen, wirklich hunkbaren `globals.css`-Teilblock extrahieren, statt den gesamten Public-/Landing-Rhythmus mitzuziehen.
