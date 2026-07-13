# V3 Preview Smoke Readiness Plan 2026-07-13

## Scope

- Branch: `pr/v3-preview-smoke-readiness-01`
- Ziel: konkreter, ausfuehrbarer Preview-Smoke-Plan nach Abschluss von Queue 02
- Typ: docs-only / kein Feature-Slice / keine Runtime-Aktivierung

## Baseline

- Queue 02 ist laut `V3_RELEASE_READINESS_REGRESSION_MATRIX_2026-07-13.md` fachlich abgeschlossen.
- Ergebnis aus `#377`:
  - Preview: `ja`
  - Beta: `ja`, aber nur nach gezieltem Smoke-Test
  - Full Release: `nein`
  - Queue 03: `nein`
- Voxy-Runtime bleibt deaktiviert.
- Dieser Plan fuehrt keine manuellen Smoke-Ergebnisse ein. Er definiert nur:
  - Reihenfolge
  - Schritte
  - erwartete Beobachtungen
  - Stop-/Fail-Kriterien
  - passende bestehende Tests

## Eingangsquellen

- `AGENTS.md`
- `docs/E150/OpenTasks.md`
- `docs/E150/V3_PRODUCTION_QUEUE_NORMALIZATION_02_2026-07-13.md`
- `docs/E150/V3_RELEASE_READINESS_REGRESSION_MATRIX_2026-07-13.md`
- relevante Queue-02-Audits `#363` bis `#377`
- `docs/E150/PRODUCTION-DEPLOYMENT-VALIDATION-CONTRACT-02_2026-07-01.md`
- `docs/E150/V3_TEST_RESULTS_REGRESSION_MATRIX_2026-07-02.md`
- `docs/E150/V3_HANDOFF_INTEGRITY_AND_LINKAGE_MAP_2026-07-02.md`
- `docs/E150/V3_ADMIN_DASHBOARD_CONTROL_CENTER_2026-07-02.md`
- `docs/E150/V3_VOXY_HYBRID_RUNTIME_FOUNDATION_2026-07-12.md`
- `docs/E150/V3_VOXY_RUNTIME_PATH_DECISION_PACK_2026-07-12.md`
- `docs/E150/V3_VOXY_SELF_RENDER_AND_MARKETING_PILOT_ROADMAP_2026-07-13.md`

## Nicht-Ziele

- keine neuen Produktfeatures
- keine App-Surface-Umbauten, solange kein echter Smoke-Blocker gefunden wird
- keine Runtime-Aktivierung
- kein Auto-Publish
- kein Auto-Export
- kein Social Posting
- kein Scheduling
- keine externen API-Calls
- keine Provider
- keine Secrets
- keine Kosten
- keine Fake-Daten
- keine Fake-Zahlen
- keine Fake-Quellen
- keine neue Queue 03

## Rollen und Voraussetzungen

### Rollen

- `public_anonymous`
  - fuer `/`, `/start`, `/create`, `/pricing`, `/order`, `/vormerken`, `/mitglied-werden`, `/beitritt`
- `registered_user`
  - fuer `/account`, `/account/payment`, `/community/contributions`, `/profile/[shareId]`
- `operator_admin`
  - fuer `/admin`, `/admin/review`, `/admin/feeds`, `/admin/region`, `/admin/access`, `/admin/entitlements`, `/admin/errors`, `/admin/system`, `/admin/telemetry/ai/orchestrator`
- `org_user`
  - fuer `/account/organization`, `/account/organization/dashboard`

### Datenvoraussetzungen

- Nur bestehende review-first, draft-first oder bereits im lokalen Stand vorhandene Records verwenden.
- Keine zusaetzlichen Demo-, Publish- oder Runtime-Daten erzeugen, nur um einen Smoke-Pfad "gruen zu machen".
- Falls fuer einen manuellen Schritt ein benoetigter Review-, Dossier-, Membership- oder Translation-Fall lokal nicht vorhanden ist:
  - als `blocked_by_missing_local_fixture` protokollieren
  - nicht durch neue Produktdaten simulieren

## Ausfuehrungsreihenfolge

1. Public Start / Route / Pricing / Order
2. Create -> Review -> Dossier -> Account
3. Dossier Export / Share / Publish-ready
4. Feed / Source / Intake / Factcheck
5. Membership / Entitlement / Payment Copy
6. Language Bridge / Multilingual
7. AI Trace / Orchestration Transparency
8. Admin / Operator Workbench
9. Voxy Boundary
10. Preview/Beta Go-No-Go Entscheidung

