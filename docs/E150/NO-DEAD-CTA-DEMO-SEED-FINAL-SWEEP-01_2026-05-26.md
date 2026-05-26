# NO-DEAD-CTA-DEMO-SEED-FINAL-SWEEP-01

Stand: 2026-05-26

## Ziel

Nach `production_ready-v1` und der GitHub-Hygiene sollte der letzte produktive UI-Sweep sicherstellen:

- keine toten CTAs auf produktiven V1-Flächen
- keine stillen Demo-/Dummy-/Seed-Fallbacks in produktiven Public-Routen
- keine alten Stream-/`/beitrag/*`-Pfadannahmen in wiederverwendbaren UI-Komponenten

Kein neuer Feature-Slice, keine neue Produktwelt, kein Live-Streaming-Ausbau.

## Geprüfter Scope

- `git status --short`
- `git fetch origin`
- `git log --oneline --decorate --graph --max-count=12 --all`
- gezielte Suche nach:
  - `href="#"`
  - `dummy1.jpg`
  - `/dummy/`
  - `demoFallback`
  - `seedFallback`
  - `Demo`
  - `demnächst verfügbar`
- Fokus-Dateien:
  - `features/stream/components/StreamCard.tsx`
  - `features/report/components/LeftSidebar.tsx`
  - `apps/web/src/app/stream/**`
  - `apps/web/src/app/start/**`
  - `apps/web/src/app/runden/**`
  - `apps/web/src/app/dossier/**`
  - `apps/web/src/app/swipes/**`

## Befund vor Änderung

### Echte Problemstellen

1. `features/report/components/LeftSidebar.tsx`
   - enthielt einen produktiv gerenderten Platzhalter-Link `href="#"` für `Alle Reports`

2. `features/stream/components/StreamCard.tsx`
   - enthielt ein mobiles `href="#"` für die Vorschau-Aktion
   - nutzte alte `/beitrag/${id}`-Pfade
   - nutzte Dummy-Bildpfade (`/dummy/dummy1.jpg`, `/dummy/${image}`)
   - verwendete alte, produktiv missverständliche CTA-/Fallback-Sprache (`Zum Beitrag`, `Demnächst verfügbar`, `Zuschauer verborgen`)

### Geprüfte, aber nicht als Bug gewertete Stellen

- `apps/web/src/app/dossier/[id]/ui.tsx`
  - importiert `demoFallback`, aber nur für explizite Demo-IDs
  - produktive Dossierpfade zeigen bei Review-only, Not Found oder Load Failure explizit **keinen** Demo-Ersatz
- `apps/web/src/app/dossier/demo/ui.tsx`
  - expliziter Demo-Pfad, deshalb erlaubt
- `features/report/data/*`
  - Demo-/Dummy-Daten liegen in klar als Demo markierten Datenquellen, nicht im zentralen V1-Public-Funnel

## Umsetzung

### 1. Dead CTA entfernt

`features/report/components/LeftSidebar.tsx`

- `href="#"` ersetzt
- `Alle Reports` verweist jetzt ehrlich auf `/report`

### 2. Legacy-StreamCard an V1 ausgerichtet

`features/stream/components/StreamCard.tsx`

- mobiles `href="#"` durch echtes `button`-Verhalten ersetzt
- alter `/beitrag/${id}`-Pfad durch `/stream/${id}` ersetzt
- CTA von `Zum Beitrag` auf `Zum Event-Kontext` umgestellt
- deaktivierter Zustand jetzt mit ehrlicher Copy:
  - `Event-Kontext noch nicht freigegeben`
- Dummy-Bild-Fallback entfernt
  - statt `/dummy/*` jetzt nur echte absolute/interne Bildpfade
  - ohne Bild rendert ein ehrlicher neutraler Placeholder
- Zuschauer-/Live-Missverständnis reduziert:
  - `Zuschauer verborgen` -> `Teilnahmezahlen nicht öffentlich`
- Vorschau-/Trailer-CTA sprachlich entschärft:
  - `Zum Stream` / `Stream vormerken` -> `Event öffnen` / `Vorschau öffnen`

Hinweis:
`StreamCard.tsx` ist im aktuellen V1-Stream-Pfad nicht die primäre gerenderte Karte; der produktive Pfad nutzt `DefaultStreamCard` in `features/stream/components/StreamList.tsx`. Die Komponente wurde trotzdem gehärtet, weil sie exportiert ist und sonst alte Produktannahmen wieder in Flächen zurücktragen könnte.

## Tests

### Erweitert

`apps/web/tests/live-click-hardening.contract.test.ts`

- prüft jetzt zusätzlich:
  - keine `href="#"`-Links in `StreamCard.tsx` und `LeftSidebar.tsx`
  - keine `/beitrag/`-Altpfade in `StreamCard.tsx`
  - keine `/dummy/`-/`dummy1.jpg`-Fallbacks in `StreamCard.tsx`
  - ehrlicher `/stream/`-Pfad und `/report`-Link vorhanden

### Neu

`apps/web/tests/no-dead-cta-production-sweep.contract.test.ts`

- scannt zentrale V1-Public-Surfaces auf `href="#"`
- friert die Legacy-Härtung von `StreamCard.tsx` und `LeftSidebar.tsx` zusätzlich ein

## Geänderte Dateien

- `features/report/components/LeftSidebar.tsx`
- `features/stream/components/StreamCard.tsx`
- `apps/web/tests/live-click-hardening.contract.test.ts`
- `apps/web/tests/no-dead-cta-production-sweep.contract.test.ts`
- `docs/E150/OpenTasks.md`
- `docs/E150/NO-DEAD-CTA-DEMO-SEED-FINAL-SWEEP-01_2026-05-26.md`

## Ausgeführte Commands

```bash
git status --short
git fetch origin
git log --oneline --decorate --graph --max-count=12 --all
pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
pnpm -C apps/web exec vitest run tests/live-click-hardening.contract.test.ts tests/stream-public-runtime.contract.test.tsx
pnpm -C apps/web exec vitest run tests/no-dead-cta-production-sweep.contract.test.ts
pnpm run release:validate:production
```

## Ergebnis

Der produktive V1-Funnel enthält im geprüften Scope keine absichtslosen `href="#"`-Sackgassen mehr. Alte Stream-/Beitragspfade und Dummy-Bild-Fallbacks sind aus der exportierten Legacy-StreamCard entfernt. Explizite Demo-Pfade bleiben nur dort erhalten, wo sie als Demo markiert und produktiv sauber abgegrenzt sind.
