# V3 Release Readiness Regression Matrix 2026-07-13

## Scope

- `V3-RELEASE-READINESS-REGRESSION-MATRIX-01`
- Cluster: Release Readiness / Regression Matrix / Queue-02 Abschluss

## Baseline verifiziert

- `main` ist aktuell auf `193656d1`.
- `git status --short` war vor Start sauber.
- Die Produktionscluster `#363` bis `#376` liegen auf `main`:
  - `66d6e54b` `#363`
  - `1e4acab4` `#364`
  - `bb19e0a6` `#365`
  - `5a60daca` `#366`
  - `84628611` `#367`
  - `530c2b39` `#368`
  - `593a6a14` `#370`
  - `897576d1` `#371`
  - `b3dbe946` `#372`
  - `bbb9e20c` `#373`
  - `bd3c314b` `#374`
  - `5c87d4a9` `#375`
  - `193656d1` `#376`

## Gesamtentscheidung

- Preview moeglich: `ja`
- Beta moeglich: `ja`, aber nur mit gezieltem Smoke-Test auf den kanonischen Public-, Account-, Review- und Export-Pfaden
- Voller Release-Modus: `nein`
- Neue Queue 03 als eigener `codex_ready` Runner-Block: `nein`

Begruendung:

- Queue 02 hat die produktiven Kernpfade fuer Einstieg, Review, Dossier, Membership, Sprache, AI-Trace und Operator-Surfaces repo-seitig stabilisiert.
- Die bestehende Evidence aus `V3_TEST_RESULTS_REGRESSION_MATRIX`, `V3_HANDOFF_INTEGRITY_AND_LINKAGE_MAP`, `V3_ADMIN_DASHBOARD_CONTROL_CENTER` und den Clustern `#363` bis `#376` zeigt aber weiterhin bewusst `operational_basic`, `wired` und `partially_built`, nicht `endstate_ready`.
- Fuer einen echten oeffentlichen Release fehlen weiterhin eine belastbare externe Browser-/Deploy-Smoke-Stufe, ein engerer Release-Ops-/Incident-/Rollback-Pfad und ein sauber abgegrenzter Umgang mit bewusst deaktivierten Voxy-Runtime-Themen.

## Matrix A-J

### A. Public Start / Conversion / Route Truth

- Surfaces: `/`, `/start`, `/create`, `/register`, `/login`, `/order`, `/pricing`, `/pricing/institutionen`, `/vormerken`, `/mitglied-werden`, `/beitritt`
- Status: `beta_candidate_smoke_required`
- Produktwahrheit:
  - `/order` ist kanonischer Paket- und Startpfad.
  - `/vormerken` bleibt Legacy-/Fallback-/Info-Pfad.
  - `/mitglied-werden` und `/beitritt` bleiben Alias-/Redirect-Pfade, nicht zweite Hauptwelt.
- Evidence: `V3_AUTH_ACCOUNT_ORG_ACCESS_CLUSTER_AUDIT_2026-07-12.md`, `V3_PUBLIC_QA_MOBILE_DEBUG_LEAK_AUDIT_2026-07-13.md`, `V3_ROUTE_INVENTORY_LEGACY_PATH_HARDENING_2026-07-13.md`
- Relevante Tests in diesem Slice:
  - `route-inventory-legacy-path.contract`
  - `pricing-page.contract`
  - `pricing-order-flow.contract`
  - `order-entry.contract`
  - `public-route-h1-visibility.contract`
- Offenes Risiko:
  - externer Browser-/Deploy-Smoke fuer Public-Routen fehlt weiterhin

### B. Create -> Review -> Dossier -> Account E2E

- Surfaces: `/create`, Create-Handoff, `/admin/review`, `/dossier/[id]`, `/dossier/[id]/studio`, `/account`, `/account/organization/dashboard`
- Status: `beta_candidate_smoke_required`
- Produktwahrheit:
  - Create-Handoff bleibt review-first Arbeitsstand.
  - `review_ready` ist nicht `approved`.
  - Dossier-/Participation-/Output-Folgepfade bleiben getrennt.
- Evidence: `V3_E2E_CREATE_REVIEW_DOSSIER_ACCOUNT_FLOW_HARDENING_2026-07-13.md`, `V3_HANDOFF_INTEGRITY_AND_LINKAGE_MAP_2026-07-02.md`
- Relevante Tests in diesem Slice:
  - `create-candidate-preview.contract`
  - `account-resume-workbench.contract`
  - `admin-review.page`
  - `dossier-studio-server-persistence-ui`
  - `v3-account-user-scoped-runtime-linkage`
  - `v3-review-context-summary`
- Offenes Risiko:
  - die Handoff-Map ist fuer die Kernlinks belastbar, aber bewusst nicht `endstate_ready`