## Globales Protokoll pro Smoke-Schritt

Fuer jeden manuellen Check festhalten:

- Route oder Surface
- Rolle
- Datenbasis oder vorhandener Record
- ausgefuehrte Aktion
- beobachtete UI-/Guardrail-Semantik
- Ergebnis:
  - `pass`
  - `pass_with_note`
  - `blocked_by_missing_local_fixture`
  - `fail`
- zugeordnete Testdatei
- Blockerklasse:
  - `P0 release_blocker`
  - `P1 beta_blocker`
  - `P2 followup_not_blocking_preview`

## Globale Stop-Kriterien

- P0-Leak von Review-only-, Approval-, Prompt-, Token-, Kosten-, Secret- oder Debug-Information in oeffentlichen oder user-facing Surfaces
- oeffentliche Sichtbarkeit von nicht veroeffentlichten Dossiers, Review-only-Inhalten oder internen Exporten
- falsche Semantik wie `draft == published`, `review_ready == approved`, `package selected == active`, `translation == evidence`
- Auto-Sideeffects ausserhalb des review-first Contracts:
  - Auto-Publish
  - Auto-Export
  - Auto-Activation
  - Auto-Factcheck
  - Auto-Verification
  - Auto-Graph-Write
  - Auto-Merge
- Voxy-Runtime erscheint als aktiv, gerendert, hochgeladen, geplant oder veroeffentlicht
- benoetigte Secrets, externe Provider oder Kosten waeren fuer den Smoke zwingend noetig

## Fail-Klassifikation

- `P0 release_blocker`
  - oeffentlicher Leak
  - falsche Publish-/Activation-/Approval-Semantik
  - echter Runtime-/Provider-/Secret-/Kosten-Bypass
- `P1 beta_blocker`
  - zentraler kanonischer Pfad widerspricht der Queue-02-Produktwahrheit
  - naechste Schritte fuer Public, User oder Operator sind missverstaendlich oder irrefuehrend
- `P2 followup_not_blocking_preview`
  - kleinere Copy-, Reihenfolge- oder Surface-Konsistenzdrift ohne Sicherheits- oder Wahrheitsbruch

## 1. Public Start / Route / Pricing / Order

### Routen

- `/`
- `/start`
- `/create`
- `/register`
- `/login`
- `/order`
- `/pricing`
- `/pricing/institutionen`
- `/vormerken`
- `/mitglied-werden`
- `/beitritt`

### Manuelle Schritte

1. Oeffne `/` und pruefe, ob die primaeren Einstiege sichtbar auf `/create` und den Mitmachpfad verweisen, ohne Wartelisten- oder Fake-Live-Sprache.
2. Oeffne `/start` und pruefe, ob der Einstieg klar als produktiver Beitragspfad erscheint und keine hidden AI-, Publish- oder Runtime-Sprache sichtbar ist.
3. Oeffne `/create` als oeffentlichen Einstieg und pruefe, ob der Pfad als Einstieg in Review-first Arbeit statt als Publish-Flaeche lesbar bleibt.
4. Oeffne `/register` und `/login` und pruefe, ob Register/Login auf denselben direkten Einstiegspfad und dieselbe Freischaltungslogik verweisen wie `/order`.
5. Oeffne `/order` und pruefe, ob es klar als kanonischer Paket-/Startpfad lesbar ist.
6. Oeffne `/pricing` und `/pricing/institutionen` und pruefe, ob die CTA-Sprache auf Paketstart statt Warteliste oder verdeckte Aktivierung zielt.
7. Oeffne `/vormerken` und pruefe, ob die Surface klar als Legacy-/Fallback-/Info-Pfad lesbar bleibt.
8. Oeffne `/mitglied-werden` und `/beitritt` und pruefe, ob beide nur Alias-/Bestandspfade zum kanonischen Membership-/Pricing-Kontext bleiben.

### Erwartete Beobachtung

- `/order` bleibt kanonischer Start-/Paketpfad.
- `/vormerken` bleibt Legacy/Fallback/Info.
- `/mitglied-werden` und `/beitritt` bleiben Alias-/Bestandspfade.
- keine alte Wartelisten-Sprache als Hauptfunnel
- keine hidden costs
- keine automatische Zahlung
- keine automatische Paketaktivierung

