# V3 Total Scope Readiness Map

## 1. Executive Summary

- `#277` ist als Governance-Basis korrekt, aber zu eng auf Automatisierung
  formuliert.
- V3 muss breiter kanonisiert werden.
- V3 ist gefuehrte Betriebs- und Automatisierungsreife.
- Ziel ist eine Voxy-gefuehrte, admin-steuerbare, getestete und weitgehend
  wartungsarme Plattform.
- Dieser Slice baut nichts, sondern erstellt die Gesamtkarte.

Dieses Dokument ist docs-only, audit-only und roadmap-only. Es baut keine
Produktlogik, keine Runtime, keine Admin-UI, keine Automatisierung, kein
Pricing, keine Bildgenerierung und keine DB-Ops.

Der Abgleich gegen den tatsaechlichen Repo-Stand wird ergaenzend in
`docs/E150/V3_IMPLEMENTATION_REALITY_AUDIT_2026-07-01.md` gefuehrt.

## 2. Korrigierte V3-Definition

- V1 = Produktivitaet
- V2 = Plattformreife
- V3 = gefuehrte Betriebs- und Automatisierungsreife

V3 umfasst:

- Voxy Guided Experience
- Admin Control Center
- Automation Suggestions
- Handoff Integrity
- Pricing / Credits / Limits
- Rollen / Rechte / Zugriff
- Notifications / Realtime / Mail
- Incident / Recovery / Maintenance
- Database/Admin Ops
- Image Generation / Assets
- Templates / Output Standards
- QR / Sharing / Public Entry
- DeepSearch / Cost Governance
- Tests / E2E / Regression
- Monitoring / Alerting / Rollback
- Handout / Usage Guide
- prompt-basierte Wartung

## 3. V3 Capability Map

