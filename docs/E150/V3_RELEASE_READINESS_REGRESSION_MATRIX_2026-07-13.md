# V3 Release Readiness Regression Matrix 2026-07-13

## Scope

- `V3-RELEASE-READINESS-REGRESSION-MATRIX-01`
- Cluster: Release Readiness / Regression Matrix / Queue-02 Abschluss

## Baseline verifiziert

- `main` ist aktuell auf `ad27feeb`.
- `git status --short` war vor Start sauber.
- Die Produktionscluster `#363` bis `#389` liegen auf `main`:
  - `66d6e54b` `#363`
  - `1e4acab4` `#364`
  - `bb19e0a6` `#365`
  - `5a60daca` `#366`
  - `84628611` `#367`
  - `530c2b39` `#368`
  - `a8d4edc7` `#369`
  - `593a6a14` `#370`
  - `897576d1` `#371`
  - `b3dbe946` `#372`
  - `bbb9e20c` `#373`
  - `bd3c314b` `#374`
  - `5c87d4a9` `#375`
  - `193656d1` `#376`
  - `b024cec4` `#377`
  - `27d33d47` `#378`
  - `6719d797` `#379`
  - `492a4623` `#380`
  - `3780a11c` `#381`
  - `ac7cef82` `#382`
  - `2f08136d` `#383`
  - `b1d9173c` `#384`
  - `198657f9` `#385`
  - `1d887ec4` `#386`
  - `4c528634` `#387`
  - `ad27feeb` `#388`
  - `e84002fe` `#389`

## Gesamtentscheidung

- Preview moeglich: `ja`
- Beta moeglich: `ja`, aber nur mit gezieltem Smoke-Test auf den kanonischen Public-, Account-, Review- und Export-Pfaden
- Voller Release-Modus: `nein`
- Neue Queue 03 als eigener `codex_ready` Runner-Block: `nein`

Begruendung:

- Queue 02 hat die produktiven Kernpfade fuer Einstieg, Review, Dossier, Membership, Sprache, AI-Trace und Operator-Surfaces repo-seitig stabilisiert.
- Der anschliessende Controlled-Agentic-Track `#380` bis `#389` schliesst zusaetzlich Voxy-Shell-, Segment-, Safe-Trace-, B2G-, GOV-light- und Civic-E2E-Contracts repo-seitig als read-only Produktwahrheit, ohne Runtime-, Provider-, Notification- oder Auto-Publish-Freigabe.
- Die bestehende Evidence aus `V3_TEST_RESULTS_REGRESSION_MATRIX`, `V3_HANDOFF_INTEGRITY_AND_LINKAGE_MAP`, `V3_ADMIN_DASHBOARD_CONTROL_CENTER` und den Clustern `#363` bis `#389` zeigt aber weiterhin bewusst `operational_basic`, `wired` und `partially_built`, nicht `endstate_ready`.
- Fuer einen echten oeffentlichen Release fehlen weiterhin eine belastbare externe Browser-/Deploy-Smoke-Stufe, ein engerer Release-Ops-/Incident-/Rollback-Pfad und ein sauber abgegrenzter Umgang mit bewusst deaktivierten Voxy-Runtime-Themen.

## Matrix A-J

### A. Public Start / Conversion / Route Truth

- Surfaces: `/`, `/start`, `/create`, `/register`, `/login`, `/order`, `/pricing`, `/pricing/institutionen`, `/vormerken`, `/mitglied-werden`, `/beitritt`
- Status: `beta_candidate_smoke_required`
- Produktwahrheit:
  - Die oeffentliche Landing transportiert jetzt eine sichtbare Voxy-Shell fuer Page, Mobile und Agentic Guidance, ohne Runtime zu behaupten.
  - Voxy bleibt responsive, viewport-sicher und ohne rohe/unstyled Navigation.
  - `/order` ist kanonischer Paket- und Startpfad.
  - `/vormerken` bleibt Legacy-/Fallback-/Info-Pfad.
  - `/mitglied-werden` und `/beitritt` bleiben Alias-/Redirect-Pfade, nicht zweite Hauptwelt.