### Stop-/Fail-Kriterien

- `/vormerken` wird wie Hauptfunnel gerahmt
- `/order` wirkt nur wie Warteliste oder Anfrageformular
- irgendeine Public-Surface behauptet automatische Aktivierung oder versteckte Kostenfreiheit trotz anderer Repo-Wahrheit

### Bestehende Tests

- `apps/web/tests/production-entry-contract.test.ts`
- `apps/web/tests/auth-registration-flow.contract.test.ts`
- `apps/web/tests/order-entry.contract.test.ts`
- `apps/web/tests/order-entry-trust-copy.contract.test.tsx`
- `apps/web/tests/pricing-page.contract.test.ts`
- `apps/web/tests/pricing-order-flow.contract.test.ts`
- `apps/web/tests/public-route-h1-visibility.contract.test.tsx`
- `apps/web/tests/vormerken-page.contract.test.tsx`
- `apps/web/tests/mitglied-werden.redirect.test.ts`
- `apps/web/tests/beitritt.redirect.test.ts`

## 2. Create -> Review -> Dossier -> Account

### Routen

- `/create`
- `/admin/review`
- `/dossier/[id]`
- `/dossier/[id]/studio`
- `/account`
- `/account/organization/dashboard`

### Manuelle Schritte

1. Oeffne `/create` mit einem bestehenden review-first oder draft-first Fall und pruefe die sichtbaren Handoff-, Preview- und Folgepfade.
2. Pruefe, ob Suggestion-, Candidate-, Review- und Dossier-Hinweise als vorbereiteter Arbeitsstand und nicht als finale Runtime erscheinen.
3. Oeffne `/admin/review` und pruefe, ob Operatoren denselben Arbeitsstand review-first sehen statt in Publish-/Runtime-Sprache.
4. Oeffne ein bestehendes `/dossier/[id]` und danach `/dossier/[id]/studio`; pruefe die Trennung zwischen Dossier-Draft, Review-Kontext, Export-/Share-Vorbereitung und veroeffentlichtem Zustand.
5. Oeffne `/account` und pruefe, ob wiederaufnehmbare Arbeitsstaende sichere naechste Schritte und keine Fake-Linkage oder Fake-Publication behaupten.
6. Oeffne `/account/organization/dashboard` und pruefe, ob Resume-, Review- und Freischaltungssemantik konsistent bleibt.

### Erwartete Beobachtung

- `draft != publish`
- `suggestion != decision`
- `review_ready != approved`
- `approved != published`
- Dossier-Handoff ist nicht das finale Dossier
- Nutzer sieht sichere naechste Schritte
- Operator sieht review-first Arbeitsstand

### Stop-/Fail-Kriterien

- ein Handoff wird wie finale veroeffentlichte Runtime verkauft
- `/account` oder `/admin/review` behaupten aktive Verlinkung, obwohl nur partielle Review-Korrelation vorliegt
- `/dossier/[id]/studio` vermischt Review-Status mit Publish-Status

### Bestehende Tests