| Capability | Current repo evidence | Status | V3 gap | Suggested slice |
| --- | --- | --- | --- | --- |
| A. Admin Control Center | `/admin`, `/admin/review`, `/admin/feeds`, `/admin/telemetry/*`, `/account/organization/dashboard`, `apps/web/src/features/admin/operatorConsoleReadModel.ts` | operational-basic | Sicht ist verteilt; kein einheitliches Kontrollzentrum fuer Review, Publish, Costs, Alerts, Assets und Tests | `V3-ADMIN-DASHBOARD-CONTROL-CENTER-01` |
| B. Voxy Guided Experience | `apps/web/src/components/voxy/VoxyGuide.tsx`, `apps/web/src/features/voxy/{voxyCopy.ts,voxyAssets.ts,coCreationState.ts}`, Voxy-Nutzung in `/start`, `/create`, `/runden`, `/dossier`, `/swipes` | operational-basic | Voxy ist sichtbar, aber nicht als plattformweite Fuehrungs- und Moderationsschicht kanonisiert; Shared-Copy-/Guide-Drift bleibt offen | `V3-VOXY-GUIDED-EXPERIENCE-01` |
| C. Handoff Integrity / Linkage Map | `createHandoffReviewQueue*`, `features/reviewQueue.ts`, `dossierRuntime.ts`, `anlassraumRuntime.ts`, `participationSpaceRuntime.ts`, Publish-/Public-Route-Tests | operational-basic | Viele Pfade sind runtime-wired, aber es gibt keine zentrale Integritaetskarte mit Fehlermodi und Admin-Sicht | `V3-HANDOFF-INTEGRITY-AND-LINKAGE-MAP-01` |
| D. Automation Suggestion Engine | `docs/E150/V3_AUTOMATION_ROADMAP_AND_GOVERNANCE_2026-07-01.md`, AI-/guided workspace surfaces, `apps/web/src/app/api/chat/route.ts` | planned | Review-first Vorschlaege sind beschrieben, aber nicht als eigene Slice-Familie mit Audit- und Guardrail-Tests gebaut | `V3-AUTOMATION-SUGGESTION-ENGINE-01` |
| E. DeepSearch Cost Governance | `apps/web/src/app/api/contributions/analyze/researchEntitlementGate.ts`, `features/security/routeSecurityInventory.ts`, `tests/factcheck-enqueue.auth.route.test.ts`, `tests/pricing-no-hidden-ai-costs.contract.test.ts` | planned | Einzelne Cost- und Entitlement-Gates existieren, aber kein sichtbarer V3-Cost-Gate-, Approval- und Auditpfad | `V3-DEEPSEARCH-COST-GOVERNANCE-01` |
| F. Pricing / Credits / Limits | `features/pricing/*`, `/pricing`, `/pricing/institutionen`, `/order`, `/admin/pricing/orders`, `/api/billing/{provider,checkout/session}`, Pricing-/Checkout-/Hidden-Cost-Tests | operational-basic | Pricing ist fuer V1/V2 vorhanden, aber V3 braucht kanonische Credits, Limits und Cost-Gates fuer DeepSearch, Assets, Exporte und spaetere Suggestions | `V3-PRICING-CREDITS-LIMITS-01` |
| G. Roles / Permissions / Entitlements / Access | `/admin/entitlements`, `apps/web/src/lib/server/entitlements/createEntitlements.ts`, `features/region/{organizationDashboard.ts,organizationContracts.ts,server/paidEntitlements.ts}`, route overrides | operational-basic | Access und Entitlements existieren verteilt, aber noch nicht als V3-weite Rollen-/Rechte-Landkarte fuer Admin, Redaktion, Organisation, Kommune und Medienpartner | `V3-ROLES-PERMISSIONS-ENTITLEMENTS-01` |
| H. Notifications / Realtime / Mail | `apps/web/src/app/api/admin/alerts/{settings,notify,test}/route.ts`, status report mail, org invite mails, `/admin/newsletter` | operational-basic | Mail- und Alert-Bausteine existieren, aber keine zentrale V3-Notification-Schicht fuer Review, Publish, Cost Gates, Incidents und Validation | `V3-NOTIFICATIONS-REALTIME-MAIL-01` |
| I. Incident / Recovery / Diagnostics / Maintenance Mode | `/admin/errors`, `/admin/system`, `/api/admin/ops/status-report`, `/admin/telemetry/ai/orchestrator`, Health-Routes, `history-maintenance` | operational-basic | Diagnostics und Ops-Checks existieren, aber kein kanonisches Incident-/Recovery-/Retry-/Maintenance-Zielbild | `V3-INCIDENT-RECOVERY-MAINTENANCE-01` |
| J. Database Admin Ops / Manual Creation / Override | Admin runtime-creation/publish sections in `/admin/review`, `AdminDossierClient` finding override, `/admin/create/attach-drafts/history-maintenance`, manual Anlassraum setup | operational-basic | Kontrollierte manuelle Eingriffe sind punktuell moeglich, aber nicht als durchgehender auditpflichtiger V3-Admin-Ops-Pfad beschrieben | `V3-DATABASE-ADMIN-OPS-MANUAL-CREATION-01` |
| K. Image Generation / Voxy Assets / Dossier Covers | `apps/web/public/brand/voxy/*`, `apps/web/src/features/voxy/voxyAssets.ts`, Share-/Output-Assets, keine Image-Generation-Route | missing | Es gibt statische Assets, aber keine kanonische Governance fuer generierte Bilder, Cover, Asset-Review, Cost Gates und Public Safety | `V3-IMAGE-GENERATION-VOXY-ASSETS-DOSSIER-OUTPUTS-01` |
| L. Templates / Default Muster / Output Standards | `docs/E150/voxy-default-debate-template.md`, `features/anlassraum/shareReadyAssetContract.ts`, `features/outputEngine/{contracts.ts,formatMappers.ts,distributionExport.ts}`, stream template usage | operational-basic | Einzelne Templates und Output-Contracts existieren, aber keine V3-weite Standardisierung fuer Dossier, Anlassraum, Beteiligungsraum, Handout, Visuals und Exporte | `V3-TEMPLATE-OUTPUT-STANDARDIZATION-01` |
| M. QR Code / Sharing / Public Entry / Slug Stability | `features/qr/*`, `/qrcodegenerator`, `/qrcodewizard`, `/qr/[qrId]`, `/api/qr/*`, Share metadata, `shareReadyAssetContract`, slug handling in public runtimes | operational-basic | QR-, Share- und Slug-Bausteine existieren, aber nicht als einheitlicher V3-Pfad mit Admin-Pruefung, Public Safety und stabiler Entry-Lesart | `V3-QR-SHARING-PUBLIC-ENTRY-01` |
| N. Test Results / Regression / E2E / Smoke | `production-validation.yml`, `release:validate:production`, `tests/e2e-critical-journeys.test.ts`, viele route/UI/guardrail contracts | operational-basic | Tests sind breit vorhanden, aber es fehlt die zentrale V3-Testlandkarte mit Gap-Sicht, Slice-Zuordnung und E2E-/Smoke-Abdeckung | `V3-TEST-RESULTS-REGRESSION-MATRIX-01` |
| O. Monitoring / Alerting / Rollback | status report, alerts routes, telemetry pages, health routes, manueller release gate | operational-basic | Monitoring-/Alerting-Bausteine existieren, aber noch kein belastbarer zusammenhaengender Betriebs- und Rollback-Pfad | `V3-MONITORING-ALERTING-ROLLBACK-01` |
| P. Admin Handout / Usage Guide | `docs/E150/HANDOUT_ADMIN_NUTZUNG_EDEBATTE_V3.md` | planned | Stub ist vorhanden, aber noch nicht mit realer UI-, Rollen-, Cost-, Asset- und Incident-Lesart abgeglichen | `V3-ADMIN-HANDOUT-AND-USAGE-GUIDE-01` |
| Q. Prompt-based Maintenance / Low-Ops Operation | `guided_workspace` in chat routes, AI orchestrator diagnostics, route-bound companion patterns, Voxy guided flows | planned | Prompt-/guided Eingaben existieren, aber noch kein kanonischer Low-Ops-Wartungspfad im Rechte- und Review-Kontext | `V3-PROMPT-BASED-MAINTENANCE-AND-LOW-OPS-01` |
| R. Voxy + User/Public Guidance across Start/Create/Review/Public Routes | `VoxyGuide` in `/start`, `/create`, `/runden`, `/dossier`, `SwipesSurface`, companion/guided workspace routes | operational-basic | Voxy fuehrt einzelne Surfaces, aber noch nicht systematisch Admin, Review, Publish, Public Entry und Unsicherheitskommunikation | `V3-VOXY-GUIDED-EXPERIENCE-01` |

