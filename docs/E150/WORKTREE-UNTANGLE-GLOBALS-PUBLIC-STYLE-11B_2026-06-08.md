# WORKTREE-UNTANGLE-GLOBALS-PUBLIC-STYLE-11B

Datum: 2026-06-13
Geprüfter Commit-Stand: `c78cd7f9cf5d926b8a9db19532b62d2fd77ca00e` (`docs(e150): audit globals public style drift`)

## Ergebnis

Ein kleiner Commit-Scope ist möglich, ohne `apps/web/src/app/globals.css` als ganze Datei zu übernehmen.

Wichtig:

- Kein weiterer Source-Edit war nötig.
- Die Entmischung erfolgt über einen kleinen hunkgenauen Commit-Scope, nicht über Datei-Umbau.

## Sichere `globals.css`-Hunks

Als sicher und lokal genug bewertet:

1. Landing-Header-Voxy-Hunk

- `.landing-header .public-voxy-stage`
- `.landing-header .public-voxy-aura`
- `.landing-header .public-voxy-image`

Bewertung:

- rein lokale Justierung des Voxy-Auftritts im Landing-Header
- keine globale Shell-/Grid-/Hero-Änderung
- kein Einfluss auf Fachlogik

2. Desktop-Follow-up-Hunk

- `@media (min-width: 1024px) { .landing-header .public-voxy-stage { max-width: 13rem; } }`

Bewertung:

- gehört direkt zum Landing-Header-Voxy-Hunk
- kleine responsive Korrektur ohne breite Seiteneffekte

3. Öffentlicher Voxy-Hunk

- `.public-voxy-stage`

Änderung:

- `gap`
- `max-width`

Bewertung:

- lokaler öffentlicher Voxy-Rahmen
- wirkt auf bestehende Voxy-Platzierungen, aber nicht auf Shell-/Reader-/Hero-Struktur

4. Öffentlicher Voxy-Marker-Hunk

- `.public-voxy-marker`

Änderung:

- `padding`
- `border-bottom`
- `font-size`

Bewertung:

- rein lokale Marker-/Hinweis-Optik
- geringes Risiko

## Hunks, die draußen bleiben

Bewusst nicht Teil des kleinen Commit-Scope:

- `landing-canvas`
- `landing-shell`
- `landing-header` global
- `landing-hero-grid`
- `landing-section`
- `landing-hero-title`
- `landing-hero-copy`
- `landing-hero-actions`
- `landing-hero-action-row`
- alle `public-canvas`-Hunks
- alle `public-shell`-Hunks
- alle `public-reader-grid`-Hunks
- alle `public-hero-title`- und `public-section-title`-Hunks
- alle `public-action-row`-Hunks
- alle `public-color-rail`-Hunks
- alle breiten `public-start-*`-Layout-Hunks
- alle globalen Rhythmus-/Container-/Typography-Hunks bei `768px`, `1024px` und Mobile

## Weitere Entmischung nötig?

Für den kleinen Voxy-bezogenen Commit-Scope: nein.

Für den restlichen `globals.css`-Diff insgesamt: ja.

Der verbleibende Public-/Landing-/Start-Rest bleibt weiterhin gemischt und sollte erst in einem separaten, deutlich breiteren Styleslice behandelt werden.

## Tests

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/landing-clarity.contract.test.tsx tests/landing-information-architecture.contract.test.tsx tests/mobile-entry-routes.contract.test.tsx tests/voxy-guide.render.test.tsx tests/live-campaign-entry.contract.test.tsx tests/live-media-kit.contract.test.tsx`

Ergebnis:

- Typecheck: grün
- Lint: grün
- Vitest: `6` Testdateien, `19/19` Tests grün
- Hinweis: `mobile-entry-routes.contract.test.tsx` erzeugt beim `next/image`-Mock weiterhin bekannte `fill`-/`priority`-Warnings, der Lauf ist grün

## Staging-Probe

Die Hunk-Probe für einen kleinen `globals.css`-Scope war erfolgreich.

Probe-Ergebnis:

- `git diff --cached --name-status` zeigte nur `apps/web/src/app/globals.css`
- `git diff --cached --stat` zeigte nur einen kleinen Teilblock (`5` Einfügungen, `5` Löschungen)
- danach wurde der Index wieder geleert

## Nächster empfohlener Schritt

- `WORKTREE-COMMIT-GLOBALS-PUBLIC-STYLE-11B`

Geplanter Scope:

- ausschließlich die oben benannten lokalen Voxy-Hunks aus `apps/web/src/app/globals.css`
- plus `docs/E150/OpenTasks.md`
- plus `docs/E150/WORKTREE-UNTANGLE-GLOBALS-PUBLIC-STYLE-11B_2026-06-08.md`