- `apps/web/tests/create-candidate-preview.contract.test.ts`
- `apps/web/tests/account-resume-workbench.contract.test.tsx`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/dossier-studio-server-persistence-ui.test.tsx`
- `apps/web/tests/v3-account-user-scoped-runtime-linkage.test.ts`
- `apps/web/tests/v3-review-context-summary.test.tsx`

## 3. Dossier Export / Share / Publish-ready

### Routen und Flaechen

- `/dossier/[id]/studio`
- `ExportPanel`
- Public Dossier Runtime
- `/api/dossier/[id]/export`
- `/api/dossiers/[dossierId]/export.json`
- `/api/dossiers/[dossierId]/export.csv`
- `/admin/review`

### Manuelle Schritte

1. Oeffne `/dossier/[id]/studio` fuer ein nicht veroeffentlichtes Dossier und pruefe Export-, Share- und Publish-Copy.
2. Pruefe im `ExportPanel`, ob Review-, Export-, Share- und Publish-Zustaende sauber getrennt angezeigt werden.
3. Pruefe in `/admin/review`, ob dieselbe Freigabe-Semantik wie im Studio genutzt wird.
4. Rufe die drei Export-Routen fuer ein nicht veroeffentlichtes oder review-only Dossier auf und pruefe, dass kein oeffentlicher Export durchgeht.
5. Oeffne ein veroeffentlichtes Public-Dossier und pruefe, dass nur dort oeffentliche Share-/Read-Semantik erscheint.

### Erwartete Beobachtung

- `publish_ready != published`
- `export_ready != exported`
- `share_preview != public publish`
- review-only Dossiers leaken nicht oeffentlich
- kein Auto-Export
- kein Auto-Publish
- kein Social Posting
- kein Scheduling

### Stop-/Fail-Kriterien

- nicht veroeffentlichtes Dossier ist oeffentlich exportierbar
- share preview wird wie oeffentliche Veroeffentlichung gerahmt
- irgendein Export-/Share-Pfad startet implizit Distribution oder Publish

### Bestehende Tests

- `apps/web/tests/dossier-export-route-guards.test.ts`
- `apps/web/tests/dossier-public-route.contract.test.tsx`
- `apps/web/tests/dossier-public-route-runtime.test.tsx`
- `apps/web/tests/dossier-output-studio.page.contract.test.ts`
- `apps/web/tests/social-manual-export-fallback.contract.test.ts`
- `apps/web/tests/admin-review.page.test.tsx`

## 4. Feed / Source / Intake / Factcheck

### Routen und Flaechen

- `/admin/feeds`
- `/admin/region`
- `/factcheck`
- `/admin/review`
- Dossier Evidence-/Source-Hinweise

### Manuelle Schritte

1. Oeffne `/admin/feeds` und pruefe, ob Feed-/Source-/Snapshot-/Material-/Review-Sprache review-first bleibt.
2. Oeffne `/admin/region` und pruefe, ob Source-, Signal- und Review-Hinweise keine importierte Wahrheit behaupten.
3. Oeffne `/factcheck` und pruefe die sichtbare Trennung zwischen Kandidat, Review-Bedarf, Quellenbedarf und Siegel-/Publish-Folgepfad.
4. Oeffne `/admin/review` fuer feed- oder create-nahe Review-Items und pruefe, ob dieselben review-first Begriffe wie in Feed-/Factcheck-Surfaces gelten.
5. Oeffne passende Dossier-Evidence-/Source-Hinweise und pruefe, ob Uebersetzung, Feed-Enrichment und Quelle nicht vermischt werden.

### Erwartete Beobachtung

- `source candidate != evidence`
- `feed enrichment != imported source`
- `factcheck candidate != verified factcheck`
- `translation != evidence`
- keine Fake-Quellen
- keine automatische Quellenpruefung behaupten

### Stop-/Fail-Kriterien

- ein Feed- oder Factcheck-Hinweis verkauft ungepruefte Inputs als bestaetigte Quelle
- Uebersetzung erscheint als Evidenzstatus
- Source-/Snapshot-/Material-Sprache suggeriert versteckten Research- oder Import-Lauf

### Bestehende Tests

- `apps/web/tests/feed-source-intake-surface-truth.test.ts`
- `apps/web/tests/admin-feeds-runtime-dashboard.contract.test.tsx`
- `apps/web/tests/admin-region-page.render.test.tsx`
- `apps/web/tests/review-surface-status-labels.test.ts`
- `apps/web/tests/factcheck-handoff-shell.contract.test.tsx`
- `apps/web/tests/admin-review.page.test.tsx`

## 5. Membership / Entitlement / Payment Copy

### Routen und Flaechen

- `/order`
- `/account/payment`
- `/account/organization`
- `/account/organization/dashboard`
- `/admin/pricing/orders`
- `/admin/entitlements`
- `/admin/memberships`
- `/dashboard/memberships`

### Manuelle Schritte

1. Oeffne `/order` und pruefe, dass Paketwahl, Mitgliedschaft und Aktivierung nicht gleichgesetzt werden.
2. Oeffne `/account/payment` und pruefe, ob Zahlungsprofil als Beitrags-/Verifikations-/Supportpfad statt als automatische Paketaktivierung erscheint.
3. Oeffne `/account/organization` und `/account/organization/dashboard` und pruefe, ob Vertrag, Billing und Freischaltung sichtbar getrennt bleiben.
4. Oeffne `/admin/pricing/orders` und pruefe, ob `approved`, `active`, `public_official` und Supportschritte getrennt bleiben.
5. Oeffne `/admin/entitlements`, `/admin/memberships` und `/dashboard/memberships` und pruefe, ob manuelle Admin-/Support-Aktionen nicht wie Auto-Aktivierung erscheinen.

### Erwartete Beobachtung

- `package selected != package active`
- `entitlement visible != entitlement granted`
- `billing copy != payment execution`
- `membership != automatische Paketaktivierung`
- keine versteckten Kosten
- Admin-Aktionen bleiben manuell/review-first

### Stop-/Fail-Kriterien

- Admin- oder Account-Copy verkauft sichtbare Entitlements als aktivierte Nutzung
- Support-Aktionen erscheinen als Checkout-/Provisioning-Automatismus
- irgendeine Surface suggeriert automatische Zahlung oder Aktivierung

### Bestehende Tests

- `apps/web/tests/order-entry.contract.test.ts`
- `apps/web/tests/account-payment.page.contract.test.tsx`
- `apps/web/tests/admin-pricing-orders.route.test.ts`
- `apps/web/tests/admin-entitlements.route.test.ts`
- `apps/web/tests/membership-activation-support-surfaces.contract.test.tsx`
- `apps/web/tests/payment-checkout-session.contract.test.ts`
- `apps/web/tests/payment-entitlement-after-checkout.contract.test.ts`

## 6. Language Bridge / Multilingual

### Routen und Flaechen

- `/create`
- `/admin/review`
- `/dossier/[id]/studio`
- `/account`
- `/community/contributions`
- `/admin/contributions`
- `/profile/[shareId]`

### Manuelle Schritte

1. Oeffne `/create` mit einem multilingual sichtbaren Fall und pruefe die Sprachmetazeile.
2. Oeffne `/admin/review` und `/dossier/[id]/studio` und pruefe, ob dieselbe Original-vs-Lesefassung-Wahrheit erscheint.
3. Oeffne `/account`, `/community/contributions`, `/admin/contributions` und `/profile/[shareId]` fuer lokalisierte Inhalte und pruefe, ob dieselbe Trust-Metazeile erscheint.
4. Pruefe in allen Faellen, ob Originalsprache, Lesefassung und Review-Status getrennt bleiben.

### Erwartete Beobachtung

- Originalsprache bleibt Evidenz
- Uebersetzung bleibt Lesehilfe
- Language Bridge ist kein Factcheck
- keine English-first-Verengung
- keine externe Translation Runtime
- keine automatische Beweisfuehrung aus Uebersetzung

### Stop-/Fail-Kriterien

- Uebersetzung wird wie Evidenz, Quelle oder Verifikation gerahmt
- Review-/Approval-Semantik wird aus Uebersetzungsstatus abgeleitet
- irgendeine Surface suggeriert externe Live-Uebersetzung als produktive Runtime

### Bestehende Tests

- `apps/web/tests/content-translation-rendering.test.tsx`
- `apps/web/tests/language-bridge-trust-format-contract.test.ts`
- `apps/web/tests/create-i18n.contract.test.ts`
- `apps/web/tests/community-contributions.route.translation.test.ts`
- `apps/web/tests/social-thread.route.translation.test.ts`

## 7. AI Trace / Orchestration Transparency

### Routen und Flaechen

- `/create`
- `/runden/new`
- `/admin/review`
- `/dossier/[id]/studio`
- `/account`
- `/admin/telemetry/ai/orchestrator`

### Manuelle Schritte

1. Oeffne `/create` und `/runden/new` und pruefe, ob sichtbare KI-Hinweise sichere Prozessschritte statt Debug- oder Provider-Sprache nutzen.
2. Oeffne `/admin/review`, `/dossier/[id]/studio` und `/account` und pruefe, ob Downstream-KI-Transparenz dieselben Guardrails und keine versteckte Runtime behauptet.
3. Oeffne `/admin/telemetry/ai/orchestrator` und pruefe, ob nur sichere Operator-Zusammenfassungen sichtbar sind.
4. Pruefe in allen Surfaces explizit, dass keine Prompt-, Chain-of-Thought-, Provider-, Token- oder Kostenfelder sichtbar werden.

### Erwartete Beobachtung

- `user-facing trace != debug trace`
- `orchestration step != provider execution`
- `retrieval hint != gepruefte quelle`
- keine Prompt-Leaks
- keine Chain-of-Thought-Leaks
- keine Provider-/Token-/Kosten-Leaks
- keine Fake-Orchestrierung
- keine Fake-Recherche

### Stop-/Fail-Kriterien

- sichtbare Prompt- oder Chain-of-Thought-Fragmente
- Provider-, Token-, Kosten- oder Parse-/Schema-Debugfelder in user-facing oder normalen Operator-Surfaces
- Retrieval-/Research-Hinweis wird als gepruefte Quelle ausgegeben

### Bestehende Tests

- `apps/web/tests/ai-trace-surface-truth.test.ts`
- `apps/web/tests/frontend-ai-transparency.contract.test.ts`
- `apps/web/tests/ai-orchestration-provenance-trace.contract.test.ts`
- `apps/web/tests/admin-ai-telemetry-ui.contract.test.ts`
- `apps/web/tests/public-debug-leak.guard.test.ts`

## 8. Admin / Operator Workbench

### Routen

- `/admin`
- `/admin/review`
- `/admin/editorial/queue`
- `/admin/feeds`
- `/admin/region`
- `/admin/access`
- `/admin/entitlements`
- `/admin/errors`
- `/admin/system`

### Manuelle Schritte

1. Oeffne `/admin` und pruefe, ob Control Center, Handoff Map und Test Matrix sichtbar auf echte Arbeitsflaechen verweisen statt Fake-Actions zu zeigen.
2. Oeffne `/admin/review` und pruefe die zentrale Review-first Surface-Wahrheit.
3. Oeffne `/admin/editorial/queue`, `/admin/feeds` und `/admin/region` und pruefe, ob keine rohe Runtime-/Debug-Sprache sichtbar ist.
4. Oeffne `/admin/access` und `/admin/entitlements` und pruefe, ob Access, Billing, Membership und Freischaltung konsistent getrennt bleiben.
5. Oeffne `/admin/errors` und `/admin/system` und pruefe, ob sie als Diagnose-/Ruecksprung-Surfaces statt als verdeckte Runtime-Operatorwelt erscheinen.

### Erwartete Beobachtung

- Operator sieht klare review-first Arbeitsstaende
- keine rohe Debug-/Runtime-Sprache
- keine falsche Publish-/Runtime-/Activation-Semantik
- zentrale Review-/Operator-Wahrheit bleibt konsistent

### Stop-/Fail-Kriterien

- irgendeine zentrale Operator-Surface zeigt rohe Debug-, Enum- oder Runtime-Flags als Primarsprache
- `/admin/errors` oder `/admin/system` wirken wie neue operative Parallelwelt
- Control Center zeigt Fake-Actions statt ehrlicher Links oder `noch nicht vorhanden`

### Bestehende Tests

- `apps/web/tests/operator-console-page.contract.test.tsx`
- `apps/web/tests/operator-workbench-labels.contract.test.ts`
- `apps/web/tests/admin-region-page.render.test.tsx`
- `apps/web/tests/admin-access-entitlements-surface.contract.test.tsx`
- `apps/web/tests/admin-editorial-hubs.page.test.tsx`
- `apps/web/tests/v3-test-regression-matrix-admin.page.test.tsx`
- `apps/web/tests/v3-control-center-admin.page.test.tsx`
- `apps/web/tests/v3-handoff-linkage-admin.page.test.tsx`

## 9. Voxy Boundary

### Pruefflaechen

- Voxy Review-first Architektur
- Voxy Hybrid Foundation
- `#369` Self-Render / Marketing Roadmap

