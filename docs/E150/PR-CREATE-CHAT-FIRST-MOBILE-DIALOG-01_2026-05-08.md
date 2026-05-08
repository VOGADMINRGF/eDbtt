# PR-CREATE-CHAT-FIRST-MOBILE-DIALOG-01

- Datum: 2026-05-08
- Status: done
- Bezug: Issue #112

## Gelesene E150-Docs

- `docs/E150/Part16_AI_Orchestration_and_Safety.md`
- `docs/E150/Part06_Themenkatalog_und_Zustaendigkeiten.md`
- `docs/E150/OpenTasks.md`

## Ergebnis

- E150 bleibt interner Kanon; es wurde keine neue AI-, Graph-, NotebookLM-, Scraping- oder Taxonomie-Logik eingefuehrt.
- Die sichtbare `/create`-Hauptcopy wurde fuer den mobilen Dialogfluss vereinfacht.
- Technische Begriffe wie `Part06`, `Dossier-Kontext`, `Anschluss`, `Claim`, `sourceHints` und `evidenceNeeds` bleiben intern, nicht im sichtbaren Hauptflow.
- `Beitragen`, `Pruefen`, `Entwerfen` und Link-/Quellenfaelle folgen nun konsistenter demselben Chat-Prinzip:
  - eDebatte ordnet den Input verstaendlich ein
  - eDebatte zeigt einen einfachen Arbeitsstand oder den naechsten Schritt
  - Nutzer koennen per Button handeln oder frei weiterschreiben
- Der Entwerfen-Modus wurde dialogischer gemacht:
  - Rueckfrage-Copy ist auf Nutzung/Zweck und naechsten Schritt ausgerichtet
  - weniger Panel-/Statussprache
- Der Link-Flow wurde als ehrlicher Quellenhinweis-Dialog geschaerft:
  - keine Behauptung automatischer Auswertung
  - Quellenhinweis-/Pruefpfad-Copy in einfacher Sprache
- Mobile Follow-up-Module wurden auf einspaltige, groessere Auswahlziele fokussiert; der naechste Schritt bleibt gut erreichbar.

## Geaenderte Kernstellen

- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/features/create/CreateLinkIntakeClarification.tsx`
- `apps/web/src/features/create/createSurfaceConfig.ts`
- `apps/web/src/features/create/linkIntake.ts`
- `apps/web/src/features/create/createConnectionSuggestions.ts`
- `apps/web/src/features/i18n/operatorSystemTexts.core.ts`

## Validierung

```bash
pnpm -C apps/web run typecheck
pnpm -C apps/web run lint
pnpm -C apps/web exec vitest run tests/create-intelligent-followup.contract.test.ts tests/analyze-workbench-hidden-until-start.test.ts tests/create-curated-dialog-workspace.contract.test.tsx tests/create-chat-first-mobile-dialog-experience.contract.test.tsx
```
