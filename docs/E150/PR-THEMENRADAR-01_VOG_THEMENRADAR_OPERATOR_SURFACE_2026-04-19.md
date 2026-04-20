# PR-THEMENRADAR-01 - VOG Themenradar Operator Surface (2026-04-19)

## Ziel

Erster produktionsnaher Slice fuer eine staff-/operatorische Themenflaeche:

- Route: `/admin/themenradar`
- Fokus: Thema erfassen -> qualifizieren -> Content vorbereiten -> share-ready fuer Review
- Guardrails: review-first, kein Auto-Publish, keine Wahrheits-/Prioritaets-Sondermacht

## Umsetzungsumfang

### 1. Neue Admin-Surface

- `/admin/themenradar` (Liste, Status-/Quellfilter, Anlage)
- `/admin/themenradar/[id]` (Detail, Scores, Lifecycle, Content-Prep, Share-ready, Telemetrie)
- Admin-Navigation erweitert: `VOG Themenradar`

### 2. Typed Themenradar Contract

Neu in `features/themenradar/contracts.ts`:

- `ThemenradarSourceType`: `manual | news | community | create_intake`
- `ThemenradarJurisdiction`: `bund | land | kommune | mixed`
- `ThemenradarLifecycleStatus`:
  `raw | qualified | content_ready | review_ready | published | archived`
- `ThemenradarItem` inkl. Pflicht-Guardrails:
  - `reviewRequired: true`
  - `autoPostEligible: false`
  - `officialSocialRequiresReview: true`

### 3. Assistive Content Prep (non-binding)

Neu in `features/themenradar/contentPrep.ts`:

- social hook
- 3 caption variants
- carousel outline (max. 5)
- short video script (40s Zielwert)
- voiceover script
- membership CTA
- dossier/anlassraum CTA

Guardrails:

- Originalsignal bleibt erhalten
- Vorschlaege bleiben nicht bindend

### 4. Share-ready Integration (bestehender Contract)

Neu in `features/themenradar/shareReady.ts`:

- Wiederverwendung von `features/anlassraum/shareReadyAssetContract.ts`
- Konsistenzpruefung ueber Parser + Validator
- Harte Pruefung:
  - `autoPostEligible` bleibt `false`
  - `needsReviewBeforeOfficialSocial` bleibt `true`

### 5. Aggregierte Campaign-/Conversion-Telemetry

Neu in `features/themenradar/telemetry.ts`:

- Event-Typen: `click`, `lead`, `membership`
- Snapshot (aggregiert): `clicks`, `leads`, `memberships`, `updatedAt`
- Kein granularer Tracking-Overload

### 6. API-Layer (admin-gated)

Neu:

- `GET/POST /api/admin/themenradar`
- `GET/PATCH /api/admin/themenradar/[id]`
- `POST /api/admin/themenradar/[id]/content-prep`
- `POST /api/admin/themenradar/[id]/share-ready`
- `POST /api/admin/themenradar/[id]/telemetry`

Alle Endpunkte laufen ueber `requireAdminOrResponse`.

Nachhaertung im Slice:

- Lifecycle-Transitionen sind serverseitig strikt (`invalid_lifecycle_transition` -> `409`), kein stilles Ueberspringen mehr.
- `share-ready` ist an Qualifizierung gebunden (`raw` blockiert), optionales auto-Content-Prep fuer qualifizierte Faelle bleibt assistiv.
- Konfliktzustaende (`content_prep_locked`, `themenradar_not_qualified_for_share_ready`) liefern explizite 409-Antworten statt unscharfer 400.

### 7. /create-Anbindung (optional, nachgelagert)

- Anlage mit `sourceType=create_intake` ist moeglich
- `issue_signal`-Importpfad wird im Themenradar als nachgelagerte Operator-Amplify-Schicht gefuehrt
- `/create` bleibt kanonische Intake-Surface

## Tests

Neu:

- `apps/web/tests/themenradar-contracts.test.ts`
- `apps/web/tests/themenradar-guardrails.contract.test.ts`
- `apps/web/tests/themenradar-routing-status.route.test.ts`
- `apps/web/tests/themenradar-actions.route.test.ts`
- `apps/web/tests/themenradar-share-ready-consistency.contract.test.ts`
- `apps/web/tests/themenradar-telemetry-shape.contract.test.ts`

Abgedeckt:

- typed Contract
- Guardrail-Haertung
- Routing/Status-Flow
- Action-Routen fuer Content-Prep/Share-ready/Telemetry inkl. Konfliktcodes
- share-ready Konsistenz
- Telemetry-Shape (aggregiert)

## E150-Konformitaet

- Keine neue oeffentliche Surface
- Kein offizielles Social-Autoposting
- Kein Auto-Publish
- Kein neuer Wahrheits-/Prioritaetskanal
- Review-first bleibt verbindlich
- Nutzung bestehender Contracts (`orchestratorIntent`, `shareReadyAsset`) statt Parallelarchitektur
