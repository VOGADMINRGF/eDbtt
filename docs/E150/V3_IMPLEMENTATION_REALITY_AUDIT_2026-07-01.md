# V3 Implementation Reality Audit

## 1. Kurzfazit

- Kein V3-Block aus `A` bis `R` ist im aktuellen Repo bereits als vollstaendig
  geschlossene V3-Faehigkeit `built`.
- Der reale Repo-Stand ist fuer `A` bis `R` ueberwiegend `partially_built`.
- `P Admin Handout / Usage Guide` ist `docs_only`.
- Fuer `A` bis `R` ergibt sich damit: `built = 0`, `partially_built = 17`,
  `docs_only = 1`, `missing = 0`, `unclear = 0`.
- V3 ist damit vollstaendig kartiert und reality-audited, aber nicht als
  End-to-End-Admin-, Runtime-, Test- und Handout-Stand umgesetzt.
- Die Endzielklaerung fuer Live, Claims, Dossier-/Social-Outputs und
  VoiceOpenGov-/programm wird ergaenzend in
  `docs/E150/V3_LIVE_CLAIMS_SOCIAL_PROGRAMM_ENDSTATE_2026-07-02.md` gefuehrt.
  Sie aendert die Reality-Klassifikation nicht: `partially_built` bleibt keine
  Abnahme. Die Klassifikation `partially_built` bedeutet: Basis vorhanden,
  V3-Endziel offen.

## 2. Methodik

- Geprueft wurden nur der reale Repo-Stand, vorhandene Tests, Admin-/Dashboard-
  Flaechen, Runtime-/API-/DB-Pfade sowie Handoff-/Public-Belege.
- Es wurde nichts neu gebaut.
- Es wurden keine Produktdateien, keine Runtime, keine Admin-UI und keine Tests
  veraendert.
- Status wurden nur vergeben, wenn dafuer konkrete Repo-Belege vorliegen.
- `built` bedeutet in diesem Audit nur: end-to-end geschlossen ueber Admin,
  Runtime, Tests und sichtbare Guardrails. Dieser Zustand liegt fuer keinen
  V3-Block vor.
- `partially_built` bedeutet in diesem Audit nie `done`, sondern reale Basis
  plus offenen Folgepfad bis mindestens `endstate_ready` oder bewusste
  Post-V3-Entscheidung.

## 3. Capability Audit

