# UX-VISUAL-SYSTEM-LOCK-01

Stand: 2026-05-29
Status: done

## Ausgangsproblem aus Screenshot-QA

- `/runden` wirkte im First Screen wie eine gestapelte Modulliste statt wie ein klarer Produktstart.
- Die Hintergrundatmosphäre auf der Startseite konkurrierte noch zu stark mit Claim, CTA und Hero.
- Voxy war auf zentralen Einstiegsflächen zu klein und eher Avatar als Guide.
- Light/Dark zeigte auf `/create` und Teilen von `/runden/new` noch zu harte Stage-Brüche.
- Header und Branding wirkten im Desktop-Modus noch zu zurückhaltend.

## Angepasste Seiten

- `/start`
- `/runden`
- `/runden/new`
- `/create`
- `SiteHeader`
- `VoxyGuide`

## Voxy-Einsatzmatrix

- `/start`
  - `appearance="hero"`
  - Variante `podcastStage` oder `presenting`
  - Rolle: ruhiger Marken- und Produkteinstieg
- `/runden`
  - `appearance="hero"`
  - Variante `presenting`
  - Rolle: sichtbarer Guide im Produkt-Hero, nicht nur Inline-Hinweis
- `/runden/new`
  - Intro: `appearance="panel"` mit `welcome`
  - Desktop je Schritt: rechte sticky Guide-Spalte mit `panel`
  - Mobile je Schritt: kompakte Top-Card mit `compact`
- `/create` aus `/runden/new`
  - `appearance="panel"`
  - Rolle: Übergangs-Guide ohne Pflichtgefühl, ohne Auto-Analyse

Voxy bleibt Guide und Orientierungsfigur. Er erklärt nächste Schritte, Sichtbarkeit und optionale KI. Er ist nicht Deko und trägt keine alleinige Information.

## Light/Dark-Regeln

- Betroffene Flächen nutzen tokenisierte Farben über `rgb(var(--bg))`, `rgb(var(--card))`, `rgb(var(--fg))`, `rgb(var(--muted))`, `rgb(var(--border))`.
- `vog-page-stage`, `vog-main-shell`, `vog-surface-elevated`, `vog-surface-muted`, `vog-voxy-panel`, `vog-focus-stage`, `vog-btn-brand` und `vog-btn-secondary` bleiben die zentralen Surface-/CTA-Bausteine.
- Startseiten-Hintergrundkarten laufen nur noch passiv über `vog-stage-backdrop` und konkurrieren nicht mehr mit dem Hauptinhalt.
- `/create` behält den dunklen Focus-Panel bewusst als Ausnahme, aber nur innerhalb einer hochwertigen tokenisierten Stage.

## Vermiedene Klassen und Patterns

- Keine zentrale Page-Fläche mit `bg-white`
- Kein `text-black` auf tokenisierten Cards
- Kein `bg-slate-950` als Standard-Card
- Kein unkommentiertes `text-white` in den angepassten Visual-Lock-Komponenten
- Keine harten Dark-only Cards auf heller Rohfläche
- Keine lauten, scharf lesbaren Hintergrundkarten hinter Hero-Inhalten

## Screenshot-QA-Checkliste

- `/start` light desktop
- `/start` dark desktop
- `/create` light desktop
- `/create` dark desktop
- `/runden` light desktop
- `/runden` dark desktop
- `/runden/new` light desktop
- `/runden/new` dark desktop
- mobile `390px` für alle vier Seiten

## Testbefehle

```bash
pnpm -C apps/web exec vitest run tests/voxy-copy.contract.test.ts tests/voxy-guide.render.test.tsx tests/landing-clarity.contract.test.tsx tests/landing-information-architecture.contract.test.tsx tests/runden-page.acceptance.test.ts tests/runden-manual-create.page.contract.test.tsx tests/create-mode.page.test.ts tests/visual-system-lock.contract.test.ts
pnpm -C apps/web typecheck
```

## Ergebnis

- `vitest`: 8 Dateien, 28 Tests, grün
- `typecheck`: grün

## Bekannte Restpunkte

- In den Landing-SSR-Tests bleibt die bestehende React-Warnung zu `jsx` sichtbar; sie stammt nicht aus diesem Slice.
- `/create` enthält intern weiter technische Bezeichner im Code, die aber im Default-UI nicht sichtbar sind.
- Weitere, unverbundene Worktree-Änderungen wurden bewusst nicht berührt.
