# V3 Voxy Render Adapter Contract Noop Audit

Stand: 2026-07-09  
Branch: `pr/v3-voxy-render-adapter-contract-noop-01`

## Scope

Umgesetzt wurde `V3-VOXY-RENDER-ADAPTER-CONTRACT-NOOP-01` als additiver,
provider-neutraler Adapter-Vertrag mit bewusst blockierter Noop-Ausführung auf
den bestehenden V3-Voxy-Readmodels:

- `/create`
- `/account`
- `/admin/review`
- `/dossier/[id]/studio`

Nicht umgesetzt wurden:

- kein Providerlauf
- kein Rendering
- keine Render-Queue
- kein Worker
- keine Medien-Datei
- kein Upload
- keine Kostenbuchung
- keine Credit-Abbuchung
- kein Publish
- kein Scheduling
- keine neue Route
- keine Migration
- keine neue Persistenz

## Inventory

Gezielt geprüft wurden bestehende Render-/Provider-/Asset-/Cost-Pfade in:

- `apps/web/src/features/voxyVideo/contracts.ts`
- `apps/web/src/features/create/voxyRenderProviderHandoffContract.ts`
- `apps/web/src/features/create/voxyRenderPreflightReadinessContract.ts`
- `apps/web/src/features/create/voxyRenderAssetProviderRegistryContract.ts`
- `apps/web/src/features/voxy/voxyAssets.ts`
- `apps/web/public/brand/voxy/manifest.json`

Reale vorhandene Struktur:

- `VoiceProvider`, `AvatarProvider`, `RenderProvider`, `PublishProvider` in
  `apps/web/src/features/voxyVideo/contracts.ts`
- review-first Readmodels für Script, Handoff, Preflight und Registry
- statische Voxy-Raster- und Overlay-Assets im Repo
- Manifest-Hinweise für Voxy-Varianten und Einsatzorte

Bewusst weiterhin nicht vorhanden:

- kein konkreter Render-Adapter
- kein ausführbarer Avatar-Provider
- kein ausführbarer Voice-Provider
- keine Voxy-Render-Queue
- kein Voxy-Render-Worker
- keine Medien-Erzeugung
- keine Provider-Secrets oder Runtime-Wahrheit
- keine render-spezifische Billing-/Debit-Wahrheit

## Neu

Neue Dateien:

- `apps/web/src/features/create/voxyRenderAdapterNoopContract.ts`
- `apps/web/src/features/create/VoxyRenderAdapterNoopPanel.tsx`

Der Contract trennt mindestens:

- `requestPreview`
- `adapterStatus`
- `adapterType`
- `execution`
- `requestedCapabilities`
- `requiredAssets`
- `reviewGateItems`
- `providerGateItems`
- `costGateItems`
- `blockedReasons`
- `configurationNeeds`
- `noopResult`

## Deterministischer Builder

Der Builder leitet den Layer ausschließlich aus bestehenden Readmodels ab:

- Script-Kandidat liefert Sprach- und Segmentkontext
- Handoff liefert Review-Gates und Downstream-Hinweise
- Preflight liefert Provider-, Asset-, Cost- und Language-Gates
- Registry liefert reale Asset-/Provider-Truth aus Repo und Manifest

Statusregeln:

- ohne Script-/Preflight-Wahrheit: `blocked_by_runtime_truth`
- bei offenem Cross-lingual-/RTL-Review: `blocked_by_language_review`
- bei offenen Review-Gates: `blocked_by_missing_review`
- bei fehlenden Pflichtassets: `blocked_by_missing_assets`
- bei fehlender Cost-/Credit-Policy: `blocked_by_missing_cost_policy`
- bei fehlender Provider-Wahrheit: `blocked_by_missing_provider`
- bei reinen Konfigurationslücken: `noop_preview` oder `blocked_by_configuration`
- bei nur formal vorbereitetem Vertrag: `adapter_contract_only`

## Execution Flags

Alle Ausführungsflags bleiben explizit `false`:

- `executionAllowed`
- `providerExecutionAllowed`
- `renderQueueAllowed`
- `mediaFileCreationAllowed`
- `costDebitAllowed`
- `uploadAllowed`
- `publishAllowed`

Zusätzlich bleibt im Noop-Ergebnis immer:

- `rendered: false`
- `providerCalled: false`
- `queueCreated: false`
- `mediaCreated: false`
- `costDebited: false`
- `published: false`

## Surface Wiring

### `/create`

- zeigt additiv `Render-Adapter vorbereiten`
- macht klar: Adapter-Request ist Vorschau, nicht Render-Job

### `/account`

- lokale Resume-Items und runtime-verknüpfte Workbench-Items zeigen denselben
  Noop-Adapter
- bleibt lokal oder resume-fähig, nicht ausführbar

### `/admin/review`

- zeigt additiv `Voxy Render Adapter Summary`
- macht Provider-, Asset-, Cost-, Language- und Review-Lücken als Admin-Wahrheit sichtbar

### `/dossier/[id]/studio`

- zeigt additiv `Render-Adapter im Studio`
- sitzt bewusst neben Handoff, Preflight und Registry

## Warum weiterhin kein Rendering möglich ist

- Provider-Interfaces sind nur Vertragswahrheit
- Registry zeigt reale Assets, aber keine render-sichere Runtime
- Preflight zeigt Anforderungen, aber keine Debit-/Billing-Wahrheit
- Handoff zeigt Adapterpunkte, aber keinen Providerstart
- Adapter-Request-Preview ist kein Render-Job
- `adapter_registered` bleibt ungleich `provider_executed`
- `asset_registered` bleibt ungleich `render_safe`

## Guardrails

- keine Fake-Provider
- keine Fake-Dateien
- keine Fake-Kosten
- keine Fake-Runtime-Wahrheit
- keine Queue- oder Worker-Behauptung
- keine Auto-Publish-/Social-/Scheduling-Folge
- Übersetzung bleibt Lesehilfe und nicht Evidenz

## Tests

- `git diff --check`
- `pnpm -C apps/web exec vitest run tests/voxy-render-adapter-noop.contract.test.tsx tests/voxy-render-asset-provider-registry.contract.test.tsx tests/voxy-render-preflight-readiness.contract.test.tsx tests/voxy-render-provider-handoff.contract.test.tsx tests/voxy-briefing-script-candidate.contract.test.tsx tests/voxy-video-contract.test.ts tests/create-candidate-preview.contract.test.ts tests/account-resume-workbench.contract.test.tsx tests/admin-review.page.test.tsx tests/dossier-studio-server-persistence-ui.test.tsx tests/review-queue.readmodel.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web run build`

## Nächster sinnvoller Slice

- falls später echter Provideranschluss kommt, nur server-only und mit echter
  Secret-, Runtime-, Queue- und Billing-Wahrheit
- solange diese Wahrheit fehlt, bleibt der Renderpfad bewusst ein
  `adapter_contract_only` / `noop` / `blocked_by_configuration` Layer
