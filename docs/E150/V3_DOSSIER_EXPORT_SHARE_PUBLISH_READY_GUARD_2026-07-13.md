# V3 Dossier Export Share Publish Ready Guard 2026-07-13

## Scope

- `V3-DOSSIER-EXPORT-SHARE-PUBLISH-READY-GUARD-01`
- Cluster: Dossier / Export / Share / Publish-ready / Review-first Guardrails

## Umsetzung

- Eine gemeinsame Export-/Share-/Freigabe-Wahrheit wurde unter `apps/web/src/features/review/dossierExportShareTruth.ts` eingeführt.
- Öffentliche Exportzugriffe laufen jetzt über `apps/web/src/features/dossier/publicExportAccess.ts`, damit Review-only-Dossiers nicht mehr wie veröffentlichte Exporte behandelt werden.
- Die aktiven Export-Routen `/api/dossier/[id]/export`, `/api/dossiers/[dossierId]/export.json` und `/api/dossiers/[dossierId]/export.csv` blocken öffentliche Exporte für nicht veröffentlichte Dossiers mit `dossier_review_only`, lassen aber den bestehenden Admin-Override-Pfad unangetastet.
- `/dossier/[id]/studio`, `ExportPanel`, `OutputSocialWorkbenchPanel`, `SocialDistributionPanel`, `/admin/review`, `/admin/editorial/queue`-nahe Bausteine und die Public-Dossier-Notizen nutzen jetzt dieselbe Review-/Export-/Publish-Semantik statt lokaler Duplikate.

## Geprüfte aktive Surfaces

- `/dossier/[id]/studio`
  Zeigt jetzt dieselbe Export-/Share-Stufe wie die angrenzenden Admin- und Output-Flächen und erklärt sichtbar, dass `review_ready`, `approved_for_export`, `publish_ready` und `published` verschiedene Zustände sind.
- `/admin/review`
  Nutzt die gemeinsamen Veröffentlichungs- und Share-Hinweise statt einer eigenen Freigabe-/Publish-Lesart.
- `/admin/editorial/queue`
  Bleibt review-first und nutzt über die gemeinsamen Editorial-/Publication-Hinweise keine abweichende Export- oder Veröffentlichungssemantik mehr.
- Public Preview / Public Dossier Runtime
  Öffentliche Hinweise sprechen weiter nur über veröffentlichte Dossiers; Share-Vorschau und Review-Zustände werden nicht als öffentliche Veröffentlichung verkauft.
- Export-APIs
  Öffentliche CSV-/JSON-/Legacy-Exporte bleiben manuell und ohne Upload-, Scheduling-, Social- oder Publish-Ausführung.

## Doppelstrukturen reduziert

- Einzelne Copy-Blöcke für Share-Vorschau, Export und Veröffentlichung wurden aus Studio-, Admin- und Output-Komponenten in die gemeinsame Quelle `dossierExportShareTruth.ts` gezogen.
- Öffentliche Export-Gates hängen nicht mehr an drei leicht abweichenden Route-Checks, sondern an einem gemeinsamen `resolveDossierPublicExportAccess(...)`.
- Die Admin- und Public-Surfaces behalten ihre jeweiligen Aufgaben, sprechen aber dieselbe Produktwahrheit.

## Produktwahrheit

- `review_ready` ist nicht `approved_for_export`.
- `approved_for_export` ist nicht `publish_ready` und nicht `published`.
- `publish_ready` ist nicht `published`.
- `share_preview` ist keine öffentliche Veröffentlichung.
- `export_ready` oder ein manueller Export erzeugen keinen Publish-Schritt.
- Es gibt weiterhin kein Auto-Publish, keinen automatischen Export, kein Social Posting und kein Scheduling.

## Legacy- und Fallback-Pfade

- Die bestehende Legacy-Route `/api/dossier/[id]/export` bleibt erhalten, ist aber jetzt an dieselben öffentlichen Review-Gates gebunden wie die neueren JSON-/CSV-Exportpfade.
- Der Admin-Override bleibt bewusst bestehen, weil er zur bestehenden Review-/Operator-Wahrheit gehört; er veröffentlicht nichts automatisch.

## Validierung

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/dossier-export-route-guards.test.ts tests/dossier-output-studio.page.contract.test.ts tests/dossier-publish-admin.test.tsx tests/editorial-series.contract.test.tsx tests/output-social-workbench.contract.test.tsx tests/dossier-studio-server-persistence-ui.test.tsx tests/admin-editorial-hubs.page.test.tsx tests/admin-review.page.test.tsx tests/dossier-public-route-runtime.test.tsx tests/dossier-public-route.contract.test.tsx tests/content-release-workbench.test.ts`
  Ergebnis: `11` Testdateien grün, `36/36` Tests grün.
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web run typecheck`
  Lokaler `typecheck` bleibt auf der bekannten `.next/types/**/*.ts`-Drift (`TS6053`) hängen und wird deshalb nicht als Slice-Regression gewertet, solange Build, Lint und die relevante Cluster-Suite grün sind.

## Offene Punkte

- `V3-ROUTE-INVENTORY-LEGACY-PATH-HARDENING-01` bleibt der nächste unabhängige Cluster nach Merge, weil dort kanonische, Legacy- und Fallback-Routen repo-weit inventarisiert und gegeneinander abgegrenzt werden sollen.
- Keine neue Export-Runtime, keine neue Share-Runtime und keine neue Veröffentlichungsautomatisierung wurden in diesem Slice gestartet.