### C. Dossier Export / Share / Publish-ready

- Surfaces: `/dossier/[id]/studio`, `ExportPanel`, Public Dossier Runtime, Export-Routen
- Status: `beta_candidate_smoke_required`
- Produktwahrheit:
  - `review_ready` ist nicht `approved_for_export`
  - `approved_for_export` ist nicht `publish_ready`
  - `publish_ready` ist nicht `published`
  - `share_preview` ist keine oeffentliche Veroeffentlichung
- Evidence: `V3_DOSSIER_EXPORT_SHARE_PUBLISH_READY_GUARD_2026-07-13.md`
- Relevante Tests in diesem Slice:
  - `dossier-export-route-guards`
  - `dossier-public-route.contract`
  - `dossier-output-studio.page.contract`
  - `dossier-studio-social-queue.contract`
  - `social-manual-export-fallback.contract`
- Offenes Risiko:
  - Output-/Template-/QR-Standardisierung bleibt als spaeterer breiterer Folgepfad offen

### D. Feed / Source / Intake / Factcheck

- Surfaces: `/admin/feeds`, `/admin/region`, `/factcheck`, `/admin/review`, `/account/organization/dashboard`
- Status: `operator_ready_beta`
- Produktwahrheit:
  - Source candidate ist nicht Evidence.
  - Feed enrichment ist nicht importierte Quelle.
  - Factcheck candidate ist nicht verifizierter Factcheck.
  - Uebersetzung ist nicht Evidence.
- Evidence: `V3_FEED_SOURCE_INTAKE_REVIEW_HANDOFF_AUDIT_2026-07-13.md`, `V3_DOSSIER_CLAIMS_FACTCHECK_REVIEW_HARMONIZATION_AUDIT_2026-07-12.md`
- Relevante Repo-Basis:
  - `feedSourceIntakeSurfaceTruth`
  - `reviewSurfaceStatusLabels`
  - `V3_TEST_RESULTS_REGRESSION_MATRIX_2026-07-02.md`
- Offenes Risiko:
  - weiterhin kein Auto-Import, kein Auto-Factcheck und keine verifizierende Runtime; fuer Beta korrekt, fuer breiteren Release bewusst limitierend

### E. Membership / Entitlement / Package Activation

- Surfaces: `/order`, `/account/payment`, `/admin/pricing/orders`, `/admin/entitlements`, `/admin/memberships`, `/dashboard/memberships`
- Status: `beta_candidate_smoke_required`
- Produktwahrheit:
  - Mitgliedschaft ist nicht automatisch bezahlter Zugang.
  - Paketwahl ist nicht automatisch aktive Nutzung.
  - Billing-Copy ist keine Zahlungsausfuehrung.
  - sichtbares Entitlement ist nicht automatisch gewaehrt.
  - `approved` ist nicht `active`; `active` ist nicht `public_official`.
- Evidence: `V3_MEMBERSHIP_ENTITLEMENT_PACKAGE_ACTIVATION_HARDENING_2026-07-13.md`
- Relevante Tests in diesem Slice:
  - `membership-activation-support-surfaces.contract`
  - `account-payment.page.contract`
  - `payment-checkout-session.contract`
  - `payment-entitlement-after-checkout.contract`
  - `admin-entitlements.route`
  - `admin-pricing-orders.route`
- Offenes Risiko:
  - Aktivierung bleibt bewusst manuell und intern; das ist fuer Beta ehrlich, aber kein vollautomatischer Release-Betriebszustand

### F. Language Bridge / Multilingual

- Surfaces: `/create`, `/dossier/[id]/studio`, `/admin/review`, `/account`, `/community/contributions`, `/admin/contributions`, `/profile/[shareId]`
- Status: `beta_candidate`
- Produktwahrheit:
  - `uiLocale` bleibt Lese- und Bedienkontext.
  - Originalsprache bleibt Evidenz.
  - Lesefassung bleibt Hilfsfassung und nie Quelle oder Verifikation.
- Evidence: `V3_LANGUAGE_BRIDGE_MULTILINGUAL_SURFACE_HARDENING_2026-07-13.md`
- Relevante Tests in diesem Slice:
  - `content-translation-rendering`
  - `language-bridge-trust-format-contract`
  - `create-i18n.contract`
  - `community-contributions.route.translation`
  - `social-thread.route.translation`
- Offenes Risiko:
  - keine externe Translation-Runtime und keine Auto-Uebersetzung; fuer den aktuellen Scope bewusst richtig

### G. AI Trace / Orchestration Transparency

- Surfaces: `/create`, `/runden/new`, `/admin/review`, `/dossier/[id]/studio`, `/account`, `/admin/telemetry/ai/orchestrator`
- Status: `beta_candidate`
- Produktwahrheit:
  - user-facing Trace ist nicht Debug-Trace
  - keine Prompt-Leaks
  - keine Chain-of-Thought-Leaks
  - keine Provider-/Token-/Kosten-Leaks
  - Orchestrierungsschritt ist nicht automatisch Provider-Execution
