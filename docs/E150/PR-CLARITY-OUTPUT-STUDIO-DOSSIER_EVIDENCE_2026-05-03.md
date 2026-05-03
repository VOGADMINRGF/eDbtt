# PR-CLARITY-OUTPUT-STUDIO-DOSSIER Evidence (2026-05-03)

Branch: `pr/clarity-output-studio-dossier-evidence`

## Scope summary

Gemeinsam finalisiert:

- PR-LANDING-CLARITY-01
- PR-CREATE-CONTEXT-01
- PR-OUTPUT-STUDIO-01
- PR-OUTPUT-STUDIO-02
- PR-OUTPUT-STUDIO-03
- PR-OUTPUT-ENGINE-02
- PR-OUT-POST-GENERATOR-01
- PR-OUT-STUDIO-CHANNELS-01
- PR-OUT-ENGINE-05
- PR-OUT-ENGINE-06
- PR-OUT-ENGINE-07
- PR-OUT-ENGINE-08
- PR-OUT-ENGINE-09
- PR-OUT-EXPORT-01
- PR-OUT-TELEMETRY-01
- PR-DOSSIER-EVIDENCE-FIRST-01 (revalidiert)

## Guardrails bestätigt

- Kein externer Social API Publish-Call.
- Kein Fake-Live-Publishing.
- Kein Auto-Publish und kein Auto-Analyse-Rückbau in `/create`.
- Keine LocalStorage-Autoaktivierung von Follow-up/Analyze-Workspace.
- Kein Beteiligungsradar-Build in diesem Slice.

## Implementierungsnachweis

### Landing/Create Clarity

- `apps/web/src/app/start/LandingStart.tsx`
  - Clarity-Block mit eDebatte/VoiceOpenGov-Rollenklärung.
  - Prozesszeile `Signal -> Dossier -> Runde -> Mandat -> Umsetzung` sichtbar.
  - Vier Einstiege sichtbar: Bürger:innen, Kommunen, Beteiligungsbüros, Journalist:innen.
  - LandingAssistant/Marquee bleiben erhalten.
- `apps/web/src/features/create/createSurfaceConfig.ts`
  - Helper-Link-Konsistenz (`Preise`).

### Output Engine Contracts + Studio

- `features/outputEngine/masterPost.ts`
  - deterministischer Master-Post mit Pflichtfeldern und Guardrails.
- `features/outputEngine/socialCarousel.ts`
  - deterministischer Slide-Canon 1-7.
- `features/outputEngine/socialDistribution.ts`
  - vollständiger Channel-Contract + ehrliche Connector-Status + Review-first Policy.
- `features/outputEngine/formatMappers.ts`
  - deterministische Mapper: article, briefing, letter, administrative_note, reel_script, voiceover_text, podcast_script.
- `features/outputEngine/distributionExport.ts`
  - manuelle Export-/Draft-/Plan-/QR-Print-Helper inkl. Validierung.
- `features/outputEngine/studioTelemetry.ts`
  - interner Telemetrie-Adapter (contract-first, ohne externe Tracker).
- `features/outputEngine/index.ts`
  - konsistente Exporte.
- `apps/web/src/app/dossier/[id]/studio/page.tsx`
  - Master-Post-first Rendering + no-live-publish Sprache.
- `apps/web/src/components/outputEngine/SocialDistributionPanel.tsx`
  - Kanalwahl, Kanalverbindungen, Verteilplan, Queue-Edit/Storno, Admin-Konfiguration, QR/Print-Vorschau.

### Dossier Evidence First

- `apps/web/src/components/dossier/DossierViewer.tsx`
  - Evidence-First-Abschnitte + Smart Source Cards sind vorhanden und testlich abgesichert.
  - Hook-Dependency-Hardening für `sourceMatrixEntries`.

### Docs

- `docs/E150/output-engine-studio.md`
  - erweitert um Export-Helpers, Admin/Queue/Review-Routing und internen Telemetrie-Stub.
- `docs/E150/OpenTasks.md`
  - oben genannte Slices auf `done` gesetzt, Next-codex-ready-Liste bereinigt.

## Test-/Check-Protokoll

Ausgeführt:

```bash
pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
cd apps/web && pnpm exec vitest run tests/create-*.test.ts tests/landing-clarity.contract.test.tsx
cd apps/web && rg --files tests | rg '^(tests/(output-engine-|dossier-|studio-|telemetry-).*)$' | xargs pnpm exec vitest run
```

Ergebnis:

- Typecheck: grün.
- Lint: grün mit 1 Warning (`react-hooks/exhaustive-deps` in `DossierViewer.tsx`, nicht blockierend).
- Create/Landing: 40 Testdateien, 189 Tests grün.
- Output/Dossier/Studio/Telemetry: 13 Testdateien, 46 Tests grün.

Hinweis zur Runner-Invocation:

- Die vorgegebenen Vitest-Glob-Aufrufe mit `"tests/create-*.test.ts"` bzw. kombinierten String-Filtern lieferten lokal "No test files found".
- Deshalb wurden die gleichen Suiten über shell-glob (`create-*`) bzw. explizite Dateiliste via `rg | xargs` ausgeführt.
