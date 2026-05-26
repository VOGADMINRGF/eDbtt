# V1-SOCIAL-DISTRIBUTION-QUEUE-01

Stand: 2026-05-25  
Repo: `VOGADMINRGF/edebatte-org`

## Ziel

Die Social Distribution Queue als produktionsnahen V1-Pfad schliessen:

- keine echte externe Veröffentlichung
- keine OAuth-/Connector-Behauptung
- kein Auto-Publish
- keine neue Parallelarchitektur

Der Pfad soll aus bestehenden Dossier-, Anlassraum- und Feed-Signalen reviewpflichtige CI-Ausgaben und eine belastbare Queue für Export und Planung ableiten.

## Umgesetzt

### 1. Gemeinsamer Statusvertrag

Neuer shared Contract:

- `features/outputEngine/socialDistributionStatusContract.ts`

V1-Status:

- `draft_created`
- `asset_generated`
- `needs_review`
- `review_requested`
- `approved`
- `queued`
- `scheduled_ready`
- `exported`
- `copied`
- `blocked`
- `archived`
- `error`

User-facing Labels bleiben bewusst einfach:

- Entwurf erstellt
- CI-Ausgabe vorbereitet
- Prüfung nötig
- Prüfung angefordert
- Freigegeben
- In Queue
- Bereit zur Planung
- Exportiert
- Kopiert
- Blockiert

Kein Label behauptet externe Veröffentlichung.

### 2. Abgeleitete Social Distribution Queue

Neues Readmodel:

- `features/outputEngine/socialDistributionQueueReadModel.ts`

Quellen:

- persistierte `SocialDistributionPost`-Entwürfe aus dem Studio
- Dossier-Update-Vorschläge
- Anlassraum-/Runden-Social-Kandidaten
- Feed-Radar-Runtime-Hinweise

Abgeleitete Origins:

- `dossier_masterpost`
- `newsletter_block`
- `qr_event_hint`
- `short_post`
- `dossier_update`
- `anlassraum_update`
- `feed_radar_update`
- `manual`

Guardrails des Readmodels:

- `noAutoPublish: true`
- `noOauthConnectors: true`
- `noOfficialClaim: true`
- `derivedQueue: true`

### 3. Dossier Studio angeschlossen

Betroffene Flächen:

- `/dossier/[id]/studio`
- `SocialDistributionPanel`

Ergänzt:

- Queue- und nächste-Schritte-Sektion
- JSON-Export-Kopie
- Status-Aktionen für Queue, Planung und Copy
- klarere Studio-Copy für Masterpost, Caption, Carousel, QR-/Print-Text und Newsletter-Block

Neue UI-Aktionen:

- `In Queue setzen`
- `Als Planung bereit markieren`
- `Als kopiert markieren`
- `JSON-Export kopieren`

### 4. Review-/Queue-Fläche produktionsnäher

Bestehende Fläche erweitert:

- `/atlas/social-review`

Zusätzlich zur bisherigen Kandidatenqueue zeigt die Seite jetzt die abgeleitete Social Distribution Queue mit:

- Ursprung
- Zielobjekt
- Kanälen
- Review-Status
- Risiko-Hinweis
- nächster Aktion
- Export-/Planungsfähigkeit

### 5. Runtime-/Route-Readiness

Bestehende Route erweitert:

- `/api/dossier/[id]/studio/workspace`

Neue Statusaktionen:

- `request_review`
- `approve`
- `queue`
- `schedule_ready`
- `mark_exported`
- `mark_copied`
- `block`
- `archive`

Zusätzlicher Create-Parameter:

- `initialStatus`

Damit bleibt der Pfad manuell steuerbar, ohne Live-Posting und ohne neue Queue-Architektur.

### 6. Öffentliche Copy gehärtet

Betroffene Flächen:

- `SocialOutputPreviewPanel`
- `/dossier/[id]`

Die öffentliche Vorschau spricht jetzt ausdrücklich von:

- vorbereiteter Ausgabe
- Kommunikationsentwurf in Prüfung

und behauptet weder automatische Verbreitung noch offizielle Veröffentlichung.

## Geänderte Dateien

- `features/outputEngine/socialDistributionStatusContract.ts`
- `features/outputEngine/socialDistributionQueueReadModel.ts`
- `features/outputEngine/socialDistribution.ts`
- `features/outputEngine/socialDistributionRuntime.ts`
- `features/outputEngine/distributionExport.ts`
- `features/outputEngine/index.ts`
- `apps/web/src/components/outputEngine/SocialDistributionPanel.tsx`
- `apps/web/src/components/share/SocialOutputPreviewPanel.tsx`
- `apps/web/src/app/dossier/[id]/studio/page.tsx`
- `apps/web/src/app/dossier/[id]/ui.tsx`
- `apps/web/src/app/atlas/social-review/page.tsx`
- `apps/web/src/app/atlas/social-review/SocialReviewQueueClient.tsx`
- `apps/web/src/app/api/dossier/[id]/studio/workspace/route.ts`
- `features/region/organizationDashboard.ts`
- `features/reviewQueue.ts`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`

Neue Tests:

- `apps/web/tests/social-distribution-status-contract.test.ts`
- `apps/web/tests/social-distribution-queue-readmodel.contract.test.ts`
- `apps/web/tests/dossier-studio-social-queue.contract.test.tsx`
- `apps/web/tests/social-review-queue-v1.contract.test.tsx`
- `apps/web/tests/social-export-scheduling-ready.contract.test.ts`
- `apps/web/tests/v1-social-distribution-queue.contract.test.ts`

Aktualisierte Bestands-Tests:

- `apps/web/tests/output-engine-social-distribution.test.ts`
- `apps/web/tests/dossier-studio-workspace.route.test.ts`
- `apps/web/tests/organization-dashboard.readmodel.test.ts`
- `apps/web/tests/account-organization-dashboard.page.test.tsx`

## Validierung

Pflichtlauf:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/social-distribution-status-contract.test.ts tests/social-distribution-queue-readmodel.contract.test.ts tests/dossier-studio-social-queue.contract.test.tsx tests/social-review-queue-v1.contract.test.tsx tests/social-export-scheduling-ready.contract.test.ts tests/v1-social-distribution-queue.contract.test.ts`

Zusätzliche Revalidierung:

- `pnpm -C apps/web exec vitest run tests/output-engine-social-distribution.test.ts tests/dossier-studio-workspace.route.test.ts tests/organization-dashboard.readmodel.test.ts tests/account-organization-dashboard.page.test.tsx tests/dossier-output-studio.page.contract.test.ts tests/studio-distribution-panel.contract.test.tsx`

## Ergebnis

Der V1-Slice beweist jetzt den produktionsnahen Social-Pfad:

- Themenstände aus Dossier, Anlassraum und Feed können als reviewpflichtige CI-Ausgaben erscheinen.
- Studio, Review und Dashboard lesen dieselbe ehrliche Statussprache.
- Queue, Export und Planungsbereitschaft sind sichtbar und testbar.
- Keine Fläche behauptet Live-Posting, Auto-Social, Auto-Siegel oder echte Connector-Anbindung.

## Offen außerhalb dieses Slices

- echte externe Social-APIs
- OAuth-/Connector-Anbindung
- automatischer Scheduler
- automatische Bildgenerierung oder tiefere kanalindividuelle Asset-Pipelines
- Social-Live-Posting, Stream-Runtime, Billing- oder Wrapper-Ausbau