| Capability | Repo-Beleg / Dateien | Tests | Admin-/Dashboard-Sicht | Runtime/API/DB-Beleg | Handoff/Public-Beleg | Reality Status | Gap | Naechster Slice |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A Admin Control Center | `apps/web/src/app/admin/page.tsx`, `apps/web/src/features/admin/operatorConsoleReadModel.ts` | `operator-console-readmodel.contract`, `operator-console-page.contract`, `operator-console-no-fake-actions.contract` | `/admin`, `/admin/telemetry`, `/admin/entitlements`, `/admin/pricing/orders`, `/account/organization/dashboard` | `operatorConsoleReadModel` buendelt Orders, Entitlements, Review- und Ops-Signale; zusaetzliche Admin-APIs wie `/api/admin/dashboard/summary` und `/api/admin/entitlements` sind vorhanden | Verlinkt in bestehende Review-, Entitlement- und Pricing-Pfade, aber kein einheitlicher Publish-/Handoff-Hub | partially_built | Readmodels und Admin-Flaechen sind real vorhanden, aber kein zentrales V3-Control-Center fuer Review, Publish, Costs, Alerts, Assets und Validation | `V3-ADMIN-DASHBOARD-CONTROL-CENTER-01` |
| B Voxy Guided Experience | `apps/web/src/components/voxy/VoxyGuide.tsx`, `apps/web/src/features/voxy/{voxyCopy.ts,voxyAssets.ts,coCreationState.ts,accessContract.ts}` | `voxy-guide.render`, `voxy-copy.contract`, `voxy-cocreation-state-contract`, `voxy-access-contract` | keine eigene Voxy-Admin-Flaeche | Capability- und Asset-Layer in `accessContract.ts` und `voxyAssets.ts` vorhanden | Voxy ist in `/start`, `/create`, `/runden`, `/dossier`, `/swipes` sichtbar | partially_built | Reale Voxy-Basis ist vorhanden, aber nicht als plattformweite V3-Fuehrung ueber Review, Publish, Ops und Public Entry geschlossen | `V3-VOXY-GUIDED-EXPERIENCE-01` |
| C Handoff Integrity / Linkage Map | `apps/web/src/features/create/{createHandoffReviewQueueRuntimeBridge.ts,persistedHandoffReviewQueue.ts,dossierRuntime.ts,anlassraumRuntime.ts,participationSpaceRuntime.ts}` | `create-handoff.persistence.route`, `create-handoff-review-queue-runtime-bridge`, `dossier-publish-workflow`, `anlassraum-activation-workflow`, `participation-space-publish-workflow` | `/admin/review` mit Dossier-, Anlassraum- und Beteiligungsraum-Sektionen | `/api/create/handoffs`, `/api/admin/dossier-runtime/*`, `/api/admin/anlassraum-runtime/*`, `/api/admin/participation-space-runtime/*` | Runtime-Creation, Publish-/Activation-Pfade und Public-Runtime-Tests sind real vorhanden | partially_built | Die Kette ist teilverdrahtet, aber es fehlt eine zentrale Integritaetskarte mit Fehlermodi, Drift-Pruefung und gemeinsamer Admin-Sicht | `V3-HANDOFF-INTEGRITY-AND-LINKAGE-MAP-01` |
| D Automation Suggestion Engine | `apps/web/src/features/create/orchestratorIntentContract.ts`, `apps/web/src/app/round/manage/[slug]/merge/MergeWorkspaceClient.tsx` | `dialog-intelligence-contract`, `topic-deduplication-review`, `create-connection-suggestions.no-domain-fallback.contract`, `admin-region-cockpit.route` | `/admin/region` zeigt Suggestions/Guardrails, aber kein zentraler Suggestion-Hub | `/api/rounds/[slug]/assist-runs`, `/api/rounds/[slug]/assist-runs/[runId]/suggestions/[suggestionId]` | Suggestions bleiben non-binding und fuehren nichts automatisch aus | partially_built | Vorschlagslogik ist fragmentarisch runtime-wired, aber nicht als einheitlicher review-first Suggestion-Stack fuer Review, Publish und Ops geschlossen | `V3-AUTOMATION-SUGGESTION-ENGINE-01` |
| E DeepSearch / Cost Governance | `apps/web/src/app/api/contributions/analyze/researchEntitlementGate.ts`, `apps/web/src/features/ai/providerRoleRouting.ts` | `factcheck-entitlement-gate.contract`, `admin-ai-orchestrator-smoke.route`, `ai-provider-smoke-cli`, `pricing-no-hidden-ai-costs.contract`, `admin-ai-usage.route` | `/admin/telemetry/ai/orchestrator`, `/admin/telemetry/ai/usage` | Research-Gates in Analyze, Admin-AI-Usage-Thresholds und Provider-Routing sind vorhanden | Kein oeffentlicher DeepSearch-Pfad; alles bleibt provider-, lane- und admin-gated | partially_built | Es gibt Cost- und Provider-Gates, aber keinen end-to-end Approval-, Budget- und Audit-Workflow pro Research-Lauf | `V3-DEEPSEARCH-COST-GOVERNANCE-01` |
| F Pricing / Credits / Limits | `apps/web/src/app/{pricing/page.tsx,pricing/institutionen/page.tsx,order/page.tsx}`, `apps/web/src/config/{pricing.ts,credits.ts,limits.ts}`, `apps/web/src/lib/server/pricing/adminPricingControlReadModel.ts` | `pricing-page.contract`, `payment-checkout-session.contract`, `payment-entitlement-after-checkout.contract`, `admin-pricing-orders.route`, `admin-pricing-control-contract`, `pricing-no-hidden-ai-costs.contract` | `/admin/pricing/orders`, `/account/organization/dashboard` | `/api/billing/provider`, `/api/billing/checkout/session`, `/api/admin/pricing/orders` | Pricing-/Order-/Checkout-Handoffs und Public Pricing Pages sind real vorhanden | partially_built | Reale Pricing-/Billing-Basis ist da, aber kein geschlossenes V3-Credit-System fuer Research, Assets, Exporte und spaetere Suggestions | `V3-PRICING-CREDITS-LIMITS-01` |
| G Roles / Permissions / Entitlements / Access | `apps/web/src/app/admin/entitlements/AdminEntitlementsClient.tsx`, `apps/web/src/lib/server/entitlements/createEntitlements.ts`, `apps/web/src/app/api/admin/route-access/route.ts` | `admin-entitlements.route`, `paid-entitlements.contract`, `organization-dashboard.readmodel`, `account-organization-dashboard.page`, `create-handoff.persistence.route` | `/admin/entitlements`, `/admin/users`, `/admin/orgs/[id]`, `/account/organization/dashboard`, `/admin/region` | `/api/admin/entitlements`, `/api/session`, `/api/create/entitlements`, route override APIs | Productive Create-Handoffs und Org-Zugaenge haengen an Membership-/Entitlement-Gates | partially_built | Rollen-, Membership- und Entitlement-Wahrheit ist real vorhanden, aber noch nicht als durchgehende V3-Rechtekarte ueber alle Rollen und Surfaces harmonisiert | `V3-ROLES-PERMISSIONS-ENTITLEMENTS-01` |
| H Notifications / Realtime / Mail | `apps/web/src/features/ops/statusReport/mail.ts`, `apps/web/src/app/admin/newsletter/page.tsx`, `apps/web/src/app/api/admin/alerts/{settings,notify,test}/route.ts` | `status-report-mail-render.contract`, `status-report-scheduler.contract`, `status-report-no-double-send.contract`, `auth-2fa-email-code.route` | `/admin/newsletter`, Alert- und Status-Report-Pfade | Alert-APIs, Status-Report-Scheduler und Invite-/Verify-Mail-Routen sind vorhanden | Invite-/Mail-Handoffs existieren; kein einheitliches in-app Notification Center und keine echte Realtime-Schicht | partially_built | Mail- und Alert-Bausteine sind real, aber kein geschlossener V3-Notification-Stack fuer Review, Publish, Cost Gates, Incident und Validation | `V3-NOTIFICATIONS-REALTIME-MAIL-01` |
| I Incident / Recovery / Diagnostics / Maintenance | `apps/web/src/app/admin/{errors/page.tsx,system/page.tsx,create/attach-drafts/history-maintenance/page.tsx}` | `admin-system-ping.route`, `admin-graph-health.route`, `health-mongo.route`, `create-prepare-attach.history-maintenance.route`, `create-prepare-attach.history-maintenance.page` | `/admin/errors`, `/admin/system`, `/admin/telemetry`, `/admin/graph/health`, `/admin/create/attach-drafts/history-maintenance` | `/api/admin/errors/*`, `/api/admin/system/ping`, `/api/admin/ops/status-report`, `/api/health/*` | History-Maintenance greift in Draft-/Handoff-Pfade ein; keine separate oeffentliche Incident-Flaeche | partially_built | Diagnostics, Health und Maintenance sind vorhanden, aber kein zusammenhaengender Retry-/Rollback-/Maintenance-Runbook-Stack | `V3-INCIDENT-RECOVERY-MAINTENANCE-01` |
| J Database Admin Ops / Manual Creation / Override | `apps/web/src/app/admin/dossiers/[dossierId]/AdminDossierClient.tsx`, `apps/web/src/app/admin/review/{AdminDossierRuntimeCreationSection.tsx,AdminAnlassraumRuntimeCreationSection.tsx,AdminParticipationSpaceRuntimeCreationSection.tsx}` | `dossier-runtime-admin-creation`, `anlassraum-runtime-admin-creation`, `participation-space-runtime-admin-creation`, `admin-review.page` | `/admin/review`, `/admin/dossiers/[dossierId]`, `/admin/create/attach-drafts/history-maintenance` | Admin-Runtime-Creation- und Publish-/Activation-APIs fuer Dossier, Anlassraum und Beteiligungsraum sind vorhanden | Manuelle Runtime-Creation haengt direkt an review-approved Handoffs; keine versteckten Public-Schreibwege | partially_built | Punktuelle manuelle Eingriffe sind real vorhanden, aber nicht als vereinheitlichter auditpflichtiger V3-Admin-Ops-Pfad fuer Overrides, Slugs und QR geschlossen | `V3-DATABASE-ADMIN-OPS-MANUAL-CREATION-01` |
| K Image Generation / Voxy Assets / Dossier Covers | `apps/web/src/features/voxy/voxyAssets.ts`, `apps/web/src/app/admin/reports/assets/page.tsx`, `apps/web/src/app/api/admin/reports/assets/route.ts` | `share-ready-asset-contract`, `social-output-contract`, `themenradar-share-ready-consistency.contract`, `dossier-output-studio.page.contract` | `/admin/reports/assets`, `/admin/themenradar/[id]` share-ready action | Report-Asset-CRUD, Status-, Revision- und Publish-Routen sind vorhanden; Studio liefert Asset-Kanaele wie `qr_asset` und `instagram_asset` | Share-/Output-Assets sind in Dossier-, Stream- und Topic-Routen sichtbar | partially_built | Asset-Basis ist real vorhanden; generative Bildruntime, Cost Gates und V3-Governance fuer generated media fehlen | `V3-IMAGE-GENERATION-VOXY-ASSETS-DOSSIER-OUTPUTS-01` |
| L Templates / Default Muster / Output Standards | `docs/E150/voxy-default-debate-template.md`, `apps/web/src/app/dossier/[id]/studio/page.tsx`, `apps/web/src/app/api/dossier/[id]/studio/workspace/route.ts` | `dossier-output-studio.page.contract`, `dossier-studio-workspace.route`, `studio-distribution-panel.contract`, `share-ready-asset-contract` | Dossier Studio plus Admin-Themenradar Share-ready-Pfad | Output-Engine-/Studio-Workspace-Runtime existiert | Output packages ueberbruecken Dossier zu Share-/Export-/Studio-Pfaden | partially_built | Einzelne Templates und Output-Contracts sind real, aber keine kanonische V3-Template-Familie ueber alle relevanten Surface-Typen | `V3-TEMPLATE-OUTPUT-STANDARDIZATION-01` |
| M QR / Sharing / Public Entry / Slug Stability | `apps/web/src/features/{share/metadata.ts,participation/publicParticipationSpaceRuntime.ts}`, `apps/web/src/app/{qr/[qrId]/page.tsx,qr-studio/page.tsx}` | `qr-event-entry-mobile.contract`, `event-qr-entry.contract`, `participation-space-public-route-runtime`, `anlassraum-public-route-runtime`, `share-ready-asset-contract` | `/qr-studio`, `/api/admin/qr/sets/summary`, `/api/admin/campaigns/[id]/qr` | `/api/qr/resolve`, `/api/qr/sets*`, published participation-space runtime | `/beteiligung`, `/round/[slug]`, `/topic/[slug]` und Companion-/Share-Pfade sind real vorhanden | partially_built | QR-, Share- und Public-Entry-Basis ist real, aber keine einheitliche V3-Pruef- und Safety-Schicht fuer Slugs, QR und Share-Preview | `V3-QR-SHARING-PUBLIC-ENTRY-01` |
| N Test Results / Regression / E2E / Smoke | `.github/workflows/production-validation.yml`, `package.json` mit `release:validate:production` | `e2e-critical-journeys`, `dossier-publish-workflow`, `anlassraum-activation-workflow`, `participation-space-publish-workflow`, `admin-review.page`, `admin-ai-orchestrator-smoke.route` | keine zentrale Testmatrix-UI | Production-Validation-Workflow und Release-Validation sind vorhanden | Guardrail-Smokes decken Public-, Publish- und Activation-Pfade ab | partially_built | Breite Testbasis ist real vorhanden, aber keine capability-basierte V3-Coverage- und Gap-Landkarte | `V3-TEST-RESULTS-REGRESSION-MATRIX-01` |
| O Monitoring / Alerting / Rollback | `apps/web/src/app/admin/telemetry/ai/orchestrator/page.tsx`, `apps/web/src/app/api/admin/ops/status-report/route.ts`, `apps/web/src/app/api/health/system-matrix/route.ts` | `status-report-shape.contract`, `admin-ai-usage.route`, `admin-ai-telemetry-events.route`, `admin-graph-health.route` | `/admin/telemetry/*`, `/admin/system`, Alert- und Status-Report-Flaechen | Health-, Telemetry-, Usage- und Status-Report-APIs sind vorhanden | Beobachtung greift indirekt auf Review-/Publish-/Activation-Pfade; kein echter Rollback-Loop | partially_built | Observability-Basis ist real, aber keine belastbare Rollback-Orchestrierung und kein durchgehender Incident-to-action-Pfad | `V3-MONITORING-ALERTING-ROLLBACK-01` |
| P Admin Handout / Usage Guide | `docs/E150/HANDOUT_ADMIN_NUTZUNG_EDEBATTE_V3.md` | keine | keine eigene Runtime-Flaeche | kein Runtime-/API-/DB-Beleg | kein Handoff-/Public-Beleg | docs_only | Das Handout existiert nur als Dokumentationsstand und ist noch nicht 1:1 gegen die reale Admin-UI validiert | `V3-ADMIN-HANDOUT-AND-USAGE-GUIDE-01` |
| Q Prompt-based Maintenance / Low-Ops | `apps/web/src/app/api/chat/route.ts`, `apps/web/src/app/companion/[slug]/page.tsx` | `chat-route.contract`, `route-bound-companion.contract`, `journalism-companion-contract` | kein Low-Ops-Adminpanel; nur AI-Telemetry-/Orchestrator-Diagnostik | Route-bound Companion mit `guided_workspace` und `journalist_companion` ist runtime-wired; `noTruthPromotion` und `noAutoGraphPromotion` sind explizit | Companion-Pfade sind ueber `/topic/[slug]`, `/round/[slug]`, `/dossier/[id]` oeffentlich verlinkbar | partially_built | Prompt-/Companion-Basis ist real, aber keine adminseitige Maintenance-Aktionsebene mit Rechte-, Kosten- und Audit-Paritaet | `V3-PROMPT-BASED-MAINTENANCE-AND-LOW-OPS-01` |
| R Voxy + User/Public Guidance across Start/Create/Review/Public Routes | `apps/web/src/app/{start/LandingStart.tsx,create/CreateClient.tsx,dossier/ui.tsx,runden/page.tsx}`, `apps/web/src/features/surfaces/swipes/SwipesSurface.tsx` | `voxy-guide.render`, `voxy-copy.contract`, `route-bound-companion.contract` | kein entsprechender Review-/Publish-/Admin-Voxy-Pfad | Voxy-UI und route-bound Companion sind real vorhanden, aber getrennt | `/start`, `/create`, `/runden`, `/dossier`, `/swipes`, `/companion/*` sind sichtbar; `/admin/review` ist nicht Teil derselben Guidance-Familie | partially_built | Public/User-Guidance ist real, aber nicht systematisch bis Review, Publish, Pricing, Incident und Ops durchgezogen | `V3-VOXY-GUIDED-EXPERIENCE-01` |