### Manuelle Schritte

1. Oeffne die betroffenen Voxy-nahen Read-only Panels auf `/create`, `/account`, `/admin/review` oder `/dossier/[id]/studio`, falls vorhanden, und pruefe, dass `runtimeEnabled = false` in der Surface-Wahrheit weiterhin wirksam bleibt.
2. Pruefe anhand der Voxy-Read-only-Hinweise, dass keine Render-, Upload-, Scheduling- oder Publish-Schritte als aktiv dargestellt werden.
3. Pruefe die begleitende Doku-/Roadmap-Wahrheit gegen die sichtbaren Product-Surfaces: Marketing-Pilot und Self-Render-Roadmap bleiben Doku und nicht aktive Runtime.

### Erwartete Beobachtung

- Voxy Runtime bleibt disabled
- keine Provider-/Kosten-/Secret-Freigabe
- keine Fake-Video-Runtime
- Roadmap ist Doku, keine Runtime-Aktivierung

### Stop-/Fail-Kriterien

- sichtbare Runtime-Aktivierung, Preview-Render, Upload, Scheduling oder Publish
- irgendeine Surface suggeriert benoetigte Provider-/Secrets seien bereits aktiv
- Marketing-/Roadmap-Doku wird in Produktcopy als bereits aktive Runtime verkauft

