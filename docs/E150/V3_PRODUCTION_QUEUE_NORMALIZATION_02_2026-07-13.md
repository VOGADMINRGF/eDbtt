# V3 Production Queue Normalization 02

Datum: 2026-07-13
Branch: `pr/v3-production-queue-normalization-02`
Task: `V3-PRODUCTION-QUEUE-NORMALIZATION-02`

## Ausgangslage nach #368

Nach Merge der Produktionscluster `#363` bis `#368` war die erste normalisierte Queue weitgehend abgearbeitet:

- `#363` Produktionsqueue normalisiert
- `#364` Auth / Account / Organization / Access
- `#365` Dossier / Claims / Factcheck / Review
- `#366` Feed / Source / Intake / Review-Handoff
- `#367` Public QA / Mobile / Debug-Leak / CTA
- `#368` Admin / Operator / Review-Workbench

Der Runner fand danach in `docs/E150/OpenTasks.md` praktisch keine weiteren echten produktiven `codex_ready` Cluster mehr.

Wichtig fuer die Pflichtlektuere:

- `AGENTS.md` wurde gelesen.
- `docs/E150/OpenTasks.md` wurde als SSOT gelesen.
- `.codex/prompts/lean-continuous-slice-runner.md` wurde gelesen.
- Die Audits aus `#363` bis `#368` wurden gelesen.
- `docs/E150/CODEX_AUTONOMOUS_OPERATING_MODEL.md` war weder lokal noch auf `origin/main` vorhanden. Die Queue-Normalisierung stutzt sich deshalb auf die vorhandene Repo-SSOT und die Runner-Regeln im lokalen Prompt.

## Welche Tasks noch uebrig waren und warum sie nicht reichen

Nach `#368` blieben operativ im Kern nur:

- `GOV-CIVIC-ECON-01`
  - legitim `codex_ready`, aber bewusst docs-/contract-first
  - kein priorisierter produktiver Cluster
- `WORKTREE-COMMIT-CREATE-LEDGER-HANDOFF-14B2`
  - maintenance-only
  - kein Produktcluster

Zusaetzlich blieben mehrere breitere oder laufende Parent-Pfade:

- `V3-DOSSIER-SOCIAL-OUTPUT-DRAFTS-01`
- `V3-UNIFIED-REVIEW-QUEUE-01`
- `V3-DOSSIER-WORKSPACE-REVIEW-SURFACE-01`
- `V3-ROLES-PERMISSIONS-ENTITLEMENTS-01`
- `I18N-BILINGUAL-PRODUCT-SHELL-01`

Diese Eintraege waren fuer den Runner zu breit, bereits `in_progress` oder nicht klar genug in einen kleinen produktiven PR-Slice geschnitten.

## Neu als codex_ready normalisierte Produktcluster

Die neuen Tasks wurden nur dort angelegt, wo bestehende Routen, Tests, Contracts oder Audits eine reale Produktbasis belegen.

1. `V3-E2E-CREATE-REVIEW-DOSSIER-ACCOUNT-FLOW-HARDENING-01`
   - abgeleitet aus bestehendem `/create`-, Review-, Dossier- und Account-Pfad
   - Basis: `PR-CREATE-WORKFLOW-LIVE-QA-01`, `PR-CREATE-ANLASSRAUM-DOSSIER-FEED-E2E-01`, Audits `#364` bis `#368`

2. `V3-DOSSIER-EXPORT-SHARE-PUBLISH-READY-GUARD-01`
   - abgeleitet aus bestehendem Dossier-Studio, Output-Engine, Share-Distribution und Review-first Export
   - Basis: `PR-OUT-ENGINE-09`, `PR-OUT-EXPORT-01`, `PR-SHARE-DIST-01`, `PR-EDITORIAL-SERIES-01`

3. `V3-ROUTE-INVENTORY-LEGACY-PATH-HARDENING-01`
   - abgeleitet aus bestehender Route-/Alias-/Legacy-Wahrheit fuer `/order`, `/vormerken`, `/mitglied-werden`, `/start`, `/pricing`, `/register`
   - Basis: `productionEntryContract`, Wrapper-/Membership-Contracts, Public-QA-Audit

4. `V3-MEMBERSHIP-ENTITLEMENT-PACKAGE-ACTIVATION-HARDENING-01`
   - abgeleitet aus bestehenden Pricing-, Order-, Provisioning-, Entitlement- und Org-Dashboard-Pfaden
   - Basis: Billing-/Provisioning-Audits, `#364`, `#361`

5. `V3-LANGUAGE-BRIDGE-MULTILINGUAL-SURFACE-HARDENING-01`
   - abgeleitet aus bestehendem Language-Context-, Language-Bridge- und multilingualem Evidence-/Thread-Contract
   - Basis: `GOV-AI-06A`, `ContentTranslationLifecycle.md`, V3 Language-Contracts

6. `V3-AI-TRACE-USER-FACING-ORCHESTRATION-HARDENING-01`
   - abgeleitet aus bestehender Orchestrator-, Fallback-, Confidence- und Admin-Telemetry-Wahrheit
   - Basis: `V2-AI-ORCHESTRATION-CONSOLIDATION-01`, `V3_CORE_AI_ORCHESTRATION_PROVENANCE_GRAPH_TRACE_2026-07-03.md`

7. `V3-RELEASE-READINESS-REGRESSION-MATRIX-01`
   - abgeleitet aus bestehender V3 Test Matrix, Handoff Map und Control Center
   - Basis: `V3-TEST-RESULTS-REGRESSION-MATRIX-01`, `V3-HANDOFF-INTEGRITY-AND-LINKAGE-MAP-01`, `V3-ADMIN-DASHBOARD-CONTROL-CENTER-01`