## 4. Abweichungen zur V3 Total Scope Readiness Map

- `K Image Generation / Voxy Assets / Dossier Covers` ist im Repo nicht
  `missing`, sondern `partially_built`, weil Asset-, Share-ready-,
  Studio- und Admin-Asset-Pfade real vorhanden sind.
- `D Automation Suggestion Engine` ist nicht nur Zielbild, sondern
  fragmentarisch runtime-wired ueber Assist-Runs, Suggestion-Mapping und
  Review-first Guardrails.
- `E DeepSearch / Cost Governance` ist nicht nur Folgeplanung, sondern mit
  realen Provider-, Threshold- und Entitlement-Gates fragmentarisch vorhanden.
- `Q Prompt-based Maintenance / Low-Ops` ist nicht nur Idee, sondern ueber
  route-bound Companion und `guided_workspace` fragmentarisch runtime-wired.
- `B` und `R` bestaetigen: Voxy ist real vorhanden, aber nicht als
  plattformweite V3-End-to-End-Fuehrung geschlossen.
- `F`, `G`, `H`, `I`, `J`, `L`, `M`, `N` und `O` sind jeweils nicht leer,
  sondern mit vorhandener Basis `partially_built`.
- Kein Capability-Block `A` bis `R` darf aktuell als `built` bezeichnet
  werden.

