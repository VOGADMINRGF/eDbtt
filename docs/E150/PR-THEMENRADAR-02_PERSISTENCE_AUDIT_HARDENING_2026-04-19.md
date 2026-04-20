# PR-THEMENRADAR-02 - Persistenz, Audit, Gates, UI-Hardening (2026-04-19)

## Ziel
Den operatorischen Themenradar-Slice von PR-01 auf einen produktionsnäheren Betriebsstand bringen:
- persistente Datenbasis statt runtime/in-memory
- belastbare append-only Audit-/Freigabespur
- härtere serverseitige Lifecycle-/Freigabegates
- stärkere UI-/Render-Absicherung inkl. mobile/dark QA-Vorbereitung
- reportfähigere Telemetrie-Shape für spätere Admin-Auswertungen

Guardrails bleiben unverändert:
- `no auto publish`
- `no auto official social posting`
- `reviewRequired=true`
- `autoPostEligible=false`
- `officialSocialRequiresReview=true`

## Umsetzung

### 1) Persistente Repo-/Collection-Basis
Neu: `features/themenradar/server/repo.ts`

- Collection `edebatte_themenradar_items`
- Collection `edebatte_themenradar_audit`
- Indexe für Operator-Queries:
  - Lifecycle + updatedAt
  - SourceType + updatedAt
  - CampaignKey + updatedAt
  - Audit: itemId/auditVersion, eventType/at, actorUserId/at
- Store nutzt jetzt den Repo-Layer asynchron; globalThis-Map/Seeding wurde entfernt.

### 2) Append-only Audit-/Freigabespur
Store schreibt pro relevanter Aktion append-only Audit-Events mit:
- `eventType`
- `fromStatus` / `toStatus`
- `actorUserId` / `actorEmail`
- `at`
- `auditVersion`
- `note`

Mindestens erfasst:
- `created`
- `qualified`
- `content_prep_generated`
- `review_ready_set`
- `share_ready_generated`
- `published_set`
- `archived`
- `lifecycle_transition` (für erlaubte manuelle Übergänge)

### 3) Lifecycle-/Freigabe-Gates serverseitig
Härtung in `features/themenradar/store.ts` + API-Statuscodes:

- `review_ready` darf nicht via generischem PATCH gesetzt werden (`review_ready_requires_share_ready_action`)
- `published` nur explizit:
  - nur aus `review_ready`
  - nur mit `publishIntent=true`
- `share-ready` blockiert für `raw`/`qualified`
- `content-prep` blockiert für `archived` und `published`
- Konflikte liefern `409` mit klaren Fehlerschlüsseln

### 4) Datenmodell-Erweiterung (betriebsrelevant)
`ThemenradarItem` erweitert um:
- `createdBy`
- `updatedBy`
- `lastReviewedBy`
- `lastReviewedAt`
- `reviewNotes`
- `auditVersion`
- `archivedAt`
- `archivedBy`

### 5) UI-/Render-Hardening
- `/admin/themenradar`
  - stabile Test-IDs für Filter/List-Surface
  - overflow-sichere Container (`max-w-full`, `overflow-x-hidden`)
- `/admin/themenradar/[id]`
  - Review-Notiz + explizite Publish-Bestätigung (`publishIntent`) im Qualifizierungsblock
  - Audit-Spur als eigener Abschnitt
  - Review-Metadaten sichtbar
  - Lifecycle-/Audit-Darstellung klar getrennt

### 6) Telemetrie Report-Shape
Neu:
- `getThemenradarTelemetryReportShape(...)` im Store
- `GET /api/admin/themenradar/report`

Report-Shape:
- Gesamttotals (`clicks`, `leads`, `memberships`)
- Aggregation nach Lifecycle-Status
- Aggregation nach `campaignKey`

Part12-konform:
- aggregiert
- keine personenbezogene Tracking-Ausweitung

### 7) Admin Discoverability
Bereits aus PR-01 vorhanden und weiter gültig:
- Navigationseintrag `VOG Themenradar`
- Quicklinks im Admin-Dashboard
- Liste -> Detail klar erreichbar

### 8) /order-Kontext
Themenradar erzeugt in diesem Slice keine neuen primären Bestell-CTAs.
Daher kein neuer `/vormerken`-Drift eingebracht; bestehender kanonischer Pfad bleibt `/order` (repoweit bereits harmonisiert).

## Geänderte Hauptdateien
- `features/themenradar/contracts.ts`
- `features/themenradar/store.ts`
- `features/themenradar/server/repo.ts`
- `features/themenradar/index.ts`
- `apps/web/src/app/api/admin/themenradar/route.ts`
- `apps/web/src/app/api/admin/themenradar/[id]/route.ts`
- `apps/web/src/app/api/admin/themenradar/[id]/content-prep/route.ts`
- `apps/web/src/app/api/admin/themenradar/[id]/share-ready/route.ts`
- `apps/web/src/app/api/admin/themenradar/[id]/telemetry/route.ts`
- `apps/web/src/app/api/admin/themenradar/report/route.ts`
- `apps/web/src/app/admin/themenradar/page.tsx`
- `apps/web/src/app/admin/themenradar/[id]/page.tsx`

## Tests
Neu/erweitert:
- `apps/web/tests/themenradar-persistence.contract.test.ts`
- `apps/web/tests/themenradar-repo.integration.test.ts`
- `apps/web/tests/themenradar-audit-trail.contract.test.ts`
- `apps/web/tests/themenradar-lifecycle-transition-guard.contract.test.ts`
- `apps/web/tests/themenradar-admin-page.render.test.tsx`
- `apps/web/tests/themenradar-detail-page.render.test.tsx`
- `apps/web/tests/themenradar-mobile-layout.contract.test.tsx`
- `apps/web/tests/themenradar-darkmode.contract.test.tsx`
- `apps/web/tests/themenradar-telemetry-report-shape.contract.test.ts`
- `apps/web/tests/themenradar-telemetry-report.route.test.ts`
- `apps/web/tests/themenradar-order-path-alignment.contract.test.ts`
- `apps/web/tests/no-primary-vormerken-links-from-themenradar.contract.test.ts`

Bestehende Themenradar-Tests auf neuen Async-/Audit-/Actor-Kontext angepasst.

## Verifikation
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web exec vitest run tests/themenradar-*.test.ts tests/themenradar-*.test.tsx`

Beide Läufe sind grün.

## Ausstehend / Nachschärfpotenzial (nächste Ausbaustufe)
- Optionaler DB-gestützter Integrationstest (echte Mongo-Testinstanz) für Index-/Query-Verhalten unter Last.
- Optionaler Admin-Report-View auf Basis von `/api/admin/themenradar/report`.
- Optionales CSV-/Exportformat für Audit/Report-Snapshots.
- Optionales Fine-Grained-Permission-Gate für publizierungsnahe Übergänge (zusätzlich zur Admin-/2FA-Gate).