- Evidence: `V3_AI_TRACE_USER_FACING_ORCHESTRATION_HARDENING_2026-07-13.md`, `V3_CORE_AI_ORCHESTRATION_PROVENANCE_GRAPH_TRACE_2026-07-03.md`
- Relevante Tests in diesem Slice:
  - `ai-trace-surface-truth`
  - `frontend-ai-transparency.contract`
  - `ai-orchestration-provenance-trace.contract`
  - `admin-ai-telemetry-ui.contract`
  - `public-debug-leak.guard`
- Offenes Risiko:
  - Operator-Telemetrie ist absichtlich auf sichere Summary reduziert; fuer tiefere Release-Ops braucht es spaeter eigene Observability-/Incident-Slices

### H. Admin / Operator Workbench

- Surfaces: `/admin`, `/admin/review`, `/admin/editorial/queue`, `/admin/feeds`, `/admin/region`, `/admin/access`, `/admin/entitlements`, `/admin/errors`, `/admin/system`
- Status: `operator_ready_beta`
- Produktwahrheit:
  - `/admin/review` bleibt zentrale Review-Workbench.
  - `/admin/errors` und `/admin/system` bleiben Diagnose- und Ruecksprung-Surfaces.
  - Operator sieht Review-first Arbeitsstaende statt roher Debug-/Runtime-Sprache.
- Evidence: `V3_ADMIN_OPERATOR_REVIEW_WORKBENCH_HARDENING_2026-07-13.md`, `V3_ADMIN_DASHBOARD_CONTROL_CENTER_2026-07-02.md`
- Relevante Tests in diesem Slice:
  - `operator-console-page.contract`
  - `operator-workbench-labels.contract`
  - `admin-region-page.render`
  - `admin-access-entitlements-surface.contract`
  - `admin-editorial-hubs.page`
  - `v3-test-regression-matrix-admin.page`
  - `v3-control-center-admin.page`
  - `v3-handoff-linkage-admin.page`
- Offenes Risiko:
  - kein geschlossener Incident-/Rollback-/Notification-Betriebspfad fuer einen echten Release

### I. Voxy

- Surfaces: Voxy Guidance auf `/`, `/start`, `/create`, `/runden`, `/dossier`, `/swipes`
- Status: `intentionally_disabled_for_runtime`
- Produktwahrheit:
  - Review-first Architektur und Hybrid Foundation sind dokumentiert.
  - Runtime bleibt deaktiviert.
  - `#369` bleibt Roadmap-/Doku-Kontext und keine Runtime-Freigabe.
- Evidence: `V3_VOXY_HYBRID_RUNTIME_FOUNDATION_2026-07-12.md`, `V3_VOXY_RUNTIME_PATH_DECISION_PACK_2026-07-12.md`, `V3_VOXY_RUNTIME_PATH_CHOICE_2026-07-12.md`
- Offenes Risiko:
  - nur dann Release-Blocker, wenn ein oeffentlicher Launch eine echte Voxy-Runtime versprechen wuerde

### J. Release-/Beta-Entscheidung

- Release-ready Pfade fuer Preview/Beta:
  - Public Einstieg und Conversion-Wahrheit
  - Review-first Create -> Review -> Dossier -> Account
  - Dossier Export-/Share-Guardrails
  - Membership-/Entitlement-Truth
  - Language Bridge
  - sichere AI-Trace-Transparenz
  - Admin-/Operator-Workbench
- Pfade mit zusaetzlichem Smoke-Test vor Beta:
  - `/`, `/start`, `/create`, `/register`, `/login`, `/order`, `/pricing`, `/pricing/institutionen`
  - `/admin/review`, `/dossier/[id]/studio`, `/account`, `/account/organization/dashboard`
  - Export-Routen und Public-Dossier-Read-Pfade
  - `/account/payment`, `/admin/pricing/orders`, `/admin/entitlements`
  - `/admin/telemetry/ai/orchestrator`, `/admin/errors`, `/admin/system`
- Bewusst disabled:
  - Voxy Runtime
  - Auto-Publish
  - automatischer Export
  - Social Posting
  - Scheduling
  - automatische Aktivierung
  - externe Translation-Runtime
- Echte Blocker fuer oeffentlichen Release:
  - `V3-EXTERNAL-BROWSER-E2E-01` bleibt offen
  - `V3-NOTIFICATIONS-REALTIME-MAIL-01`, `V3-INCIDENT-RECOVERY-MAINTENANCE-01` und `V3-MONITORING-ALERTING-ROLLBACK-01` bleiben offen
  - `V3_TEST_RESULTS_REGRESSION_MATRIX` und `V3_HANDOFF_INTEGRITY_AND_LINKAGE_MAP` markieren weiterhin keinen `endstate_ready`-Stand