## 5. Priorisierte naechste Schritte

1. `V3-HANDOFF-INTEGRITY-AND-LINKAGE-MAP-01`
2. `V3-ADMIN-DASHBOARD-CONTROL-CENTER-01`
3. `V3-TEST-RESULTS-REGRESSION-MATRIX-01`
4. `V3-PRICING-CREDITS-LIMITS-01`
5. `V3-ROLES-PERMISSIONS-ENTITLEMENTS-01`
6. `V3-NOTIFICATIONS-REALTIME-MAIL-01`
7. `V3-INCIDENT-RECOVERY-MAINTENANCE-01`
8. `V3-DATABASE-ADMIN-OPS-MANUAL-CREATION-01`
9. `V3-VOXY-GUIDED-EXPERIENCE-01`
10. `V3-TEMPLATE-OUTPUT-STANDARDIZATION-01`
11. `V3-QR-SHARING-PUBLIC-ENTRY-01`
12. `V3-PROMPT-BASED-MAINTENANCE-AND-LOW-OPS-01`

## 6. Was ausdruecklich nicht gebaut wurde

- keine Produktdateien
- keine Runtime-Logik
- keine Admin-UI
- keine neuen APIs
- keine neuen Tests
- keine neue Automatisierung
- keine neue Bildgenerierungsruntime
- keine neue Pricing-/Credit-Logik
- keine neue Rechte- oder Handoff-Logik

## 7. Akzeptanzkriterien fuer Folge-Slices

Ein Folge-Slice darf erst als `built` oder als geschlossen bezeichnet werden,
wenn:

1. die Capability in einer realen Admin-/Dashboard-Sicht sichtbar ist,
2. die Capability ueber reale Runtime-/API-/DB-Belege verfuegt, soweit fuer
   die Faehigkeit notwendig,
3. die relevanten Guardrails und Kernfaelle testseitig belegt sind,
4. Handoff- oder Public-Verhalten dort belegt ist, wo die Capability diese
   Pfade beruehrt,
5. `OpenTasks.md`, `ProductionReadinessMatrix.md` und die zugehoerige
   Evidence-Datei denselben Status fuehren,
6. keine Teilbasis mehr als V3-End-to-End-Reife verkauft wird.