### Bestehende Tests

- `apps/web/tests/create-candidate-preview.contract.test.ts`
- `apps/web/tests/account-resume-workbench.contract.test.tsx`
- `apps/web/tests/admin-review.page.test.tsx`
- `apps/web/tests/dossier-studio-server-persistence-ui.test.tsx`
- `apps/web/tests/public-debug-leak.guard.test.ts`

## Preview/Beta Go-No-Go Checkliste

### Preview Go

- alle P0-Kriterien bleiben negativ
- keine oeffentlichen Review-only- oder Export-Leaks
- kanonische Public-Einstiege bleiben konsistent mit `/order` als Paket-/Startpfad
- review-first Create-/Review-/Dossier-/Account-Kette bleibt lesbar und ohne falsche Publish-Semantik
- Membership-/Entitlement-Copy trennt Auswahl, Billing, Freischaltung und Aktivierung sauber
- Language Bridge trennt Original und Lesefassung sauber
- AI Trace leakt keine Debug-/Prompt-/Provider-/Kosten-Interna
- Admin-/Operator-Surfaces bleiben frei von roher Debug-/Runtime-Sprache
- Voxy-Runtime bleibt deaktiviert

### Beta Go

- alle Preview-Go-Kriterien
- keine P1-Beta-Blocker offen
- gezielte manuelle Smoke-Dokumentation fuer alle neun Bereiche liegt vor
- Build, Lint und reprasentative Regression-Suiten sind gruen
- bekannte `TS6053`-Drift ist, falls vorhanden, isoliert dokumentiert und kein neuer Slice-Fehler