- Evidence: `V3_AUTH_ACCOUNT_ORG_ACCESS_CLUSTER_AUDIT_2026-07-12.md`, `V3_PUBLIC_QA_MOBILE_DEBUG_LEAK_AUDIT_2026-07-13.md`, `V3_ROUTE_INVENTORY_LEGACY_PATH_HARDENING_2026-07-13.md`, `V3_VOXY_EXPERIENCE_SHELL_MOBILE_AGENTIC_INTEGRATION_2026-07-14.md`
- Relevante Tests in diesem Slice:
  - `landing-clarity.contract`
  - `landing-information-architecture.contract`
  - `mobile-entry-routes.contract`
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
  - Voxy erklaert auf `/create`, `/account` und Organisationspfaden den sicheren naechsten Schritt, startet aber keine Runtime.
  - Der Agentic-Civic-E2E-Pilot bleibt ein read-only Stage-/Status-Contract von Beobachtung ueber Dossier und Beteiligung bis GOV-light und Verified Publisher Preflight.
  - `review_ready` ist nicht `approved`.
  - Dossier-/Participation-/Output-Folgepfade bleiben getrennt.
- Evidence: `V3_E2E_CREATE_REVIEW_DOSSIER_ACCOUNT_FLOW_HARDENING_2026-07-13.md`, `V3_HANDOFF_INTEGRITY_AND_LINKAGE_MAP_2026-07-02.md`, `V3_VOXY_EXPERIENCE_SHELL_MOBILE_AGENTIC_INTEGRATION_2026-07-14.md`, `V3_AGENTIC_CIVIC_E2E_PILOT_2026-07-14.md`
- Relevante Tests in diesem Slice:
  - `create-mode.page`
  - `create-candidate-preview.contract`
  - `account-resume-workbench.contract`
  - `account-organization-page.contract`
  - `account-organization-dashboard.page`
  - `admin-review.page`
  - `agentic-civic-e2e-pilot.contract`
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
  - `/admin/system` zeigt nach dem Controlled-Agentic-Track Bootstrap-, Voxy-, B2G-, Municipal-Handoff- und Civic-E2E-Readiness als Contract-/Preview-Wahrheit, nicht als Fake-Runtime.
  - Operator sieht Review-first Arbeitsstaende statt roher Debug-/Runtime-Sprache.
- Evidence: `V3_ADMIN_OPERATOR_REVIEW_WORKBENCH_HARDENING_2026-07-13.md`, `V3_ADMIN_DASHBOARD_CONTROL_CENTER_2026-07-02.md`, `V3_AGENT_REGISTRY_RUNNER_BOOTSTRAP_2026-07-13.md`, `V3_B2G_FIRST_LOGIN_JURISDICTION_COCKPIT_2026-07-14.md`, `V3_MUNICIPAL_HANDOFF_THREE_ADOPTION_TRIAL_2026-07-14.md`, `V3_AGENTIC_CIVIC_E2E_PILOT_2026-07-14.md`
- Relevante Tests in diesem Slice:
  - `operator-console-page.contract`
  - `operator-workbench-labels.contract`
  - `admin-region-page.render`
  - `admin-access-entitlements-surface.contract`
  - `admin-system-agentic-runtime-readiness.page`
  - `admin-editorial-hubs.page`
  - `v3-test-regression-matrix-admin.page`
  - `v3-control-center-admin.page`
  - `v3-handoff-linkage-admin.page`
- Offenes Risiko:
  - kein geschlossener Incident-/Rollback-/Notification-Betriebspfad fuer einen echten Release

### I. Voxy / Agentic Shell Boundary

- Surfaces: Voxy Guidance auf `/`, `/start`, `/create`, `/runden`, `/dossier/[id]`, `/account`, `/account/organization`, `/account/organization/dashboard`, `/admin/system`, `/admin/review`, `/admin/region`
- Status: `preview_candidate_runtime_disabled`
- Produktwahrheit:
  - Die Voxy Experience Shell ist als sichtbare Page-/Mobile-/Agentic-Fassade integriert.
  - `passive`, `guided` und `active` bleiben klar getrennt; `active` startet nur nach bewusster Nutzeraktion.
  - B2C bleibt consent-gated; B2B/B2G werden nicht in einen persoenlichen Companion gezwungen.
  - Agentic Civic E2E, GOV-light und Municipal Handoff erscheinen als review-first Statuspfade ohne Runtime-, Provider-, Prompt- oder Chain-of-Thought-Leak.
  - Runtime bleibt deaktiviert.
  - `#369` bleibt Roadmap-/Doku-Kontext und keine Runtime-Freigabe.