## Bewusst nicht codex_ready oder nicht priorisiert

- `GOV-B2B-01`
  - bleibt `needs_decision`
  - `Decision open = yes` ist weiterhin offen

- `GOV-CIVIC-ECON-01`
  - bleibt `codex_ready`
  - bleibt aber bewusst docs-/contract-first und nachrangig, solange echte Produktcluster verfuegbar sind

- `WORKTREE-COMMIT-CREATE-LEDGER-HANDOFF-14B2`
  - bleibt `codex_ready`
  - bleibt aber maintenance-only und keine Produktprioritaet

- `V3-DOSSIER-SOCIAL-OUTPUT-DRAFTS-01`
- `V3-UNIFIED-REVIEW-QUEUE-01`
- `V3-DOSSIER-WORKSPACE-REVIEW-SURFACE-01`
- `V3-ROLES-PERMISSIONS-ENTITLEMENTS-01`
- `I18N-BILINGUAL-PRODUCT-SHELL-01`
  - bleiben Parent- oder laufende Pfade
  - sind nicht der naechste saubere Runner-Einstieg

- `V3-NOTIFICATIONS-REALTIME-MAIL-01`
- `V3-INCIDENT-RECOVERY-MAINTENANCE-01`
- `V3-DATABASE-ADMIN-OPS-MANUAL-CREATION-01`
- `V3-EXTERNAL-BROWSER-E2E-01`
- `V3-QR-SHARING-PUBLIC-ENTRY-01`
- `V3-TEMPLATE-OUTPUT-STANDARDIZATION-01`
  - bleiben breitere, sensiblere oder spaeter anschliessende Folgepfade
  - fuer diesen Runner-Schritt bewusst nicht in kleinere produktive Startcluster geschnitten

- Voxy Runtime
  - bleibt pausiert
  - keine neue `codex_ready` Runtime-, Provider-, Cost-, Secret- oder Publish-Freigabe

## Empfohlene naechste Runner-Reihenfolge

1. `V3-E2E-CREATE-REVIEW-DOSSIER-ACCOUNT-FLOW-HARDENING-01`
2. `V3-DOSSIER-EXPORT-SHARE-PUBLISH-READY-GUARD-01`
3. `V3-ROUTE-INVENTORY-LEGACY-PATH-HARDENING-01`
4. `V3-MEMBERSHIP-ENTITLEMENT-PACKAGE-ACTIVATION-HARDENING-01`
5. `V3-LANGUAGE-BRIDGE-MULTILINGUAL-SURFACE-HARDENING-01`
6. `V3-AI-TRACE-USER-FACING-ORCHESTRATION-HARDENING-01`
7. `V3-RELEASE-READINESS-REGRESSION-MATRIX-01`
8. `GOV-CIVIC-ECON-01`
9. `WORKTREE-COMMIT-CREATE-LEDGER-HANDOFF-14B2`

## Stop-Bedingungen

- `needs_decision`, `blocked`, `research_only`, `in_progress` oder `done`
- roter Pflichtcheck nach zwei Reparaturversuchen
- benoetigte Secrets, Provider-Credentials, Kosten, Payment oder externe API-Calls
- benoetigte Runtime-Aktivierung, Upload, Scheduling, Social Posting oder Auto-Publish
- fehlende Produktentscheidung zu Route, Rolle, Sichtbarkeit, Pricing oder Governance
- naechster Task liegt fachlich klar ausserhalb des laufenden Clusters

## Warum keine Features implementiert wurden

Dieser Slice ist bewusst docs-only.

Ziel war nicht eine weitere Produktflaeche anzufassen, sondern den Runner nach dem erfolgreichen Abarbeiten der ersten Queue wieder auf echte, kleine Produktionscluster auszurichten.

Geaendert wurden nur:

- `docs/E150/OpenTasks.md`
- dieses Audit-Dokument

Es wurden keine App-Surfaces, keine Runtime, keine Tests, keine Provider, keine Payments und keine Produktfeatures geaendert.

## Reifegrad-Einschaetzung nach #363 bis #368

Nach `#363` bis `#368` ist die V3-Produktionsreife deutlich hoeher als vor dem ersten Runner-Lauf:

- direkter Einstieg ueber Login / Register / Account / Order ist harmonisiert
- Review-, Dossier-, Factcheck- und Feed-Semantik ist deutlich konsistenter
- Public Routes, CTA-Hierarchie und Debug-Leak-Schutz sind gehaertet
- Admin-/Operator-Surfaces sprechen konsistenter ueber Review, Freischaltung und naechste Schritte

Der Reifegrad steigt dadurch von "erste produktive Cluster hergestellt" auf:

- mehrere zentrale Produktpfade sind produktionsnah harmonisiert
- die Queue selbst war aber nach `#368` wieder leer gelaufen
- mit dieser zweiten Normalisierung ist der Runner erneut handlungsfaehig, ohne neue Produktentscheidungen zu behaupten

Kurz: Produktbasis stabiler, Queue wieder belastbar, aber weiterhin kein Endzustand bei Export-/Release-, Multilingual-, AI-Trace- und Route-/Activation-Hardening.

## Naechste Entscheidungsbedarfe

1. Voxy echte Runtime bleibt ausserhalb der produktiven Queue, bis eine explizite Runtime-/Provider-/Kosten-/Secret-Freigabe dokumentiert ist.
2. `GOV-B2B-01` bleibt gesperrt, bis Preis-/Retainer- und Rechtsfreigaben geklaert sind.
3. Breitere Parent-Pfade wie `V3-UNIFIED-REVIEW-QUEUE-01` oder `I18N-BILINGUAL-PRODUCT-SHELL-01` brauchen weiter bewusst geschnittene Untertasks statt weiterer grosser Sammel-PRs.