### Full Release No-Go

- externer Browser-/Deploy-Smoke fehlt weiterhin als belastbarer Folgepfad
- Incident-/Rollback-/Notification-/Observability-Pfade sind weiterhin offen
- Handoff-, Test- und Control-Center-Wahrheit markieren weiter `operational_basic`, `wired` und `partially_built`, nicht `endstate_ready`

## Repräsentative Validierung fuer diesen Plan-Slice

### Pflichtruns

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/production-entry-contract.test.ts tests/auth-registration-flow.contract.test.ts tests/order-entry.contract.test.ts tests/pricing-page.contract.test.ts tests/pricing-order-flow.contract.test.ts tests/public-route-h1-visibility.contract.test.tsx tests/vormerken-page.contract.test.tsx tests/mitglied-werden.redirect.test.ts tests/beitritt.redirect.test.ts`
- `pnpm -C apps/web exec vitest run tests/create-candidate-preview.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/admin-review.page.test.tsx tests/dossier-studio-server-persistence-ui.test.tsx tests/v3-account-user-scoped-runtime-linkage.test.ts tests/v3-review-context-summary.test.tsx`
- `pnpm -C apps/web exec vitest run tests/dossier-export-route-guards.test.ts tests/dossier-public-route.contract.test.tsx tests/dossier-public-route-runtime.test.tsx tests/dossier-output-studio.page.contract.test.ts tests/social-manual-export-fallback.contract.test.ts`
- `pnpm -C apps/web exec vitest run tests/feed-source-intake-surface-truth.test.ts tests/admin-feeds-runtime-dashboard.contract.test.tsx tests/admin-region-page.render.test.tsx tests/review-surface-status-labels.test.ts tests/factcheck-handoff-shell.contract.test.tsx`
- `pnpm -C apps/web exec vitest run tests/account-payment.page.contract.test.tsx tests/admin-pricing-orders.route.test.ts tests/admin-entitlements.route.test.ts tests/membership-activation-support-surfaces.contract.test.tsx tests/payment-checkout-session.contract.test.ts tests/payment-entitlement-after-checkout.contract.test.ts`
- `pnpm -C apps/web exec vitest run tests/content-translation-rendering.test.tsx tests/language-bridge-trust-format-contract.test.ts tests/create-i18n.contract.test.ts tests/community-contributions.route.translation.test.ts tests/social-thread.route.translation.test.ts`
- `pnpm -C apps/web exec vitest run tests/ai-trace-surface-truth.test.ts tests/frontend-ai-transparency.contract.test.ts tests/ai-orchestration-provenance-trace.contract.test.ts tests/admin-ai-telemetry-ui.contract.test.ts tests/public-debug-leak.guard.test.ts`
- `pnpm -C apps/web exec vitest run tests/operator-console-page.contract.test.tsx tests/operator-workbench-labels.contract.test.ts tests/admin-region-page.render.test.tsx tests/admin-access-entitlements-surface.contract.test.tsx tests/admin-editorial-hubs.page.test.tsx tests/v3-test-regression-matrix-admin.page.test.tsx tests/v3-control-center-admin.page.test.tsx tests/v3-handoff-linkage-admin.page.test.tsx`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`
- `pnpm -C apps/web run typecheck`

