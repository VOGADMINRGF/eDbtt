# PR-AI-CREATE-01I — Link Intake Clarification

Datum: 2026-05-08
Status: done

## Ziel

Issue #98 Slice C fuehrt in `/create` eine ehrliche Link-Klaerung vor der Normalanalyse ein, wenn Eingaben fast nur aus Link/URL bestehen. Der Slice durfte laut Issue-Ergaenzung keine parallele Source-/Factcheck-/Analyze-Struktur aufbauen.

## Repo-/Docs-Abgleich

Gefundene vorhandene Module/Docs:

- `apps/web/src/features/create/intents.ts`
  - bestehende Begriffe und Handoffs fuer `source`, `factcheck`, `sourceUrl`, `sourceLabel`
- `apps/web/src/features/create/createSurfaceConfig.ts`
  - bestehende `/create`-Sprache fuer `Quelle`, `Link`, `Dossier`, `Prüfen`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
  - bestehende Claims-/Dossier-/Faktencheck-Folgeoberflaeche
- `apps/web/src/app/api/create/{analyze,save,finalize}/route.ts`
  - bestehende kanonische Wrapper-Pfade fuer Analyze/Save/Finalize
- `docs/E150/GOV-AI-06_LANGUAGE_CORE_CROSS_LINGUAL_INVENTORY_2026-04-05.md`
  - vorhandene Dossier-/Source-/Factcheck-nahe Pfade inkl. `sealed_factcheck` und Dossier-Sources
- `apps/web/src/components/analyze/AnalyzePanel.tsx`
  - bestehende `sources`-/`claims`-Begriffe im Analyseumfeld
- `apps/web/src/features/ai/providerRoleRouting.ts`
  - vorhandener `sealed_factcheck`-Lane-Contract

Was wiederverwendet wurde:

- bestehende `/create`-Sprache fuer `Quelle`, `Claims`, `Faktencheck`, `Dossier`
- bestehende Analyze-/Save-/Finalize-Wrapper statt neuer Backendroute
- bestehende Follow-up-/Factcheck-Guardrails statt neuer Research-/Extraction-Policy

Was bewusst nicht neu gebaut wurde:

- kein Scraping
- keine Link- oder YouTube-Extraktionspipeline
- kein neues Source-Aggregat
- keine neue Factcheck-Route
- kein paralleler Analyze-Contract fuer URL-only Inputs

Warum keine Doppelstruktur entsteht:

- die neue Logik sitzt ausschliesslich vor dem bestehenden `/create`-Start als UI-Gate
- bei Link + laengerem Kontext bleibt der normale vorhandene Follow-up-Pfad aktiv
- optionales Link-Meta wird nur additiv an den bestehenden Save-Payload angehaengt

## Umsetzung

- neuer deterministischer Helper `apps/web/src/features/create/linkIntake.ts`
  - erkennt `hasLink`, `linkKind`, `primaryUrl`, `linkOnly`, `mostlyLinkOnly`
  - erzeugt nur lokales Meta und ehrliche Quellenhinweise
- neue UI-Komponente `apps/web/src/features/create/CreateLinkIntakeClarification.tsx`
  - fragt: `Ich habe einen Link erkannt. Was soll damit passieren?`
  - zeigt vorhandene Produktbegriffe fuer Zusammenfassung, Claims, Faktencheck, Dossier-Quelle und Abstimmungsfragen
  - behauptet keine automatische Auswertung
- `apps/web/src/app/create/CreateClient.tsx`
  - schaltet bei `mostlyLinkOnly` in den Klaerungsdialog statt direkt in den normalen Follow-up
  - laesst Link + laengeren Eigenkontext normal weiterlaufen, aber mit Quellenhinweis
  - haengt optionales Link-Meta nur an den vorhandenen Save-Payload

## Tests

- `pnpm -C apps/web exec vitest run tests/create-link-intake-clarification.contract.test.tsx tests/analyze-workbench-hidden-until-start.test.ts tests/create-curated-dialog-workspace.contract.test.tsx`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`

## Geaenderte Dateien

- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/src/features/create/CreateLinkIntakeClarification.tsx`
- `apps/web/src/features/create/linkIntake.ts`
- `apps/web/tests/create-link-intake-clarification.contract.test.tsx`
- `apps/web/tests/analyze-workbench-hidden-until-start.test.ts`
- `apps/web/tests/create-curated-dialog-workspace.contract.test.tsx`
- `docs/E150/OpenTasks.md`
