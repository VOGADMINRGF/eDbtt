# CONTENT-RELEASE-WORKBENCH-01

Stand: 2026-05-18

## Ziel

Aus einem reviewpflichtigen `Source Result` soll ein berechtigter Nutzer bewusst veroefentlichbare Arbeitsstaende fuer Dossier, Anlassraum und bestehende oeffentliche Themenseiten vorbereiten koennen, ohne Auto-Publish, ohne automatisches `public_official` und ohne neue Parallel-Runtime.

## Umsetzung

- `features/contentReleaseWorkbench.ts` fuehrt einen kleinen persisted Workbench-Layer fuer `dossier` und `anlassraum` ein.
- Der Layer haengt direkt an die bestehende `Source Result`-Runtime und erzeugt nur reviewpflichtige Ziel-Arbeitsstaende.
- Fuer Dossiers wird die bestehende Dossier-/Studio-Familie wiederverwendet.
- Fuer Anlassraeume wird die bestehende Anlassraum-Familie wiederverwendet.
- `apps/web/src/app/api/admin/review/content-release/route.ts` bietet den bewussten Bedienpfad fuer:
  - `prepare_target`
  - `make_visible`
  - `prepare_publication`
  - `retract_visibility`
  - `archive_target`
- `/admin/review` zeigt dieselben Ziele direkt am `Source Result` als Review-to-Publish Workspace.

## Guardrails

- Kein Auto-Publish.
- Kein automatisches `public_official`.
- Kein Social Publishing.
- Keine automatische amtliche Antwort.
- Keine automatische Dossier-/Anlassraum-Finalisierung.
- Alle Sichtbarkeitswechsel bleiben auditierbar.
- Sichtbare Freigaben bleiben widerruf- und archivierbar vorbereitet.
- QR-/Share-Link wird erst angeboten, wenn ein Ziel bewusst sichtbar gemacht wurde.

## Statusabbildung

- `internal_review` -> `Arbeitsstand`
- `public_unverified` -> `sichtbar, aber nicht geprueft`
- `public_reviewed` -> `geprueft`
- `public_official` -> `amtlich freigegeben`
- `archived` -> `archiviert`
- `blocked` -> `blockiert`

## Routen

- Dossier-Vorschau: `/dossier/[id]/studio`
- Dossier oeffentlich: `/dossier/[id]`
- Anlassraum-Vorschau: `/runden?view=active&anlassraumId=...`
- Anlassraum oeffentlich: `/anlassraum?anlassraumId=...`
- QR-Link: `/qrcodegenerator?target=...`

Es wurde keine neue Parallelwelt fuer Preview oder Public Surface eingefuehrt.

## Validierung

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/content-release-workbench.test.ts tests/review-queue.readmodel.test.ts tests/admin-review.page.test.tsx`
- `pnpm --filter @vog/web build`

## Relevante Dateien

- `features/contentReleaseWorkbench.ts`
- `features/reviewQueue.ts`
- `features/region/server/sourceConnectionRuntime.ts`
- `apps/web/src/app/api/admin/review/content-release/route.ts`
- `apps/web/src/app/admin/review/ContentReleaseWorkbenchActions.tsx`
- `apps/web/src/app/admin/review/page.tsx`
- `apps/web/tests/content-release-workbench.test.ts`
- `apps/web/tests/review-queue.readmodel.test.ts`
- `apps/web/tests/admin-review.page.test.tsx`
