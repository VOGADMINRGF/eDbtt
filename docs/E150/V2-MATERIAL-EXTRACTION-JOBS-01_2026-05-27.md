# V2-MATERIAL-EXTRACTION-JOBS-01

## Ziel

Den bestehenden metadata-only Material-Intake aus V1 um kontrollierte, review-first Extraktionsjobs erweitern, ohne Auto-Publish, ohne automatische DeepSearch-Kosten und ohne neue Produktparallelwelt.

## Abgrenzung

- `MATERIAL-INTAKE-PRODUCTION-01` bleibt der production-ready-v1 Pfad fuer Material-Metadaten, Review-State und Audit.
- `V2-MATERIAL-EXTRACTION-JOBS-01` fuehrt erst das explizite Job-System mit Guardrails, Draft-Ausgaben und Handoffs zu Dossier und Themenradar ein.
- Keine automatische Veroeffentlichung, keine automatische Amtlichkeit, kein Factcheck-Siegel und keine automatische Swipe-Live-Schaltung.

## Umgesetzte Bereiche

### 1. Material Extraction Job Contract

Neu in `apps/web/src/features/material/materialExtractionJobs.ts`:

- `materialId`
- `sourceType`
- `submittedBy`
- `organizationId`
- `regionId`
- `dossierId`
- `anlassraumId`
- Status:
  - `queued`
  - `metadata_ready`
  - `extraction_pending`
  - `extracting`
  - `extracted`
  - `needs_review`
  - `attached_to_dossier`
  - `attached_to_themenradar`
  - `failed`
  - `blocked`
- `extractionMode`
- `costGuard`
- `error`
- `createdAt`
- `updatedAt`

Persistenz laeuft analog zur bestehenden Material-Registry ueber eine Core-Collection, mit sauber markiertem In-Memory-Fallback fuer Test/Build.

### 2. Guarded Extraction Runtime

- metadata-only bleibt moeglich
- Text-/Transcript-Extraktion laeuft nur als expliziter Job
- YouTube-/Transkriptpfade werden ohne explizite Approval-Freigabe blockiert
- kein Auto-DeepSearch
- keine stillen externen Kostenpfade
- keine automatische Veroeffentlichung
- Jobs sind idempotent ueber einen stabilen Material-/Scope-/Mode-Hash

### 3. Review-first Outputs

Extraktionsjobs erzeugen nur:

- `sourceHints`
- `claimDrafts`
- `questionDrafts`
- `optionDrafts`
- `evidenceHints`
- Dossier-Handoff
- Themenradar-Handoff

Alle Outputs bleiben `draft` bzw. `in Prüfung`.

### 4. Themenradar-Handoff

`features/themenradar/autonomousSupply.ts` liest jetzt auch Material-Extraktionsjobs als `material`-Seed ein. Dadurch docken extrahierte Hinweise an denselben autonomen Themenradar an, statt eine zweite Themenwelt aufzubauen.

### 5. Dossier-/Anlassraum-Handoff

Wenn `dossierId` oder `anlassraumId` gesetzt ist:

- entsteht ein sichtbarer Handoff mit Status `in Prüfung`
- es wird keine Live-Veröffentlichung behauptet
- der nächste sinnvolle Pfad führt in bestehende Dossier-/Runden-Flächen

### 6. Admin-/Review-Anschluss

- neuer API-Pfad: `/api/material/extraction-jobs`
- `/admin/feeds` zeigt Material-Extraktionsjobs mit
  - wartenden Jobs
  - Approval-/Kosten-Blockern
  - Fehlern
  - Dossier-/Themenradar-Handoffs
  - nächster Aktion
- `features/reviewQueue.ts` liest Material-Extraktionsjobs als neuen Review-Domain-Typ `material_extraction`

## Geänderte Dateien

- `apps/web/src/features/material/materialIntakeRepository.ts`
- `apps/web/src/features/material/materialExtractionJobs.ts`
- `apps/web/src/app/api/material/extraction-jobs/route.ts`
- `features/themenradar/autonomousSupply.ts`
- `features/feeds/runtimeReadModel.ts`
- `features/reviewQueue.ts`
- `apps/web/src/app/admin/feeds/page.tsx`
- `apps/web/src/app/admin/themenradar/page.tsx`
- `apps/web/tests/material-extraction-job-contract.test.ts`
- `apps/web/tests/material-extraction-cost-guardrail.contract.test.ts`
- `apps/web/tests/material-extraction-review-first.contract.test.ts`
- `apps/web/tests/material-extraction-themenradar-handoff.contract.test.ts`
- `apps/web/tests/material-extraction-dossier-handoff.contract.test.ts`
- `apps/web/tests/material-extraction-no-autopublish.contract.test.ts`
- `apps/web/tests/admin-feeds-runtime-dashboard.contract.test.tsx`
- `docs/E150/OpenTasks.md`
- `docs/E150/V2-MATERIAL-EXTRACTION-JOBS-01_2026-05-27.md`

## Validierung

Gelaufen und gruen:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/material-extraction-job-contract.test.ts tests/material-extraction-cost-guardrail.contract.test.ts tests/material-extraction-review-first.contract.test.ts tests/material-extraction-themenradar-handoff.contract.test.ts tests/material-extraction-dossier-handoff.contract.test.ts tests/material-extraction-no-autopublish.contract.test.ts`
- `pnpm -C apps/web exec vitest run tests/admin-feeds-runtime-dashboard.contract.test.tsx`
- `pnpm run release:validate:production`

## Ergebnis

Material kann jetzt kontrolliert in explizite Extraktionsjobs ueberfuehrt werden. Diese Jobs erzeugen review-first Dossier- und Themenradar-Hinweise, aber keine Wahrheit, kein Live-Posting, kein Factcheck-Siegel und keine ungepruefte oeffentliche Flaeche.

## Bewusst offen

- kein echter Extraktionsprovider fuer kostenpflichtige oder transkriptbasierte Laeufe
- kein automatischer DeepSearch-Pfad
- keine automatische Dossier-Anwendung
- keine automatische Swipe-Live-Schaltung
- kein neuer Material-Operator-Kosmos ausserhalb von `/admin/feeds` und `/admin/review`
