# V2-SOCIAL-CONNECTORS-SCHEDULER-01

## Ziel

Die bestehende V1 Social Distribution Queue von Export-/Scheduling-ready auf einen echten,
review-first Scheduler mit optionalen Kanal-Connectoren erweitern, ohne Auto-Publish, ohne
Fake-OAuth und ohne neue Parallelarchitektur.

## Umgesetzter Scope

- neuer Channel-Connection-Contract mit:
  - `channel`
  - `connectionStatus`
  - `authMode`
  - `lastCheckedAt`
  - `scopes`
  - `organizationId`
  - `createdBy`
  - `disabledReason`
- neuer Scheduler-Contract mit:
  - `queueItemId`
  - `scheduledAt`
  - `channel`
  - `status`
  - `approvalRequired`
  - `approvalBy`
  - `error`
  - `retryCount`
- review-first Guardrails:
  - kein Scheduling oder Posting ohne Approval
  - kein Posting fuer `needs_review`, `review_requested`, `blocked` oder `error`
  - kein Connector-Posting ohne `internal_ready` oder `connector_ready`
  - manueller Export bleibt Fallback
- bestehende Social-Distribution-Runtime um persistente `channelConnections` und `scheduler`
  erweitert
- bestehende Studio-Workspace-Route um Scheduler-Mutationen erweitert
- Studio-UI zeigt Connector-Status, Auth-Modus, Disabled-Reason, Scheduler-Status und
  kanalweise naechste Aktion ehrlich an

## Guardrails

- kein Auto-Publish
- kein automatisches Multi-Channel-Publishing
- keine Fake-OAuth-Connectoren
- kein Posting fuer ungepruefte oder geblockte Inhalte
- externe Connectoren nur, wenn Policy und Secrets explizit gesetzt sind

## Geaenderte Dateien

- `features/outputEngine/socialConnectorScheduler.ts`
- `features/outputEngine/socialDistributionRuntime.ts`
- `features/outputEngine/socialDistributionQueueReadModel.ts`
- `features/outputEngine/index.ts`
- `apps/web/src/app/api/dossier/[id]/studio/workspace/route.ts`
- `apps/web/src/components/outputEngine/SocialDistributionPanel.tsx`
- `apps/web/tests/social-channel-connection.contract.test.ts`
- `apps/web/tests/social-scheduler-review-first.contract.test.ts`
- `apps/web/tests/social-no-autopublish.contract.test.ts`
- `apps/web/tests/social-posting-audit.contract.test.ts`
- `apps/web/tests/social-manual-export-fallback.contract.test.ts`
- `docs/E150/OpenTasks.md`

## Validierung

Gruen gelaufen:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/social-channel-connection.contract.test.ts tests/social-scheduler-review-first.contract.test.ts tests/social-no-autopublish.contract.test.ts tests/social-posting-audit.contract.test.ts tests/social-manual-export-fallback.contract.test.ts`
- `pnpm run release:validate:production`

## Ergebnis

Die Social Distribution Queue bleibt dieselbe review-first Queue wie in V1, hat jetzt aber
kontrollierte Kanal-Connector-Readiness und auditierbare Scheduler-Zustaende. Export und
Kopieren bleiben immer als ehrlicher Fallback verfuegbar. Es wurde kein Live-Autopublish und
keine zweite Queue eingefuehrt.