- Spaetere Optimierung, aber kein akuter Preview-Blocker:
  - `V3-TEMPLATE-OUTPUT-STANDARDIZATION-01`
  - `V3-QR-SHARING-PUBLIC-ENTRY-01`
  - `V3-DOSSIER-SOCIAL-OUTPUT-DRAFTS-01`
- Queue 03:
  - wurde nicht angelegt
  - die verbleibenden Luecken sind bereits als bestehende offene, `in_progress`, `needs_decision`, docs-/contract-first oder ops-nahe Tasks sichtbar
  - ein weiterer autonomer Produkt-Runner ist ohne neue, kleiner geschnittene repo-begruendete `codex_ready` Cluster derzeit nicht gerechtfertigt

## Validierung in diesem Slice

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/route-inventory-legacy-path.contract.test.ts tests/pricing-page.contract.test.ts tests/order-entry.contract.test.ts tests/pricing-order-flow.contract.test.ts tests/public-route-h1-visibility.contract.test.tsx`
  - Ergebnis: `5` Dateien, `17/17` Tests gruen
- `pnpm -C apps/web exec vitest run tests/create-candidate-preview.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/admin-review.page.test.tsx tests/dossier-studio-server-persistence-ui.test.tsx tests/v3-account-user-scoped-runtime-linkage.test.ts tests/v3-review-context-summary.test.tsx`
  - Ergebnis: `6` Dateien, `20/20` Tests gruen
- `pnpm -C apps/web exec vitest run tests/dossier-export-route-guards.test.ts tests/dossier-public-route.contract.test.tsx tests/dossier-output-studio.page.contract.test.ts tests/dossier-studio-social-queue.contract.test.tsx tests/social-manual-export-fallback.contract.test.ts`
  - Ergebnis: `5` Dateien, `13/13` Tests gruen
- `pnpm -C apps/web exec vitest run tests/membership-activation-support-surfaces.contract.test.tsx tests/account-payment.page.contract.test.tsx tests/payment-checkout-session.contract.test.ts tests/payment-entitlement-after-checkout.contract.test.ts tests/admin-entitlements.route.test.ts tests/admin-pricing-orders.route.test.ts`
  - Ergebnis: `6` Dateien, `18/18` Tests gruen
- `pnpm -C apps/web exec vitest run tests/content-translation-rendering.test.tsx tests/language-bridge-trust-format-contract.test.ts tests/create-i18n.contract.test.ts tests/community-contributions.route.translation.test.ts tests/social-thread.route.translation.test.ts`
  - Ergebnis: `5` Dateien, `17/17` Tests gruen
- `pnpm -C apps/web exec vitest run tests/ai-trace-surface-truth.test.ts tests/frontend-ai-transparency.contract.test.ts tests/ai-orchestration-provenance-trace.contract.test.ts tests/admin-ai-telemetry-ui.contract.test.ts tests/public-debug-leak.guard.test.ts`
  - Ergebnis: `5` Dateien, `16/16` Tests gruen
- `pnpm -C apps/web exec vitest run tests/operator-console-page.contract.test.tsx tests/operator-workbench-labels.contract.test.ts tests/admin-region-page.render.test.tsx tests/admin-access-entitlements-surface.contract.test.tsx tests/admin-editorial-hubs.page.test.tsx tests/v3-test-regression-matrix-admin.page.test.tsx tests/v3-control-center-admin.page.test.tsx tests/v3-handoff-linkage-admin.page.test.tsx`
  - Ergebnis: `8` Dateien, `14/14` Tests gruen
- `pnpm -C apps/web run lint`
  - Ergebnis: gruen
- `pnpm -C apps/web run build`
  - Ergebnis: gruen
- `pnpm -C apps/web run typecheck`
  - Ergebnis: nicht gruen wegen der bekannten `.next/types/**/*.ts`-Drift mit `TS6053` auf fehlende generierte Dateien; nicht als Slice-Regression gewertet, weil Build, Lint und die reprasentativen Regression-Suiten gruen sind
- Hinweise:
  - `public-route-h1-visibility.contract` emittiert weiter bekannte React-Warnungen zu nicht-booleanschen `fill`- und `priority`-Attributen, laeuft aber gruen und ist kein Slice-Blocker

## Offene Folgepfade

- `GOV-CIVIC-ECON-01` bleibt `codex_ready`, aber bewusst docs-/contract-first
- `WORKTREE-COMMIT-CREATE-LEDGER-HANDOFF-14B2` bleibt maintenance-only
- kein neuer produktiver `codex_ready` Cluster wurde fuer Queue 03 angelegt
