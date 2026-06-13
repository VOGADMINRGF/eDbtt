# WORKTREE-ISOLATE-VOXY-PUBLIC-STYLE-10

Datum: 2026-06-13
Geprüfter Commit-Stand: `f41d997225a1b7e56b748826570ebe5b236f70f0` (`fix(ai): isolate orchestrator telemetry diagnostics`)

## Geprüfte Dateien

- `apps/web/src/app/globals.css`
- `apps/web/src/components/voxy/VoxyGuide.tsx`
- `apps/web/src/features/voxy/voxyCopy.ts`
- `apps/web/tests/voxy-copy.contract.test.ts`

Zusätzlich als bestehende Guards geprüft:

- `apps/web/tests/voxy-guide.render.test.tsx`
- `apps/web/tests/landing-clarity.contract.test.tsx`
- `apps/web/tests/landing-information-architecture.contract.test.tsx`
- `apps/web/tests/mobile-entry-routes.contract.test.tsx`

## Cluster-Bewertung

### `apps/web/src/components/voxy/VoxyGuide.tsx`

- Gehört eindeutig zu Voxy/Public-Style: ja
- Wert: hoch
- Debug-/Scratch-Drift: nein
- Isoliert commitbar: ja
- Guardrail-/UX-Risiko: niedrig
- Bewertung:
  - Avatarbreiten und Hero-/Panel-Höhen werden zurückgenommen.
  - Marker-Typografie wird ruhiger und weniger schildartig.
  - Keine neue Produktlogik, keine neue Asset-Pipeline, keine neue Animation.
  - Wirkung beschränkt sich auf bestehende Voxy-Einbettungen.

### `apps/web/src/features/voxy/voxyCopy.ts`

- Gehört eindeutig zu Voxy/Public-Style: ja
- Wert: hoch
- Debug-/Scratch-Drift: nein
- Isoliert commitbar: ja
- Guardrail-/UX-Risiko: niedrig
- Bewertung:
  - Copy wird konservativer und konkreter: mehr Einordnung vor Bestätigung, keine impliziten Automatismen.
  - `manualSupport`, `completion` und `createContinue` bleiben guardrail-konform und versprechen keine automatische Prüfung oder Veröffentlichung.
  - Inhaltlich konsistent mit `rundenVoxyCopy.ts`; kein Anlass, weitere Dateien mitzuziehen.

### `apps/web/tests/voxy-copy.contract.test.ts`

- Gehört eindeutig zu Voxy/Public-Style: ja
- Wert: hoch
- Debug-/Scratch-Drift: ja, vor Bereinigung
- Isoliert commitbar: ja
- Bewertung:
  - Der Test war gegenüber `voxyCopy.ts` auf mehrere fremde, nicht im Arbeitsstand vorhandene Formulierungen gedriftet.
  - Nach Bereinigung prüft er wieder den tatsächlichen Copy-Vertrag statt hypothetischer Folgecopy.

### `apps/web/src/app/globals.css`

- Gehört eindeutig zu Voxy/Public-Style: nur teilweise
- Wert: gemischt
- Debug-/Scratch-Drift: nein, aber stark vermischt
- Isoliert commitbar: als Gesamtdatei nein
- Guardrail-/UX-Risiko: mittel bis hoch
- Beeinflusst Live-/Start-/Create-Flächen unerwartet: ja, potenziell

## `globals.css` hunkgenaue Bewertung

### Eindeutig nicht Voxy-lokal

Diese Hunks greifen breiter in Landing-/Public-/Start-Layout ein und bleiben draußen:

- `landing-canvas` / `landing-shell` / `landing-section` / `landing-hero-grid`
- neue `public-start-*` Layout- und Card-Klassen
- `public-canvas`, `public-shell`, `public-reader-grid`, `public-hero-title`, `public-section-title`, `public-action-row`, `public-color-rail`
- globale Responsive-Anpassungen für `public-shell`, `public-hero-grid`, `public-reader-grid`, `public-start-hero-grid`

Begründung:

- Diese Hunks ändern globale Abstände, Breiten, Typografie und Start-/Landing-Struktur.
- Sie betreffen nicht nur Voxy, sondern komplette öffentliche Flächen.
- Ein isolierter Voxy-Commit würde hier unnötig fremde Public-/Landing-Styling-Entscheidungen mitziehen.

### Voxy-nahe, aber im globalen File vermischt

Es gibt einige Selektoren mit unmittelbarem Voxy-Bezug:

- `.landing-header .public-voxy-stage`
- `.landing-header .public-voxy-aura`
- `.landing-header .public-voxy-image`
- `.public-voxy-stage`
- `.public-voxy-marker`

Bewertung:

- Diese Hunks sind fachlich Voxy-nah.
- Sie liegen jedoch in denselben Diff-Regionen wie breitere Landing-/Public-Layout-Anpassungen.
- Ein hunkgenauer Commit wäre technisch möglich, aber für diesen Slice nicht nötig und im aktuellen Zustand zu fehleranfällig.

Fazit zu `globals.css`:

- `globals.css` wurde nur bewertet, nicht verändert.
- Die Datei ist im aktuellen Diff nicht sicher als Gesamtdatei commitbar.
- Der Voxy/Public-Style-Cluster bleibt dennoch ohne `globals.css` isoliert commitbar.

## Welche Änderungen eindeutig zum Cluster gehören

- `apps/web/src/components/voxy/VoxyGuide.tsx`
- `apps/web/src/features/voxy/voxyCopy.ts`
- `apps/web/tests/voxy-copy.contract.test.ts`
- `docs/E150/OpenTasks.md`
- `docs/E150/WORKTREE-ISOLATE-VOXY-PUBLIC-STYLE-10_2026-06-08.md`

## Welche Dateien bewusst draußen bleiben

- `apps/web/src/app/globals.css`
- alle Create-/Planner-/Followup-Dateien
- alle Telemetry-/Orchestrator-Dateien
- alle Factcheck-/Account-Dateien
- alle Multibranch-/Place-/Street-Dateien
- alle Live-Dateien
- untracked Create-/Factcheck-/Recovery-/Truth-Guard-Dokumente

## Tests

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/voxy-copy.contract.test.ts tests/voxy-guide.render.test.tsx tests/landing-clarity.contract.test.tsx tests/landing-information-architecture.contract.test.tsx tests/mobile-entry-routes.contract.test.tsx`

Ergebnis:

- Typecheck: grün
- Lint: grün
- Vitest: `5` Testdateien, `14/14` Tests grün
- Hinweis: `mobile-entry-routes.contract.test.tsx` erzeugt beim `next/image`-Mock bekannte `fill`-/`priority`-Warnings, der Testlauf ist dennoch grün.

## Commitbarkeit

Bewertung: commitbar, aber ohne `globals.css`

Commitbarer Scope:

- `apps/web/src/components/voxy/VoxyGuide.tsx`
- `apps/web/src/features/voxy/voxyCopy.ts`
- `apps/web/tests/voxy-copy.contract.test.ts`
- `docs/E150/OpenTasks.md`
- `docs/E150/WORKTREE-ISOLATE-VOXY-PUBLIC-STYLE-10_2026-06-08.md`

Nicht commitbar in diesem Slice:

- `apps/web/src/app/globals.css` als Gesamtdatei

## Nächster empfohlener Schritt

- `WORKTREE-COMMIT-VOXY-PUBLIC-STYLE-10`

Falls später doch globale Public-/Landing-Styles aus `globals.css` isoliert werden sollen, braucht es einen separaten Entmischungsslice jenseits des reinen Voxy-Scopes.