- Evidence: `V3_VOXY_HYBRID_RUNTIME_FOUNDATION_2026-07-12.md`, `V3_VOXY_RUNTIME_PATH_DECISION_PACK_2026-07-12.md`, `V3_VOXY_RUNTIME_PATH_CHOICE_2026-07-12.md`, `V3_VOXY_EXPERIENCE_SHELL_MOBILE_AGENTIC_INTEGRATION_2026-07-14.md`, `V3_AGENT_RUN_ARTIFACT_SAFE_TRACE_CONTRACT_2026-07-13.md`, `V3_AGENTIC_CIVIC_E2E_PILOT_2026-07-14.md`
- Relevante Tests in diesem Slice:
  - `voxy-experience-shell.contract`
  - `agent-run-artifact-safe-trace.contract`
  - `agentic-civic-e2e-pilot.contract`
  - `admin-system-agentic-runtime-readiness.page`
- Offenes Risiko:
  - nur dann Release-Blocker, wenn ein oeffentlicher Launch eine echte Voxy-Runtime, automatische Agentenaktivitaet oder Auto-Publish versprechen wuerde

### J. Release-/Beta-Entscheidung

- Release-ready Pfade fuer Preview/Beta:
  - Public Einstieg und Conversion-Wahrheit
  - Review-first Create -> Review -> Dossier -> Account
  - Dossier Export-/Share-Guardrails
  - Membership-/Entitlement-Truth
  - Language Bridge
  - sichere AI-Trace-Transparenz
  - Admin-/Operator-Workbench
  - Voxy Experience Shell und Controlled-Agentic-Readiness als read-only Contract-Wahrheit
- Pfade mit zusaetzlichem Smoke-Test vor Beta:
  - `/`, `/start`, `/create`, `/register`, `/login`, `/order`, `/pricing`, `/pricing/institutionen`
  - `/admin/review`, `/dossier/[id]/studio`, `/account`, `/account/organization`, `/account/organization/dashboard`
  - Export-Routen und Public-Dossier-Read-Pfade
  - `/account/payment`, `/admin/pricing/orders`, `/admin/entitlements`
  - `/admin/telemetry/ai/orchestrator`, `/admin/errors`, `/admin/system`, `/admin/region`
  - `/runden` sowie die oeffentliche und institutionelle Voxy-Shell
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
  - der Controlled-Agentic-Track schafft Contract- und Surface-Wahrheit, ersetzt aber keine echte Browser-/Deploy-/Incident-Stufe
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
- `pnpm -C apps/web exec vitest run tests/landing-clarity.contract.test.tsx tests/landing-information-architecture.contract.test.tsx tests/mobile-entry-routes.contract.test.tsx tests/order-entry.contract.test.ts tests/pricing-page.contract.test.ts tests/create-mode.page.test.ts tests/create-candidate-preview.contract.test.ts tests/runden-public-sharing-guide.contract.test.tsx tests/dossier-public-route.contract.test.tsx tests/dossier-output-studio.page.contract.test.ts tests/dossier-export-route-guards.test.ts tests/account-organization-page.contract.test.tsx tests/account-organization-dashboard.page.test.tsx tests/account-resume-workbench.contract.test.tsx tests/admin-review.page.test.tsx tests/admin-system-agentic-runtime-readiness.page.test.tsx tests/admin-access-entitlements-surface.contract.test.tsx tests/admin-region-page.render.test.tsx tests/voxy-experience-shell.contract.test.ts tests/agentic-civic-e2e-pilot.contract.test.ts tests/ai-trace-surface-truth.test.ts tests/frontend-ai-transparency.contract.test.ts tests/content-translation-rendering.test.tsx tests/language-bridge-trust-format-contract.test.ts tests/create-i18n.contract.test.ts tests/public-debug-leak.guard.test.ts`
  - Ergebnis: `26` Dateien, `93/93` Tests gruen
- `pnpm -C apps/web run lint`
  - Ergebnis: gruen
- `pnpm -C apps/web run build`
  - Ergebnis: gruen
- `pnpm -C apps/web run typecheck`
  - Ergebnis: gruen
- Hinweise:
  - `landing-clarity.contract`, `landing-information-architecture.contract` und `mobile-entry-routes.contract` emittieren weiter bekannte React-Warnungen zu nicht-booleanschen `fill`- und `priority`-Attributen, laufen aber gruen und sind kein Slice-Blocker

## Offene Folgepfade

- `GOV-CIVIC-ECON-01` bleibt `codex_ready`, aber bewusst docs-/contract-first
- `WORKTREE-COMMIT-CREATE-LEDGER-HANDOFF-14B2` bleibt maintenance-only
- kein neuer produktiver `codex_ready` Cluster wurde fuer Queue 03 angelegt