## 4. Admin / Dashboard Zielbild

Admin muss nach V3 moeglichst alles steuern koennen:

- Review Queues
- Public Moderation
- Dossier Publish
- Anlassraum Activation/Publish
- Beteiligungsraum Publish
- Handoff Integrity
- Automation Suggestions
- Voxy Guidance Settings
- Pricing/Credit/Plan-Zuweisung
- Roles/Permissions/Entitlements
- Notifications/Alerts
- Incident/Diagnostics
- Retry/Block/Reject/Rollback
- Manual Creation / Override
- QR/Sharing
- Image/Asset Requests
- Templates/Output Standards
- Production Validation / E2E
- Monitoring Status

Aktueller Gap:

- Diese Flaechen existieren verteilt ueber `/admin`, `/admin/review`,
  `/admin/pricing/orders`, `/admin/entitlements`, `/admin/telemetry/*`,
  `/admin/errors`, `/admin/system`, `/admin/feeds` und
  `/account/organization/dashboard`.
- Ein zentrales V3-Control-Center existiert noch nicht.

## 5. Voxy Zielbild

Voxy ist V3-Kernbestandteil, nicht nur Deko.

Voxy darf:

- erklaeren
- fuehren
- warnen
- moderieren
- naechste Schritte sichtbar machen
- Admin und Nutzer durch Review-/Publish-/Handoff-Flows begleiten
- Themen und Dossiers visuell begleiten
- Guardrails verstaendlich uebersetzen
- Unsicherheit und fehlende Quellen erklaeren

Voxy darf nicht:

- veroeffentlichen
- verifizieren
- Wahrheit behaupten
- Review ersetzen
- DeepSearch ohne Cost Gate starten
- Entscheidungen treffen

Voxy-relevante Folgepfade:

- `V3-VOXY-GUIDED-EXPERIENCE-01`
- `V3-VOXY-ASSET-AND-IMAGE-GOVERNANCE-01`

## 6. Pricing / Credits / Rollen

V3-Pflichtblock:

