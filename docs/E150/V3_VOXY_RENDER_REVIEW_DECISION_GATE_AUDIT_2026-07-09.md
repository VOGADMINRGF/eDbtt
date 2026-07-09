# V3 Voxy Render Review Decision Gate Audit

Stand: 2026-07-09  
Branch: `pr/v3-voxy-render-review-decision-gate-01`

## Scope

Umgesetzt wurde `V3-VOXY-RENDER-REVIEW-DECISION-GATE-01` als additiver,
review-first Decision-Gate-Layer über den bestehenden V3-Voxy-Readmodels auf:

- `/create`
- `/account`
- `/admin/review`
- `/dossier/[id]/studio`

Nicht umgesetzt wurden:

- kein Rendering
- kein Video
- kein Providerlauf
- keine HTTP- oder Provider-API-Calls
- keine Render-Queue
- keine Medien-Datei
- keine Kostenbuchung
- keine Credit-Abbuchung
- kein Upload
- kein Publish
- kein Social Posting
- kein Scheduling
- keine neue Route
- keine neue Runtime
- keine neue Persistenz

## Inventory

Gezielt geprüft wurden bestehende Entscheidungs- und Review-Wahrheiten in:

- `apps/web/src/app/admin/review/ReviewQueueItemActions.tsx`
- `apps/web/src/app/admin/review/ContentReleaseWorkbenchActions.tsx`
- `features/reviewQueue.ts`
- `apps/web/src/features/create/unifiedReviewQueueWiring.ts`
- `apps/web/src/features/create/voxyBriefingScriptCandidateContract.ts`
- `apps/web/src/features/create/voxyRenderProviderHandoffContract.ts`
- `apps/web/src/features/create/voxyRenderPreflightReadinessContract.ts`
- `apps/web/src/features/create/voxyRenderAssetProviderRegistryContract.ts`
- `apps/web/src/features/create/voxyRenderAdapterNoopContract.ts`

Schon vorhandene echte Review- oder Betriebsentscheidungen:

- Admin-Review-Actions für bestehende Review-Queue-Items
- Content-Release- und Sichtbarkeitsentscheidungen
- Dossier-/Anlassraum-/Participation-Freigaben auf bestehenden Workflows
- Factcheck- und Source-Review-Pfade

Bewusst weiterhin nicht vorhanden für Voxy Render:

- keine persistierte Render-Entscheidung
- keine render-spezifische Approval-Persistenz
- kein Provider-Execution-State
- keine Queue-/Worker-/Media-Runtime
- keine Billing- oder Credit-Write-Wahrheit

Folgerung:

- dieser Slice darf nur `readmodel_only`, `decision_preview`, `needs_persistence`
  oder `blocked_by_runtime_truth` zeigen
- echte Review-Entscheidungen für den Renderpfad können noch nicht gespeichert
  oder ausgeführt werden

## Neu

Neue Dateien:

- `apps/web/src/features/create/voxyRenderReviewDecisionGateContract.ts`
- `apps/web/src/features/create/VoxyRenderReviewDecisionGatePanel.tsx`

Der Contract trennt mindestens:

- `decisionGateId`
- optionale Refs auf Script, Handoff, Preflight, Registry und Adapter
- `decisionStatus`
- `reviewGates`
- `decisionOptions`
- `recommendedDecision`
- `decisionResultPreview`
- `blockedReasons`

## Deterministischer Builder

Der Builder leitet die gemeinsame Review-Entscheidung ausschließlich aus
bestehenden Readmodels ab:

- Script-Kandidat liefert Review-, Risiko-, Sprach- und Quellenhinweise
- Handoff liefert Review-Gates, Provider-Blocker und Downstream-Signale
- Preflight liefert Review-, Asset-, Provider-, Cost- und RTL-Gates
- Registry liefert Asset- und Provider-Truth aus Repo/Manifest
- Adapter liefert explizite Noop-/Blocked-Gates für Provider und Kosten

Abgeleitete Entscheidungsoptionen:

- `Script prüfen`
- `Quellen nachfordern`
- `Factcheck prüfen`
- `Sprache und Untertitel prüfen`
- `Assets vorbereiten`
- `Provider konfigurieren`
- `Cost-Policy klären`
- `Credits und Limits prüfen`
- `Bewusst bei Script-only bleiben`
- `Renderpfad blockieren`

Statusregeln:

- offene Script-Gates → `needs_script_review`
- offene Quellen-/Factcheck-Gates → `needs_source_review` / `needs_factcheck_review`
- cross-lingual oder RTL → `needs_language_review`
- Brand-/Asset-Lücken → `needs_brand_review` / `needs_asset_decision`
- Provider-/Cost-Lücken → `needs_provider_decision` / `needs_cost_decision`
- fehlende Runtime-Wahrheit → `blocked_by_runtime_truth`
- hohe Risiken → `keep_as_script_only`
- fehlende echte Decision-Persistenz in Admin/Studio → `needs_persistence`

## Warum nichts ausgeführt wird

Der Layer zeigt nur Entscheidungsoptionen und hält Ausführung explizit aus:

- `executionAllowed: false`
- `createsRenderJob: false`
- `callsProvider: false`
- `createsMedia: false`
- `debitsCost: false`
- `publishes: false`
- `decisionResultPreview.noRenderAction: true`
- `decisionResultPreview.noProviderExecution: true`
- `decisionResultPreview.noMediaCreation: true`
- `decisionResultPreview.noCostDebit: true`
- `decisionResultPreview.noPublishAction: true`
- `decisionResultPreview.noRuntimeClaim: true`

Damit bleibt klar:

- `review_decision` ist nicht `execution`
- `decision_ready` ist nicht `approved`
- `prepare_provider` ist nicht `provider_executed`
- `prepare_assets` ist nicht `render_safe`
- `define_cost_policy` ist keine Buchung
- `publish_ready` ist nicht `published`

## Surface Wiring

### `/create`

- zeigt additiv `Render-Entscheidung`
- erklärt Beitragenden, warum aus dem Script noch kein Video wird

### `/account`

- lokale Resume-Items und runtime-verknüpfte Arbeitsstände zeigen dieselbe
  Decision-Gate-Lesart
- bleibt browser-/resume-first und ohne Persistenzversprechen

### `/admin/review`

- zeigt additiv `Voxy Render Decision Summary`
- macht konkrete nächste Review-Entscheidungen sichtbar, ohne sie schon
  speichern oder ausführen zu können

### `/dossier/[id]/studio`

- zeigt additiv `Render-Entscheidung im Studio`
- sitzt bewusst zwischen Briefing und den weiteren Render-Layern

## Guardrails

- keine Fake-Provider
- keine Fake-Assets
- keine Fake-Kosten
- keine Fake-Runtime-Wahrheit
- keine Fake-Approval
- keine Queue-, Worker- oder Media-Behauptung
- keine Auto-Publish-/Social-/Scheduling-Folge
- Übersetzung bleibt Lesehilfe und nicht Evidenz

## Tests

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/voxy-render-review-decision-gate.contract.test.tsx tests/create-candidate-preview.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/admin-review.page.test.tsx tests/dossier-studio-server-persistence-ui.test.tsx`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`

## Nächster sinnvoller Slice

- falls echte Render-Review-Entscheidungen später persistiert werden sollen,
  muss ein kanonischer server-only Decision-Write mit Audit, Runtime-Truth,
  Rollenprüfung und klarer Abgrenzung zu Execution gebaut werden
- solange diese Persistenz fehlt, bleibt der neue Layer bewusst ein
  `decision_preview` / `needs_persistence` / `blocked_by_runtime_truth`
  Readmodel
