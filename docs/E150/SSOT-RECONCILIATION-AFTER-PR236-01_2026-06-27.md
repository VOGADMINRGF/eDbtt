# SSOT-RECONCILIATION-AFTER-PR236-01

Datum: 2026-06-27
Status: erledigt

## Gepruefter main-Stand

- Referenz-Commit: `f7e9a537`
- Commit-Titel: `feat: add public participation space index (#236)`
- Ziel dieses Slices: reiner SSOT-/Docs-/Evidence-Abgleich nach den gemergten PRs `#223`, `#225`, `#227` und `#231-#236`

## Beruecksichtigte PRs

- `#223` Recover and isolate eDebatte live/create/review restdrift
- `#225` Create Planner multi-theme follow-up actions
- `#227` Voxy Co-Creation Access Contract / Issue `#224`
- `#231` participation space container contract
- `#232` participation place future contract
- `#233` public participation space shell
- `#234` harden public participation space shell
- `#235` polish public participation space shell
- `#236` public participation space index

## Was jetzt als erledigt gilt

- `POST-MERGE-PRODUCTION-SMOKE-22` bleibt als historisch belegter lokaler Build-/Smoke-Nachlauf nach PR `#223` kanonisch `done`.
- `CREATE-PLANNER-CORE-FOLLOWUP-23` bleibt als geschlossener Mehrthemen-UX-/Flow-Folgepfad nach PR `#225` kanonisch `done`.
- `PR-VOXY-COCREATION-ACCESS-01` bleibt als erledigter Contract-Slice nach PR `#227` kanonisch `done`.
- Die Participation-Slices `#231-#236` bleiben als erledigte Container-/Place-Future-/Shell-/Hardening-/Visual-Polish-/Index-Slices kanonisch `done`.
- `OpenTasks.md`, `ProductionReadinessMatrix.md` und die Category-Gap-Map sind auf denselben dokumentierten Stand nachgezogen.

## Was bewusst offen bleibt

- `CREATE-CLIENT-CLEANUP`
- `GLOBALS-CSS-REST-CLEANUP`
- `CREATE-PLACE-STREET-FOLLOWUP`
- `I18N-BILINGUAL-PRODUCT-SHELL-01`
- breiteres Self-Service ohne operator-verifizierte Betreiberkante ueber `AUTH-MEMBERSHIP-DIRECTORY-EXTERNAL-DIRECTORY-01`
- breiterer Region-Source-Adapter-/Automation-Folgepfad ueber `ADVANCED-SOURCE-AUTOMATION-POST-V1`
- breiterer Payment-/Checkout-Folgepfad ueber `BILLING-CONTRACT-EXTERNAL-CHECKOUT-01` und `BILLING-CHECKOUT-POST-V1`
- `MATERIAL-EXTRACTION-RUNTIME-PHASE-2-01`
- `LIVE-EXCELLENCE-PHASE-2-01`

Wichtige Einordnung:

- `PAYMENT-CHECKOUT-PROVIDER-V2-01` bleibt als erledigter Unterbau `done`; offen bleibt nur der breitere Folgepfad.
- `MATERIAL-EXTRACTION-JOBS-V2-01` bleibt als erledigter Job-/Guardrail-Unterbau `done`; offen bleibt nur die breitere Produktionsruntime.
- `SELF-PROVISIONING-PRODUCTION-01` bleibt als erledigter operator-reviewter v1-Pfad `done`; offen bleibt nur breiteres Self-Service ohne Betreiberkante.

## Guardrails

- keine Runtime-Aenderung
- keine UI-Aenderung
- keine routeAccess-Aenderung
- keine Billing-/Checkout-Implementierung
- kein Self-Service-Start
- keine Material-Runtime-Implementierung
- keine neue Map-/Geo-/Source-Automation
- keine neue CI-/Vercel-Behauptung ohne eigene Evidence

## Readiness-Lesart nach dem Abgleich

- Voxy Access = contract-ready, nicht runtime-/paywall-/checkout-ready
- Create Planner Core = UX-/flow-ready im dokumentierten Mehrthemen-Fall
- Participation Space = shell-/index-/container-ready, nicht self-service-/persistenz-/map-/vollworkflow-ready
- breiteres Self-Service, Source-Automation, Material-Runtime, Checkout/Billing und Live-Excellence bleiben Folgepfade

## Validierung in diesem Docs-Slice

Ausgefuehrt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`

Nicht neu ausgefuehrt:

- kein neuer Build
- keine neue Remote-/CI-/Vercel-Verifikation

Build-/Smoke- und feature-spezifische Aussagen werden in diesem Slice nur aus vorhandener Evidence fortgeschrieben.

## Empfehlung naechste PRs

1. `PRICING-FREEMIUM-TRUST-COPY-01`
2. `CREATE-CLIENT-CLEANUP`
3. `CREATE-PLACE-STREET-FOLLOWUP`
4. `MATERIAL-EXTRACTION-RUNTIME-PHASE-2-01`
5. ein bewusst gewaehlter Sub-Slice aus `LIVE-EXCELLENCE-PHASE-2-01`