- Plaene / Pakete / Credits / Limits
- Free / User / Admin / Redaktion / Organisation / Kommune / Medienpartner
- Credit-Verbrauch fuer DeepSearch, Bildgenerierung, Dossier-Entwuerfe,
  Exporte
- Entitlements und Billing muessen Admin-sichtbar sein
- keine hidden costs
- kein kostenpflichtiger Lauf ohne explizites Gate
- Tests fuer Plan-/Credit-Gates

Folgepfade:

- `V3-PRICING-CREDITS-LIMITS-01`
- `V3-ROLES-PERMISSIONS-ENTITLEMENTS-01`

## 7. Notifications / Realtime / Mail

Admin muss Meldungen erhalten bei:

- neuer Public Submission
- Eskalation
- SLA overdue
- Publish Request
- Activation Request
- Handoff Failure
- DeepSearch Cost Gate Request
- Image Generation Request
- Incident / API Failure
- Production Validation Failure
- Monitoring Alert

Kanaele:

- Dashboard
- In-App
- Email
- optional Realtime spaeter

Folgepfad:

- `V3-NOTIFICATIONS-REALTIME-MAIL-01`

## 8. Incident / Recovery / Problembehebung

Admin muss Fehler sehen und behandeln koennen:

- Fehlerstatus
- Ursache / betroffener Pfad
- Retry moeglich?
- Block / Reject
- Rollback
- Wartungsmodus
- Audit Trail
- Diagnoseansicht
- prompt-basierte Hilfestellung fuer Problemloesung

Folgepfad:

- `V3-INCIDENT-RECOVERY-MAINTENANCE-01`

## 9. Database / Manual Ops

Admin braucht kontrollierte manuelle Eingriffe:

- Dossier manuell anlegen / korrigieren
- Anlassraum manuell anlegen / korrigieren
- Beteiligungsraum manuell anlegen / korrigieren
- Review Item manuell erzeugen / verschieben
- Source/Handoff korrigieren
- Slug/QR/Sharing korrigieren
- Audit verpflichtend
- keine unsichtbaren DB-Schreibwege

Folgepfad:

- `V3-DATABASE-ADMIN-OPS-MANUAL-CREATION-01`

## 10. Image Generation / Assets / Dossier Outputs

- Voxy-Themenbilder
- Dossier-Cover
- Anlassraum-/Beteiligungsraum-Visuals
- Social-/Share-Assets
- Light/Dark kompatibel
- Default VOG/eDebatte/Voxy-Stil
- Bild ist Asset, kein Beweis
- Asset Review vor Veroeffentlichung
- Kosten-/Credit-Gate
- Tests fuer Asset-Meta, Status, Review und Public Safety

Folgepfade:

- `V3-VOXY-ASSET-AND-IMAGE-GOVERNANCE-01`
- `V3-IMAGE-GENERATION-VOXY-ASSETS-DOSSIER-OUTPUTS-01`

## 11. Templates / Muster / Output Standards

- Default-Beitragsvorlage
- Dossier-Template
- Anlassraum-Template
- Beteiligungsraum-Template
- Handout-Template
- Visual Default Template
- QR/Share-Template
- Export-/PDF-Zielbild
- Output-Contract-Tests

Folgepfad:

- `V3-TEMPLATE-OUTPUT-STANDARDIZATION-01`

## 12. QR / Sharing / Public Entry

- QR fuer Beteiligungsraum
- QR fuer Anlassraum
- QR fuer Dossier
- stabile Slugs
- Public URL Preview
- keine internen IDs
- Admin kann QR/Share pruefen
- Tests fuer Public Safety

Folgepfad:

- `V3-QR-SHARING-PUBLIC-ENTRY-01`

## 13. Tests / Testergebnisse / Regression

V3 braucht eine zentrale Test-Ergebnis-Landkarte:

- vorhandene Tests
- fehlende Tests
- welche Slices welche Tests brauchen
- Admin UI Tests
- Handoff Tests
- Pricing/Credit Tests
- Notification Tests
- Incident Tests
- Asset Tests
- QR Tests
- Template Tests
- E2E Browser
- Production Validation
- Monitoring Smoke
- Guardrail Regression

Folgepfad:

- `V3-TEST-RESULTS-REGRESSION-MATRIX-01`

