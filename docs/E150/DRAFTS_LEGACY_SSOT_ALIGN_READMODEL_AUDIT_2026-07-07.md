# DRAFTS-LEGACY-SSOT-ALIGN-01 Readmodel Audit

Datum: 2026-07-07

## Scope dieses Slice

Dieser Slice schließt keine persistente Store-Migration ab und entscheidet nicht still,
welcher Write-Pfad langfristig allein kanonisch werden soll.

Er zieht stattdessen die heutige Lese- und Resume-Wahrheit auf einen expliziten Policy- und
Readmodel-Pfad:

- lokaler `StartDraftContext` bleibt explizit browserlokale UX-Stütze
- serverseitige `/runden/new`-Drafts aus `/api/drafts/save` werden im Account sichtbar
- `/create?draftId=...` bevorzugt bei ObjectId-Drafts den user-scoped
  `contribution_drafts`-Resume-Pfad vor dem Legacy-`draftStore`
- `/account` bündelt lokale Drafts, serverseitige Anlassraum-Drafts, Create-Ledger und
  user-scoped Runtime-Linkages in einer kleinen vereinheitlichten Arbeitsstands-Leseschicht

## Implementierte Änderungen

1. Typed SSOT-Policy

- `features/account/draftSsotPolicy.ts` definiert jetzt die expliziten Quellen:
  `local_start_draft`, `manual_anlassraum_server_draft`, `create_contribution_ledger`,
  `persisted_create_handoff`, `user_scoped_runtime_linkage`, `legacy_draft_store`,
  `create_contribution_draft_resume`
- pro Quelle sind Label, Summary, Truth-Band, Sichtbarkeit und Priorität dokumentiert
- die Create-Resume-Reihenfolge ist damit nicht mehr implizit im Seiten-Code versteckt

2. Serverseitige Anlassraum-Drafts im Account

- `features/account/loadAccountManualAnlassraumServerDrafts.ts` liest user-scoped
  `/api/drafts/save`-Drafts mit `source = runden_manual_anlassraum`
- `getAccountOverview` liefert diese Drafts jetzt mit aus
- `AccountClient` und `AccountCreateDraftSections` reichen den Slice an den Resume-Bereich weiter

3. Vereinheitlichte Account-Arbeitsstände

- `features/account/buildAccountUnifiedWorkItems.ts` bündelt:
  - lokalen `StartDraftContext`
  - serverseitige manuelle Anlassraum-Drafts
  - Create-Ledger-Branches
  - ungematchte user-scoped Runtime-Linkages
- gleiche manuelle Anlassraum-Arbeitsstände werden nicht mehr doppelt als lokaler Browser-Draft
  und serverseitiger `/runden/new`-Draft gezeigt; die serverseitige Wahrheit gewinnt
- jede Karte zeigt jetzt explizit ihre aktuelle SSOT-Lesewahrheit

4. `/create`-Resume klarer priorisiert

- `apps/web/src/app/create/page.tsx` nutzt jetzt die explizite Lookup-Order aus der Policy
- für ObjectId-`draftId`s wird zuerst der user-scoped Contribution-Draft-Resume-Pfad gelesen
- der Legacy-`draftStore` bleibt nur Fallback und wird nicht länger still als erste Wahrheit behandelt

## Bewusst nicht geändert

- keine Migration oder Löschung in `drafts`, `contribution_drafts` oder `draftStore`
- keine neue Persistenzwelt
- keine neue Queue
- keine neue öffentliche Route
- keine Fake-Linkage über bloße Textähnlichkeit hinaus
- keine Kanon-Entscheidung, ob `/api/drafts/save` den Legacy-`draftStore` vollständig ersetzt

## Review-/Studio-Audit

`/admin/review` und `/dossier/[id]/studio` blieben in diesem Slice code-seitig unverändert.
Der Audit-Befund dafür ist:

- beide Surfaces lesen bereits aus persisted Handoffs, Review-Kontexten und Runtime-/Workspace-Readmodels
- dort war keine zusätzliche Draft-SSOT-Umbiegung nötig, solange die offene Write-Canon-Entscheidung
  nicht getroffen ist

## Verifikation

Ausgeführt:

- `pnpm -C apps/web exec vitest run tests/account-resume-workbench.contract.test.tsx tests/create-mode.page.test.ts tests/runden-context-human-readable-only.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `git diff --check`

## Restoffen

`DRAFTS-LEGACY-SSOT-ALIGN-01` bleibt fachlich offen, solange nicht entschieden ist:

- ob der Legacy-`draftStore` vollständig aus dem produktnahen Resume-Pfad entfernt wird
- ob weitere `/api/drafts/save`-Draft-Arten außer `/runden/new` denselben Account-SSOT-Pfad erhalten
- ob und wie alte `draftStore`-IDs kontrolliert auf user-scoped Server-Drafts migriert werden