### Typecheck-Sonderfall

Wenn `pnpm -C apps/web run typecheck` nur an der bekannten `.next/types/**/*.ts`-Drift mit `TS6053` haengt:

- als `known_local_typecheck_drift` protokollieren
- nicht als Preview-Smoke-Regression werten
- nur dann tolerieren, wenn:
  - `lint` gruen ist
  - `build` gruen ist
  - die reprasentativen Vitest-Suiten gruen sind

## Dokumentationspflicht nach dem echten Smoke-Lauf

Der spaetere manuelle Smoke-Bericht soll mindestens enthalten:

- getestete Routen und Rollen
- welche vorhandenen Records benutzt wurden
- Ergebnis pro Bereich
- alle `pass_with_note`, `blocked_by_missing_local_fixture` und `fail`
- P0/P1/P2-Klassifikation
- Preview-Go: `ja/nein`
- Beta-Go: `ja/nein`
- Full-Release-Go: `nein`, solange die aus `#377` bekannten Folgepfade offen bleiben

## OpenTasks-Einordnung

- `OpenTasks.md` wurde in diesem Slice bewusst nicht veraendert.
- Grund: Es existiert aktuell kein sauber passender bestehender Task fuer einen docs-only Preview-Smoke-Plan, der ohne neue Queue- oder Feature-Implikationen minimal fortgeschrieben werden koennte.

## Lokale Validierung dieses Docs-Slices

- `git diff --check`
  - Ergebnis: gruen
- `pnpm -C apps/web exec vitest run tests/production-entry-contract.test.ts tests/auth-registration-flow.contract.test.ts tests/order-entry.contract.test.ts tests/pricing-page.contract.test.ts tests/pricing-order-flow.contract.test.ts tests/public-route-h1-visibility.contract.test.tsx tests/vormerken-page.contract.test.tsx tests/mitglied-werden.redirect.test.ts tests/beitritt.redirect.test.ts`
  - Ergebnis: `9` Dateien, `30/30` Tests gruen
  - Hinweis: bekannte React-Warnungen zu `fill` und `priority` in `public-route-h1-visibility.contract.test.tsx`, kein Fail
- `pnpm -C apps/web exec vitest run tests/create-candidate-preview.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/admin-review.page.test.tsx tests/dossier-studio-server-persistence-ui.test.tsx tests/v3-account-user-scoped-runtime-linkage.test.ts tests/v3-review-context-summary.test.tsx`
  - Ergebnis: `6` Dateien, `20/20` Tests gruen
- `pnpm -C apps/web exec vitest run tests/dossier-export-route-guards.test.ts tests/dossier-public-route.contract.test.tsx tests/dossier-public-route-runtime.test.tsx tests/dossier-output-studio.page.contract.test.ts tests/social-manual-export-fallback.contract.test.ts`
  - Ergebnis: `5` Dateien, `13/13` Tests gruen
- `pnpm -C apps/web exec vitest run tests/feed-source-intake-surface-truth.test.ts tests/admin-feeds-runtime-dashboard.contract.test.tsx tests/admin-region-page.render.test.tsx tests/review-surface-status-labels.test.ts tests/factcheck-handoff-shell.contract.test.tsx`
  - Ergebnis: `5` Dateien, `10/10` Tests gruen
- `pnpm -C apps/web exec vitest run tests/account-payment.page.contract.test.tsx tests/admin-pricing-orders.route.test.ts tests/admin-entitlements.route.test.ts tests/membership-activation-support-surfaces.contract.test.tsx tests/payment-checkout-session.contract.test.ts tests/payment-entitlement-after-checkout.contract.test.ts`
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
  - Ergebnis: nicht gruen wegen der bekannten `.next/types/**/*.ts`-Drift mit `TS6053` auf fehlende generierte Dateien; nicht als Slice-Regression gewertet, weil Build, Lint und alle reprasentativen Suiten gruen sind