## 14. Prompt-basierte Wartung / Low-Ops Betrieb

Ziel ist wartungsarm:

Admin soll moeglichst per Prompt oder gefuehrter Eingabe arbeiten koennen:

- "Erstelle Dossier-Vorschlag aus geprueften Hinweisen"
- "Zeige fehlgeschlagene Handoffs"
- "Erklaere, warum Veroeffentlichung blockiert ist"
- "Erzeuge Voxy-Themenbild-Vorschlag"
- "Bereite QR-Code und Share-Text vor"
- "Pruefe Credit-Auswirkung"
- "Starte Retry fuer fehlgeschlagenen Job"

Aber:

Prompt darf nur Vorschlaege oder Actions im Review- und Rechtekontext
erzeugen, keine stillen oeffentlichen Entscheidungen.

Folgepfad:

- `V3-PROMPT-BASED-MAINTENANCE-AND-LOW-OPS-01`

## 15. Gesamt-Fahrplan mit Reihenfolge

Phase V3.0 Scope-Korrektur:

1. `V3-TOTAL-SCOPE-READINESS-MAP-01`

Phase V3.1 Kontrollzentrum und Integritaet:

2. `V3-ADMIN-DASHBOARD-CONTROL-CENTER-01`
3. `V3-HANDOFF-INTEGRITY-AND-LINKAGE-MAP-01`
4. `V3-TEST-RESULTS-REGRESSION-MATRIX-01`

Phase V3.2 Experience und Nutzungsfuehrung:

5. `V3-VOXY-GUIDED-EXPERIENCE-01`
6. `V3-TEMPLATE-OUTPUT-STANDARDIZATION-01`
7. `V3-ADMIN-HANDOUT-AND-USAGE-GUIDE-01`

Phase V3.3 Monetarisierung und Zugriff:

8. `V3-PRICING-CREDITS-LIMITS-01`
9. `V3-ROLES-PERMISSIONS-ENTITLEMENTS-01`

Phase V3.4 Betrieb / Meldungen / Recovery:

10. `V3-NOTIFICATIONS-REALTIME-MAIL-01`
11. `V3-INCIDENT-RECOVERY-MAINTENANCE-01`
12. `V3-MONITORING-ALERTING-ROLLBACK-01`

Phase V3.5 Assets / Public Distribution:

13. `V3-IMAGE-GENERATION-VOXY-ASSETS-DOSSIER-OUTPUTS-01`
14. `V3-QR-SHARING-PUBLIC-ENTRY-01`

Phase V3.6 Automatisierung:

15. `V3-AUTOMATION-SUGGESTION-ENGINE-01`
16. `V3-DEEPSEARCH-COST-GOVERNANCE-01`
17. `V3-PROMPT-BASED-MAINTENANCE-AND-LOW-OPS-01`

Phase V3.7 Haertung:

18. `V3-EXTERNAL-BROWSER-E2E-01`
19. `V3-MODERATION-RBAC-NOTIFICATIONS-01`, falls es nach Rollen- und
    Notification-Slices noch als eigener Moderationspfad bestehen muss

## 16. Was V3 erst am Ende als "reif" gelten laesst

V3 ist erst reif, wenn:

- Admin Control Center funktioniert
- Voxy sichtbar und sinnvoll fuehrt
- Pricing/Credits/Limits greifen
- Rollen/Rechte/Entitlements sauber sind
- Notifications/Alerts funktionieren
- Problembehebung/Retry/Rollback basic vorhanden ist
- manuelle Admin-Ops auditierbar sind
- Bild-/Asset-/Output-/Template-Pfade review-first sind
- QR/Sharing public-safe ist
- Testmatrix und E2E-Smokes existieren
- Handout mit echter UI uebereinstimmt
- prompt-basierte Wartung keine Guardrails umgeht

## Ergebnis

`#277` bleibt als Governance-Basis richtig, aber V3 ist kanonisch breiter:

- nicht nur Automatisierung
- sondern gefuehrte Betriebs- und Automatisierungsreife
- auf Basis von Admin-Steuerbarkeit, Voxy-Fuehrung, Pricing-/Access-Gates,
  Alerts, Low-Ops und testbarer Public Safety
