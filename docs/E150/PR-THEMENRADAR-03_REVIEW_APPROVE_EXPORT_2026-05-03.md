# PR-THEMENRADAR-03 - Review, Approve, Export (operatorisch, no-tracking)

Datum: 2026-05-03  
Repo: `VOGADMINRGF/edebatte-org`

## Ziel

Den Themenradar nach `PR-THEMENRADAR-02` um einen expliziten, review-gebundenen
Export-Layer erweitern, ohne Auto-Publish oder Tracking-Drift:

- Review-Queue bleibt `content_ready -> review_ready -> published`
- Exportpfade fuer `post`, `carousel`, `script` sind manuell
- Kein offizielles Social-Autoposting
- Keine Pixel-/Session-/Visitor-/Fingerprint-Felder

## Umsetzung

1. Export-Contract und Guardrails
- Neue Datei: `features/themenradar/exportDraft.ts`
- Formate: `post`, `carousel`, `script`
- Harte Export-Gates:
  - nur `review_ready` oder `published`
  - `shareContractSnapshot` ist Pflicht
- Export-Meta ist explizit:
  - `manualReleaseOnly=true`
  - `reviewRequired=true`
  - `autoPostEligible=false`
  - `officialSocialAutoPosting=false`

2. Store-Anbindung mit dokumentierter Verwendung
- `features/themenradar/store.ts`
- Neue Funktion `createThemenradarManualExport(id, format, actor)`
- Export-Generierung wird auditierbar dokumentiert (append-only Audit-Event mit Format-Metadaten)

3. API-Route
- Neu: `POST /api/admin/themenradar/[id]/export`
- Datei: `apps/web/src/app/api/admin/themenradar/[id]/export/route.ts`
- Fehlergrenzen:
  - `400 invalid_export_format`
  - `404 themenradar_item_not_found`
  - `409 themenradar_export_requires_review_ready`
  - `409 themenradar_export_requires_share_ready`

4. Admin-Detail-UI
- Datei: `apps/web/src/app/admin/themenradar/[id]/page.tsx`
- Neue manuelle Export-Aktionen:
  - `Export Post`
  - `Export Carousel`
  - `Export Script`
- Buttons nur nutzbar wenn Status `review_ready|published`
- JSON-Vorschau des Export-Entwurfs im Detail-View

## Guardrail-Check

- Kein Auto-Publish eingefuehrt
- Kein offizielles Social-Autoposting eingefuehrt
- Keine neue Tracking-Logik eingefuehrt
- Keine Checkout-/Payment-/Growth-Pfade beruehrt

## Tests / Validierung

1. Themenradar-Testmatrix
- `pnpm -C apps/web exec sh -lc 'vitest run tests/themenradar-*.test.ts tests/themenradar-*.test.tsx'`
- Ergebnis: 18 Dateien, 38 Tests, alles gruen

2. Neue/aktualisierte Tests
- `apps/web/tests/themenradar-export.contract.test.ts`
  - blockt Export vor `review_ready`
  - validiert manuelle Exportentwuerfe und no-tracking Boundary
- `apps/web/tests/themenradar-actions.route.test.ts`
  - deckt `/export` Happy Path, invalid format und 409-Guardrails

3. Repo-Checks
- `pnpm -C apps/web run typecheck` -> gruen
- `pnpm -C apps/web run lint` -> gruen

